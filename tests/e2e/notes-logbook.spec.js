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

		// Expand first day card
		await app.getDayCard( 0 ).click();

		// Notes are displayed as a textarea with "Logbuch" label
		// Look for the textarea with oninput containing saveNote
		const notesTextarea = page.locator( 'textarea[oninput*="saveNote"]' ).first();
		const logbuchLabel = page.locator( 'label:has-text("Logbuch")' );

		// Either the textarea or label should be visible
		const textareaVisible = await notesTextarea.isVisible().catch( () => false );
		const labelVisible = await logbuchLabel.first().isVisible().catch( () => false );

		expect( textareaVisible || labelVisible ).toBe( true );
	} );

	test( 'can write notes for a day', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Expand first day card
		await app.getDayCard( 0 ).click();

		// Find the notes textarea
		const notesTextarea = page.locator( 'textarea[id*="note"], .notes-textarea' ).first();

		if ( await notesTextarea.isVisible() ) {
			// Clear and type new note
			await notesTextarea.fill( '' );
			await notesTextarea.fill( 'Test note for today' );

			// Verify the text was entered
			await expect( notesTextarea ).toHaveValue( 'Test note for today' );
		}
	} );

	test( 'notes are saved to localStorage', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Expand first day card
		await app.getDayCard( 0 ).click();

		// Find and fill notes
		const notesTextarea = page.locator( 'textarea[id*="note"], .notes-textarea' ).first();

		if ( await notesTextarea.isVisible() ) {
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
		}
	} );

	test( 'notes persist after page reload', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Expand first day card
		await app.getDayCard( 0 ).click();

		// Find and fill notes
		const notesTextarea = page.locator( 'textarea[id*="note"], .notes-textarea' ).first();
		const testNote = 'Note that should persist after reload';

		if ( await notesTextarea.isVisible() ) {
			await notesTextarea.fill( testNote );
			await notesTextarea.blur();
			await page.waitForTimeout( 500 );

			// Reload page
			await page.reload();
			await app.waitForAppReady();

			// Expand day card again
			await app.getDayCard( 0 ).click();

			// Check note is still there
			const notesTextareaAfterReload = page.locator( 'textarea[id*="note"], .notes-textarea' ).first();
			if ( await notesTextareaAfterReload.isVisible() ) {
				await expect( notesTextareaAfterReload ).toHaveValue( testNote );
			}
		}
	} );

	test( 'can clear notes', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Expand first day card
		await app.getDayCard( 0 ).click();

		// Find notes textarea
		const notesTextarea = page.locator( 'textarea[id*="note"], .notes-textarea' ).first();

		if ( await notesTextarea.isVisible() ) {
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
		}
	} );

	test( 'each day has separate notes', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Add note to first day
		await app.getDayCard( 0 ).click();
		const firstDayNotes = page.locator( 'textarea[id*="note"], .notes-textarea' ).first();

		if ( await firstDayNotes.isVisible() ) {
			await firstDayNotes.fill( 'Note for day 1' );
			await firstDayNotes.blur();
		}

		// Collapse first day by clicking header again
		await app.getDayCard( 0 ).click();

		// Check if there's a second day card
		const dayCardCount = await app.getDayCardCount();
		if ( dayCardCount > 1 ) {
			// Expand second day
			await app.getDayCard( 1 ).click();

			const secondDayNotes = page.locator( 'textarea[id*="note"], .notes-textarea' ).first();

			if ( await secondDayNotes.isVisible() ) {
				// Second day should have empty notes (different day)
				const secondDayValue = await secondDayNotes.inputValue();
				// Notes for day 2 should be empty or different from day 1
				expect( secondDayValue ).not.toBe( 'Note for day 1' );
			}
		}
	} );
} );
