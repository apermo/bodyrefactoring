<?php
/**
 * Service Worker Version Endpoint
 *
 * Returns current app version from composer.json for cache versioning
 *
 * @package BodyRefactoring
 */

header( 'Content-Type: application/json' );
header( 'Cache-Control: no-cache, must-revalidate' );

require_once __DIR__ . '/../../tools.php';

echo json_encode( [
	'version'      => APP_VERSION,
	'cacheVersion' => 'bodyrefactoring-v' . APP_VERSION
] );

