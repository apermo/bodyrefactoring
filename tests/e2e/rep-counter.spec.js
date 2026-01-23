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

		// Expand today's card (has rep counter exercise)
		const todayCard = page.locator( '.day-card.day-active' );
		await todayCard.click();

		// Find and click the rep counter chip within today's card
		const repCounterChip = todayCard.locator( '.timer-chip[onclick*="startRepCounter"]' ).first();
		await repCounterChip.waitFor( { state: 'visible' } );
		await repCounterChip.click( { force: true } );

		// Rep counter modal should be visible
		const modal = page.locator( '#rep-counter-modal' );
		await expect( modal ).toBeVisible();
	} );

	test( 'shows exercise title in rep counter modal', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Expand today's card and start rep counter
		const todayCard = page.locator( '.day-card.day-active' );
		await todayCard.click();
		const repCounterChip = todayCard.locator( '.timer-chip[onclick*="startRepCounter"]' ).first();
		await repCounterChip.click( { force: true } );

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
		const todayCard = page.locator( '.day-card.day-active' );
		await todayCard.click();
		const repCounterChip = todayCard.locator( '.timer-chip[onclick*="startRepCounter"]' ).first();
		await repCounterChip.click( { force: true } );

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
		const todayCard = page.locator( '.day-card.day-active' );
		await todayCard.click();
		const repCounterChip = todayCard.locator( '.timer-chip[onclick*="startRepCounter"]' ).first();
		await repCounterChip.click( { force: true } );

		// Modal should be visible
		const modal = page.locator( '#rep-counter-modal' );
		await expect( modal ).toBeVisible();

		// Click abort button (uses onclick="abortRepCounter()")
		const abortButton = page.locator( '#rep-counter-modal button[onclick*="abortRepCounter"]' );
		await abortButton.click();

		// Modal should be hidden
		await expect( modal ).toBeHidden();
	} );

	test( 'completes full rep counter flow (2 sets x 5 reps) @slow', async ( { page } ) => {
		// Total time: ~5s (set 1) + 7s (rest) + 5s (set 2) = ~17s
		test.setTimeout( 45000 );

		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Start rep counter
		const todayCard = page.locator( '.day-card.day-active' );
		await todayCard.click();
		const repCounterChip = todayCard.locator( '.timer-chip[onclick*="startRepCounter"]' ).first();
		await repCounterChip.click( { force: true } );

		const modal = page.locator( '#rep-counter-modal' );
		await expect( modal ).toBeVisible();

		// Wait for rep counter to complete (all sets)
		// Mock schedule has 2 sets x 5 reps @ 1000ms = 10s per set
		// Plus 7s rest between sets = ~20-25s total
		await waitForRepCounterComplete( page, 40000 );

		// Modal should be hidden after completion
		await expect( modal ).toBeHidden();
	} );

	test( 'marks exercise complete after rep counter finishes @slow', async ( { page } ) => {
		test.setTimeout( 45000 );

		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Find the exercise row with rep counter within today's card
		const todayCard = page.locator( '.day-card.day-active' );
		await todayCard.click();

		// Find exercise row containing a rep counter chip (use filter to find parent)
		const exerciseRow = todayCard.locator( '.exercise-row' )
			.filter( { has: page.locator( '.timer-chip[onclick*="startRepCounter"]' ) } )
			.first();
		await expect( exerciseRow ).toBeVisible();

		// Verify not completed initially
		await expect( exerciseRow ).not.toHaveClass( /completed/ );

		// Find and click the rep counter chip within this exercise row
		const repCounterChip = exerciseRow.locator( '.timer-chip[onclick*="startRepCounter"]' );
		await repCounterChip.click( { force: true } );

		// Wait for completion
		await waitForRepCounterComplete( page, 40000 );

		// Exercise should now be marked as completed
		await expect( exerciseRow ).toHaveClass( /completed/ );
	} );

	test( 'shows cooldown timer between sets @slow', async ( { page } ) => {
		test.setTimeout( 45000 );

		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Start rep counter
		const todayCard = page.locator( '.day-card.day-active' );
		await todayCard.click();
		const repCounterChip = todayCard.locator( '.timer-chip[onclick*="startRepCounter"]' ).first();
		await repCounterChip.click( { force: true } );

		// Wait for first set to complete and cooldown to start
		// First set: 5 reps @ 1s = 5s, then cooldown begins
		await page.waitForTimeout( 7000 );

		// Should be in cooldown state - modal should still be visible
		const modal = page.locator( '#rep-counter-modal' );
		await expect( modal ).toBeVisible();
	} );

	test( 'rep counter chip shows set and rep info', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Expand today's card
		const todayCard = page.locator( '.day-card.day-active' );
		await todayCard.click();

		// Find rep counter chip within today's card
		const repCounterChip = todayCard.locator( '.timer-chip[onclick*="startRepCounter"]' ).first();
		await expect( repCounterChip ).toBeVisible();

		// Chip should display set x rep info (e.g., "2 x 5")
		await expect( repCounterChip ).toContainText( /2 x 5/ );
	} );
} );
