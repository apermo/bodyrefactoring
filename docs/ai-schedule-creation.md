# AI Guide: Creating Training Schedule JSON Files

This guide provides all necessary information for AI assistants to create valid training schedule JSON files for the Body Refactoring application.

**Repository:** https://github.com/apermo/bodyrefactoring

---

## Quick Start

1. **Filename Format:** `schedule-YYYY-MM-DD.json` (e.g., `schedule-2026-01-15.json`)
2. **Location:** `/trainings/` directory
3. **Structure:** JSON object with `version` and `days` array
4. **Validation:** Run `php validate-schedule.php schedule-YYYY-MM-DD.json` before committing

---

## JSON Structure Overview

```json
{
  "version": 1,
  "days": [
    {
      "id": "mon",
      "dayIndex": 1,
      "name": "MONDAY",
      "theme": "Upper Body Strength",
      "icon": "dumbbell",
      "colorClass": "text-blue-400",
      "bgClass": "bg-blue-500/10",
      "details": [
        // Exercise objects here
      ]
    }
    // ... 6 more days (Tuesday through Sunday)
  ]
}
```

---

## Root Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | integer | **YES** | Schema version (always `1` for current version) |
| `days` | array | **YES** | Array of 7 day objects (Monday through Sunday) |

---

## Day Object Structure

### Required Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | string | **YES** | Unique day identifier (lowercase, underscores only) | `"mon"`, `"tue"`, `"wed"` |
| `dayIndex` | integer | **YES** | Day of week: 0 or 7 = Sunday, 1 = Monday, 2 = Tuesday, ..., 6 = Saturday | `1` |
| `name` | string | **YES** | Display name of the day (uppercase recommended) | `"MONDAY"` |
| `theme` | string | **YES** | Workout theme or focus for the day | `"Upper Body Strength"` |
| `details` | array | **YES** | Array of exercise objects (minimum 1) | `[...]` |

### Optional Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `icon` | string | Lucide icon name (see icon reference below) | `"dumbbell"` |
| `colorClass` | string | Tailwind text color class | `"text-blue-400"` |
| `bgClass` | string | Tailwind background color class | `"bg-blue-500/10"` |

### Valid Day Index Values

- `0` or `7` = Sunday
- `1` = Monday
- `2` = Tuesday
- `3` = Wednesday
- `4` = Thursday
- `5` = Friday
- `6` = Saturday

**Important:** Each dayIndex must be unique within the schedule.

---

## Exercise Types

There are **three types** of exercises:

### 1. Regular Exercise (warmup, main, cool)

Used for: Standard exercises with optional weight tracking and timers.

**Required Fields:**
- `id` (string) - Unique identifier (lowercase, underscores)
- `type` (string) - One of: `"warmup"`, `"main"`, `"cool"`
- `title` (string) - Exercise name
- `desc` (string) - Description or rep scheme

**Optional Fields:**
- `weight` (string) - Default weight value (e.g., `"40"`)
- `defaultUnit` (string) - Unit for weight (e.g., `"KG"`, `"LBS"`, `"STUFE"`)
- `timers` (array) - Array of timer objects

**Example:**
```json
{
  "id": "ex_benchpress",
  "type": "main",
  "title": "Bench Press",
  "desc": "3 x 12 Reps",
  "weight": "40",
  "defaultUnit": "KG"
}
```

### 2. Alternative Exercises

Used for: Multiple exercise options (e.g., outdoor run OR indoor bike).

**Required Fields:**
- `id` (string) - Unique identifier
- `type` (string) - Must be `"alternatives"`
- `alternatives` (array) - Array of at least 2 alternative exercise objects

**Each alternative contains:**
- `title` (string) - Exercise name
- `desc` (string) - Description
- `weight` (string, optional) - Default weight
- `defaultUnit` (string, optional) - Weight unit
- `timers` (array, optional) - Timer objects

**Example:**
```json
{
  "id": "alt_cardio",
  "type": "alternatives",
  "alternatives": [
    {
      "title": "Outdoor Run",
      "desc": "Good weather",
      "timers": [
        { "l": "20 Min", "s": 1200 },
        { "l": "30 Min", "s": 1800 }
      ]
    },
    {
      "title": "Indoor Bike",
      "desc": "Rainy day",
      "timers": [
        { "l": "20 Min", "s": 1200 },
        { "l": "30 Min", "s": 1800 }
      ]
    }
  ]
}
```

### 3. Timer Objects

Used for: Timed exercises (cardio, planks, etc.).

**Required Fields:**
- `l` (string) - Label displayed in UI (e.g., `"5 Min"`, `"30s"`)
- `s` (integer) - Duration in seconds (e.g., `300` for 5 minutes)

**Example:**
```json
{
  "timers": [
    { "l": "5 Min", "s": 300 },
    { "l": "10 Min", "s": 600 }
  ]
}
```

