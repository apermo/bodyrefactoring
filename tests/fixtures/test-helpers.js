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

	// Mock the schedule list endpoint (supports both /schedules/ and /trainings/)
	await page.route( '**/{schedules,trainings}/', async ( route ) => {
		const scheduleList = [
			{
				date: scheduleDate,
				url: 'schedules/?file=mock-schedule.json',
				mtime: Date.now(),
			},
		];
		await route.fulfill( {
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify( scheduleList ),
		} );
	} );

	// Mock the mock schedule file via API
	await page.route( '**/{schedules,trainings}/*file=mock-schedule.json*', async ( route ) => {
		await route.fulfill( {
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify( mockSchedule ),
		} );
	} );

	// Mock recovery schedule via API
	await page.route( '**/{schedules,trainings}/*file=schedule-recovery.json*', async ( route ) => {
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

	// Mock sick schedule via API
	await page.route( '**/{schedules,trainings}/*file=schedule-sick.json*', async ( route ) => {
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

/**
 * Setup test configuration overrides.
 *
 * Injects configuration overrides that will be merged with APP_CONFIG.
 * Useful for testing features that require specific settings.
 *
 * @param {import('@playwright/test').Page} page            - Playwright page object.
 * @param {Object}                          configOverrides - Configuration object to merge.
 * @return {Promise<void>}
 *
 * @example
 * // Enable login feature for testing
 * await setupTestConfig(page, {
 *     features: { loginEnabled: true }
 * });
 *
 * @example
 * // Override quotes for testing
 * await setupTestConfig(page, {
 *     strings: { quotes: ['Test quote 1', 'Test quote 2'] }
 * });
 */
async function setupTestConfig( page, configOverrides = {} ) {
	await page.addInitScript( ( config ) => {
		window.TEST_CONFIG_OVERRIDE = config;
	}, configOverrides );
}

/**
 * Get the current app configuration from the page.
 *
 * @param {import('@playwright/test').Page} page - Playwright page object.
 * @return {Promise<Object>} The merged configuration object.
 */
async function getAppConfig( page ) {
	return await page.evaluate( () => {
		if ( window.TEST_CONFIG_OVERRIDE ) {
			// Deep merge (simplified)
			const merge = ( target, source ) => {
				const result = { ...target };
				for ( const key in source ) {
					if ( source[ key ] && typeof source[ key ] === 'object' && !Array.isArray( source[ key ] ) ) {
						result[ key ] = merge( result[ key ] || {}, source[ key ] );
					} else {
						result[ key ] = source[ key ];
					}
				}
				return result;
			};
			return merge( window.APP_CONFIG || {}, window.TEST_CONFIG_OVERRIDE );
		}
		return window.APP_CONFIG || {};
	} );
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
	setupTestConfig,
	getAppConfig,
	mockSchedule,
};
