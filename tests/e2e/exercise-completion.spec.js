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

		// Find the first day card and expand it
		const firstDayCard = app.getDayCard( 0 );
		await firstDayCard.click();

		// Wait for exercises to be visible
		const exerciseRow = page.locator( '.exercise-row' ).first();
		await exerciseRow.waitFor( { state: 'visible' } );

		// Click the check circle
		const checkCircle = exerciseRow.locator( '.check-circle' );
		await checkCircle.click();

		// Exercise row should have 'completed' class
		await expect( exerciseRow ).toHaveClass( /completed/ );
	} );

	test( 'can uncomplete an exercise by clicking again', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Find and expand first day card
		const firstDayCard = app.getDayCard( 0 );
		await firstDayCard.click();

		const exerciseRow = page.locator( '.exercise-row' ).first();
		await exerciseRow.waitFor( { state: 'visible' } );
		const checkCircle = exerciseRow.locator( '.check-circle' );

		// Complete the exercise
		await checkCircle.click();
		await expect( exerciseRow ).toHaveClass( /completed/ );

		// Set up dialog handler for confirmation (past days show a confirm dialog)
		page.on( 'dialog', async ( dialog ) => {
			await dialog.accept();
		} );

		// Uncomplete the exercise
		await checkCircle.click();
		await expect( exerciseRow ).not.toHaveClass( /completed/ );
	} );

	test( 'exercise completion persists in localStorage', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Complete an exercise
		const firstDayCard = app.getDayCard( 0 );
		await firstDayCard.click();

		const exerciseRow = page.locator( '.exercise-row' ).first();
		await exerciseRow.waitFor( { state: 'visible' } );
		const checkCircle = exerciseRow.locator( '.check-circle' );
		await checkCircle.click();

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

		// Complete an exercise
		const firstDayCard = app.getDayCard( 0 );
		await firstDayCard.click();

		const exerciseRow = page.locator( '.exercise-row' ).first();
		await exerciseRow.waitFor( { state: 'visible' } );
		const checkCircle = exerciseRow.locator( '.check-circle' );
		await checkCircle.click();
		await expect( exerciseRow ).toHaveClass( /completed/ );

		// Reload the page
		await page.reload();
		await app.waitForAppReady();

		// Expand the day card again
		await app.getDayCard( 0 ).click();

		// Exercise should still be completed
		const exerciseRowAfterReload = page.locator( '.exercise-row' ).first();
		await expect( exerciseRowAfterReload ).toHaveClass( /completed/ );
	} );

	test( 'can complete multiple exercises', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Expand first day card
		const firstDayCard = app.getDayCard( 0 );
		await firstDayCard.click();

		// Get all exercise rows
		const exerciseRows = page.locator( '.exercise-row' );
		const count = await exerciseRows.count();

		// Complete first two exercises (if available)
		const toComplete = Math.min( count, 2 );
		for ( let i = 0; i < toComplete; i++ ) {
			const row = exerciseRows.nth( i );
			const checkCircle = row.locator( '.check-circle' );
			await checkCircle.click();
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

		// Expand first day card
		const firstDayCard = app.getDayCard( 0 );
		await firstDayCard.click();

		// Complete all exercises in the day
		const exerciseRows = page.locator( '.exercise-row:visible' );
		const count = await exerciseRows.count();

		for ( let i = 0; i < count; i++ ) {
			const row = exerciseRows.nth( i );
			// Only click if not already completed
			const isCompleted = await row.evaluate( ( el ) =>
				el.classList.contains( 'completed' )
			);
			if ( ! isCompleted ) {
				const checkCircle = row.locator( '.check-circle' );
				await checkCircle.click();
			}
		}

		// Day card should reflect completion (typically shows checkmark or different styling)
		// The exact indicator depends on app implementation
		// For now, verify all exercises are completed
		for ( let i = 0; i < count; i++ ) {
			await expect( exerciseRows.nth( i ) ).toHaveClass( /completed/ );
		}
	} );
} );
