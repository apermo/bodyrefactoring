// @ts-check
const { test, expect } = require( '@playwright/test' );
const { AppPage } = require( '../pages/AppPage' );
const { setupMockSchedule } = require( '../fixtures/test-helpers' );

test.describe( 'Week Navigation', () => {
	test.beforeEach( async ( { page } ) => {
		await setupMockSchedule( page );
	} );

	test( 'displays current week by default', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Should show "Aktuelle Woche"
		await expect( app.weekDisplay ).toHaveText( 'Aktuelle Woche' );
	} );

	test( 'navigates to next week', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Click next week
		await app.goToNextWeek();

		// Should show "+1 Wochen"
		await expect( app.weekDisplay ).toHaveText( '+1 Wochen' );

		// Today button should now be visible
		await expect( app.todayButton ).toBeVisible();
	} );

	test( 'navigates to previous week', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Click previous week
		await app.goToPreviousWeek();

		// Should show "-1 Wochen"
		await expect( app.weekDisplay ).toHaveText( '-1 Wochen' );

		// Today button should be visible
		await expect( app.todayButton ).toBeVisible();
	} );

	test( 'today button returns to current week', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Navigate away from current week
		await app.goToNextWeek();
		await app.goToNextWeek();
		await expect( app.weekDisplay ).toHaveText( '+2 Wochen' );

		// Click today button
		await app.goToToday();

		// Should return to current week
		await expect( app.weekDisplay ).toHaveText( 'Aktuelle Woche' );

		// Today button should be hidden again
		await expect( app.todayButton ).toBeHidden();
	} );

	test( 'today button is hidden on current week', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// On current week, today button should be hidden
		await expect( app.todayButton ).toBeHidden();
	} );

	test( 'can navigate multiple weeks forward and back', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Go forward 3 weeks
		await app.goToNextWeek();
		await app.goToNextWeek();
		await app.goToNextWeek();
		await expect( app.weekDisplay ).toHaveText( '+3 Wochen' );

		// Go back 2 weeks
		await app.goToPreviousWeek();
		await app.goToPreviousWeek();
		await expect( app.weekDisplay ).toHaveText( '+1 Wochen' );

		// Go back to current
		await app.goToPreviousWeek();
		await expect( app.weekDisplay ).toHaveText( 'Aktuelle Woche' );
	} );
} );
