# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [14.1.0] - 2026-01-08

### Added

- **Git Commit Message Template** (`.gitmessage`): Visual guide for proper commit formatting
  - Character count markers at 50 and 72 characters
  - Commit type reference and examples
  - Subject line guidelines and best practices
  - Automatically loaded when running `git commit`
- **Tools Documentation** (`tools/README.md`): Complete commit message guidelines
  - Detailed examples of good and bad commits
  - Character counting tips for AI-generated messages
  - Troubleshooting guide for rejected commits
  - Strategies for shortening long messages
  - Git hooks usage and setup instructions
- **Netlify PR Preview Deployments**: Automatic preview environments for pull requests
  - Every PR gets unique preview URL: `deploy-preview-{number}--bodyrefactoring.netlify.app`
  - Build script (`build.php`) converts PHP to static HTML
  - Generates static `trainings/schedules.json` to replace PHP schedule listing
  - JavaScript fallback: tries `index.php` (production) then `schedules.json` (Netlify)
  - Netlify configuration (`netlify.toml`)
  - Automatic deployment on PR creation/update
  - Auto-cleanup when PR closes
  - ~30-second build time
  - Zero maintenance required
  - Free tier (100GB bandwidth/month)

### Changed

- **`.cursorrules` enhanced**: Added strict commit message formatting guidelines for AI
  - Explicit 50/72 character rules with examples
  - Character counting instructions for AI-generated commits
  - Common mistakes and how to avoid them
  - Strategies for handling messages that exceed limits
- **README.md**: Added Development section with commit standards
  - Quick reference for commit message format
  - Examples of good vs bad commits
  - Links to detailed documentation
  - AI-generated commit message guidelines

## [14.0.0] - 2026-01-08

### Added

- **"Today" Button in Week Navigation**: Quick jump back to current week
  - Appears only when viewing past or future weeks (currentWeekOffset !== 0)
  - Positioned on right side of week navigation bar
  - Home icon (🏠) for easy recognition
  - Smooth transition back to current week
  - Week display remains centered with flex layout
  - Mobile-optimized with proper touch target size (44x44px)
- **Sick/Recovery Completion Modal**: Subdued celebration for rest days
  - Separate modals for recovery (🩹) and sick days (💊)
  - Different visual style from normal completion:
    - Softer gradient backgrounds (blue/purple for recovery, red/purple for sick)
    - Calmer messaging acknowledging rest ("Gut gemacht!" vs "Training Complete!")
    - Reduced confetti (75 particles and reduced spread)
    - Shows current streak with context
    - Recovery: "Streak pausiert - erholt dich gut!"
    - Sick with shield: "Schild verwendet - Streak geschützt!"
    - Sick without shield: "Kein Schild - Streak unterbrochen!"
  - Quick dismiss buttons with appropriate styling
  - Automatically detects day type and shows appropriate modal
  - Modified `checkDayCompletion()` to be async and detect recovery/sick days
  - Filters disabled exercises when counting completion (recovery/sick mode compatibility)
- **Schedule Editor: Rep Counter Support**: Added JSON input field for rep counter configuration
  - Same simple approach as timer configuration
  - JSON format: `{"sets": 3, "reps": 12, "restSeconds": 60, "delayMilliseconds": 3000}`
  - Makes it easy to add/edit rep counter for exercises
  - Validates JSON on save

### Changed

- **Confetti z-index**: All confetti effects now use `zIndex: 50` to appear behind modals (z-index 100)
  - Prevents visual conflict when completing last exercise of the day
  - Confetti continues falling in background behind completion modal
  - Applies to miniConfetti (checkbox), superConfetti (day completion), and subduedConfetti (recovery/sick)
- **CSS Color System Refactoring**: Extracted all colors to CSS custom properties
  - Added `:root` variables for all colors (22 total: 20 unique + 2 semantic aliases)
  - Implemented RGB variables for `rgba()` support using `--color-name-rgb` pattern
  - Technique from StackOverflow (CC BY-SA 4.0): https://stackoverflow.com/a/41265350
  - Semantic aliases using `var()`: `--color-rep-tension-1: var(--color-danger)`
  - Merged duplicate: `--color-bg-modal` → `--color-bg-secondary` (cards + modals)
  - All `rgba()` now use CSS variables with alpha channel
  - Zero hardcoded colors remaining in CSS
  - No visual changes - internal refactoring only
  - Improved maintainability and theming support
  - Ready for v14.4 two-layer circle animation colors

