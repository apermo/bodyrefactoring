<?php
/**
 * PHPUnit Bootstrap
 *
 * Sets up the test environment.
 *
 * @package BodyRefactoring\Tests
 */

// Define test mode.
define( 'PHPUNIT_RUNNING', true );

// Load classes under test (in dependency order).
require_once __DIR__ . '/../../includes/DatabaseInterface.php';
require_once __DIR__ . '/../../includes/Database.php';
require_once __DIR__ . '/../../includes/ScheduleService.php';
require_once __DIR__ . '/../../includes/ScheduleImportService.php';

// Load mocks.
require_once __DIR__ . '/Mocks/MockDatabase.php';

// API autoloader.
spl_autoload_register(
	function ( $class ) {
		$prefix = 'BodyRefactoring\\Api\\';
		if ( strpos( $class, $prefix ) !== 0 ) {
			return;
		}
		$relative_class = substr( $class, strlen( $prefix ) );
		$file           = __DIR__ . '/../../api/' . str_replace( '\\', '/', $relative_class ) . '.php';
		if ( file_exists( $file ) ) {
			require_once $file;
		}
	}
);
