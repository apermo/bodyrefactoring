// @ts-check
const { test, expect } = require( '@playwright/test' );
const { getTodayISO, getDateRelativeToToday } = require( '../fixtures/test-helpers' );
const { AppPage } = require( '../pages/AppPage' );

/**
 * Schedule API E2E Tests
 *
 * Tests for the per-day schedule API endpoint: GET /schedules/day/?date=YYYY-MM-DD
 *
 * Response codes:
 * - 200: Schedule found
 * - 204: Date is skipped (override with type='skip')
 * - 400: Invalid date format
 * - 404: No schedule found for date
 * - 503: Database unavailable
 */
test.describe( 'Schedule API', () => {
	const API_ENDPOINT = '/schedules/day/';

	test.describe( 'Valid requests', () => {
		test( 'returns schedule for today', async ( { request, baseURL } ) => {
			const today = getTodayISO();
			const response = await request.get( `${ baseURL }${ API_ENDPOINT }?date=${ today }` );

			// Could be 200 (schedule found) or 404 (no template covers today)
			expect( [ 200, 404 ] ).toContain( response.status() );

			if ( response.status() === 200 ) {
				expect( response.headers()[ 'content-type' ] ).toContain( 'application/json' );
				const schedule = await response.json();

				// Verify required fields
				expect( schedule ).toHaveProperty( 'date', today );
				expect( schedule ).toHaveProperty( 'dayIndex' );
				expect( schedule.dayIndex ).toBeGreaterThanOrEqual( 0 );
				expect( schedule.dayIndex ).toBeLessThanOrEqual( 6 );
				expect( schedule ).toHaveProperty( 'id' );
				expect( schedule ).toHaveProperty( 'name' );
				expect( schedule ).toHaveProperty( 'details' );
				expect( Array.isArray( schedule.details ) ).toBe( true );
				expect( schedule ).toHaveProperty( 'hasOverride' );
				expect( typeof schedule.hasOverride ).toBe( 'boolean' );
			}
		} );

		test( 'returns schedule for date in past', async ( { request, baseURL } ) => {
			// Request a date from when the app was likely active
			const pastDate = '2026-01-20';
			const response = await request.get( `${ baseURL }${ API_ENDPOINT }?date=${ pastDate }` );

			// Could be 200, 204, or 404 depending on database state
			expect( [ 200, 204, 404 ] ).toContain( response.status() );

			if ( response.status() === 200 ) {
				const schedule = await response.json();
				expect( schedule.date ).toBe( pastDate );
			}
		} );

		test( 'returns correct day index for known date', async ( { request, baseURL } ) => {
			// 2026-01-19 is a Monday (dayIndex 1)
			const monday = '2026-01-19';
			const response = await request.get( `${ baseURL }${ API_ENDPOINT }?date=${ monday }` );

			if ( response.status() === 200 ) {
				const schedule = await response.json();
				expect( schedule.dayIndex ).toBe( 1 ); // Monday
			}
		} );

		test( 'exercise objects have required fields', async ( { request, baseURL } ) => {
			const today = getTodayISO();
			const response = await request.get( `${ baseURL }${ API_ENDPOINT }?date=${ today }` );

			if ( response.status() === 200 ) {
				const schedule = await response.json();

				if ( schedule.details.length > 0 ) {
					const exercise = schedule.details[ 0 ];

					// Required exercise fields
					expect( exercise ).toHaveProperty( 'id' );
					expect( exercise ).toHaveProperty( 'type' );
					expect( exercise ).toHaveProperty( 'title' );
					expect( typeof exercise.id ).toBe( 'string' );
					expect( typeof exercise.type ).toBe( 'string' );
					expect( typeof exercise.title ).toBe( 'string' );
				}
			}
		} );
	} );

	test.describe( 'Error handling', () => {
		test( 'returns 400 for missing date parameter', async ( { request, baseURL } ) => {
			const response = await request.get( `${ baseURL }${ API_ENDPOINT }` );

			expect( response.status() ).toBe( 400 );
			expect( response.headers()[ 'content-type' ] ).toContain( 'application/json' );

			const error = await response.json();
			expect( error ).toHaveProperty( 'error' );
			expect( error.error ).toContain( 'date' );
		} );

		test( 'returns 400 for invalid date format - wrong format', async ( { request, baseURL } ) => {
			const response = await request.get( `${ baseURL }${ API_ENDPOINT }?date=01-24-2026` );

			expect( response.status() ).toBe( 400 );
			const error = await response.json();
			expect( error.error ).toContain( 'Invalid date format' );
		} );

		test( 'returns 400 for invalid date format - not a date', async ( { request, baseURL } ) => {
			const response = await request.get( `${ baseURL }${ API_ENDPOINT }?date=not-a-date` );

			expect( response.status() ).toBe( 400 );
			const error = await response.json();
			expect( error.error ).toContain( 'Invalid date format' );
		} );

		test( 'returns 400 for invalid date - impossible date', async ( { request, baseURL } ) => {
			// February 30 doesn't exist
			const response = await request.get( `${ baseURL }${ API_ENDPOINT }?date=2026-02-30` );

			expect( response.status() ).toBe( 400 );
			const error = await response.json();
			expect( error.error ).toContain( 'Invalid date format' );
		} );

		test( 'returns 404 or 200 for date far in future', async ( { request, baseURL } ) => {
			// A date 10 years in the future - may return 200 if template has no end_date
			// or 404 if no template covers this date
			const futureDate = getDateRelativeToToday( 3650 );
			const response = await request.get( `${ baseURL }${ API_ENDPOINT }?date=${ futureDate }` );

			// Either 200 (template has no end date) or 404 (no matching template)
			expect( [ 200, 404 ] ).toContain( response.status() );

			if ( response.status() === 404 ) {
				const error = await response.json();
				expect( error ).toHaveProperty( 'error' );
				expect( error.error ).toContain( 'No schedule found' );
			}
		} );

		test( 'returns 404 for date far in past', async ( { request, baseURL } ) => {
			// A date 10 years in the past unlikely to have a schedule
			const pastDate = getDateRelativeToToday( -3650 );
			const response = await request.get( `${ baseURL }${ API_ENDPOINT }?date=${ pastDate }` );

			expect( response.status() ).toBe( 404 );
			const error = await response.json();
			expect( error ).toHaveProperty( 'error' );
		} );
	} );

	test.describe( 'Response format', () => {
		test( 'returns proper JSON content-type', async ( { request, baseURL } ) => {
			const today = getTodayISO();
			const response = await request.get( `${ baseURL }${ API_ENDPOINT }?date=${ today }` );

			// Even error responses should be JSON
			expect( response.headers()[ 'content-type' ] ).toContain( 'application/json' );
		} );

		test( 'includes CORS headers', async ( { request, baseURL } ) => {
			const today = getTodayISO();
			const response = await request.get( `${ baseURL }${ API_ENDPOINT }?date=${ today }` );

			expect( response.headers()[ 'access-control-allow-origin' ] ).toBe( '*' );
		} );

		test( 'includes cache-control headers', async ( { request, baseURL } ) => {
			const today = getTodayISO();
			const response = await request.get( `${ baseURL }${ API_ENDPOINT }?date=${ today }` );

			expect( response.headers()[ 'cache-control' ] ).toContain( 'no-cache' );
		} );
	} );

	test.describe( 'Schedule list endpoint', () => {
		test( 'returns array of available schedules', async ( { request, baseURL } ) => {
			const response = await request.get( `${ baseURL }/schedules/` );

			expect( response.status() ).toBe( 200 );
			expect( response.headers()[ 'content-type' ] ).toContain( 'application/json' );

			const schedules = await response.json();
			expect( Array.isArray( schedules ) ).toBe( true );

			if ( schedules.length > 0 ) {
				const schedule = schedules[ 0 ];
				expect( schedule ).toHaveProperty( 'date' );
				expect( schedule ).toHaveProperty( 'url' );
				expect( schedule ).toHaveProperty( 'mtime' );
			}
		} );

		test( 'schedules are sorted by date', async ( { request, baseURL } ) => {
			const response = await request.get( `${ baseURL }/schedules/` );
			const schedules = await response.json();

			if ( schedules.length >= 2 ) {
				// Schedules should be sorted oldest first (ascending)
				const dates = schedules.map( ( s ) => s.date );
				const sortedDates = [ ...dates ].sort();
				expect( dates ).toEqual( sortedDates );
			}
		} );
	} );
} );

