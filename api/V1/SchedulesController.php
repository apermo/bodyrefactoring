<?php
/**
 * Schedules API Controller
 *
 * @package BodyRefactoring\Api\V1
 */

namespace BodyRefactoring\Api\V1;

use Database;
use DateTime;
use PDOException;
use ScheduleService;

/**
 * Controller for schedule-related API endpoints.
 */
class SchedulesController extends Controller {

	/**
	 * Handle the request.
	 *
	 * @param string $action The action to perform (e.g., 'day').
	 * @param array  $params Request parameters.
	 */
	public function handle( string $action, array $params ): void {
		switch ( $action ) {
			case 'day':
				$this->get_day( $params );
				break;
			default:
				$this->error( 404, 'Action not found', [ 'action' => $action ] );
		}
	}

	/**
	 * Get schedule for a specific date.
	 *
	 * GET /api/v1/schedules/day?date=YYYY-MM-DD
	 *
	 * Response codes:
	 * - 200: Schedule found
	 * - 204: Date is skipped (override with type='skip')
	 * - 400: Invalid date format
	 * - 404: No schedule found for date
	 * - 503: Database unavailable
	 *
	 * @param array $params Request parameters.
	 */
	private function get_day( array $params ): void {
		$date_input = $params['date'] ?? null;

		if ( empty( $date_input ) ) {
			$this->error( 400, 'Missing date parameter. Use ?date=YYYY-MM-DD' );
		}

		// Validate date format.
		$date     = trim( $date_input );
		$date_obj = DateTime::createFromFormat( 'Y-m-d', $date );

		if ( ! $date_obj || $date_obj->format( 'Y-m-d' ) !== $date ) {
			$this->error( 400, 'Invalid date format. Use YYYY-MM-DD' );
		}

		try {
			$db = Database::get_instance();

			if ( ! $db->tables_exist() ) {
				$this->error(
					503,
					'Database not initialized',
					[ 'message' => 'Run the installer or import tool first.' ]
				);
			}

			$service  = new ScheduleService( $db );
			$schedule = $service->get_schedule_for_date( $date );

			if ( $schedule === null ) {
				// Check if there's a skip override.
				$override = $db->query_one(
					'SELECT override_type FROM date_overrides WHERE target_date = ?',
					[ $date ]
				);

				if ( $override && $override['override_type'] === 'skip' ) {
					http_response_code( 204 );
					exit;
				}

				$this->error( 404, 'No schedule found for this date' );
			}

			$this->response( $schedule );

		} catch ( PDOException $e ) {
			if ( defined( 'DEBUG_LOG_ENABLED' ) && DEBUG_LOG_ENABLED ) {
				$this->error( 503, 'Database error', [ 'message' => $e->getMessage() ] );
			} else {
				$this->error( 503, 'Database unavailable' );
			}
		}
	}
}
