<?php
/**
 * Database Installer
 *
 * Web-based installer for initializing the database schema and seed data.
 * Similar to WordPress's install.php - runs when DATABASE_VERSION is missing or outdated.
 *
 * @package BodyRefactoring
 */

require_once __DIR__ . '/tools.php';
require_once __DIR__ . '/includes/Database.php';

// Redirect to app if already installed.
if ( ! needs_database_install() ) {
	header( 'Location: /' );
	exit;
}

$error   = null;
$success = null;
$step    = $_GET['step'] ?? 'check';

/**
 * Run pre-flight checks.
 *
 * @return array{passed: bool, checks: array}
 */
function run_preflight_checks(): array {
	$checks = [];

	// PHP version.
	$php_ok            = version_compare( PHP_VERSION, '8.1.0', '>=' );
	$checks['php']     = [
		'label'  => 'PHP Version',
		'value'  => PHP_VERSION,
		'passed' => $php_ok,
		'error'  => $php_ok ? null : 'PHP 8.1+ required',
	];

	// Database credentials.
	$db_configured       = getenv( 'DB_HOST' ) && getenv( 'DB_NAME' ) && getenv( 'DB_USER' );
	$checks['db_config'] = [
		'label'  => 'Database Configuration',
		'value'  => $db_configured ? getenv( 'DB_HOST' ) . '/' . getenv( 'DB_NAME' ) : 'Not configured',
		'passed' => $db_configured,
		'error'  => $db_configured ? null : 'Set DB_HOST, DB_NAME, DB_USER, DB_PASS in .env',
	];

	// Database connection.
	$db_connected       = false;
	$db_error           = null;
	if ( $db_configured ) {
		try {
			$db           = Database::get_instance();
			$db_connected = true;
		} catch ( PDOException $e ) {
			$db_error = $e->getMessage();
		}
	}
	$checks['db_connection'] = [
		'label'  => 'Database Connection',
		'value'  => $db_connected ? 'Connected' : 'Failed',
		'passed' => $db_connected,
		'error'  => $db_error,
	];

	// .env writable.
	$env_writable       = is_writable( __DIR__ . '/.env' );
	$checks['env_file'] = [
		'label'  => '.env File',
		'value'  => $env_writable ? 'Writable' : 'Not writable',
		'passed' => $env_writable,
		'error'  => $env_writable ? null : 'Make .env writable to save installation state',
	];

	// Schema file exists.
	$schema_exists        = file_exists( __DIR__ . '/includes/database/schema.sql' );
	$checks['schema']     = [
		'label'  => 'Schema File',
		'value'  => $schema_exists ? 'Found' : 'Missing',
		'passed' => $schema_exists,
		'error'  => $schema_exists ? null : 'includes/database/schema.sql not found',
	];

	$all_passed = array_reduce( $checks, fn( $carry, $check ) => $carry && $check['passed'], true );

	return [
		'passed' => $all_passed,
		'checks' => $checks,
	];
}

/**
 * Get available JSON schedule files.
 *
 * @return array List of schedule files.
 */
function get_available_schedules(): array {
	$schedule_dir = __DIR__ . '/' . SCHEDULE_PATH;
	$files        = glob( $schedule_dir . '/schedule-*.json' );
	$schedules    = [];

	foreach ( $files as $file ) {
		$basename = basename( $file );
		if ( preg_match( '/schedule-(\d{4}-\d{2}-\d{2})\.json/', $basename, $matches ) ) {
			$schedules[] = [
				'file' => $basename,
				'date' => $matches[1],
				'path' => $file,
			];
		}
	}

	usort( $schedules, fn( $a, $b ) => strcmp( $b['date'], $a['date'] ) );

	return $schedules;
}

/**
 * Install database with specified options.
 *
 * @param string      $mode    Installation mode: 'empty', 'seed', 'json', 'sql'.
 * @param string|null $file    Uploaded file path for 'json' or 'sql' modes.
 * @return array{success: bool, message: string, details: array}
 */
