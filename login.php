<?php
/**
 * Login Page
 *
 * Password authentication screen for protected instances.
 * Only shown when APP_PASSWORD_HASH is set in .env.
 *
 * @package BodyRefactoring
 */

// Load tools.php if not already loaded
if ( ! defined( 'APP_VERSION' ) ) {
	require_once __DIR__ . '/tools.php';
}

// Redirect if auth not enabled or already authenticated
if ( ! is_auth_enabled() || is_authenticated() ) {
	header( 'Location: index.php' );
	exit;
}

$show_error = false;

// Handle login form submission
if ( $_SERVER['REQUEST_METHOD'] === 'POST' ) {
	$password = $_POST['password'] ?? '';

	if ( verify_password( $password ) ) {
		set_auth_cookie();
		header( 'Location: index.php' );
		exit;
	} else {
		$show_error = true;
	}
}

// Split app name for styling (first word highlighted)
$name_parts = explode( ' ', APP_NAME, 2 );
$first_name = htmlspecialchars( $name_parts[0] );
$rest_name  = isset( $name_parts[1] ) ? htmlspecialchars( $name_parts[1] ) : '';

// Color scheme values
$gradients = [
	'default' => 'linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%)',
	'green'   => 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
	'purple'  => 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
	'amber'   => 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
];
$gradient  = $gradients[ APP_COLOR_SCHEME ] ?? $gradients['default'];

$button_gradients = [
	'default' => 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
	'green'   => 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
	'purple'  => 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
	'amber'   => 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
];
$button_gradient  = $button_gradients[ APP_COLOR_SCHEME ] ?? $button_gradients['default'];

$accent_colors = [
	'default' => '#22d3ee',
	'green'   => '#22c55e',
	'purple'  => '#a855f7',
	'amber'   => '#f59e0b',
];
$accent_color  = $accent_colors[ APP_COLOR_SCHEME ] ?? $accent_colors['default'];
?>
<!DOCTYPE html>
<html lang="de">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
	<meta name="apple-mobile-web-app-capable" content="yes">
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
	<meta name="apple-mobile-web-app-title" content="<?php echo htmlspecialchars( APP_NAME ); ?>">
	<link rel="apple-touch-icon" href="<?php echo htmlspecialchars( APP_ICON ); ?>">
	<link rel="icon" type="image/png" href="<?php echo htmlspecialchars( APP_ICON ); ?>">
	<meta name="robots" content="noindex, nofollow, noarchive">
	<title>Login - <?php echo htmlspecialchars( APP_NAME ); ?></title>

	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
			background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
			min-height: 100vh;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 20px;
			color: #e2e8f0;
		}
		.login-container {
			background: rgba(30, 41, 59, 0.95);
			backdrop-filter: blur(10px);
			border: 2px solid rgba(51, 65, 85, 0.5);
			border-radius: 24px;
			padding: 40px;
			max-width: 400px;
			width: 100%;
			box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
		}
		.logo { text-align: center; margin-bottom: 30px; }
		.logo img { width: 80px; height: 80px; border-radius: 20px; margin-bottom: 15px; }
		h1 {
			font-size: 28px; font-weight: 900; text-align: center; margin-bottom: 10px;
			background: <?php echo $gradient; ?>;
			-webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
		}
		.subtitle { text-align: center; color: #94a3b8; font-size: 14px; margin-bottom: 30px; }
		.login-form label {
			display: block; font-size: 14px; font-weight: 600; color: #94a3b8; margin-bottom: 8px;
		}
		.login-form input[type="password"] {
			width: 100%; padding: 14px 16px;
			background: rgba(15, 23, 42, 0.8);
			border: 2px solid rgba(51, 65, 85, 0.5);
			border-radius: 12px; color: #e2e8f0; font-size: 16px;
			margin-bottom: 16px; transition: border-color 0.2s;
		}
		.login-form input[type="password"]:focus {
			outline: none; border-color: <?php echo $accent_color; ?>;
		}
		.error-message {
			background: rgba(239, 68, 68, 0.2);
			border: 1px solid rgba(239, 68, 68, 0.5);
			border-radius: 8px; padding: 12px;
			color: #ef4444; font-size: 14px; margin-bottom: 16px;
		}
		.submit-btn {
			width: 100%; padding: 16px; border: none; border-radius: 12px;
			font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s;
			background: <?php echo $button_gradient; ?>; color: white;
		}
		.submit-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4); }
		.footer-links { margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(51, 65, 85, 0.5); text-align: center; }
		.footer-links p { font-size: 13px; color: #94a3b8; margin-bottom: 8px; }
		.footer-links a { color: <?php echo $accent_color; ?>; text-decoration: none; font-weight: 600; }
		@media (max-width: 640px) { .login-container { padding: 24px; } h1 { font-size: 24px; } }
	</style>
</head>
<body>
	<div class="login-container">
		<div class="logo">
			<img src="<?php echo htmlspecialchars( APP_ICON ); ?>" alt="<?php echo htmlspecialchars( APP_NAME ); ?> Logo">
			<h1><?php echo $first_name; ?><?php echo $rest_name ? ' ' . $rest_name : ''; ?></h1>
			<p class="subtitle">Geschützte Instanz</p>
		</div>

		<form method="POST" class="login-form">
			<?php if ( $show_error ) : ?>
				<div class="error-message">
					Falsches Passwort. Bitte versuche es erneut.
				</div>
			<?php endif; ?>

			<label for="password">Passwort</label>
			<input type="password" id="password" name="password" required autofocus placeholder="••••••••">

			<button type="submit" class="submit-btn">Anmelden</button>
		</form>

		<div class="footer-links">
			<p>Ein Projekt von <a href="https://christoph-daum.de" target="_blank">Christoph Daum</a></p>
			<p>Open Source auf <a href="https://github.com/apermo/bodyrefactoring" target="_blank">GitHub</a></p>
		</div>
	</div>
</body>
</html>