### Fixed

- **PR workflows no longer trigger on description edits**: Removed `edited` event from workflow triggers
  - PR Validation and PR Requirements workflows now only run on code changes (`opened`, `synchronize`, `reopened`)
  - Ticking checkboxes in PR template no longer triggers workflows
  - Eliminates unnecessary workflow runs and skipped check confusion
  - Workflows run once on PR creation and again only when code is pushed
  - Smart polling logic remains for proper validation timing (polls every 10s, max 5min)

## [13.0.0] - 2026-01-05

**Complete architectural refactoring with 6 phases and 13 modules.**  
📖 **[Full Documentation](docs/v13-refactoring/README.md)** - Comprehensive refactoring documentation

### Added

- **Core Architecture - Phase 1**: Modularization and state management foundation
  - `modules/constants.js`: Centralized constants, storage keys, and configuration
  - `modules/state-machine.js`: Generic state machine implementation with transition validation
  - `modules/storage-service.js`: localStorage abstraction layer with type-safe methods
  - `modules/state-manager.js`: Centralized application state management with reactive updates
  - `modules/utils.js`: Common utility functions (date handling, formatting, notifications)
  - `modules/speech-service.js`: Text-to-speech service with voice selection and queue management
- **Core Architecture - Phase 2**: State machine integration
  - `modules/app-state-machine.js`: High-level application state management (initializing, schedule view, timer active, rep counter active, modal open)
  - `modules/timer-state-machine.js`: Timer and rep counter state machines with proper lifecycle management
  - `modules/modal-state-machine.js`: Modal management ensuring only one modal open at a time
- **Core Architecture - Phase 3**: Module integration (COMPLETE)
  - Integrated all Phase 1 & 2 modules into app.js
  - Migrated app.js to ES6 module system
  - Replaced global constants with imported modules
  - State machines and services instantiated and active
  - Exposed 28 functions to global scope for inline event handlers
  - Improved accordion UX: Auto-close siblings when opening a day, refresh weight values on open
  - ✅ **State machine integration**: Implemented validation to prevent timer/rep counter conflicts
  - ✅ **Debug mode logging**: State transitions logged in debug mode for troubleshooting
  - ✅ **TimerCoordinator**: Created centralized timer/timeout/speech management
    - All setTimeout/setInterval calls now tracked and cleanable
    - Speech synthesis properly cancelled on operation switch
    - Complete cleanup ensures no orphaned timers or speech commands
    - Resolved race condition in voice loading (hasSpoken flag)
- **Core Architecture - Phase 4**: Storage service migration (COMPLETE)
  - Migrated all ~50 localStorage calls to StorageService abstraction
  - Functions updated: renderSchedule, getSmartWeight, getPreviousMemo, toggleCheck, saveNote, saveWeight, toggleUnit
  - Streak calculation: calculateStreak, isDayComplete
  - Shield management: getShields, getAwardedShieldMilestones, addAwardedShieldMilestone, awardShield
  - Sick mode: activateRecoveryMode, useSickShield, backToNormal
  - Export/import functions keep direct localStorage access for key enumeration
  - Type-safe storage operations throughout
  - Single source of truth for all data persistence
- **Core Architecture - Phase 5**: Feature extraction (COMPLETE)
  - Created ScheduleService for schedule data management
    - Handles schedule fetching, caching, and week calculations
    - Centralized week navigation logic
    - Schedule version validation
  - Created StreakCalculatorService for streak management
    - Calculates streaks with recovery/sick day support
    - Manages shield awards and milestones
    - Integrates with storage and schedule services
  - Services follow dependency injection pattern
  - Clear separation of concerns
  - Easier to test and maintain
