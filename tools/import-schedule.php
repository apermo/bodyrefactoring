#!/usr/bin/env php
<?php
/**
 * Schedule Import Tool
 *
 * CLI tool to import JSON schedule files into the MySQL database.
 *
 * Usage:
 *   php tools/import-schedule.php schedules/schedule-2026-01-25.json
 *   php tools/import-schedule.php --all                    # Import all schedules
 *   php tools/import-schedule.php --update schedule.json   # Update existing
 *   php tools/import-schedule.php --dry-run schedule.json  # Preview only
 *   php tools/import-schedule.php --init                   # Initialize schema
 *
 * @package BodyRefactoring
 */

// Ensure CLI execution.
if ( php_sapi_name() !== 'cli' ) {
	die( 'This script must be run from the command line.' );
}

require_once __DIR__ . '/../tools.php';
require_once __DIR__ . '/../includes/Database.php';

/**
 * Print colored output.
 *
 * @param string $message Message to print.
 * @param string $color   Color: red, green, yellow, blue.
 */
function output( string $message, string $color = '' ): void {
	$colors = [
		'red'    => "\033[31m",
		'green'  => "\033[32m",
		'yellow' => "\033[33m",
		'blue'   => "\033[34m",
		'reset'  => "\033[0m",
	];

	if ( $color && isset( $colors[ $color ] ) ) {
		echo $colors[ $color ] . $message . $colors['reset'] . PHP_EOL;
	} else {
		echo $message . PHP_EOL;
	}
}

/**
 * Print usage information.
 */
function print_usage(): void {
	output( 'Usage: php tools/import-schedule.php [options] [file]', 'blue' );
	output( '' );
	output( 'Options:' );
	output( '  --all       Import all schedule files from schedules/' );
	output( '  --update    Update existing template (replace exercises)' );
	output( '  --dry-run   Preview import without database changes' );
	output( '  --init      Initialize database schema' );
	output( '  --help      Show this help message' );
	output( '' );
	output( 'Examples:' );
	output( '  php tools/import-schedule.php schedules/schedule-2026-01-25.json' );
	output( '  php tools/import-schedule.php --all' );
	output( '  php tools/import-schedule.php --dry-run schedules/schedule-2026-01-25.json' );
}

/**
 * Import a single schedule file.
 *
 * @param string   $file_path Path to JSON file.
 * @param Database $db        Database instance.
 * @param bool     $update    Whether to update existing.
 * @param bool     $dry_run   Preview only.
 * @return bool Success.
 */
