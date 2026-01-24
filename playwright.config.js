// @ts-check
const { defineConfig, devices } = require( '@playwright/test' );

/**
 * Playwright Test Configuration
 *
 * Uses DDEV for local development server.
 * Start DDEV before running tests: ddev start
 *
 * Test Categories:
 * - Quick tests (default): Fast tests suitable for PR checks
 * - Slow tests (@slow): Tests involving full rep counter flows (30-60s each)
 *
 * Examples:
 *   npm test                    # Quick tests only (excludes @slow)
 *   npm run test:full           # All tests including @slow
 *   npm run test:slow           # Only @slow tests
 *
 * Browser Configuration:
 * - Default: iOS Safari (mobile-safari) - the primary target
 * - Use --project flag to specify browsers
 *
 * Examples:
 *   npm test                                       # Quick tests on mobile-safari
 *   npm test -- --project=chromium                 # Quick tests on Chrome
 *   npm run test:full -- --project=webkit          # All tests on Desktop Safari
 *   BROWSERS=chromium,webkit npm run test:full     # All tests on multiple browsers
 *
 * Available projects: chromium, webkit, mobile-safari
 *
 * @see https://playwright.dev/docs/test-configuration
 */

// Parse BROWSERS environment variable or use default
// Usage: BROWSERS=chromium,webkit npm test
const browserEnv = process.env.BROWSERS;
const selectedBrowsers = browserEnv
	? browserEnv.split( ',' ).map( ( b ) => b.trim() )
	: [ 'mobile-safari' ]; // Default: iOS Safari only

// Health check project - runs first, no browser needed
// Uses Playwright's request fixture for fast HTTP checks
// grep: /.*/ overrides global grepInvert to ensure health checks always run
const healthCheckProject = {
	name: 'health-check',
	testMatch: /health-check\.spec\.js/,
	grep: /.*/,
};

// All available browser configurations
// Each depends on health-check passing before running
const allBrowserProjects = [
	{
		name: 'chromium',
		use: { ...devices[ 'Desktop Chrome' ] },
		dependencies: [ 'health-check' ],
		testIgnore: /health-check\.spec\.js/,
	},
	{
		name: 'webkit',
		use: { ...devices[ 'Desktop Safari' ] },
		dependencies: [ 'health-check' ],
		testIgnore: /health-check\.spec\.js/,
	},
	{
		name: 'mobile-safari',
		use: { ...devices[ 'iPhone 14' ] },
		dependencies: [ 'health-check' ],
		testIgnore: /health-check\.spec\.js/,
	},
];

// Filter to selected browsers (default: mobile-safari)
const selectedBrowserProjects = allBrowserProjects.filter( ( p ) => selectedBrowsers.includes( p.name ) );

// Final projects: health-check first, then filtered browser projects
const projects = [ healthCheckProject, ...selectedBrowserProjects ];

// Test filtering: exclude @slow tests by default
// TEST_MODE=full  -> run all tests (no grep filter)
// TEST_MODE=slow  -> run only @slow tests
// (default)       -> exclude @slow tests
const testMode = process.env.TEST_MODE;
let grepConfig = {};
if ( testMode === 'full' ) {
	// No filter - run everything
} else if ( testMode === 'slow' ) {
	grepConfig = { grep: /@slow/ };
} else {
	// Default: exclude slow tests
	grepConfig = { grepInvert: /@slow/ };
}

module.exports = defineConfig( {
	testDir: './tests/e2e',
	...grepConfig,
	fullyParallel: true,
	forbidOnly: !! process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [
		[ 'html', { open: 'never' } ],
		[ 'list' ],
	],
	use: {
		baseURL: process.env.BASE_URL || 'https://bodyrefactoring.ddev.site',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'on-first-retry',
		ignoreHTTPSErrors: true,
	},
	projects,
	timeout: 30000,
	expect: {
		timeout: 5000,
	},
} );
