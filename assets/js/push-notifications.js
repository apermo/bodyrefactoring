/**
 * Push Notification Manager for Body Refactoring
 *
 * Handles:
 * - Service Worker registration
 * - Push notification permissions
 * - Workout reminders
 * - PWA installation
 *
 * @package BodyRefactoring
 * @version 11.0.0
 */

class PushNotificationManager {
	constructor() {
		this.swRegistration = null;
		this.isSupported = false;
		this.isPWA = false;
		this.init();
	}

	/**
	 * Initialize notification manager
	 *
	 * @return {void}
	 */
	init() {
		// Check if running as PWA
		this.isPWA = window.matchMedia('(display-mode: standalone)').matches ||
		             window.navigator.standalone === true;

		// Check browser support
		this.isSupported = 'serviceWorker' in navigator && 'Notification' in window;

		if (!this.isSupported) {
			console.warn('Push notifications not supported');
			return;
		}

		// Register service worker
		this.registerServiceWorker();

		// Setup event listeners
		this.setupEventListeners();

		console.log('Push Notification Manager initialized', {
			isPWA: this.isPWA,
			isSupported: this.isSupported
		});
	}

	/**
	 * Register service worker
	 *
	 * @return {Promise<void>}
	 */
	async registerServiceWorker() {
		try {
			this.swRegistration = await navigator.serviceWorker.register('/assets/js/sw.js', {
				scope: '/'
			});

			console.log('Service Worker registered:', this.swRegistration);

			// Check for updates
			this.swRegistration.addEventListener('updatefound', () => {
				console.log('Service Worker update found');
				const newWorker = this.swRegistration.installing;

				newWorker.addEventListener('statechange', () => {
					if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
						// New service worker available
						this.showUpdateNotification();
					}
				});
			});

			// Handle controller change
			navigator.serviceWorker.addEventListener('controllerchange', () => {
				console.log('Service Worker controller changed, reloading...');
				window.location.reload();
			});

			return this.swRegistration;
		} catch (error) {
			console.error('Service Worker registration failed:', error);
		}
	}

	/**
	 * Setup event listeners
	 *
	 * @return {void}
	 */
	setupEventListeners() {
		// Listen for focus to check reminders
		window.addEventListener('focus', () => {
			if (this.swRegistration) {
				this.swRegistration.active?.postMessage({
					type: 'CHECK_REMINDER'
				});
			}
		});

		// Check reminders every minute when app is open
		setInterval(() => {
			this.checkWorkoutTime();
		}, 60 * 1000); // Changed from 5 minutes to 1 minute

		// Initial check
		this.checkWorkoutTime();
	}

	/**
	 * Request notification permission
	 *
	 * @return {Promise<string>} Permission status
	 */
	async requestPermission() {
		if (!this.isSupported) {
			return 'denied';
		}

		try {
			const permission = await Notification.requestPermission();
			console.log('Notification permission:', permission);

			if (permission === 'granted') {
				this.saveSettings({ enabled: true });

				// Send test notification
				this.sendTestNotification();
			}

			return permission;
		} catch (error) {
			console.error('Error requesting permission:', error);
			return 'denied';
		}
	}

	/**
	 * Check current permission status
	 *
	 * @return {string} Permission status
	 */
	getPermissionStatus() {
		if (!this.isSupported) {
			return 'not-supported';
		}

		return Notification.permission;
	}

	/**
	 * Send test notification
	 *
	 * @return {void}
	 */
	sendTestNotification() {
		if (Notification.permission !== 'granted') {
			return;
		}

		new Notification('🏋️ Benachrichtigungen aktiviert!', {
			body: 'Du erhältst jetzt Workout-Erinnerungen',
			icon: '/gymlogo.png',
			badge: '/badge.png',
			tag: 'test-notification',
			vibrate: [200, 100, 200]
		});
	}

	/**
	 * Check if it's workout time and send reminder
	 *
	 * @return {void}
	 */
	checkWorkoutTime() {
		const settings = this.getSettings();

		console.log('[Push] Checking workout time...', {
			enabled: settings.enabled,
			permission: Notification.permission,
			times: settings.times
		});

		if (!settings.enabled || Notification.permission !== 'granted') {
			console.log('[Push] Check skipped - not enabled or no permission');
			return;
		}

		const now = new Date();
		const currentTime = now.getHours() * 60 + now.getMinutes();
		const lastCheck = localStorage.getItem('last_reminder_check');
		const today = now.toDateString();

		console.log('[Push] Current time:', {
			time: `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`,
			minutes: currentTime,
			today: today,
			lastCheck: lastCheck
		});

		// Check each scheduled time
		for (const scheduledTime of settings.times) {
			const isTime = this.isTimeForReminder(currentTime, scheduledTime);
			const alreadySent = lastCheck === `${today}-${scheduledTime}`;

			console.log('[Push] Checking scheduled time:', {
				scheduledTime: scheduledTime,
				scheduledTimeFormatted: this.formatTimeFromMinutes(scheduledTime),
				currentTime: currentTime,
				isTimeForReminder: isTime,
				alreadySentToday: alreadySent
			});

			if (isTime && !alreadySent) {
				console.log('[Push] ✅ Sending workout reminder NOW!');
				this.sendWorkoutReminder();
				localStorage.setItem('last_reminder_check', `${today}-${scheduledTime}`);
				break;
			}
		}
	}

	/**
	 * Format minutes since midnight to HH:MM string
	 *
	 * @param {number} minutes - Minutes since midnight
	 * @return {string} Formatted time
	 */
	formatTimeFromMinutes(minutes) {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
	}

	/**
	 * Check if current time matches scheduled time
	 *
	 * @param {number} currentTime - Current time in minutes
	 * @param {number} scheduledTime - Scheduled time in minutes
	 * @return {boolean}
	 */
	isTimeForReminder(currentTime, scheduledTime) {
		// Within 10-minute window (before or after scheduled time)
		// This ensures we don't miss reminders if check interval is 5 minutes
		const timeDiff = currentTime - scheduledTime;
		return timeDiff >= 0 && timeDiff <= 10;
	}

	/**
	 * Send workout reminder notification
	 *
	 * @return {void}
	 */
	sendWorkoutReminder() {
		const workoutName = this.getTodaysWorkout();

		if (this.swRegistration && this.swRegistration.active) {
			// Use Service Worker notification (better for PWA)
			this.swRegistration.showNotification('🏋️ Trainingszeit!', {
				body: `Heute steht ${workoutName} an. Bereit?`,
				icon: '/gymlogo.png',
				badge: '/badge.png',
				tag: 'workout-reminder',
				requireInteraction: true,
				vibrate: [200, 100, 200, 100, 200],
				data: {
					type: 'workout-reminder',
					url: '/'
				}
			});
		} else {
			// Fallback to regular notification
			new Notification('🏋️ Trainingszeit!', {
				body: `Heute steht ${workoutName} an. Bereit?`,
				icon: '/gymlogo.png',
				badge: '/badge.png',
				tag: 'workout-reminder',
				requireInteraction: true,
				vibrate: [200, 100, 200, 100, 200]
			});
		}

		// Show in-app banner as well
		this.showInAppReminder(workoutName);
	}

	/**
	 * Show in-app reminder banner
	 *
	 * @param {string} workoutName - Name of workout
	 * @return {void}
	 */
	showInAppReminder(workoutName) {
		// Remove existing banner
		const existingBanner = document.querySelector('.workout-reminder-banner');
		if (existingBanner) {
			existingBanner.remove();
		}

		const banner = document.createElement('div');
		banner.className = 'workout-reminder-banner';
		banner.innerHTML = `
			<div class="flex items-center justify-between p-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl shadow-2xl">
				<div class="flex items-center gap-3">
					<div class="text-3xl">🏋️</div>
					<div>
						<div class="font-bold text-white text-lg">Trainingszeit!</div>
						<div class="text-sm text-white/90">${workoutName}</div>
					</div>
				</div>
				<button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-white/80 transition">
					<i data-lucide="x" class="w-6 h-6"></i>
				</button>
			</div>
		`;

		document.body.appendChild(banner);

		// Auto-remove after 10 seconds
		setTimeout(() => banner.remove(), 10000);

		// Re-render lucide icons
		if (typeof lucide !== 'undefined') {
			lucide.createIcons();
		}

		// Vibrate
		if (navigator.vibrate) {
			navigator.vibrate([200, 100, 200, 100, 200]);
		}
	}

	/**
	 * Get today's workout name
	 *
	 * @return {string}
	 */
	getTodaysWorkout() {
		const today = new Date().getDay();
		const schedules = {
			0: 'Ruhetag - Mobility & Spaziergang',
			1: 'Ganzkörper Kraft',
			2: 'Active Office (NEAT)',
			3: 'Ganzkörper Kraft',
			4: 'Active Recovery',
			5: 'Boxen',
			6: 'Natur / Cardio'
		};

		return schedules[today] || 'Training';
	}

	/**
	 * Get notification settings
	 *
	 * @return {Object}
	 */
	getSettings() {
		const stored = localStorage.getItem('notification_settings');
		const defaults = {
			enabled: false,
			times: [18 * 60], // 18:00 default
			days: [1, 2, 3, 4, 5, 6] // Monday - Saturday
		};

		return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
	}

	/**
	 * Save notification settings
	 *
	 * @param {Object} settings - Settings to save
	 * @return {void}
	 */
	saveSettings(settings) {
		const current = this.getSettings();
		const updated = { ...current, ...settings };
		localStorage.setItem('notification_settings', JSON.stringify(updated));
	}

	/**
	 * Show update notification when new service worker available
	 *
	 * @return {void}
	 */
	showUpdateNotification() {
		const banner = document.createElement('div');
		banner.className = 'update-banner';
		banner.innerHTML = `
			<div class="flex items-center justify-between p-4 bg-blue-600 text-white shadow-2xl">
				<div>
					<div class="font-bold">Update verfügbar!</div>
					<div class="text-sm">Eine neue Version ist bereit zur Installation</div>
				</div>
				<button onclick="pushNotificationManager.updateServiceWorker()" class="bg-white text-blue-600 px-4 py-2 rounded font-bold hover:bg-blue-50 transition">
					Aktualisieren
				</button>
			</div>
		`;

		document.body.appendChild(banner);
	}

	/**
	 * Update service worker
	 *
	 * @return {void}
	 */
	updateServiceWorker() {
		if (this.swRegistration && this.swRegistration.waiting) {
			this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
		}
	}

	/**
	 * Check if running as PWA
	 *
	 * @return {boolean}
	 */
	isPWAInstalled() {
		return this.isPWA;
	}

	/**
	 * Show PWA install prompt
	 *
	 * @return {void}
	 */
	showPWAInstallPrompt() {
		// This requires beforeinstallprompt event
		// Will be implemented in main app initialization
	}
}

