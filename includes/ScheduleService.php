<?php
/**
 * Schedule Service
 *
 * Business logic for schedule queries. Handles template lookup,
 * date overrides, and exercise retrieval.
 *
 * @package BodyRefactoring
 */

require_once __DIR__ . '/Database.php';

/**
 * Schedule service for database-backed schedule access.
 */
class ScheduleService {

	/**
	 * Database instance.
	 *
	 * @var Database
	 */
	private Database $db;

	/**
	 * Constructor.
	 *
	 * @param Database|null $db Database instance (optional, uses singleton).
	 */
	public function __construct( ?Database $db = null ) {
		$this->db = $db ?? Database::get_instance();
	}

	/**
	 * Get schedule for a specific date.
	 *
	 * Logic:
	 * 1. Check date_overrides for target_date
	 * 2. If override_type = 'skip', return null
	 * 3. If override_type = 'replace', return override config
	 * 4. Find active template for date
	 * 5. Get day by dayIndex
	 * 6. If override_type = 'add', merge exercises
	 * 7. Return merged result
	 *
	 * @param string $date Date in YYYY-MM-DD format.
	 * @return array|null Day schedule or null if skipped/not found.
	 */
	public function get_schedule_for_date( string $date ): ?array {
		// Validate date format
		$date_obj = DateTime::createFromFormat( 'Y-m-d', $date );
		if ( ! $date_obj || $date_obj->format( 'Y-m-d' ) !== $date ) {
			return null;
		}

		// Calculate day index (0 = Sunday, 6 = Saturday)
		$day_index = (int) $date_obj->format( 'w' );

		// Step 1: Check for date override
		$override = $this->get_date_override( $date );

		// Step 2: Handle 'skip' override
		if ( $override && $override['override_type'] === 'skip' ) {
			return null;
		}

		// Step 3: Handle 'replace' override
		if ( $override && $override['override_type'] === 'replace' ) {
			$day_config = json_decode( $override['day_config'], true );
			return $this->format_day_response( $date, $day_index, $day_config, true, $override['note'] );
		}

		// Step 4: Find active template
		$template = $this->get_active_template( $date );
		if ( ! $template ) {
			return null;
		}

		// Step 5: Get day from template
		$day = $this->get_template_day( $template['id'], $day_index );
		if ( ! $day ) {
			return null;
		}

		// Get exercises for this day
		$exercises = $this->get_day_exercises( $day['id'] );

		// Build base day config
		$day_config = [
			'id'         => $day['day_id'],
			'dayIndex'   => $day_index,
			'name'       => $day['name'],
			'theme'      => $day['theme'],
			'icon'       => $day['icon'],
			'colorClass' => $day['color_class'],
			'bgClass'    => $day['bg_class'],
			'details'    => $exercises,
		];

		// Step 6: Handle 'add' override
		if ( $override && $override['override_type'] === 'add' ) {
			$extra_exercises = json_decode( $override['exercises'], true ) ?? [];
			$day_config['details'] = array_merge( $day_config['details'], $extra_exercises );
			return $this->format_day_response( $date, $day_index, $day_config, true, $override['note'], $template['name'] );
		}

		// Step 7: Return template day
		return $this->format_day_response( $date, $day_index, $day_config, false, null, $template['name'] );
	}

	/**
	 * Get date override for a specific date.
	 *
	 * @param string $date Date in YYYY-MM-DD format.
	 * @return array|null Override record or null.
	 */
	private function get_date_override( string $date ): ?array {
		return $this->db->query_one(
			'SELECT * FROM date_overrides WHERE target_date = ?',
			[ $date ]
		);
	}

	/**
	 * Get the active template for a given date.
	 *
	 * @param string $date Date in YYYY-MM-DD format.
	 * @return array|null Template record or null.
	 */
	private function get_active_template( string $date ): ?array {
		return $this->db->query_one(
			'SELECT * FROM schedule_templates
			 WHERE is_active = 1
			   AND start_date <= ?
			   AND (end_date IS NULL OR end_date >= ?)
			 ORDER BY start_date DESC
			 LIMIT 1',
			[ $date, $date ]
		);
	}

	/**
	 * Get a day configuration from a template.
	 *
	 * @param int $template_id Template ID.
	 * @param int $day_index   Day index (0-6).
	 * @return array|null Day record or null.
	 */
	private function get_template_day( int $template_id, int $day_index ): ?array {
		return $this->db->query_one(
			'SELECT * FROM schedule_days WHERE template_id = ? AND day_index = ?',
			[ $template_id, $day_index ]
		);
	}

	/**
	 * Get exercises for a day.
	 *
	 * @param int $day_id Day ID.
	 * @return array List of exercises.
	 */
	private function get_day_exercises( int $day_id ): array {
		$rows = $this->db->query(
			'SELECT * FROM schedule_exercises WHERE day_id = ? ORDER BY sort_order',
			[ $day_id ]
		);

		return array_map( [ $this, 'format_exercise' ], $rows );
	}

