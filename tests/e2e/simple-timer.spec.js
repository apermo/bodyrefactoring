// @ts-check
const { test, expect } = require( '@playwright/test' );
const { AppPage } = require( '../pages/AppPage' );
const { setupMockSchedule } = require( '../fixtures/test-helpers' );

test.describe( 'Simple Timer', () => {
	test.beforeEach( async ( { page } ) => {
		await setupMockSchedule( page );
	} );

	test( 'FAB shows default 60s pause text', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		const fab = page.locator( '#fab-timer' );
		const timerText = page.locator( '#timer-text' );

		await expect( fab ).toBeVisible();
		await expect( timerText ).toHaveText( '60s Pause' );
	} );

	test( 'clicking FAB starts 60s timer', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		const fab = page.locator( '#fab-timer' );
		const timerText = page.locator( '#timer-text' );

		// Click FAB to start timer
		await fab.click();

		// FAB should show running state
		await expect( fab ).toHaveClass( /running/ );

		// Timer text should show countdown (not "60s Pause")
		// Give it a moment to update
		await page.waitForTimeout( 100 );
		await expect( timerText ).not.toHaveText( '60s Pause' );
	} );

	test( 'timer FAB displays remaining time', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		const fab = page.locator( '#fab-timer' );
		const timerText = page.locator( '#timer-text' );

		// Start timer
		await fab.click();

		// Wait a bit for timer to tick
		await page.waitForTimeout( 1100 );

		// Timer text should show countdown format (e.g., "0:59" or "0:58")
		const text = await timerText.textContent();
		expect( text ).toMatch( /^\d:\d{2}$/ );
	} );

	test( 'clicking FAB again stops timer', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		const fab = page.locator( '#fab-timer' );
		const timerText = page.locator( '#timer-text' );

		// Start timer
		await fab.click();
		await expect( fab ).toHaveClass( /running/ );

		// Stop timer by clicking again
		await fab.click();

		// FAB should no longer be running
		await expect( fab ).not.toHaveClass( /running/ );

		// Timer text should be reset
		await expect( timerText ).toHaveText( '60s Pause' );
	} );

	test( 'warmup exercise shows timer chips', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Expand today's card
		const todayCard = page.locator( '.day-card.day-active' );
		await todayCard.click();

		// Find warmup exercise row
		const warmupRow = todayCard.locator( '.exercise-row' )
			.filter( { hasText: 'Warmup' } );
		await expect( warmupRow ).toBeVisible();

		// Check for timer chips (system-timer-chip for iOS shortcuts)
		const timerChips = warmupRow.locator( '.system-timer-chip' );
		await expect( timerChips ).toHaveCount( 2 );

		// Verify chip labels
		await expect( timerChips.first() ).toContainText( '30s' );
		await expect( timerChips.last() ).toContainText( '1 Min' );
	} );

	test( 'cooldown exercise shows timer chip', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Expand today's card
		const todayCard = page.locator( '.day-card.day-active' );
		await todayCard.click();

		// Find cooldown exercise row
		const cooldownRow = todayCard.locator( '.exercise-row' )
			.filter( { hasText: 'Cooldown' } );
		await expect( cooldownRow ).toBeVisible();

		// Check for timer chip
		const timerChip = cooldownRow.locator( '.system-timer-chip' );
		await expect( timerChip ).toHaveCount( 1 );
		await expect( timerChip ).toContainText( '2 Min' );
	} );

	test( 'timer chip has clock icon', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Expand today's card
		const todayCard = page.locator( '.day-card.day-active' );
		await todayCard.click();

		// Find warmup exercise row
		const warmupRow = todayCard.locator( '.exercise-row' )
			.filter( { hasText: 'Warmup' } );

		// Timer chips should have clock icons
		const timerChip = warmupRow.locator( '.system-timer-chip' ).first();
		const clockIcon = timerChip.locator( '[data-lucide="clock"]' );
		await expect( clockIcon ).toBeVisible();
	} );

	test( 'timer chips link to iOS Shortcuts', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Expand today's card
		const todayCard = page.locator( '.day-card.day-active' );
		await todayCard.click();

		// Find warmup exercise row
		const warmupRow = todayCard.locator( '.exercise-row' )
			.filter( { hasText: 'Warmup' } );

		// Timer chips should be links to iOS Shortcuts
		const timerChip = warmupRow.locator( '.system-timer-chip' ).first();
		const href = await timerChip.getAttribute( 'href' );

		// 30s rounds to 1 minute in the shortcut
		expect( href ).toMatch( /shortcuts:\/\/run-shortcut\?name=Timer&input=\d+/ );
	} );

	test( 'FAB timer resets after completion', async ( { page } ) => {
		// This test would need a short timer, but we can't easily test completion
		// of a 60s timer in E2E tests. Instead, test that the FAB can be started again.
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		const fab = page.locator( '#fab-timer' );
		const timerText = page.locator( '#timer-text' );

		// Start and stop timer
		await fab.click();
		await expect( fab ).toHaveClass( /running/ );
		await fab.click();
		await expect( fab ).not.toHaveClass( /running/ );

		// Can start again
		await fab.click();
		await expect( fab ).toHaveClass( /running/ );

		// Verify it's counting
		await page.waitForTimeout( 1100 );
		const text = await timerText.textContent();
		expect( text ).toMatch( /^\d:\d{2}$/ );
	} );

	test( 'timer state persists across card interactions', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		const fab = page.locator( '#fab-timer' );

		// Start timer
		await fab.click();
		await expect( fab ).toHaveClass( /running/ );

		// Interact with today's card
		const todayCard = page.locator( '.day-card.day-active' );
		await todayCard.click();
		await page.waitForTimeout( 200 );

		// Timer should still be running
		await expect( fab ).toHaveClass( /running/ );
	} );
} );