- **Core Architecture - Phase 6**: Domain storage layer (COMPLETE)
  - Created DomainStorageService for business-logic storage operations
  - Encapsulates key structure (no more string concatenation in app.js)
  - Type-safe methods with clear intent
  - Domain methods: `isRecoveryDay()`, `isSickDay()`, `isExerciseComplete()`, etc.
  - Self-documenting code - method names speak business language
  - Easy refactoring - change key structure in one place
  - ~50 call sites migrated to domain methods
  - Follows Adapter Pattern - wraps generic StorageService with domain layer
- **Rep counter debug mode**: Added `getRepDelay()` function for centralized delay management
  - Single source of truth for rep timing
  - Debug mode (`#debug`) overrides delay to 1000ms for faster testing
  - Allows quick rep counter testing without waiting full configured delay (3-4 seconds)
- **Debug mode toggle in menu**: Added easy toggle for debug mode in burger menu
  - Only visible in browser mode (hidden in standalone/web app mode via CSS media query)
  - Toggle button shows current state (aktivieren/deaktivieren)
  - Visual indicator when active (orange highlight)
  - Automatically reloads page to apply debug mode changes
- **Git Hooks for Conventional Commits**: Local commit message validation
  - Pre-commit hook validates Conventional Commits format
  - Enforces 50/72 character rules (subject: 50 recommended, 72 max; body: 72 max per line)
  - Detects BREAKING CHANGE markers for major version bumps
  - Encourages scope usage (e.g., `feat(auth):`) when feasible
  - Setup script: `bash .githooks/setup.sh`
  - Provides helpful error messages with examples
  - Instant feedback before commit completes
- **GitHub Action for Commit Validation**: Remote enforcement of commit standards
  - Separate workflow file: `.github/workflows/validate-conventional-commits.yml`
  - Validates all commits in PRs and pushes to main
  - Catches commits that bypass local hooks
  - Works with web-based commits (GitHub UI)
  - Modular architecture for better reusability
  - Local testing helper script: `.github/test-workflows.sh` (uses act if available)
- **Consent Layer**: GDPR-friendly consent screen for first-time visitors
  - Lists all external CDN resources (Tailwind CSS, Canvas Confetti, Google Fonts, Lucide Icons)
  - Blocks CDN loading until consent is accepted
  - Consent stored indefinitely in cookie
  - Clear privacy notice: all training data stays local (LocalStorage only)
  - Links to personal site (christoph-daum.de) and GitHub repository
- **Introduction Modal**: Welcome screen for new users
  - Shows on first visit only (dismissed state stored in localStorage)
  - ES6 module: `assets/js/intro-modal.js` (imported by app.js)
  - Uses DomainStorageService for state management (`hasSeenIntroduction()`, `setIntroductionSeen()`)
  - Functions accept domainStorage as dependency injection parameter
  - Highlights privacy-first approach (all data stored locally)
  - Lists all app features (Rep Counter, Notes, Gamification, Streaks, Sick Mode, Progressive Overload)
  - Links to personal website (christoph-daum.de) and GitHub repository
  - Encourages forking the GitHub project for personal customization
  - Notes that this is a private app with personal training schedules
  - Confetti celebration on dismissal
  - Gym logo displayed prominently

### Changed

- `.cursorrules`: Enhanced AI development guidelines 
  - Senior developer mindset - Thanks to David for the suggestion!
  - Mandatory documentation reminders
  - Strict code quality principles (SOLID, Clean Code, Testability, Maintainability).
  - Added git workflow guidelines: AI should not perform git operations unless explicitly requested or for verification.
- **Architecture**: Modular foundation established with state machines for improved code organization and conflict prevention
- **app.js**: Now loads as ES6 module with imported dependencies
- **Weight input display**: Removed spinner arrows from number input fields for better centered appearance on mobile devices

## [12.0.0] - 2026-01-05

### Changed

- Version Number to honor reverted version 11

## [10.2.0] - 2026-01-04

### Added

- Schedule for week starting 2026-01-05

### Fixed

- **PR enforce workflow**: Now properly treats skipped validation jobs as success, preventing false failures when only PR description is edited

## [10.1.1] - 2026-01-04

### Fixed

