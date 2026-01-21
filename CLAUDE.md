# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical Rules

### Git Operations
**NEVER run git commands (add, commit, push) without explicit user permission.**

After making code changes:
1. Explain what changed
2. Ask: "Ready to commit?"
3. WAIT for user to say "yes", "commit", or "push"
4. Only then run git commands

**Understanding user commands:**
- **"commit"**: Only `git add` and `git commit`, then STOP (don't mention pushing)
- **"push"** or **"commit and push"**: Full workflow including push
- When you ask "Ready to commit?" and user says "yes": commit AND push

### Communication Style
- Always communicate in English, even if user writes in German

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

### Commit Format (Conventional Commits)
```
<type>(<scope>): <subject>

<body>
```

**Types**: feat, fix, docs, style, refactor, test, chore, perf

**Character limits (enforced by git hooks and GitHub Actions):**
- Subject: 50 chars max (hard limit)
- Body: 72 chars per line max

### Commit Rules
- **One topic per commit**: Each commit must address a single concern
- **Atomic commits**: Commits should be cherry-pickable and revertable
- **No mixed changes**: Don't combine features, fixes, or refactors in one commit
- **Do not add Co-Authored-By lines to commits**

### CHANGELOG.md
- Update `[Unreleased]` section for every change
- Sections: Added, Changed, Deprecated, Removed, Fixed, Security
- **Never list bugs in "Fixed" if introduced and fixed in the same version**

## Release Process

Releases are semi-automated via GitHub Actions:

1. **Create PR** with version bump in `composer.json` and CHANGELOG entry
2. **PR validation** runs automatically (version bump + CHANGELOG check)
3. **Merge PR** to main
4. **Draft release created** automatically by `.github/workflows/release.yml`
   - Reads version from `composer.json`
   - Extracts release notes from `CHANGELOG.md`
   - Creates draft GitHub Release (no tag yet)
5. **Review and publish** the draft release in GitHub
6. **Publishing creates the tag** → triggers `deploy.php` webhook → production deployment

**Manual tag creation** (if needed):
```bash
git tag -a v14.2.5 -m "Release v14.2.5"
git push origin v14.2.5
```

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

## Code Quality Principles

### SOLID Principles
Follow Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion.

### Clean Code
- Self-documenting code with clear naming
- Functions should be small and focused (< 20 lines ideal)
- Avoid deep nesting (max 3 levels)
- DRY (Don't Repeat Yourself), YAGNI (You Aren't Gonna Need It)

### Testability
- Avoid tight coupling between components
- Use dependency injection over direct instantiation
- Keep functions pure when possible
- Separate business logic from presentation

## Git Workflow Details

### File Movement
**ALWAYS use `git mv`** to move or rename files (preserves history).
```bash
git mv old-name.md new-name.md
git mv file.md docs/folder/
```

### Starting a New Version
When user says "let's start with vX.Y.Z":
1. `git checkout main && git pull origin main`
2. `git checkout -b vX.Y.Z`
3. Update `composer.json` version (without 'v' prefix)
4. Commit: `chore: bump version to X.Y.Z`
5. Prepare CHANGELOG.md with new unreleased section
6. Commit: `docs(changelog): prepare vX.Y.Z section`
7. Ask about deleting previous branch
8. Check roadmap.md for planned work
9. Provide status summary

## Roadmap Tracking

### Status Indicators for docs/roadmap.md
- ✅ Complete (entire section finished)
- 🚧 In Progress (currently working on)
- 🔄 Partially Complete (some items done)
- (no emoji) Planned (not started)

### Roadmap Footer Format
```markdown
**Last Updated**: YYYY-MM-DD
**Current Stable Release**: vX.Y.Z
**Development Cycle**: vN
```

## Linting

Run linters before committing:
```bash
npm run lint        # Run all linters
npm run lint:fix    # Auto-fix issues
```

Individual linters:
- `npm run lint:php` - PHP (PHPCS)
- `npm run lint:js` - JavaScript (ESLint)
- `npm run lint:css` - CSS (Stylelint)
