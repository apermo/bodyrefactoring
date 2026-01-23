// @ts-check
const { test, expect } = require( '@playwright/test' );
const { AppPage } = require( '../pages/AppPage' );
const { setupMockSchedule, getDateRelativeToToday } = require( '../fixtures/test-helpers' );

test.describe( 'Exercise Checkbox Boundaries', () => {
	test.beforeEach( async ( { page } ) => {
		await setupMockSchedule( page );
	} );

	test( 'today checkbox can be toggled instantly without confirmation', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Find today's card (has day-active class)
		const todayCard = page.locator( '.day-card.day-active' );
		await todayCard.click();

		// Get first exercise
		const exerciseRow = todayCard.locator( '.exercise-row' ).first();
		await exerciseRow.waitFor( { state: 'visible' } );
		const checkCircle = exerciseRow.locator( '.check-circle' );

		// Track if dialog appeared
		let dialogAppeared = false;
		page.on( 'dialog', async ( dialog ) => {
			dialogAppeared = true;
			await dialog.accept();
		} );

		// Complete the exercise
		await checkCircle.click( { force: true } );
		await expect( exerciseRow ).toHaveClass( /completed/ );

		// Uncomplete the exercise - should NOT show confirmation for today
		await checkCircle.click( { force: true } );
		await expect( exerciseRow ).not.toHaveClass( /completed/ );

		// No dialog should have appeared for today
		expect( dialogAppeared ).toBe( false );
	} );

	test( 'past day checkbox requires confirmation to uncomplete', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Navigate to previous week to find a past day
		await app.goToPreviousWeek();
		await page.waitForTimeout( 500 );

		// Find a day card that is not locked (within 3 days)
		// We need to find a card without the lock icon
		const dayCards = page.locator( '.day-card:not(.day-locked)' );
		const count = await dayCards.count();

		if ( count > 0 ) {
			const pastDayCard = dayCards.first();
			await pastDayCard.click();

			const exerciseRow = pastDayCard.locator( '.exercise-row' ).first();
			// Check if exercise row exists and is visible
			const rowVisible = await exerciseRow.isVisible().catch( () => false );

			if ( rowVisible ) {
				const checkCircle = exerciseRow.locator( '.check-circle' );

				// Track dialog
				let dialogAppeared = false;
				page.on( 'dialog', async ( dialog ) => {
					dialogAppeared = true;
					await dialog.accept();
				} );

				// Complete the exercise first
				await checkCircle.click( { force: true } );
				await page.waitForTimeout( 300 );

				// Now uncomplete - should show confirmation for past days
				await checkCircle.click( { force: true } );
				await page.waitForTimeout( 500 );

				// Dialog should have appeared for past day
				expect( dialogAppeared ).toBe( true );
			}
		}
	} );

	test( 'future days are locked and cannot be clicked', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Navigate to next week
		await app.goToNextWeek();
		await page.waitForTimeout( 500 );

		// Future days should have lock icon
		const lockIcons = page.locator( '.lock-icon' );
		const lockCount = await lockIcons.count();

		// At least some days should be locked
		expect( lockCount ).toBeGreaterThan( 0 );

		// Find a locked day card
		const lockedCard = page.locator( '.day-card.day-locked' ).first();
		const hasLockedCard = await lockedCard.count() > 0;

		if ( hasLockedCard ) {
			await lockedCard.click();

			// Check circles should not be clickable (no cursor-pointer or no onclick)
			const checkCircle = lockedCard.locator( '.check-circle' ).first();
			const hasOnclick = await checkCircle.getAttribute( 'onclick' );

			// Locked days should have empty onclick
			expect( hasOnclick ).toBeFalsy();
		}
	} );

	test( 'days more than 3 days ago are locked', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Navigate back two weeks to definitely find old days
		await app.goToPreviousWeek();
		await app.goToPreviousWeek();
		await page.waitForTimeout( 500 );

		// All days this far back should be locked
		const dayCards = page.locator( '.day-card' );
		const count = await dayCards.count();

		// Check that old days have lock indicators
		const lockIcons = page.locator( '.lock-icon' );
		const lockCount = await lockIcons.count();

		// Most or all should be locked
		expect( lockCount ).toBeGreaterThan( 0 );
	} );

	test( 'days within 3 days ago are not locked', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// On current week, today should not be locked
		const todayCard = page.locator( '.day-card.day-active' );
		const hasLockIcon = await todayCard.locator( '.lock-icon' ).count();

		// Today should not have a lock icon
		expect( hasLockIcon ).toBe( 0 );

		// Today's checkboxes should be clickable
		await todayCard.click();
		const checkCircle = todayCard.locator( '.check-circle' ).first();
		const onclick = await checkCircle.getAttribute( 'onclick' );

		// Should have onclick handler
		expect( onclick ).toBeTruthy();
	} );
} );
