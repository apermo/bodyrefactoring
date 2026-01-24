<?php
/**
 * Schedule Import Service
 *
 * Handles importing JSON schedule data into the database.
 * Extracted from CLI tool for reuse in web API.
 *
 * @package BodyRefactoring
 */

require_once __DIR__ . '/DatabaseInterface.php';
require_once __DIR__ . '/Database.php';

/**
 * Service for importing schedule JSON into database.
 */
class ScheduleImportService {

	/**
	 * Database instance.
	 *
	 * @var DatabaseInterface
	 */
	private DatabaseInterface $db;

	/**
	 * Constructor.
	 *
	 * @param DatabaseInterface|null $db Database instance (defaults to singleton).
	 */
	public function __construct( ?DatabaseInterface $db = null ) {
		$this->db = $db ?? Database::get_instance();
	}

	/**
	 * Import a schedule from JSON data.
	 *
	 * @param array  $data       Parsed JSON schedule data.
	 * @param string $start_date Start date (YYYY-MM-DD).
	 * @param bool   $update     Whether to update existing template.
	 * @return array Result with 'success', 'message', and optionally 'template_id'.
	 */
	public function import( array $data, string $start_date, bool $update = false ): array {
		// Validate date format.
		if ( ! preg_match( '/^\d{4}-\d{2}-\d{2}$/', $start_date ) ) {
			return [
				'success' => false,
				'message' => 'Invalid date format. Expected YYYY-MM-DD.',
			];
		}

		// Validate schedule structure.
		$validation = $this->validate_structure( $data );
		if ( ! $validation['valid'] ) {
			return [
				'success' => false,
				'message' => 'Validation failed: ' . implode( ', ', $validation['errors'] ),
			];
		}

		$name = "Schedule $start_date";

		try {
			$this->db->execute( 'START TRANSACTION', [] );

			// Check if template exists.
			$existing = $this->db->query_one(
				'SELECT id FROM schedule_templates WHERE start_date = ?',
				[ $start_date ]
			);

			if ( $existing && ! $update ) {
				$this->db->execute( 'ROLLBACK', [] );
				return [
					'success' => false,
					'message' => "Template already exists for $start_date. Use update mode to replace.",
				];
			}

			if ( $existing && $update ) {
				// Delete existing template (cascade deletes days and exercises).
				$this->db->execute( 'DELETE FROM schedule_templates WHERE id = ?', [ $existing['id'] ] );
			}

			// Create template.
			$this->db->execute(
				'INSERT INTO schedule_templates (name, start_date) VALUES (?, ?)',
				[ $name, $start_date ]
			);
			$template_id = (int) $this->db->last_insert_id();

			// Import days.
			$day_count      = 0;
			$exercise_count = 0;

			foreach ( $data['days'] ?? [] as $day ) {
				$this->db->execute(
					'INSERT INTO schedule_days (template_id, day_index, day_id, name, theme, icon, color_class, bg_class)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
					[
						$template_id,
						$day['dayIndex'],
						$day['id'],
						$day['name'],
						$day['theme'] ?? null,
						$day['icon'] ?? null,
						$day['colorClass'] ?? null,
						$day['bgClass'] ?? null,
					]
				);
				$day_id = (int) $this->db->last_insert_id();
				++$day_count;

				// Import exercises.
				$sort_order = 0;
				foreach ( $day['details'] ?? [] as $exercise ) {
					$this->import_exercise( $day_id, $exercise, $sort_order );
					++$sort_order;
					++$exercise_count;
				}
			}

			$this->db->execute( 'COMMIT', [] );

			return [
				'success'        => true,
				'message'        => "Imported $day_count days, $exercise_count exercises",
				'template_id'    => $template_id,
				'days'           => $day_count,
				'exercises'      => $exercise_count,
				'updated'        => (bool) $existing,
			];

		} catch ( PDOException $e ) {
			$this->db->execute( 'ROLLBACK', [] );
			return [
				'success' => false,
				'message' => 'Database error: ' . $e->getMessage(),
			];
		}
	}