---

## Naming Conventions

### IDs (Required Format)
- **Pattern:** `^[a-z_]+$` (lowercase letters and underscores only)
- **Must be unique** within the schedule
- **Examples:**
  - ✅ `"mon"`, `"tue"`, `"wed"`
  - ✅ `"ex_benchpress"`, `"warmup_row"`
  - ✅ `"alt_cardio"`, `"cool_stretch"`
  - ❌ `"Mon"` (uppercase)
  - ❌ `"ex-benchpress"` (hyphen)
  - ❌ `"ex benchpress"` (space)

### Day Names
- **Recommendation:** Use uppercase for consistency
- **Examples:** `"MONDAY"`, `"DIENSTAG"` (German), etc.

### Themes
- Should be descriptive and motivating
- **Examples:**
  - `"Upper Body Strength"`
  - `"Cardio & Conditioning"`
  - `"Active Recovery"`
  - `"Ganzkörper Kraft"` (German)

---

## Common Lucide Icons

Use these icon names for the `icon` field:

| Icon Name | Use Case |
|-----------|----------|
| `dumbbell` | Strength training days |
| `footprints` | Walking, light cardio |
| `swords` | Intense workouts, boxing |
| `trees` | Outdoor activities |
| `coffee` | Rest days |
| `heart-pulse` | Cardio workouts |
| `flame` | High-intensity days |
| `zap` | Power/explosive training |

Full icon reference: https://lucide.dev/icons/

---

## Tailwind Color Classes

### Text Colors (colorClass)
- `text-blue-400` - Blue (classic workout)
- `text-emerald-400` - Green (recovery, nature)
- `text-red-400` - Red (intense, boxing)
- `text-yellow-400` - Yellow (energy, power)
- `text-purple-400` - Purple (variety)
- `text-cyan-400` - Cyan (cool, fresh)

### Background Colors (bgClass)
- `bg-blue-500/10` - Light blue background
- `bg-emerald-500/10` - Light green background
- `bg-red-500/10` - Light red background
- `bg-yellow-500/10` - Light yellow background
- `bg-purple-500/10` - Light purple background

**Pattern:** Use `/10` for subtle 10% opacity backgrounds.

---

## Complete Example Schedule

```json
{
  "version": 1,
  "days": [
    {
      "id": "mon",
      "dayIndex": 1,
      "name": "MONDAY",
      "theme": "Upper Body Strength",
      "icon": "dumbbell",
      "colorClass": "text-blue-400",
      "bgClass": "bg-blue-500/10",
      "details": [
        {
          "id": "warmup_row",
          "type": "warmup",
          "title": "Rowing Machine",
          "desc": "Warm up",
          "timers": [
            { "l": "5 Min", "s": 300 },
            { "l": "10 Min", "s": 600 }
          ]
        },
        {
          "id": "ex_benchpress",
          "type": "main",
          "title": "Bench Press",
          "desc": "3 x 12 Reps",
          "weight": "40",
          "defaultUnit": "KG"
        },
        {
          "id": "ex_rows",
          "type": "main",
          "title": "Bent-Over Rows",
          "desc": "3 x 12 Reps",
          "weight": "30",
          "defaultUnit": "KG"
        },
        {
          "id": "alt_cardio",
          "type": "alternatives",
          "alternatives": [
            {
              "title": "Outdoor Run",
              "desc": "Good weather",
              "timers": [
                { "l": "20 Min", "s": 1200 }
              ]
            },
            {
              "title": "Indoor Bike",
              "desc": "Rainy day",
              "timers": [
                { "l": "20 Min", "s": 1200 }
              ]
            }
          ]
        },
        {
          "id": "cool_stretch",
          "type": "cool",
          "title": "Full Body Stretch",
          "desc": "Cool down",
          "timers": [
            { "l": "5 Min", "s": 300 }
          ]
        }
      ]
    },
    {
      "id": "tue",
      "dayIndex": 2,
      "name": "TUESDAY",
      "theme": "Active Recovery",
      "icon": "footprints",
      "colorClass": "text-emerald-400",
      "bgClass": "bg-emerald-500/10",
      "details": [
        {
          "id": "ex_walking",
          "type": "main",
          "title": "Walking",
          "desc": "Light activity",
          "timers": [
            { "l": "30 Min", "s": 1800 },
            { "l": "45 Min", "s": 2700 }
          ]
        }
      ]
    },
    {
      "id": "wed",
      "dayIndex": 3,
      "name": "WEDNESDAY",
      "theme": "Lower Body Strength",
      "icon": "dumbbell",
      "colorClass": "text-purple-400",
      "bgClass": "bg-purple-500/10",
      "details": [
        {
          "id": "ex_squats",
          "type": "main",
          "title": "Squats",
          "desc": "3 x 10 Reps",
          "weight": "60",
          "defaultUnit": "KG"
        }
      ]
    },
    {
      "id": "thu",
      "dayIndex": 4,
      "name": "THURSDAY",
      "theme": "Rest Day",
      "icon": "coffee",
      "colorClass": "text-slate-400",
      "bgClass": "bg-slate-500/10",
      "details": [
        {
          "id": "rest_day",
          "type": "cool",
          "title": "Rest & Recovery",
          "desc": "Take it easy today"
        }
      ]
    },
    {
      "id": "fri",
      "dayIndex": 5,
      "name": "FRIDAY",
      "theme": "Cardio Blast",
      "icon": "flame",
      "colorClass": "text-red-400",
      "bgClass": "bg-red-500/10",
      "details": [
        {
          "id": "ex_hiit",
          "type": "main",
          "title": "HIIT Training",
          "desc": "High intensity intervals",
          "timers": [
            { "l": "20 Min", "s": 1200 },
            { "l": "30 Min", "s": 1800 }
          ]
        }
      ]
    },
    {
      "id": "sat",
      "dayIndex": 6,
      "name": "SATURDAY",
      "theme": "Outdoor Activity",
      "icon": "trees",
      "colorClass": "text-emerald-400",
      "bgClass": "bg-emerald-500/10",
      "details": [
        {
          "id": "ex_hiking",
          "type": "main",
          "title": "Hiking or Nature Walk",
          "desc": "Enjoy the outdoors",
          "timers": [
            { "l": "60 Min", "s": 3600 },
            { "l": "90 Min", "s": 5400 }
          ]
        }
      ]
    },
    {
      "id": "sun",
      "dayIndex": 0,
      "name": "SUNDAY",
      "theme": "Rest & Recovery",
      "icon": "coffee",
      "colorClass": "text-slate-400",
      "bgClass": "bg-slate-500/10",
      "details": [
        {
          "id": "rest_sunday",
          "type": "cool",
          "title": "Complete Rest",
          "desc": "Recovery day"
        }
      ]
    }
  ]
}
```

