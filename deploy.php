<?php
/**
 * GitHub Webhook Deploy Handler
 * Automatically deploys tagged releases
 */

require_once __DIR__ . '/tools.php';

// Configuration from .env
define( 'WEBHOOK_SECRET', getenv( 'DEPLOY_SECRET' ) );
define( 'REPO_PATH', getenv( 'REPO_PATH' ) );
define( 'LOG_FILE', REPO_PATH . '/deploy.log' );

// Logging function
function log_message( $message ) {
	$timestamp = date( 'Y-m-d H:i:s' );
	$log_entry  = "[$timestamp] $message\n";
	file_put_contents( LOG_FILE, $log_entry, FILE_APPEND );
}

// Verify webhook signature
$headers   = getallheaders();
$signature = $headers['X-Hub-Signature-256'] ?? '';

if ( empty( $signature ) ) {
	http_response_code( 403 );
	log_message( 'ERROR: No signature provided' );
	die( 'Forbidden: No signature' );
}

// Validate payload
$payload      = file_get_contents( 'php://input' );
$expected_hash = 'sha256=' . hash_hmac( 'sha256', $payload, WEBHOOK_SECRET );

if ( ! hash_equals( $expected_hash, $signature ) ) {
	http_response_code( 403 );
	log_message( 'ERROR: Invalid signature' );
	die( 'Forbidden: Invalid signature' );
}

// Parse payload
$data = json_decode( $payload, true );

if ( ! $data ) {
	http_response_code( 400 );
	log_message( 'ERROR: Invalid JSON payload' );
	die( 'Bad Request: Invalid JSON' );
}

// Only respond to tag pushes (releases)
$ref = $data['ref'] ?? '';
if ( strpos( $ref, 'refs/tags/' ) !== 0 ) {
	log_message( 'INFO: Ignored push to ref: ' . $ref );
	http_response_code( 200 );
	echo json_encode( [ 'status' => 'ignored', 'message' => 'Not a tag push' ] );
	exit;
}

// Extract tag name
$tag = str_replace( 'refs/tags/', '', $ref );

// Log deployment start
$pusher = $data['pusher']['name'] ?? 'unknown';
log_message( "INFO: Deployment started by {$pusher} for tag: {$tag}" );

// Execute git commands to deploy tag
chdir( REPO_PATH );

// Fetch all tags
exec( 'git fetch --tags 2>&1', $fetch_output, $fetch_code );
log_message( 'INFO: Git fetch tags - ' . implode( ' ', $fetch_output ) );

// Checkout the specific tag (discard local changes)
exec( "git checkout --force {$tag} 2>&1", $checkout_output, $checkout_code );
log_message( 'INFO: Git checkout tag - ' . implode( ' ', $checkout_output ) );

// Combine all output
$output     = array_merge( $fetch_output, $checkout_output );
$return_code = max( $fetch_code, $checkout_code );

if ( $return_code === 0 ) {
	log_message( "SUCCESS: Deployment completed successfully for tag: {$tag}" );
	log_message( 'OUTPUT: ' . implode( "\n", $output ) );

	http_response_code( 200 );
	echo json_encode( [
		'status'  => 'success',
		'message' => 'Deployment successful',
		'tag'     => $tag
	] );
} else {
	log_message( "ERROR: Deployment failed for tag: {$tag} with code {$return_code}" );
	log_message( 'OUTPUT: ' . implode( "\n", $output ) );

	http_response_code( 500 );
	echo json_encode( [
		'status'  => 'error',
		'message' => 'Deployment failed',
		'tag'     => $tag,
		'output'  => $output
	] );
}

