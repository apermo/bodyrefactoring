# Body Refactoring - Planned Features & Roadmap

This document outlines planned features and improvements for the Body Refactoring app.

## 📋 Feature Roadmap

### v14.0.0 - Rep Counter Enhancements

**Priority: High**  
**Focus**: Improved rep counter usability and interaction during workouts

#### ✅ Navigation Improvements
- **"Today" Button in Week Navigation**
  - Appears in week navigation bar (right side of week display)
  - Only visible when viewing a week other than current week
  - Quick jump back to today's date
  - Keeps week display centered as long as space available
  - Mobile-optimized placement (doesn't interfere with week arrows)

#### ✅ Sick/Recovery Completion Modal
- **Subdued Completion Celebration**
  - Modal appears when completing sick/recovery day
  - Less celebrational tone than normal streak modal
  - Shows updated streak status (maintained/paused)
  - Different visual style:
    - Softer colors (blues/purples instead of bright colors)
    - Calmer messaging ("Taking care of yourself" vs "Great job!")
    - Reduced confetti (75 particles vs 100, 75% of normal)
    - Recovery icon (🩹 or 💊) instead of trophy/medal
  - Acknowledges effort while respecting recovery state
  - Quick dismiss (no excessive celebration)

#### ✅ Schedule Editor: Rep Counter Support
- **Simple JSON Input Field**
  - Added rep counter configuration to exercise editor
  - Same approach as existing timer configuration
  - JSON format: `{"sets": 3, "reps": 12, "restSeconds": 60, "delayMilliseconds": 3000}`
  - All fields optional but recommended for complete rep counter functionality
  - Validates JSON on save
  - Makes it easy to add/edit rep counter without manual JSON file editing
  - Note: Full editor refactoring planned for v17.0.0


**Technical Implementation:**
- ✅ Add "Today" button to week navigation component
  - Conditionally render based on `currentWeekOffset !== 0`
  - Position: Right side of week display (after week text)
  - Button style: Minimal, icon-based (🏠 or 📅 icon)
  - Click handler: Reset week offset to 0, reload current day view
- ✅ Update week navigation layout:
  - Use flexbox with space-between for arrows, week text, and today button
  - Keep week text centered when today button not visible
  - Adjust layout for mobile (ensure touch targets are 44x44px minimum)
- ✅ State management:
  - Track current week offset in app state
  - Compare against today's date to determine button visibility
  - Smooth transition animation when jumping to today
- ✅ Create sick/recovery completion modal component
  - Separate modal styles for sick vs recovery mode
  - Reduced confetti configuration (particleCount: 50, spread: 40, 50% of normal)
  - Custom messaging based on mode:
    - Sick: "Ruhe dich gut aus 💊" / "Rest and recover"
    - Recovery: "Gut gemacht, sanft erholt 🩹" / "Well done, gentle recovery"
  - Display current streak status with context
  - Icon selection: 🩹 for recovery, 💊 for sick
  - Softer color palette (blues, purples, muted tones)
  - Quick fade-out after 2-3 seconds (vs 5+ for normal modal)
- ✅ Modified checkDayCompletion() to async function
  - Detects recovery/sick days using domainStorage
  - Calculates streak before showing modal
  - Routes to appropriate modal based on day type
- ✅ Schedule Editor: Rep Counter Field
  - Added textarea input for rep counter JSON (id: ex-repcounter)
  - Parses and validates JSON on exercise save
  - Saves repCounter object to exercise data
  - Simple implementation - full editor refactoring in v17.0.0

---

### v14.1.0 - Linting & Code Quality

**Priority: High**  
**Focus**: Automated code quality enforcement and consistency

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
  - Husky + lint-staged configuration
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
  - Install Husky: `npx husky install`
  - Install lint-staged: `npm install --save-dev lint-staged`
  - Configuration in `package.json`
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
- `.husky/pre-commit` - Pre-commit hook script
- `package.json` - Updated with lint scripts and lint-staged config

**Benefits:**
- ✅ **Consistency** - All code follows same standards
- ✅ **Quality** - Catch errors before they reach production
- ✅ **Documentation** - JSDoc enforced for all functions
- ✅ **Automated** - No manual checks needed
- ✅ **Fast feedback** - IDE integration catches issues while coding

**Estimated Effort:** 2-3 days
- Setup linters and configurations (1 day)
- CI/CD integration and testing (0.5 day)
- Fix existing violations (0.5-1 day)
- Documentation (0.5 day)

---

### v14.2.0 - Automated Testing with Playwright

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

#### Test Examples

**Basic Flow Test:**
```javascript
test('complete exercise and see day completion', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('#schedule-container');
  
  // Open today's card
  const today = await page.locator('.day-active');
  await today.click();
  
  // Complete first exercise
  const firstExercise = await page.locator('.exercise-row').first();
  await firstExercise.locator('.check-circle').click();
  
  // Verify confetti (canvas element)
  await expect(page.locator('canvas')).toBeVisible();
});
```

**Rep Counter Test:**
```javascript
test('rep counter completes set and shows cooldown', async ({ page }) => {
  await page.goto('/');
  
  // Start rep counter
  await page.click('.timer-chip:has-text("3 x 12")');
  
  // Wait for countdown (5,4,3,2,1,Los)
  await page.waitForSelector('text=Los', { timeout: 10000 });
  
  // Rep counter should be visible
  await expect(page.locator('#rep-modal')).toBeVisible();
  
  // Wait for first set to complete
  await page.waitForSelector('text=60s Pause', { timeout: 40000 });
  
  // Cooldown timer should be visible
  await expect(page.locator('text=60s Pause')).toBeVisible();
});
```

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

- **Helper Utilities**
  ```javascript
  // tests/fixtures/test-helpers.js
  export async function clearLocalStorage(page) {
    await page.evaluate(() => localStorage.clear());
  }
  
  export async function setMockSchedule(page, schedule) {
    await page.evaluate((data) => {
      localStorage.setItem('schedule_active', 'mock-schedule');
      localStorage.setItem('schedule_data_mock-schedule', JSON.stringify(data));
    }, schedule);
  }
  
  export async function completeExercise(page, exerciseSelector) {
    await page.locator(exerciseSelector).locator('.check-circle').click();
    await page.waitForTimeout(500); // Wait for confetti
  }
  ```

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

**Estimated Effort:** 3-4 days
- Playwright setup and configuration (0.5 day)
- Write core flow tests (1.5 days)
- Page Object Model setup (0.5 day)
- CI/CD integration (0.5 day)
- Documentation (0.5 day)

---

### v14.3.0 - renderSchedule() Refactor

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

**Estimated Effort:** 2-3 days

---

### v14.4.0 - Advanced Rep Counter Features

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
  - Second 50% = "Relax" phase
  - More accurate sync with actual movement

- **Visual Progress Indicator**
  - Animated circle with moving dot (clockwise)
  - Odd reps: Draw circle progressively
  - Even reps: Erase circle progressively
  - Color coding:
    - "Up" phase: Blue/cyan
    - "Down" phase: Green
    - Creates visual rhythm matching exercise tempo

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

- **Implement SVG circle animation**
  - Use stroke-dasharray/stroke-dashoffset for progressive drawing
  - Clockwise motion (0deg → 360deg)
  - Odd reps: Draw (dashoffset decreases)
  - Even reps: Erase (dashoffset increases)
  - Color transition: Blue (up) → Green (down)
  - Smooth CSS transitions

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
- ✅ **Accurate timing** - Count matches actual movement
- ✅ **Visual feedback** - Progress indicator shows rhythm
- ✅ **Smooth transitions** - No jarring state changes
- ✅ **Test coverage** - Playwright tests ensure stability

**Estimated Effort:** 4-5 days
- State machine enhancement (1 day)
- Quick access panel UI (1 day)
- Animation system (1 day)
- Timing and transitions (0.5 day)
- Testing and refinement (1 day)
- Documentation (0.5 day)

---

### v14.5.0 - calculateStreak() Refactor

**Priority: Medium**  
**Focus**: Clean up streak calculation logic and improve testability

**Why Now?**
- Current implementation works but mixes concerns (calculation + DOM)
- Playwright tests (v14.2.0) provide safety net
- v16.0.0 XP system will need streak data
- Good time to refactor between feature development cycles
- StreakCalculatorService already exists but is underutilized

#### Current Problem
- **calculateStreak()**: ~130 lines, handles too many responsibilities
- Mixed concerns: Calculation logic + DOM updates
- Streak calculation + Shield awarding + Display updates
- Difficult to test without full DOM
- Async with await in loop (performance consideration)

#### Solution: Expand StreakCalculatorService

**Current State:**
- `StreakCalculatorService` exists in `modules/streak-calculator-service.js`
- Currently only has `getDayCount()` helper
- Underutilized - should be single source of truth for streak logic

**Enhance to Include:**
- `calculate()` - Main calculation, returns streak data object (no DOM)
- `isDayCountable()` - Check if day counts (normal/recovery/sick with shield)
- `checkShieldMilestone()` - Shield awarding logic
- Separate display updates to app.js or new `StreakDisplayService`

**Benefits:**
- ✅ Pure calculation separated from display
- ✅ Testable without DOM
- ✅ Reusable in XP system (v16.0.0)
- ✅ Better performance (can cache results)
- ✅ Single source of truth for streak logic

**Refactoring Strategy:**

**Phase 1: Extract Pure Calculation** (0.5 day)
- Move calculation logic to StreakCalculatorService.calculate()
- Return data object: `{ streak, weekCounter, shields }`
- Keep shield awarding logic separate

**Phase 2: Separate Display** (0.5 day)
- Extract DOM updates from calculateStreak()
- Create `updateStreakDisplay(streakData)` function
- Keep in app.js or create StreakDisplayService

**Phase 3: Shield Management** (Optional, 0.5 day)
- Consider separate `ShieldService` for shield logic
- Or keep in StreakCalculatorService
- Depends on complexity

**Technical Implementation:**

- **Enhance StreakCalculatorService:**
  ```javascript
  class StreakCalculatorService {
    constructor(domainStorage, state) {
      this.domainStorage = domainStorage;
      this.state = state;
    }

    async calculate() {
      // Pure calculation logic
      // Returns: { streak, weekCounter, shieldsAwarded }
    }

    isDayCountable(dateIso, dayData) {
      // Check normal/recovery/sick with shield
    }

    checkShieldMilestone(weekCounter, awardedMilestones) {
      // Shield awarding logic
    }
  }
  ```

- **Update app.js:**
  ```javascript
  async function calculateStreak() {
    const streakData = await streakCalculator.calculate();
    updateStreakDisplay(streakData);
  }

  function updateStreakDisplay(streakData) {
    // All DOM updates here
    // streak-container, streak-count, modal-streak
    // shield display updates
  }
  ```

**Benefits for v16.0.0 (XP System):**
- XP system can call `streakCalculator.calculate()` for data
- No DOM coupling
- Reusable streak logic
- Clean integration

**Estimated Effort:** 1-2 days
- Expand StreakCalculatorService (0.5 day)
- Refactor calculateStreak to use service (0.5 day)
- Separate display logic (0.5 day)
- Testing with Playwright (0.5 day)

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

**Estimated Effort:** 5-7 days
- ScheduleStorageService module (1 day)
- Schedule validator (1 day)
- Upload UI (1 day)
- Schedule manager UI (1 day)
- Enhanced editor integration (1-2 days)
- Testing and validation (1-2 days)

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

**Why v14.1 and v14.2 before v15?**
- Code quality and testing should come before major features
- Linting ensures consistent code standards before refactoring
- Tests prevent regressions during v15-v17 development
- Establishes quality baseline for future work
- Relatively quick to implement (5-7 days total)

**Why v17 after v16 (not before)?**
- v16 (XP system) still works with repository-based schedules
- v17 is a breaking architectural change
- Allows v16 to be developed/tested with current architecture
- Clean separation: v16 = features, v17 = architecture
- v17 makes sense after "schedule complete" workflow exists (v16)

**Development Sequence:**
1. v14.0: Core features (rep counter basics, modals, navigation) ✅ COMPLETE
2. v14.1: Code quality foundation (linting) - 2-3 days
3. v14.2: Safety net (automated testing) - 3-4 days  
4. v14.3: Clean code (renderSchedule refactor) - 2-3 days
5. v14.4: Complex features (advanced rep counter) - 4-5 days
6. v14.5: Final cleanup (calculateStreak refactor) - 1-2 days
7. v15.0: Dynamic features (rep/set management) - 3-4 days
8. v16.0: Gamification (XP system) - 6-8 days
9. v17.0: Architecture shift (localStorage schedules) - 5-7 days

**v14.x Total Effort:** ~12-17 days (quality-first approach)
**Rationale:** Build solid foundation before major features

---

## 💡 Suggested Adjustments

### Rep Counter Cooldown Access
**Original**: Access log and weight during cooldown  
**Adjustment**: Add minimal overlay with quick actions:
- Keep cooldown timer visible (top)
- Swipe up to reveal quick access panel (bottom 2/3 of screen)
- Three tabs: "Notes" | "Weight" | "Timer"
- Changes auto-save, no "Save" button needed

**Reasoning**: Full screen transitions would be jarring during workout flow. Overlay maintains context.

### Rep Animation Timing
**Original**: Count at 50% color change  
**Adjustment**: Implement as described, but add option to adjust timing in debug mode
- Default: Count at 50%
- Debug: Adjustable from 0-100% (testing different movement patterns)

**Reasoning**: Different exercises have different tempo. Flexibility helps tune for optimal sync.

### XP System
**Original**: Silent XP removal on untick  
**Adjustment**: Add subtle undo notification (3 seconds, bottom of screen)
- "Exercise unchecked (-XP)" with "Undo" button
- Disappears after 3s or on undo
- Doesn't block workflow but provides feedback

**Reasoning**: Completely silent removal might feel like a bug. Subtle notification confirms action.

### Level Up Frequency
**Original**: Level up when schedule old  
**Adjustment**: Add flexibility:
- Option 1: Level up at targetDate (recommended)
- Option 2: Manual level up anytime (for early schedule changes)
- Option 3: Extend current schedule (push targetDate)

**Reasoning**: Life happens. Users might want to extend a working schedule or switch early.

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

**Last Updated**: January 8, 2026  
**Current Stable Release**: v13.0.0  
**Development Cycle**: v14