/**
 * Override Tests
 *
 * These tests require specific database state and may be skipped
 * in environments without database access or test data.
 */
test.describe( 'Schedule API - Overrides', () => {
	const API_ENDPOINT = '/schedules/day/';

	// These tests are conditional - they pass if the override exists,
	// otherwise they're informational about the feature.

	test.describe( 'Override detection', () => {
		test( 'schedule indicates when override is applied', async ( { request, baseURL } ) => {
			const today = getTodayISO();
			const response = await request.get( `${ baseURL }${ API_ENDPOINT }?date=${ today }` );

			if ( response.status() === 200 ) {
				const schedule = await response.json();
				expect( schedule ).toHaveProperty( 'hasOverride' );
				expect( typeof schedule.hasOverride ).toBe( 'boolean' );

				// If there's an override, there should be optional note field
				if ( schedule.hasOverride && schedule.overrideNote ) {
					expect( typeof schedule.overrideNote ).toBe( 'string' );
				}
			}
		} );
	} );

	test.describe( 'Skip override (204)', () => {
		test.skip( 'returns 204 for skipped date', async ( { request, baseURL } ) => {
			// This test requires a 'skip' override in the database
			// Skip until we have test fixture support for database overrides
			const response = await request.get( `${ baseURL }${ API_ENDPOINT }?date=2026-01-01` );
			expect( response.status() ).toBe( 204 );
		} );
	} );

	test.describe( 'Replace override', () => {
		test.skip( 'applies replace override correctly', async ( { request, baseURL } ) => {
			// This test requires a 'replace' override in the database
			// Skip until we have test fixture support for database overrides
			const response = await request.get( `${ baseURL }${ API_ENDPOINT }?date=2026-01-01` );
			expect( response.status() ).toBe( 200 );
			const schedule = await response.json();
			expect( schedule.hasOverride ).toBe( true );
		} );
	} );

	test.describe( 'Add override', () => {
		test.skip( 'merges add override exercises', async ( { request, baseURL } ) => {
			// This test requires an 'add' override in the database
			// Skip until we have test fixture support for database overrides
			const response = await request.get( `${ baseURL }${ API_ENDPOINT }?date=2026-01-01` );
			expect( response.status() ).toBe( 200 );
			const schedule = await response.json();
			expect( schedule.hasOverride ).toBe( true );
		} );
	} );
} );

/**
 * Frontend Fallback Tests
 *
 * Tests that the frontend correctly falls back to file-based schedules
 * when the database is unavailable.
 */
test.describe( 'Schedule Fallback Behavior', () => {
	test( 'app loads schedule when API returns data', async ( { page } ) => {
		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Should have loaded day cards (at least one visible)
		const dayCards = page.locator( '.day-card' );
		const count = await dayCards.count();
		expect( count ).toBeGreaterThanOrEqual( 1 );
	} );

	test( 'handles 503 by falling back to file-based schedules', async ( { page } ) => {
		// Mock the per-day API to return 503
		await page.route( '**/schedules/day/**', async ( route ) => {
			await route.fulfill( {
				status: 503,
				contentType: 'application/json',
				body: JSON.stringify( { error: 'Database unavailable' } ),
			} );
		} );

		const app = new AppPage( page );
		await app.goto();
		await app.waitForAppReady();

		// Should have loaded day cards from file-based schedule (at least one)
		const dayCards = page.locator( '.day-card' );
		const count = await dayCards.count();
		expect( count ).toBeGreaterThanOrEqual( 1 );
	} );
} );
