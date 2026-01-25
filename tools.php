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
function get_app_version(): string {
	static $version = null;

	if ( $version === null ) {
		$composer_file = __DIR__ . '/composer.json';

		if ( file_exists( $composer_file ) ) {
			$composer_data = json_decode( file_get_contents( $composer_file ), true );
			$version = $composer_data['version'] ?? '0.0.0';
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
function load_env( string $path ): void {
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

load_env( __DIR__ . '/.env' );

// Load config system
require_once __DIR__ . '/includes/config-loader.php';

// Define version constant
define( 'APP_VERSION', get_app_version() );
define( 'MODE_RESET_PASSWORD', getenv( 'RESET_PASSWORD_MODE' ) );
define( 'DEBUG_LOG_ENABLED', getenv( 'DEBUG_MODE' ) === 'true' );

// App customization - from config with .env fallback
define( 'APP_NAME', get_app_name() );
define( 'APP_ICON', get_app_icon() );

// Server paths (always from .env)
define( 'SCHEDULE_PATH', getenv( 'SCHEDULE_PATH' ) ?: 'schedules' );
define( 'SESSION_DURATION', (int) ( getenv( 'SESSION_DURATION' ) ?: 31536000 ) );

// Authentication configuration
define( 'ADMIN_PASSWORD_HASH', getenv( 'ADMIN_PASSWORD_HASH' ) ?: '' );
define( 'ALLOW_USER_ACCESS', strtolower( getenv( 'ALLOW_USER_ACCESS' ) ?: '' ) === 'true' );
define( 'USER_PASSWORD_HASH', getenv( 'USER_PASSWORD_HASH' ) ?: '' );
define( 'DEV_DOMAIN', getenv( 'DEV_DOMAIN' ) ?: '' );

// Legacy support: fall back to APP_PASSWORD_HASH if ADMIN_PASSWORD_HASH not set
if ( empty( ADMIN_PASSWORD_HASH ) && getenv( 'APP_PASSWORD_HASH' ) ) {
	// Can't redefine constant, so we use a function to get the effective admin hash
	define( 'LEGACY_APP_PASSWORD_HASH', getenv( 'APP_PASSWORD_HASH' ) );
} else {
	define( 'LEGACY_APP_PASSWORD_HASH', '' );
}

// Auth cookie name (derived from app name for multi-instance support)
define( 'AUTH_COOKIE_NAME', 'br_auth_' . substr( md5( APP_NAME ), 0, 8 ) );

// Database version tracking
define( 'REQUIRED_DATABASE_VERSION', 1 );
define( 'CURRENT_DATABASE_VERSION', (int) ( getenv( 'DATABASE_VERSION' ) ?: 0 ) );

/**
 * Get the effective admin password hash (supports legacy APP_PASSWORD_HASH).
 *
 * @return string The admin password hash.
 */
function get_admin_password_hash(): string {
	if ( ! empty( ADMIN_PASSWORD_HASH ) ) {
		return ADMIN_PASSWORD_HASH;
	}
	return LEGACY_APP_PASSWORD_HASH;
}

/**
 * Check if development mode is active (yolo mode).
 *
 * When DEV_DOMAIN matches the current host, all auth is bypassed.
 *
 * @return bool True if dev mode is active.
 */
function is_dev_mode(): bool {
	if ( empty( DEV_DOMAIN ) ) {
		return false;
	}

	$current_host = $_SERVER['HTTP_HOST'] ?? '';
	return strcasecmp( DEV_DOMAIN, $current_host ) === 0;
}

/**
 * Check if admin authentication is configured.
 *
 * @return bool True if admin password hash is set.
 */
function is_auth_enabled(): bool {
	return ! empty( get_admin_password_hash() );
}

/**
 * Check if user authentication is required for app access.
 *
 * @return bool True if users need to log in to use the app.
 */
function is_user_login_required(): bool {
	// No admin password = public instance.
	if ( ! is_auth_enabled() ) {
		return false;
	}

	// User access not allowed = must be admin.
	if ( ! ALLOW_USER_ACCESS ) {
		return true;
	}

	// User access allowed but password required.
	return ! empty( USER_PASSWORD_HASH );
}

/**
 * Get the current authentication role from cookie.
 *
 * @return string|null 'admin', 'user', or null if not authenticated via cookie.
 */
function get_cookie_auth_role(): ?string {
	if ( ! isset( $_COOKIE[ AUTH_COOKIE_NAME ] ) ) {
		return null;
	}

	$cookie_value = $_COOKIE[ AUTH_COOKIE_NAME ];

	// New format: role:token
	if ( strpos( $cookie_value, ':' ) !== false ) {
		list( $role, $token ) = explode( ':', $cookie_value, 2 );

		// Validate token against appropriate password hash.
		if ( $role === 'admin' ) {
			$expected = substr( hash( 'sha256', get_admin_password_hash() ), 0, 32 );
			if ( hash_equals( $expected, $token ) ) {
				return 'admin';
			}
		} elseif ( $role === 'user' ) {
			// User token validates against user password if set, otherwise admin password.
			$hash     = ! empty( USER_PASSWORD_HASH ) ? USER_PASSWORD_HASH : get_admin_password_hash();
			$expected = substr( hash( 'sha256', $hash ), 0, 32 );
			if ( hash_equals( $expected, $token ) ) {
				return 'user';
			}
		}

		return null; // Invalid token.
	}

	// Legacy format: just token (treat as admin for backwards compatibility).
	$expected = substr( hash( 'sha256', get_admin_password_hash() ), 0, 32 );
	if ( hash_equals( $expected, $cookie_value ) ) {
		return 'admin';
	}

	return null;
}

/**
 * Get the current authentication role.
 *
 * Returns the effective role considering dev mode, cookies, and access settings.
 *
 * @return string 'admin', 'user', or 'anonymous'.
 */
function get_auth_role(): string {
	// Dev mode bypasses all auth (treat as admin).
	if ( is_dev_mode() ) {
		return 'admin';
	}

	// Check cookie-based auth.
	$cookie_role = get_cookie_auth_role();
	if ( $cookie_role !== null ) {
		return $cookie_role;
	}

	// No cookie - check if anonymous user access is allowed.
	if ( ! is_auth_enabled() ) {
		return 'admin'; // No auth configured = full access.
	}

	if ( ALLOW_USER_ACCESS && empty( USER_PASSWORD_HASH ) ) {
		return 'user'; // Anonymous user access allowed.
	}

	return 'anonymous';
}

/**
 * Check if current user has admin privileges.
 *
 * Named to avoid conflict with WordPress is_admin() which checks admin area.
 *
 * @return bool True if user is admin.
 */
function has_admin_access(): bool {
	return get_auth_role() === 'admin';
}

/**
 * Check if current user has at least user-level access.
 *
 * @return bool True if user is admin or authenticated user.
 */
function has_user_access(): bool {
	return in_array( get_auth_role(), [ 'admin', 'user' ], true );
}

/**
 * Check if user is authenticated (has any non-anonymous role).
 *
 * @return bool True if user has valid auth.
 */
function is_authenticated(): bool {
	return get_auth_role() !== 'anonymous';
}

/**
 * Check if current user can log out.
 *
 * Users can log out if they authenticated via cookie (not anonymous access).
 *
 * @return bool True if logout is available.
 */
function can_logout(): bool {
	return get_cookie_auth_role() !== null;
}

/**
 * Verify a password against admin or user hash.
 *
 * @param string $password The password to verify.
 * @param string $role     The role to verify for ('admin' or 'user').
 * @return bool True if password is correct for the specified role.
 */
function verify_password( string $password, string $role = 'admin' ): bool {
	if ( $role === 'admin' ) {
		$hash = get_admin_password_hash();
		if ( empty( $hash ) ) {
			return false;
		}
		return password_verify( $password, $hash );
	}

	if ( $role === 'user' ) {
		// If user password is set, verify against it.
		if ( ! empty( USER_PASSWORD_HASH ) ) {
			return password_verify( $password, USER_PASSWORD_HASH );
		}
		// No user password but user access allowed = no password needed.
		// This shouldn't be called in that case, but return false for safety.
		return false;
	}

	return false;
}

/**
 * Set the authentication cookie for a role.
 *
 * @param string $role The role to set ('admin' or 'user').
 */
function set_auth_cookie( string $role = 'admin' ): void {
	if ( $role === 'admin' ) {
		$hash = get_admin_password_hash();
	} else {
		// User cookie uses user password hash if set, otherwise admin hash.
		$hash = ! empty( USER_PASSWORD_HASH ) ? USER_PASSWORD_HASH : get_admin_password_hash();
	}

	$token   = substr( hash( 'sha256', $hash ), 0, 32 );
	$value   = $role . ':' . $token;
	$expires = time() + SESSION_DURATION;

	setcookie( AUTH_COOKIE_NAME, $value, $expires, '/', '', true, true );
}

/**
 * Clear the authentication cookie (logout).
 */
function clear_auth_cookie(): void {
	setcookie( AUTH_COOKIE_NAME, '', time() - 3600, '/', '', true, true );
}

/**
 * Check if database installation/upgrade is needed.
 *
 * @return bool True if installer should run.
 */
function needs_database_install(): bool {
	// Check if database is configured.
	if ( ! getenv( 'DB_HOST' ) || ! getenv( 'DB_NAME' ) ) {
		return false; // No database configured, use file-based mode.
	}

	return CURRENT_DATABASE_VERSION < REQUIRED_DATABASE_VERSION;
}

/**
 * Redirect to installer if database setup is needed.
 *
 * Call this at the start of pages that require database access.
 */
function require_database_or_redirect(): void {
	if ( needs_database_install() ) {
		header( 'Location: /installer.php' );
		exit;
	}
}

/**
 * Update the DATABASE_VERSION in .env file.
 *
 * @param int $version The version number to set.
 * @return bool True on success.
 */
function set_database_version( int $version ): bool {
	$env_file = __DIR__ . '/.env';

	if ( ! file_exists( $env_file ) || ! is_writable( $env_file ) ) {
		return false;
	}

	$content = file_get_contents( $env_file );

	// Check if DATABASE_VERSION already exists.
	if ( preg_match( '/^DATABASE_VERSION=.*/m', $content ) ) {
		// Update existing value.
		$content = preg_replace(
			'/^DATABASE_VERSION=.*/m',
			'DATABASE_VERSION=' . $version,
			$content
		);
	} else {
		// Append new value.
		$content .= "\nDATABASE_VERSION=" . $version . "\n";
	}

	return file_put_contents( $env_file, $content ) !== false;
}
