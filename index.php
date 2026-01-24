<?php
/**
 * Main Application Entry Point
 *
 * Renders the Body Refactoring PWA interface.
 *
 * @package BodyRefactoring
 */

// Load dependencies and helpers.
require_once __DIR__ . '/tools.php';
require_once __DIR__ . '/includes/config-loader.php';
require_once __DIR__ . '/assets/cachebuster.php';

// Start output buffering for Tailwind class replacement
ob_start();

// Prevent aggressive caching of the main HTML (especially for iOS PWA)
header( 'Cache-Control: no-cache, must-revalidate' );

// Authentication check - redirect to login if auth enabled and not authenticated
if ( is_auth_enabled() && ! is_authenticated() ) {
	require_once __DIR__ . '/login.php';
	exit;
}

// Database installation check - redirect to installer if needed
if ( needs_database_install() ) {
	header( 'Location: /installer.php' );
	exit;
}

// Consent check - only for non-authenticated instances
if ( ! is_auth_enabled() && ( ! isset( $_COOKIE['br_consent'] ) || $_COOKIE['br_consent'] !== 'accepted' ) ) {
	require_once __DIR__ . '/consent.php';
	exit;
}

// Split app name for header display
$name_parts = explode( ' ', APP_NAME, 2 );
$first_name = htmlspecialchars( $name_parts[0] );
$rest_name  = isset( $name_parts[1] ) ? htmlspecialchars( $name_parts[1] ) : '';
?>
<!DOCTYPE html>
<html lang="de">
<head>
	<meta charset="UTF-8">
	<meta name="viewport"
		  content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
	<meta name="apple-mobile-web-app-capable" content="yes">
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
	<meta name="apple-mobile-web-app-title" content="<?php echo htmlspecialchars( APP_NAME ); ?>">
	<link rel="apple-touch-icon" href="<?php echo htmlspecialchars( APP_ICON ); ?>">
	<link rel="icon" type="image/png" href="<?php echo htmlspecialchars( APP_ICON ); ?>">
	<meta name="robots" content="noindex, nofollow, noarchive">
	<title><?php echo htmlspecialchars( APP_NAME ); ?> v<?php echo APP_VERSION; ?></title>

	<script src="https://cdn.tailwindcss.com"></script>
	<script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
	<link
		href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Roboto:wght@300;400;700;900&display=swap"
		rel="stylesheet">
	<script src="https://unpkg.com/lucide@latest" onload="lucide.createIcons(); if(window.debugLog) debugLog('Lucide icons loaded', 'success');"></script>

	<link rel="stylesheet" href="<?php echo asset( 'assets/css/styles.css' ); ?>">
	<style id="config-theme">
		<?php echo generate_theme_css(); ?>
	</style>
	<script>
		// App configuration (from JSON config files)
		window.APP_CONFIG = <?php echo get_frontend_config_json(); ?>;
	</script>
	<script>
		// Mode reset password (from PHP config)
		window.MODE_RESET_PASSWORD = '<?php echo MODE_RESET_PASSWORD; ?>';

		// Debug log enabled (from PHP config)
		window.DEBUG_LOG_ENABLED = <?php echo DEBUG_LOG_ENABLED ? 'true' : 'false'; ?>;

		// App branding (from PHP config)
		window.APP_NAME = '<?php echo htmlspecialchars( APP_NAME, ENT_QUOTES ); ?>';

		// Debug logging functions - always available
		window.debugLog = function(message, type = 'info') {
			if (!window.DEBUG_LOG_ENABLED) return;
			const container = document.getElementById('debug-log-content');
			if (!container) return;
			const time = new Date().toLocaleTimeString('de-DE');
			const colors = { info: '#60a5fa', warn: '#fbbf24', error: '#f87171', success: '#4ade80' };
			const entry = document.createElement('div');
			entry.style.cssText = `font-size: 11px; padding: 2px 0; border-bottom: 1px solid #334155; color: ${colors[type] || colors.info}`;
			entry.textContent = `[${time}] ${message}`;
			container.appendChild(entry);
			container.scrollTop = container.scrollHeight;
			console.log(`[DEBUG ${type.toUpperCase()}] ${message}`);
		};

		window.toggleDebugLog = function() {
			const content = document.getElementById('debug-log-content');
			const chevron = document.getElementById('debug-log-chevron');
			if (content && chevron) {
				content.classList.toggle('hidden');
				chevron.style.transform = content.classList.contains('hidden') ? '' : 'rotate(180deg)';
			}
		};

		// Inline fallback for forceUpdate - always available even if modules fail
		window.forceUpdate = window.forceUpdate || function() {
			if (confirm('Update laden?')) {
				const url = new URL(window.location.href);
				url.searchParams.set('update', Date.now());
				window.location.href = url.toString();
			}
		};

		// Inline fallback for toggleMenu - always available even if modules fail
		window.toggleMenu = window.toggleMenu || function(e) {
			e && e.stopPropagation();
			const menu = document.getElementById('menu-dropdown');
			if (menu) menu.classList.toggle('hidden');
		};

		// Inline fallback for closeMenuOutside
		window.closeMenuOutside = window.closeMenuOutside || function(e) {
			const menu = document.getElementById('menu-dropdown');
			const btn = document.getElementById('menu-btn');
			if (menu && btn && !menu.classList.contains('hidden') && !menu.contains(e.target) && !btn.contains(e.target)) {
				menu.classList.add('hidden');
			}
		};

		// Log page load start
		window.addEventListener('DOMContentLoaded', function() {
			debugLog('DOM loaded, v<?php echo APP_VERSION; ?>', 'info');
		});

		// Catch and log unhandled errors
		window.onerror = function(msg, url, line, col, error) {
			debugLog(`ERROR: ${msg} (${url}:${line})`, 'error');
			return false;
		};
	</script>
	 <script type="module" src="<?php echo asset( 'assets/js/app.js' ); ?>"></script>