function install_database( string $mode, ?string $file = null ): array {
	$details = [];

	try {
		$db = Database::get_instance();

		// Always install schema first.
		$db->init_schema();
		$details[] = 'Schema created successfully';

		switch ( $mode ) {
			case 'seed':
				// Install seed data.
				$db->import_seed_data();
				$count      = $db->query_one( 'SELECT COUNT(*) as cnt FROM schedule_templates' );
				$details[]  = "Seed data imported ({$count['cnt']} templates)";
				break;

			case 'json':
				// Import from JSON schedules directory.
				require_once __DIR__ . '/tools/import-schedule.php';
				$schedules = get_available_schedules();
				$imported  = 0;
				foreach ( $schedules as $schedule ) {
					if ( import_schedule( $schedule['path'], $db, false, false ) ) {
						++$imported;
					}
				}
				$details[] = "Imported {$imported} schedules from JSON files";
				break;

			case 'upload_sql':
				if ( $file && file_exists( $file ) ) {
					$db->import_sql_file( $file );
					$details[] = 'Custom SQL file imported';
				}
				break;

			case 'upload_json':
				if ( $file && file_exists( $file ) ) {
					require_once __DIR__ . '/tools/import-schedule.php';
					if ( import_schedule( $file, $db, false, false ) ) {
						$details[] = 'Custom JSON schedule imported';
					}
				}
				break;

			case 'empty':
			default:
				$details[] = 'Empty database ready for data';
				break;
		}

		// Update DATABASE_VERSION in .env.
		if ( set_database_version( REQUIRED_DATABASE_VERSION ) ) {
			$details[] = 'DATABASE_VERSION set to ' . REQUIRED_DATABASE_VERSION;
		} else {
			$details[] = 'Warning: Could not update .env file';
		}

		// Verify installation.
		$templates = $db->query_one( 'SELECT COUNT(*) as cnt FROM schedule_templates' );
		$exercises = $db->query_one( 'SELECT COUNT(*) as cnt FROM schedule_exercises' );
		$details[] = "Final state: {$templates['cnt']} templates, {$exercises['cnt']} exercises";

		return [
			'success' => true,
			'message' => 'Installation completed successfully',
			'details' => $details,
		];

	} catch ( Exception $e ) {
		return [
			'success' => false,
			'message' => 'Installation failed: ' . $e->getMessage(),
			'details' => $details,
		];
	}
}

// Handle form submission.
if ( $_SERVER['REQUEST_METHOD'] === 'POST' && isset( $_POST['action'] ) ) {
	$action = $_POST['action'];

	if ( $action === 'install' ) {
		$mode = $_POST['mode'] ?? 'empty';
		$file = null;

		// Handle file upload.
		if ( in_array( $mode, [ 'upload_sql', 'upload_json' ], true ) && ! empty( $_FILES['upload']['tmp_name'] ) ) {
			$file = $_FILES['upload']['tmp_name'];
		}

		$result = install_database( $mode, $file );

		if ( $result['success'] ) {
			$success = $result;
			$step    = 'complete';
		} else {
			$error = $result;
			$step  = 'install';
		}
	}
}

// Run preflight checks.
$preflight = run_preflight_checks();
$schedules = get_available_schedules();