- **Github Action PR Summary bug**: Fixed issue where AI-generated summary comment was not updating on new commits by ensuring proper comment identification and update logic

## [10.1.0] - 2026-01-04

### Added

- **GitHub Actions PR validation**: Automated workflows to validate pull requests
  - Version bump check: Ensures `composer.json` version is incremented
  - CHANGELOG entry check: Verifies new version has CHANGELOG entry
  - Schedule validation: Runs `validate-schedule.php` on all schedule files
  - Auto-checkbox: Automatically checks completed items in PR description
  - Summary comments: Posts validation results to PR
  - Merge blocking: Prevents merging if validations fail (with branch protection)
  - Smart triggers: Version and schedule validation only run on code changes, not description edits
  - Early exit optimization: Schedule validation skips when no training files changed
- **AI PR Summary**: Automatically generates structured summary comment for pull requests
  - Analyzes commits, diffs, and file changes
  - Posts summary as first comment (appears after description)
  - Updates on new commits
  - Identifies impact areas (JS, CSS, PHP, schedules, workflows)
- **Workflow documentation**: Complete guide in `.github/workflows/README.md`

### Changed
- **Rep counter timing**: Adjusted the Rep Counter delay to measured values
- **Pull Request Template**: Updated PR template to remove unused entries

## [10.0.1] - 2026-01-03

### Added

- **Rep counter breathing animation**: Numbers animate from 100% → 75% (at midpoint) → 50% (at end) over the delay duration with enhanced color transitions and stronger glow effects to visually indicate up/down rep motion
- **Countdown breathing animation**: 5-4-3-2-1 countdown numbers now breathe with 1-second animation each
- **Rest timer breathing animation**: Rest timer between sets now breathes with 1-second animation and announces "X Sekunden Pause" at start
- **Debug mode**: Access app with `#debug` in URL to remove day editing restrictions (indicated by 🐛 DEBUG badge in header)
- **Schedule editor unit suggestions**: Unit field now suggests KG, STUFE, and LBS while allowing freetext input

### Fixed

- **Speech synthesis compatibility**: Fixed audio not working on iOS Safari and Chrome macOS by removing immediate cancel() call, adding proper voice loading, and implementing queue management
- **Timer animation**: Rep counter animations now properly scoped to modal only, preventing interference with FAB timer

## [10.0.0] - 2026-01-03

### Changed

- **Rep counter timing precision**: Changed from `delaySeconds` to `delayMilliseconds` for more precise rep timing control (e.g., 3000ms instead of 3s)
- **Rep counter visual improvements**: 
  - Countdown uses yellow color to distinguish from rep counting (blue/green)
  - "Los!" displayed as large text for 2 seconds before starting rep counting
  - Clear visual transition from countdown → "Los!" → rep counting
  - Tap rest timer to skip to 5 seconds for quicker succession between sets

### Fixed

- **Rep counter completion bug**: Fixed issue where exercise was not marked complete after finishing rep counter workout
- **Rep counter cancel bug**: Fixed issue where canceling did not stop the voice-over and timers properly

## [9.3.1] - 2026-01-03

### Changed

- **Rep counter screen update**: Exercise now marked as complete immediately without requiring page reload (triggers checkbox click instead of just setting localStorage)
- **Rep counter countdown voice**: Now only speaks "3, 2, 1, Los!" instead of "5, 4, 3, 2, 1, Los!" while still displaying all 5 numbers
- **Rep counter timing**: Now starts counting at 1 (beginning of rep) instead of 0, so the last rep number is visible for the full delay duration before transitioning

## [9.3.0] - 2026-01-03

### Changed

- **Deploy script**: Now uses `git reset --hard` to discard local changes before deployment, ensuring remote version always overwrites local modifications

## [9.2.1] - 2026-01-03

### Added

- **Composer integration**: Added `composer.json` for project metadata and dependency management
- **Centralized version management**: Created `tools.php` with `getAppVersion()` function and `APP_VERSION` constant
- **Pull request template**: Added `.github/pull_request_template.md` for standardized PR workflow

### Changed

