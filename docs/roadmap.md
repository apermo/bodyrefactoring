# Body Refactoring - Planned Features & Roadmap

This document outlines planned features and improvements for the Body Refactoring app.

## 📋 Feature Roadmap

### v14.3.0 ⏳ - Linting & Code Quality

**Priority: High**  
**Focus**: Automated code quality enforcement and consistency

#### `.cursorrules` Migration to `CLAUDE.md`
- **Migrate and Remove `.cursorrules`**
  - `.cursorrules` (1180 lines) was created for Cursor IDE
  - `CLAUDE.md` was created as successor for Claude Code
  - Validate critical rules are in CLAUDE.md, then remove .cursorrules
  - Single source of truth: CLAUDE.md

**Why in this version:**
- Complements linting setup (both focus on code quality standards)
- Single source of truth reduces maintenance burden
- CLAUDE.md serves both Claude Code and provides guidance for other AI tools
- Should be done before major coding work in v14.4+ to ensure consistency

#### PHP Linting
- **WordPress Coding Standards (Opinionated)**
  - Install and configure PHP_CodeSniffer (PHPCS)
  - Use WordPress-Extra ruleset as base
  - Custom ruleset configuration for project-specific rules
  - Automatic fixing with PHP Code Beautifier (PHPCBF)
  - Integration with PHPStorm/VS Code for real-time feedback

- **Linting Scope**
  - All PHP files in project root
  - `/trainings/` PHP files
  - `/assets/` PHP files (cachebuster.php)
  - Excludes: `/vendor/`, `/node_modules/`

#### JavaScript Linting
- **ESLint with WordPress-inspired Rules**
  - Configure ESLint with WordPress JavaScript standards (loosely)
  - Custom rules adapted for ES6 modules
  - Support for async/await patterns
  - JSDoc validation for all functions
  - Code complexity warnings (cyclomatic complexity)

- **Linting Scope**
  - `/assets/js/app.js`
  - `/assets/js/schedule-editor.js`
  - All `/assets/js/modules/*.js` files
  - Excludes: External libraries, minified files

#### CSS Linting
- **Stylelint with WordPress CSS Standards**
  - Configure Stylelint with WordPress CSS Coding Standards
  - Tailwind CSS compatibility
  - Custom properties validation
  - Selector complexity warnings
  - Automatic fixing for formatting issues

- **Linting Scope**
  - `/assets/css/styles.css`
  - Any additional CSS files
  - Inline styles detection (warnings only)

#### CI/CD Integration
- **Pre-commit Hooks**
  - lint-staged via `.githooks/pre-commit` (extends existing hook system)
  - Auto-fix on commit (when possible)
  - Block commits with unfixable errors
  - Fast: Only lints staged files

- **GitHub Actions Workflow**
  - New workflow: `.github/workflows/lint.yml`
  - Runs on: Pull requests, pushes to main
  - Separate jobs for PHP, JS, CSS
  - Annotates PR with lint errors
  - Fails CI if errors found
  - Caches dependencies for speed

#### Developer Experience
- **IDE Integration**
  - PHPStorm/IntelliJ IDEA configuration files
  - VS Code settings and extensions recommendations
  - Real-time linting while coding
  - Quick-fix suggestions
  - Format on save configuration

- **Documentation**
  - CONTRIBUTING.md with code style guide
  - Setup instructions for linters
  - Common errors and how to fix them
  - Ignore patterns documentation

**Technical Implementation:**

- **PHP Setup**
  - Install via Composer: `squizlabs/php_codesniffer`, `wp-coding-standards/wpcs`
  - Custom ruleset: `phpcs.xml` in project root
  - NPM script: `npm run lint:php`
  - NPM script: `npm run lint:php:fix`

- **JavaScript Setup**
  - Install via NPM: `eslint`, `@wordpress/eslint-plugin` (as base)
  - Custom config: `.eslintrc.json`
  - NPM script: `npm run lint:js`
  - NPM script: `npm run lint:js:fix`

- **CSS Setup**
  - Install via NPM: `stylelint`, `stylelint-config-wordpress`
  - Custom config: `.stylelintrc.json`
  - NPM script: `npm run lint:css`
  - NPM script: `npm run lint:css:fix`

- **Combined Scripts**
  - `npm run lint` - Run all linters
  - `npm run lint:fix` - Auto-fix all files
  - `npm run lint:check` - Check without fixing (for CI)

- **Pre-commit Hook**
  - Use existing `.githooks/` system (no Husky needed)
  - Install lint-staged: `npm install --save-dev lint-staged`
  - Configuration in `package.json`
  - Add `.githooks/pre-commit` to run lint-staged
  - Runs appropriate linter based on file type

- **GitHub Actions**
  - Create `.github/workflows/lint.yml`
  - Three parallel jobs: PHP, JavaScript, CSS
  - Uses actions: `actions/checkout`, `shivammathur/setup-php`, `actions/setup-node`
  - Cache Composer and NPM dependencies
  - Annotate PR with errors using problem matchers

**Configuration Files to Add:**
- `phpcs.xml` - PHP_CodeSniffer ruleset
- `.eslintrc.json` - ESLint configuration
- `.stylelintrc.json` - Stylelint configuration
- `.eslintignore` - Files to ignore (ESLint)
- `.stylelintignore` - Files to ignore (Stylelint)
- `.githooks/pre-commit` - Pre-commit hook script (lint-staged)
- `package.json` - New file with lint scripts and lint-staged config

