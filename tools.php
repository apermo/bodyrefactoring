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

// Define version constant
define( 'APP_VERSION', getAppVersion() );

