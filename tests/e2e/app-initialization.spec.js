// @ts-check
const { test, expect } = require( '@playwright/test' );
const { AppPage } = require( '../pages/AppPage' );

test.describe( 'App Initialization', () => {
	test( 'loads the app successfully', async ( { page } ) => {
		const app = new AppPage( page );

		await app.goto();
		await app.waitForAppReady();

		// Verify schedule container is visible
		await expect( app.scheduleContainer ).toBeVisible();
	} );

	test( 'displays navigation controls', async ( { page } ) => {
		const app = new AppPage( page );

		await app.goto();
		await app.waitForAppReady();

		// Verify navigation buttons exist
		await expect( app.prevWeekButton ).toBeVisible();
		await expect( app.nextWeekButton ).toBeVisible();
		await expect( app.weekDisplay ).toBeVisible();
	} );

	test( 'displays day cards', async ( { page } ) => {
		const app = new AppPage( page );

		await app.goto();
		await app.waitForAppReady();

		// Should have at least one day card
		const dayCardCount = await app.getDayCardCount();
		expect( dayCardCount ).toBeGreaterThan( 0 );
	} );

	test( 'menu opens and closes', async ( { page } ) => {
		const app = new AppPage( page );

		await app.goto();
		await app.waitForAppReady();

		// Menu should be hidden initially
		await expect( app.menuDropdown ).toBeHidden();

		// Open menu
		await app.openMenu();
		await expect( app.menuDropdown ).toBeVisible();

		// Close menu
		await app.closeMenu();
		await expect( app.menuDropdown ).toBeHidden();
	} );
} );
