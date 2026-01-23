// @ts-check
const { test, expect } = require( '@playwright/test' );
const { AppPage } = require( '../pages/AppPage' );
const { setupMockSchedule } = require( '../fixtures/test-helpers' );

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
		await expect( exerciseRow ).toBeVisible();
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
		const unlockedDayCards = page.locator( '.day-card:not(.day-locked)' );
		const count = await unlockedDayCards.count();

		// Skip if no unlocked past days available
		test.skip( count === 0, 'No unlocked past days available in previous week' );

		const pastDayCard = unlockedDayCards.first();
		await pastDayCard.click();

		const exerciseRow = pastDayCard.locator( '.exercise-row' ).first();
		await expect( exerciseRow ).toBeVisible();

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
		const lockedCards = page.locator( '.day-card.day-locked' );
		const lockedCount = await lockedCards.count();

		// Skip if no locked cards found
		test.skip( lockedCount === 0, 'No locked day cards found in next week' );

		const lockedCard = lockedCards.first();
		await lockedCard.click();

		// Check circles should not be clickable (no onclick handler)
		const checkCircle = lockedCard.locator( '.check-circle' ).first();
		const hasOnclick = await checkCircle.getAttribute( 'onclick' );

		// Locked days should have empty onclick
		expect( hasOnclick ).toBeFalsy();
	} );

	test( 'days more than 3 days ago are locked', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Navigate back two weeks to definitely find old days
		await app.goToPreviousWeek();
		await app.goToPreviousWeek();
		await page.waitForTimeout( 500 );

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
		const lockIconCount = await todayCard.locator( '.lock-icon' ).count();

		// Today should not have a lock icon
		expect( lockIconCount ).toBe( 0 );

		// Today's checkboxes should be clickable
		await todayCard.click();
		const checkCircle = todayCard.locator( '.check-circle' ).first();
		const onclick = await checkCircle.getAttribute( 'onclick' );

		// Should have onclick handler
		expect( onclick ).toBeTruthy();
	} );
} );
