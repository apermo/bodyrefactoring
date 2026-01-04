/**
 * Service Worker for Body Refactoring PWA
 *
 * Handles:
 * - Offline caching
 * - Push notifications
 * - Background sync
 *
 * @package BodyRefactoring
 * @version 11.0.0
 */

// Cache version will be set dynamically on install
let CACHE_VERSION = 'bodyrefactoring';
const CACHE_ASSETS = [
	'/',
	'/index.php',
	'/assets/css/styles.css',
	'/assets/js/app.js',
	'/assets/js/push-notifications.js',
	'/gymlogo.png',
	'/manifest.json'
];

// Install Event - Cache assets
self.addEventListener('install', (event) => {
	console.log('[Service Worker] Installing...');

	event.waitUntil(
		// First, fetch current version
		fetch('/assets/js/sw-version.php')
			.then(response => response.json())
			.then(data => {
				CACHE_VERSION = data.cacheVersion;
				console.log('[Service Worker] Cache version:', CACHE_VERSION);
				return caches.open(CACHE_VERSION);
			})
			.catch(() => {
				// Fallback if version fetch fails
				console.warn('[Service Worker] Could not fetch version, using default');
				return caches.open(CACHE_VERSION);
			})
			.then((cache) => {
				console.log('[Service Worker] Caching assets');
				return cache.addAll(CACHE_ASSETS);
			})
			.then(() => {
				console.log('[Service Worker] Installation complete');
				return self.skipWaiting(); // Activate immediately
			})
	);
});

// Activate Event - Clean old caches
self.addEventListener('activate', (event) => {
	console.log('[Service Worker] Activating...');

	event.waitUntil(
		// Fetch current version first
		fetch('/assets/js/sw-version.php')
			.then(response => response.json())
			.then(data => {
				CACHE_VERSION = data.cacheVersion;
				return caches.keys();
			})
			.catch(() => {
				// Fallback if version fetch fails
				return caches.keys();
			})
			.then((cacheNames) => {
				return Promise.all(
					cacheNames.map((cacheName) => {
						if (cacheName !== CACHE_VERSION) {
							console.log('[Service Worker] Deleting old cache:', cacheName);
							return caches.delete(cacheName);
						}
					})
				);
			})
			.then(() => {
				console.log('[Service Worker] Activation complete, using cache:', CACHE_VERSION);
				return self.clients.claim(); // Take control of all pages
			})
	);
});

// Fetch Event - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
	event.respondWith(
		fetch(event.request)
			.then((response) => {
				// Clone response to cache
				const responseClone = response.clone();
				caches.open(CACHE_VERSION).then((cache) => {
					cache.put(event.request, responseClone);
				});
				return response;
			})
			.catch(() => {
				// Network failed, try cache
				return caches.match(event.request);
			})
	);
});

// Push Event - Handle push notifications
self.addEventListener('push', (event) => {
	console.log('[Service Worker] Push received');

	let data = {
		title: '🏋️ Body Refactoring',
		body: 'Neue Benachrichtigung',
		icon: '/gymlogo.png',
		badge: '/badge.png'
	};

	if (event.data) {
		try {
			data = event.data.json();
		} catch (e) {
			data.body = event.data.text();
		}
	}

	event.waitUntil(
		self.registration.showNotification(data.title, {
			body: data.body,
			icon: data.icon || '/gymlogo.png',
			badge: data.badge || '/badge.png',
			tag: data.tag || 'workout-notification',
			requireInteraction: false,
			vibrate: [200, 100, 200],
			data: data.data || {}
		})
	);
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
	console.log('[Service Worker] Notification clicked');
	event.notification.close();

	// Open app or focus existing window
	event.waitUntil(
		clients.matchAll({type: 'window', includeUncontrolled: true}).then((clientList) => {
			// Check if app is already open
			for (let client of clientList) {
				if (client.url.includes(self.location.origin) && 'focus' in client) {
					return client.focus();
				}
			}

			// Open new window
			if (clients.openWindow) {
				return clients.openWindow('/');
			}
		})
	);
});

// Periodic Background Sync (wenn unterstützt)
self.addEventListener('periodicsync', (event) => {
	console.log('[Service Worker] Periodic sync:', event.tag);

	if (event.tag === 'workout-reminder') {
		event.waitUntil(checkAndSendReminder());
	}
});

/**
 * Check if workout reminder should be sent
 *
 * @return {Promise<void>}
 */
async function checkAndSendReminder() {
	try {
		// Get notification settings from IndexedDB or fetch from API
		const settings = await getNotificationSettings();

		if (!settings.enabled) {
			return;
		}

		const now = new Date();
		const currentTime = now.getHours() * 60 + now.getMinutes();
		const currentDay = now.getDay();

		// Check if it's workout time
		for (const scheduledTime of settings.times) {
			if (isTimeForReminder(currentTime, scheduledTime)) {
				await sendWorkoutReminder(currentDay);
				break;
			}
		}
	} catch (error) {
		console.error('[Service Worker] Error checking reminder:', error);
	}
}

/**
 * Check if current time matches scheduled time
 *
 * @param {number} currentTime - Current time in minutes since midnight
 * @param {number} scheduledTime - Scheduled time in minutes since midnight
 * @return {boolean}
 */
function isTimeForReminder(currentTime, scheduledTime) {
	// Within 5-minute window
	return Math.abs(currentTime - scheduledTime) < 5;
}

/**
 * Send workout reminder notification
 *
 * @param {number} dayOfWeek - Day of week (0 = Sunday)
 * @return {Promise<void>}
 */
async function sendWorkoutReminder(dayOfWeek) {
	const workoutNames = {
		0: 'Ruhetag',
		1: 'Ganzkörper Kraft',
		2: 'Active Office (NEAT)',
		3: 'Ganzkörper Kraft',
		4: 'Active Recovery',
		5: 'Boxen',
		6: 'Natur / Cardio'
	};

	const workoutName = workoutNames[dayOfWeek] || 'Training';

	await self.registration.showNotification('🏋️ Trainingszeit!', {
		body: `Heute steht ${workoutName} an. Bereit?`,
		icon: '/gymlogo.png',
		badge: '/badge.png',
		tag: 'workout-reminder',
		requireInteraction: true,
		vibrate: [200, 100, 200, 100, 200],
		actions: [
			{action: 'start', title: '💪 Jetzt starten'},
			{action: 'snooze', title: '⏰ Später (30 Min)'}
		],
		data: {
			type: 'workout-reminder',
			day: dayOfWeek
		}
	});
}

/**
 * Get notification settings
 *
 * @return {Promise<Object>}
 */
async function getNotificationSettings() {
	// Try to get from IndexedDB or default settings
	return {
		enabled: true,
		times: [18 * 60] // 18:00 default
	};
}

// Message Event - Communication with main app
self.addEventListener('message', (event) => {
	console.log('[Service Worker] Message received:', event.data);

	if (event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}

	if (event.data.type === 'CHECK_REMINDER') {
		checkAndSendReminder();
	}
});

