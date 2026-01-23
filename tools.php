<?php
/**
 * Tools and Utilities
 *
 * Common functions and constants used across the Body Refactoring application.
 *
 * @package BodyRefactoring
 */

/**
 * Get the application version from composer.json.
 *
 * @return string The version number.
 */
function getAppVersion() {
	static $version = null;

	if ( $version === null ) {
		$composerFile = __DIR__ . '/composer.json';

		if ( file_exists( $composerFile ) ) {
			$composerData = json_decode( file_get_contents( $composerFile ), true );
			$version = $composerData['version'] ?? '0.0.0';
		} else {
			$version = '0.0.0';
		}
	}

	return $version;
}

/**
 * Load environment variables from a .env file.
 *
 * @param string $path Path to the .env file.
 */
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

// Define version constant
define( 'APP_VERSION', getAppVersion() );
define( 'MODE_RESET_PASSWORD', getenv( 'RESET_PASSWORD_MODE' ) );
define( 'DEBUG_LOG_ENABLED', getenv( 'DEBUG_MODE' ) === 'true' );

// App customization (v14.6.0+)
define( 'APP_NAME', getenv( 'APP_NAME' ) ?: 'Body Refactoring' );
define( 'APP_COLOR_SCHEME', getenv( 'APP_COLOR_SCHEME' ) ?: 'default' );
define( 'APP_ICON', getenv( 'APP_ICON' ) ?: 'assets/img/gymlogo.png' );
define( 'SCHEDULE_PATH', getenv( 'SCHEDULE_PATH' ) ?: 'schedules' );
define( 'APP_PASSWORD_HASH', getenv( 'APP_PASSWORD_HASH' ) ?: '' );
define( 'SESSION_DURATION', (int) ( getenv( 'SESSION_DURATION' ) ?: 86400 ) );

// Auth cookie name (derived from app name for multi-instance support)
define( 'AUTH_COOKIE_NAME', 'br_auth_' . substr( md5( APP_NAME ), 0, 8 ) );

/**
 * Check if authentication is enabled.
 *
 * @return bool True if APP_PASSWORD_HASH is set.
 */
function isAuthEnabled(): bool {
	return ! empty( APP_PASSWORD_HASH );
}

/**
 * Check if user is authenticated.
 *
 * @return bool True if user has valid auth cookie.
 */
function isAuthenticated(): bool {
	if ( ! isAuthEnabled() ) {
		return true; // No auth required
	}

	if ( ! isset( $_COOKIE[ AUTH_COOKIE_NAME ] ) ) {
		return false;
	}

	// Cookie should contain a hash that matches our password hash
	$expectedToken = substr( hash( 'sha256', APP_PASSWORD_HASH ), 0, 32 );
	return hash_equals( $expectedToken, $_COOKIE[ AUTH_COOKIE_NAME ] );
}

/**
 * Verify a password against the stored hash.
 *
 * @param string $password The password to verify.
 * @return bool True if password is correct.
 */
function verifyPassword( string $password ): bool {
	if ( ! isAuthEnabled() ) {
		return false;
	}
	return password_verify( $password, APP_PASSWORD_HASH );
}

/**
 * Set the authentication cookie.
 *
 * @return void
 */
function setAuthCookie(): void {
	$token   = substr( hash( 'sha256', APP_PASSWORD_HASH ), 0, 32 );
	$expires = time() + SESSION_DURATION;
	setcookie( AUTH_COOKIE_NAME, $token, $expires, '/', '', true, true );
}

/**
 * Clear the authentication cookie (logout).
 *
 * @return void
 */
function clearAuthCookie(): void {
	setcookie( AUTH_COOKIE_NAME, '', time() - 3600, '/', '', true, true );
}

/**
 * Get color scheme CSS class.
 *
 * @return string CSS class name for the color scheme.
 */
function getColorSchemeClass(): string {
	$scheme = APP_COLOR_SCHEME;
	$valid  = [ 'default', 'green', 'purple', 'amber' ];
	return in_array( $scheme, $valid, true ) ? "scheme-{$scheme}" : 'scheme-default';
}

