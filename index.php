<?php
require_once 'assets/cachebuster.php';

$version = '9.1.0';

?>
<!DOCTYPE html>
<html lang="de">
<head>
	<meta charset="UTF-8">
	<meta name="viewport"
		  content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
	<meta name="apple-mobile-web-app-capable" content="yes">
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
	<meta name="apple-mobile-web-app-title" content="BodyRefactoring">
	<link rel="apple-touch-icon" href="assets/img/gymlogo.png">
	<link rel="icon" type="image/png" href="assets/img/gymlogo.png">
	<meta name="robots" content="noindex, nofollow, noarchive">
	<title>Body Refactoring App v<?php echo $version; ?></title>

	<script src="https://cdn.tailwindcss.com"></script>
	<script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
	<link
		href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Roboto:wght@300;400;700;900&display=swap"
		rel="stylesheet">
	<script src="https://unpkg.com/lucide@latest"></script>

	<link rel="stylesheet" href="<?php echo asset( 'assets/css/styles.css' ); ?>">
	<script src="<?php echo asset( 'assets/js/app.js' ); ?>" defer></script>
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
		<h2 class="text-2xl font-black text-white mb-2 uppercase">Training Complete!</h2>
		<p id="modal-quote" class="text-slate-400 mb-6 italic">"Konsistenz schlägt Intensität."</p>
		<div class="bg-slate-800 rounded-xl p-4 mb-6 border border-slate-700">
			<div class="text-xs text-slate-500 uppercase tracking-widest">Aktuelle Streak</div>
			<div class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500"
				 id="modal-streak">0 Tage
			</div>
		</div>
		<button onclick="closeModal()"
				class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition">Weiter so!
		</button>
	</div>
</div>

<div id="splash-screen">
	<h1 class="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-4 animate-pulse">
		BODY REFACTORING</h1>
	<div class="text-slate-500 font-mono text-xs">INITIALIZING v<?php echo $version; ?>...</div>
</div>

<div class="app-container">

	<div class="flex justify-between items-center mb-6 pt-4 relative z-50">
		<div>
			<h1 class="text-xl font-black text-white uppercase leading-none">
				<span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Body</span>
				Refactoring
			</h1>
			<p class="text-slate-500 font-mono text-[10px] mt-1">v<?php echo $version; ?></p>
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
			   class="px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-3 w-full">
				<i data-lucide="github" class="w-4 h-4 flex-shrink-0"></i>
				<span class="truncate">GitHub Repo</span>
			</a>
		</div>
	</div>

	<div
		class="bg-slate-800/80 backdrop-blur-sm p-3 rounded-2xl border border-slate-700/50 flex justify-between items-center sticky top-2 z-30 shadow-lg mb-6">
		<button onclick="changeWeek(-1)" id="btn-prev" class="nav-btn w-10 h-10"><i data-lucide="chevron-left"
																					class="w-6 h-6"></i></button>
		<div class="text-center">
			<div class="text-[10px] text-slate-500 uppercase tracking-widest font-bold">WOCHE</div>
			<div id="week-display" class="font-bold text-white text-base">Aktuell</div>
		</div>
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
				<div id="rep-set-info" class="text-xl text-slate-400">Satz 1 von 3</div>
			</div>

			<!-- Big Counter Display -->
			<div class="bg-slate-800/50 rounded-3xl border-2 border-blue-500/30 p-12 mb-8">
				<div id="rep-counter-display" class="text-center">
					<div class="text-9xl font-bold rep-number-blue mb-4" id="rep-current-number">0</div>
					<div class="text-3xl text-slate-400" id="rep-total">von 12</div>
				</div>
			</div>

			<!-- Status Text -->
			<div id="rep-status-text" class="text-center text-2xl text-white mb-8">
				Bereit...
			</div>

			<!-- Abort Button -->
			<button onclick="abortRepCounter()" class="w-full bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500 text-white font-bold py-4 rounded-xl transition">
				<i data-lucide="x" class="w-6 h-6 inline mr-2"></i>
				Abbrechen
			</button>
		</div>
	</div>

</div>

</body>
</html>
