<?php
/**
 * Training Schedule JSON Validator
 *
 * Validates training schedule JSON files against the defined schema.
 * Run from the trainings/ directory.
 *
 * Usage:
 *   php validate-schedule.php                    # Validates all schedules
 *   php validate-schedule.php schedule-2026-01-15.json
 *   php validate-schedule.php schedule-*.json
 *
 * @package BodyRefactoring
 */

/**
 * Validate a training schedule JSON file.
 *
 * @param string $file_path Path to the JSON file to validate.
 * @return array Validation result with 'valid' boolean and 'errors' array.
 */
function validate_schedule_file( string $file_path ): array {
	$result = [
		'valid'  => false,
		'errors' => [],
		'file'   => basename( $file_path ),
	];

	// Check if file exists.
	if ( ! file_exists( $file_path ) ) {
		$result['errors'][] = 'File does not exist';
		return $result;
	}

	// Check filename pattern.
	$filename = basename( $file_path );
	$special_schedules = [ 'schedule-recovery.json', 'schedule-sick.json', 'template-schedule.json' ];
	if ( ! preg_match( '/^schedule-\d{4}-\d{2}-\d{2}\.json$/', $filename ) && ! in_array( $filename, $special_schedules, true ) ) {
		$result['errors'][] = 'Filename must match pattern: schedule-YYYY-MM-DD.json (or be a special schedule)';
	}

	// Read and parse JSON.
	$json_content = file_get_contents( $file_path );
	$data         = json_decode( $json_content, true );

	if ( json_last_error() !== JSON_ERROR_NONE ) {
		$result['errors'][] = 'Invalid JSON: ' . json_last_error_msg();
		return $result;
	}

	// Validate structure.
	$validation_errors = validate_schedule_structure( $data );
	foreach ( $validation_errors as $error ) {
		$errors[] = $error;
	}

	// Set valid flag.
	$result['valid'] = empty( $result['errors'] );

	return $result;
}

/**
 * Validate the structure of a parsed schedule.
 *
 * @param mixed $data Parsed JSON data.
 * @return array Array of error messages.
 */
function validate_schedule_structure( mixed $data ): array {
	$errors = [];

	// Must be an object with version and days.
	if ( ! is_array( $data ) ) {
		$errors[] = 'Root element must be an object';
		return $errors;
	}

	// Check for required root fields.
	if ( ! isset( $data['version'] ) ) {
		$errors[] = "Missing required field 'version' at root level";
	} elseif ( ! is_int( $data['version'] ) ) {
		$errors[] = "'version' must be an integer";
	} elseif ( $data['version'] < 1 || $data['version'] > 2 ) {
		$errors[] = "'version' must be 1 or 2";
	}

	if ( ! isset( $data['days'] ) ) {
		$errors[] = "Missing required field 'days' at root level";
		return $errors;
	}

	// Validate days array.
	if ( ! is_array( $data['days'] ) ) {
		$errors[] = "'days' must be an array";
		return $errors;
	}

	// Must have at least one day.
	if ( empty( $data['days'] ) ) {
		$errors[] = 'Schedule must contain at least one day';
		return $errors;
	}

	$used_ids         = [];
	$used_day_indices = [];

	// Validate each day.
	foreach ( $data['days'] as $day_index => $day ) {
		$day_prefix = "Day $day_index";

		if ( ! is_array( $day ) ) {
			$errors[] = "$day_prefix: Must be an object";
			continue;
		}

		// Check required fields.
		$required_fields = [ 'id', 'dayIndex', 'name', 'theme', 'details' ];
		foreach ( $required_fields as $field ) {
			if ( ! isset( $day[ $field ] ) ) {
				$errors[] = "$day_prefix: Missing required field '$field'";
			}
		}

		// Validate id.
		if ( isset( $day['id'] ) ) {
			if ( ! is_string( $day['id'] ) || empty( $day['id'] ) ) {
				$errors[] = "$day_prefix: 'id' must be a non-empty string";
			} elseif ( ! preg_match( '/^[a-z_]+$/', $day['id'] ) ) {
				$errors[] = "$day_prefix: 'id' must contain only lowercase letters and underscores";
			} elseif ( in_array( $day['id'], $used_ids, true ) ) {
				$errors[] = "$day_prefix: Duplicate day id '{$day['id']}'";
			} else {
				$used_ids[] = $day['id'];
			}
		}

		// Validate dayIndex.
		if ( isset( $day['dayIndex'] ) ) {
			if ( ! is_int( $day['dayIndex'] ) ) {
				$errors[] = "$day_prefix: 'dayIndex' must be an integer";
			} elseif ( $day['dayIndex'] < 0 || $day['dayIndex'] > 7 ) {
				$errors[] = "$day_prefix: 'dayIndex' must be between 0 and 7 (0 or 7 = Sunday, 1 = Monday)";
			} elseif ( in_array( $day['dayIndex'], $used_day_indices, true ) ) {
				$errors[] = "$day_prefix: Duplicate dayIndex '{$day['dayIndex']}'";
			} else {
				$used_day_indices[] = $day['dayIndex'];
			}
		}

		// Validate name.
		if ( isset( $day['name'] ) && ( ! is_string( $day['name'] ) || empty( $day['name'] ) ) ) {
			$errors[] = "$day_prefix: 'name' must be a non-empty string";
		}

		// Validate theme.
		if ( isset( $day['theme'] ) && ( ! is_string( $day['theme'] ) || empty( $day['theme'] ) ) ) {
			$errors[] = "$day_prefix: 'theme' must be a non-empty string";
		}

		// Validate details.
		if ( isset( $day['details'] ) ) {
			if ( ! is_array( $day['details'] ) ) {
				$errors[] = "$day_prefix: 'details' must be an array";
			} elseif ( empty( $day['details'] ) ) {
				$errors[] = "$day_prefix: 'details' must contain at least one exercise";
			} else {
				$version         = isset( $data['version'] ) ? $data['version'] : 1;
				$exercise_errors = validate_exercises( $day['details'], $day_prefix, $version );
				foreach ( $exercise_errors as $error ) {
					$errors[] = $error;
				}
			}
		}
	}

	return $errors;
}