</head>
<body onclick="closeMenuOutside(event)">

<div id="bg-fixed"></div>

<video id="nosleep-video" playsinline muted loop
	   style="opacity: 0; pointer-events: none; position: absolute; width: 1px; height: 1px;">
	<source src="data:video/mp4;base64,AAAAHGZ0eXBNNEVAAAAAAAEAAQAAAAAAAAAAAAAAAAtmoovlmD7AAAABh1tZGF0AAAAAAAAAAAAAA=="
			type="video/mp4">
</video>

<input type="file" id="import-input" class="hidden" accept=".json" onchange="importData(this)">

<div id="completion-modal" class="modal-overlay">
	<div class="modal-content">
		<div class="text-6xl mb-4">🔥</div>
		<h2 class="text-2xl font-black text-white mb-2 uppercase"><?php echo htmlspecialchars( get_string( 'training.complete', 'Training Complete!' ) ); ?></h2>
		<p id="modal-quote" class="text-slate-400 mb-6 italic">"Konsistenz schlägt Intensität."</p>
		<div class="bg-slate-800 rounded-xl p-4 mb-6 border border-slate-700">
			<div class="text-xs text-slate-500 uppercase tracking-widest"><?php echo htmlspecialchars( get_string( 'training.currentStreak', 'Aktuelle Streak' ) ); ?></div>
			<div class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500"
				 id="modal-streak">0 Tage
			</div>
		</div>
		<button onclick="closeModal()"
				class="w-full font-bold py-3 rounded-xl transition btn-primary"><?php echo htmlspecialchars( get_string( 'training.continueButton', 'Weiter so!' ) ); ?>
		</button>
	</div>
</div>

<div id="recovery-modal" class="modal-overlay">
	<div class="modal-content" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%); border-color: rgba(139, 92, 246, 0.3);">
		<div class="text-6xl mb-4">🩹</div>
		<h2 class="text-2xl font-black mb-2 uppercase" style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Gut gemacht!</h2>
		<p class="text-slate-400 mb-6">Du hast auf deinen Körper gehört und sanft erholt.</p>
		<div class="bg-slate-800/50 rounded-xl p-4 mb-6 border border-purple-500/30">
			<div class="text-xs text-slate-500 uppercase tracking-widest"><?php echo htmlspecialchars( get_string( 'training.currentStreak', 'Aktuelle Streak' ) ); ?></div>
			<div class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500"
				 id="modal-recovery-streak">0 Tage
			</div>
			<div class="text-xs text-purple-300 mt-2">Streak pausiert - erholt dich gut!</div>
		</div>
		<button onclick="closeRecoveryModal()"
				class="w-full bg-gradient-to-r from-blue-500/80 to-purple-500/80 hover:from-blue-600/80 hover:to-purple-600/80 text-white font-bold py-3 rounded-xl transition">Verstanden
		</button>
	</div>
