<?php
/**
 * Schedule API Endpoint
 *
 * Serves as a secure REST API gatekeeper for all schedule file access.
 * - GET /schedules/ - List available schedules with URLs
 * - GET /schedules/?file=schedule-*.json - Serve schedule content
 *
 * Optionally requires authentication when APP_PASSWORD_HASH is configured.
 *
 * @package BodyRefactoring
 */

// phpcs:ignore Yoast.Commenting.FileComment.Missing -- Procedural entry point file
require_once __DIR__ . '/../tools.php';

header( 'Content-Type: application/json' );
header( 'Access-Control-Allow-Origin: *' );
header( 'Cache-Control: no-cache, must-revalidate' );

// Check authentication if enabled.
if ( is_auth_enabled() && ! is_authenticated() ) {
	http_response_code( 401 );
	echo json_encode( [ 'error' => 'Unauthorized' ] );
	exit;
}

// Serve individual file if requested.
if ( isset( $_GET['file'] ) ) {
	// Sanitize input: get raw value and apply basename to prevent path traversal.
	$raw_input      = filter_input( INPUT_GET, 'file', FILTER_UNSAFE_RAW );
	$requested_file = basename( $raw_input ?? '' );

	// Validate filename pattern (allow dated schedules and special schedules).
	$valid_patterns = [
		'/^schedule-\d{4}-\d{2}-\d{2}\.json$/', // schedule-YYYY-MM-DD.json
		'/^schedule-recovery\.json$/',          // schedule-recovery.json
		'/^schedule-sick\.json$/',              // schedule-sick.json
	];

	$is_valid = false;
	foreach ( $valid_patterns as $pattern ) {
		if ( preg_match( $pattern, $requested_file ) ) {
			$is_valid = true;
			break;
		}
	}

	if ( ! $is_valid ) {
		http_response_code( 400 );
		echo json_encode( [ 'error' => 'Invalid file requested' ] );
		exit;
	}

	// Use SCHEDULE_PATH to read from configured directory (could be different from API endpoint)
	$schedule_dir = $_SERVER['DOCUMENT_ROOT'] . '/' . SCHEDULE_PATH;
	$file_path    = $schedule_dir . '/' . $requested_file;

	if ( ! file_exists( $file_path ) ) {
		http_response_code( 404 );
		echo json_encode( [ 'error' => 'Schedule not found' ] );
		exit;
	}

	// Serve the validated JSON file contents (already valid JSON, no escaping needed).
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- JSON content from validated local file
	echo file_get_contents( $file_path );
	exit;
}

// List all available schedules from configured directory.
$schedule_dir = $_SERVER['DOCUMENT_ROOT'] . '/' . SCHEDULE_PATH;
$files        = glob( $schedule_dir . '/schedule-*.json' );
$schedules    = [];

foreach ( $files as $file ) {
	$basename = basename( $file );
	// Only include dated schedules in the list (not recovery/sick).
	if ( preg_match( '/schedule-(\d{4}-\d{2}-\d{2})\.json/', $basename, $matches ) ) {
		$schedules[] = [
			'date'  => $matches[1],
			'url'   => 'schedules/?file=' . $basename,
			'mtime' => filemtime( $file ),
		];
	}
}

usort(
	$schedules,
	function ( $a, $b ) {
		return strcmp( $a['date'], $b['date'] );
	}
);

echo json_encode( $schedules );