/**
 * Validate exercises array.
 *
 * @param array  $exercises Array of exercises.
 * @param string $day_prefix Prefix for error messages.
 * @param int    $version Schema version (1 or 2).
 * @return array Array of error messages.
 */
function validate_exercises( array $exercises, string $day_prefix, int $version = 1 ): array {
	$errors   = [];
	$used_ids = [];

	foreach ( $exercises as $ex_index => $exercise ) {
		$ex_prefix = "$day_prefix, Exercise $ex_index";

		if ( ! is_array( $exercise ) ) {
			$errors[] = "$ex_prefix: Must be an object";
			continue;
		}

		// Check required fields.
		if ( ! isset( $exercise['id'] ) ) {
			$errors[] = "$ex_prefix: Missing required field 'id'";
		}
		if ( ! isset( $exercise['type'] ) ) {
			$errors[] = "$ex_prefix: Missing required field 'type'";
		}

		// Validate id.
		if ( isset( $exercise['id'] ) ) {
			if ( ! is_string( $exercise['id'] ) || empty( $exercise['id'] ) ) {
				$errors[] = "$ex_prefix: 'id' must be a non-empty string";
			} elseif ( ! preg_match( '/^[a-z_]+$/', $exercise['id'] ) ) {
				$errors[] = "$ex_prefix: 'id' must contain only lowercase letters and underscores";
			} elseif ( in_array( $exercise['id'], $used_ids, true ) ) {
				$errors[] = "$ex_prefix: Duplicate exercise id '{$exercise['id']}'";
			} else {
				$used_ids[] = $exercise['id'];
			}
		}

		// Validate type.
		if ( isset( $exercise['type'] ) ) {
			$valid_types = [ 'warmup', 'main', 'cool', 'alternatives' ];
			if ( $version === 2 ) {
				$valid_types[] = 'custom';
			}
			if ( ! in_array( $exercise['type'], $valid_types, true ) ) {
				$errors[] = "$ex_prefix: 'type' must be one of: " . implode( ', ', $valid_types );
			} elseif ( $exercise['type'] === 'alternatives' ) {
				$alt_errors = validate_alternatives( $exercise, $ex_prefix, $version );
				foreach ( $alt_errors as $err ) {
					$errors[] = $err;
				}
			} else {
				$regular_errors = validate_regular_exercise( $exercise, $ex_prefix, $version );
				foreach ( $regular_errors as $err ) {
					$errors[] = $err;
				}
			}
		}

		// Validate v2 fields.
		if ( $version === 2 ) {
			$v2_errors = validate_v2_fields( $exercise, $ex_prefix );
			foreach ( $v2_errors as $error ) {
				$errors[] = $error;
			}
		}

		// Validate timers if present.
		if ( isset( $exercise['timers'] ) ) {
			$timer_errors = validate_timers( $exercise['timers'], $ex_prefix );
			foreach ( $timer_errors as $error ) {
				$errors[] = $error;
			}
		}
	}

	return $errors;
}