- Version now defined in single location (`composer.json`)
- All PHP files use `APP_VERSION` constant instead of hardcoded version strings

### Fixed

- Menu dropdown width issue
- **Rep counter voice-over abort**: Voice-over now properly stops when canceling the rep counter

## [9.2.0] - 2026-01-03

### Added

- **Rep Counter (Experimental)**: Automatic vocal rep counting for strength training
  - Full-screen modal with large display (similar to sick/recovery overlay)
  - Tap rep counter chip to start workout
  - 5-second countdown: "5, 4, 3, 2, 1, Los!"
  - Automatic rep counting based on configurable delay (e.g., every 3-4 seconds)
  - Voice counts: "1, 2, 3..." automatically timed to your rep pace
  - Big numbers display with pulse animation on each rep change
  - Color coding: Blue for regular reps, Green for last 3 reps
  - Glowing text shadow effect for visual clarity
  - Set progress shown: "Satz 1 von 3"
  - Automatic rest timer after completing set with countdown display
  - Seamless transition to next set after rest
  - Click abort button to cancel workout
  - **Automatic exercise completion**: Exercise marked as complete upon successful finish
  - Abort does not mark exercise as complete
  - Schedule reloads to show checkmark after completion
  - Confetti and "Fertig!" on completion
  - Configured via `repCounter` object with `delaySeconds` for rep timing
  - Added to all strength training exercises on Monday and Wednesday
- **JSON Schema updated**: Added `repCounter` object definition to schema-schedule-v1.json (optional field, still v1)

### Fixed

- **Voice-over initialization**: Fixed speech synthesis not loading voices on first use, now properly waits for voice initialization
- **Shield reward bug**: Shields were being awarded multiple times on app reload. Now tracks awarded milestones to prevent duplicate shield awards at 7, 14, 21+ day intervals
- **Menu dropdown width**: Fixed burger menu items being too wide, added proper text truncation and consistent width

### Changed

- **Text-to-speech improved for iOS**: Better voice selection (Anna/Helena/Markus preferred), adjusted rate, natural pitch and volume settings for more natural-sounding timer announcements

## [9.1.0] - 2026-01-03

### Added

- **Schedule Editor/Generator**: Web-based tool for creating and editing schedule JSON files
  - Load existing schedules from server
  - Create new schedules with date selection
  - Import schedules from files or paste JSON directly
  - Visual day-by-day editor with tabbed interface
  - **Drag-and-drop exercise sorting**: Reorder exercises by dragging with grip handle
  - Add, edit, remove, and reorder exercises
  - Full support for all exercise types (warmup, main, cool, alternatives)
  - Built-in validation with error reporting
  - Export schedules as JSON files for Git deployment
  - **Exercise ID autocomplete**: Suggests existing exercise IDs while allowing new ones
  - Comprehensive form for exercise properties (timers, weights, units, descriptions)
- **Schedule Editor Documentation** (`docs/schedule-editor.md`) - Complete guide with workflows, tips, and troubleshooting
- Changelog file following Keep a Changelog conventions
- AI Schedule Creation Guide for creating new training schedules
- Automatic changelog maintenance via .cursorrules

## [9.0.0] - 2026-01-03

### Added

- **Sick Mode / Recovery System**: Comprehensive illness management
  - Recovery Mode with 3 light activities (breathing, stretching, hydration)
  - Sick Mode with shield usage to preserve streak
  - Sick Mode without shield for longer illnesses (breaks streak)
  - "Back to Normal" button to cancel recovery/sick mode during the day
  - Automatic shield refund when canceling sick mode
  - Visual integration: disabled exercises shown inline with recovery/sick activities
- **Streak Insurance System**: Earn and use shields
  - Earn 1 shield for every 7 consecutive training days
  - Maximum 3 shields can be stored
  - Shields displayed in header next to streak counter
  - Shield usage tracking with separate storage flags
- Comprehensive sick mode documentation in README
- Usage guide for daily training and sick mode workflows

### Changed

- Streak calculation now accounts for recovery days and sick days with shields
- Day view dynamically switches between normal, recovery, and sick mode layouts
- Shield system integrated into streak mechanics

### Fixed

