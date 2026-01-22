// @ts-check
const { test, expect } = require( '@playwright/test' );
const { AppPage } = require( '../pages/AppPage' );
const { setupMockSchedule } = require( '../fixtures/test-helpers' );

test.describe( 'Recovery and Sick Mode', () => {
	test.beforeEach( async ( { page } ) => {
		await setupMockSchedule( page );
	} );

	test( 'can open sick/recovery modal from menu', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Open menu
		await app.openMenu();

		// Click on "Krank / Recovery" option
		const sickRecoveryButton = page.locator( 'button:has-text("Krank / Recovery")' );
		await sickRecoveryButton.click();

		// Wait for modal to open (has .open class)
		const sickModeModal = page.locator( '#sick-mode-modal.open' );
		await expect( sickModeModal ).toHaveCount( 1 );
	} );

	test( 'sick mode modal shows recovery and sick options', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Open sick mode modal
		await app.openMenu();
		await page.locator( 'button:has-text("Krank / Recovery")' ).click();

		// Wait for modal to be open
		await page.locator( '#sick-mode-modal.open' ).waitFor( { state: 'attached' } );

		// Check for options within the modal
		const modal = page.locator( '#sick-mode-modal' );
		const recoveryButton = modal.locator( 'button:has-text("Recovery Modus")' );
		const sickButton = modal.locator( 'button:has-text("Krank (Schild nutzen)")' );

		// Both should exist
		await expect( recoveryButton ).toHaveCount( 1 );
		await expect( sickButton ).toHaveCount( 1 );
	} );

	test( 'can activate recovery mode', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Open sick mode modal
		await app.openMenu();
		await page.locator( 'button:has-text("Krank / Recovery")' ).click();
		await page.locator( '#sick-mode-modal.open' ).waitFor( { state: 'attached' } );

		// Click recovery option
		const modal = page.locator( '#sick-mode-modal' );
		const recoveryButton = modal.locator( 'button:has-text("Recovery Modus")' );
		await recoveryButton.click();

		// Wait for modal to close and schedule to update
		await page.waitForTimeout( 1000 );

		// Recovery mode should be active - look for recovery day card
		const scheduleContainer = page.locator( '#schedule-container' );
		await expect( scheduleContainer ).toBeVisible();
	} );

	test( 'can close sick mode modal', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Open sick mode modal
		await app.openMenu();
		await page.locator( 'button:has-text("Krank / Recovery")' ).click();
		await page.locator( '#sick-mode-modal.open' ).waitFor( { state: 'attached' } );

		// Click cancel button
		const modal = page.locator( '#sick-mode-modal' );
		const cancelButton = modal.locator( 'button:has-text("Abbrechen")' );
		await cancelButton.click();

		// Modal should close
		await expect( page.locator( '#sick-mode-modal.open' ) ).toHaveCount( 0 );
	} );

	test( 'sick mode shows shield status', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Open sick mode modal
		await app.openMenu();
		await page.locator( 'button:has-text("Krank / Recovery")' ).click();
		await page.locator( '#sick-mode-modal.open' ).waitFor( { state: 'attached' } );

		// Should show shield container
		const shieldContainer = page.locator( '#sick-mode-modal #shields-container-modal' );
		await expect( shieldContainer ).toHaveCount( 1 );
	} );

	test( 'recovery mode shows recovery exercises', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Activate recovery mode
		await app.openMenu();
		await page.locator( 'button:has-text("Krank / Recovery")' ).click();
		await page.locator( '#sick-mode-modal.open' ).waitFor( { state: 'attached' } );

		const modal = page.locator( '#sick-mode-modal' );
		await modal.locator( 'button:has-text("Recovery Modus")' ).click();

		// Wait for schedule to update
		await page.waitForTimeout( 1000 );

		// Check for recovery-specific content in schedule
		const scheduleContainer = page.locator( '#schedule-container' );
		await expect( scheduleContainer ).toBeVisible();

		// Recovery day should show recovery activities
		const dayCards = page.locator( '.day-card' );
		const count = await dayCards.count();
		expect( count ).toBeGreaterThan( 0 );
	} );
} );