</div>

<div id="sick-modal" class="modal-overlay">
	<div class="modal-content" style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%); border-color: rgba(239, 68, 68, 0.3);">
		<div class="text-6xl mb-4">💊</div>
		<h2 class="text-2xl font-black mb-2 uppercase" style="background: linear-gradient(135deg, #ef4444 0%, #9333ea 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Ruhe dich gut aus</h2>
		<p class="text-slate-400 mb-6">Gute Entscheidung, Erholung hat Priorität.</p>
		<div class="bg-slate-800/50 rounded-xl p-4 mb-6 border border-red-500/30">
			<div class="text-xs text-slate-500 uppercase tracking-widest"><?php echo htmlspecialchars( get_string( 'training.currentStreak', 'Aktuelle Streak' ) ); ?></div>
			<div class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-500"
				 id="modal-sick-streak">0 Tage
			</div>
			<div class="text-xs text-red-300 mt-2" id="sick-shield-status">Schild verwendet - Streak geschützt!</div>
		</div>
		<button onclick="closeSickModal()"
				class="w-full bg-gradient-to-r from-red-500/80 to-purple-500/80 hover:from-red-600/80 hover:to-purple-600/80 text-white font-bold py-3 rounded-xl transition">Gute Besserung
		</button>
	</div>
</div>

<div id="splash-screen">
	<h1 class="text-4xl font-black text-transparent bg-clip-text app-gradient mb-4 animate-pulse">
		<?php echo htmlspecialchars( strtoupper( APP_NAME ) ); ?></h1>
	<div class="text-slate-500 font-mono text-xs">INITIALIZING v<?php echo APP_VERSION; ?>...</div>
</div>

