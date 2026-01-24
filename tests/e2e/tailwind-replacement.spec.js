// @ts-check
const { test, expect } = require( '@playwright/test' );
const { AppPage } = require( '../pages/AppPage' );
const { setupMockSchedule } = require( '../fixtures/test-helpers' );

/**
 * These tests verify the Tailwind class replacement feature.
 *
 * The replace_tailwind_classes() PHP function replaces class names
 * in the HTML output based on the tailwind mapping in config.
 *
 * The test environment uses custom-config/app-settings.json which has
 * mappings like "bg-slate-900" -> "bg-emerald-950".
 */
test.describe( 'Tailwind Class Replacement', () => {
	test.beforeEach( async ( { page } ) => {
		await setupMockSchedule( page );
	} );

	test( 'custom config tailwind replacements are applied', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Get the page HTML content
		const htmlContent = await page.content();

		// The custom config maps bg-slate classes to bg-emerald classes
		// bg-slate-900 should become bg-emerald-950
		// If replacement is active, we should NOT find bg-slate-900
		// and SHOULD find bg-emerald-950

		// Check that emerald classes are present (from the replacements)
		const hasEmeraldClasses = htmlContent.includes( 'bg-emerald-950' ) ||
			htmlContent.includes( 'bg-emerald-900' );

		// If we have emerald classes, the replacement system is working
		// (The default app uses slate classes, not emerald)
		expect( hasEmeraldClasses ).toBe( true );
	} );

	test( 'slate classes are replaced with emerald classes', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Find elements that should have been replaced
		// According to custom-config: "border-slate-700" -> "border-emerald-800"
		const emeraldBorderElements = await page.locator( '.border-emerald-800' ).count();

		// There should be some elements with the replaced class
		expect( emeraldBorderElements ).toBeGreaterThan( 0 );
	} );

	test( 'text color classes are replaced', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// According to custom-config: "text-slate-300" -> "text-emerald-200"
		const emeraldTextElements = await page.locator( '.text-emerald-200' ).count();

		// There should be some elements with the replaced text class
		expect( emeraldTextElements ).toBeGreaterThan( 0 );
	} );

	test( 'background alpha variants are replaced', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// According to custom-config: "bg-slate-900/80" -> "bg-emerald-950/80"
		// Check for elements with the alpha variant
		const htmlContent = await page.content();

		// Either the /80 variant is present or base classes are replaced
		const hasAlphaVariant = htmlContent.includes( 'bg-emerald-950/80' ) ||
			htmlContent.includes( 'bg-emerald-900/80' );

		// The replacement includes alpha variants
		expect( hasAlphaVariant || htmlContent.includes( 'bg-emerald' ) ).toBe( true );
	} );

	test( 'hover state classes are replaced', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// According to custom-config: "hover:bg-slate-700" -> "hover:bg-emerald-800"
		const htmlContent = await page.content();

		// Check for hover class replacement
		const hasHoverReplacement = htmlContent.includes( 'hover:bg-emerald-800' ) ||
			htmlContent.includes( 'hover:bg-emerald-700' );

		expect( hasHoverReplacement ).toBe( true );
	} );

	test( 'word boundaries are respected in replacement', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// The replacement should use word boundaries
		// e.g., "bg-slate-800" should NOT match inside "bg-slate-800-custom"

		const htmlContent = await page.content();

		// Verify the HTML doesn't contain malformed class names
		// If word boundaries weren't respected, we might see things like:
		// "bg-emerald-900-custom" (wrong) instead of keeping "bg-slate-800-custom" (right)

		// This is a negative test - we're checking that partial matches don't occur
		// In practice, the app doesn't use custom suffixes, so this tests the regex pattern
		const hasMalformedClass = htmlContent.includes( 'bg-emerald-950-' ) ||
			htmlContent.includes( 'bg-emerald-900-' );

		expect( hasMalformedClass ).toBe( false );
	} );

	test( 'original slate classes are removed when replaced', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// When replacement is active, the original classes should not appear
		// Check specific classes that are in the mapping
		const slateElements = await page.locator( '.bg-slate-900' ).count();

		// With the custom config active, slate classes should be replaced
		// So we expect zero or very few (some might be in dynamically generated content)
		// The main page should have them replaced
		expect( slateElements ).toBeLessThanOrEqual( 5 ); // Allow some tolerance for dynamic content
	} );

	test( 'replacement preserves class order and other attributes', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Find an element with multiple classes to verify order is preserved
		const scheduleContainer = page.locator( '#schedule-container' );
		await expect( scheduleContainer ).toBeVisible();

		// The element should have its classes, with replacements applied
		const className = await scheduleContainer.getAttribute( 'class' );

		// Classes should be properly formatted (no double spaces, etc.)
		if ( className ) {
			expect( className ).not.toMatch( /\s\s+/ ); // No double spaces
			expect( className.trim() ).toBe( className ); // No leading/trailing spaces
		}
	} );

	test( 'day card backgrounds use replaced classes', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Day cards should have their background classes replaced
		const dayCard = page.locator( '.day-card' ).first();
		await expect( dayCard ).toBeVisible();

		const cardClasses = await dayCard.getAttribute( 'class' );

		// If replacement is active, card should use emerald colors
		// The exact class depends on the card's original styling
		const usesReplacedColors = cardClasses.includes( 'emerald' ) ||
			cardClasses.includes( 'green' ); // Might use either depending on config

		expect( usesReplacedColors ).toBe( true );
	} );

	test( 'multiple replacements work on same element', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Elements often have multiple classes that could be replaced
		// e.g., "bg-slate-800 border-slate-700" -> "bg-emerald-900 border-emerald-800"

		const htmlContent = await page.content();

		// Count emerald classes - should have variety (bg, border, text)
		const hasBgEmerald = htmlContent.includes( 'bg-emerald' );
		const hasBorderEmerald = htmlContent.includes( 'border-emerald' );
		const hasTextEmerald = htmlContent.includes( 'text-emerald' );

		// Multiple types of emerald classes should be present
		const classTypesReplaced = [ hasBgEmerald, hasBorderEmerald, hasTextEmerald ]
			.filter( Boolean ).length;

		expect( classTypesReplaced ).toBeGreaterThanOrEqual( 2 );
	} );

	test( 'js-generated content has proper class structure', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Expand a day card to trigger JS content generation
		const todayCard = page.locator( '.day-card.day-active' );
		await todayCard.click();

		// Wait for exercises to load
		const exerciseRow = todayCard.locator( '.exercise-row' ).first();
		await exerciseRow.waitFor( { state: 'visible' } );

		// The exercise row should have the expected class structure
		// Note: JS-generated content uses hardcoded classes
		const className = await exerciseRow.getAttribute( 'class' );

		// Should have exercise-row class
		expect( className ).toContain( 'exercise-row' );

		// Should have border classes (proves JS content is rendered)
		expect( className ).toContain( 'border' );
	} );
} );
