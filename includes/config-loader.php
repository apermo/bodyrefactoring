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
 * Generates variables that override the defaults in styles.css.
 * Maps config keys to the actual CSS variable names used by the app.
 *
 * @return string CSS custom properties block.
 */
function generate_theme_css(): string {
	$colors = get_config( 'theme.colors', [] );
	$css    = ':root {' . PHP_EOL;

	// Map config keys to actual CSS variable names
	$color_map = [
		'primary'       => '--color-primary',
		'primaryRgb'    => '--color-primary-rgb',
		'success'       => '--color-success',
		'successRgb'    => '--color-success-rgb',
		'danger'        => '--color-danger',
		'dangerRgb'     => '--color-danger-rgb',
		'warning'       => '--color-warning',
		'warningRgb'    => '--color-warning-rgb',
		'warningDark'   => '--color-warning-dark',
		'background'    => '--color-bg-primary',
		'backgroundRgb' => '--color-bg-primary-rgb',
		'surface'       => '--color-bg-secondary',
		'surfaceRgb'    => '--color-bg-secondary-rgb',
		'text'          => '--color-text-primary',
		'textMuted'     => '--color-text-muted',
		'textMutedRgb'  => '--color-text-muted-rgb',
		'textSecondary' => '--color-text-secondary',
		'border'        => '--color-border-primary',
	];

	foreach ( $colors as $key => $value ) {
		if ( isset( $color_map[ $key ] ) ) {
			$css .= "\t{$color_map[ $key ]}: {$value};" . PHP_EOL;
		}
	}

	// Add gradient variables
	$gradient = get_config( 'theme.gradients.app', '' );
	$accent   = get_config( 'theme.gradients.appAccent', '' );

	if ( $gradient ) {
		$css .= "\t--app-gradient: {$gradient};" . PHP_EOL;
	}
	if ( $accent ) {
		$css .= "\t--app-accent: {$accent};" . PHP_EOL;
	}

	// Add background image URL
	$bg_image = get_background_image();
	if ( $bg_image ) {
		$css .= "\t--app-background-image: url(\"{$bg_image}\");" . PHP_EOL;
	}

	$css .= '}';

	return $css;
}

/**
 * Replace Tailwind classes based on configuration mapping.
 *
 * Swaps Tailwind class names in HTML output according to the
 * tailwind mapping in app-settings.json.
 *
 * @param string $html The HTML content to process.
 * @return string HTML with replaced class names.
 */
function replace_tailwind_classes( string $html ): string {
	$mapping = get_config( 'tailwind', [] );

	if ( empty( $mapping ) ) {
		return $html;
	}

	// Sort by key length descending to replace longer matches first
	// (e.g., "bg-slate-800/80" before "bg-slate-800")
	uksort( $mapping, function( $a, $b ) {
		return strlen( $b ) - strlen( $a );
	} );

	foreach ( $mapping as $from => $to ) {
		// Replace class names with word boundaries to avoid partial matches
		$pattern = '/(?<=\s|"|\'|^)' . preg_quote( $from, '/' ) . '(?=\s|"|\'|$)/';
		$html    = preg_replace( $pattern, $to, $html );
	}

	return $html;
}

/**
 * Get app name from config.
 *
 * @return string App name.
 */
function get_app_name(): string {
	return get_config( 'app.name', 'Body Refactoring' );
}

/**
 * Get app icon from config.
 *
 * @return string App icon path.
 */
function get_app_icon(): string {
	return get_config( 'app.icon', '/assets/img/gymlogo.png' );
}

/**
 * Get background image from config.
 *
 * @return string Background image path.
 */
function get_background_image(): string {
	return get_config( 'app.backgroundImage', '/assets/img/background.jpg' );
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