/**
 * Validate regular exercise fields.
 *
 * @param array  $exercise Exercise data.
 * @param string $ex_prefix Prefix for error messages.
 * @param int    $version Schema version (1 or 2).
 * @return array Array of error messages.
 */
function validate_regular_exercise( array $exercise, string $ex_prefix, int $version = 1 ): array {
	$errors = [];

	// Required fields for regular exercises.
	if ( ! isset( $exercise['title'] ) ) {
		$errors[] = "$ex_prefix: Missing required field 'title'";
	} elseif ( ! is_string( $exercise['title'] ) || empty( $exercise['title'] ) ) {
		$errors[] = "$ex_prefix: 'title' must be a non-empty string";
	}

	if ( ! isset( $exercise['desc'] ) ) {
		$errors[] = "$ex_prefix: Missing required field 'desc'";
	} elseif ( ! is_string( $exercise['desc'] ) || empty( $exercise['desc'] ) ) {
		$errors[] = "$ex_prefix: 'desc' must be a non-empty string";
	}

	// Weight and defaultUnit should be both present or both absent.
	$has_weight = isset( $exercise['weight'] );
	$has_unit   = isset( $exercise['defaultUnit'] );

	if ( $has_weight && ! $has_unit ) {
		$errors[] = "$ex_prefix: 'defaultUnit' is required when 'weight' is specified";
	}

	if ( $has_weight && ! is_string( $exercise['weight'] ) ) {
		$errors[] = "$ex_prefix: 'weight' must be a string";
	}

	if ( $has_unit && ! is_string( $exercise['defaultUnit'] ) ) {
		$errors[] = "$ex_prefix: 'defaultUnit' must be a string";
	}

	// V2: customLabel is required for type=custom.
	if ( $version === 2 && isset( $exercise['type'] ) && $exercise['type'] === 'custom' ) {
		if ( ! isset( $exercise['customLabel'] ) ) {
			$errors[] = "$ex_prefix: 'customLabel' is required for type 'custom'";
		} elseif ( ! is_string( $exercise['customLabel'] ) || empty( $exercise['customLabel'] ) ) {
			$errors[] = "$ex_prefix: 'customLabel' must be a non-empty string";
		}
	}

	// Validate repCounter if present.
	if ( isset( $exercise['repCounter'] ) ) {
		$rep_errors = validate_rep_counter( $exercise['repCounter'], $ex_prefix, $version );
		foreach ( $rep_errors as $error ) {
			$errors[] = $error;
		}
	}

	return $errors;
}

/**
 * Validate alternatives exercise.
 *
 * @param array  $exercise Exercise data.
 * @param string $ex_prefix Prefix for error messages.
 * @param int    $version Schema version (1 or 2).
 * @return array Array of error messages.
 */
function validate_alternatives( array $exercise, string $ex_prefix, int $version = 1 ): array {
	$errors = [];

	if ( ! isset( $exercise['alternatives'] ) ) {
		$errors[] = "$ex_prefix: Missing required field 'alternatives'";
		return $errors;
	}

	if ( ! is_array( $exercise['alternatives'] ) ) {
		$errors[] = "$ex_prefix: 'alternatives' must be an array";
		return $errors;
	}

	if ( count( $exercise['alternatives'] ) < 2 ) {
		$errors[] = "$ex_prefix: 'alternatives' must contain at least 2 options";
	}

	foreach ( $exercise['alternatives'] as $alt_index => $alt ) {
		$alt_prefix = "$ex_prefix, Alternative $alt_index";

		if ( ! is_array( $alt ) ) {
			$errors[] = "$alt_prefix: Must be an object";
			continue;
		}

		// Required fields.
		if ( ! isset( $alt['title'] ) ) {
			$errors[] = "$alt_prefix: Missing required field 'title'";
		} elseif ( ! is_string( $alt['title'] ) || empty( $alt['title'] ) ) {
			$errors[] = "$alt_prefix: 'title' must be a non-empty string";
		}

		if ( ! isset( $alt['desc'] ) ) {
			$errors[] = "$alt_prefix: Missing required field 'desc'";
		} elseif ( ! is_string( $alt['desc'] ) || empty( $alt['desc'] ) ) {
			$errors[] = "$alt_prefix: 'desc' must be a non-empty string";
		}

		// Validate timers if present.
		if ( isset( $alt['timers'] ) ) {
			$timer_errors = validate_timers( $alt['timers'], $alt_prefix );
			foreach ( $timer_errors as $error ) {
				$errors[] = $error;
			}
		}
	}

	return $errors;
}

