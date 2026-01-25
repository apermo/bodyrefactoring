# Schedule System Specifications

> Current state as of v15.0.0 - document for rethinking the schedule logic

## Overview

The schedule system manages training schedules with daily workout configurations. It supports:
- Weekly recurring schedules stored as templates
- Date-based filtering of exercises (dateCondition)
- One-time date overrides (skip, replace, add)
- Dual-mode access: Database API (primary) + JSON files (fallback)

---

## Data Structures

### Schedule Template

A template represents a weekly training program with a start date.

```
Template
├── id: int (auto-increment)
├── name: string (e.g., "Schedule 2026-01-01")
├── start_date: date (authoritative identifier)
├── end_date: date | null (null = ongoing)
├── is_active: boolean
└── days[7]: Day configurations
```

### Day Configuration

Each day within a template defines a workout.

```
Day
├── day_index: 0-6 (0=Sunday, 6=Saturday)
├── id: string (e.g., "mon", "tue", "rest_day")
├── name: string (e.g., "MONTAG", "REST")
├── theme: string | null (e.g., "Upper Body", "Cardio")
├── icon: string | null (lucide icon name)
├── color_class: string | null (Tailwind class)
├── bg_class: string | null (Tailwind class)
└── exercises[]: Exercise list
```

### Exercise

Individual exercise within a day.

```
Exercise
├── id: string (e.g., "pushups_main", "warmup_stretch")
├── type: enum (warmup, main, cool, custom, alternatives)
├── title: string
├── description: string | null
├── weight: string | null (e.g., "12kg", "bodyweight")
├── default_unit: string | null (e.g., "kg", "lbs")
├── timers: Timer[] | null
├── rep_counter: RepCounter | null
├── custom_label: string | null (required if type=custom)
├── date_condition: DateCondition | null
├── date_description: string | null (UI display text)
├── optional: boolean (v2+, skippable exercise)
├── hide_on: string[] | null (v2+, hide in specific modes)
└── alternatives: Exercise[] | null (only if type=alternatives)
```

### Timer

```
Timer
├── label: string (short label, e.g., "Hold")
└── seconds: int
```

### RepCounter

```
RepCounter
├── sets: int
├── reps: int
├── rest_seconds: int
├── delay_milliseconds: int
└── bilateral: boolean | null (v2+, alternating L/R)
```

---

## DateCondition System (v3)

Conditional exercise visibility based on date patterns.

### Supported Patterns

| Pattern | Type | Description |
|---------|------|-------------|
| `once` | string (date) | Exact date match |
| `weekOfMonth` | int[] | Weeks 1-5 within month |
| `weekParity` | "odd" \| "even" | ISO week number parity |
| `dayOfMonth` | int (-31 to 31) | Day of month (negative = from end) |
| `nthWeekday` | object | Nth occurrence of weekday in month |
| `months` | int[] | Restrict to specific months (1-12) |
| `weekInterval` | object | Every N weeks from reference date |

### Pattern Details

#### once
```json
{ "once": "2026-03-15" }
```
Show only on exact date. For one-time tasks or events.

#### weekOfMonth
```json
{ "weekOfMonth": [1, 3] }
```
Week calculated as: `ceil(day_of_month / 7)`
- Days 1-7 = Week 1
- Days 8-14 = Week 2
- Days 15-21 = Week 3
- Days 22-28 = Week 4
- Days 29-31 = Week 5

#### weekParity
```json
{ "weekParity": "odd" }
```
Uses ISO week number. Week 1 is the first week with Thursday.

#### dayOfMonth
```json
{ "dayOfMonth": 15 }    // 15th of each month
{ "dayOfMonth": -1 }    // Last day of month
{ "dayOfMonth": -2 }    // 2nd-to-last day
```
Positive: 1-31 from start. Negative: -1 to -31 from end.

#### nthWeekday
```json
{ "nthWeekday": { "nth": 1, "weekday": 1 } }   // 1st Monday
{ "nthWeekday": { "nth": -1, "weekday": 5 } }  // Last Friday
```
- `nth`: 1-5 or -1 (last)
- `weekday`: 0=Sunday, 1=Monday, ..., 6=Saturday

#### months
```json
{ "months": [1, 4, 7, 10] }  // Quarterly
```
When used alone: shows on ALL days in those months.
When combined: acts as additional filter.

#### weekInterval
```json
{ "weekInterval": { "every": 3, "from": "2026-01-05" } }
```
Every N weeks starting from reference date.

### Combination Rules

- `months` is checked first (filter)
- Then ONE of the other conditions
- All specified conditions must match (AND logic)
- Empty/missing dateCondition = always show

### Examples

```json
// Monthly task on 1st
{ "dayOfMonth": 1 }

// Quarterly review on first Monday
{ "months": [1, 4, 7, 10], "nthWeekday": { "nth": 1, "weekday": 1 } }

// Every 4 weeks
{ "weekInterval": { "every": 4, "from": "2026-01-01" } }

// Only odd weeks
{ "weekParity": "odd" }

// Last day of quarter
{ "months": [3, 6, 9, 12], "dayOfMonth": -1 }
```

