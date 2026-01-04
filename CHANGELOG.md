# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [10.0.2] - 2026-01-04

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