- Streak continues correctly with recovery mode completion
- Streak preserved when using shields during illness
- Visual indicators accurately reflect shield usage status

## [8.0.0] - 2026-01-02

### Added

- **Schedule Validation System**: CLI validator for JSON schedules
  - Comprehensive validation of structure, fields, and data types
  - ID uniqueness checking across entire schedule
  - Filename format validation
  - Complete error messages with fix suggestions
- **JSON Schema v1**: Schema file for IDE integration (`schema-schedule-v1.json`)
- Schedule validation documentation (`docs/schedule-validation.md`)
- Template schedule file (`template-schedule.json`)
- Automatic cache busting using file modification timestamps
- Separated JavaScript into `/assets/js/app.js`
- Complete JSDoc documentation for all JavaScript functions

### Changed

- **Breaking**: Schedule JSON structure now requires version wrapper
  - Root object with `version: 1` and `days` array
  - Previously was just an array of days
- File structure reorganized with proper separation of concerns
  - HTML in `index.php` (structure only)
  - CSS in `assets/css/styles.css` (all styles)
  - JavaScript in `assets/js/app.js` (all logic)
- Cache busting moved to `assets/cachebuster.php` helper

### Removed

- Inline JavaScript from `index.php`
- Inline CSS from `index.php`
- Hardcoded version numbers (now use cache busting)

## [7.0.0] - 2025-12-28

### Added

- **Dynamic Scheduling Engine**: JSON-based workout schedules
  - Multiple schedule files support (`schedule-YYYY-MM-DD.json`)
  - Automatic schedule selection based on date
  - Schedule caching for performance
- **Time Travel Navigation**: Browse past and future weeks
- **Smart Weight Tracking**: Weights automatically carry forward
- Day-by-day weight history lookup
- Previous week memo display in logbook

### Changed

- Migrated from hardcoded schedule to JSON configuration
- Schedule API endpoint (`trainings/index.php`)

## [6.0.0] - 2025-12-22

### Added

- **Streak Counter**: Visual flame counter with day count
- **Completion Modal**: Motivational quotes on day completion
- **Confetti Effects**:
  - Mini confetti on individual exercise completion
  - Super confetti on full day completion
- Random motivational quote system (8 quotes)

## [5.0.0] - 2025-12-20

### Added

- **Alternative Exercises**: Choose between multiple exercise options
  - Weather-dependent cardio alternatives
  - Equipment alternatives
- Visual separator for alternatives ("ODER")
- Enhanced exercise type badges (Warm Up, Mission, Cooldown)

## [4.0.0] - 2025-12-18

### Added

- **Timer System**: Integrated countdown timers
  - Multiple timer options per exercise
  - Text-to-Speech announcements (German)
  - Time remaining announcements (10min, 5min, 1min, 30s, 10s, 3-2-1)
  - Vibration on completion
- **NoSleep Mode**: Prevents screen lock during workouts
- FAB (Floating Action Button) for quick 60s pause timer
- Timer chips for each exercise

## [3.0.0] - 2025-12-15

### Added

- **Weight Tracking**: Inline weight adjustment
  - Smart weight persistence (carries forward)
  - Unit toggle (KG/STUFE)
  - Numeric keyboard optimization for mobile
- **Logbook System**: Daily notes per training day
- LocalStorage for all user data
- Export/Import functionality (JSON backup)

## [2.0.0] - 2025-12-12

### Added

- **Weekly Schedule View**: 7-day layout
- **Exercise Completion**: Checkbox system with visual feedback
- Exercise categories: Warm Up, Mission, Cooldown
- Day completion detection
- Locked days (past >3 days, future days)
- Active day highlighting (TODAY badge)

### Changed

- UI redesigned with card-based layout
- Accordion-style day expansion

## [1.0.0] - 2025-12-10

### Added

- Initial release
- **Progressive Web App (PWA)** setup
- iOS Home Screen optimization
- Basic exercise list
- Dark theme with Tailwind CSS
- Lucide icons integration
- Static training schedule

### Technical

- PHP backend for dynamic content
- LocalStorage for client-side data
- Responsive design for mobile devices