?>
<!DOCTYPE html>
<html lang="de">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="robots" content="noindex, nofollow">
	<title>Installation - <?php echo htmlspecialchars( APP_NAME ); ?></title>
	<script src="https://cdn.tailwindcss.com"></script>
	<style>
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		}
	</style>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen">
	<div class="max-w-2xl mx-auto p-6">
		<header class="text-center mb-8">
			<h1 class="text-3xl font-bold text-white mb-2">
				<?php echo htmlspecialchars( APP_NAME ); ?>
			</h1>
			<p class="text-slate-400">Database Installation</p>
			<p class="text-sm text-slate-500 mt-1">
				Version <?php echo htmlspecialchars( APP_VERSION ); ?> &bull;
				Database Schema v<?php echo REQUIRED_DATABASE_VERSION; ?>
			</p>
		</header>

		<?php if ( $step === 'complete' && $success ) : ?>
			<!-- Installation Complete -->
			<div class="bg-green-500/10 border border-green-500/30 rounded-lg p-6 mb-6">
				<h2 class="text-xl font-semibold text-green-400 mb-4">Installation Complete</h2>
				<ul class="space-y-2 text-slate-300">
					<?php foreach ( $success['details'] as $detail ) : ?>
						<li class="flex items-start gap-2">
							<span class="text-green-400">&#10003;</span>
							<?php echo htmlspecialchars( $detail ); ?>
						</li>
					<?php endforeach; ?>
				</ul>
				<div class="mt-6">
					<a href="/" class="inline-block bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors">
						Open App
					</a>
				</div>
			</div>

		<?php elseif ( ! $preflight['passed'] ) : ?>
			<!-- Pre-flight Checks Failed -->
			<div class="bg-slate-800 rounded-lg p-6 mb-6">
				<h2 class="text-xl font-semibold mb-4">Pre-flight Checks</h2>
				<p class="text-slate-400 mb-4">Please fix the following issues before continuing:</p>
				<ul class="space-y-3">
					<?php foreach ( $preflight['checks'] as $key => $check ) : ?>
						<li class="flex items-center justify-between p-3 rounded <?php echo $check['passed'] ? 'bg-slate-700/50' : 'bg-red-500/10 border border-red-500/30'; ?>">
							<div>
								<span class="font-medium"><?php echo htmlspecialchars( $check['label'] ); ?></span>
								<span class="text-slate-400 ml-2"><?php echo htmlspecialchars( $check['value'] ); ?></span>
								<?php if ( $check['error'] ) : ?>
									<p class="text-red-400 text-sm mt-1"><?php echo htmlspecialchars( $check['error'] ); ?></p>
								<?php endif; ?>
							</div>
							<span class="<?php echo $check['passed'] ? 'text-green-400' : 'text-red-400'; ?>">
								<?php echo $check['passed'] ? '&#10003;' : '&#10007;'; ?>
							</span>
						</li>
					<?php endforeach; ?>
				</ul>
				<div class="mt-6">
					<a href="installer.php" class="text-blue-400 hover:text-blue-300">Refresh checks</a>
				</div>
			</div>

		<?php else : ?>
			<!-- Installation Options -->
			<?php if ( $error ) : ?>
				<div class="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
					<p class="text-red-400 font-medium"><?php echo htmlspecialchars( $error['message'] ); ?></p>
					<?php if ( ! empty( $error['details'] ) ) : ?>
						<ul class="mt-2 text-sm text-slate-400">
							<?php foreach ( $error['details'] as $detail ) : ?>
								<li><?php echo htmlspecialchars( $detail ); ?></li>
							<?php endforeach; ?>
						</ul>
					<?php endif; ?>
				</div>
			<?php endif; ?>

			<div class="bg-slate-800 rounded-lg p-6 mb-6">
				<h2 class="text-xl font-semibold mb-2">Pre-flight Checks</h2>
				<p class="text-green-400 mb-4">All checks passed</p>
				<ul class="space-y-2 text-sm text-slate-400">
					<?php foreach ( $preflight['checks'] as $check ) : ?>
						<li class="flex items-center gap-2">
							<span class="text-green-400">&#10003;</span>
							<?php echo htmlspecialchars( $check['label'] ); ?>: <?php echo htmlspecialchars( $check['value'] ); ?>
						</li>
					<?php endforeach; ?>
				</ul>
			</div>

			<form method="POST" enctype="multipart/form-data" class="space-y-6">
				<input type="hidden" name="action" value="install">

				<div class="bg-slate-800 rounded-lg p-6">
					<h2 class="text-xl font-semibold mb-4">Installation Options</h2>

					<div class="space-y-4">
						<!-- Empty Database -->
						<label class="flex items-start gap-4 p-4 rounded-lg border border-slate-700 hover:border-slate-600 cursor-pointer transition-colors">
							<input type="radio" name="mode" value="empty" class="mt-1" checked>
							<div>
								<span class="font-medium text-white">Empty Database</span>
								<p class="text-sm text-slate-400">Create schema only, no data. Use the import tool later.</p>
							</div>
						</label>

						<!-- Seed Data -->
						<label class="flex items-start gap-4 p-4 rounded-lg border border-slate-700 hover:border-slate-600 cursor-pointer transition-colors">
							<input type="radio" name="mode" value="seed" class="mt-1">
							<div>
								<span class="font-medium text-white">Demo Data</span>
								<p class="text-sm text-slate-400">Install with pre-configured schedules (seed data).</p>
							</div>
						</label>

						<!-- Import from JSON -->
						<?php if ( ! empty( $schedules ) ) : ?>
							<label class="flex items-start gap-4 p-4 rounded-lg border border-slate-700 hover:border-slate-600 cursor-pointer transition-colors">
								<input type="radio" name="mode" value="json" class="mt-1">
								<div>
									<span class="font-medium text-white">Import JSON Schedules</span>
									<p class="text-sm text-slate-400">
										Import <?php echo count( $schedules ); ?> schedule(s) from /<?php echo SCHEDULE_PATH; ?>/:
										<?php echo implode( ', ', array_slice( array_column( $schedules, 'date' ), 0, 3 ) ); ?>
										<?php echo count( $schedules ) > 3 ? '...' : ''; ?>
									</p>
								</div>
							</label>
						<?php endif; ?>

						<!-- Upload SQL -->
						<label class="flex items-start gap-4 p-4 rounded-lg border border-slate-700 hover:border-slate-600 cursor-pointer transition-colors">
							<input type="radio" name="mode" value="upload_sql" class="mt-1" id="mode_upload_sql">
							<div class="flex-1">
								<span class="font-medium text-white">Upload SQL File</span>
								<p class="text-sm text-slate-400 mb-2">Import from a custom SQL dump.</p>
								<input type="file" name="upload" accept=".sql" class="text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-slate-700 file:text-slate-300 hover:file:bg-slate-600">
							</div>
						</label>

						<!-- Upload JSON -->
						<label class="flex items-start gap-4 p-4 rounded-lg border border-slate-700 hover:border-slate-600 cursor-pointer transition-colors">
							<input type="radio" name="mode" value="upload_json" class="mt-1" id="mode_upload_json">
							<div class="flex-1">
								<span class="font-medium text-white">Upload JSON Schedule</span>
								<p class="text-sm text-slate-400 mb-2">Import a single schedule JSON file.</p>
								<input type="file" name="upload" accept=".json" class="text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-slate-700 file:text-slate-300 hover:file:bg-slate-600">
							</div>
						</label>
					</div>
				</div>

				<button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors">
					Install Database
				</button>
			</form>
		<?php endif; ?>

		<footer class="text-center text-slate-500 text-sm mt-8">
			<p>Current: DATABASE_VERSION=<?php echo CURRENT_DATABASE_VERSION; ?> &bull; Required: <?php echo REQUIRED_DATABASE_VERSION; ?></p>
		</footer>
	</div>
</body>
</html>
