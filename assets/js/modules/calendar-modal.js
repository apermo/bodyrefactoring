/**
 * Calendar Modal
 *
 * Manages the calendar event modal UI and interactions.
 * Uses modal-state-machine for state management.
 *
 * @package BodyRefactoring
 * @since 14.2.0
 */

import { generateICS, downloadICS, calculateWorkoutDuration } from './calendar-service.js';

// Storage keys for calendar preferences
const STORAGE_KEYS = {
	TIME_PREFIX: 'calendar_time_',       // + weekday (monday, tuesday, etc.)
	ADDED_PREFIX: 'calendar_added_',      // + date (2026-01-13)
};

/**
 * Get default time for a given date.
 *
 * Weekdays (Mon-Fri): 18:00
 * Weekends (Sat-Sun): 15:00
 *
 * @param {string} date - Date in YYYY-MM-DD format.
 * @return {string} Time in HH:MM format.
 */
function getDefaultTime( date ) {
	const d = new Date( date );
	const day = d.getDay();

	// 0 = Sunday, 6 = Saturday
	if ( day === 0 || day === 6 ) {
		return '15:00'; // Weekend
	}
	return '18:00'; // Weekday
}

/**
 * Get weekday name for storage key.
 *
 * @param {string} date - Date in YYYY-MM-DD format.
 * @return {string} Weekday name (monday, tuesday, etc.).
 */
