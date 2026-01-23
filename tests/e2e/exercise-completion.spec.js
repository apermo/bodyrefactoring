// @ts-check
const { test, expect } = require( '@playwright/test' );
const { AppPage } = require( '../pages/AppPage' );
const { setupMockSchedule, clearAppStorage, getStorageItem } = require( '../fixtures/test-helpers' );

test.describe( 'Exercise Completion', () => {
	test.beforeEach( async ( { page } ) => {
		await setupMockSchedule( page );
	} );

	test( 'can complete an exercise by clicking checkbox', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Find today's card (not locked) and expand it
		const todayCard = page.locator( '.day-card.day-active' );
		await todayCard.click();

		// Wait for exercises to be visible
		const exerciseRow = todayCard.locator( '.exercise-row' ).first();
		await exerciseRow.waitFor( { state: 'visible' } );

		// Scroll into view to avoid sticky header overlap
		await exerciseRow.scrollIntoViewIfNeeded();

		// Click the check circle
		const checkCircle = exerciseRow.locator( '.check-circle' );
		await checkCircle.click( { force: true } );

		// Exercise row should have 'completed' class
		await expect( exerciseRow ).toHaveClass( /completed/ );
	} );

	test( 'can uncomplete an exercise by clicking again', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Find today's card (not locked) and expand it
		const todayCard = page.locator( '.day-card.day-active' );
		await todayCard.click();

		const exerciseRow = todayCard.locator( '.exercise-row' ).first();
		await exerciseRow.waitFor( { state: 'visible' } );

		// Scroll into view to avoid sticky header overlap
		await exerciseRow.scrollIntoViewIfNeeded();

		const checkCircle = exerciseRow.locator( '.check-circle' );

		// Complete the exercise
		await checkCircle.click( { force: true } );
		await expect( exerciseRow ).toHaveClass( /completed/ );

		// Today should not require confirmation - just uncomplete
		await checkCircle.click( { force: true } );
		await expect( exerciseRow ).not.toHaveClass( /completed/ );
	} );

	test( 'exercise completion persists in localStorage', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Complete an exercise on today's card
		const todayCard = page.locator( '.day-card.day-active' );
		await todayCard.click();

		const exerciseRow = todayCard.locator( '.exercise-row' ).first();
		await exerciseRow.waitFor( { state: 'visible' } );

		// Scroll into view to avoid sticky header overlap
		await exerciseRow.scrollIntoViewIfNeeded();

		const checkCircle = exerciseRow.locator( '.check-circle' );
		await checkCircle.click( { force: true } );

		// Check localStorage has the completion stored
		const storageKeys = await page.evaluate( () => {
			return Object.keys( localStorage ).filter( ( k ) =>
				k.startsWith( 'body_refactoring_v1_' )
			);
		} );

		expect( storageKeys.length ).toBeGreaterThan( 0 );
	} );

	test( 'exercise completion state survives page reload', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Complete an exercise on today's card
		const todayCard = page.locator( '.day-card.day-active' );
		await todayCard.click();

		const exerciseRow = todayCard.locator( '.exercise-row' ).first();
		await exerciseRow.waitFor( { state: 'visible' } );

		// Scroll into view to avoid sticky header overlap
		await exerciseRow.scrollIntoViewIfNeeded();

		const checkCircle = exerciseRow.locator( '.check-circle' );
		await checkCircle.click( { force: true } );
		await expect( exerciseRow ).toHaveClass( /completed/ );

		// Reload the page
		await page.reload();
		await app.waitForAppReady();

		// Expand today's card again
		await page.locator( '.day-card.day-active' ).click();

		// Exercise should still be completed
		const exerciseRowAfterReload = page.locator( '.day-card.day-active .exercise-row' ).first();
		await expect( exerciseRowAfterReload ).toHaveClass( /completed/ );
	} );

	test( 'can complete multiple exercises', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Expand today's card (not locked)
		const todayCard = page.locator( '.day-card.day-active' );
		await todayCard.click();

		// Get all exercise rows within today's card
		const exerciseRows = todayCard.locator( '.exercise-row' );
		const count = await exerciseRows.count();

		// Complete first two exercises (if available)
		const toComplete = Math.min( count, 2 );
		for ( let i = 0; i < toComplete; i++ ) {
			const row = exerciseRows.nth( i );

			// Scroll into view to avoid sticky header overlap
			await row.scrollIntoViewIfNeeded();

			const checkCircle = row.locator( '.check-circle' );
			await checkCircle.click( { force: true } );
			await expect( row ).toHaveClass( /completed/ );
		}

		// Verify both are completed
		for ( let i = 0; i < toComplete; i++ ) {
			await expect( exerciseRows.nth( i ) ).toHaveClass( /completed/ );
		}
	} );

	test( 'day card shows completion status', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Expand today's card (not locked)
		const todayCard = page.locator( '.day-card.day-active' );
		await todayCard.click();

		// Complete all exercises in today's card
		const exerciseRows = todayCard.locator( '.exercise-row' );
		const count = await exerciseRows.count();

		for ( let i = 0; i < count; i++ ) {
			const row = exerciseRows.nth( i );

			// Scroll into view to avoid sticky header overlap
			await row.scrollIntoViewIfNeeded();

			// Only click if not already completed
			const isCompleted = await row.evaluate( ( el ) =>
				el.classList.contains( 'completed' )
			);
			if ( ! isCompleted ) {
				const checkCircle = row.locator( '.check-circle' );
				await checkCircle.click( { force: true } );
			}
		}

		// Verify all exercises are completed
		for ( let i = 0; i < count; i++ ) {
			await expect( exerciseRows.nth( i ) ).toHaveClass( /completed/ );
		}
	} );
} );
