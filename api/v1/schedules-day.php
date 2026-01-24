<?php
/**
 * Schedules Day API Handler
 *
 * Returns the schedule for a specific date from the MySQL database.
 *
 * Endpoint: GET /api/v1/schedules/day?date=YYYY-MM-DD
 *
 * Response codes:
 * - 200: Schedule found
 * - 204: Date is skipped (override with type='skip')
 * - 400: Invalid date format
 * - 404: No schedule found for date
 * - 503: Database unavailable
 *
 * @package BodyRefactoring
 */

require_once __DIR__ . '/../../includes/Database.php';
require_once __DIR__ . '/../../includes/ScheduleService.php';

/**
 * Handle GET /api/v1/schedules/day request.
 */
function handle_schedules_day(): void {
	// Validate date parameter.
	$date_input = filter_input( INPUT_GET, 'date', FILTER_UNSAFE_RAW );

	if ( empty( $date_input ) ) {
		api_error( 400, 'Missing date parameter. Use ?date=YYYY-MM-DD' );
	}

	// Validate date format.
	$date     = trim( $date_input );
	$date_obj = DateTime::createFromFormat( 'Y-m-d', $date );

	if ( ! $date_obj || $date_obj->format( 'Y-m-d' ) !== $date ) {
		api_error( 400, 'Invalid date format. Use YYYY-MM-DD' );
	}

	// Try to get schedule from database.
	try {
		$db = Database::get_instance();

		// Check if database tables exist.
		if ( ! $db->tables_exist() ) {
			api_error(
				503,
				'Database not initialized',
				[ 'message' => 'Run the installer or import tool first.' ]
			);
		}

		$service  = new ScheduleService( $db );
		$schedule = $service->get_schedule_for_date( $date );

		if ( $schedule === null ) {
			// Could be a 'skip' override or no schedule found.
			// Check if there's a skip override.
			$override = $db->query_one(
				'SELECT override_type FROM date_overrides WHERE target_date = ?',
				[ $date ]
			);

			if ( $override && $override['override_type'] === 'skip' ) {
				// Day explicitly skipped.
				http_response_code( 204 );
				exit;
			}

			// No schedule found.
			api_error( 404, 'No schedule found for this date' );
		}

		// Return schedule.
		api_response( $schedule );

	} catch ( PDOException $e ) {
		if ( defined( 'DEBUG_LOG_ENABLED' ) && DEBUG_LOG_ENABLED ) {
			api_error( 503, 'Database error', [ 'message' => $e->getMessage() ] );
		} else {
			api_error( 503, 'Database unavailable' );
		}
	}
}
