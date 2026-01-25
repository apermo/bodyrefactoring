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

### Backwards Compatibility
**Not required.** This is a single-user app. Feel free to make breaking changes to data structures, APIs, or localStorage formats without migration code. If you believe backwards compatibility is important for a specific change, suggest it but do not implement without confirmation.

## Project Overview

Body Refactoring is a personal, gamified progressive web app (PWA) for fitness tracking and habit building. It uses LocalStorage for data persistence and a PHP backend for serving dynamic training schedules.

**Key characteristics:**
- German UI, English codebase
- iOS Safari is the primary target
- Privacy-first (no external tracking, all data in localStorage)
- JSON-based workout schedules with version control

## Essential Commands

### Database Setup (v15.0+)
```bash
# Initialize database schema (run once)
php tools/import-schedule.php --init

# Import all schedules into MySQL
php tools/import-schedule.php --all

# Import single schedule
php tools/import-schedule.php schedules/schedule-2026-01-25.json

# Update existing template
php tools/import-schedule.php --update schedules/schedule-2026-01-25.json

# Preview import without changes
php tools/import-schedule.php --dry-run schedules/schedule-2026-01-25.json
```

### Schedule Validation (run before committing schedule changes)
```bash
cd schedules/
php validate-schedule.php                    # Validates all schedules
php validate-schedule.php schedule-2026-01-15.json  # Validate specific file
```

### Git Hooks Setup (enables linting and version sync)
```bash
bash .githooks/setup.sh
```

Pre-commit hooks run scripts in `.githooks/pre-commit.d/` in order:
- `01-version-sync.sh` - Syncs `package.json` version from `composer.json`
- `02-lint-staged.sh` - Runs lint-staged (PHP, JS, CSS linting)

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

### Backend Services (v15.0+)

PHP classes in `/includes/`:

- **Database.php** - PDO connection singleton with helper methods
- **ScheduleService.php** - Schedule queries, template lookup, override logic
- **config-loader.php** - JSON configuration loading

### Schedule System

**Storage options:**
1. **MySQL database** (v15.0+) - Primary, supports overrides and one-time events
2. **JSON files** - Fallback when database unavailable

**JSON files** in `/schedules/`:
- Named `schedule-YYYY-MM-DD.json`
- Schema: `schema-schedule-v1.json`, `schema-schedule-v2.json`, `schema-schedule-v3.json`

**API endpoints:**
- `GET /schedules/` - List available schedules
- `GET /schedules/?file=schedule-*.json` - Get full schedule file
- `GET /api/v1/schedules/day?date=YYYY-MM-DD` - Get single day (database-backed)

**Database tables:**
- `schedule_templates` - Weekly schedule definitions
- `schedule_days` - Day configurations within templates
- `schedule_exercises` - Exercises within days
- `date_overrides` - One-time date overrides (replace, add, skip)

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

### WordPress Function Names
**Do not redefine WordPress core function names** unless the function is an exact replica with the same intended logic that could be replaced by the WordPress core function.

Examples of WordPress functions to avoid redefining:
- `is_admin()` - In WP this checks if in admin area, not if user is administrator
- `current_user_can()` - In WP this checks user capabilities
- `get_option()`, `update_option()` - In WP these handle options API

If you need similar functionality, use distinct names like `has_admin_access()` instead of `is_admin()`.

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
- **Link to issues**: When a commit completes an issue, include `closes #N` in the commit body to auto-close the issue on merge

