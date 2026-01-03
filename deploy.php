<?php
/**
 * GitHub Webhook Deploy Handler
 * Automatically deploys changes from main branch
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

// Only respond to main branch pushes
if ( ( $data['ref'] ?? '' ) !== 'refs/heads/main' ) {
	logMessage( 'INFO: Ignored push to branch: ' . ( $data['ref'] ?? 'unknown' ) );
	http_response_code( 200 );
	echo json_encode( [ 'status' => 'ignored', 'message' => 'Not main branch' ] );
	exit;
}

// Log deployment start
$pusher  = $data['pusher']['name'] ?? 'unknown';
$commits = count( $data['commits'] ?? [] );
logMessage( "INFO: Deployment started by {$pusher} ({$commits} commits)" );

// Execute git commands to force update
chdir( REPO_PATH );

// First, fetch latest changes
exec( 'git fetch origin main 2>&1', $fetchOutput, $fetchCode );
logMessage( 'INFO: Git fetch - ' . implode( ' ', $fetchOutput ) );

// Reset to match remote (discard local changes)
exec( 'git reset --hard origin/main 2>&1', $resetOutput, $resetCode );
logMessage( 'INFO: Git reset - ' . implode( ' ', $resetOutput ) );

// Pull to update (should be fast-forward now)
exec( 'git pull origin main 2>&1', $pullOutput, $pullCode );

// Combine all output
$output     = array_merge( $fetchOutput, $resetOutput, $pullOutput );
$returnCode = max( $fetchCode, $resetCode, $pullCode );

if ( $returnCode === 0 ) {
	logMessage( 'SUCCESS: Deployment completed successfully (local changes discarded)' );
	logMessage( 'OUTPUT: ' . implode( "\n", $output ) );

	http_response_code( 200 );
	echo json_encode( [
		'status'  => 'success',
		'message' => 'Deployment successful (local changes overwritten)',
		'commits' => $commits
	] );
} else {
	logMessage( 'ERROR: Deployment failed with code ' . $returnCode );
	logMessage( 'OUTPUT: ' . implode( "\n", $output ) );

	http_response_code( 500 );
	echo json_encode( [
		'status'  => 'error',
		'message' => 'Deployment failed',
		'output'  => $output
	] );
}