/**
 * Validate timers array.
 *
 * @param mixed  $timers Timers data.
 * @param string $prefix Prefix for error messages.
 * @return array Array of error messages.
 */
function validate_timers( mixed $timers, string $prefix ): array {
	$errors = [];

	if ( ! is_array( $timers ) ) {
		$errors[] = "$prefix: 'timers' must be an array";
		return $errors;
	}

	foreach ( $timers as $timer_index => $timer ) {
		$timer_prefix = "$prefix, Timer $timer_index";

		if ( ! is_array( $timer ) ) {
			$errors[] = "$timer_prefix: Must be an object";
			continue;
		}

		// Required fields.
		if ( ! isset( $timer['l'] ) ) {
			$errors[] = "$timer_prefix: Missing required field 'l' (label)";
		} elseif ( ! is_string( $timer['l'] ) || empty( $timer['l'] ) ) {
			$errors[] = "$timer_prefix: 'l' must be a non-empty string";
		}

		if ( ! isset( $timer['s'] ) ) {
			$errors[] = "$timer_prefix: Missing required field 's' (seconds)";
		} elseif ( ! is_int( $timer['s'] ) || $timer['s'] < 1 ) {
			$errors[] = "$timer_prefix: 's' must be a positive integer";
		}
	}

	return $errors;
}

/**
 * Validate v2-specific exercise fields.
 *
 * @param array  $exercise Exercise data.
 * @param string $ex_prefix Prefix for error messages.
 * @return array Array of error messages.
 */
function validate_v2_fields( array $exercise, string $ex_prefix ): array {
	$errors = [];

	// Validate optional field.
	if ( isset( $exercise['optional'] ) && ! is_bool( $exercise['optional'] ) ) {
		$errors[] = "$ex_prefix: 'optional' must be a boolean";
	}

	// Validate hideOn field.
	if ( isset( $exercise['hideOn'] ) ) {
		if ( ! is_array( $exercise['hideOn'] ) ) {
			$errors[] = "$ex_prefix: 'hideOn' must be an array";
		} else {
			foreach ( $exercise['hideOn'] as $mode_index => $mode ) {
				if ( ! is_string( $mode ) || empty( $mode ) ) {
					$errors[] = "$ex_prefix: 'hideOn[$mode_index]' must be a non-empty string";
				}
			}
		}
	}

	// Validate customLabel field (required for type=custom is handled in validate_regular_exercise).
	if ( isset( $exercise['customLabel'] ) ) {
		if ( ! is_string( $exercise['customLabel'] ) || empty( $exercise['customLabel'] ) ) {
			$errors[] = "$ex_prefix: 'customLabel' must be a non-empty string";
		}
	}

	return $errors;
}

/**
 * Validate repCounter configuration.
 *
 * @param mixed  $rep_counter Rep counter data.
 * @param string $ex_prefix Prefix for error messages.
 * @param int    $version Schema version (1 or 2).
 * @return array Array of error messages.
 */