### CHANGELOG.md
Follows [Keep a Changelog](https://keepachangelog.com/) standard:
- Use `## [Unreleased]` header for work in progress (NOT `## [X.Y.Z] Unreleased`)
- On release, workflow automatically changes `[Unreleased]` → `[X.Y.Z] - DATE`
- Sections: Added, Changed, Deprecated, Removed, Fixed, Security
- **Never list bugs in "Fixed" if introduced and fixed in the same version**

### Pull Requests
When creating PRs, use `.github/pull_request_template.md`:
- **Summary**: 2-3 sentences covering what and why
- **Type of Change**: Check applicable boxes
- **Changelog**: Group changes by type (Added, Changed, Fixed)
  - Mirror CHANGELOG.md format
  - Remove empty sections
- **Never check** Testing or Checklist items — user verifies these
- **Never add** "Generated by" attribution lines
- Leave **Deployment Notes** empty unless relevant

### Issues
- **Never add** "Generated by Claude Code" or similar attribution lines
- Keep descriptions factual and technical

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
- Training schedules: `schedules/*.json`
- Schedule editor: `schedule-editor.php`
- Documentation: `docs/`

## Testing

### Manual Testing
- Test on iOS Safari (primary target)
- Test as installed PWA (Add to Home Screen)
- Validate JSON schedules before committing

### Running Tests

```bash
npm test              # Run all tests (PHP unit + E2E quick)
npm run test:php      # PHP unit tests only (via DDEV)
npm run test:e2e      # E2E tests only (quick, excludes @slow)
npm run test:e2e:full # All E2E tests including @slow
```

### PHP Unit Tests

```bash
npm run test:php                # Run unit tests via DDEV
npm run test:php:coverage       # Run with code coverage
vendor/bin/phpunit --filter ScheduleService  # Specific test class
```

**Test files:** `tests/php/Unit/`
- `ScheduleServiceTest.php` - Schedule business logic
- `SchedulesControllerTest.php` - API controller validation

### Playwright E2E Tests

```bash
npm run test:e2e          # Quick tests only, excludes @slow
npm run test:e2e:full     # All tests including @slow
npm run test:e2e:slow     # Only @slow tests
npm run test:e2e:browsers # All tests on all browsers
npm run test:e2e:headed   # Run with visible browser
npm run test:e2e:debug    # Debug mode with Playwright Inspector
npm run test:e2e:ui       # Interactive UI mode
npm run test:e2e:report   # View last test report

# Run specific test file
npx playwright test tests/e2e/consent-intro.spec.js

# Run with different browsers
BROWSERS=chromium,webkit npm run test:e2e
TEST_MODE=full BROWSERS=chromium npm run test:e2e
```

### Test Categories

- **Quick tests** (default): Fast tests for PR checks
- **Slow tests** (`@slow`): Full rep counter timing flows (30-60s each)

Run `test:e2e:full` when modifying rep counter code or before releases.

### Test Architecture

- **PHP Unit Tests**: `tests/php/Unit/` - business logic and API tests
- **Page Objects**: `tests/pages/AppPage.js` - reusable page interactions
- **Fixtures**: `tests/fixtures/` - mock schedule and test helpers
- **E2E Specs**: `tests/e2e/*.spec.js` - test files organized by feature

### Consent & Intro Screen Handling

Tests bypass consent/intro by default via `AppPage.goto()`:
- Sets `br_consent` cookie before navigation
- Sets `body_refactoring_intro_seen` localStorage via `addInitScript()`

To test these screens explicitly, see `consent-intro.spec.js`.

### Adding New Tests

1. Use `setupMockSchedule(page)` in `beforeEach` for predictable data
2. Use `AppPage` methods for common interactions
3. Use `test.skip()` for conditional tests, not silent if blocks
4. Scope locators within parent elements (e.g., `todayCard.locator(...)`)
5. Add `{ force: true }` for clicks blocked by sticky header

See `docs/testing.md` for detailed documentation.

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
   - The pre-commit hook auto-syncs `package.json` from `composer.json`
5. Ensure CHANGELOG.md has `## [Unreleased]` section (add if missing after release)
6. Ask about deleting previous branch
7. Check GitHub milestone for planned work: `gh issue list --milestone "vX.Y.Z"`
8. Provide status summary

**Version sync:** `composer.json` is the authoritative source. The pre-commit hook automatically syncs the version to `package.json`. GitHub Actions validates that versions match on PRs.

## Roadmap & Issue Tracking

The project roadmap is tracked via [GitHub Issues and Milestones](https://github.com/apermo/bodyrefactoring/milestones).

### When to Create New Issues

**Create a refactoring issue when:**
- Function/class exceeds 200 lines
- Mixed responsibilities detected
- Adding features requires touching multiple unrelated parts
- Code duplication appears
- Testing becomes impossible without full system
- Performance issues due to poor structure

**Signs it's time to refactor:**
- Bug fixes become difficult due to complexity
- New features take longer than they should
- Team members (or future self) struggle to understand code
- Playwright tests are brittle due to tight coupling

### Issue Labels

- **Type labels**: `type: feature`, `type: refactor`, `type: test`, `type: chore`
- **Area labels**: `area: rep-counter`, `area: schedule`, `area: gamification`, `area: ui`, etc.
- **Priority labels**: `priority: high`, `priority: low`

### Milestone Workflow

1. Filter issues by milestone: `gh issue list --milestone "v15.0.0"`
2. Pick an issue and mark as in-progress
3. Reference issue in commits: `feat: add feature X (closes #42)`
4. PR auto-closes issue on merge

## Linting

### Commands
```bash
npm run lint        # Show all errors (detailed output)
npm run lint:fix    # Auto-fix issues
npm run lint:check  # Threshold check (used in CI/pre-commit)
```

Individual linters:
- `npm run lint:php` / `lint:php:check` - PHP (PHPCS)
- `npm run lint:js` / `lint:js:check` - JavaScript (ESLint)
- `npm run lint:css` / `lint:css:check` - CSS (Stylelint)

### Linting Ratchet (No New Errors)

The project uses threshold-based linting: existing errors allowed, new errors blocked.

**Baseline files** (committed to repo):
- `phpcs-baseline.json` - PHP error/warning counts
- `eslint-baseline.json` - JavaScript error/warning counts
- `stylelint-baseline.json` - CSS error/warning counts

**Behavior:**
- Counts increase → commit/CI **fails** (regression detected)
- Counts decrease → baseline **auto-updates** (improvement saved)

**Threshold scripts:** `.github/scripts/*-threshold.sh`

**To fix errors and update baseline:**
```bash
npm run lint:fix    # Auto-fix what's possible
npm run lint:check  # Re-run to update baselines
```