	/**
	 * Import a single exercise.
	 *
	 * @param int   $day_id     Day ID in database.
	 * @param array $exercise   Exercise data.
	 * @param int   $sort_order Sort order.
	 */
	private function import_exercise( int $day_id, array $exercise, int $sort_order ): void {
		// Handle 'alternatives' type - store the whole structure as JSON.
		if ( $exercise['type'] === 'alternatives' ) {
			$title = 'Alternativen';
			// Use first alternative's title if available.
			if ( ! empty( $exercise['alternatives'][0]['title'] ) ) {
				$titles = array_map( fn( $a ) => $a['title'], $exercise['alternatives'] );
				$title  = implode( ' / ', $titles );
			}
			$this->db->execute(
				'INSERT INTO schedule_exercises
				 (day_id, exercise_id, sort_order, type, title, description, timers)
				 VALUES (?, ?, ?, ?, ?, ?, ?)',
				[
					$day_id,
					$exercise['id'],
					$sort_order,
					$exercise['type'],
					$title,
					null,
					json_encode( $exercise['alternatives'] ),
				]
			);
		} else {
			$this->db->execute(
				'INSERT INTO schedule_exercises
				 (day_id, exercise_id, sort_order, type, title, description, weight, default_unit, timers, rep_counter, custom_label, date_condition, date_description)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
				[
					$day_id,
					$exercise['id'],
					$sort_order,
					$exercise['type'],
					$exercise['title'],
					$exercise['desc'] ?? null,
					$exercise['weight'] ?? null,
					$exercise['defaultUnit'] ?? null,
					isset( $exercise['timers'] ) ? json_encode( $exercise['timers'] ) : null,
					isset( $exercise['repCounter'] ) ? json_encode( $exercise['repCounter'] ) : null,
					$exercise['customLabel'] ?? null,
					isset( $exercise['dateCondition'] ) ? json_encode( $exercise['dateCondition'] ) : null,
					$exercise['dateDescription'] ?? null,
				]
			);
		}
	}

	/**
	 * Validate schedule JSON structure.
	 *
	 * @param array $data Schedule data.
	 * @return array With 'valid' bool and 'errors' array.
	 */
	public function validate_structure( array $data ): array {
		$errors = [];

		// Check root structure.
		if ( ! isset( $data['version'] ) || $data['version'] !== 1 ) {
			$errors[] = 'Version must be 1';
		}

		if ( ! isset( $data['days'] ) || ! is_array( $data['days'] ) ) {
			$errors[] = 'Missing or invalid days array';
			return [
				'valid' => false,
				'errors' => $errors,
			];
		}

		if ( count( $data['days'] ) !== 7 ) {
			$errors[] = 'Must have exactly 7 days';
		}

		// Check each day.
		$seen_ids         = [];
		$seen_day_indexes = [];

		foreach ( $data['days'] as $i => $day ) {
			if ( ! isset( $day['id'] ) || ! preg_match( '/^[a-z_]+$/', $day['id'] ) ) {
				$errors[] = "Day $i: Invalid ID format";
			} elseif ( in_array( $day['id'], $seen_ids, true ) ) {
				$errors[] = "Day $i: Duplicate ID '{$day['id']}'";
			} else {
				$seen_ids[] = $day['id'];
			}

			if ( ! isset( $day['dayIndex'] ) || $day['dayIndex'] < 0 || $day['dayIndex'] > 6 ) {
				$errors[] = "Day $i: dayIndex must be 0-6";
			} elseif ( in_array( $day['dayIndex'], $seen_day_indexes, true ) ) {
				$errors[] = "Day $i: Duplicate dayIndex '{$day['dayIndex']}'";
			} else {
				$seen_day_indexes[] = $day['dayIndex'];
			}

			if ( empty( $day['name'] ) ) {
				$errors[] = "Day $i: Missing name";
			}

			if ( ! isset( $day['details'] ) || ! is_array( $day['details'] ) ) {
				$errors[] = "Day $i: Missing or invalid details array";
				continue;
			}

			// Check exercises.
			foreach ( $day['details'] as $j => $ex ) {
				if ( ! isset( $ex['id'] ) || ! preg_match( '/^[a-z_0-9]+$/', $ex['id'] ) ) {
					$errors[] = "Day $i, Exercise $j: Invalid ID format";
				}
				if ( ! isset( $ex['type'] ) || ! in_array( $ex['type'], [ 'warmup', 'main', 'cool', 'alternatives' ], true ) ) {
					$errors[] = "Day $i, Exercise $j: Invalid type";
				}
				if ( $ex['type'] === 'alternatives' ) {
					if ( ! isset( $ex['alternatives'] ) || count( $ex['alternatives'] ) < 2 ) {
						$errors[] = "Day $i, Exercise $j: Alternatives must have at least 2 options";
					}
				} elseif ( empty( $ex['title'] ) ) {
						$errors[] = "Day $i, Exercise $j: Missing title";
				}
			}
		}

		return [
			'valid'  => empty( $errors ),
			'errors' => $errors,
		];
	}
}