// Global instance
const pushNotificationManager = new PushNotificationManager();

/**
 * Toggle notifications (called from UI)
 *
 * @return {Promise<void>}
 */
async function toggleNotifications() {
	const currentPermission = pushNotificationManager.getPermissionStatus();

	if (currentPermission === 'default') {
		// Request permission
		const permission = await pushNotificationManager.requestPermission();

		if (permission === 'granted') {
			showNotificationSettings();
		}
	} else if (currentPermission === 'granted') {
		// Open settings
		showNotificationSettings();
	} else {
		// Show help for enabling notifications
		alert('Benachrichtigungen wurden blockiert. Bitte aktiviere sie in den Browser-Einstellungen.');
	}
}

/**
 * Show notification settings modal
 *
 * @return {void}
 */
function showNotificationSettings() {
	const settings = pushNotificationManager.getSettings();
	const permission = pushNotificationManager.getPermissionStatus();
	const now = new Date();
	const currentMinutes = now.getHours() * 60 + now.getMinutes();

	// Calculate next reminder time
	let nextReminderText = 'Keine geplant';
	if (settings.enabled && settings.times.length > 0) {
		const scheduledTime = settings.times[0];
		const timeUntil = scheduledTime - currentMinutes;

		if (timeUntil > 0) {
			const hours = Math.floor(timeUntil / 60);
			const mins = timeUntil % 60;
			nextReminderText = `In ${hours}h ${mins}min`;
		} else {
			nextReminderText = `Morgen um ${formatTime(scheduledTime)}`;
		}
	}

	// Create modal (will be styled properly)
	const modal = document.createElement('div');
	modal.id = 'notification-settings-modal';
	modal.className = 'fixed inset-0 bg-slate-900/95 backdrop-blur-sm z-[100] flex items-center justify-center p-4';
	modal.innerHTML = `
		<div class="bg-slate-800 rounded-2xl border border-slate-700 p-6 max-w-md w-full">
			<div class="flex items-center justify-between mb-6">
				<h2 class="text-xl font-bold text-white">Benachrichtigungen</h2>
				<button onclick="closeNotificationSettings()" class="text-slate-400 hover:text-white">
					<i data-lucide="x" class="w-6 h-6"></i>
				</button>
			</div>

			<!-- Debug Info -->
			<div class="mb-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
				<div class="text-xs text-slate-400 space-y-1">
					<div class="flex justify-between">
						<span>Status:</span>
						<span class="font-mono ${permission === 'granted' ? 'text-green-400' : 'text-red-400'}">${permission}</span>
					</div>
					<div class="flex justify-between">
						<span>Aktuelle Zeit:</span>
						<span class="font-mono text-cyan-400">${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}</span>
					</div>
					<div class="flex justify-between">
						<span>Nächste Erinnerung:</span>
						<span class="font-mono text-blue-400">${nextReminderText}</span>
					</div>
					<div class="flex justify-between">
						<span>Check-Intervall:</span>
						<span class="font-mono text-slate-300">1 Minute</span>
					</div>
				</div>
			</div>

			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<div>
						<div class="font-medium text-white">Erinnerungen aktivieren</div>
						<div class="text-sm text-slate-400">Benachrichtigungen zur Trainingszeit</div>
					</div>
					<label class="relative inline-flex items-center cursor-pointer">
						<input type="checkbox" ${settings.enabled ? 'checked' : ''} onchange="updateNotificationEnabled(this)" class="sr-only peer">
						<div class="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
					</label>
				</div>

				<div>
					<label class="block text-sm font-medium text-slate-300 mb-2">Erinnerungszeit</label>
					<input type="time" value="${formatTime(settings.times[0])}" onchange="updateNotificationTime(this)" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white">
					<div class="text-xs text-slate-500 mt-1">Zeitfenster: 10 Minuten nach eingestellter Zeit</div>
				</div>

				<div class="pt-4 border-t border-slate-700">
					<button onclick="pushNotificationManager.sendWorkoutReminder()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition">
						Test-Benachrichtigung senden
					</button>
				</div>

				<div class="pt-2">
					<button onclick="testImmediateReminder()" class="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition text-sm">
						🧪 Debug: Erinnerung in 1 Minute
					</button>
				</div>

				${!pushNotificationManager.isPWAInstalled() ? `
					<div class="pt-4 border-t border-slate-700 bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
						<div class="text-cyan-400 font-medium mb-2">💡 Tipp: Als App installieren</div>
						<div class="text-sm text-slate-300 mb-3">
							Installiere Body Refactoring als App für bessere Benachrichtigungen und Offline-Support
						</div>
						<button onclick="showPWAInstructions()" class="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 rounded-lg transition text-sm">
							Anleitung anzeigen
						</button>
					</div>
				` : ''}
			</div>
		</div>
	`;

	document.body.appendChild(modal);

	// Re-render lucide icons
	if (typeof lucide !== 'undefined') {
		lucide.createIcons();
	}
}

