<?php
/**
 * Per-Day Schedule API Endpoint
 *
 * Returns the schedule for a specific date from the MySQL database.
 * - GET /schedules/day/?date=YYYY-MM-DD - Get schedule for date
 *
 * Response codes:
 * - 200: Schedule found
 * - 204: Date is skipped (override with type='skip')
 * - 400: Invalid date format
 * - 401: Unauthorized
 * - 404: No schedule found for date
 * - 503: Database unavailable
 *
 * @package BodyRefactoring
 */

// phpcs:ignore Yoast.Commenting.FileComment.Missing -- Procedural entry point file
require_once __DIR__ . '/../tools.php';
require_once __DIR__ . '/../includes/ScheduleService.php';

header( 'Content-Type: application/json' );
header( 'Access-Control-Allow-Origin: *' );
header( 'Cache-Control: no-cache, must-revalidate' );

// Check authentication if enabled.
if ( is_auth_enabled() && ! is_authenticated() ) {
	http_response_code( 401 );
	echo json_encode( [ 'error' => 'Unauthorized' ] );
	exit;
}

// Validate date parameter.
$date_input = filter_input( INPUT_GET, 'date', FILTER_UNSAFE_RAW );

if ( empty( $date_input ) ) {
	http_response_code( 400 );
	echo json_encode( [ 'error' => 'Missing date parameter. Use ?date=YYYY-MM-DD' ] );
	exit;
}

// Validate date format.
$date = trim( $date_input );
$date_obj = DateTime::createFromFormat( 'Y-m-d', $date );

if ( ! $date_obj || $date_obj->format( 'Y-m-d' ) !== $date ) {
	http_response_code( 400 );
	echo json_encode( [ 'error' => 'Invalid date format. Use YYYY-MM-DD' ] );
	exit;
}

// Try to get schedule from database.
try {
	$db = Database::get_instance();

	// Check if database tables exist.
	if ( ! $db->tables_exist() ) {
		http_response_code( 503 );
		echo json_encode(
			[
				'error'   => 'Database not initialized',
				'message' => 'Run the schema initialization script or import tool first.',
			]
		);
		exit;
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
		http_response_code( 404 );
		echo json_encode( [ 'error' => 'No schedule found for this date' ] );
		exit;
	}

	// Return schedule.
	echo json_encode( $schedule, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE );

} catch ( PDOException $e ) {
	http_response_code( 503 );
	if ( defined( 'DEBUG_LOG_ENABLED' ) && DEBUG_LOG_ENABLED ) {
		echo json_encode(
			[
				'error'   => 'Database error',
				'message' => $e->getMessage(),
			]
		);
	} else {
		echo json_encode( [ 'error' => 'Database unavailable' ] );
	}
	exit;
}