function import_schedule( string $file_path, Database $db, bool $update, bool $dry_run ): bool {
	if ( ! file_exists( $file_path ) ) {
		output( "File not found: $file_path", 'red' );
		return false;
	}

	$json = file_get_contents( $file_path );
	$data = json_decode( $json, true );

	if ( json_last_error() !== JSON_ERROR_NONE ) {
		output( 'Invalid JSON: ' . json_last_error_msg(), 'red' );
		return false;
	}

	// Extract date from filename.
	$filename = basename( $file_path );
	if ( ! preg_match( '/schedule-(\d{4}-\d{2}-\d{2})\.json/', $filename, $matches ) ) {
		output( "Invalid filename format: $filename (expected schedule-YYYY-MM-DD.json)", 'red' );
		return false;
	}

	$start_date = $matches[1];
	$name       = "Schedule $start_date";

	output( "Importing: $filename", 'blue' );
	output( "  Start date: $start_date" );
	output( "  Version: " . ( $data['version'] ?? 'unknown' ) );
	output( "  Days: " . count( $data['days'] ?? [] ) );

	if ( $dry_run ) {
		output( '  [DRY RUN] Would import ' . count( $data['days'] ?? [] ) . ' days', 'yellow' );
		foreach ( $data['days'] ?? [] as $day ) {
			$exercise_count = count( $day['details'] ?? [] );
			output( "    - {$day['name']} ({$day['dayIndex']}): $exercise_count exercises" );
		}
		return true;
	}

	try {
		$db->begin_transaction();

		// Check if template exists.
		$existing = $db->query_one(
			'SELECT id FROM schedule_templates WHERE start_date = ?',
			[ $start_date ]
		);

		if ( $existing && ! $update ) {
			output( "  Template already exists for $start_date. Use --update to replace.", 'yellow' );
			$db->rollback();
			return false;
		}

		if ( $existing && $update ) {
			// Delete existing template (cascade deletes days and exercises).
			$db->execute( 'DELETE FROM schedule_templates WHERE id = ?', [ $existing['id'] ] );
			output( '  Deleted existing template', 'yellow' );
		}

		// Create template.
		$db->execute(
			'INSERT INTO schedule_templates (name, start_date) VALUES (?, ?)',
			[ $name, $start_date ]
		);
		$template_id = (int) $db->last_insert_id();
		output( "  Created template ID: $template_id" );

		// Import days.
		$day_count      = 0;
		$exercise_count = 0;

		foreach ( $data['days'] ?? [] as $day ) {
			$db->execute(
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
			$day_id = (int) $db->last_insert_id();
			++$day_count;

			// Import exercises.
			$sort_order = 0;
			foreach ( $day['details'] ?? [] as $exercise ) {
				// Handle 'alternatives' type - store the whole structure as JSON.
				if ( $exercise['type'] === 'alternatives' ) {
					$title = 'Alternativen';
					// Use first alternative's title if available.
					if ( ! empty( $exercise['alternatives'][0]['title'] ) ) {
						$titles = array_map( fn( $a ) => $a['title'], $exercise['alternatives'] );
						$title  = implode( ' / ', $titles );
					}
					$db->execute(
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
					$db->execute(
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
				++$sort_order;
				++$exercise_count;
			}
		}

		$db->commit();
		output( "  Imported $day_count days, $exercise_count exercises", 'green' );
		return true;

	} catch ( PDOException $e ) {
		$db->rollback();
		output( '  Database error: ' . $e->getMessage(), 'red' );
		return false;
	}
}

// Parse arguments.
$args    = array_slice( $argv, 1 );
$options = [
	'all'     => false,
	'update'  => false,
	'dry-run' => false,
	'init'    => false,
	'help'    => false,
];
$files   = [];

foreach ( $args as $arg ) {
	if ( strpos( $arg, '--' ) === 0 ) {
		$option = substr( $arg, 2 );
		if ( isset( $options[ $option ] ) ) {
			$options[ $option ] = true;
		}
	} else {
		$files[] = $arg;
	}
}

// Help.
if ( $options['help'] || ( empty( $files ) && ! $options['all'] && ! $options['init'] ) ) {
	print_usage();
	exit( 0 );
}

// Connect to database.
try {
	$db = Database::get_instance();
	output( 'Connected to database', 'green' );
} catch ( PDOException $e ) {
	output( 'Database connection failed: ' . $e->getMessage(), 'red' );
	output( 'Check your .env DB_HOST, DB_NAME, DB_USER, DB_PASS settings.' );
	exit( 1 );
}

// Initialize schema.
if ( $options['init'] ) {
	output( 'Initializing database schema...', 'blue' );
	try {
		$db->init_schema();
		output( 'Schema initialized successfully', 'green' );
	} catch ( Exception $e ) {
		output( 'Schema initialization failed: ' . $e->getMessage(), 'red' );
		exit( 1 );
	}
	exit( 0 );
}

// Check if tables exist.
if ( ! $db->tables_exist() ) {
	output( 'Database tables not found. Run with --init first.', 'red' );
	exit( 1 );
}

// Import all schedules.
if ( $options['all'] ) {
	$schedule_dir = __DIR__ . '/../' . SCHEDULE_PATH;
	$pattern      = $schedule_dir . '/schedule-????-??-??.json';
	$files        = glob( $pattern );

	if ( empty( $files ) ) {
		output( 'No schedule files found in ' . SCHEDULE_PATH, 'yellow' );
		exit( 0 );
	}

	output( 'Found ' . count( $files ) . ' schedule files', 'blue' );
}

// Import files.
$success = 0;
$failed  = 0;

foreach ( $files as $file ) {
	// Convert relative paths to absolute.
	if ( strpos( $file, '/' ) !== 0 ) {
		$file = getcwd() . '/' . $file;
	}

	if ( import_schedule( $file, $db, $options['update'], $options['dry-run'] ) ) {
		++$success;
	} else {
		++$failed;
	}
	output( '' );
}

// Summary.
if ( count( $files ) > 1 ) {
	output( "Import complete: $success succeeded, $failed failed", $failed > 0 ? 'yellow' : 'green' );
}

exit( $failed > 0 ? 1 : 0 );