<div class="app-container">

	<div class="flex justify-between items-center mb-6 pt-4 relative z-50">
		<div>
			<h1 class="text-xl font-black text-white uppercase leading-none">
				<span class="text-transparent bg-clip-text app-gradient"><?php echo $first_name; ?></span>
				<?php echo $rest_name; ?>
			</h1>
			<p class="text-slate-500 font-mono text-[10px] mt-1">
				v<?php echo APP_VERSION; ?>
				<span id="debug-indicator" class="hidden ml-2 text-yellow-400 font-bold">🐛 DEBUG</span>
				<span id="mode-indicator" class="hidden ml-2">👤 Mode active</span>
			</p>
		</div>

		<div class="flex items-center gap-3">
			<div id="streak-container" class="streak-badge hidden">
				<i data-lucide="flame" class="w-4 h-4 fill-white"></i>
				<span id="streak-count">0</span>
			</div>

			<div id="shields-container" class="flex gap-1" title="Streak-Schutzschilder">
				<!-- Shields will be rendered here by JS -->
			</div>

			<button id="menu-btn" onclick="toggleMenu(event)"
					class="p-2 bg-slate-800/80 backdrop-blur rounded-lg text-slate-300 border border-slate-700 hover:bg-slate-700 transition">
				<i data-lucide="menu" class="w-6 h-6"></i>
			</button>
		</div>

		<div id="menu-dropdown"
			 class="hidden absolute right-0 top-16 w-56 bg-slate-800/95 backdrop-blur border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex-col">
			<button id="debug-toggle-btn" onclick="toggleDebugMode()"
					class="hide-in-standalone px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white border-b border-slate-700 flex items-center gap-3 w-full">
				<i data-lucide="bug" class="w-4 h-4 text-orange-400 flex-shrink-0"></i>
				<span class="truncate" id="debug-toggle-text">Debug Mode aktivieren</span>
			</button>
			<button onclick="showSickModeModal()"
					class="px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white border-b border-slate-700 flex items-center gap-3 w-full">
				<i data-lucide="heart-pulse" class="w-4 h-4 text-red-400 flex-shrink-0"></i>
				<span class="truncate">Krank / Recovery</span>
			</button>
			<a href="schedule-editor.php" target="_blank"
			   class="px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white border-b border-slate-700 flex items-center gap-3 w-full">
				<i data-lucide="edit" class="w-4 h-4 text-purple-400 flex-shrink-0"></i>
				<span class="truncate">Schedule Editor</span>
			</a>
			<button onclick="exportData()"
					class="px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white border-b border-slate-700 flex items-center gap-3 w-full">
				<i data-lucide="download" class="w-4 h-4 text-blue-400 flex-shrink-0"></i>
				<span class="truncate">Backup speichern</span>
			</button>
			<button onclick="triggerImport()"
					class="px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white border-b border-slate-700 flex items-center gap-3 w-full">
				<i data-lucide="upload" class="w-4 h-4 text-emerald-400 flex-shrink-0"></i>
				<span class="truncate">Backup laden</span>
			</button>
			<button onclick="forceUpdate()"
					class="px-4 py-3 text-left text-sm text-yellow-400 hover:bg-slate-700 hover:text-yellow-300 flex items-center gap-3 border-b border-slate-700 w-full">
				<i data-lucide="refresh-cw" class="w-4 h-4 flex-shrink-0"></i>
				<span class="truncate">App aktualisieren</span>
			</button>
			<a href="https://christoph-daum.de" target="_blank"
			   class="px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-3 w-full">
				<i data-lucide="globe" class="w-4 h-4 flex-shrink-0"></i>
				<span class="truncate">Website</span>
			</a>
			<a href="https://github.com/apermo/bodyrefactoring" target="_blank"
			   class="px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white <?php echo is_auth_enabled() ? '' : 'border-b border-slate-700'; ?> flex items-center gap-3 w-full">
				<i data-lucide="github" class="w-4 h-4 flex-shrink-0"></i>
				<span class="truncate">GitHub Repo</span>
			</a>
			<?php if ( is_auth_enabled() ) : ?>
			<a href="logout.php"
			   class="px-4 py-3 text-left text-sm text-red-400 hover:bg-slate-700 hover:text-red-300 border-b border-slate-700 flex items-center gap-3 w-full">
				<i data-lucide="log-out" class="w-4 h-4 flex-shrink-0"></i>
				<span class="truncate">Abmelden</span>
			</a>
			<?php endif; ?>
			<div class="px-4 py-3">
				<button onclick="toggleModeInput()" class="flex items-center gap-3 text-sm text-slate-300 hover:text-white w-full">
					<i data-lucide="user" class="w-4 h-4 text-cyan-400 flex-shrink-0"></i>
					<span class="truncate">Modus</span>
					<i data-lucide="chevron-down" id="mode-chevron" class="w-4 h-4 ml-auto transition-transform"></i>
				</button>
				<div id="mode-input-container" class="hidden mt-2">
					<div class="flex gap-2">
						<input type="text"
							   id="mode-input"
							   placeholder="Modus eingeben..."
							   onkeydown="if(event.key==='Enter') submitAppMode()"
							   class="flex-1 min-w-0 px-3 py-2 bg-slate-900/80 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500">
						<button onclick="submitAppMode()" class="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-bold">
							<i data-lucide="send" class="w-4 h-4"></i>
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div
		class="bg-slate-800/80 backdrop-blur-sm p-3 rounded-2xl border border-slate-700/50 flex justify-between items-center sticky top-2 z-30 shadow-lg mb-6">
		<button onclick="changeWeek(-1)" id="btn-prev" class="nav-btn w-10 h-10"><i data-lucide="chevron-left"
																					class="w-6 h-6"></i></button>
		<div class="text-center flex-1">
			<div id="week-label" class="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Aktuelle Woche</div>
			<div id="week-display" class="font-bold text-white text-xl">KW 4</div>
			<div id="week-info" class="text-[10px] text-slate-500 font-mono"></div>
		</div>
		<button onclick="goToToday()" id="btn-today" class="nav-btn w-10 h-10 hidden" title="Zurück zu heute">
			<i data-lucide="home" class="w-5 h-5"></i>
		</button>
		<button onclick="changeWeek(1)" id="btn-next" class="nav-btn w-10 h-10"><i data-lucide="chevron-right"
																				   class="w-6 h-6"></i></button>
	</div>

	<div id="schedule-container"></div>

	<button id="fab-timer" class="fab-timer" onclick="toggleTimer()">
		<i data-lucide="timer" class="w-6 h-6"></i>
		<span id="timer-text">60s Pause</span>
	</button>

	<footer class="mt-12 pt-8 border-t border-slate-800/50 text-center space-y-4 pb-8">
		<div
			class="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed px-4 bg-slate-900/50 p-4 rounded-xl backdrop-blur-sm">
			Dies ist eine private Web App zur persönlichen Nutzung. Da die URL nicht öffentlich beworben wird, erfolgt
			keine explizite Consent-Abfrage. Durch die Einbindung externer Ressourcen (CDNs) ist es möglich, dass
			technische Daten (wie deine IP-Adresse) von Dritten verarbeitet werden. Alle Trainingsdaten werden
			ausschließlich lokal auf deinem Gerät gespeichert.
		</div>
		<div class="flex justify-center items-center gap-6 text-xs font-mono">
			<a href="https://christoph-daum.de" target="_blank"
			   class="text-slate-300 hover:text-white transition flex items-center gap-2 bg-slate-900/50 px-3 py-1 rounded-full">
				<i data-lucide="globe" class="w-3 h-3 inline"></i> Christoph Daum
			</a>
			<a href="https://github.com/apermo/bodyrefactoring" target="_blank"
			   class="text-slate-300 hover:text-white transition flex items-center gap-2 bg-slate-900/50 px-3 py-1 rounded-full">
				<i data-lucide="github" class="w-3 h-3 inline"></i> GitHub Repo
			</a>
		</div>
		<?php if ( DEBUG_LOG_ENABLED ) : ?>
		<div class="mt-6 text-left">
			<button onclick="toggleDebugLog()" class="w-full flex items-center justify-between bg-slate-800 border border-slate-700 rounded-t-lg px-4 py-2 text-xs font-mono text-yellow-400">
				<span>🐛 Debug Log</span>
				<i data-lucide="chevron-down" id="debug-log-chevron" class="w-4 h-4 transition-transform"></i>
			</button>
			<div id="debug-log-content" class="hidden bg-slate-900 border border-t-0 border-slate-700 rounded-b-lg p-3 max-h-48 overflow-y-auto font-mono">
				<div style="font-size: 11px; padding: 2px 0; color: #60a5fa;">[Init] Debug log enabled</div>
			</div>
		</div>
		<?php endif; ?>
	</footer>

	</div>

	<!-- Sick Mode Modal -->
	<div id="sick-mode-modal" class="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 opacity-0 pointer-events-none transition-opacity duration-300">
		<div class="bg-slate-800 rounded-3xl border-2 border-slate-700 p-6 max-w-md w-full">
			<div class="text-center mb-6">
				<div class="text-5xl mb-3">🏥</div>
				<h2 class="text-2xl font-bold text-white mb-2">Nicht fit für Training?</h2>
				<p class="text-sm text-slate-400">Wähle eine Option für heute</p>
			</div>

			<!-- Shield Status -->
			<div class="bg-slate-900/50 rounded-xl p-3 mb-6 border border-slate-700 text-center">
				<div class="flex items-center justify-center gap-2 text-sm text-slate-400">
					<span>Verfügbare Schutzschilder:</span>
					<div id="shields-container-modal" class="flex gap-1">
						<!-- Shields rendered by JS -->
					</div>
				</div>
			</div>

			<!-- Recovery Mode Option -->
			<button onclick="activateRecoveryMode()" class="w-full mb-4 bg-emerald-500/20 hover:bg-emerald-500/30 border-2 border-emerald-500 text-white font-bold py-4 rounded-xl transition group">
				<div class="flex items-center justify-center gap-3 mb-2">
					<div class="text-3xl">🌱</div>
					<div class="text-left flex-1">
						<div class="text-lg font-bold">Recovery Modus</div>
						<div class="text-xs text-emerald-300 opacity-80">Leichte Aktivitäten</div>
					</div>
				</div>
				<div class="text-xs text-slate-300 opacity-70 px-4">
					→ Atemübungen, Stretching, Flüssigkeit
				</div>
			</button>

			<!-- Sick Mode Option -->
			<button onclick="useSickShield()" class="w-full mb-6 bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500 text-white font-bold py-4 rounded-xl transition group">
				<div class="flex items-center justify-center gap-3 mb-2">
					<div class="text-3xl">🛡️</div>
					<div class="text-left flex-1">
						<div class="text-lg font-bold">Krank (Schild nutzen)</div>
						<div class="text-xs text-red-300 opacity-80">Bei schwerer Krankheit</div>
					</div>
				</div>
				<div class="text-xs text-slate-300 opacity-70 px-4">
					→ Nur Flüssigkeit trinken (benötigt 1 Schild)
				</div>
			</button>

			<button onclick="closeSickModeModal()" class="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition">
				Abbrechen
			</button>
		</div>
	</div>

	<!-- Rep Counter Modal -->
	<div id="rep-counter-modal" class="hidden fixed inset-0 bg-slate-900/95 backdrop-blur-sm z-[100] flex flex-col items-center justify-center p-8">
		<div class="w-full max-w-2xl">
			<!-- Exercise Title -->
			<div class="text-center mb-8">
				<h2 id="rep-exercise-title" class="text-3xl font-bold text-white mb-2">Übung</h2>
				<div id="rep-set-info" class="text-xl text-slate-400"></div>
			</div>

			<!-- Big Counter Display -->
			<div class="bg-slate-800/50 rounded-3xl border-2 border-blue-500/30 p-12 mb-8">
				<div id="rep-counter-display" class="text-center">
					<div class="text-9xl font-bold rep-number-blue mb-4" id="rep-current-number">0</div>
					<div class="text-3xl text-slate-400" id="rep-total">von 12</div>
				</div>
			</div>

			<!-- Status Text -->
			<div id="rep-status-text" class="text-center text-2xl text-white mb-8"></div>

			<!-- Abort Button -->
			<button onclick="abortRepCounter()" class="w-full bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500 text-white font-bold py-4 rounded-xl transition">
				<i data-lucide="x" class="w-6 h-6 inline mr-2"></i>
				Abbrechen
			</button>

			<!-- Log Set Timing Button (hidden by default, shown during set) -->
			<button id="log-set-timing-btn" onclick="logSetTiming()" class="hidden w-full bg-purple-500/20 hover:bg-purple-500/30 border-2 border-purple-500 text-white font-bold py-4 rounded-xl transition mt-16">
				<i data-lucide="clock" class="w-6 h-6 inline mr-2"></i>
				Set bereits fertig
			</button>
		</div>
	</div>

	<!-- Introduction Modal -->
	<div id="intro-modal" class="fixed inset-0 bg-slate-900/95 backdrop-blur-sm z-[200] flex items-center justify-center p-4 opacity-0 pointer-events-none transition-opacity duration-300">
		<div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border-2 border-slate-700 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
			<div class="text-center mb-6">
				<img src="<?php echo htmlspecialchars( APP_ICON ); ?>" alt="<?php echo htmlspecialchars( APP_NAME ); ?>" class="w-24 h-24 mx-auto rounded-2xl mb-4 shadow-lg">
				<h2 class="text-3xl font-black text-transparent bg-clip-text app-gradient mb-2">
					Willkommen bei <?php echo htmlspecialchars( APP_NAME ); ?>!
				</h2>
				<p class="text-slate-400">Meine persönliche Gamified Task App</p>
			</div>

			<!-- Privacy First -->
			<div class="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6">
				<div class="flex items-start gap-3">
					<div class="text-2xl">🔒</div>
					<div>
						<h3 class="font-bold text-emerald-400 mb-1">100% Privat & Lokal</h3>
						<p class="text-sm text-slate-300">Alle Daten werden ausschließlich lokal in deinem Browser gespeichert. Du kannst die App gefahrlos testen und ausprobieren!</p>
					</div>
				</div>
			</div>

			<!-- Features -->
			<div class="space-y-4 mb-6">
				<h3 class="font-bold text-white text-lg mb-3">✨ Features</h3>

				<div class="flex items-start gap-3 text-sm">
					<div class="text-xl">🎯</div>
					<div>
						<strong class="text-white">Rep Counter:</strong>
						<span class="text-slate-300"> Automatische Wiederholungszählung mit Sprachausgabe für freihändiges Training</span>
					</div>
				</div>

				<div class="flex items-start gap-3 text-sm">
					<div class="text-xl">📝</div>
					<div>
						<strong class="text-white">Notizen:</strong>
						<span class="text-slate-300"> Hinterlasse Nachrichten an dein zukünftiges Ich (werden bei der nächsten Woche angezeigt)</span>
					</div>
				</div>

				<div class="flex items-start gap-3 text-sm">
					<div class="text-xl">🎮</div>
					<div>
						<strong class="text-white">Gamification:</strong>
						<span class="text-slate-300"> Streaks, Schutzschilder, Konfetti-Effekte und motivierende Zitate</span>
					</div>
				</div>

				<div class="flex items-start gap-3 text-sm">
					<div class="text-xl">🔥</div>
					<div>
						<strong class="text-white">Streak-System:</strong>
						<span class="text-slate-300"> Baue deine Trainings-Serie auf und verdiene Schutzschilder (1 pro 7-Tage-Streak)</span>
					</div>
				</div>

				<div class="flex items-start gap-3 text-sm">
					<div class="text-xl">🏥</div>
					<div>
						<strong class="text-white">Sick/Recovery Mode:</strong>
						<span class="text-slate-300"> Nutze Schutzschilder bei Krankheit oder wähle Recovery-Aktivitäten</span>
					</div>
				</div>

				<div class="flex items-start gap-3 text-sm">
					<div class="text-xl">📊</div>
					<div>
						<strong class="text-white">Progressive Overload:</strong>
						<span class="text-slate-300"> Automatische Gewichtsvorschläge basierend auf deiner Historie</span>
					</div>
				</div>
			</div>

			<!-- Personal Note -->
			<div class="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
				<div class="flex items-start gap-3">
					<div class="text-2xl">💡</div>
					<div>
						<h3 class="font-bold text-yellow-400 mb-1">Wichtiger Hinweis</h3>
						<p class="text-sm text-slate-300 mb-2">
							Dies ist eine <strong>private App</strong>, die auf meinen persönlichen Trainingsplan zugeschnitten ist.
						</p>
						<p class="text-sm text-slate-300">
							<strong>Gefällt dir die Idee?</strong> Forke das Projekt auf GitHub und erstelle deinen eigenen Trainingsplan!
						</p>
					</div>
				</div>
			</div>

			<!-- Links -->
			<div class="space-y-3 mb-6">
				<!-- Personal Website -->
				<div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<i data-lucide="globe" class="w-6 h-6 text-slate-400"></i>
							<div>
								<div class="text-sm font-bold text-white">Christoph Daum</div>
								<div class="text-xs text-slate-400">Entwickelt von Christoph</div>
							</div>
						</div>
						<a href="https://christoph-daum.de" target="_blank" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-bold text-white transition">
							Website
						</a>
					</div>
				</div>

				<!-- GitHub Link -->
				<div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<i data-lucide="github" class="w-6 h-6 text-slate-400"></i>
							<div>
								<div class="text-sm font-bold text-white">Open Source auf GitHub</div>
								<div class="text-xs text-slate-400">Fork it, customize it, make it yours!</div>
							</div>
						</div>
						<a href="https://github.com/apermo/bodyrefactoring" target="_blank" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-bold text-white transition">
							Zum Repo
						</a>
					</div>
				</div>
			</div>

			<!-- Close Button -->
			<button onclick="closeIntroModal()" class="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-4 rounded-xl transition shadow-lg">
				Los geht's! 🚀
			</button>
		</div>
	</div>


</div>

</body>
</html>
<?php
// Apply Tailwind class replacements from config
echo replace_tailwind_classes( ob_get_clean() );
