# Schedule Validation Quick Reference

## Commands

All commands should be run from the `trainings/` directory:

```bash
cd trainings/
```

### Validate all schedules (automatic scan)
```bash
php validate-schedule.php
```
This automatically scans the current directory for all schedule files matching the pattern `schedule-YYYY-MM-DD.json` and validates them.

### Validate a single schedule
```bash
php validate-schedule.php schedule-2026-01-15.json
```

### Validate multiple schedules
```bash
# Multiple files
php validate-schedule.php schedule-2026-01-15.json schedule-2026-02-01.json

# Or use wildcards
php validate-schedule.php schedule-*.json
```

### Create a new schedule
```bash
# 1. Copy template
cp template-schedule.json schedule-2026-01-15.json

# 2. Edit the file with your workout plan

# 3. Validate
php validate-schedule.php schedule-2026-01-15.json

# 4. Commit and push (from repo root)
cd ..
git add trainings/schedule-2026-01-15.json
git commit -m "feat: add training schedule for 2026-01-15"
git push
```

## Common Validation Errors

### Filename Issues
- **Error**: `Filename must match pattern: schedule-YYYY-MM-DD.json`
- **Fix**: Rename file to match the pattern, e.g., `schedule-2026-01-15.json`

### JSON Syntax
- **Error**: `Invalid JSON: Syntax error`
- **Fix**: Check for missing commas, brackets, or quotes. Use a JSON validator.

### Missing Required Fields
- **Error**: `Day 0: Missing required field 'theme'`
- **Fix**: Add the missing field to the day object

### Invalid IDs
- **Error**: `Exercise 0: 'id' must contain only lowercase letters and underscores`
- **Fix**: Change ID from `ex-1` to `ex_1` or from `Ex1` to `ex1`

### Duplicate IDs
- **Error**: `Duplicate exercise id 'ex_benchpress'`
- **Fix**: Make each ID unique within the schedule

### Invalid Exercise Type
- **Error**: `'type' must be one of: warmup, main, cool, alternatives`
- **Fix**: Use only valid exercise types

### Invalid Day Index
- **Error**: `'dayIndex' must be between 0 and 7`
- **Fix**: Use 0 or 7 for Sunday, 1 for Monday, ..., 6 for Saturday

### Timer Issues
- **Error**: `Timer 0: 's' must be a positive integer`
- **Fix**: Ensure timer seconds is a number, not a string: `"s": 300` not `"s": "300"`

### Alternatives
- **Error**: `'alternatives' must contain at least 2 options`
- **Fix**: Add at least 2 alternative exercises in the alternatives array

## Validation Checklist

Before committing a new schedule:

- [ ] Filename matches `schedule-YYYY-MM-DD.json` pattern
- [ ] Valid JSON syntax (no trailing commas, all brackets closed)
- [ ] Root object has `version: 1` and `days` array
- [ ] All required fields present in each day (id, dayIndex, name, theme, details)
- [ ] All IDs use lowercase letters and underscores only
- [ ] No duplicate IDs within the schedule
- [ ] dayIndex is 0-7 (0 or 7 = Sunday)
- [ ] Exercise types are: warmup, main, cool, or alternatives
- [ ] Alternatives have at least 2 options
- [ ] Timer seconds are integers, not strings
- [ ] All exercises have title and desc (except alternatives group)
- [ ] Run validator and get ✓ VALID result

## Field Reference

### Root Object
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | integer | Yes | Schema version number (currently 1) |
| `days` | array | Yes | Array of training days (see below) |

### Day Object
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier (lowercase, underscores only) |
| `dayIndex` | integer | Yes | Day of week: 0 or 7 = Sunday, 1 = Monday, ..., 6 = Saturday |
| `name` | string | Yes | Display name of the day |
| `theme` | string | Yes | Workout theme or focus |
| `icon` | string | No | Lucide icon name (e.g., "dumbbell", "footprints") |
| `colorClass` | string | No | Tailwind text color class |
| `bgClass` | string | No | Tailwind background color class |
| `details` | array | Yes | Array of exercises (see below) |

### Regular Exercise Object
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier (lowercase, underscores only) |
| `type` | string | Yes | Exercise type: "warmup", "main", or "cool" |
| `title` | string | Yes | Exercise name |
| `desc` | string | Yes | Description or rep scheme |
| `weight` | string | No | Default weight value |
| `defaultUnit` | string | No | Weight unit (KG, LBS, STUFE, etc.) |
| `timers` | array | No | Array of timer options (see below) |

### Alternatives Exercise Object
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier |
| `type` | string | Yes | Must be "alternatives" |
| `alternatives` | array | Yes | Array of alternative exercises (min. 2) |

Each alternative contains: `title`, `desc`, and optionally `weight`, `defaultUnit`, `timers`

### Timer Object
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `l` | string | Yes | Timer label (e.g., "5 Min") |
| `s` | integer | Yes | Duration in seconds |

## JSON Schema

For IDE integration, point your JSON schema validator to:
```
trainings/schema-schedule-v1.json
```

This enables real-time validation in editors like VS Code, PhpStorm, etc.

## Security Note

**The validation script can only be run from the command line.** For security reasons, web access to `validate-schedule.php` is blocked. If accessed via a browser, you will receive a 403 Forbidden error with usage instructions.

This ensures that the validation tool cannot be exploited or abused through web requests.

## Need Help?

- Check the template: `trainings/template-schedule.json`
- Review existing schedule: `trainings/schedule-2025-12-22.json`
- Read full documentation: `README.md` (Configuration section)

