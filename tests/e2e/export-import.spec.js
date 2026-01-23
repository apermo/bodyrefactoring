// @ts-check
const { test, expect } = require( '@playwright/test' );
const { AppPage } = require( '../pages/AppPage' );
const { setupMockSchedule } = require( '../fixtures/test-helpers' );
const path = require( 'path' );
const fs = require( 'fs' );

test.describe( 'Export and Import', () => {
	test.beforeEach( async ( { page } ) => {
		await setupMockSchedule( page );
	} );

	test( 'export button is accessible in menu', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Open menu
		await app.openMenu();

		// Find export button
		const exportButton = page.locator( 'button:has-text("Backup speichern")' );
		await expect( exportButton ).toBeVisible();
	} );

	test( 'import button is accessible in menu', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Open menu
		await app.openMenu();

		// Find import button
		const importButton = page.locator( 'button:has-text("Backup laden")' );
		await expect( importButton ).toBeVisible();
	} );

	test( 'can export data as JSON file', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// First, complete an exercise to have some data
		const todayCard = page.locator( '.day-card.day-active' );
		await todayCard.click();
		const exerciseRow = todayCard.locator( '.exercise-row' ).first();
		await exerciseRow.waitFor( { state: 'visible' } );
		await exerciseRow.locator( '.check-circle' ).click( { force: true } );
		await page.waitForTimeout( 500 );

		// Set up download listener
		const downloadPromise = page.waitForEvent( 'download' );

		// Open menu and click export
		await app.openMenu();
		await page.locator( 'button:has-text("Backup speichern")' ).click();

		// Wait for download
		const download = await downloadPromise;

		// Verify download filename contains expected pattern
		const filename = download.suggestedFilename();
		expect( filename ).toMatch( /BodyRefactoring_Backup.*\.json/ );

		// Read and verify content
		const downloadPath = await download.path();
		const content = fs.readFileSync( downloadPath, 'utf-8' );
		const data = JSON.parse( content );

		// Should contain at least one key
		expect( Object.keys( data ).length ).toBeGreaterThan( 0 );
	} );

	test( 'can import data from JSON file', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Create a test backup file with some data
		const testData = {
			body_refactoring_v1_2026_01_01_test_exercise: 'true',
			body_refactoring_note_2026_01_01: 'Test note from import',
		};

		// Write test file
		const testFilePath = path.join( __dirname, '../fixtures/test-import.json' );
		fs.writeFileSync( testFilePath, JSON.stringify( testData ) );

		try {
			// Set up dialog handler for confirmation
			page.on( 'dialog', async ( dialog ) => {
				await dialog.accept();
			} );

			// Find the hidden file input
			const fileInput = page.locator( '#import-input' );

			// Upload the test file
			await fileInput.setInputFiles( testFilePath );

			// Wait for import to complete and page to refresh
			await page.waitForTimeout( 1000 );

			// Verify the data was imported by checking localStorage
			const importedNote = await page.evaluate( () => {
				return localStorage.getItem( 'body_refactoring_note_2026_01_01' );
			} );

			expect( importedNote ).toBe( 'Test note from import' );
		} finally {
			// Clean up test file
			if ( fs.existsSync( testFilePath ) ) {
				fs.unlinkSync( testFilePath );
			}
		}
	} );

	test( 'export includes checkmarks, notes, and settings', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Set various types of data
		await page.evaluate( () => {
			localStorage.setItem( 'body_refactoring_v1_2026_01_20_test', 'true' );
			localStorage.setItem( 'body_refactoring_note_2026_01_20', 'Test note' );
			localStorage.setItem( 'body_refactoring_weight_test_ex', '50' );
			localStorage.setItem( 'body_refactoring_unit_test_ex', 'KG' );
		} );

		// Export
		const downloadPromise = page.waitForEvent( 'download' );
		await app.openMenu();
		await page.locator( 'button:has-text("Backup speichern")' ).click();

		const download = await downloadPromise;
		const downloadPath = await download.path();
		const content = fs.readFileSync( downloadPath, 'utf-8' );
		const data = JSON.parse( content );

		// Verify all types of data are included
		expect( data[ 'body_refactoring_v1_2026_01_20_test' ] ).toBe( 'true' );
		expect( data[ 'body_refactoring_note_2026_01_20' ] ).toBe( 'Test note' );
		expect( data[ 'body_refactoring_weight_test_ex' ] ).toBe( '50' );
		expect( data[ 'body_refactoring_unit_test_ex' ] ).toBe( 'KG' );
	} );

	test( 'import restores data after clearing', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// First export current data
		const todayCard = page.locator( '.day-card.day-active' );
		await todayCard.click();
		const exerciseRow = todayCard.locator( '.exercise-row' ).first();
		await exerciseRow.waitFor( { state: 'visible' } );
		await exerciseRow.locator( '.check-circle' ).click( { force: true } );
		await page.waitForTimeout( 300 );

		// Get the storage key for verification
		const storageKeys = await page.evaluate( () => {
			return Object.keys( localStorage ).filter( ( k ) =>
				k.startsWith( 'body_refactoring_v1_' )
			);
		} );

		if ( storageKeys.length > 0 ) {
			const testKey = storageKeys[ 0 ];

			// Export
			const downloadPromise = page.waitForEvent( 'download' );
			await app.openMenu();
			await page.locator( 'button:has-text("Backup speichern")' ).click();
			const download = await downloadPromise;
			const downloadPath = await download.path();

			// Clear localStorage
			await page.evaluate( () => {
				const keysToRemove = Object.keys( localStorage ).filter( ( k ) =>
					k.startsWith( 'body_refactoring' )
				);
				keysToRemove.forEach( ( k ) => localStorage.removeItem( k ) );
			} );

			// Verify it's cleared
			const clearedValue = await page.evaluate(
				( key ) => localStorage.getItem( key ),
				testKey
			);
			expect( clearedValue ).toBeNull();

			// Import the backup
			page.on( 'dialog', async ( dialog ) => {
				await dialog.accept();
			} );
			await page.locator( '#import-input' ).setInputFiles( downloadPath );
			await page.waitForTimeout( 1000 );

			// Verify data is restored
			const restoredValue = await page.evaluate(
				( key ) => localStorage.getItem( key ),
				testKey
			);
			expect( restoredValue ).toBe( 'true' );
		}
	} );
} );
