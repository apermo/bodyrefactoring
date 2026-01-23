# E2E Testing with Playwright

This project uses [Playwright](https://playwright.dev/) for end-to-end testing against the DDEV local development server.

## Quick Start

```bash
# Ensure DDEV is running
ddev start

# Run all tests (default: mobile-safari)
npm test

# Run with visible browser
npm run test:headed

# Run specific test file
npx playwright test tests/e2e/consent-intro.spec.js
```

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm test` | Run quick tests only, excludes `@slow` (~27s) |
| `npm run test:full` | Run all tests including `@slow` (~1.5min) |
| `npm run test:slow` | Run only `@slow` tests |
| `npm run test:browsers` | Run all tests on all browsers |
| `npm run test:headed` | Run tests with visible browser window |
| `npm run test:debug` | Debug mode with Playwright Inspector |
| `npm run test:ui` | Interactive UI mode for exploring tests |
| `npm run test:report` | Open HTML report of last test run |

## Test Categories

Tests are split into two categories:

### Quick Tests (default)
- Fast tests suitable for PR checks
- Complete in ~27 seconds
- Cover all features except full rep counter flows

### Slow Tests (`@slow`)
- Tests involving complete rep counter timing flows
- Take 30-60 seconds each due to real-time counting
- Run with `npm run test:full` or `npm run test:slow`
- Should run when:
  - Rep counter code is modified
  - Major refactoring is done
  - Before releases

To mark a test as slow, add `@slow` to the test title:
```javascript
test( 'completes full rep counter flow @slow', async ( { page } ) => {
    // ...
});
```

## Browser Configuration

By default, tests run on **Mobile Safari** (iPhone 13 viewport) since iOS Safari is the primary target platform.

### Running on Different Browsers

```bash
# Single browser
BROWSERS=chromium npm test
BROWSERS=firefox npm test

# Multiple browsers
BROWSERS=chromium,webkit npm test

# All browsers (via npm script)
npm run test:all
```

Available browsers: `chromium`, `firefox`, `webkit`, `mobile-chrome`, `mobile-safari`

## Test Architecture

```
tests/
├── e2e/                    # Test spec files
│   ├── app-initialization.spec.js
│   ├── consent-intro.spec.js
│   ├── exercise-boundaries.spec.js
│   ├── exercise-completion.spec.js
│   ├── export-import.spec.js
│   ├── navigation.spec.js
│   ├── notes-logbook.spec.js
│   ├── recovery-sick-mode.spec.js
│   ├── rep-counter.spec.js
│   └── rep-counter-timing.spec.js
├── fixtures/               # Test data and helpers
│   ├── mock-schedule.json  # Predictable schedule for tests
│   └── test-helpers.js     # Utility functions
├── pages/                  # Page Object Model
│   └── AppPage.js          # Reusable page interactions
└── playwright.config.js    # Playwright configuration
```

## Page Object Model

The `AppPage` class provides reusable methods for common interactions:

```javascript
const { AppPage } = require('../pages/AppPage');

test('example', async ({ page }) => {
    const app = new AppPage(page);
    await app.goto();              // Navigate with consent/intro bypassed
    await app.waitForAppReady();   // Wait for splash screen to hide
    await app.openMenu();          // Open hamburger menu
    await app.goToNextWeek();      // Navigate weeks
});
```

### Key Methods

- `goto(options)` - Navigate to app (sets consent cookie, optionally skips intro)
- `waitForAppReady()` - Wait for splash screen to hide and schedule to load
- `openMenu()` / `closeMenu()` - Toggle hamburger menu
- `goToPreviousWeek()` / `goToNextWeek()` / `goToToday()` - Navigation
- `checkExercise(id)` / `uncheckExercise(id)` - Exercise checkboxes
- `setStorageItem(key, value)` / `getStorageItem(key)` - localStorage access

## Mock Schedule

Tests use a mock schedule (`tests/fixtures/mock-schedule.json`) for predictable, fast testing:

- **All 7 days have exercises** - no rest days for testing
- **Rep counter exercises** on Friday (today is dynamically calculated)
- **Two rep counter configs** for timing tests:
  - Standard: 2 sets × 5 reps @ 1000ms, 7s cooldown
  - Alternative: 2 sets × 4 reps @ 1500ms, 15s cooldown

### Using Mock Schedule

```javascript
const { setupMockSchedule } = require('../fixtures/test-helpers');

test.beforeEach(async ({ page }) => {
    await setupMockSchedule(page);  // Intercepts schedule API calls
});
```

## Consent & Intro Screen Handling

### Default Behavior (Most Tests)

`AppPage.goto()` automatically bypasses both screens:

1. Sets `br_consent=accepted` cookie before navigation
2. Sets `body_refactoring_intro_seen=true` in localStorage via `addInitScript()`

### Testing the Screens Explicitly

See `consent-intro.spec.js` for examples:

```javascript
test('shows consent screen on first visit', async ({ page }) => {
    // Don't use AppPage.goto() - navigate directly
    await setupMockSchedule(page);
    await page.goto('/');

    // Consent screen should be visible
    await expect(page.locator('h2:has-text("Deine Privatsphäre")')).toBeVisible();
});
```

## Writing Tests

### Best Practices

1. **Use `setupMockSchedule()`** in `beforeEach` for predictable data
2. **Scope locators** within parent elements:
   ```javascript
   const todayCard = page.locator('.day-card.day-active');
   const exerciseRow = todayCard.locator('.exercise-row').first();
   ```
3. **Use `test.skip()`** for conditional tests, not silent if blocks:
   ```javascript
   test.skip(count === 0, 'No data available for this test');
   ```
4. **Add `{ force: true }`** for clicks blocked by sticky header:
   ```javascript
   await checkbox.click({ force: true });
   ```
5. **Wait for elements** before interacting:
   ```javascript
   await exerciseRow.waitFor({ state: 'visible' });
   ```

### Test Template

```javascript
// @ts-check
const { test, expect } = require('@playwright/test');
const { AppPage } = require('../pages/AppPage');
const { setupMockSchedule } = require('../fixtures/test-helpers');

test.describe('Feature Name', () => {
    test.beforeEach(async ({ page }) => {
        await setupMockSchedule(page);
    });

    test('does something specific', async ({ page }) => {
        const app = new AppPage(page);
        await app.goto();
        await app.waitForAppReady();

        // Test logic here
        const todayCard = page.locator('.day-card.day-active');
        await todayCard.click();

        // Assertions
        await expect(page.locator('#some-element')).toBeVisible();
    });
});
```

## Debugging

### Playwright Inspector

```bash
npm run test:debug
```

Opens the Playwright Inspector for step-by-step debugging.

### UI Mode

```bash
npm run test:ui
```

Interactive mode with time-travel debugging and test explorer.

### Screenshots on Failure

Failed tests automatically capture screenshots in `test-results/`.

### Console Logs

Add `console.log()` in tests or use:

```javascript
page.on('console', msg => console.log('PAGE LOG:', msg.text()));
```

## CI Integration

Tests run automatically in GitHub Actions. The workflow:

1. Starts DDEV
2. Installs Playwright browsers
3. Runs `npm test`
4. Uploads test artifacts on failure

## Troubleshooting

### Splash Screen Timeout

If tests fail with "waiting for splash screen to be hidden":
- The splash screen timeout is 30s (increased for parallel test stability)
- Check if DDEV is running: `ddev status`
- Check browser console for JavaScript errors

### Element Intercepted by Another Element

If clicks fail with "element intercepts pointer events":
- The sticky header may be blocking - use `{ force: true }`
- A modal may be open - dismiss it first
- Check the element z-index

### Flaky Tests

If tests pass sometimes and fail others:
- Add explicit waits: `await element.waitFor({ state: 'visible' })`
- Increase timeouts for slow operations: `test.setTimeout(60000)`
- Use `toHaveCSS('opacity', '0')` for elements hidden via opacity
