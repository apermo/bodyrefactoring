<?php
/**
 * Cache Buster Helper.
 *
 * Returns file version based on last modification time for cache busting.
 *
 * @package BodyRefactoring
 */

/**
 * Get asset version based on file modification time.
 *
 * @param string $filepath Relative path to the asset file.
 * @return int Unix timestamp of file modification or current time as fallback.
 */
function get_asset_version( string $filepath ): int {
	$full_path = __DIR__ . '/' . $filepath;
	if ( file_exists( $full_path ) ) {
		return filemtime( $full_path );
	}

	return time();
}

/**
 * Generate asset URL with cache-busting version parameter.
 *
 * @param string $path Relative path to the asset file.
 * @return string Asset path with version query parameter.
 */
function asset( string $path ): string {
	return $path . '?v=' . get_asset_version( $path );
}