	/**
	 * Format an exercise row for API response.
	 *
	 * @param array $row Database row.
	 * @return array Formatted exercise.
	 */
	private function format_exercise( array $row ): array {
		$exercise = [
			'id'    => $row['exercise_id'],
			'type'  => $row['type'],
			'title' => $row['title'],
		];

		if ( ! empty( $row['description'] ) ) {
			$exercise['desc'] = $row['description'];
		}

		if ( ! empty( $row['weight'] ) ) {
			$exercise['weight'] = $row['weight'];
		}

		if ( ! empty( $row['default_unit'] ) ) {
			$exercise['defaultUnit'] = $row['default_unit'];
		}

		if ( ! empty( $row['timers'] ) ) {
			$exercise['timers'] = json_decode( $row['timers'], true );
		}

		if ( ! empty( $row['rep_counter'] ) ) {
			$exercise['repCounter'] = json_decode( $row['rep_counter'], true );
		}

		if ( ! empty( $row['custom_label'] ) ) {
			$exercise['customLabel'] = $row['custom_label'];
		}

		if ( ! empty( $row['date_condition'] ) ) {
			$exercise['dateCondition'] = json_decode( $row['date_condition'], true );
		}

		if ( ! empty( $row['date_description'] ) ) {
			$exercise['dateDescription'] = $row['date_description'];
		}

		return $exercise;
	}

	/**
	 * Format the day response for API.
	 *
	 * @param string      $date          Date in YYYY-MM-DD format.
	 * @param int         $day_index     Day index (0-6).
	 * @param array       $day_config    Day configuration.
	 * @param bool        $has_override  Whether an override was applied.
	 * @param string|null $override_note Override note if any.
	 * @param string|null $template_name Template name if from template.
	 * @return array Formatted response.
	 */
	private function format_day_response(
		string $date,
		int $day_index,
		array $day_config,
		bool $has_override,
		?string $override_note = null,
		?string $template_name = null
	): array {
		$response = [
			'date'        => $date,
			'dayIndex'    => $day_index,
			'id'          => $day_config['id'] ?? 'unknown',
			'name'        => $day_config['name'] ?? '',
			'theme'       => $day_config['theme'] ?? null,
			'icon'        => $day_config['icon'] ?? null,
			'colorClass'  => $day_config['colorClass'] ?? null,
			'bgClass'     => $day_config['bgClass'] ?? null,
			'details'     => $day_config['details'] ?? [],
			'hasOverride' => $has_override,
		];

		if ( $override_note ) {
			$response['overrideNote'] = $override_note;
		}

		if ( $template_name ) {
			$response['templateName'] = $template_name;
		}

		return $response;
	}

	/**
	 * Create a date override.
	 *
	 * @param string      $date          Target date (YYYY-MM-DD).
	 * @param string      $override_type Type: 'replace', 'add', or 'skip'.
	 * @param array|null  $day_config    Day config for 'replace' type.
	 * @param array|null  $exercises     Extra exercises for 'add' type.
	 * @param string|null $note          Optional note.
	 * @return int Inserted ID.
	 */
	public function create_date_override(
		string $date,
		string $override_type,
		?array $day_config = null,
		?array $exercises = null,
		?string $note = null
	): int {
		$this->db->execute(
			'INSERT INTO date_overrides (target_date, override_type, day_config, exercises, note)
			 VALUES (?, ?, ?, ?, ?)
			 ON DUPLICATE KEY UPDATE
			   override_type = VALUES(override_type),
			   day_config = VALUES(day_config),
			   exercises = VALUES(exercises),
			   note = VALUES(note)',
			[
				$date,
				$override_type,
				$day_config ? json_encode( $day_config ) : null,
				$exercises ? json_encode( $exercises ) : null,
				$note,
			]
		);

		return (int) $this->db->last_insert_id();
	}

	/**
	 * Delete a date override.
	 *
	 * @param string $date Target date (YYYY-MM-DD).
	 * @return bool True if deleted.
	 */
	public function delete_date_override( string $date ): bool {
		return $this->db->execute(
			'DELETE FROM date_overrides WHERE target_date = ?',
			[ $date ]
		) > 0;
	}

	/**
	 * List all templates.
	 *
	 * @param bool $active_only Only return active templates.
	 * @return array List of templates.
	 */
	public function list_templates( bool $active_only = true ): array {
		$sql = 'SELECT * FROM schedule_templates';
		if ( $active_only ) {
			$sql .= ' WHERE is_active = 1';
		}
		$sql .= ' ORDER BY start_date DESC';

		return $this->db->query( $sql );
	}

	/**
	 * Get a template by ID with all its days and exercises.
	 *
	 * @param int $template_id Template ID.
	 * @return array|null Full template data or null.
	 */
	public function get_template( int $template_id ): ?array {
		$template = $this->db->query_one(
			'SELECT * FROM schedule_templates WHERE id = ?',
			[ $template_id ]
		);

		if ( ! $template ) {
			return null;
		}

		$days = $this->db->query(
			'SELECT * FROM schedule_days WHERE template_id = ? ORDER BY day_index',
			[ $template_id ]
		);

		$template['days'] = [];

		foreach ( $days as $day ) {
			$exercises = $this->get_day_exercises( $day['id'] );
			$day['details'] = $exercises;
			unset( $day['id'], $day['template_id'] );
			$template['days'][] = $day;
		}

		return $template;
	}
}
