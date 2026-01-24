<?php
/**
 * Consent Page
 *
 * Privacy consent screen shown to users before accessing the app.
 * Only shown when no password protection is enabled.
 *
 * @package BodyRefactoring
 */

// Load tools.php if not already loaded
if ( ! defined( 'APP_VERSION' ) ) {
	require_once __DIR__ . '/tools.php';
}

// Split app name for styling (first word highlighted)
$name_parts = explode( ' ', APP_NAME, 2 );
$first_name = htmlspecialchars( $name_parts[0] );
$rest_name  = isset( $name_parts[1] ) ? htmlspecialchars( $name_parts[1] ) : '';

// Default color values (customization via Tailwind config)
$gradient        = 'linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%)';
$button_gradient = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
$accent_color    = '#22d3ee';
?>
<!DOCTYPE html>
<html lang="de">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
	<meta name="mobile-web-app-capable" content="yes">
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
	<meta name="apple-mobile-web-app-title" content="<?php echo htmlspecialchars( APP_NAME ); ?>">
	<link rel="apple-touch-icon" href="<?php echo htmlspecialchars( APP_ICON ); ?>">
	<link rel="icon" type="image/png" href="<?php echo htmlspecialchars( APP_ICON ); ?>">
	<meta name="robots" content="noindex, nofollow, noarchive">
	<title>Datenschutz & Einwilligung - <?php echo htmlspecialchars( APP_NAME ); ?></title>

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
		.consent-container {
			background: rgba(30, 41, 59, 0.95);
			backdrop-filter: blur(10px);
			border: 2px solid rgba(51, 65, 85, 0.5);
			border-radius: 24px;
			padding: 40px;
			max-width: 600px;
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
		.consent-content {
			background: rgba(15, 23, 42, 0.5);
			border: 1px solid rgba(51, 65, 85, 0.5);
			border-radius: 16px;
			padding: 24px;
			margin-bottom: 24px;
		}
		h2 { font-size: 18px; font-weight: 700; margin-bottom: 16px; color: #f1f5f9; }
		p { line-height: 1.6; color: #cbd5e1; margin-bottom: 16px; font-size: 14px; }
		.cdn-list {
			background: rgba(15, 23, 42, 0.5);
			border: 1px solid rgba(51, 65, 85, 0.5);
			border-radius: 12px;
			padding: 16px;
			margin: 16px 0;
		}
		.cdn-list h3 { font-size: 14px; font-weight: 600; margin-bottom: 12px; color: #f1f5f9; }
		.cdn-list ul { list-style: none; padding: 0; }
		.cdn-list li { padding: 8px 0; color: #94a3b8; font-size: 13px; border-bottom: 1px solid rgba(51, 65, 85, 0.3); }
		.cdn-list li:last-child { border-bottom: none; }
		.highlight {
			background: rgba(34, 211, 238, 0.1);
			border: 1px solid rgba(34, 211, 238, 0.3);
			border-radius: 8px; padding: 12px; color: <?php echo $accent_color; ?>; font-size: 13px; font-weight: 600; margin-top: 16px;
		}
		.buttons { display: flex; gap: 12px; margin-top: 24px; }
		button {
			flex: 1; padding: 16px; border: none; border-radius: 12px;
			font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s;
		}
		.accept-btn { background: <?php echo $button_gradient; ?>; color: white; }
		.accept-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4); }
		.decline-btn { background: rgba(71, 85, 105, 0.5); color: #cbd5e1; }
		.decline-btn:hover { background: rgba(71, 85, 105, 0.7); }
		.footer-links { margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(51, 65, 85, 0.5); text-align: center; }
		.footer-links p { font-size: 13px; color: #94a3b8; margin-bottom: 8px; }
		.footer-links a { color: <?php echo $accent_color; ?>; text-decoration: none; font-weight: 600; }
		@media (max-width: 640px) {
			.consent-container { padding: 24px; }
			h1 { font-size: 24px; }
			.buttons { flex-direction: column; }
		}
	</style>
</head>
<body>
	<div class="consent-container">
		<div class="logo">
			<img src="<?php echo htmlspecialchars( APP_ICON ); ?>" alt="<?php echo htmlspecialchars( APP_NAME ); ?> Logo">
			<h1><?php echo $first_name; ?><?php echo $rest_name ? ' ' . $rest_name : ''; ?></h1>
			<p class="subtitle">Datenschutz & Einwilligung</p>
		</div>

		<div class="consent-content">
			<h2>🔒 Deine Privatsphäre</h2>
			<p>Diese App nutzt externe CDN-Dienste für Styling und Funktionalität. Beim Laden dieser Ressourcen kann deine IP-Adresse an folgende Drittanbieter übermittelt werden:</p>

			<div class="cdn-list">
				<h3>Externe Ressourcen:</h3>
				<ul>
					<li><strong>Tailwind CSS</strong> – cdn.tailwindcss.com</li>
					<li><strong>Canvas Confetti</strong> – cdn.jsdelivr.net</li>
					<li><strong>Google Fonts</strong> – fonts.googleapis.com</li>
					<li><strong>Lucide Icons</strong> – unpkg.com</li>
				</ul>
			</div>

			<div class="highlight">
				✅ Alle deine Daten werden ausschließlich lokal in deinem Browser gespeichert (LocalStorage). Es werden keine persönlichen Daten an Server übertragen oder extern gespeichert.
			</div>
		</div>

		<div class="buttons">
			<button class="decline-btn" onclick="declineConsent()">Ablehnen</button>
			<button class="accept-btn" onclick="acceptConsent()">Akzeptieren & Fortfahren</button>
		</div>

		<div class="footer-links">
			<p>Ein Projekt von <a href="https://christoph-daum.de" target="_blank">Christoph Daum</a></p>
			<p>Open Source auf <a href="https://github.com/apermo/bodyrefactoring" target="_blank">GitHub</a></p>
		</div>
	</div>

	<script>
		function acceptConsent() {
			const expiryDate = new Date();
			expiryDate.setFullYear(expiryDate.getFullYear() + 1);
			document.cookie = `br_consent=accepted; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
			window.location.reload();
		}
		function declineConsent() {
			alert('Ohne Zustimmung kann die App leider nicht genutzt werden, da sie auf externe Ressourcen angewiesen ist.');
		}
	</script>
</body>
</html>
