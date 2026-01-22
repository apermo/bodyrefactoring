// @ts-check
const { defineConfig, devices } = require( '@playwright/test' );

/**
 * Playwright Test Configuration
 *
 * Uses DDEV for local development server.
 * Start DDEV before running tests: ddev start
 *
 * @see https://playwright.dev/docs/test-configuration
 */
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
	projects: [
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
	],
	timeout: 30000,
	expect: {
		timeout: 5000,
	},
} );