/**
 * Format time from minutes to HH:MM
 *
 * @param {number} minutes - Minutes since midnight
 * @return {string}
 */
function formatTime(minutes) {
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Close notification settings modal
 *
 * @return {void}
 */
function closeNotificationSettings() {
	const modal = document.getElementById('notification-settings-modal');
	if (modal) {
		modal.remove();
	}
}

/**
 * Update notification enabled status
 *
 * @param {HTMLInputElement} checkbox - Checkbox element
 * @return {void}
 */
function updateNotificationEnabled(checkbox) {
	pushNotificationManager.saveSettings({
		enabled: checkbox.checked
	});
}

/**
 * Update notification time
 *
 * @param {HTMLInputElement} input - Time input element
 * @return {void}
 */
function updateNotificationTime(input) {
	const [hours, minutes] = input.value.split(':').map(Number);
	const totalMinutes = hours * 60 + minutes;

	pushNotificationManager.saveSettings({
		times: [totalMinutes]
	});

	console.log('[Push] Time updated to:', input.value, '(' + totalMinutes + ' minutes)');
}

/**
 * Test immediate reminder (1 minute from now)
 *
 * @return {void}
 */
function testImmediateReminder() {
	const now = new Date();
	const testTime = (now.getHours() * 60 + now.getMinutes() + 1); // 1 minute from now

	// Temporarily save as reminder time
	const originalSettings = pushNotificationManager.getSettings();
	pushNotificationManager.saveSettings({
		enabled: true,
		times: [testTime]
	});

	const testTimeFormatted = formatTime(testTime);
	console.log('[Push] 🧪 DEBUG: Reminder set for', testTimeFormatted, '(in ~1 minute)');
	console.log('[Push] Original time will be restored after test');

	alert(`🧪 Debug-Modus:\n\nErinnerung gesetzt für ${testTimeFormatted}\n(in ~1 Minute)\n\nÖffne die Konsole für Details.\n\nOriginalzeit wird nach Test wiederhergestellt.`);

	// Restore original time after 2 minutes
	setTimeout(() => {
		pushNotificationManager.saveSettings(originalSettings);
		console.log('[Push] Original reminder time restored');
	}, 2 * 60 * 1000);
}

/**
 * Show PWA installation instructions
 *
 * @return {void}
 */
function showPWAInstructions() {
	const modal = document.createElement('div');
	modal.className = 'fixed inset-0 bg-slate-900/95 backdrop-blur-sm z-[101] flex items-center justify-center p-4';
	modal.innerHTML = `
		<div class="bg-slate-800 rounded-2xl border border-slate-700 p-6 max-w-md w-full">
			<div class="flex items-center justify-between mb-6">
				<h2 class="text-xl font-bold text-white">App Installation</h2>
				<button onclick="this.parentElement.parentElement.parentElement.remove()" class="text-slate-400 hover:text-white">
					<i data-lucide="x" class="w-6 h-6"></i>
				</button>
			</div>

			<div class="space-y-4 text-slate-300">
				<div class="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
					<div class="font-bold text-cyan-400 mb-2">📱 iOS Safari</div>
					<ol class="list-decimal list-inside space-y-2 text-sm">
						<li>Tippe auf den Teilen-Button <i data-lucide="share" class="w-4 h-4 inline"></i></li>
						<li>Scrolle nach unten und wähle "Zum Home-Bildschirm"</li>
						<li>Tippe auf "Hinzufügen"</li>
						<li>Öffne die App vom Home-Bildschirm</li>
					</ol>
				</div>

				<div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
					<div class="font-bold text-blue-400 mb-2">🌐 Chrome Desktop</div>
					<ol class="list-decimal list-inside space-y-2 text-sm">
						<li>Klicke auf das Install-Icon in der Adressleiste</li>
						<li>Oder: Menü → "App installieren"</li>
						<li>Bestätige die Installation</li>
					</ol>
				</div>

				<div class="text-sm text-slate-400 italic">
					Nach der Installation funktionieren Benachrichtigungen auch wenn der Browser geschlossen ist!
				</div>
			</div>
		</div>
	`;

	document.body.appendChild(modal);

	// Re-render lucide icons
	if (typeof lucide !== 'undefined') {
		lucide.createIcons();
	}
}