---

## Validation Rules

### Must Have
- ✅ Root object with `version: 1` and `days` array
- ✅ Exactly 7 day objects (one for each day of the week)
- ✅ Each day has unique `id` and `dayIndex`
- ✅ All IDs use only lowercase letters and underscores
- ✅ All required fields present
- ✅ At least 1 exercise per day
- ✅ Timer seconds are integers (not strings)
- ✅ Alternative exercises have at least 2 options

### Must Not Have
- ❌ Duplicate IDs within the schedule
- ❌ Duplicate dayIndex values
- ❌ Empty details arrays
- ❌ dayIndex outside 0-7 range
- ❌ Invalid exercise types (only warmup, main, cool, alternatives allowed)
- ❌ Trailing commas in JSON
- ❌ Comments in JSON (not valid JSON)

---

## Validation Command

After creating the schedule file, validate it:

```bash
cd trainings/
php validate-schedule.php schedule-2026-01-15.json
```

**Expected output for valid file:**
```
✓ schedule-2026-01-15.json: VALID

Summary:
  Total files: 1
  Valid: 1
  Invalid: 0
```

---

## Common Validation Errors

### Error: "Missing required field 'version' at root level"
**Fix:** Add `"version": 1` at the root level of the JSON object.

### Error: "Root element must be an object"
**Fix:** Wrap the days array in an object: `{"version": 1, "days": [...]}`

### Error: "'id' must contain only lowercase letters and underscores"
**Fix:** Change IDs like `"Mon"` to `"mon"`, or `"ex-bench"` to `"ex_bench"`

### Error: "Duplicate day id 'mon'"
**Fix:** Ensure all day IDs are unique (mon, tue, wed, thu, fri, sat, sun)

### Error: "'dayIndex' must be between 0 and 7"
**Fix:** Use 0 or 7 for Sunday, 1 for Monday, 2 for Tuesday, etc.

### Error: "Duplicate dayIndex '1'"
**Fix:** Ensure each day has a unique dayIndex (0-6 or 7 for Sunday)

### Error: "'timers[0].s' must be an integer"
**Fix:** Use `"s": 300` not `"s": "300"` (number, not string)

### Error: "Must have at least 2 alternatives"
**Fix:** Alternative exercises need minimum 2 options

---

## Template Files

### Quick Template
Use the existing template as a starting point:
```bash
cp trainings/template-schedule.json trainings/schedule-2026-01-15.json
```

### JSON Schema
For IDE integration (VS Code, PhpStorm):
- **File:** `trainings/schema-schedule-v1.json`
- **Usage:** Configure your IDE to use this schema for validation

---

## Best Practices

