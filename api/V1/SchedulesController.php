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
use ScheduleImportService;
use ScheduleService;

/**
 * Controller for schedule-related API endpoints.
 */
class SchedulesController extends Controller {

	/**
	 * Import service (lazy loaded).
	 *
	 * @var ScheduleImportService|null
	 */
	private ?ScheduleImportService $import_service = null;

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
			case 'preview':
				$this->preview_import();
				break;
			case 'import':
				$this->import_schedule();
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

	/**
	 * Preview schedule import - validate and show what will change.
	 *
	 * POST /api/v1/schedules/preview
	 * Body: { schedule: {...}, startDate: "YYYY-MM-DD" }
	 *
	 * Requires authentication.
	 */
	private function preview_import(): void {
		$this->require_post();
		$this->require_auth();

		$input = $this->get_json_input();

		if ( ! isset( $input['schedule'] ) ) {
			$this->error( 400, 'Missing schedule data' );
		}

		if ( ! isset( $input['startDate'] ) ) {
			$this->error( 400, 'Missing startDate' );
		}

		$schedule   = $input['schedule'];
		$start_date = $input['startDate'];

		// Validate date format.
		if ( ! preg_match( '/^\d{4}-\d{2}-\d{2}$/', $start_date ) ) {
			$this->error( 400, 'Invalid date format. Use YYYY-MM-DD.' );
		}

		$import_service = $this->get_import_service();

		// Validate structure.
		$validation = $import_service->validate_structure( $schedule );

		if ( ! $validation['valid'] ) {
			$this->response(
				[
					'valid'  => false,
					'errors' => $validation['errors'],
				]
			);
			return;
		}

		// Check if template exists.
		try {
			$db       = Database::get_instance();
			$existing = $db->query_one(
				'SELECT id, name, start_date FROM schedule_templates WHERE start_date = ?',
				[ $start_date ]
			);
		} catch ( PDOException $e ) {
			$this->error( 503, 'Database unavailable' );
		}

		// Build preview.
		$preview = [
			'valid'            => true,
			'startDate'        => $start_date,
			'templateName'     => "Schedule $start_date",
			'existingTemplate' => $existing ? [
				'id'   => $existing['id'],
				'name' => $existing['name'],
			] : null,
			'isUpdate'         => $existing !== null,
			'days'             => [],
		];

		// Summarize days.
		foreach ( $schedule['days'] ?? [] as $day ) {
			$preview['days'][] = [
				'dayIndex'      => $day['dayIndex'],
				'id'            => $day['id'],
				'name'          => $day['name'],
				'theme'         => $day['theme'] ?? null,
				'exerciseCount' => count( $day['details'] ?? [] ),
			];
		}

		$this->response( $preview );
	}

	/**
	 * Import schedule to database.
	 *
	 * POST /api/v1/schedules/import
	 * Body: { schedule: {...}, startDate: "YYYY-MM-DD", update: bool }
	 *
	 * Requires authentication.
	 */
	private function import_schedule(): void {
		$this->require_post();
		$this->require_auth();

		$input = $this->get_json_input();

		if ( ! isset( $input['schedule'] ) ) {
			$this->error( 400, 'Missing schedule data' );
		}

		if ( ! isset( $input['startDate'] ) ) {
			$this->error( 400, 'Missing startDate' );
		}

		$schedule   = $input['schedule'];
		$start_date = $input['startDate'];
		$update     = $input['update'] ?? false;

		$import_service = $this->get_import_service();
		$result         = $import_service->import( $schedule, $start_date, $update );

		if ( ! $result['success'] ) {
			$this->error( 400, $result['message'] );
		}

		$this->response( $result );
	}

	/**
	 * Get import service (lazy loaded).
	 */
	private function get_import_service(): ScheduleImportService {
		if ( $this->import_service === null ) {
			require_once __DIR__ . '/../../includes/ScheduleImportService.php';
			$this->import_service = new ScheduleImportService();
		}
		return $this->import_service;
	}

	/**
	 * Get JSON input from request body.
	 *
	 * @return array Parsed JSON data.
	 */
	private function get_json_input(): array {
		$raw = file_get_contents( 'php://input' );
		if ( empty( $raw ) ) {
			$this->error( 400, 'Empty request body' );
		}

		$data = json_decode( $raw, true );
		if ( json_last_error() !== JSON_ERROR_NONE ) {
			$this->error( 400, 'Invalid JSON: ' . json_last_error_msg() );
		}

		return $data;
	}

	/**
	 * Require POST method.
	 */
	private function require_post(): void {
		if ( $_SERVER['REQUEST_METHOD'] !== 'POST' ) {
			$this->error( 405, 'Method not allowed. Use POST.' );
		}
	}

	/**
	 * Require authentication for admin endpoints.
	 */
	private function require_auth(): void {
		if ( ! function_exists( 'is_auth_enabled' ) ) {
			require_once __DIR__ . '/../../tools.php';
		}

		if ( ! is_auth_enabled() ) {
			$this->error( 403, 'Authentication not configured. Set APP_PASSWORD_HASH in .env' );
		}

		if ( ! is_authenticated() ) {
			$this->error( 401, 'Authentication required' );
		}
	}
}
