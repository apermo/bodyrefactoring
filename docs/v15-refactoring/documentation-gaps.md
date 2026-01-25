# Documentation Gap Analysis

> Comparison between implemented features and existing documentation

## Summary

The documentation is significantly outdated. Major v15 features (database storage, API, dateCondition) are completely undocumented, while the docs still focus on the legacy JSON file workflow.

---

## Implemented but NOT Documented

### 1. dateCondition System (v3)

**Status**: Fully implemented, zero documentation

The entire conditional exercise visibility system is undocumented:
- `once` - one-time date match
- `weekOfMonth` - weeks 1-5 within month
- `weekParity` - odd/even ISO weeks
- `dayOfMonth` - day of month (including negative for end)
- `nthWeekday` - nth occurrence of weekday
- `months` - restrict to specific months
- `weekInterval` - every N weeks from reference

**Impact**: Users cannot create schedules with conditional exercises.

### 2. Schema Version 3

**Current docs**: Only mention v1 and v2
**Reality**: v3 is current with full dateCondition support

Missing documentation:
- `dateCondition` field on all exercise types
- `dateDescription` field for UI display
- Combined condition patterns

### 3. Database Storage (v15)

**Current docs**: Focus entirely on JSON file workflow
**Reality**: MySQL database is primary storage

Undocumented:
- Database schema (schedule_templates, schedule_days, schedule_exercises)
- Template-based scheduling
- start_date/end_date for template validity
- is_active flag
- sort_order for exercise ordering

### 4. Per-Day API Endpoint

**Implemented**: `GET /api/v1/schedules/day?date=YYYY-MM-DD`

Undocumented:
- Response format
- Status codes (200, 204, 400, 404, 503)
- Automatic fallback to JSON files
- Cache behavior

### 5. Date Overrides

**Implemented**: Full override system in database

Undocumented:
- Three override types: skip, replace, add
- date_overrides table structure
- Override priority over templates
- hasOverride and overrideNote in responses

### 6. Import API Endpoints

**Implemented**:
- `POST /api/v1/schedules/preview`
- `POST /api/v1/schedules/import`

Undocumented:
- Request/response formats
- Validation behavior
- Update vs create logic
- Error responses

### 7. Schedule Editor Database Integration

**Implemented**: "Deploy to Database" button

Undocumented:
- Direct database deployment workflow
- Preview before import
- Update existing template option

### 8. ScheduleService Backend

**Implemented**: Full PHP service class

Undocumented:
- Template resolution logic
- Exercise formatting
- dateCondition evaluation on backend
- Override merging behavior

### 9. Authentication for Editor/API

**Implemented**: Admin-only access for write operations

Undocumented:
- Admin vs user role separation
- API authentication requirements
- Editor access control

---

## Documented but NOT Implemented / Outdated

### 1. Directory Path

**Docs say**: `trainings/` directory
**Reality**: `schedules/` directory

All file path references in documentation are wrong.

### 2. dayIndex Values

**Docs say**: 0 or 7 for Sunday (both valid)
**Reality**: Database only supports 0-6; dayIndex 7 is only for legacy JSON compatibility

### 3. Alternatives Storage

**Docs say**: Each alternative has individual fields (title, desc, weight, etc.)
**Reality**: Database stores entire alternatives array in `timers` JSON field

### 4. Primary Workflow

**Docs say**: JSON file + Git deployment is primary workflow
**Reality**: Database storage with API is primary; JSON is fallback

### 5. Schema Version

**Docs say**: `version: 1` is current
**Reality**: `version: 3` is current; v1 and v2 are legacy

### 6. Editor Export Button

**Docs say**: "Export & Deploy via Git" button
**Reality**: Now "Deploy to Database" as primary action

### 7. Exercise Requirements

**Docs say**: All exercises need `title` and `desc`
**Reality**: `alternatives` type stores data differently

### 8. Validation Script Location

**Docs say**: Run from `trainings/` directory
**Reality**: Should be `schedules/` directory

---

## Documentation Files Requiring Updates

### High Priority

| File | Issue |
|------|-------|
| `docs/schedule-validation.md` | Wrong directory, outdated schema version, missing v3 features |
| `docs/schedule-editor.md` | Git workflow focus, missing database features |
| `docs/ai-schedule-creation.md` | Missing dateCondition, outdated examples |

### Medium Priority

| File | Issue |
|------|-------|
| `docs/architecture.md` | Missing API documentation, dateCondition logic |
| `CLAUDE.md` | Has some v15 info but incomplete API docs |

### New Documentation Needed

| Topic | Priority |
|-------|----------|
| API Reference | High |
| dateCondition Guide | High |
| Database Schema | Medium |
| Date Overrides | Medium |
| Migration from JSON to Database | Low |

---

## Recommendations

### 1. Create API Reference

Document all API endpoints with request/response examples.

### 2. Update Schedule Editor Docs

Focus on database workflow as primary, Git as optional export.

### 3. Create dateCondition Guide

Comprehensive guide with all patterns and examples.

### 4. Deprecate or Update JSON Workflow Docs

Either mark as legacy or integrate with database workflow.

### 5. Update Directory Paths

Global search-replace `trainings/` → `schedules/`.

### 6. Version the Documentation

Add version badges indicating which app version each doc applies to.
