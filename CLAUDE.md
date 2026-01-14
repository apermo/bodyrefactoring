# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Body Refactoring is a personal, gamified progressive web app (PWA) for fitness tracking and habit building. It uses LocalStorage for data persistence and a PHP backend for serving dynamic training schedules.

**Key characteristics:**
- German UI, English codebase
- iOS Safari is the primary target
- Privacy-first (no external tracking, all data in localStorage)
- JSON-based workout schedules with version control

## Essential Commands

### Schedule Validation (run before committing schedule changes)
```bash
cd trainings/
php validate-schedule.php                    # Validates all schedules
php validate-schedule.php schedule-2026-01-15.json  # Validate specific file
```

### Git Hooks Setup (enables commit message validation)
```bash
bash .githooks/setup.sh
```

### Local GitHub Actions Testing (optional, requires act)
```bash
bash .github/test-workflows.sh  # Helper script
act pull_request --dryrun       # Test PR workflows
```

## Architecture

### Module System (v13.0+)

The app uses ES6 modules in `/assets/js/modules/`:

- **constants.js** - All constants, enums, config (STORAGE_KEYS, CONFIG, APP_STATES, TIMER_STATES)
- **state-machine.js** - Generic state machine with transition validation
- **storage-service.js** - Base localStorage abstraction
- **domain-storage-service.js** - Domain-specific storage methods (shields, exercises, streaks)
- **state-manager.js** - Centralized reactive state management
- **utils.js** - Common utilities (dates, formatting, debounce)
- **speech-service.js** - Text-to-speech with German voice selection
- **schedule-service.js** - Schedule fetching and caching
- **streak-calculator-service.js** - Streak calculation logic
- **timer-coordinator.js** - Timer orchestration
- **app-state-machine.js**, **timer-state-machine.js**, **modal-state-machine.js** - State machines

Main application logic is in `/assets/js/app.js` (being refactored incrementally).

### Schedule Files

Located in `/trainings/`:
- Named `schedule-YYYY-MM-DD.json`
- App loads the most recent schedule ≤ current date
- Schema: `schema-schedule-v1.json`, Template: `template-schedule.json`

### Cache Busting

PHP uses `filemtime()` for versioned asset URLs: `asset.js?v=<timestamp>`

## Coding Standards

### Language
- **Code/comments/commits**: English
- **UI text**: German

### Formatting (WordPress-style)
- Tabs for indentation (not spaces)
- PHP: DocBlocks required, braces always, lowercase built-in functions
- JS: camelCase, const/let only, strict equality, JSDoc for functions
- CSS: One selector per line, alphabetical properties

### Code Reuse
Before creating new functions:
1. Search the codebase for similar functionality
2. Check if existing function can be extended
3. Use existing services (StorageService, DomainStorageService, etc.)

### Comments
- Explain WHY, not WHAT
- PHPDoc/JSDoc required for all functions
- Avoid obvious comments, commented-out code, tutorial-style explanations

## Git Conventions

### Commit Format
```
<type>(<scope>): <subject>

<body>
```

**Types**: feat, fix, docs, style, refactor, test, chore, perf

**Character limits (enforced by git hooks):**
- Subject: 50 chars recommended, 72 max hard limit
- Body: 72 chars per line max

### CHANGELOG.md
- Update `[Unreleased]` section for every change
- Sections: Added, Changed, Deprecated, Removed, Fixed, Security
- **Never list bugs in "Fixed" if introduced and fixed in the same version**

## Key Patterns

### LocalStorage Keys
All keys prefixed: `body_refactoring_v1_`, `body_refactoring_note_`, etc.
Use `DomainStorageService` for domain operations.

### Progressive Overload
Weight increases apply to future workouts only. Historical data unchanged.

### State Machines
App uses explicit state machines for app lifecycle, timers, modals. See `/assets/js/modules/*-state-machine.js`.

## File Locations

- Main app: `index.php`
- Styles: `assets/css/styles.css`
- JavaScript: `assets/js/app.js`, `assets/js/modules/`
- Training schedules: `trainings/*.json`
- Schedule editor: `schedule-editor.php`
- Documentation: `docs/`

## Testing

- Test on iOS Safari (primary target)
- Test as installed PWA (Add to Home Screen)
- Validate JSON schedules before committing