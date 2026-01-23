// @ts-check
const { test, expect } = require( '@playwright/test' );
const { AppPage } = require( '../pages/AppPage' );
const { setupMockSchedule, getStorageItem } = require( '../fixtures/test-helpers' );

test.describe( 'Notes and Logbook', () => {
	test.beforeEach( async ( { page } ) => {
		await setupMockSchedule( page );
	} );

	test( 'can open notes section for a day', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Expand today's card (always accessible)
		const todayCard = page.locator( '.day-card.day-active' );
		await todayCard.click();

		// Notes textarea should be visible within today's card
		const notesTextarea = todayCard.locator( 'textarea' ).first();
		await expect( notesTextarea ).toBeVisible();
	} );

	test( 'can write notes for a day', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Expand today's card
		const todayCard = page.locator( '.day-card.day-active' );
		await todayCard.click();

		// Find the notes textarea within today's card
		const notesTextarea = todayCard.locator( 'textarea' ).first();
		await expect( notesTextarea ).toBeVisible();

		// Clear and type new note
		await notesTextarea.fill( '' );
		await notesTextarea.fill( 'Test note for today' );

		// Verify the text was entered
		await expect( notesTextarea ).toHaveValue( 'Test note for today' );
	} );

	test( 'notes are saved to localStorage', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Expand today's card
		const todayCard = page.locator( '.day-card.day-active' );
		await todayCard.click();

		// Find and fill notes
		const notesTextarea = todayCard.locator( 'textarea' ).first();
		await expect( notesTextarea ).toBeVisible();

		await notesTextarea.fill( 'Persistent note test' );

		// Trigger blur to save
		await notesTextarea.blur();

		// Wait for save
		await page.waitForTimeout( 500 );

		// Check localStorage for note
		const noteKeys = await page.evaluate( () => {
			return Object.keys( localStorage ).filter( ( k ) =>
				k.startsWith( 'body_refactoring_note_' )
			);
		} );

		expect( noteKeys.length ).toBeGreaterThan( 0 );
	} );

	test( 'notes persist after page reload', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Expand today's card
		const todayCard = page.locator( '.day-card.day-active' );
		await todayCard.click();

		// Find and fill notes
		const notesTextarea = todayCard.locator( 'textarea' ).first();
		await expect( notesTextarea ).toBeVisible();

		const testNote = 'Note that should persist after reload';
		await notesTextarea.fill( testNote );
		await notesTextarea.blur();
		await page.waitForTimeout( 500 );

		// Reload page
		await page.reload();
		await app.waitForAppReady();

		// Expand today's card again
		await page.locator( '.day-card.day-active' ).click();

		// Check note is still there
		const notesTextareaAfterReload = page.locator( '.day-card.day-active textarea' ).first();
		await expect( notesTextareaAfterReload ).toBeVisible();
		await expect( notesTextareaAfterReload ).toHaveValue( testNote );
	} );

	test( 'can clear notes', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Expand today's card
		const todayCard = page.locator( '.day-card.day-active' );
		await todayCard.click();

		// Find notes textarea
		const notesTextarea = todayCard.locator( 'textarea' ).first();
		await expect( notesTextarea ).toBeVisible();

		// First add a note
		await notesTextarea.fill( 'Note to be cleared' );
		await notesTextarea.blur();
		await page.waitForTimeout( 300 );

		// Clear the note
		await notesTextarea.fill( '' );
		await notesTextarea.blur();
		await page.waitForTimeout( 300 );

		// Verify it's cleared
		await expect( notesTextarea ).toHaveValue( '' );
	} );

	test( 'each day has separate notes', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Get day card count first
		const dayCardCount = await app.getDayCardCount();
		test.skip( dayCardCount < 2, 'Need at least 2 day cards for this test' );

		// Add note to today's card
		const todayCard = page.locator( '.day-card.day-active' );
		await todayCard.click();

		const firstDayNotes = todayCard.locator( 'textarea' ).first();
		await expect( firstDayNotes ).toBeVisible();
		await firstDayNotes.fill( 'Note for today' );
		await firstDayNotes.blur();

		// Collapse today's card
		await todayCard.click();

		// Find another day card (not today)
		const otherDayCard = page.locator( '.day-card:not(.day-active)' ).first();
		await otherDayCard.click();

		// Check that the other day's notes are different/empty
		const secondDayNotes = otherDayCard.locator( 'textarea' ).first();
		const isVisible = await secondDayNotes.isVisible().catch( () => false );

		if ( isVisible ) {
			const secondDayValue = await secondDayNotes.inputValue();
			// Notes for other day should be empty or different from today
			expect( secondDayValue ).not.toBe( 'Note for today' );
		}
	} );
} );
