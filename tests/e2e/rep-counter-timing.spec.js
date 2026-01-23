// @ts-check
const { test, expect } = require( '@playwright/test' );
const { AppPage } = require( '../pages/AppPage' );
const { setupMockSchedule, waitForRepCounterComplete } = require( '../fixtures/test-helpers' );

/**
 * Rep Counter Timing Tests
 *
 * Tests the rep counter with an alternative configuration:
 * - 2 sets x 4 reps
 * - 1.5s (1500ms) delay per rep
 * - 15s rest between sets
 */

test.describe( 'Rep Counter Timing Verification', () => {
	test.beforeEach( async ( { page } ) => {
		await setupMockSchedule( page );
	} );

	test( 'timing test exercise shows correct rep count (4 reps)', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Expand today's card
		const todayCard = page.locator( '.day-card.day-active' );
		await todayCard.click();

		// Find the timing test exercise
		const timingExercise = todayCard.locator( '.exercise-row' )
			.filter( { hasText: 'Timing Test Exercise' } );
		await expect( timingExercise ).toBeVisible();

		// Find the chip within this exercise
		const timingChip = timingExercise.locator( '.timer-chip[onclick*="startRepCounter"]' );
		await expect( timingChip ).toBeVisible();
		await expect( timingChip ).toContainText( '2 x 4' );
	} );

	test( 'verifies rep counter displays correct set info', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Expand today's card
		const todayCard = page.locator( '.day-card.day-active' );
		await todayCard.click();

		// Find the timing test exercise chip
		const timingExercise = todayCard.locator( '.exercise-row' )
			.filter( { hasText: 'Timing Test Exercise' } );
		const timingChip = timingExercise.locator( '.timer-chip[onclick*="startRepCounter"]' );
		await timingChip.click( { force: true } );

		// Modal should be visible
		const modal = page.locator( '#rep-counter-modal' );
		await expect( modal ).toBeVisible();

		// Check set info shows "Satz 1 von 2"
		const setInfo = page.locator( '#rep-counter-modal #rep-set-info' );
		await expect( setInfo ).toContainText( /Satz 1 von 2/ );

		// Check that exercise title is correct
		const title = page.locator( '#rep-counter-modal #rep-exercise-title' );
		await expect( title ).toContainText( 'Timing Test Exercise' );
	} );

	test( 'complete rep counter flow with 4 reps and 15s cooldown @slow', async ( { page } ) => {
		// Total expected time:
		// - 3s countdown
		// - Set 1: 4 * 1.5s = 6s
		// - 15s cooldown
		// - "Bereit?" click
		// - Set 2: 4 * 1.5s = 6s
		// Total: ~30s (plus transitions)
		test.setTimeout( 90000 );

		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Expand today's card
		const todayCard = page.locator( '.day-card.day-active' );
		await todayCard.click();

		// Find and click the timing test exercise chip
		const timingExercise = todayCard.locator( '.exercise-row' )
			.filter( { hasText: 'Timing Test Exercise' } );
		const timingChip = timingExercise.locator( '.timer-chip[onclick*="startRepCounter"]' );
		await timingChip.click( { force: true } );

		const modal = page.locator( '#rep-counter-modal' );
		await expect( modal ).toBeVisible();

		// Wait for the complete flow using the helper
		await waitForRepCounterComplete( page, 60000 );

		// Modal should be closed after completion
		await expect( modal ).toBeHidden();

		// Exercise should be marked as completed
		await expect( timingExercise ).toHaveClass( /completed/ );
	} );

	test( 'can abort the alternative rep counter', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Expand today's card
		const todayCard = page.locator( '.day-card.day-active' );
		await todayCard.click();

		// Find and click the timing test exercise chip
		const timingExercise = todayCard.locator( '.exercise-row' )
			.filter( { hasText: 'Timing Test Exercise' } );
		const timingChip = timingExercise.locator( '.timer-chip[onclick*="startRepCounter"]' );
		await timingChip.click( { force: true } );

		const modal = page.locator( '#rep-counter-modal' );
		await expect( modal ).toBeVisible();

		// Abort
		const abortButton = page.locator( '#rep-counter-modal button[onclick*="abortRepCounter"]' );
		await abortButton.click();

		// Modal should be hidden
		await expect( modal ).toBeHidden();
	} );
} );
