<?php
/**
 * GitHub Webhook Deploy Handler
 * Automatically deploys tagged releases
 */

// Load environment variables
function loadEnv( $path ) {
	if ( ! file_exists( $path ) ) {
		http_response_code( 500 );
		die( 'ERROR: .env file not found' );
	}

	$lines = file( $path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES );
	foreach ( $lines as $line ) {
		$line = trim( $line );

		// Skip comments
		if ( strpos( $line, '#' ) === 0 ) {
			continue;
		}

		// Parse KEY=VALUE
		if ( strpos( $line, '=' ) !== false ) {
			list( $name, $value ) = explode( '=', $line, 2 );
			$name  = trim( $name );
			$value = trim( $value );

			if ( ! array_key_exists( $name, $_ENV ) ) {
				putenv( "$name=$value" );
				$_ENV[ $name ] = $value;
			}
		}
	}
}

loadEnv( __DIR__ . '/.env' );

// Configuration from .env
define( 'WEBHOOK_SECRET', getenv( 'DEPLOY_SECRET' ) );
define( 'REPO_PATH', getenv( 'REPO_PATH' ) );
define( 'LOG_FILE', REPO_PATH . '/deploy.log' );

// Logging function
function logMessage( $message ) {
	$timestamp = date( 'Y-m-d H:i:s' );
	$logEntry  = "[$timestamp] $message\n";
	file_put_contents( LOG_FILE, $logEntry, FILE_APPEND );
}

// Verify webhook signature
$headers   = getallheaders();
$signature = $headers['X-Hub-Signature-256'] ?? '';

if ( empty( $signature ) ) {
	http_response_code( 403 );
	logMessage( 'ERROR: No signature provided' );
	die( 'Forbidden: No signature' );
}

// Validate payload
$payload      = file_get_contents( 'php://input' );
$expectedHash = 'sha256=' . hash_hmac( 'sha256', $payload, WEBHOOK_SECRET );

if ( ! hash_equals( $expectedHash, $signature ) ) {
	http_response_code( 403 );
	logMessage( 'ERROR: Invalid signature' );
	die( 'Forbidden: Invalid signature' );
}

// Parse payload
$data = json_decode( $payload, true );

if ( ! $data ) {
	http_response_code( 400 );
	logMessage( 'ERROR: Invalid JSON payload' );
	die( 'Bad Request: Invalid JSON' );
}

// Only respond to tag pushes (releases)
$ref = $data['ref'] ?? '';
if ( strpos( $ref, 'refs/tags/' ) !== 0 ) {
	logMessage( 'INFO: Ignored push to ref: ' . $ref );
	http_response_code( 200 );
	echo json_encode( [ 'status' => 'ignored', 'message' => 'Not a tag push' ] );
	exit;
}

// Extract tag name
$tag = str_replace( 'refs/tags/', '', $ref );

// Log deployment start
$pusher = $data['pusher']['name'] ?? 'unknown';
logMessage( "INFO: Deployment started by {$pusher} for tag: {$tag}" );

// Execute git commands to deploy tag
chdir( REPO_PATH );

// Fetch all tags
exec( 'git fetch --tags 2>&1', $fetchOutput, $fetchCode );
logMessage( 'INFO: Git fetch tags - ' . implode( ' ', $fetchOutput ) );

// Checkout the specific tag (discard local changes)
exec( "git checkout --force {$tag} 2>&1", $checkoutOutput, $checkoutCode );
logMessage( 'INFO: Git checkout tag - ' . implode( ' ', $checkoutOutput ) );

// Combine all output
$output     = array_merge( $fetchOutput, $checkoutOutput );
$returnCode = max( $fetchCode, $checkoutCode );

if ( $returnCode === 0 ) {
	logMessage( "SUCCESS: Deployment completed successfully for tag: {$tag}" );
	logMessage( 'OUTPUT: ' . implode( "\n", $output ) );

	http_response_code( 200 );
	echo json_encode( [
		'status'  => 'success',
		'message' => 'Deployment successful',
		'tag'     => $tag
	] );
} else {
	logMessage( "ERROR: Deployment failed for tag: {$tag} with code {$returnCode}" );
	logMessage( 'OUTPUT: ' . implode( "\n", $output ) );

	http_response_code( 500 );
	echo json_encode( [
		'status'  => 'error',
		'message' => 'Deployment failed',
		'tag'     => $tag,
		'output'  => $output
	] );
}

