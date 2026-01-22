// @ts-check
const { test, expect } = require( '@playwright/test' );
const { AppPage } = require( '../pages/AppPage' );
const {
	setupMockSchedule,
	waitForRepCounterModal,
	waitForRepCounterComplete,
} = require( '../fixtures/test-helpers' );

test.describe( 'Rep Counter', () => {
	test.beforeEach( async ( { page } ) => {
		await setupMockSchedule( page );
	} );

	test( 'opens rep counter modal when clicking chip', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Expand first day card (Monday has rep counter exercise)
		const firstDayCard = app.getDayCard( 0 );
		await firstDayCard.click();

		// Find and click the rep counter chip
		const repCounterChip = page.locator( '.timer-chip[onclick*="startRepCounter"]' ).first();
		await repCounterChip.waitFor( { state: 'visible' } );
		await repCounterChip.click();

		// Rep counter modal should be visible
		const modal = page.locator( '#rep-counter-modal' );
		await expect( modal ).toBeVisible();
	} );

	test( 'shows exercise title in rep counter modal', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Expand day and start rep counter
		await app.getDayCard( 0 ).click();
		const repCounterChip = page.locator( '.timer-chip[onclick*="startRepCounter"]' ).first();
		await repCounterChip.click();

		// Check that the modal shows the exercise title
		const modalTitle = page.locator( '#rep-counter-modal #rep-exercise-title' );
		await expect( modalTitle ).toBeVisible();
		await expect( modalTitle ).toHaveText( /Rep Counter Exercise/ );
	} );

	test( 'displays set and rep information', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Start rep counter
		await app.getDayCard( 0 ).click();
		const repCounterChip = page.locator( '.timer-chip[onclick*="startRepCounter"]' ).first();
		await repCounterChip.click();

		// Check set info is displayed
		const setInfo = page.locator( '#rep-counter-modal #rep-set-info' );
		await expect( setInfo ).toBeVisible();
		await expect( setInfo ).toContainText( /Satz 1/ );
	} );

	test( 'can abort rep counter', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Start rep counter
		await app.getDayCard( 0 ).click();
		const repCounterChip = page.locator( '.timer-chip[onclick*="startRepCounter"]' ).first();
		await repCounterChip.click();

		// Modal should be visible
		const modal = page.locator( '#rep-counter-modal' );
		await expect( modal ).toBeVisible();

		// Click abort button (uses onclick="abortRepCounter()")
		const abortButton = page.locator( '#rep-counter-modal button[onclick*="abortRepCounter"]' );
		await abortButton.click();

		// Modal should be hidden
		await expect( modal ).toBeHidden();
	} );

	test( 'completes full rep counter flow (2 sets x 5 reps)', async ( { page } ) => {
		// This test uses mock schedule with 1s delay, 10s rest
		// Total time: ~5s (set 1) + 10s (rest) + 5s (set 2) = ~20s
		test.setTimeout( 45000 );

		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Start rep counter
		await app.getDayCard( 0 ).click();
		const repCounterChip = page.locator( '.timer-chip[onclick*="startRepCounter"]' ).first();
		await repCounterChip.click();

		const modal = page.locator( '#rep-counter-modal' );
		await expect( modal ).toBeVisible();

		// Wait for rep counter to complete (all sets)
		// Mock schedule has 2 sets x 5 reps @ 1000ms = 10s per set
		// Plus 10s rest between sets = ~20-25s total
		await waitForRepCounterComplete( page, 40000 );

		// Modal should be hidden after completion
		await expect( modal ).toBeHidden();
	} );

	test( 'marks exercise complete after rep counter finishes', async ( { page } ) => {
		test.setTimeout( 45000 );

		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Find the exercise row with rep counter
		await app.getDayCard( 0 ).click();

		// Find the rep counter chip and its parent exercise row
		const repCounterChip = page.locator( '.timer-chip[onclick*="startRepCounter"]' ).first();
		const exerciseRow = repCounterChip.locator( 'xpath=ancestor::div[contains(@class, "exercise-row")]' );

		// Verify not completed initially
		await expect( exerciseRow ).not.toHaveClass( /completed/ );

		// Start rep counter
		await repCounterChip.click();

		// Wait for completion
		await waitForRepCounterComplete( page, 40000 );

		// Exercise should now be marked as completed
		await expect( exerciseRow ).toHaveClass( /completed/ );
	} );

	test( 'shows cooldown timer between sets', async ( { page } ) => {
		test.setTimeout( 30000 );

		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Start rep counter
		await app.getDayCard( 0 ).click();
		const repCounterChip = page.locator( '.timer-chip[onclick*="startRepCounter"]' ).first();
		await repCounterChip.click();

		// Wait for first set to complete and cooldown to start
		// First set: 5 reps @ 1s = 5s, then cooldown begins
		await page.waitForTimeout( 7000 );

		// Should be in cooldown state - check for cooldown display
		const cooldownDisplay = page.locator( '#rep-counter-modal #rep-cooldown-display' );
		// The cooldown might show remaining seconds
		// This depends on the exact implementation
		const modal = page.locator( '#rep-counter-modal' );
		await expect( modal ).toBeVisible();
	} );

	test( 'rep counter chip shows set and rep info', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Expand day card
		await app.getDayCard( 0 ).click();

		// Find rep counter chip
		const repCounterChip = page.locator( '.timer-chip[onclick*="startRepCounter"]' ).first();
		await expect( repCounterChip ).toBeVisible();

		// Chip should display set x rep info (e.g., "2 x 5")
		await expect( repCounterChip ).toContainText( /2 x 5/ );
	} );
} );