function validate_rep_counter( mixed $rep_counter, string $ex_prefix, int $version = 1 ): array {
	$errors     = [];
	$rep_prefix = "$ex_prefix, repCounter";

	if ( ! is_array( $rep_counter ) ) {
		$errors[] = "$rep_prefix: Must be an object";
		return $errors;
	}

	// Required fields.
	$required_fields = [ 'sets', 'reps', 'restSeconds', 'delayMilliseconds' ];
	foreach ( $required_fields as $field ) {
		if ( ! isset( $rep_counter[ $field ] ) ) {
			$errors[] = "$rep_prefix: Missing required field '$field'";
		}
	}

	// Validate sets.
	if ( isset( $rep_counter['sets'] ) ) {
		if ( ! is_int( $rep_counter['sets'] ) || $rep_counter['sets'] < 1 ) {
			$errors[] = "$rep_prefix: 'sets' must be a positive integer";
		}
	}

	// Validate reps.
	if ( isset( $rep_counter['reps'] ) ) {
		if ( ! is_int( $rep_counter['reps'] ) || $rep_counter['reps'] < 1 ) {
			$errors[] = "$rep_prefix: 'reps' must be a positive integer";
		}
	}

	// Validate restSeconds.
	if ( isset( $rep_counter['restSeconds'] ) ) {
		if ( ! is_int( $rep_counter['restSeconds'] ) || $rep_counter['restSeconds'] < 1 ) {
			$errors[] = "$rep_prefix: 'restSeconds' must be a positive integer";
		}
	}

	// Validate delayMilliseconds.
	if ( isset( $rep_counter['delayMilliseconds'] ) ) {
		if ( ! is_numeric( $rep_counter['delayMilliseconds'] ) || $rep_counter['delayMilliseconds'] < 1000 ) {
			$errors[] = "$rep_prefix: 'delayMilliseconds' must be a number >= 1000";
		}
	}

	// V2: Validate bilateral field.
	if ( $version === 2 && isset( $rep_counter['bilateral'] ) ) {
		if ( ! is_bool( $rep_counter['bilateral'] ) ) {
			$errors[] = "$rep_prefix: 'bilateral' must be a boolean";
		}
	}

	return $errors;
}

/**
 * Error message when not called via CLI
 */
if ( PHP_SAPI !== 'cli' ) {
	header( 'Content-Type: text/plain; charset=utf-8' );
	http_response_code( 403 );
	echo "Error: This script can only be run from the command line.\n\n";
	echo "Usage:\n";
	echo "  cd trainings/\n";
	echo "  php validate-schedule.php                    # Validates all schedules\n";
	echo "  php validate-schedule.php schedule-2026-01-15.json\n";
	exit( 1 );
}

// Get files from command line arguments.
$files = array_slice( $argv, 1 );

// If no parameters provided, scan current directory for schedules.
if ( empty( $files ) ) {
	$scanned_files = glob( __DIR__ . '/schedule-*.json' );

	if ( ! empty( $scanned_files ) ) {
		$files = $scanned_files;
		echo "No files specified. Scanning current directory...\n\n";
	} else {
		echo "No schedule files found in current directory.\n";
		echo "\nUsage: php validate-schedule.php [file1.json] [file2.json ...]\n";
		echo "Examples:\n";
		echo "  php validate-schedule.php                    # Validates all schedules\n";
		echo "  php validate-schedule.php schedule-2026-01-15.json\n";
		echo "  php validate-schedule.php schedule-*.json\n";
		exit( 1 );
	}
} else {
	// Process file arguments - prepend __DIR__ if needed.
	$processed_files = [];
	foreach ( $files as $file ) {
		// If file is not an absolute path and doesn't exist as-is, prepend __DIR__.
		if ( ! str_starts_with( $file, '/' ) && ! file_exists( $file ) ) {
			$full_path = __DIR__ . '/' . $file;
			if ( file_exists( $full_path ) ) {
				$processed_files[] = $full_path;
			} else {
				$processed_files[] = $file; // Keep original for error reporting.
			}
		} else {
			$processed_files[] = $file;
		}
	}
	$files = $processed_files;
}

$total_files   = 0;
$valid_files   = 0;
$invalid_files = 0;

foreach ( $files as $file ) {
	$total_files++;
	$result = validate_schedule_file( $file );

	// phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped -- CLI tool, not web output.
	if ( $result['valid'] ) {
		$valid_files++;
		echo "✓ {$result['file']}: VALID\n";
	} else {
		$invalid_files++;
		echo "✗ {$result['file']}: INVALID\n";
		foreach ( $result['errors'] as $err ) {
			echo "  - $err\n";
		}
	}
	// phpcs:enable WordPress.Security.EscapeOutput.OutputNotEscaped
}

// phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped -- CLI tool, not web output.
echo "\n";
echo "Summary:\n";
echo "  Total files: $total_files\n";
echo "  Valid: $valid_files\n";
echo "  Invalid: $invalid_files\n";
// phpcs:enable WordPress.Security.EscapeOutput.OutputNotEscaped

exit( $invalid_files > 0 ? 1 : 0 );