function getWeekdayName( date ) {
	const d = new Date( date );
	const days = [ 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday' ];
	return days[ d.getDay() ];
}

/**
 * Get saved time for a weekday, or default.
 *
 * @param {string} date - Date in YYYY-MM-DD format.
 * @return {string} Time in HH:MM format.
 */
export function getSavedTime( date ) {
	const weekday = getWeekdayName( date );
	const storageKey = STORAGE_KEYS.TIME_PREFIX + weekday;
	const saved = localStorage.getItem( storageKey );

	return saved || getDefaultTime( date );
}

/**
 * Save time preference for a weekday.
 *
 * @param {string} date - Date in YYYY-MM-DD format.
 * @param {string} time - Time in HH:MM format.
 * @return {void}
 */
export function saveTimePreference( date, time ) {
	const weekday = getWeekdayName( date );
	const storageKey = STORAGE_KEYS.TIME_PREFIX + weekday;
	localStorage.setItem( storageKey, time );
}

/**
 * Check if event was already added to calendar.
 *
 * @param {string} date - Date in YYYY-MM-DD format.
 * @return {boolean} True if already added.
 */
export function isEventAdded( date ) {
	const storageKey = STORAGE_KEYS.ADDED_PREFIX + date;
	return localStorage.getItem( storageKey ) === 'true';
}

/**
 * Mark event as added to calendar.
 *
 * @param {string} date - Date in YYYY-MM-DD format.
 * @return {void}
 */
export function markEventAdded( date ) {
	const storageKey = STORAGE_KEYS.ADDED_PREFIX + date;
	localStorage.setItem( storageKey, 'true' );
}

/**
 * Generate time options HTML for select element.
 *
 * Generates options from 05:00 to 23:45 in 15-minute intervals.
 *
 * @param {string} selectedTime - Currently selected time in HH:MM format.
 * @return {string} HTML options string.
 */
function generateTimeOptions( selectedTime ) {
	const options = [];

	for ( let hour = 5; hour < 24; hour++ ) {
		for ( let minute = 0; minute < 60; minute += 15 ) {
			const timeValue = `${String( hour ).padStart( 2, '0' )}:${String( minute ).padStart( 2, '0' )}`;
			const selected = timeValue === selectedTime ? 'selected' : '';
			options.push( `<option value="${timeValue}" ${selected}>${timeValue}</option>` );
		}
	}

	return options.join( '' );
}

/**
 * Show calendar modal.
 *
 * @param {Object} config - Configuration object.
 * @param {string} config.date - Date in YYYY-MM-DD format.
 * @param {string} config.dayName - Day name (e.g., "Beine & Po").
 * @param {Array} config.exercises - Array of exercise objects.
 * @param {Object|null} config.schedule - Schedule object.
 * @param {Function} config.onSuccess - Callback after successful export.
 * @return {void}
 */
export function showCalendarModal( config ) {
	const { date, dayName, exercises, schedule: _schedule, onSuccess: _onSuccess } = config;

	// Calculate duration
	const duration = calculateWorkoutDuration( exercises );

	// Get saved/default time
	const defaultTime = getSavedTime( date );

	// Check if already added
	const alreadyAdded = isEventAdded( date );
	const buttonText = alreadyAdded ? 'Im Kalender aktualisieren' : 'Zum Kalender hinzufügen';

	// Format date for display
	const dateObj = new Date( date );
	const dateDisplay = dateObj.toLocaleDateString( 'de-DE', {
		weekday: 'short',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	} );

	// Create modal HTML
	const modalHTML = `
		<div id="calendar-modal" class="fixed inset-0 bg-slate-900/95 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
			<div class="bg-slate-800 rounded-3xl border-2 border-slate-700 p-6 max-w-md w-full">
				<!-- Header -->
				<div class="text-center mb-6">
					<div class="text-4xl mb-3">📅</div>
					<h2 class="text-2xl font-bold text-white mb-2">Zum Kalender hinzufügen</h2>
					<p class="text-sm text-slate-400">${dayName}</p>
				</div>

				<!-- Date Display -->
				<div class="bg-slate-900/50 rounded-xl p-4 mb-4 border border-slate-700">
					<div class="text-xs text-slate-500 uppercase tracking-widest mb-1">Datum</div>
					<div class="text-lg font-bold text-white">${dateDisplay}</div>
				</div>

				<!-- Time Picker -->
				<div class="mb-4">
					<label class="block text-xs text-slate-500 uppercase tracking-widest mb-2">Uhrzeit</label>
					<select
						id="calendar-time-input"
						class="bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-blue-500 transition"
					>
						${generateTimeOptions( defaultTime )}
					</select>
				</div>

				<!-- Duration Picker -->
				<div class="mb-4">
					<label class="block text-xs text-slate-500 uppercase tracking-widest mb-2">Dauer</label>
					<select
						id="calendar-duration-input"
						class="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-blue-500 transition"
					>
						<option value="30" ${duration === 30 ? 'selected' : ''}>30 Minuten</option>
						<option value="45" ${duration === 45 ? 'selected' : ''}>45 Minuten</option>
						<option value="60" ${duration === 60 ? 'selected' : ''}>60 Minuten</option>
						<option value="75" ${duration === 75 ? 'selected' : ''}>75 Minuten</option>
						<option value="90" ${duration === 90 ? 'selected' : ''}>90 Minuten</option>
					</select>
				</div>

				<!-- Recurring Checkbox -->
				<div class="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
					<label class="flex items-center gap-3 cursor-pointer">
						<input
							type="checkbox"
							id="calendar-recurring-input"
							checked
							class="w-5 h-5 rounded border-2 border-blue-500 bg-slate-900 checked:bg-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition cursor-pointer"
						>
						<div class="flex-1">
							<div class="text-sm font-bold text-blue-400">Wöchentlich wiederholen</div>
							<div class="text-xs text-slate-400">Jeden ${dateObj.toLocaleDateString( 'de-DE', { weekday: 'long' } )} zur gleichen Zeit</div>
						</div>
					</label>
				</div>

				<!-- Reminder Info -->
				<div class="bg-slate-900/30 rounded-xl p-3 mb-6 border border-slate-700/50">
					<div class="flex items-center gap-2 text-xs text-slate-400">
						<i data-lucide="bell" class="w-4 h-4"></i>
						<span>Erinnerung: 15 Minuten vorher</span>
					</div>
				</div>

				<!-- Buttons -->
				<div class="space-y-3">
					<button
						id="calendar-add-btn"
						class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition"
					>
						${buttonText}
					</button>
					<button
						id="calendar-cancel-btn"
						class="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition"
					>
						Abbrechen
					</button>
				</div>
			</div>
		</div>
	`;

	// Insert modal into DOM
	document.body.insertAdjacentHTML( 'beforeend', modalHTML );

	// Initialize Lucide icons
	if ( window.lucide ) {
		window.lucide.createIcons();
	}

	// Add event listeners
	const addBtn = document.getElementById( 'calendar-add-btn' );
	const cancelBtn = document.getElementById( 'calendar-cancel-btn' );

	addBtn.addEventListener( 'click', () => handleAddToCalendar( config ) );
	cancelBtn.addEventListener( 'click', closeCalendarModal );

	// Fade in animation
	requestAnimationFrame( () => {
		const modal = document.getElementById( 'calendar-modal' );
		modal.style.opacity = '0';
		modal.style.transition = 'opacity 0.3s';
		requestAnimationFrame( () => {
			modal.style.opacity = '1';
		} );
	} );
}

/**
 * Handle "Add to Calendar" button click.
 *
 * @param {Object} config - Original configuration object.
 * @return {void}
 */
function handleAddToCalendar( config ) {
	const { date, dayName, exercises, schedule, onSuccess } = config;

	// Get values from inputs
	const time = document.getElementById( 'calendar-time-input' ).value;
	const duration = parseInt( document.getElementById( 'calendar-duration-input' ).value, 10 );
	const recurring = document.getElementById( 'calendar-recurring-input' ).checked;

	// Save time preference
	saveTimePreference( date, time );

	// Generate .ics file
	const icsContent = generateICS( {
		date,
		time,
		duration,
		exercises,
		dayName,
		reminderMinutes: 15,
		recurring,
		schedule,
	} );

	// Download .ics file
	const filename = `workout-${date}.ics`;
	downloadICS( icsContent, filename );

	// Mark as added
	markEventAdded( date );

	// Close modal
	closeCalendarModal();

	// Call success callback
	if ( onSuccess && typeof onSuccess === 'function' ) {
		onSuccess();
	}

	console.log( '[CalendarModal] Event exported:', { date, time, duration, recurring } );
}

/**
 * Close calendar modal.
 *
 * @return {void}
 */
export function closeCalendarModal() {
	const modal = document.getElementById( 'calendar-modal' );
	if ( !modal ) {
		return;
	}

	// Fade out animation
	modal.style.opacity = '0';
	setTimeout( () => {
		modal.remove();
	}, 300 );
}