**Benefits:**
- ✅ **Consistency** - All code follows same standards
- ✅ **Quality** - Catch errors before they reach production
- ✅ **Documentation** - JSDoc enforced for all functions
- ✅ **Automated** - No manual checks needed
- ✅ **Fast feedback** - IDE integration catches issues while coding

---

### v14.4.0 ⏳ - Automated Testing with Playwright

**Priority: High**  
**Focus**: End-to-end testing for critical user flows

#### Test Coverage
- **Core User Flows**
  - App initialization and splash screen
  - Week navigation (prev, next, today button)
  - Exercise completion (checkbox interactions)
  - Day completion and modal display
  - Recovery mode activation and completion
  - Sick mode with/without shield
  - Weight/level adjustments
  - Notes/logbook functionality
  - Rep counter (start, count, cooldown, complete)
  - Timer functionality

- **Mobile-Specific Tests**
  - Touch interactions
  - Swipe gestures (if implemented)
  - Responsive layout checks
  - PWA installation flow
  - Offline functionality

- **Edge Cases**
  - Past day confirmation dialogs
  - Empty schedule handling
  - Corrupted localStorage recovery
  - Invalid JSON handling
  - Network errors

#### Playwright Setup
- **Configuration**
  - Test multiple browsers: Chromium, WebKit (Safari), Mobile Safari
  - Local server for tests (DDEV or PHP built-in server)
  - Parallel test execution
  - Screenshot on failure
  - Video recording for debugging
  - Trace viewer for detailed debugging

- **Test Structure**
  - Page Object Model (POM) pattern
  - Reusable fixtures for common setups
  - Helper functions for repetitive actions
  - Mock data for predictable tests
  - localStorage manipulation utilities

#### CI/CD Integration
- **GitHub Actions Workflow**
  - New workflow: `.github/workflows/test.yml`
  - Runs on: Pull requests, pushes to main
  - Matrix testing: Multiple browsers
  - Artifact storage for test results
  - Comment PR with test summary
  - Fail PR if tests fail

- **Local Testing**
  - NPM scripts for easy test running
  - `npm run test` - Run all tests
  - `npm run test:headed` - Run with browser visible
  - `npm run test:debug` - Debug mode
  - `npm run test:report` - Generate HTML report

**Technical Implementation:**

- **Installation**
  - Install Playwright: `npm install --save-dev @playwright/test`
  - Install browsers: `npx playwright install`
  - Initialize config: `npx playwright init`

- **Project Structure**
  ```
  tests/
    ├── e2e/
    │   ├── app-initialization.spec.js
    │   ├── navigation.spec.js
    │   ├── exercise-completion.spec.js
    │   ├── rep-counter.spec.js
    │   ├── recovery-sick-mode.spec.js
    │   └── data-persistence.spec.js
    ├── fixtures/
    │   ├── mock-schedule.json
    │   └── test-helpers.js
    ├── pages/
    │   ├── AppPage.js (Page Object)
    │   └── ScheduleEditorPage.js
    └── playwright.config.js
  ```

- **Configuration File (`playwright.config.js`)**
  - Base URL: `http://localhost:8080` or DDEV URL
  - Timeout: 30 seconds (adjustable for rep counter tests)
  - Retries: 1 (for flaky tests)
  - Screenshots: On failure
  - Videos: On first retry
  - Trace: On first retry

- **GitHub Actions Integration**
  - Start local server (PHP or DDEV)
  - Run Playwright tests
  - Upload test results as artifacts
  - Upload screenshots/videos on failure
  - Generate test report

- **Helper Utilities**: localStorage manipulation, mock schedule setup, common actions

**Coverage Goals:**
- ✅ 80%+ of critical user flows
- ✅ All major features tested
- ✅ Mobile and desktop viewports
- ✅ Multiple browsers (Chromium, WebKit)
- ✅ Regression prevention for major bugs

**Benefits:**
- ✅ **Confidence** - Catch regressions before deployment
- ✅ **Documentation** - Tests serve as usage examples
- ✅ **Faster debugging** - Trace viewer shows exact failure point
- ✅ **Multi-browser** - Ensures cross-browser compatibility
- ✅ **Automated** - No manual testing needed

---

### v14.5.0 ⏳ - renderSchedule() Refactor

**Priority: High**  
**Focus**: Code quality and maintainability - refactor before complex features

**Why Now?**
- Clean foundation before advanced rep counter features (v14.4.0)
- Playwright tests (v14.2.0) provide safety net for refactoring
- Easier to add v15.0.0 overrides to clean, modular code
- 307-line function is too large and handles too many responsibilities
- Quality first: Better to delay rep counter slightly for cleaner codebase

#### Current Problem
- **renderSchedule()**: ~307 lines, handles too many responsibilities
- Mixed concerns: DOM manipulation, business logic, state management
- Difficult to test, maintain, and extend
- Adding new features requires modifying massive function

#### Solution: ScheduleRenderer Class

**Extract into focused methods:**
- `renderNavigation()` - Week navigation logic
- `renderDayCard()` - Single day card
- `renderExercise()` - Exercise rows (normal, alternatives)
- `renderRecoveryDay()` - Recovery mode
- `renderSickDay()` - Sick mode  
- `renderNotes()` - Logbook section
- Helper methods for weight inputs, timers, rep counter chips

**Benefits:**
- ✅ Small, testable methods (< 30 lines each)
- ✅ Clear responsibilities
- ✅ Easier to add rep counter features (v14.4.0)
- ✅ Easier to add overrides (v15.0.0)
- ✅ Easier to add XP badges (v16.0.0)