### 1. Exercise Progression
- Start with realistic weights
- User can increase weights in the app
- Weights automatically carry forward to future workouts

### 2. Balance
- Mix strength and cardio throughout the week
- Include rest or active recovery days
- Don't program every day as high-intensity

### 3. Alternatives
- Use alternatives for weather-dependent exercises
- Provide equipment-free alternatives
- Consider space constraints (home vs. gym)

### 4. Timers
- Provide multiple timer options (e.g., 5 Min, 10 Min, 15 Min)
- Use realistic durations based on exercise type
- Format labels clearly: `"5 Min"`, `"30s"`, `"1:30"`

### 5. Descriptions
- Keep descriptions concise
- Include rep schemes: `"3 x 12 Reps"`
- Mention rest periods if important: `"4 sets x 8 reps (2 min rest)"`

### 6. Day Themes
- Make themes motivating and clear
- Use consistent theme structure across weeks
- Examples:
  - `"Push Day"`, `"Pull Day"`, `"Leg Day"`
  - `"Upper Body"`, `"Lower Body"`, `"Full Body"`
  - `"Strength"`, `"Cardio"`, `"Recovery"`

---

## Schedule Planning Guidelines

### Weekly Structure Example
- **Monday:** Upper body strength
- **Tuesday:** Active recovery / light cardio
- **Wednesday:** Lower body strength
- **Thursday:** Rest or mobility
- **Friday:** High-intensity / cardio
- **Saturday:** Fun activity / sports
- **Sunday:** Complete rest

### Progressive Overload
- The app handles weight progression automatically
- Focus on creating a solid base schedule
- User can adjust weights during training
- Changes persist to future workouts

### Recovery Integration
- Include at least 1-2 rest days per week
- Use active recovery days strategically
- Don't stack high-intensity days back-to-back
- Recovery days can include: walking, yoga, stretching, mobility work

---

## Language Considerations

The app supports any language, but maintain consistency:

### English Example
```json
{
  "name": "MONDAY",
  "theme": "Upper Body Strength",
  "title": "Bench Press",
  "desc": "3 x 12 Reps"
}
```

### German Example
```json
{
  "name": "MONTAG",
  "theme": "Oberkörper Kraft",
  "title": "Bankdrücken",
  "desc": "3 x 12 Wiederholungen"
}
```

**Recommendation:** Choose one language and stick with it throughout the schedule.

---

## FAQ

**Q: Can I have fewer than 7 days?**
A: No, you must define all 7 days. Use rest days for days without training.

**Q: Can I add custom fields?**
A: Yes, but they won't be validated or used by the app. Stick to documented fields.

**Q: What happens if I use dayIndex 7 for Sunday?**
A: It's valid! Both 0 and 7 represent Sunday. The app handles both.

**Q: Can I reuse exercise IDs across different days?**
A: IDs must be unique within the entire schedule. Use prefixes like `mon_ex_`, `tue_ex_` if needed.

**Q: How many exercises should I include per day?**
A: Minimum 1, but 3-8 exercises per day is typical for balanced workouts.

**Q: Can I change an existing schedule?**
A: Yes, but create a new file with a new date. The app loads the most recent schedule for any given date.

---

## Deployment

After creating and validating the schedule:

1. **Validate:**
   ```bash
   php validate-schedule.php schedule-2026-01-15.json
   ```

2. **Commit:**
   ```bash
   git add trainings/schedule-2026-01-15.json
   git commit -m "feat: add training schedule for 2026-01-15"
   ```

3. **Push:**
   ```bash
   git push origin main
   ```

4. **Automatic Deployment:**
   - GitHub webhook triggers deployment
   - New schedule becomes active automatically
   - No manual intervention needed

---

## Support

- **Validation Documentation:** `docs/schedule-validation.md`
- **Main README:** `README.md`
- **JSON Schema:** `trainings/schema-schedule-v1.json`
- **Template:** `trainings/template-schedule.json`
- **Repository:** https://github.com/apermo/bodyrefactoring

---

## Summary Checklist for AI

When creating a new schedule, ensure:

- [ ] Filename: `schedule-YYYY-MM-DD.json`
- [ ] Root object with `version: 1` and `days: []`
- [ ] 7 day objects (Monday through Sunday)
- [ ] All IDs lowercase with underscores only
- [ ] Unique IDs and dayIndex values
- [ ] Each day has at least 1 exercise
- [ ] Timer seconds are integers (not strings)
- [ ] Alternatives have at least 2 options
- [ ] No trailing commas in JSON
- [ ] Valid JSON syntax
- [ ] Validated with `php validate-schedule.php`
- [ ] Balanced workout distribution
- [ ] Realistic weights and timers
- [ ] Clear descriptions and themes

**Now you're ready to create professional training schedules! 🏋️‍♂️**

