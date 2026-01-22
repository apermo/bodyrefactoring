/**
 * Test Helpers for Playwright E2E Tests
 *
 * Provides utilities for mocking schedules and common test operations.
 */

const mockSchedule = require( './mock-schedule.json' );

/**
 * Get today's date as ISO string (YYYY-MM-DD).
 *
 * @return {string} Today's date in ISO format.
 */
function getTodayISO() {
	return new Date().toISOString().split( 'T' )[ 0 ];
}

/**
 * Get a date relative to today.
 *
 * @param {number} daysOffset - Number of days to offset (negative for past).
 * @return {string} Date in ISO format.
 */
function getDateRelativeToToday( daysOffset ) {
	const date = new Date();
	date.setDate( date.getDate() + daysOffset );
	return date.toISOString().split( 'T' )[ 0 ];
}

/**
 * Setup mock schedule routes for a Playwright page.
 *
 * Intercepts schedule API calls and returns mock data.
 *
 * @param {import('@playwright/test').Page} page - Playwright page object.
 * @param {Object}                          options - Configuration options.
 * @param {string}                          options.scheduleDate - Date for the mock schedule (defaults to 30 days ago).
 * @return {Promise<void>}
 */
async function setupMockSchedule( page, options = {} ) {
	const scheduleDate = options.scheduleDate || getDateRelativeToToday( -30 );

	// Mock the schedule list endpoint
	await page.route( '**/trainings/', async ( route ) => {
		const scheduleList = [
			{
				date: scheduleDate,
				file: 'mock-schedule.json',
				mtime: Date.now(),
			},
		];
		await route.fulfill( {
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify( scheduleList ),
		} );
	} );

	// Mock the mock schedule file
	await page.route( '**/trainings/mock-schedule.json*', async ( route ) => {
		await route.fulfill( {
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify( mockSchedule ),
		} );
	} );

	// Mock recovery schedule
	await page.route( '**/trainings/schedule-recovery.json*', async ( route ) => {
		const recoverySchedule = {
			version: 1,
			days: [
				{
					id: 'recovery',
					dayIndex: 0,
					name: 'RECOVERY',
					theme: 'Aktive Erholung',
					icon: 'heart-pulse',
					colorClass: 'text-purple-400',
					bgClass: 'bg-purple-500/10',
					details: [
						{
							id: 'recovery_stretch',
							type: 'cool',
							title: 'Leichtes Stretching',
							desc: '10-15 Minuten sanftes Dehnen',
							timers: [ { l: '10 Min', s: 600 } ],
						},
						{
							id: 'recovery_walk',
							type: 'cool',
							title: 'Spaziergang',
							desc: '20-30 Minuten lockeres Gehen',
						},
					],
				},
			],
		};
		await route.fulfill( {
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify( recoverySchedule ),
		} );
	} );

	// Mock sick schedule
	await page.route( '**/trainings/schedule-sick.json*', async ( route ) => {
		const sickSchedule = {
			version: 1,
			days: [
				{
					id: 'sick',
					dayIndex: 0,
					name: 'KRANK',
					theme: 'Ruhe & Erholung',
					icon: 'thermometer',
					colorClass: 'text-red-400',
					bgClass: 'bg-red-500/10',
					details: [
						{
							id: 'sick_rest',
							type: 'cool',
							title: 'Ruhe',
							desc: 'Heute ausruhen und erholen',
						},
						{
							id: 'sick_hydrate',
							type: 'cool',
							title: 'Trinken',
							desc: 'Viel Wasser und Tee trinken',
						},
					],
				},
			],
		};
		await route.fulfill( {
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify( sickSchedule ),
		} );
	} );
}

/**
 * Clear all app localStorage data.
 *
 * @param {import('@playwright/test').Page} page - Playwright page object.
 * @return {Promise<void>}
 */
async function clearAppStorage( page ) {
	await page.evaluate( () => {
		const keysToRemove = [];
		for ( let i = 0; i < localStorage.length; i++ ) {
			const key = localStorage.key( i );
			if ( key && key.startsWith( 'body_refactoring' ) ) {
				keysToRemove.push( key );
			}
		}
		keysToRemove.forEach( ( key ) => localStorage.removeItem( key ) );
	} );
}

/**
 * Set localStorage item with app prefix handling.
 *
 * @param {import('@playwright/test').Page} page  - Playwright page object.
 * @param {string}                          key   - Storage key.
 * @param {string}                          value - Storage value.
 * @return {Promise<void>}
 */
async function setStorageItem( page, key, value ) {
	await page.evaluate(
		( { k, v } ) => {
			localStorage.setItem( k, v );
		},
		{ k: key, v: value }
	);
}

/**
 * Get localStorage item.
 *
 * @param {import('@playwright/test').Page} page - Playwright page object.
 * @param {string}                          key  - Storage key.
 * @return {Promise<string|null>} Storage value.
 */
async function getStorageItem( page, key ) {
	return await page.evaluate( ( k ) => localStorage.getItem( k ), key );
}

/**
 * Wait for rep counter modal to be visible.
 *
 * @param {import('@playwright/test').Page} page - Playwright page object.
 * @return {Promise<void>}
 */
async function waitForRepCounterModal( page ) {
	await page.locator( '#rep-counter-modal' ).waitFor( { state: 'visible' } );
}

/**
 * Wait for rep counter to complete all sets.
 *
 * Handles clicking through "Bereit?" (Ready?) prompts between sets.
 *
 * @param {import('@playwright/test').Page} page    - Playwright page object.
 * @param {number}                          timeout - Maximum wait time in ms.
 * @return {Promise<void>}
 */
async function waitForRepCounterComplete( page, timeout = 60000 ) {
	const modal = page.locator( '#rep-counter-modal' );
	const repNumber = page.locator( '#rep-current-number' );
	const startTime = Date.now();

	while ( Date.now() - startTime < timeout ) {
		// Check if modal is hidden (completed)
		const isHidden = await modal.isHidden().catch( () => false );
		if ( isHidden ) {
			return;
		}

		// Check for "Bereit?" state and click to continue
		const text = await repNumber.textContent().catch( () => '' );
		if ( text === 'Bereit?' ) {
			// Use force click as element may be animating
			await repNumber.click( { force: true } );
			await page.waitForTimeout( 500 );
		}

		await page.waitForTimeout( 200 );
	}

	throw new Error( `Rep counter did not complete within ${ timeout }ms` );
}

/**
 * Click the rep counter chip for a specific exercise.
 *
 * @param {import('@playwright/test').Page} page       - Playwright page object.
 * @param {string}                          exerciseId - The exercise ID.
 * @return {Promise<void>}
 */
async function startRepCounterForExercise( page, exerciseId ) {
	// Find the timer chip that starts the rep counter for this exercise
	const chip = page.locator( `.timer-chip[onclick*="startRepCounter"][onclick*="${ exerciseId }"]` );
	await chip.click();
}

module.exports = {
	getTodayISO,
	getDateRelativeToToday,
	setupMockSchedule,
	clearAppStorage,
	setStorageItem,
	getStorageItem,
	waitForRepCounterModal,
	waitForRepCounterComplete,
	startRepCounterForExercise,
	mockSchedule,
};