**Refactoring Strategy:**
1. Extract methods incrementally (test after each)
2. Wrap in ScheduleRenderer class
3. Update app.js to use new class
4. Verify with Playwright tests

---

### v14.6.0 ⏳ - Advanced Rep Counter Features

**Priority: High**  
**Focus**: Complex rep counter enhancements on clean foundation

**Note**: Built on refactored renderSchedule() (v14.3.0) for cleaner integration. These features were originally in v14.0.0 but moved here to ensure proper test coverage (v14.2.0) and clean code foundation (v14.3.0) are in place first.

#### Rep Cooldown Timer Improvements
- **Quick Access Panel During Cooldown**
  - Access day's logbook/notes without aborting rep counter
  - Adjust weight/level settings directly from cooldown screen
  - Swipe or tab interface to access these features
  - Changes saved immediately to storage
  
- **Sleep Prevention Mechanism**
  - Add "Ready?" confirmation button at 10s mark during cooldown
  - Forces user interaction to prevent screen sleep
  - Alternative to background video approach
  - Visual countdown to "Ready?" prompt (60s → 10s → "Ready?")

#### Rep Counting Animation Improvements
- **Timing Adjustment**
  - Count on color change at 50% progress (not at start)
  - First 50% = "Tension" phase
  - Second 50% = "Release" phase
  - More accurate sync with actual movement

