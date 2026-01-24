<?php
/**
 * API Router
 *
 * Central entry point for all API requests.
 * Routes requests to appropriate controllers based on URL path.
 *
 * URL Structure: /api/v1/{resource}/{action}
 *
 * Available endpoints:
 * - GET /api/v1/schedules/day?date=YYYY-MM-DD - Get schedule for specific date
 *
 * @package BodyRefactoring\Api
 */

require_once __DIR__ . '/../tools.php';
require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/../includes/ScheduleService.php';

// Autoloader for API classes.
spl_autoload_register(
	function ( $class ) {
		// Only handle BodyRefactoring\Api namespace.
		$prefix = 'BodyRefactoring\\Api\\';
		if ( strpos( $class, $prefix ) !== 0 ) {
			return;
		}

		// Remove namespace prefix and convert to path.
		$relative_class = substr( $class, strlen( $prefix ) );
		$file           = __DIR__ . '/' . str_replace( '\\', '/', $relative_class ) . '.php';

		if ( file_exists( $file ) ) {
			require_once $file;
		}
	}
);

use BodyRefactoring\Api\V1\SchedulesController;

// Set common headers.
header( 'Content-Type: application/json' );
header( 'Access-Control-Allow-Origin: *' );
header( 'Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS' );
header( 'Access-Control-Allow-Headers: Content-Type, Authorization' );
header( 'Cache-Control: no-cache, must-revalidate' );

// Handle preflight requests.
if ( $_SERVER['REQUEST_METHOD'] === 'OPTIONS' ) {
	http_response_code( 204 );
	exit;
}

// Check authentication if enabled.
if ( is_auth_enabled() && ! is_authenticated() ) {
	http_response_code( 401 );
	echo json_encode( [ 'error' => 'Unauthorized' ] );
	exit;
}

/**
 * Parse the request path to extract API version, resource, and action.
 *
 * @return array{version: string|null, resource: string|null, action: string|null}
 */
function parse_request_path(): array {
	$request_uri = $_SERVER['REQUEST_URI'] ?? '';
	$path        = parse_url( $request_uri, PHP_URL_PATH );

	// Remove /api prefix.
	$path = preg_replace( '#^/api#', '', $path );
	$path = trim( $path, '/' );

	// Extract version, resource, and action.
	$parts = explode( '/', $path );

	$version  = null;
	$resource = null;
	$action   = null;

	if ( ! empty( $parts[0] ) && preg_match( '/^v\d+$/', $parts[0] ) ) {
		$version = $parts[0];
		$resource = $parts[1] ?? null;
		$action   = $parts[2] ?? null;
	}

	return [
		'version'  => $version,
		'resource' => $resource,
		'action'   => $action,
	];
}

/**
 * Send a JSON error response.
 *
 * @param int    $code    HTTP status code.
 * @param string $message Error message.
 * @param array  $extra   Additional data to include.
 */
function api_error( int $code, string $message, array $extra = [] ): void {
	http_response_code( $code );
	echo json_encode( array_merge( [ 'error' => $message ], $extra ) );
	exit;
}

// Parse request.
$request = parse_request_path();
$method  = $_SERVER['REQUEST_METHOD'];
$params  = $_GET;

// Require API version.
if ( $request['version'] === null ) {
	api_error( 400, 'API version required. Use /api/v1/...' );
}

// Require resource.
if ( $request['resource'] === null ) {
	api_error( 400, 'Resource required. Use /api/v1/{resource}/...' );
}

// Map resources to controllers.
$controllers = [
	'schedules' => SchedulesController::class,
	// Future: 'storage' => StorageController::class,
];

$resource = $request['resource'];

if ( ! isset( $controllers[ $resource ] ) ) {
	api_error( 404, 'Resource not found', [ 'resource' => $resource ] );
}

// Instantiate controller and handle request.
$controller_class = $controllers[ $resource ];
$controller       = new $controller_class();
$controller->handle( $request['action'] ?? 'index', $params );
