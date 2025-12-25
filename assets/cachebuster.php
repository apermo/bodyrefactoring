<?php
/**
 * Cache Buster Helper
 * Returns file version based on last modification time
 */

function getAssetVersion( $filepath ) {
	$fullPath = __DIR__ . '/' . $filepath;
	if ( file_exists( $fullPath ) ) {
		return filemtime( $fullPath );
	}

	return time(); // Fallback to current time if file doesn't exist
}

function asset( $path ) {
	return $path . '?v=' . getAssetVersion( $path );
}

