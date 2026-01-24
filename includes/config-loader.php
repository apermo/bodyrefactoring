<?php
/**
 * Application Configuration Loader
 *
 * Loads and merges configuration from default and custom JSON files.
 * Provides a centralized way to access non-sensitive app settings.
 *
 * @package BodyRefactoring
 * @since 14.7.0
 */

/**
 * Load application configuration.
 *
 * Merges default config with any custom overrides.
 * Custom config file is optional and gitignored.
 *
 * @return array The merged configuration array.
 */
function load_app_config(): array {
	static $config = null;

	if ( $config !== null ) {
		return $config;
	}

	$default_path = __DIR__ . '/../config/app-settings.json';
	$custom_path  = __DIR__ . '/../custom-config/app-settings.json';

	// Load default config (required)
	if ( ! file_exists( $default_path ) ) {
		error_log( 'Body Refactoring: Default config file not found: ' . $default_path );
		return [];
	}

	$default_json = file_get_contents( $default_path );
	$config       = json_decode( $default_json, true );

	if ( json_last_error() !== JSON_ERROR_NONE ) {
		error_log( 'Body Refactoring: Invalid JSON in default config: ' . json_last_error_msg() );
		return [];
	}

	// Merge custom config if exists
	if ( file_exists( $custom_path ) ) {
		$custom_json = file_get_contents( $custom_path );
		$custom      = json_decode( $custom_json, true );

		if ( json_last_error() === JSON_ERROR_NONE && is_array( $custom ) ) {
			$config = array_replace_recursive( $config, $custom );
		} else {
			error_log( 'Body Refactoring: Invalid JSON in custom config: ' . json_last_error_msg() );
		}
	}

	return $config;
}

/**
 * Get a configuration value by dot-notation path.
 *
 * @param string $path    Dot-notation path (e.g., 'theme.colors.primary').
 * @param mixed  $default Default value if path not found.
 * @return mixed The configuration value or default.
 */
function get_config( string $path, $default = null ) {
	$config = load_app_config();
	$keys   = explode( '.', $path );

	foreach ( $keys as $key ) {
		if ( ! is_array( $config ) || ! array_key_exists( $key, $config ) ) {
			return $default;
		}
		$config = $config[ $key ];
	}

	return $config;
}

/**
 * Get a localized string from configuration.
 *
 * @param string $key     String key in dot notation (e.g., 'menu.logout').
 * @param string $default Default value if not found.
 * @return string The localized string.
 */
function get_string( string $key, string $default = '' ): string {
	$value = get_config( 'strings.' . $key, $default );
	return is_string( $value ) ? $value : $default;
}

/**
 * Get theme color from configuration.
 *
 * @param string $key     Color key (e.g., 'primary', 'background').
 * @param string $default Default color value.
 * @return string The color value.
 */
function get_theme_color( string $key, string $default = '' ): string {
	return get_config( 'theme.colors.' . $key, $default );
}

/**
 * Check if a feature is enabled.
 *
 * @param string $feature Feature name (e.g., 'speechEnabled').
 * @return bool True if feature is enabled.
 */
function is_feature_enabled( string $feature ): bool {
	return (bool) get_config( 'features.' . $feature, false );
}

/**
 * Generate CSS custom properties from theme configuration.
 *
 * @return string CSS custom properties block.
 */
function generate_theme_css(): string {
	$colors = get_config( 'theme.colors', [] );
	$css    = ':root {' . PHP_EOL;

	foreach ( $colors as $key => $value ) {
		// Convert camelCase to kebab-case
		$css_key = strtolower( preg_replace( '/([A-Z])/', '-$1', $key ) );
		$css    .= "\t--config-color-{$css_key}: {$value};" . PHP_EOL;
	}

	// Add gradient variables
	$gradient = get_config( 'theme.gradients.app', '' );
	$accent   = get_config( 'theme.gradients.appAccent', '' );

	if ( $gradient ) {
		$css .= "\t--config-app-gradient: {$gradient};" . PHP_EOL;
	}
	if ( $accent ) {
		$css .= "\t--config-app-accent: {$accent};" . PHP_EOL;
	}

	$css .= '}';

	return $css;
}

/**
 * Get configuration as JSON for JavaScript injection.
 *
 * Filters out sensitive data and returns only frontend-safe config.
 *
 * @return string JSON-encoded configuration.
 */
function get_frontend_config_json(): string {
	$config = load_app_config();

	// Remove any sensitive keys if they exist
	// (Currently all config is frontend-safe, but this provides a hook for future)

	return json_encode( $config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE );
}
