/**
 * Page Object Model for the main Body Refactoring app.
 *
 * @see https://playwright.dev/docs/pom
 */
class AppPage {
	/**
	 * Create an AppPage instance.
	 *
	 * @param {import('@playwright/test').Page} page - Playwright page object.
	 */
	constructor( page ) {
		this.page = page;

		// Navigation elements
		this.prevWeekButton = page.locator( '#btn-prev' );
		this.nextWeekButton = page.locator( '#btn-next' );
		this.todayButton = page.locator( '#btn-today' );
		this.weekDisplay = page.locator( '#week-display' );

		// Schedule container
		this.scheduleContainer = page.locator( '#schedule-container' );
		this.dayCards = page.locator( '.day-card' );

		// Splash screen
		this.splashScreen = page.locator( '#splash-screen' );

		// Menu (burger menu is the dropdown)
		this.menuButton = page.locator( '#menu-btn' );
		this.menuDropdown = page.locator( '#menu-dropdown' );

		// Modals
		this.completionModal = page.locator( '#completion-modal' );
		this.recoveryModal = page.locator( '#recovery-modal' );
		this.sickModal = page.locator( '#sick-modal' );
	}

	/**
	 * Set consent cookie and navigate to the app.
	 *
	 * @param {Object} options - Navigation options.
	 * @param {boolean} options.skipIntro - Skip the intro modal (default: true).
	 */
	async goto( options = {} ) {
		const { skipIntro = true } = options;

		// Set consent cookie before navigating
		await this.page.context().addCookies( [ {
			name: 'br_consent',
			value: 'accepted',
			domain: 'bodyrefactoring.ddev.site',
			path: '/',
		} ] );

		// Skip intro modal by setting localStorage before page loads
		if ( skipIntro ) {
			await this.page.addInitScript( () => {
				localStorage.setItem( 'body_refactoring_intro_seen', 'true' );
			} );
		}

		await this.page.goto( '/' );
	}

	/**
	 * Wait for app to fully load (splash screen hidden, schedule visible).
	 */
	async waitForAppReady() {
		// Wait for splash screen to disappear
		await this.splashScreen.waitFor( { state: 'hidden', timeout: 15000 } );
		// Wait for schedule to be visible
		await this.scheduleContainer.waitFor( { state: 'visible' } );
	}

	/**
	 * Navigate to previous week.
	 */
	async goToPreviousWeek() {
		await this.prevWeekButton.click();
	}

	/**
	 * Navigate to next week.
	 */
	async goToNextWeek() {
		await this.nextWeekButton.click();
	}

	/**
	 * Jump to today.
	 */
	async goToToday() {
		await this.todayButton.click();
	}

	/**
	 * Open the menu dropdown.
	 */
	async openMenu() {
		await this.menuButton.click();
		await this.menuDropdown.waitFor( { state: 'visible' } );
	}

	/**
	 * Close the menu dropdown by clicking elsewhere.
	 */
	async closeMenu() {
		// Click outside to close
		await this.page.locator( 'body' ).click( { position: { x: 10, y: 10 } } );
		await this.menuDropdown.waitFor( { state: 'hidden' } );
	}

	/**
	 * Get the number of day cards displayed.
	 *
	 * @return {Promise<number>} Number of day cards.
	 */
	async getDayCardCount() {
		return await this.dayCards.count();
	}

	/**
	 * Get a specific day card by index.
	 *
	 * @param {number} index - Zero-based index of the day card.
	 * @return {import('@playwright/test').Locator} Day card locator.
	 */
	getDayCard( index ) {
		return this.dayCards.nth( index );
	}

	/**
	 * Check an exercise checkbox.
	 *
	 * @param {string} exerciseId - The exercise ID.
	 */
	async checkExercise( exerciseId ) {
		const checkbox = this.page.locator( `input[data-exercise-id="${ exerciseId }"]` );
		await checkbox.check();
	}

	/**
	 * Uncheck an exercise checkbox.
	 *
	 * @param {string} exerciseId - The exercise ID.
	 */
	async uncheckExercise( exerciseId ) {
		const checkbox = this.page.locator( `input[data-exercise-id="${ exerciseId }"]` );
		await checkbox.uncheck();
	}

	/**
	 * Check if an exercise is completed.
	 *
	 * @param {string} exerciseId - The exercise ID.
	 * @return {Promise<boolean>} True if exercise is checked.
	 */
	async isExerciseChecked( exerciseId ) {
		const checkbox = this.page.locator( `input[data-exercise-id="${ exerciseId }"]` );
		return await checkbox.isChecked();
	}

	/**
	 * Clear all localStorage data.
	 */
	async clearStorage() {
		await this.page.evaluate( () => {
			localStorage.clear();
		} );
	}

	/**
	 * Set localStorage data.
	 *
	 * @param {string} key   - Storage key.
	 * @param {string} value - Storage value.
	 */
	async setStorageItem( key, value ) {
		await this.page.evaluate(
			( { k, v } ) => {
				localStorage.setItem( k, v );
			},
			{ k: key, v: value }
		);
	}

	/**
	 * Get localStorage data.
	 *
	 * @param {string} key - Storage key.
	 * @return {Promise<string|null>} Storage value.
	 */
	async getStorageItem( key ) {
		return await this.page.evaluate( ( k ) => localStorage.getItem( k ), key );
	}
}

module.exports = { AppPage };
