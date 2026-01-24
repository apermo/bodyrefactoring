<?php
/**
 * API Router
 *
 * Central entry point for all API requests.
 * Routes requests to appropriate handlers based on URL path.
 *
 * URL Structure: /api/v1/{resource}/{action}
 *
 * Available endpoints:
 * - GET /api/v1/schedules/day?date=YYYY-MM-DD - Get schedule for specific date
 *
 * @package BodyRefactoring
 */

require_once __DIR__ . '/../tools.php';

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
 * Parse the request path to extract API version and route.
 *
 * @return array{version: string|null, route: string}
 */
function parse_request_path(): array {
	$request_uri = $_SERVER['REQUEST_URI'] ?? '';
	$path        = parse_url( $request_uri, PHP_URL_PATH );

	// Remove /api prefix.
	$path = preg_replace( '#^/api#', '', $path );
	$path = trim( $path, '/' );

	// Extract version if present (v1, v2, etc.).
	$version = null;
	if ( preg_match( '#^(v\d+)/(.*)$#', $path, $matches ) ) {
		$version = $matches[1];
		$path    = $matches[2];
	}

	return [
		'version' => $version,
		'route'   => $path,
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

/**
 * Send a JSON success response.
 *
 * @param mixed $data Response data.
 * @param int   $code HTTP status code.
 */
function api_response( $data, int $code = 200 ): void {
	http_response_code( $code );
	echo json_encode( $data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE );
	exit;
}

// Parse request.
$request = parse_request_path();
$method  = $_SERVER['REQUEST_METHOD'];

// Require API version.
if ( $request['version'] === null ) {
	api_error( 400, 'API version required. Use /api/v1/...' );
}

// Route to handlers.
$route = $request['route'];

switch ( true ) {
	// GET /api/v1/schedules/day?date=YYYY-MM-DD
	case $method === 'GET' && $route === 'schedules/day':
		require_once __DIR__ . '/v1/schedules-day.php';
		handle_schedules_day();
		break;

	// Future endpoints can be added here:
	// case $method === 'GET' && $route === 'storage/{id}':
	// case $method === 'PUT' && $route === 'storage/{id}':

	default:
		api_error( 404, 'Endpoint not found', [ 'route' => $route, 'method' => $method ] );
}
