// @ts-check
const { defineConfig, devices } = require( '@playwright/test' );

/**
 * Playwright Test Configuration
 *
 * Uses DDEV for local development server.
 * Start DDEV before running tests: ddev start
 *
 * Browser Configuration:
 * - Default: iOS Safari (mobile-safari) - the primary target
 * - Use --project flag to specify browsers
 *
 * Examples:
 *   npm test                                       # Runs on mobile-safari only (default)
 *   npm test -- --project=chromium                 # Runs on Chrome only
 *   npm test -- --project=webkit                   # Runs on Desktop Safari only
 *   npm test -- --project=mobile-safari            # Runs on iOS Safari only
 *   npm test -- --project=chromium --project=webkit --project=mobile-safari  # All browsers
 *
 * Available projects: chromium, webkit, mobile-safari
 *
 * To run all browsers, use: npm run test:all
 *
 * @see https://playwright.dev/docs/test-configuration
 */

// Parse BROWSERS environment variable or use default
// Usage: BROWSERS=chromium,webkit npm test
const browserEnv = process.env.BROWSERS;
const selectedBrowsers = browserEnv
	? browserEnv.split( ',' ).map( ( b ) => b.trim() )
	: [ 'mobile-safari' ]; // Default: iOS Safari only

// All available browser configurations
const allProjects = [
	{
		name: 'chromium',
		use: { ...devices[ 'Desktop Chrome' ] },
	},
	{
		name: 'webkit',
		use: { ...devices[ 'Desktop Safari' ] },
	},
	{
		name: 'mobile-safari',
		use: { ...devices[ 'iPhone 14' ] },
	},
];

// Filter to selected browsers (default: mobile-safari)
const projects = allProjects.filter( ( p ) => selectedBrowsers.includes( p.name ) );

module.exports = defineConfig( {
	testDir: './tests/e2e',
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