---

## Date Overrides

One-time modifications to specific dates.

### Override Types

| Type | Effect | Data Required |
|------|--------|---------------|
| `skip` | No workout on date | note (optional) |
| `replace` | Replace entire day | day_config (full day JSON) |
| `add` | Append exercises | exercises (exercise array) |

### Priority

1. Check date_overrides table first
2. If `skip` → return null (no workout)
3. If `replace` → return override config
4. If `add` → merge with template day
5. Fall back to template lookup

### Database Structure

```sql
date_overrides
├── target_date: date (UNIQUE)
├── override_type: enum (skip, replace, add)
├── day_config: JSON | null
├── exercises: JSON | null
└── note: string | null
```

---

## Template Resolution

How the system finds the correct schedule for a date:

```
1. Check date_overrides for target_date
   └── If found: apply override logic

2. Find active template
   └── WHERE is_active = true
       AND start_date <= target_date
       AND (end_date IS NULL OR end_date >= target_date)
   └── ORDER BY start_date DESC LIMIT 1

3. Calculate day_index from target_date
   └── PHP: DateTime->format('w') → 0=Sun, 6=Sat

4. Fetch day configuration by (template_id, day_index)

5. Fetch exercises for day, ordered by sort_order
```

---

## API Endpoints

### GET /api/v1/schedules/day

Fetch schedule for specific date.

**Query**: `?date=YYYY-MM-DD`

**Responses**:
- `200`: Schedule found
- `204`: Day is skipped (no body)
- `400`: Invalid date format
- `404`: No schedule for date
- `503`: Database unavailable

**Response Body (200)**:
```json
{
  "date": "2026-01-24",
  "dayIndex": 5,
  "id": "fri",
  "name": "FREITAG",
  "theme": "Full Body",
  "icon": "dumbbell",
  "colorClass": "text-blue-400",
  "bgClass": "bg-blue-500/10",
  "details": [...],
  "hasOverride": false,
  "templateName": "Schedule 2026-01-01"
}
```

### POST /api/v1/schedules/preview

Preview import without applying.

**Auth**: Admin required

**Body**:
```json
{
  "schedule": { ... },
  "startDate": "2026-02-01"
}
```

### POST /api/v1/schedules/import

Import schedule to database.

**Auth**: Admin required

**Body**:
```json
{
  "schedule": { ... },
  "startDate": "2026-02-01",
  "update": false
}
```

---

## Exercise Types

| Type | Description | Special Requirements |
|------|-------------|---------------------|
| `warmup` | Pre-workout exercises | — |
| `main` | Primary exercises | — |
| `cool` | Cool-down exercises | — |
| `custom` | Custom type | Requires `customLabel` |
| `alternatives` | Choice of exercises | Requires `alternatives[]` with 2+ options |

### Alternatives Handling

The `alternatives` type stores multiple exercise options. User picks one.

**Storage**: Entire alternatives array stored in `timers` JSON field.

**Limitation**: Cannot combine with optional/hideOn.

---

## Schema Versions

| Version | Key Features |
|---------|--------------|
| v1 | Basic: warmup, main, cool types. No dateCondition. |
| v2 | Added: custom type, optional, hideOn, bilateral |
| v3 | Added: Full dateCondition system |

### Version Compatibility

- v1/v2 schedules have no date filtering
- dateCondition field ignored if not understood
- Frontend applies filtering, not backend

---

## Storage Modes

### Primary: MySQL Database

- Templates, days, exercises in relational tables
- Date overrides for one-time changes
- API access via SchedulesController

### Fallback: JSON Files

- Located in `/schedules/`
- Named `schedule-YYYY-MM-DD.json`
- Used when database unavailable (503)
- Frontend auto-switches to legacy mode

### Special Schedules

- `schedule-recovery.json` - Recovery/light workout
- `schedule-sick.json` - Sick day routine
- Accessed via `fetchSpecialSchedule(type)`

---

## Current Limitations

1. **No backend filtering**: dateCondition sent to frontend, not filtered on API
2. **Full reimport required**: No partial template updates
3. **Single override per date**: Can't stack multiple overrides
4. **No versioning**: No history of template changes
5. **Alternatives isolated**: Can't add dateCondition to alternative options
6. **7-day fixed**: Templates must have exactly 7 days

---

## Open Questions for Rethinking

1. Should dateCondition filtering happen on backend or frontend?
2. Do we need 7 fixed days, or flexible day count?
3. Should overrides support stacking (multiple add overrides)?
4. Is the alternatives type still needed, or replace with different pattern?
5. Should templates have explicit end dates, or infer from next template?
6. Do we need exercise-level versioning for progressive overload tracking?
7. Should special schedules (recovery, sick) be in database?
