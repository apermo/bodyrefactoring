// @ts-check
const { test, expect } = require( '@playwright/test' );

/**
 * Backend Health Checks
 *
 * These tests run BEFORE all browser tests to catch PHP errors early.
 * If these fail, all browser tests are skipped - no wasted time waiting for timeouts.
 *
 * Uses Playwright's `request` fixture (no browser overhead) for fast execution.
 */
test.describe( 'Backend Health Checks', () => {
	test.describe.configure( { timeout: 3000 } ); // 3s - PHP responds instantly or fails

	test( 'homepage loads (PHP working)', async ( { request, baseURL } ) => {
		const response = await request.get( baseURL + '/' );
		expect( response.status() ).toBe( 200 );
		const html = await response.text();
		// Check for content present on any page (consent or main app)
		expect( html ).toContain( 'Body Refactoring' );
		expect( html ).toContain( '<!DOCTYPE html>' );
	} );

	test( 'schedules API returns JSON', async ( { request, baseURL } ) => {
		const response = await request.get( baseURL + '/schedules/' );
		expect( response.status() ).toBe( 200 );
		expect( response.headers()[ 'content-type' ] ).toContain( 'application/json' );
		const data = await response.json();
		expect( Array.isArray( data ) ).toBe( true );
	} );
} );