- **Visual Progress Indicator: Two-Layer Animated Circle**
  - **Base Layer**: Grey circle (always visible, always 100% complete)
  - **Drawing Layers**: Two circles that alternate between odd/even reps
  - **Moving Ball**: Indicator travels clockwise, leaving colored trace
  
  **Color Schemes:**
  - **Odd Reps (Scheme 1)**: Red → Yellow
    - Tension phase (0° → 180°): Red (#ef4444) - High intensity, effort
    - Release phase (180° → 360°): Yellow (#eab308) - Energy release, completion
  - **Even Reps (Scheme 2)**: Purple → Cyan
    - Tension phase (0° → 180°): Purple (#a855f7) - Focus, intensity
    - Release phase (180° → 360°): Cyan (#06b6d4) - Cool, calm, recovery
  
  **Animation Behavior:**
  - Rep 1: Ball paints red (tension) then yellow (release) over grey base
  - Rep 2: Ball paints purple (tension) then cyan (release) over previous colors
  - Rep 3: Layer 1 resets behind Layer 2, ball paints red/yellow again
  - Pattern continues: Alternating schemes provide clear rep counting
  
  **Benefits:**
  - Always see complete circle (no disappearing/erasing)
  - Clear phase awareness (color changes at 50% mark)
  - Visual rhythm from alternating color schemes
  - Professional, polished animation
  - Ball position shows exact progress within rep

- **Transition Bug Fixes**
  - Add small delay (500-1000ms) after last rep before switching to cooldown
  - Ensure color changes happen simultaneously with content changes
  - Smooth state transitions (rep completion → cooldown start)
  - State machine should handle transition timing
  - Visual feedback should be consistent throughout all state changes
  - Previous issue: Abrupt switch from last rep to cooldown, color/content mismatch

**Why After v14.2.0 (Testing)?**
- Complex state management needs test coverage
- Timing-critical features (10s prompt, 50% progress) need verification
- Tests catch edge cases before they reach production
- Sleep prevention mechanism requires validation
- Animation changes can break existing functionality
- Tests speed up manual testing (no waiting through actual reps)

**Technical Implementation:**

- **Modify `RepCounterStateMachine` to include cooldown states**
  - Add `COOLDOWN_ACTIVE` state
  - Add `COOLDOWN_READY_PROMPT` state (at 10s mark)
  - Add `QUICK_ACCESS_OPEN` state (during cooldown)
  - Transitions: `SET_COMPLETE` → `COOLDOWN_ACTIVE` → `COOLDOWN_READY_PROMPT` → next set or complete

- **Create `QuickAccessPanel` component**
  - Overlay during cooldown (doesn't hide cooldown timer)
  - Three tabs: "Notes" | "Weight/Level" | "Timer Controls"
  - Swipe up to reveal, swipe down to hide
  - Auto-save changes to DomainStorageService
  - Minimal UI, focused on essential controls

- **Update `getRepDelay()` timing system**
  - Return object with phases: `{ upPhase: ms, downPhase: ms }`
  - Count at transition point (50% of total delay)
  - Update schedule.json schema to support phase configuration (optional)
  - Default to equal split if not specified
  - Example: `"delayMilliseconds": {"up": 1500, "down": 1500}` or `3000` (auto-split)

- **Implement two-layer SVG circle animation**
  - **SVG Structure**: 3 circles + 1 ball indicator
    - Base circle: Grey, always 100% visible (#64748b)
    - Odd rep layer: Red/Yellow scheme, z-index alternates
    - Even rep layer: Purple/Cyan scheme, z-index alternates
    - Ball indicator: White dot following circle path
  - **Animation Logic**:
    - Phase 1 (0° → 180°): Tension color, first half of delay
    - Phase 2 (180° → 360°): Release color, second half of delay
    - Use stroke-dasharray/stroke-dashoffset for progressive drawing
    - Animate ball position along circle path (synchronized)
  - **Layer Management**:
    - Odd reps: Draw on Layer A (z-index: 2, front)
    - Even reps: Draw on Layer B (z-index: 2, front)
    - After each rep: Reset inactive layer (behind), swap z-indexes
    - Result: User always sees full circle, no visual resets
  - **Color Transitions**:
    - Hard color switch at 180° (50% progress)
    - Tension → Release color change
    - Alternating schemes provide clear odd/even rep indication

- **Fix rep counter state transitions**
  - Add `REP_COMPLETE` intermediate state
  - Duration: 500-1000ms hold after last rep
  - Synchronize color/content updates (atomic state change)
  - State flow: `COUNTING` → `REP_COMPLETE` → `COOLDOWN_ACTIVE` or `SET_COMPLETE`
  - Visual feedback: Brief "✓" or pulse animation before cooldown

- **Sleep prevention implementation**
  - Countdown timer during cooldown (60s → 10s)
  - At 10s: Show prominent "Ready?" button
  - Button press: Continue to next set
  - No interaction timeout: Show notification, restart countdown (safety)
  - NoSleep.js integration for additional prevention

**Playwright Test Coverage (v14.2.0 provides foundation):**
- Test cooldown timer accuracy
- Verify "Ready?" prompt at 10s
- Test quick access panel interactions
- Verify state persistence during cooldown
- Test rep counting timing (50% mark)
- Verify animation transitions
- Test complete rep counter flow (start → count → cooldown → complete)
- Verify no regression of transition bugs

**Benefits:**
- ✅ **Better workout flow** - No need to abort rep counter for notes/weight
- ✅ **Sleep prevention** - Screen stays active during rest
- ✅ **Accurate timing** - Count matches actual movement (50% transition)
- ✅ **Professional visual feedback** - Two-layer circle with phase colors
- ✅ **Clear rep counting** - Alternating color schemes (red/yellow vs purple/cyan)
- ✅ **Always complete circle** - No disappearing/erasing, grey base always visible
- ✅ **Phase awareness** - Color change at 50% shows tension → release transition
- ✅ **Smooth transitions** - No jarring state changes, layer management behind scenes
- ✅ **Test coverage** - Playwright tests ensure stability

---

### v14.7.0 ⏳ - Streak Feature Rework

**Priority: Medium**
**Focus**: Decouple streak calculation from individual task ticks

#### Current Problem

- Streak is calculated by checking if all exercises are ticked complete
- Adding new exercises to an existing schedule retroactively "uncompletes" past days → breaks streak
- Recovery/sick day behavior is unclear (should maintain streak but not prolong it)
- Tightly coupled to schedule structure changes

#### Proposed Solution

**Decouple streak from task ticks:**
- Store "day completed" as a separate persistent flag in localStorage
- When all exercises for a day are done → mark day as complete
- This flag persists regardless of future schedule changes (new exercises added, etc.)

**Recovery/sick day handling:**
- Recovery days: maintain streak continuity but don't increment counter
- Sick days with shield: maintain streak continuity but don't increment counter
- Result: streak value stays same (doesn't break, doesn't grow)

#### Technical Approach

- Expand `StreakCalculatorService` to be single source of truth
- Add `markDayComplete(dateIso)` method to store completion flag
- Modify `calculateStreak()` to check completion flags instead of deriving from exercise ticks
- Add migration logic for existing data (derive initial flags from current tick state)

#### Benefits

- ✅ Schedule changes don't break historical streaks
- ✅ Clear separation: task completion vs day completion
- ✅ Predictable recovery/sick day behavior
- ✅ Reusable in XP system (v16.0.0)
- ✅ Testable without full schedule context

---

### v15.0.0 - Dynamic Rep/Set Management

**Priority: High**  
**Focus**: Remove need to edit JSON files for Rep/Set adjustments

#### In-App Rep/Set Editor
- **UI for Exercise Configuration**
  - Add "Edit Exercise" button in schedule view
  - Modal with fields:
    - Current Rep/Set
    - Target Rep/Set (for auto-progression)
  - Only affects future instances, preserves history
  
- **Auto-Progression Feature**
  - When exercise completed X times at current weight, suggest increase
  - When exercise consistently completed at target reps/sets, suggest adjustment
  - User can accept/decline/adjust suggestion
  - Configurable progression rules per exercise type
  - **Note**: Check both weight progression AND reps/sets progression during implementation
  
- **Override System**
  - Overrides stored in localStorage with priority over schedule.json
  - Schedule.json remains base template
  - Overrides exportable/importable with other data

**Technical Implementation:**
- Create `ExerciseOverrideService` module
- Add new storage keys: `EXERCISE_OVERRIDE_PREFIX`
- Extend DomainStorageService with override methods
- Create modal UI for exercise editing
- Add methods to get/set rep and set overrides
- Modify exercise rendering to check overrides first before using schedule.json values
- Add override indicator in UI (e.g., "⚙️" icon showing exercise has custom reps/sets)

**Migration Path:**
- Existing data unaffected
- Overrides layer on top of existing schedule configuration
- Can reset to schedule defaults anytime

---

### v16.0.0 - XP & Progression System

**Priority: Medium**  
**Focus**: Gamification and schedule lifecycle management

#### XP System
- **Points & Progress**
  - Award XP for each completed task (exercise, recovery activity, hydration)
  - Progressive XP bar at top of app
  - Silent XP removal if task unchecked (no penalties shown)
  - No actual numerical values displayed - just visual progress
  - Satisfying fill animations

- **Level Up Mechanics**
  - Target: Level up on Sundays when schedule becomes "old"
  - Schedule includes optional `targetDate` field (ISO 8601)
  - If no `targetDate`: Default to 4 weeks from schedule start
  - Level up triggers when:
    - Current date ≥ targetDate
    - XP bar full (or close to full)
  - Post-levelup: XP continues to accumulate but no further levels
  - Sunday reminder if level full: "🎉 Time to create a new schedule!"

- **XP Calculation Algorithm**
  - Total XP needed = Days until targetDate × Exercises per day (avg)
  - XP per task = Total XP / Total tasks
  - Ensures bar fills naturally over schedule duration
  - Accounts for sick days, recovery days (fewer tasks)

#### Level Up Survey
- **Survey Modal (triggered on level up)**
  - "💪 Schedule Complete! How did it go?"
  - Questions:
    1. "What exercises felt easy?" (checkboxes with schedule exercises)
    2. "What exercises were challenging?" (checkboxes)
    3. "Any injuries or discomfort?" (free text)
    4. "Overall satisfaction" (1-5 stars)
    5. "Additional notes" (free text)
  
- **Weight Change Summary**
  - Automatic section: "Weight Progression"
  - Lists all exercises with weight changes
  - Format: `Exercise: Start → End (±change)`
  - Pulled from weight history

- **AI-Friendly Export**
  - "Copy for AI Assistant" button
  - Structured markdown format:
    ```markdown
    # Training Schedule Review
    **Period**: YYYY-MM-DD to YYYY-MM-DD (X weeks)
    **Completion**: X% of scheduled workouts
    
    ## Easy Exercises
    - Exercise 1
    - Exercise 2
    
    ## Challenging Exercises
    - Exercise 3 (Notes: ...)
    
    ## Weight Progression
    - Bench Press: 40kg → 50kg (+10kg)
    - Squats: 60kg → 75kg (+15kg)
    
    ## Injuries/Discomfort
    [User notes]
    
    ## Overall Satisfaction
    ⭐⭐⭐⭐⭐
    
    ## Additional Notes
    [User notes]
    ```
  - Copied to clipboard for pasting into AI assistant (Gemini, ChatGPT, etc.)
  - Helps AI generate next schedule with appropriate progressions

**Technical Implementation:**
- Create `XPService` module with calculation logic
- Add `targetDate` to schedule schema v2 (optional field, strongly recommended)
  - Validator shows warning if omitted
  - App uses 4-week default if not present
- Update validator to support v2 schema
  - Check version field
  - Validate targetDate format (if present)
  - Warn (not error) if targetDate missing
- Store XP progress in localStorage via DomainStorageService
- Create level-up survey modal component
- Generate weight change report from weight history
- Implement clipboard API for survey export
- Add reminder system for Sunday level-up prompts
- Schedule editor pre-fills targetDate field (start date + 4 weeks)

**Schema Changes (v2):**
```json
{
  "version": 2,
  "targetDate": "2026-02-15T23:59:59Z",
  "days": [ ... ]
}
```

**Field Specifications:**
- `version`: **Required**, must be `2`
- `targetDate`: **Optional but STRONGLY RECOMMENDED**
  - ISO 8601 datetime string
  - When schedule should be reviewed/leveled up
  - Default: Schedule start date + 4 weeks (if omitted)
  - Recommendation: Set explicitly based on your training plan (typically 4-8 weeks)
  
**Validator Behavior:**
- ✓ Valid if targetDate present
- ⚠️ Warning if targetDate omitted: "Using 4-week default, consider setting explicitly"

**Schedule Editor:**
- Field pre-filled with "start date + 4 weeks"
- User can adjust before saving
- Clear label: "Review/Level-Up Date (recommended)"

**Migration from v1 to v2:**
- **No migration needed!** v1 schedules work forever
- v1 behavior: `targetDate = startDate + 4 weeks` (computed automatically)
- v2 behavior: `targetDate = schedule.targetDate ?? startDate + 4 weeks`
- Both produce same result if v2 omits targetDate
- Users can keep v1 schedules indefinitely or upgrade to v2 when creating new ones

---

### v17.0.0 - Schedule Management Refactoring (Phase 1)

**Priority: High**  
**Focus**: Privacy-first architecture with smooth transition

**Note**: This is Phase 1 - localStorage implementation with fallback. Repository cleanup happens in v17.1.0 or v18.0.0.

#### Core Changes
- **localStorage Schedule Management**
  - Upload schedules via in-app UI
  - Store schedules in localStorage with versioning
  - Multiple schedules support (archive old schedules)
  - Schedule selection dropdown
  - Active schedule indicator

- **Smooth Transition Fallback**
  - If no schedules in localStorage → Load from webspace (`/trainings/*.json`)
  - Automatically imports existing schedule on first load
  - Saves imported schedule to localStorage
  - Seamless transition for existing user (no manual export/import needed)
  - Schedules remain in repository during v17.0.0 for compatibility

- **Repository Status (v17.0.0)**
  - **Keep** all `schedule-*.json` files in `/trainings/` directory
  - Keep `schema-schedule-v*.json` and `template-schedule.json`
  - Schedules serve as fallback during transition
  - Note: Repository cleanup planned for v17.1.0 or v18.0.0

#### Upload & Validation System

- **Schedule Upload UI**
  - File upload button in settings/menu
  - Drag & drop support for desktop
  - Validates against schema before accepting
  - Shows validation errors with helpful messages
  - Preview schedule before confirming upload

- **Client-Side Validation (JavaScript)**
  - Validate JSON structure against schema
  - Check version compatibility (v1, v2 support)
  - Verify required fields (days, exercises, dates)
  - Exercise ID uniqueness validation
  - dayIndex validation (0-6, Sunday-Saturday)
  - Date format validation (YYYY-MM-DD for filenames)
  - Detailed error reporting with line numbers
  
- **Server-Side Validation (PHP) - Optional**
  - Backup validation endpoint for security
  - Same validation rules as client
  - Returns structured error JSON
  - Used when uploading via tools.php or API

#### Enhanced Schedule Editor

- **Improved Editor Integration**
  - Direct integration with localStorage schedules
  - No need to manually copy JSON anymore
  - Edit active schedule in-app
  - Save changes directly to localStorage
  - Export edited schedule as JSON file (download)

- **Schedule Management Features**
  - List all stored schedules with metadata:
    - Schedule name/date
    - Version (v1/v2)
    - Created date
    - Last modified
    - Active status
  - Set active schedule
  - Archive/delete old schedules
  - Duplicate schedule (create variant)
  - Import schedule from file
  - Export schedule to file

- **Enhanced Editor Features**
  - Better autocomplete for exercise IDs (shows existing exercises across all schedules)
  - Inline validation as you type
  - Visual schema violation indicators
  - Exercise library browser (see all exercises used in past schedules)
  - Template selector (start from template or existing schedule)

#### Privacy Benefits

- **Personal Data Stays Local**
  - Workout plans not visible in public repository
  - No personal training details in commit history
  - Other users can fork without seeing your schedule
  - Easy to keep multiple private schedules

- **Deployment Improvements**
  - Faster deployments (no schedule JSON changes)
  - Cleaner git history (code changes only)
  - Easier to contribute code improvements
  - Repository focuses on app functionality

#### Multi-User Readiness

- **Fork-Friendly**
  - New users get clean app without personal data
  - Upload their own schedules after setup
  - No confusion about example vs real schedules
  - README can include sample schedule for testing

- **Demo Mode**
  - App loads with sample/demo schedule if none found
  - Prompt to upload own schedule
  - Clear instructions for first-time users
  - Sample schedule shows all features

**Technical Implementation:**

- **ScheduleStorageService Module**
  - New module: `modules/schedule-storage-service.js`
  - Methods:
    - `uploadSchedule(jsonString)` - Validate and store schedule
    - `getActiveSchedule()` - Retrieve current active schedule
    - `listSchedules()` - Get all stored schedules metadata
    - `setActiveSchedule(scheduleId)` - Switch active schedule
    - `deleteSchedule(scheduleId)` - Remove schedule
    - `exportSchedule(scheduleId)` - Generate JSON for download
    - `validateSchedule(jsonObj)` - Client-side validation
  - Storage keys: `schedule_active`, `schedule_list`, `schedule_data_{id}`

- **Schedule Validator**
  - JavaScript validator using schema file
  - Load schema from `/trainings/schema-schedule-v*.json`
  - Comprehensive validation with error details
  - Support for v1 and v2 schemas
  - Extensible for future schema versions

- **Upload UI Component**
  - Modal/page for schedule upload
  - File picker with drag & drop
  - JSON validation preview
  - Error display with corrections
  - Success confirmation

- **Schedule Manager UI**
  - List view of all schedules
  - Active schedule highlighted
  - Quick actions: Activate, Edit, Export, Delete
  - Search/filter schedules by date/name
  - Storage space indicator

- **Modified Schedule Loading**
  - Update `fetchScheduleForDate()` to check localStorage first
  - Fallback to webspace (`/trainings/*.json`) if localStorage empty
  - Automatically import webspace schedule to localStorage on first load
  - Error handling for corrupted schedule data
  - Automatic validation on load
  - Seamless transition: Existing user sees no difference on first load

- **Enhanced Schedule Editor**
  - Integrate with ScheduleStorageService
  - Load from localStorage, save back to localStorage
  - Download button generates JSON file
  - Upload button to import schedules
  - Autocomplete backed by localStorage schedule library

- **Repository Cleanup (v17.1.0 or v18.0.0)**
  - Phase 2: Remove `schedule-2025-*.json` and `schedule-2026-*.json`
  - Keep `template-schedule.json` as reference
  - Keep `schema-schedule-v*.json` for validation
  - Add updated onboarding screen:
    - Prompt to upload schedule.json
    - Option to use example.json
    - Clear instructions for first-time users
  - Update README with new upload instructions
  - Add sample schedule to documentation (not in trainings/)

**Schema Validation Rules:**

```javascript
// Required fields
{
  "version": 1 or 2,
  "days": [ /* array of day objects */ ]
}

// Optional fields (v2)
{
  "targetDate": "ISO 8601 datetime"
}

// Day object validation
{
  "id": "string (unique, lowercase, underscores)",
  "dayIndex": 0-6, // 0=Sunday, 6=Saturday
  "name": "string",
  "theme": "string",
  "icon": "string (lucide icon name)",
  "colorClass": "string (tailwind class)",
  "bgClass": "string (tailwind class)",
  "details": [ /* exercise array */ ]
}

// Exercise validation
- Valid types: "warmup", "main", "cool", "alternatives"
- Required fields based on type
- Optional fields: timers, weight, defaultUnit, repCounter
- ID uniqueness within day
```

**Demo/Sample Schedule:**

- Include lightweight demo schedule in documentation
- Shows all exercise types
- 1-week example (not 4+ weeks)
- Clearly marked as example/demo
- Not loaded from repository
- Used only if localStorage empty on first launch

**Breaking Changes:**

- ⚠️ **v17.0.0**: No breaking changes! Smooth transition with fallback
  - localStorage preferred, webspace schedules as fallback
  - Existing user: No action needed, automatic import on first load
  - New users: Can upload schedules or use webspace fallback
- ⚠️ **v17.1.0/v18.0.0**: Repository schedules removed (breaking)
  - Must have schedule in localStorage or upload one
  - Onboarding screen guides new users
  - Demo/example schedule available

**Migration Steps (for solo user):**

**v17.0.0 - Automatic & Seamless:**
1. Deploy v17.0.0 to production
2. On first load:
   - App checks localStorage (empty)
   - Loads from webspace `/trainings/schedule-*.json`
   - Automatically imports to localStorage
   - Saves as active schedule
3. Everything works as before - no manual intervention needed!
4. Optionally: Use new upload UI to add more schedules

**v17.1.0/v18.0.0 - Repository Cleanup:**
1. Ensure schedule is in localStorage (already done in v17.0.0)
2. Delete schedule JSON files from repository
3. Update onboarding for new users
4. Commit and push cleanup

**Benefits:**

- ✅ **Privacy**: Personal workout data stays local
- ✅ **Clean Repository**: Only code and docs in version control
- ✅ **Multi-User**: Others can fork and use immediately
- ✅ **Flexibility**: Switch schedules, archive old ones, experiment freely
- ✅ **Faster Deployments**: No schedule JSON changes to deploy
- ✅ **Better UX**: In-app schedule management vs file editing

---

## 🎯 Feature Prioritization & Rationale

### High Priority (v14.x, v15, v17)
**Rep Counter Enhancements**, **Code Quality**, **Testing**, **Dynamic Rep/Set Management**, and **Schedule Management Refactoring** are high priority because:

**v14.0 - Rep Counter Basics:**
1. **Immediate UX improvements** - Basic rep counter functionality
2. **Foundation features** - Navigation, modals, editor support
3. **Quick wins** - Features that don't require complex state management

**v14.1 - Linting:**
1. **Code quality** - Consistent standards across entire codebase
2. **Maintainability** - Easier to onboard contributors (or future self)
3. **Bug prevention** - Catch errors before they reach production
4. **Documentation** - Enforced JSDoc ensures code is self-documenting
5. **Fast feedback** - IDE integration catches issues immediately

**v14.2 - Testing:**
1. **Confidence** - Deploy without fear of breaking existing features
2. **Regression prevention** - Automated tests catch breaking changes
3. **Documentation** - Tests serve as executable documentation
4. **Faster development** - Less manual testing needed
5. **Foundation** - Required before major refactorings (v14.3, v15-v17)

**v14.3 - Advanced Rep Counter:**
1. **Complex state management** - Requires test coverage from v14.2
2. **Timing-critical features** - 10s prompts, 50% progress timing
3. **Sleep prevention** - Mission-critical for workout safety
4. **Animation refinements** - Visual polish with regression protection

**v15 - Dynamic Management:**
1. **Remove friction** - No JSON editing for common adjustments
2. **Progressive overload** - Built-in support for training progression
3. **Flexibility** - Quick adjustments without breaking base schedule

**v17 - Schedule Management:**
1. **Privacy-first** - Personal workout data stays out of public repository
2. **Architecture shift** - Enables true multi-user functionality
3. **Deployment efficiency** - Faster, cleaner deployments without schedule changes
4. **Foundation for future** - Required before considering any multi-user features

### Medium Priority (v16)
**XP System** is medium priority because:
1. **Nice-to-have gamification** - Not blocking current functionality
2. **Complex implementation** - Requires schema changes and new systems
3. **Schedule lifecycle** - Useful but not urgent (current schedule workflow functions)
4. **AI integration** - Innovative but experimental feature
5. **Depends on v15** - Overrides system provides foundation for auto-progression

### Version Ordering Rationale

**Why linting and testing before features?**
- Code quality and testing should come before major features
- Linting ensures consistent code standards before refactoring
- Tests prevent regressions during v15-v17 development

**Why v17 after v16?**
- v16 (XP system) works with current architecture
- v17 is a breaking architectural change
- Clean separation: v16 = features, v17 = architecture

---

## 🔧 Technical Considerations

### Performance
- XP calculations should be cached (recalculate only on data changes)
- SVG animations use CSS transforms (GPU-accelerated)
- Quick access panel: Lazy load, only when opened

### Storage
- Overrides and XP data add ~5-10KB per schedule
- Still well within localStorage limits (5-10MB)
- Include in export/import functionality

### Backward Compatibility
- Schema v1 schedules continue to work indefinitely (no migration needed)
  - v1 schedules automatically use 4-week default for targetDate calculation
  - XP system works with v1 schedules using computed targetDate
  - No need to update existing schedules to v2
- Schema v2 is opt-in for explicit targetDate control
- XP system disabled if schedule too old (beyond computed targetDate)
- Overrides don't affect users who don't use the feature

### Testing
- Rep counter timing: Debug mode with adjustable delays
- XP calculation: Verify bar fills naturally over 4-week period
- Survey export: Test clipboard API on iOS Safari, Chrome

---

## 📱 Mobile Optimization

All features optimized for iPhone/PWA:
- Touch-friendly buttons (min 44×44px)
- Swipe gestures for quick access panel
- Haptic feedback on XP gain (if available)
- Portrait-first design (landscape secondary)

---

## 🚀 Implementation Order

1. **v14.0.0 - Part 1**: Rep cooldown quick access (2-3 days)
2. **v14.0.0 - Part 2**: Rep animation improvements (1-2 days)
3. **v15.0.0**: Dynamic rep/set management (3-4 days)
4. **v16.0.0 - Part 1**: XP system core (4-5 days)
5. **v16.0.0 - Part 2**: Level up survey & AI export (2-3 days)

**Total estimated effort**: 12-17 development days (2-3 weeks of actual calendar time)

---

## 📝 Notes

- All features maintain privacy-first approach (localStorage only)
- No breaking changes to existing data
- Export/import includes all new data types
- German UI text, English code/comments
- Follows WordPress coding standards
- Full JSDoc documentation required

### GitHub Actions Architecture

**Current Structure:**
- Each validation check has its own workflow file for better reusability and maintainability
- Files located in `.github/workflows/`:
  - `validate-conventional-commits.yml` - Commit message format validation
  - `pr-validation.yml` - Version bump and CHANGELOG checks
  - `pr-summary.yml` - AI-generated PR summaries

**Benefits:**
- ✅ **Modular** - Each check is independent
- ✅ **Reusable** - Workflows can be reused across projects
- ✅ **Maintainable** - Easy to update/debug individual checks
- ✅ **Clear separation** - Each file has single responsibility
- ✅ **Faster debugging** - Failed checks are immediately identifiable

**Future Additions:**
- Schedule JSON validation workflow (when implementing v16.0.0 schema v2)
- Automated changelog generation workflow
- Release automation workflow

---

## 🗂️ Backlog - Code Quality & Refactoring

**Note:** The two major refactoring tasks (renderSchedule and calculateStreak) have been scheduled in the v14.x cycle:
- ✅ **renderSchedule() Refactor** → Scheduled for v14.3.0
- ✅ **calculateStreak() Refactor** → Scheduled for v14.5.0

This section is now empty but reserved for future refactoring tasks that arise during development.

---

## 📅 Backlog - User Features

### Server-Side Storage & Sync

**Goal:** Enable data synchronization across devices without user accounts (initially)

**Overview:**
- Simple storage ID system (paste ID to connect)
- If storage ID exists on server → load that data
- If new ID → create new storage on server
- Polling for changes (default: 15s, configurable via `.env`)
- No authentication required initially (storage ID = access)
- Later: Store schedules in same system, add real auth/login

**Current Storage (localStorage):**
- Exercise completion: `body_refactoring_v1_{date}_{exerciseId}`
- Notes: `body_refactoring_note_{date}`
- Weights: `body_refactoring_weight_{exerciseId}_{date}`
- Units: `body_refactoring_unit_{exerciseId}`
- Sick/Recovery: `body_refactoring_sick_{date}_*`, `body_refactoring_recovery_{date}`
- Shields: `body_refactoring_shields`, `body_refactoring_shields_awarded`
- Mode: `body_refactoring_mode`

**Backend (PHP REST API):**
```
/api/
├── index.php          # Router
├── storage.php        # Storage endpoints
└── .htaccess          # Route to index.php

Endpoints:
GET    /api/storage/{id}           # Get all data for storage ID
PUT    /api/storage/{id}           # Update/create storage
GET    /api/storage/{id}/version   # Get last modified timestamp
DELETE /api/storage/{id}           # Delete storage (optional)
```

**Data Storage (flat-file initially):**
```
/data/storage/
├── abc123.json
├── xyz789.json
└── ...
```
Or SQLite for more robustness.

**Frontend (JavaScript):**
- New module: `assets/js/modules/sync-service.js`
- `SyncService` class with methods:
  - `connect(storageId)` - Set ID, fetch initial data
  - `push()` - Upload local → server
  - `pull()` - Download server → local
  - `checkForUpdates()` - Poll for version changes
  - `startPolling()` / `stopPolling()`

**UI Changes (Burger Menu):**
```html
<div class="border-t border-slate-700">
  <div class="px-4 py-2 text-xs text-slate-500">Cloud Sync</div>
  <input type="text" placeholder="Storage ID..." />
  <button>Verbinden</button>
  <div id="sync-status"><!-- Status indicator --></div>
</div>
```

**Configuration (.env):**
```
SYNC_ENABLED=true
SYNC_POLL_INTERVAL=15000
SYNC_API_URL=/api/storage
```

**Conflict Resolution (simple):**
- Server wins on pull (overwrites local)
- Or: merge by timestamp per key (more complex, phase 2)

**Security Considerations (MVP):**
- Storage IDs should be UUIDs (hard to guess)
- Rate limiting on API
- HTTPS required
- No sensitive data stored (just exercise completion)
- Later: proper auth tokens

**Implementation Phases:**

| Phase | Scope | Effort |
|-------|-------|--------|
| 1 | Backend API + flat-file storage | 1-2 days |
| 2 | SyncService module + basic UI | 1-2 days |
| 3 | Polling + conflict handling | 1 day |
| 4 | Schedule sync (store schedules server-side) | 1 day |
| 5 | Auth/login system | 2-3 days |

**Benefits:**
- ✅ Cross-device sync without user accounts (phase 1)
- ✅ Simple "paste ID" workflow
- ✅ Privacy: Only person with ID can access
- ✅ Foundation for future multi-user features
- ✅ Schedules can sync too (phase 4)

**Dependencies:**
- Should come after v17.0.0 (Schedule Management Refactoring)
- Builds on existing `StorageService.exportAll()` / `importAll()`

---

---

### Decision Guidelines for Future Backlog Items

**When to schedule a refactoring:**
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

---

**Last Updated**: January 21, 2026
**Current Stable Release**: v14.2.8
**Development Cycle**: v14

