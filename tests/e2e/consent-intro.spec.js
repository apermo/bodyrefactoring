// @ts-check
const { test, expect } = require( '@playwright/test' );
const { setupMockSchedule } = require( '../fixtures/test-helpers' );

test.describe( 'Consent and Intro Screens', () => {
	test.beforeEach( async ( { page } ) => {
		// Setup mock schedule but do NOT set consent cookie or intro localStorage
		await setupMockSchedule( page );
	} );

	test( 'shows consent screen on first visit', async ( { page } ) => {
		await page.goto( '/' );

		// Consent screen should be visible
		const consentHeading = page.locator( 'h2:has-text("Deine Privatsphäre")' );
		await expect( consentHeading ).toBeVisible();

		// Should show privacy information
		await expect( page.locator( 'text=Datenschutz & Einwilligung' ) ).toBeVisible();
		await expect( page.locator( 'text=Tailwind CSS' ) ).toBeVisible();
		await expect( page.locator( 'text=Google Fonts' ) ).toBeVisible();

		// Both buttons should be present
		await expect( page.getByRole( 'button', { name: 'Ablehnen' } ) ).toBeVisible();
		await expect( page.getByRole( 'button', { name: 'Akzeptieren & Fortfahren' } ) ).toBeVisible();
	} );

	test( 'accepting consent sets cookie and shows intro modal', async ( { page, context } ) => {
		await page.goto( '/' );

		// Verify no consent cookie exists initially
		let cookies = await context.cookies();
		let consentCookie = cookies.find( ( c ) => c.name === 'br_consent' );
		expect( consentCookie ).toBeUndefined();

		// Click accept button
		await page.getByRole( 'button', { name: 'Akzeptieren & Fortfahren' } ).click();

		// Verify consent cookie is now set
		cookies = await context.cookies();
		consentCookie = cookies.find( ( c ) => c.name === 'br_consent' );
		expect( consentCookie ).toBeDefined();
		expect( consentCookie.value ).toBe( 'accepted' );

		// Intro modal should now be visible
		const introHeading = page.locator( 'h2:has-text("Willkommen bei Body Refactoring")' );
		await expect( introHeading ).toBeVisible();
	} );

	test( 'declining consent does not set cookie', async ( { page, context } ) => {
		await page.goto( '/' );

		// Click decline button
		await page.getByRole( 'button', { name: 'Ablehnen' } ).click();

		// Verify consent cookie is NOT set
		const cookies = await context.cookies();
		const consentCookie = cookies.find( ( c ) => c.name === 'br_consent' );
		expect( consentCookie ).toBeUndefined();

		// Should still be on consent screen (page reloads or stays)
		// The app behavior on decline may vary - adjust assertion as needed
		await expect( page.locator( 'h2:has-text("Deine Privatsphäre")' ) ).toBeVisible();
	} );

	test( 'intro modal shows app features', async ( { page } ) => {
		// Set consent cookie but NOT intro localStorage
		await page.context().addCookies( [ {
			name: 'br_consent',
			value: 'accepted',
			domain: 'bodyrefactoring.ddev.site',
			path: '/',
		} ] );

		await page.goto( '/' );

		// Wait for intro modal
		const introModal = page.locator( '#intro-modal' );
		await expect( introModal ).toBeVisible();

		// Check features are listed
		await expect( page.locator( 'text=Rep Counter' ) ).toBeVisible();
		await expect( page.locator( 'text=Notizen' ) ).toBeVisible();
		await expect( page.locator( 'text=Gamification' ) ).toBeVisible();
		await expect( page.locator( 'text=Streak-System' ) ).toBeVisible();
		await expect( page.locator( 'text=Sick/Recovery Mode' ) ).toBeVisible();
		await expect( page.locator( 'text=Progressive Overload' ) ).toBeVisible();

		// "Los geht's" button should be present
		await expect( page.getByRole( 'button', { name: "Los geht's!" } ) ).toBeVisible();
	} );

	test( 'dismissing intro sets localStorage and shows app', async ( { page } ) => {
		// Set consent cookie but NOT intro localStorage
		await page.context().addCookies( [ {
			name: 'br_consent',
			value: 'accepted',
			domain: 'bodyrefactoring.ddev.site',
			path: '/',
		} ] );

		await page.goto( '/' );

		// Wait for splash screen to hide first
		await page.locator( '#splash-screen' ).waitFor( { state: 'hidden', timeout: 15000 } );

		// Verify intro_seen is not set initially
		let introSeen = await page.evaluate( () =>
			localStorage.getItem( 'body_refactoring_intro_seen' )
		);
		expect( introSeen ).toBeNull();

		// Wait for intro modal and click dismiss
		await page.getByRole( 'button', { name: "Los geht's!" } ).click();

		// Verify localStorage is now set
		introSeen = await page.evaluate( () =>
			localStorage.getItem( 'body_refactoring_intro_seen' )
		);
		expect( introSeen ).toBe( 'true' );

		// Wait for transition (300ms) and verify modal is hidden
		const introModal = page.locator( '#intro-modal' );
		await expect( introModal ).toHaveCSS( 'opacity', '0', { timeout: 2000 } );

		// Schedule should now be visible
		await expect( page.locator( '#schedule-container' ) ).toBeVisible();
	} );

	test( 'full flow: consent → intro → app ready', async ( { page, context } ) => {
		await page.goto( '/' );

		// Step 1: Accept consent
		await expect( page.locator( 'h2:has-text("Deine Privatsphäre")' ) ).toBeVisible();
		await page.getByRole( 'button', { name: 'Akzeptieren & Fortfahren' } ).click();

		// Verify cookie
		const cookies = await context.cookies();
		const consentCookie = cookies.find( ( c ) => c.name === 'br_consent' );
		expect( consentCookie?.value ).toBe( 'accepted' );

		// Step 2: Dismiss intro
		await expect( page.locator( 'h2:has-text("Willkommen bei Body Refactoring")' ) ).toBeVisible();
		await page.getByRole( 'button', { name: "Los geht's!" } ).click();

		// Verify localStorage
		const introSeen = await page.evaluate( () =>
			localStorage.getItem( 'body_refactoring_intro_seen' )
		);
		expect( introSeen ).toBe( 'true' );

		// Step 3: App should be ready
		await expect( page.locator( '#schedule-container' ) ).toBeVisible();
		await expect( page.locator( '.day-card' ).first() ).toBeVisible();

		// Today's card should be present
		await expect( page.locator( '.day-card.day-active' ) ).toBeVisible();
	} );

	test( 'returning visitor skips consent and intro', async ( { page } ) => {
		// Simulate returning visitor with both cookie and localStorage set
		await page.context().addCookies( [ {
			name: 'br_consent',
			value: 'accepted',
			domain: 'bodyrefactoring.ddev.site',
			path: '/',
		} ] );

		await page.addInitScript( () => {
			localStorage.setItem( 'body_refactoring_intro_seen', 'true' );
		} );

		await page.goto( '/' );

		// Wait for splash to hide
		await page.locator( '#splash-screen' ).waitFor( { state: 'hidden', timeout: 15000 } );

		// Consent screen should NOT be visible
		await expect( page.locator( 'h2:has-text("Deine Privatsphäre")' ) ).toBeHidden();

		// Intro modal should NOT be visible (uses opacity-0 for hiding)
		await expect( page.locator( '#intro-modal' ) ).toHaveCSS( 'opacity', '0' );

		// App should be ready immediately
		await expect( page.locator( '#schedule-container' ) ).toBeVisible();
	} );
} );
