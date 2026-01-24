// @ts-check
const { test, expect } = require( '@playwright/test' );
const { AppPage } = require( '../pages/AppPage' );
const { setupMockSchedule } = require( '../fixtures/test-helpers' );

test.describe( 'Color Scheme', () => {
	test.beforeEach( async ( { page } ) => {
		await setupMockSchedule( page );
	} );

	test( 'config-theme style tag is present', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Check that the config-theme style tag exists
		const configThemeStyle = page.locator( 'style#config-theme' );
		await expect( configThemeStyle ).toBeAttached();
	} );

	test( 'config-theme contains CSS root block', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Get the content of the config-theme style tag
		const styleContent = await page.locator( 'style#config-theme' ).textContent();

		// Should contain :root block
		expect( styleContent ).toContain( ':root' );
	} );

	test( 'config-theme contains primary color variables', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Get the content of the config-theme style tag
		const styleContent = await page.locator( 'style#config-theme' ).textContent();

		// Should contain color variables
		expect( styleContent ).toContain( '--color-primary' );
		expect( styleContent ).toContain( '--color-primary-rgb' );
	} );

	test( 'primary color CSS variable is valid hex color', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		const primaryColor = await page.evaluate( () => {
			return getComputedStyle( document.documentElement )
				.getPropertyValue( '--color-primary' )
				.trim();
		} );

		// Should be a valid hex color
		expect( primaryColor ).toMatch( /^#[0-9a-f]{6}$/i );
	} );

	test( 'primary RGB CSS variable contains valid values', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		const primaryRgb = await page.evaluate( () => {
			return getComputedStyle( document.documentElement )
				.getPropertyValue( '--color-primary-rgb' )
				.trim();
		} );

		// Should be valid RGB values (e.g., "56, 189, 248")
		expect( primaryRgb ).toMatch( /^\d{1,3},\s*\d{1,3},\s*\d{1,3}$/ );
	} );

	test( 'success color CSS variable is valid hex color', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		const successColor = await page.evaluate( () => {
			return getComputedStyle( document.documentElement )
				.getPropertyValue( '--color-success' )
				.trim();
		} );

		expect( successColor ).toMatch( /^#[0-9a-f]{6}$/i );
	} );

	test( 'danger color CSS variable is valid hex color', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		const dangerColor = await page.evaluate( () => {
			return getComputedStyle( document.documentElement )
				.getPropertyValue( '--color-danger' )
				.trim();
		} );

		expect( dangerColor ).toMatch( /^#[0-9a-f]{6}$/i );
	} );

	test( 'FAB uses primary color from CSS variable', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Get the primary RGB values
		const primaryRgb = await page.evaluate( () => {
			return getComputedStyle( document.documentElement )
				.getPropertyValue( '--color-primary-rgb' )
				.trim();
		} );

		const fab = page.locator( '#fab-timer' );
		await expect( fab ).toBeVisible();

		// FAB background should contain the primary RGB values
		const fabBgColor = await fab.evaluate( ( el ) => {
			return getComputedStyle( el ).backgroundColor;
		} );

		// Extract RGB values from primaryRgb (e.g., "34, 197, 94" -> ["34", "197", "94"])
		const rgbParts = primaryRgb.split( ',' ).map( ( s ) => s.trim() );

		// FAB background should use these RGB values (with some alpha)
		expect( fabBgColor ).toContain( rgbParts[ 0 ] );
		expect( fabBgColor ).toContain( rgbParts[ 1 ] );
		expect( fabBgColor ).toContain( rgbParts[ 2 ] );
	} );

	test( 'timer chips use primary color from CSS variable', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Get the primary color hex value
		const primaryColor = await page.evaluate( () => {
			return getComputedStyle( document.documentElement )
				.getPropertyValue( '--color-primary' )
				.trim();
		} );

		// Expand today's card to reveal timer chips
		const todayCard = page.locator( '.day-card.day-active' );
		await todayCard.click();

		// Wait for exercises to load
		await todayCard.locator( '.exercise-row' ).first().waitFor( { state: 'visible' } );

		// Find a timer chip
		const timerChip = todayCard.locator( '.system-timer-chip' ).first();
		await expect( timerChip ).toBeVisible();

		// Timer chip text color should match primary color
		const chipColor = await timerChip.evaluate( ( el ) => {
			return getComputedStyle( el ).color;
		} );

		// Convert hex to RGB for comparison
		const hexToRgb = ( hex ) => {
			const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec( hex );
			return result ? `rgb(${ parseInt( result[ 1 ], 16 ) }, ${ parseInt( result[ 2 ], 16 ) }, ${ parseInt( result[ 3 ], 16 ) })` : null;
		};

		expect( chipColor ).toBe( hexToRgb( primaryColor ) );
	} );

	test( 'app gradient CSS variable is set', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		const gradient = await page.evaluate( () => {
			return getComputedStyle( document.documentElement )
				.getPropertyValue( '--app-gradient' )
				.trim();
		} );

		// Should contain linear-gradient
		expect( gradient ).toContain( 'linear-gradient' );
	} );

	test( 'app accent CSS variable is valid hex color', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		const accent = await page.evaluate( () => {
			return getComputedStyle( document.documentElement )
				.getPropertyValue( '--app-accent' )
				.trim();
		} );

		expect( accent ).toMatch( /^#[0-9a-f]{6}$/i );
	} );

	test( 'background color CSS variable is valid hex color', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		const bgColor = await page.evaluate( () => {
			return getComputedStyle( document.documentElement )
				.getPropertyValue( '--color-bg-primary' )
				.trim();
		} );

		expect( bgColor ).toMatch( /^#[0-9a-f]{6}$/i );
	} );

	test( 'text color CSS variable is valid hex color', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		const textColor = await page.evaluate( () => {
			return getComputedStyle( document.documentElement )
				.getPropertyValue( '--color-text-primary' )
				.trim();
		} );

		expect( textColor ).toMatch( /^#[0-9a-f]{6}$/i );
	} );

	test( 'warning color CSS variables are valid', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		const warningColor = await page.evaluate( () => {
			return getComputedStyle( document.documentElement )
				.getPropertyValue( '--color-warning' )
				.trim();
		} );

		const warningDark = await page.evaluate( () => {
			return getComputedStyle( document.documentElement )
				.getPropertyValue( '--color-warning-dark' )
				.trim();
		} );

		expect( warningColor ).toMatch( /^#[0-9a-f]{6}$/i );
		expect( warningDark ).toMatch( /^#[0-9a-f]{6}$/i );
	} );

	test( 'all essential CSS variables are defined', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Check all essential CSS variables are defined
		const variables = await page.evaluate( () => {
			const style = getComputedStyle( document.documentElement );
			return {
				primary: style.getPropertyValue( '--color-primary' ).trim(),
				primaryRgb: style.getPropertyValue( '--color-primary-rgb' ).trim(),
				success: style.getPropertyValue( '--color-success' ).trim(),
				danger: style.getPropertyValue( '--color-danger' ).trim(),
				warning: style.getPropertyValue( '--color-warning' ).trim(),
				bgPrimary: style.getPropertyValue( '--color-bg-primary' ).trim(),
				textPrimary: style.getPropertyValue( '--color-text-primary' ).trim(),
			};
		} );

		// All should be non-empty
		expect( variables.primary ).not.toBe( '' );
		expect( variables.primaryRgb ).not.toBe( '' );
		expect( variables.success ).not.toBe( '' );
		expect( variables.danger ).not.toBe( '' );
		expect( variables.warning ).not.toBe( '' );
		expect( variables.bgPrimary ).not.toBe( '' );
		expect( variables.textPrimary ).not.toBe( '' );
	} );
} );
