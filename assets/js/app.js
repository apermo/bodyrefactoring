/**
 * Body Refactoring App - Main JavaScript
 *
 * @package BodyRefactoring
 * @version 13.0.0
 */

// --- MODULE IMPORTS ---
import {
	STORAGE_KEYS,
	CONFIG,
	APP_STATES,
	QUOTES,
	RECOVERY_ACTIVITIES
} from './modules/constants.js';

import { AppStateMachine } from './modules/app-state-machine.js';
import { TimerStateMachine, RepCounterStateMachine } from './modules/timer-state-machine.js';
import { ModalStateMachine } from './modules/modal-state-machine.js';
import { StorageService } from './modules/storage-service.js';
import { DomainStorageService } from './modules/domain-storage-service.js';
import { StateManager } from './modules/state-manager.js';
import { SpeechService } from './modules/speech-service.js';
import { TimerCoordinator } from './modules/timer-coordinator.js';
import { getLocalISODate, getToday, scrollToElement } from './modules/utils.js';
import { checkAndShowIntroModal, closeIntroModal } from './intro-modal.js';

// --- STATE MACHINES & SERVICES ---
const appStateMachine = new AppStateMachine();
const timerStateMachine = new TimerStateMachine();
const repCounterStateMachine = new RepCounterStateMachine();
const modalStateMachine = new ModalStateMachine();
const storage = new StorageService();
const domainStorage = new DomainStorageService(storage);
const stateManager = new StateManager();
const speech = new SpeechService();
const timerCoordinator = new TimerCoordinator();

// Debug mode - removes day editing restrictions
const DEBUG_MODE = CONFIG.DEBUG_MODE;

// Legacy constants (to be replaced with STORAGE_KEYS and storage service)
const STORAGE_PREFIX = STORAGE_KEYS.PREFIX;
const NOTE_PREFIX = STORAGE_KEYS.NOTE_PREFIX;
const WEIGHT_PREFIX = STORAGE_KEYS.WEIGHT_PREFIX;
const UNIT_PREFIX = STORAGE_KEYS.UNIT_PREFIX;
const SICK_PREFIX = STORAGE_KEYS.SICK_PREFIX;
const RECOVERY_PREFIX = STORAGE_KEYS.RECOVERY_PREFIX;
const SHIELDS_KEY = STORAGE_KEYS.SHIELDS;
const SHIELDS_AWARDED_KEY = STORAGE_KEYS.SHIELDS_AWARDED;
const MAX_SHIELDS = CONFIG.MAX_SHIELDS;

// Use imported constants
const quotes = QUOTES;
const recoveryActivities = RECOVERY_ACTIVITIES;

// --- GLOBAL STATE ---
let currentWeekOffset = 0;

// Global State for Dynamic Scheduling
const state = {
	availableSchedules: [], // List of { date: 'YYYY-MM-DD', file: '...' }
	scheduleCache: {},      // Cache content of JSON files
	startDate: null         // Derived from first schedule
};

// Timer State
let timerInterval = null;
let isRunning = false;
let timeLeft = 0;
let currentTimerLabel = '';


// --- INIT & DATA FETCHING ---

/**
 * Initialize the application.
 *
 * Fetches available training schedules from the backend, sets up the start date,
 * renders the initial schedule view, and handles the splash screen animation.
 *
 * @async
 * @return {Promise<void>} Resolves when initialization is complete.
 */
async function initApp() {
	// Show debug indicator if in debug mode
	if (DEBUG_MODE) {
		const debugIndicator = document.getElementById('debug-indicator');
		if (debugIndicator) {
			debugIndicator.classList.remove('hidden');
		}
		console.log('🐛 DEBUG MODE ACTIVE - All day restrictions removed');

		// Add state machine logging in debug mode
		appStateMachine.onChange(({from, to, data}) => {
			console.log(`[AppState] ${from} → ${to}`, data);
		});

		timerStateMachine.onChange(({from, to, data}) => {
			console.log(`[TimerState] ${from} → ${to}`, data);
		});

		repCounterStateMachine.onChange(({from, to, data}) => {
			console.log(`[RepCounterState] ${from} → ${to}`, data);
		});

		modalStateMachine.onChange(({from, to, data}) => {
			console.log(`[ModalState] ${from} → ${to}`, data);
		});
	}

	try {
		const response = await fetch('trainings/index.php');
		if (!response.ok) {
			throw new Error('API Error');
		}

		state.availableSchedules = await response.json();

	if (state.availableSchedules.length > 0) {
		state.startDate = new Date(state.availableSchedules[0].date + 'T00:00:00');
		await renderSchedule(); // Initial render
		updateShieldDisplay(); // Initialize shields display
		updateDebugToggleButton(); // Update debug toggle button text

		// Transition app state from INITIALIZING to SCHEDULE_VIEW
		appStateMachine.transition(APP_STATES.SCHEDULE_VIEW, { action: 'app_ready' });

		setTimeout(() => {
			document.getElementById('splash-screen').style.opacity = '0';
		}, 800);
		setTimeout(() => {
			document.getElementById('splash-screen').style.display = 'none';
		}, 1300);

		// Show introduction modal on first visit
		checkAndShowIntroModal( domainStorage );
	} else {
		alert('Keine Trainingspläne gefunden.');
	}
} catch (e) {
	console.error(e);
	alert('Fehler beim Laden der Trainingspläne. Webserver erforderlich!');
}
}


/**
 * Fetch the schedule configuration for a specific date.
 *
 * Finds the most recent schedule that applies to the given date and returns
 * the days array. Implements caching to avoid repeated fetches. Validates
 * schema version and extracts the days array from the versioned structure.
 *
 * @async
 * @param {string} dateStr - ISO date string (YYYY-MM-DD).
 * @return {Promise<Array|null>} Array of day configurations or null if not found.
 */
async function fetchScheduleForDate(dateStr) {
	// Logic: Find latest schedule where schedule.date <= dateStr
	// Schedules are sorted asc by date from backend
	let bestMatch = null;
	for (const sched of state.availableSchedules) {
		if (sched.date <= dateStr) {
			bestMatch = sched;
		} else {
			break;
		}
	}

	if (!bestMatch) {
		return null; // Should not happen if date >= startDate
	}

	// Check Cache
	if (state.scheduleCache[bestMatch.file]) {
		return state.scheduleCache[bestMatch.file];
	}

	// Fetch
	const res = await fetch(`trainings/${bestMatch.file}`);
	const json = await res.json();

	// Handle new structure: { version: 1, days: [...] }
	// Extract the days array and validate version
	if (json.version !== 1) {
		console.error(`Unsupported schedule version: ${json.version}`);
		return null;
	}

	// Cache the days array (not the wrapper object)
	state.scheduleCache[bestMatch.file] = json.days;
	return json.days;
}

// --- CORE FUNCTIONS ---


/**
 * Compute the schedule for the current week being displayed.
 *
 * Generates 7 day objects (Monday-Sunday) for the displayed week, fetching
 * the appropriate schedule configuration for each day. Handles locked days,
 * today highlighting, and schedule transitions mid-week.
 *
 * @async
 * @return {Promise<Array>} Array of 7 day objects with computed properties.
 */
async function getComputedSchedule() {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const currentDayIndex = today.getDay();
	const distanceToMonday = (currentDayIndex + 6) % 7;

	const thisWeekMonday = new Date(today);
	thisWeekMonday.setDate(today.getDate() - distanceToMonday);

	const displayedMonday = new Date(thisWeekMonday);
	displayedMonday.setDate(thisWeekMonday.getDate() + (currentWeekOffset * 7));

	// Generate 7 day objects async
	const daysPromise = Array.from({length: 7}, async (_, idx) => {
		const targetDate = new Date(displayedMonday);
		targetDate.setDate(displayedMonday.getDate() + idx);
		targetDate.setHours(0, 0, 0, 0);

		const isoDate = getLocalISODate(targetDate);
		const currentYear = new Date().getFullYear();
		let dateOptions = {day: '2-digit', month: '2-digit'};
		if (targetDate.getFullYear() !== currentYear) {
			dateOptions.year = 'numeric';
		}
		const dateStr = targetDate.toLocaleDateString('de-DE', dateOptions);

		// Fetch Config for this specific day
		// (This allows mid-week schedule changes!)
		const scheduleConfig = await fetchScheduleForDate(isoDate);

		// Find correct day in config (Mon=1 ... Sun=0)
		// Note: getDay() returns 0 for Sun, 1 for Mon
		const targetDayIndex = targetDate.getDay();

		let dayData = null;
		if (scheduleConfig) {
			dayData = scheduleConfig.find(d => d.dayIndex === targetDayIndex);
		}

		// If no data found (e.g. before start date), return dummy or null
		if (!dayData) {
			return {
				id: 'invalid',
				name: '---',
				theme: '',
				details: [],
				displayDate: dateStr,
				storageDate: isoDate,
				fullDateObj: targetDate,
				isRealToday: false,
				isLocked: true
			};
		}

		const diffTime = today - targetDate;
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
		let isLocked = DEBUG_MODE ? false : (targetDate > today || diffDays > 3);
		const isRealToday = getLocalISODate(today) === isoDate;

		// Merge static config with calculated props
		return {
			...dayData,
			displayDate: dateStr,
			storageDate: isoDate,
			fullDateObj: targetDate,
			isRealToday: isRealToday,
			isLocked: isLocked
		};
	});

	return Promise.all(daysPromise);
}

/**
 * Render the schedule view in the DOM.
 *
 * Fetches the computed schedule, generates HTML for each day card with exercises,
 * handles accordion state, completion status, and auto-scrolls to today's card.
 * Also updates week navigation and calculates streak.
 *
 * @async
 * @return {Promise<void>} Resolves when rendering is complete.
 */
async function renderSchedule() {
	const container = document.getElementById('schedule-container');

	const computedSchedule = await getComputedSchedule();
	container.innerHTML = ''; // Clear now

	// Nav Logic
	const btnPrev = document.getElementById('btn-prev');
	const btnToday = document.getElementById('btn-today');
	const weekDisplay = document.getElementById('week-display');

	// Allow going back only if Monday is >= Global Start Date
	const mondayDate = computedSchedule[0].fullDateObj;
	const startDateClean = new Date(state.startDate);
	startDateClean.setHours(0, 0, 0, 0);

	btnPrev.disabled = mondayDate <= startDateClean;

	// Show "Today" button only when not on current week
	if (currentWeekOffset === 0) {
		weekDisplay.innerText = 'Aktuelle Woche';
		btnToday.classList.add('hidden');
	} else {
		btnToday.classList.remove('hidden');
		if (currentWeekOffset > 0) {
			weekDisplay.innerText = `+${currentWeekOffset} Wochen`;
		} else {
			weekDisplay.innerText = `${currentWeekOffset} Wochen`;
		}
	}

	let activeElementId = null;

	computedSchedule.forEach((day) => {
		if (day.id === 'invalid') {
			return; // Skip invalid days
		}

		const card = document.createElement('div');
		card.id = `card-${day.storageDate}`;

		let lockedClass = day.isLocked ? 'day-locked' : '';
		let activeClass = day.isRealToday ? 'day-active' : '';
		if (day.isRealToday) {
			activeElementId = `card-${day.storageDate}`;
		}

		card.className = `day-card rounded-2xl bg-slate-800/40 border border-slate-700/50 overflow-hidden cursor-pointer ${activeClass} ${lockedClass}`;

		// Check Completion (Sync check is fine here)
		let allDone = false;
		if (day.details.length > 0) {
			allDone = isDayComplete(day.storageDate, day.details);
		}

		if (allDone) {
			card.classList.add('day-complete');
		}

		let lockIcon = day.isLocked ? `<span class="bg-slate-700/50 text-slate-500 px-2 py-1 rounded ml-2 flex items-center lock-icon"><i data-lucide="lock" class="w-3 h-3"></i></span>` : '';

		let headerHtml = `
			<div class="p-5 flex justify-between items-center card-header-content" onclick="toggleAccordion('${day.storageDate}')">
				<div class="flex items-center gap-4">
					<div class="${day.bgClass} ${day.colorClass} p-3 rounded-xl">
						<i data-lucide="${day.icon}"></i>
					</div>
					<div>
						<h3 class="text-lg font-bold text-white flex items-center gap-2 flex-wrap">
							${day.name}
							<span class="text-slate-500 font-normal text-xs ml-1 bg-slate-900/50 px-2 py-0.5 rounded">${day.displayDate}</span>
							${day.isRealToday ? '<span class="today-badge">HEUTE</span>' : ''}
							<span class="completed-badge" style="display:${allDone ? 'inline-block' : 'none'}" id="badge-${day.storageDate}">DONE</span>
							${lockIcon}
						</h3>
						<p class="text-xs ${day.colorClass} font-mono opacity-80 mt-1">${day.theme}</p>
					</div>
				</div>
				<i data-lucide="chevron-down" id="icon-${day.storageDate}" class="text-slate-500 transition-transform duration-300 ${day.isRealToday ? 'rotate-180' : ''}"></i>
			</div>
		`;

		let exercisesHtml = '';

		// Check if this is a recovery or sick day
		const isRecoveryDay = domainStorage.isRecoveryDay(day.storageDate);
		const isSickDayActive = domainStorage.isSickDay(day.storageDate);

		if ( isRecoveryDay || isSickDayActive ) {
			// Show original exercises as disabled/greyed out
			day.details.forEach( ex => {
				const simpleTitle = ex.type === 'alternatives' ? ex.alternatives.map( a => a.title ).join( ' / ' ) : ex.title;
				exercisesHtml += `
					<div class="flex items-start gap-4 exercise-row py-4 border-b border-slate-800/50 last:border-0 opacity-30">
						<div class="w-8 h-8 rounded-full border-2 border-slate-500 flex items-center justify-center flex-shrink-0 mt-1">
							<i data-lucide="x" class="w-5 h-5 text-slate-500"></i>
						</div>
						<div class="flex-grow exercise-text">
							<div class="font-bold text-slate-500 text-lg leading-tight line-through">${simpleTitle}</div>
							<div class="text-xs text-slate-600 mt-0.5">${ex.desc || 'Heute nicht verfügbar'}</div>
						</div>
					</div>
				`;
			} );

			// Add recovery or sick activities
			if ( isRecoveryDay ) {
				exercisesHtml += `
					<div class="mt-4 pt-4 border-t-2 border-emerald-500/30">
						<div class="flex items-center justify-between mb-3">
							<div class="flex items-center gap-2 text-emerald-400">
								<div class="text-2xl">🌱</div>
								<div class="font-bold text-lg">Recovery Modus</div>
							</div>
							${day.isLocked ? '' : `<button onclick="backToNormal('${day.storageDate}')" class="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded-lg transition flex items-center gap-1"><i data-lucide="x" class="w-3 h-3"></i> Zurück zu Normal</button>`}
						</div>
				`;

				recoveryActivities.forEach( activity => {
					const uniqueKey = `${RECOVERY_PREFIX}${day.storageDate}_${activity.id}`;
					let isChecked = domainStorage.isRecoveryActivityComplete(day.storageDate, activity.id);

					exercisesHtml += `
						<div class="flex items-start gap-4 exercise-row group py-4 border-b border-slate-800/50 last:border-0 ${isChecked ? 'completed' : ''}">
							<div class="w-8 h-8 rounded-full border-2 border-emerald-500 check-circle flex items-center justify-center flex-shrink-0 mt-1 ${day.isLocked ? '' : 'cursor-pointer'}"
								 onclick="${day.isLocked ? '' : `toggleCheck(this.parentElement, '${uniqueKey}', '${day.storageDate}')`}">
								<i data-lucide="check" class="w-5 h-5 text-slate-900"></i>
							</div>
							<div class="flex-grow exercise-text">
								<div class="badge-main mb-1">Recovery</div>
								<div class="font-bold text-white text-lg leading-tight">${activity.title}</div>
								<div class="text-xs text-slate-400 mt-0.5">${activity.desc}</div>
							</div>
						</div>
					`;
				} );

				exercisesHtml += `</div>`;

			} else if ( isSickDayActive ) {
				// Sick day - only hydration
				const uniqueKey = `${SICK_PREFIX}${day.storageDate}_hydration`;
				let isChecked = domainStorage.isSickDayHydrationComplete(day.storageDate);
				const usedShield = domainStorage.wasSickDayShieldUsed(day.storageDate);

				exercisesHtml += `
					<div class="mt-4 pt-4 border-t-2 border-red-500/30">
						<div class="flex items-center justify-between mb-3">
							<div class="flex items-center gap-2 text-red-400">
								<div class="text-2xl">🛡️</div>
								<div class="font-bold text-lg">Ruhetag ${usedShield ? '(Schild aktiv)' : '(Streak pausiert)'}</div>
							</div>
							${day.isLocked ? '' : `<button onclick="backToNormal('${day.storageDate}')" class="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded-lg transition flex items-center gap-1"><i data-lucide="x" class="w-3 h-3"></i> Zurück zu Normal</button>`}
						</div>
						<div class="flex items-start gap-4 exercise-row group py-4 border-b border-slate-800/50 last:border-0 ${isChecked ? 'completed' : ''}">
							<div class="w-8 h-8 rounded-full border-2 border-red-500 check-circle flex items-center justify-center flex-shrink-0 mt-1 ${day.isLocked ? '' : 'cursor-pointer'}"
								 onclick="${day.isLocked ? '' : `toggleCheck(this.parentElement, '${uniqueKey}', '${day.storageDate}')`}">
								<i data-lucide="check" class="w-5 h-5 text-slate-900"></i>
							</div>
							<div class="flex-grow exercise-text">
								<div class="badge-cool mb-1">Pflicht</div>
								<div class="font-bold text-white text-lg leading-tight">Flüssigkeitszufuhr</div>
								<div class="text-xs text-slate-400 mt-0.5">Mindestens 2 Liter Wasser/Tee trinken</div>
							</div>
						</div>
						<div class="mt-3 p-3 bg-red-500/10 rounded-lg border border-red-500/30 text-xs text-red-300">
							💡 Gute Besserung! Konzentriere dich heute auf Erholung und ausreichend Flüssigkeit.
							${!usedShield ? '<br><strong>⚠️ Kein Schild verwendet - Streak wird unterbrochen!</strong>' : ''}
						</div>
					</div>
				`;
			}
		} else {
		// Normal day - render regular exercises
		day.details.forEach(ex => {
			const uniqueKey = `${STORAGE_PREFIX}${day.storageDate}_${ex.id}`;
			let isChecked = domainStorage.isExerciseComplete(day.storageDate, ex.id);

			// --- RENDER LOGIC ---
			if (ex.type === 'alternatives') {
				let altContent = '';
				ex.alternatives.forEach((alt, idx) => {
					let altTimersHtml = '';
					if (alt.timers) {
						altTimersHtml = `<div class="flex gap-2 mt-1 flex-wrap">` +
							alt.timers.map(t => `<div class="timer-chip" onclick="startSpecificTimer(${t.s}, '${t.l} ${alt.title}')"><i data-lucide="clock" class="w-3 h-3"></i> ${t.l}</div>`).join('') +
							`</div>`;
					}

					altContent += `
						<div>
							<div class="font-bold text-white text-lg leading-tight">${alt.title}</div>
							<div class="text-xs text-slate-400 mt-0.5">${alt.desc}</div>
							${altTimersHtml}
						</div>
					`;
					if (idx < ex.alternatives.length - 1) {
						altContent += `<div class="alt-divider">ODER</div>`;
					}
				});

				exercisesHtml += `
					<div class="flex items-start gap-4 exercise-row group py-4 border-b border-slate-800/50 last:border-0 ${isChecked ? 'completed' : ''}">
						<div class="w-8 h-8 rounded-full border-2 border-slate-500 check-circle flex items-center justify-center flex-shrink-0 mt-1 ${day.isLocked ? '' : 'cursor-pointer'}"
							 onclick="${day.isLocked ? '' : `toggleCheck(this.parentElement, '${uniqueKey}', '${day.storageDate}')`}">
							<i data-lucide="check" class="w-5 h-5 text-slate-900"></i>
						</div>
						<div class="flex-grow exercise-text">
							<div class="phase-badge badge-main mb-1">MISSION</div>
							<div class="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
								${altContent}
							</div>
						</div>
					</div>
				`;
			} else {
				let badgeClass = ex.type === 'warmup' ? 'badge-warmup' : ex.type === 'main' ? 'badge-main' : 'badge-cool';
				let badgeText = ex.type === 'warmup' ? 'Warm Up' : ex.type === 'main' ? 'Mission' : 'Cooldown';

				let timersHtml = '';
				if (ex.timers) {
					timersHtml = `<div class="flex gap-2 mt-2 flex-wrap">` +
						ex.timers.map(t => `<div class="timer-chip" onclick="startSpecificTimer(${t.s}, '${t.l} ${ex.title}')"><i data-lucide="clock" class="w-3 h-3"></i> ${t.l}</div>`).join('') +
						`</div>`;
				}

				// Rep counter chip
				let repCounterHtml = '';
				if (ex.repCounter) {
					const rc = ex.repCounter;
					repCounterHtml = `<div class="flex gap-2 mt-2 flex-wrap">
						<div class="timer-chip bg-purple-500/20 border-purple-500/40" onclick="startRepCounter('${ex.id}', ${rc.sets}, ${rc.reps}, ${rc.restSeconds}, ${rc.delayMilliseconds}, '${ex.title}', '${day.storageDate}', '${uniqueKey}')">
							<i data-lucide="repeat" class="w-3 h-3"></i> ${rc.sets} x ${rc.reps}
						</div>
					</div>`;
				}

				let rightSide = '';
				if (ex.weight) {
					const userUnit = domainStorage.getUnit(ex.id) || ex.defaultUnit || 'KG';
					const currentWeight = getSmartWeight(ex.id, day.fullDateObj, ex.weight);

					rightSide = `
						<div class="weight-box rounded-lg p-2 w-24 flex flex-col items-center justify-center border border-slate-700 bg-slate-900/80 z-10" onclick="event.stopPropagation()">
							<input type="number"
								inputmode="numeric"
								pattern="[0-9]*"
								class="weight-input"
								value="${currentWeight}"
								onfocus="focusWeightInput(this)"
								onblur="handleWeightBlur('${ex.id}', '${day.storageDate}', this)"
								onkeydown="if(event.key==='Enter') this.blur()"
							>
							<span class="text-[9px] text-slate-500 uppercase font-bold mt-1 unit-toggle" onclick="toggleUnit('${ex.id}', this)">${userUnit}</span>
						</div>`;
				}

				exercisesHtml += `
					<div class="flex items-start gap-4 exercise-row group py-4 border-b border-slate-800/50 last:border-0 ${isChecked ? 'completed' : ''}">
						<div class="w-8 h-8 rounded-full border-2 border-slate-500 check-circle flex items-center justify-center flex-shrink-0 mt-1 ${day.isLocked ? '' : 'cursor-pointer'}"
							 onclick="${day.isLocked ? '' : `toggleCheck(this.parentElement, '${uniqueKey}', '${day.storageDate}')`}">
							<i data-lucide="check" class="w-5 h-5 text-slate-900"></i>
						</div>
						<div class="flex-grow exercise-text">
							<div class="${badgeClass} mb-1">${badgeText}</div>
							<div class="font-bold text-white text-lg leading-tight">${ex.title}</div>
							<div class="text-xs text-slate-400 mt-0.5">${ex.desc}</div>
							${timersHtml}
							${repCounterHtml}
						</div>
						${rightSide}
					</div>
				`;
			}
		});
		} // End of normal day rendering

		const noteKey = `${NOTE_PREFIX}${day.storageDate}`;
		const savedNote = domainStorage.getNote(day.storageDate);
		const prevMemo = getPreviousMemo(day.storageDate);
		let prevMemoHtml = prevMemo ? `<div class="mt-2 p-3 rounded-lg border border-dashed border-slate-700 bg-slate-800/50"><div class="text-[10px] text-slate-500 uppercase flex items-center gap-1 mb-1"><i data-lucide="history" class="w-3 h-3"></i> Memo von letzter Woche</div><div class="text-sm text-slate-400 italic">"${prevMemo}"</div></div>` : '';

		const detailsHtml = `
			<div id="details-${day.storageDate}" class="${day.isRealToday ? '' : 'hidden'} border-t border-slate-700/50 bg-slate-900/30">
				<div class="p-5">
					${exercisesHtml}
					<div class="mt-4 pt-4 border-t border-slate-800">
						<label class="text-[10px] text-slate-500 uppercase font-bold mb-2 block tracking-wider">Logbuch</label>
						<textarea oninput="saveNote('${noteKey}', this.value)" class="w-full bg-slate-900/80 border border-slate-700 rounded-lg p-3 text-sm text-slate-300 focus:outline-none focus:border-blue-500 transition-colors h-24 resize-none mb-2" placeholder="Notizen...">${savedNote}</textarea>
						${prevMemoHtml}
					</div>
				</div>
			</div>
		`;

		card.innerHTML = headerHtml + detailsHtml;
		container.appendChild(card);
	});

	lucide.createIcons();

	// Scroll logic
	if (activeElementId) {
		setTimeout(() => {
			const el = document.getElementById(activeElementId);
			if (el) {
				const y = el.getBoundingClientRect().top + window.pageYOffset - 140;
				window.scrollTo({top: y, behavior: 'smooth'});
			}
		}, 200); // Slight delay for rendering
	}

	calculateStreak();
}

// --- HELPERS ---

/**
 * Get the smart weight for an exercise.
 *
 * Searches backwards from the target date to find the most recently used weight
 * for this exercise. Implements progressive overload by carrying forward weights.
 *
 * @param {string} exerciseId - Unique identifier for the exercise.
 * @param {Date} targetDate - The date to check for.
 * @param {string} defaultWeight - Default weight if no history found.
 * @return {string} The weight value to use.
 */
function getSmartWeight(exerciseId, targetDate, defaultWeight) {
	let searchDate = new Date(targetDate);
	searchDate.setHours(0, 0, 0, 0);

	while (searchDate >= state.startDate) {
		const dateStr = getLocalISODate(searchDate);
		const saved = domainStorage.getWeight(exerciseId, dateStr);
		if (saved) {
			return saved;
		}
		searchDate.setDate(searchDate.getDate() - 1);
	}
	return defaultWeight;
}

/**
 * Get the memo/note from one week prior to the given date.
 *
 * @param {string} targetDateIso - ISO date string (YYYY-MM-DD).
 * @return {string|null} Previous week's memo or null if not found.
 */
function getPreviousMemo(targetDateIso) {
	const current = new Date(targetDateIso);
	const prevDate = new Date(current);
	prevDate.setDate(prevDate.getDate() - 7);
	const prevIso = getLocalISODate(prevDate);
	return domainStorage.getNote(prevIso);
}

/**
 * Change the displayed week by the given direction.
 *
 * @param {number} direction - Direction to navigate (-1 for previous, 1 for next).
 * @return {void}
 */
function changeWeek(direction) {
	if (direction === -1 && document.getElementById('btn-prev').disabled) {
		return;
	}
	currentWeekOffset += direction;
	renderSchedule();
}

/**
 * Jump back to the current week (today).
 *
 * Resets week offset to 0 and re-renders the schedule.
 * Includes smooth scroll to today's card after render completes.
 *
 * @return {void}
 */
function goToToday() {
	currentWeekOffset = 0;
	renderSchedule();
}

/**
 * Toggle the accordion state of a day card.
 *
 * @param {string} dateId - ISO date string identifying the day.
 * @return {void}
 */
function toggleAccordion(dateId) {
	const details = document.getElementById(`details-${dateId}`);
	const icon = document.getElementById(`icon-${dateId}`);
	if (details.classList.contains('hidden')) {
		details.classList.remove('hidden');
		icon.style.transform = 'rotate(180deg)';
	} else {
		details.classList.add('hidden');
		icon.style.transform = 'rotate(0deg)';
	}
}

/**
 * Toggle the completion status of an exercise.
 *
 * Handles checking/unchecking exercises, with confirmation for unchecking past days.
 * Updates localStorage, triggers confetti on completion, and recalculates streak.
 *
 * @param {HTMLElement} row - The exercise row element.
 * @param {string} storageKey - LocalStorage key for this exercise.
 * @param {string} dateId - ISO date string of the day.
 * @return {void}
 */
function toggleCheck(row, storageKey, dateId) {
	const isCurrentlyCompleted = row.classList.contains('completed');

	// Check if this is from yesterday or before
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const targetDate = new Date(dateId);
	targetDate.setHours(0, 0, 0, 0);

	const isPast = targetDate < today;

	// If trying to uncheck a past day, ask for confirmation
	if (isCurrentlyCompleted && isPast) {
		if (!confirm('Möchtest du diese abgeschlossene Übung wirklich rückgängig machen?')) {
			return; // Cancel the action
		}
	}

	row.classList.toggle('completed');
	if (row.classList.contains('completed')) {
		// Extract date and exercise ID from storage key
		// Key format: "br_YYYY-MM-DD_exerciseId" or "recovery_YYYY-MM-DD_activityId" or "sick_YYYY-MM-DD_hydration"
		const parts = storageKey.split('_');
		const prefix = parts[0];
		const date = parts[1];
		const id = parts.slice(2).join('_');

		if (prefix === 'br') {
			domainStorage.setExerciseComplete(date, id);
		} else if (prefix === 'recovery' && parts.length > 3) {
			// Recovery activity: recovery_YYYY-MM-DD_activityId
			domainStorage.setRecoveryActivityComplete(date, id);
		} else {
			// Fallback to generic storage for other cases (sick day hydration, etc.)
			storage.set(storageKey, 'true');
		}
		miniConfetti(row.querySelector('.check-circle'));
	} else {
		// Extract date and ID to use domain methods
		const parts = storageKey.split('_');
		const prefix = parts[0];
		const date = parts[1];
		const id = parts.slice(2).join('_');

		if (prefix === 'br') {
			domainStorage.setExerciseIncomplete(date, id);
		} else if (prefix === 'recovery' && parts.length > 3) {
			domainStorage.removeRecoveryActivity(date, id);
		} else {
			storage.remove(storageKey);
		}
	}
	checkDayCompletion(dateId);
	calculateStreak();
}

/**
 * Save a note to storage.
 *
 * @param {string} key - Storage key (format: "note_YYYY-MM-DD").
 * @param {string} value - Note content.
 * @return {void}
 */
function saveNote(key, value) {
	// Extract date from key (format: "note_YYYY-MM-DD")
	const date = key.replace(NOTE_PREFIX, '');
	domainStorage.setNote(date, value);
}

/**
 * Save weight for an exercise on a specific date.
 *
 * @param {string} exId - Exercise ID.
 * @param {string} dateIso - ISO date string.
 * @param {string|number} value - Weight value.
 * @return {void}
 */
function saveWeight(exId, dateIso, value) {
	domainStorage.setWeight(exId, dateIso, value);
}

/**
 * Toggle the unit (KG/STUFE) for an exercise.
 *
 * @param {string} exId - Exercise ID.
 * @param {HTMLElement} element - The unit toggle element.
 * @return {void}
 */
function toggleUnit(exId, element) {
	event.stopPropagation();
	const current = element.innerText;
	const newUnit = current === 'KG' ? 'STUFE' : 'KG';
	element.innerText = newUnit;
	domainStorage.setUnit(exId, newUnit);
}

/**
 * Focus a weight input and select its content.
 *
 * @param {HTMLInputElement} input - The input element.
 * @return {void}
 */
function focusWeightInput(input) {
	const val = input.value;
	input.value = '';
	input.value = val;
}

/**
 * Handle weight input blur event.
 *
 * Validates and saves the weight value.
 *
 * @param {string} exId - Exercise ID.
 * @param {string} dateIso - ISO date string.
 * @param {HTMLInputElement} input - The input element.
 * @return {void}
 */
function handleWeightBlur(exId, dateIso, input) {
	let val = parseInt(input.value);
	if (isNaN(val) || val < 0) {
		val = 0;
	}
	input.value = val;
	saveWeight(exId, dateIso, val);
}

/**
 * Check if a day is fully completed and update UI accordingly.
 *
 * Counts completed exercises and shows completion popup if all are done.
 *
 * @param {string} dateId - ISO date string of the day.
 * @return {void}
 */
function checkDayCompletion(dateId) {
	const container = document.getElementById(`details-${dateId}`);
	const card = document.getElementById(`card-${dateId}`);
	const badge = document.getElementById(`badge-${dateId}`);

	const total = container.querySelectorAll('.exercise-row').length;
	const done = container.querySelectorAll('.exercise-row.completed').length;

	if (total > 0 && total === done) {
		if (!card.classList.contains('day-complete')) {
			card.classList.add('day-complete');
			badge.style.display = 'inline-block';
			showCompletionPopup();
		}
	} else {
		card.classList.remove('day-complete');
		badge.style.display = 'none';
	}
}

/**
 * Calculate the current workout streak.
 *
 * Iterates backwards from today counting consecutive completed days.
 * Handles sick days (recovery mode) and shield usage.
 * Awards shields for every 7 consecutive completed days.
 * Updates the streak display in the UI and modal.
 *
 * @async
 * @return {Promise<void>} Resolves when streak calculation is complete.
 */
async function calculateStreak() {
	let streak = 0;
	let weekCounter = 0;
	let checkDate = new Date();
	const todayIso = getLocalISODate(checkDate);

	// Get already awarded shield milestones
	const awardedMilestones = getAwardedShieldMilestones();

	// Check Today
	let config = await fetchScheduleForDate(todayIso);
	let dayIdx = checkDate.getDay();
	let dayData = config ? config.find(d => d.dayIndex === dayIdx) : null;

	const todayComplete = dayData && isDayComplete(todayIso, dayData.details);
	const todayRecovery = domainStorage.isRecoveryDay(todayIso) && isDayComplete(todayIso, []);
	const todaySickWithShield = domainStorage.isSickDay(todayIso) && domainStorage.wasSickDayShieldUsed(todayIso) && isDayComplete(todayIso, []);

	if (todayComplete || todayRecovery || todaySickWithShield) {
		streak++;
		if (todayComplete) {
			weekCounter++;
			// Check if this milestone hasn't been awarded yet
			if (weekCounter % 7 === 0 && !awardedMilestones.has(weekCounter)) {
				awardShield();
				addAwardedShieldMilestone(weekCounter);
			}
		}
	}

	checkDate.setDate(checkDate.getDate() - 1);

	while (true) {
		const dateStr = getLocalISODate(checkDate);
		if (dateStr < getLocalISODate(state.startDate)) {
			break;
		}

		config = await fetchScheduleForDate(dateStr);
		dayIdx = checkDate.getDay();
		dayData = config ? config.find(d => d.dayIndex === dayIdx) : null;

		const dayComplete = dayData && isDayComplete(dateStr, dayData.details);
		const recoveryComplete = domainStorage.isRecoveryDay(dateStr) && isDayComplete(dateStr, []);
		const sickDayWithShield = domainStorage.isSickDay(dateStr) && domainStorage.wasSickDayShieldUsed(dateStr) && isDayComplete(dateStr, []);

		if (dayComplete || recoveryComplete || sickDayWithShield) {
			streak++;
			if (dayComplete) {
				weekCounter++;
				// Check if this milestone hasn't been awarded yet
				if (weekCounter % 7 === 0 && !awardedMilestones.has(weekCounter)) {
					awardShield();
					addAwardedShieldMilestone(weekCounter);
				}
			}
			checkDate.setDate(checkDate.getDate() - 1);
		} else {
			break;
		}
	}

	const streakEl = document.getElementById('streak-container');
	const countEl = document.getElementById('streak-count');

	if (streak > 0) {
		streakEl.classList.remove('hidden');
		countEl.innerText = streak;
		document.getElementById('modal-streak').innerText = `${streak} Tage`;
	} else {
		streakEl.classList.add('hidden');
		document.getElementById('modal-streak').innerText = `0 Tage`;
	}

	// Update shield display
	updateShieldDisplay();
}

/**
 * Check if all exercises in a day are completed.
 *
 * Handles normal days, recovery days, and sick days differently.
 *
 * @param {string} dateIso - ISO date string.
 * @param {Array} details - Array of exercise objects for the day.
 * @return {boolean} True if all exercises are completed, false otherwise.
 */
function isDayComplete(dateIso, details) {
	// Check if it's a recovery day
	if ( domainStorage.isRecoveryDay(dateIso) ) {
		return recoveryActivities.every( activity => {
			return domainStorage.isRecoveryActivityComplete(dateIso, activity.id);
		} );
	}

	// Check if it's a sick day
	if ( domainStorage.isSickDay(dateIso) ) {
		return domainStorage.isSickDayHydrationComplete(dateIso);
	}

	// Normal day
	if (!details || details.length === 0) {
		return false;
	}
	return details.every(ex => {
		return domainStorage.isExerciseComplete(dateIso, ex.id);
	});
}

/**
 * Show the completion popup modal.
 *
 * Displays a motivational quote and triggers super confetti effect.
 *
 * @return {void}
 */
function showCompletionPopup() {
	const modal = document.getElementById('completion-modal');
	const quoteEl = document.getElementById('modal-quote');
	const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
	quoteEl.innerText = `"${randomQuote}"`;
	modal.classList.add('open');
	superConfetti();
}

/**
 * Close the completion modal.
 *
 * @return {void}
 */
function closeModal() {
	document.getElementById('completion-modal').classList.remove('open');
}

/**
 * Toggle the settings menu visibility.
 *
 * @param {Event} [e] - Optional event object to stop propagation.
 * @return {void}
 */
function toggleMenu(e) {
	if (e) {
		e.stopPropagation();
	}
	const menu = document.getElementById('menu-dropdown');
	menu.classList.toggle('hidden');
}

/**
 * Close the menu when clicking outside of it.
 *
 * @param {Event} e - Click event object.
 * @return {void}
 */
function closeMenuOutside(e) {
	const menu = document.getElementById('menu-dropdown');
	const btn = document.getElementById('menu-btn');
	if (!menu.classList.contains('hidden') && !menu.contains(e.target) && !btn.contains(e.target)) {
		menu.classList.add('hidden');
	}
}

/**
 * Trigger the file import dialog.
 *
 * @return {void}
 */
function triggerImport() {
	document.getElementById('import-input').click();
	toggleMenu();
}

/**
 * Force a page reload with cache-busting parameter.
 *
 * @return {void}
 */
function forceUpdate() {
	if (confirm('Update laden?')) {
		const url = new URL(window.location.href);
		url.searchParams.set('update', Date.now());
		window.location.href = url.toString();
	}
}

/**
 * Toggle debug mode on/off.
 *
 * Adds or removes #debug from URL hash and reloads the page.
 * Updates button text to reflect current state.
 *
 * @return {void}
 */
function toggleDebugMode() {
	const isDebugActive = window.location.hash === '#debug';

	if (isDebugActive) {
		// Disable debug mode
		window.location.hash = '';
		window.location.reload();
	} else {
		// Enable debug mode
		window.location.hash = 'debug';
		window.location.reload();
	}
}

/**
 * Update debug toggle button text based on current state.
 *
 * Called on page load to reflect whether debug mode is active.
 *
 * @return {void}
 */
function updateDebugToggleButton() {
	const button = document.getElementById('debug-toggle-btn');
	const text = document.getElementById('debug-toggle-text');

	if (!button || !text) {
		return;
	}

	const isDebugActive = window.location.hash === '#debug';

	if (isDebugActive) {
		text.textContent = 'Debug Mode deaktivieren';
		button.classList.add('bg-orange-500/20');
	} else {
		text.textContent = 'Debug Mode aktivieren';
		button.classList.remove('bg-orange-500/20');
	}
}

/**
 * Enable NoSleep mode by playing a silent video.
 *
 * Prevents the device screen from locking during workouts.
 *
 * @return {void}
 */
function enableNoSleep() {
	const video = document.getElementById('nosleep-video');
	video.play().catch(e => console.log('Video play failed', e));
}

/**
 * Use text-to-speech to speak a message in German.
 *
 * Now uses timerCoordinator for centralized speech management and cleanup.
 *
 * @param {string} text - The text to speak.
 * @return {Promise<void>} Resolves when speech complete.
 */
async function speak(text) {
	return timerCoordinator.speak(text);
}

/**
 * Convert timer label abbreviations to spoken German.
 *
 * @param {string} label - Timer label (e.g., "5 Min", "30s").
 * @return {string} Spoken version of the label.
 */
function getSpokenText(label) {
	return label.replace(/\bMin\b/g, 'Minuten').replace(/(\d+)s\b/g, '$1 Sekunden');
}

/**
 * Start a specific timer with given duration and label.
 *
 * @param {number} seconds - Duration in seconds.
 * @param {string} label - Display label for the timer.
 * @return {void}
 */
function startSpecificTimer(seconds, label) {
	event.stopPropagation();

	// Check if we can start a timer (state machine validation)
	if (!appStateMachine.canStartTimer()) {
		console.warn('[Timer] Blocked - another operation is active');
		alert('⚠️ Bitte schließe erst die andere aktive Aktion.');
		return;
	}

	resetTimer();
	timeLeft = seconds;
	currentTimerLabel = label;
	document.getElementById('timer-text').innerText = label;
	const spokenLabel = getSpokenText(label);

	// Transition app state to TIMER_ACTIVE
	appStateMachine.startTimer();
	timerStateMachine.start(false); // Start without countdown

	// Mark timer as active in coordinator (clears everything)
	timerCoordinator.startTimer();

	startTimerLogic(spokenLabel);
}

// Rep counter state
let repCounterState = {
	active: false,
	exerciseId: '',
	exerciseTitle: '',
	exerciseDate: '',
	exerciseStorageKey: '',
	totalSets: 0,
	repsPerSet: 0,
	restSeconds: 60,
	delayMilliseconds: 3000,
	currentSet: 0,
	currentRep: 0
};
let repCounterInterval = null;
let repCountdownInterval = null;
let repStartTimeout = null;

/**
 * Get the rep counter delay with debug mode override.
 *
 * Returns the configured delay in milliseconds, or 1000ms in debug mode for faster testing.
 * This provides a single source of truth for rep timing.
 *
 * @param {number} configuredDelay - The delay configured in the schedule (milliseconds).
 * @return {number} Actual delay to use (milliseconds).
 */
function getRepDelay(configuredDelay) {
	if (DEBUG_MODE) {
		console.log(`[RepCounter] Debug mode: Overriding delay ${configuredDelay}ms → 1000ms`);
		return 1000;
	}
	return configuredDelay;
}

/**
 * Start rep counter workflow.
 *
 * @param {string} exerciseId - Exercise identifier.
 * @param {number} sets - Number of sets.
 * @param {number} reps - Reps per set.
 * @param {number} restSeconds - Rest duration between sets.
 * @param {number} delayMilliseconds - Milliseconds per rep.
 * @param {string} title - Exercise title.
 * @param {string} date - Exercise date (for storage).
 * @param {string} storageKey - LocalStorage key for completion tracking.
 * @return {void}
 */
function startRepCounter(exerciseId, sets, reps, restSeconds, delayMilliseconds, title, date, storageKey) {
	event.stopPropagation();

	// Check if we can start rep counter (state machine validation)
	if (!appStateMachine.canStartRepCounter()) {
		console.warn('[RepCounter] Blocked - another operation is active');
		alert('⚠️ Bitte schließe erst die andere aktive Aktion.');
		return;
	}

	// Reset any existing timer
	resetTimer();
	if (repCounterInterval) {
		clearInterval(repCounterInterval);
	}

	// Transition app state to REP_COUNTER_ACTIVE
	appStateMachine.startRepCounter();
	repCounterStateMachine.start();

	// Mark rep counter as active in coordinator
	timerCoordinator.startRepCounter();

	// Initialize state with debug mode delay override
	const actualDelay = getRepDelay(delayMilliseconds);
	repCounterState = {
		active: true,
		exerciseId: exerciseId,
		exerciseTitle: title,
		exerciseDate: date,
		exerciseStorageKey: storageKey,
		totalSets: sets,
		repsPerSet: reps,
		restSeconds: restSeconds,
		delayMilliseconds: actualDelay,
		currentSet: 1,
		currentRep: 0
	};

	// Show modal
	showRepCounterModal();

	// Start with 5-second countdown using timerCoordinator
	timerCoordinator.setTimeout(() => {
		startRepCountdown();
	}, 300, 'rep_counter_init');
}

/**
 * Show rep counter modal.
 *
 * @return {void}
 */
function showRepCounterModal() {
	const modal = document.getElementById('rep-counter-modal');
	modal.classList.remove('hidden');

	// Set exercise title
	document.getElementById('rep-exercise-title').textContent = repCounterState.exerciseTitle;

	// Initialize display
	updateRepCounterModal();

	// Reinitialize lucide icons
	lucide.createIcons();
}

/**
 * Hide rep counter modal.
 *
 * @return {void}
 */
function hideRepCounterModal() {
	const modal = document.getElementById('rep-counter-modal');
	modal.classList.add('hidden');
}

/**
 * Update rep counter modal display.
 *
 * @return {void}
 */
function updateRepCounterModal() {
	document.getElementById('rep-set-info').textContent =
		`Satz ${repCounterState.currentSet} von ${repCounterState.totalSets}`;

	const currentNumberEl = document.getElementById('rep-current-number');
	currentNumberEl.textContent = repCounterState.currentRep;

	// Remove all animations and dim classes
	currentNumberEl.classList.remove('rep-pulse', 'rep-breathe', 'rep-number-blue-dim', 'rep-number-green-dim');

	// Trigger pulse animation
	void currentNumberEl.offsetWidth; // Force reflow
	currentNumberEl.classList.add('rep-pulse');

	// Remove countdown/go colors if present
	currentNumberEl.classList.remove('rep-number-countdown', 'rep-number-go');

	// Change color for last 3 reps
	const repsRemaining = repCounterState.repsPerSet - repCounterState.currentRep;
	const isLastThree = repsRemaining <= 2 && repCounterState.currentRep > 0;

	if (isLastThree) {
		// Last 3 reps: green
		currentNumberEl.classList.remove('rep-number-blue');
		currentNumberEl.classList.add('rep-number-green');
	} else {
		// Regular reps: blue
		currentNumberEl.classList.remove('rep-number-green');
		currentNumberEl.classList.add('rep-number-blue');
	}

	// Set CSS variable for breathing animation duration
	currentNumberEl.style.setProperty('--rep-delay', `${repCounterState.delayMilliseconds}ms`);

	// Start breathing animation after pulse completes
	setTimeout(() => {
		currentNumberEl.classList.add('rep-breathe');

		// Change to dim color at midpoint (simulating down motion)
		setTimeout(() => {
			if (isLastThree) {
				currentNumberEl.classList.add('rep-number-green-dim');
			} else {
				currentNumberEl.classList.add('rep-number-blue-dim');
			}
		}, repCounterState.delayMilliseconds / 2);
	}, 200);

	document.getElementById('rep-total').textContent =
		`von ${repCounterState.repsPerSet}`;
}

/**
 * Start 5-second countdown before first set.
 *
 * @return {void}
 */
function startRepCountdown() {
	let countdown = 5;

	const currentNumberEl = document.getElementById('rep-current-number');
	currentNumberEl.textContent = countdown;
	currentNumberEl.classList.remove('rep-number-blue', 'rep-number-green', 'rep-number-go', 'rep-breathe');
	currentNumberEl.classList.add('rep-number-countdown');

	document.getElementById('rep-total').textContent = '';
	document.getElementById('rep-status-text').textContent = 'Bereit...';

	// Set 1-second breathing animation for countdown
	currentNumberEl.style.setProperty('--rep-delay', '1000ms');
	currentNumberEl.classList.add('rep-breathe');

	// Only speak 3, 2, 1 (not 5, 4)
	if (countdown === 3) {
		// Ensure voices are loaded before speaking
		if (window.speechSynthesis.getVoices().length === 0) {
			window.speechSynthesis.onvoiceschanged = () => {
				speak('3');
			};
		} else {
			speak('3');
		}
	}

	// Use timerCoordinator.setInterval for countdown
	timerCoordinator.setInterval(() => {
		countdown--;
		if (countdown > 0) {
			currentNumberEl.textContent = countdown;

			// Restart breathing animation for each number
			currentNumberEl.classList.remove('rep-breathe');
			void currentNumberEl.offsetWidth; // Force reflow
			currentNumberEl.classList.add('rep-breathe');

			// Only speak 3, 2, 1
			if (countdown <= 3) {
				speak(`${countdown}`);
			}
		} else {
			// Clear this specific interval
			timerCoordinator.clearInterval('rep_countdown');

			// Show "Los!" in big text with green color
			currentNumberEl.textContent = 'Los!';
			currentNumberEl.classList.remove('rep-number-countdown', 'rep-breathe');
			currentNumberEl.classList.add('rep-number-go');
			currentNumberEl.style.removeProperty('--rep-delay');
			document.getElementById('rep-status-text').textContent = '';
			speak('Los!');

			// Wait shortly, then start rep counting using timerCoordinator
			timerCoordinator.setTimeout(() => {
				startRepCounting();
			}, 500, 'rep_start_counting');
		}
	}, 1000, 'rep_countdown');
}

/**
 * Start automatic counting of reps for current set.
 *
 * @return {void}
 */
function startRepCounting() {
	repCounterState.currentRep = 1;

	// Update display and speak first rep immediately
	updateRepCounterModal();
	document.getElementById('rep-status-text').textContent = 'Führe Wiederholungen aus...';
	speak('1');

	// Vibrate on first rep
	if (navigator.vibrate) {
		navigator.vibrate(50);
	}

	// Check if this was the only rep
	if (repCounterState.currentRep >= repCounterState.repsPerSet) {
		timerCoordinator.setTimeout(() => {
			completeSet();
		}, 300, 'complete_set');
		return;
	}

	// Start automatic rep counting for remaining reps using timerCoordinator
	timerCoordinator.setInterval(() => {
		repCounterState.currentRep++;
		updateRepCounterModal();

		// Speak rep number
		speak(`${repCounterState.currentRep}`);

		// Vibrate on each rep
		if (navigator.vibrate) {
			navigator.vibrate(50);
		}

		// Check if set complete
		if (repCounterState.currentRep >= repCounterState.repsPerSet) {
			timerCoordinator.clearInterval('rep_counting');
			timerCoordinator.setTimeout(() => {
				completeSet();
			}, repCounterState.delayMilliseconds, 'complete_set');
		}
	}, repCounterState.delayMilliseconds, 'rep_counting');
}

/**
 * Abort rep counter.
 *
 * Uses timerCoordinator to ensure complete cleanup of all timers and speech.
 *
 * @return {void}
 */
function abortRepCounter() {
	// Use timerCoordinator to stop everything
	timerCoordinator.stop();

	// Clear legacy intervals if they exist
	if (repCounterInterval) {
		clearInterval(repCounterInterval);
		repCounterInterval = null;
	}
	if (repCountdownInterval) {
		clearInterval(repCountdownInterval);
		repCountdownInterval = null;
	}
	if (timerInterval) {
		clearInterval(timerInterval);
		timerInterval = null;
	}

	// Clear legacy timeouts if they exist
	if (repStartTimeout) {
		clearTimeout(repStartTimeout);
		repStartTimeout = null;
	}

	repCounterState.active = false;
	isRunning = false;

	// Return to schedule view state
	if (appStateMachine.isRepCounterActive()) {
		appStateMachine.returnToSchedule('rep_counter_aborted');
	}
	repCounterStateMachine.cancel('user_aborted');

	hideRepCounterModal();

	// Speak after a short delay to ensure cancel has completed
	timerCoordinator.setTimeout(() => {
		speak('Abgebrochen');
	}, 100, 'abort_speech');
}

/**
 * Complete current set and start rest or finish exercise.
 *
 * @return {void}
 */
function completeSet() {
	repCounterState.currentSet++;

	if (repCounterState.currentSet > repCounterState.totalSets) {
		// All sets complete
		finishRepCounter();
	} else {
		// Start rest period
		startRestPeriod();
	}
}

/**
 * Start rest period between sets.
 *
 * @return {void}
 */
function startRestPeriod() {
	// Update modal for rest
	document.getElementById('rep-status-text').textContent = 'Pause (Tippen für 5s)';
	document.getElementById('rep-total').textContent = '';

	const currentNumberEl = document.getElementById('rep-current-number');

	// Remove previous classes and set rest styling
	currentNumberEl.classList.remove('rep-number-blue', 'rep-number-green', 'rep-number-blue-dim', 'rep-number-green-dim', 'rep-breathe');
	currentNumberEl.classList.add('rep-number-countdown');

	// Start rest timer
	timeLeft = repCounterState.restSeconds;
	isRunning = true;

	// Announce rest period
	speak(`${timeLeft} Sekunden Pause`);

	// Set 1-second breathing animation for rest timer
	currentNumberEl.style.setProperty('--rep-delay', '1000ms');

	// Add click handler to skip to 5 seconds
	currentNumberEl.style.cursor = 'pointer';
	const quickRestHandler = () => {
		if (timeLeft > 5) {
			timeLeft = 5;
			speak('5 Sekunden');
		}
	};
	currentNumberEl.addEventListener('click', quickRestHandler);

	// Use timerCoordinator.setInterval instead of setInterval
	timerCoordinator.setInterval(() => {
		currentNumberEl.textContent = `${timeLeft}s`;

		// Restart breathing animation for each second
		currentNumberEl.classList.remove('rep-breathe');
		void currentNumberEl.offsetWidth; // Force reflow
		currentNumberEl.classList.add('rep-breathe');

		if (timeLeft === 30) {
			speak('30 Sekunden');
		}
		if (timeLeft === 10) {
			speak('10 Sekunden');
		}
		if (timeLeft === 3) {
			speak('3');
		}
		if (timeLeft === 2) {
			speak('2');
		}
		if (timeLeft === 1) {
			speak('1');
		}

		if (timeLeft <= 0) {
			timerCoordinator.clearInterval('rest_period');
			isRunning = false;

			// Remove click handler and reset styles
			currentNumberEl.removeEventListener('click', quickRestHandler);
			currentNumberEl.style.cursor = '';
			currentNumberEl.classList.remove('rep-breathe', 'rep-number-countdown');
			currentNumberEl.style.removeProperty('--rep-delay');

			// Vibrate
			if (navigator.vibrate) {
				navigator.vibrate([200, 100, 200]);
			}

			speak('Los!');

			// Start next set using timerCoordinator
			timerCoordinator.setTimeout(() => {
				startRepCounting();
			}, 500, 'next_set');
		}

		timeLeft--;
	}, 1000, 'rest_period');
}

/**
 * Finish rep counter workout.
 *
 * @return {void}
 */
function finishRepCounter() {
	speak('Fertig!');

	// Confetti celebration
	confetti({
		particleCount: 100,
		spread: 70,
		origin: { y: 0.6 }
	});

	// Vibrate
	if (navigator.vibrate) {
		navigator.vibrate([300, 100, 300, 100, 300]);
	}

	// Show completion in modal briefly
	document.getElementById('rep-status-text').textContent = 'Fertig! 🎉';
	document.getElementById('rep-current-number').textContent = '✓';
	document.getElementById('rep-total').textContent = '';

	// Mark exercise as complete by triggering checkbox click
	if (repCounterState.exerciseStorageKey) {
		// Find the checkbox element for this exercise
		const checkboxElements = document.querySelectorAll('.check-circle');
		let clicked = false;
		checkboxElements.forEach(checkbox => {
			const row = checkbox.parentElement;
			// Check if this row's onclick contains our storage key
			const onclickAttr = checkbox.getAttribute('onclick');
			if (onclickAttr && onclickAttr.includes(repCounterState.exerciseStorageKey)) {
				// Only click if not already completed
				if (!row.classList.contains('completed') && !clicked) {
					checkbox.click();
					clicked = true;
				}
			}
		});
	}

	// Close modal after celebration
	setTimeout(() => {
		repCounterState.active = false;
		hideRepCounterModal();

		// Return to schedule view state
		if (appStateMachine.isRepCounterActive()) {
			appStateMachine.returnToSchedule('rep_counter_completed');
		}
		repCounterStateMachine.complete();
		repCounterStateMachine.reset();
	}, 2000);
}

/**
 * Toggle the default 60-second timer on/off.
 *
 * @return {void}
 */
function toggleTimer() {
	if (isRunning) {
		resetTimer();
		speak('Timer abgebrochen.');
	} else {
		// Check if we can start a timer (state machine validation)
		if (!appStateMachine.canStartTimer()) {
			console.warn('[Timer] Blocked - another operation is active');
			alert('⚠️ Bitte schließe erst die andere aktive Aktion.');
			return;
		}

		resetTimer(); // Clear any existing state
		timeLeft = 60;
		currentTimerLabel = '60s Pause';
		document.getElementById('timer-text').innerText = currentTimerLabel;

		// Transition app state to TIMER_ACTIVE
		appStateMachine.startTimer();
		timerStateMachine.start(false);

		// Mark timer as active in coordinator (clears everything)
		timerCoordinator.startTimer();

		startTimerLogic('60 Sekunden Pause');
	}
}

/**
 * Start the timer countdown logic.
 *
 * Enables NoSleep, announces start, updates UI every second,
 * provides time announcements, and triggers completion effects.
 * Now uses timerCoordinator for proper cleanup.
 *
 * Note: Caller should call timerCoordinator.startTimer() before this function.
 *
 * @param {string} spokenTextStart - The spoken announcement text.
 * @return {void}
 */
function startTimerLogic(spokenTextStart) {
	enableNoSleep();

	// Small delay to ensure speech cancellation from timerCoordinator.startTimer() completes
	setTimeout(() => {
		speak(`${spokenTextStart} gestartet.`);
	}, 100);

	isRunning = true;
	document.getElementById('fab-timer').classList.add('running');

	// Use timerCoordinator.setInterval instead of setInterval
	timerCoordinator.setInterval(() => {
		timeLeft--;
		const mins = Math.floor(timeLeft / 60);
		const secs = timeLeft % 60;
		const displayTime = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
		document.getElementById('timer-text').innerText = displayTime;

		if (timeLeft === 600) {
			speak('Noch zehn Minuten.');
		}
		if (timeLeft === 300) {
			speak('Noch fünf Minuten.');
		}
		if (timeLeft === 60) {
			speak('Noch eine Minute.');
		}
		if (timeLeft === 30) {
			speak('Noch dreißig Sekunden.');
		}
		if (timeLeft === 10) {
			speak('Zehn Sekunden.');
		}
		if (timeLeft <= 3 && timeLeft > 0) {
			speak(timeLeft.toString());
		}

		if (timeLeft <= 0) {
			resetTimer();
			speak("Zeit abgelaufen! Weiter geht's!");
			navigator.vibrate([200, 100, 200]);
			superConfetti();
		}
	}, 1000, 'main_timer');
}

/**
 * Reset the timer to default state.
 *
 * Stops countdown, resets UI, cancels all timers and speech via timerCoordinator.
 * Returns to schedule view state.
 *
 * @return {void}
 */
function resetTimer() {
	// Use timerCoordinator to stop everything
	timerCoordinator.stop();

	// Clear legacy timer interval if it exists
	if (timerInterval) {
		clearInterval(timerInterval);
		timerInterval = null;
	}

	isRunning = false;
	document.getElementById('fab-timer').classList.remove('running');
	document.getElementById('fab-timer').innerHTML = '<i data-lucide="timer" class="w-6 h-6"></i><span id="timer-text">60s Pause</span>';
	lucide.createIcons();

	// Return to schedule view state
	if (appStateMachine.isTimerActive()) {
		appStateMachine.returnToSchedule('timer_completed');
	}
	timerStateMachine.stop('completed');
}

/**
 * Export all user data to a JSON file.
 *
 * Exports checkmarks, notes, weights, and unit preferences from localStorage.
 *
 * @return {void}
 */
function exportData() {
	const exportObj = {};
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key.startsWith(STORAGE_PREFIX) || key.startsWith(NOTE_PREFIX) || key.startsWith(WEIGHT_PREFIX) || key.startsWith(UNIT_PREFIX) || key.startsWith(SICK_PREFIX) || key.startsWith(RECOVERY_PREFIX) || key === SHIELDS_KEY || key === SHIELDS_AWARDED_KEY) {
			exportObj[key] = localStorage.getItem(key);
		}
	}
	const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObj));
	const dlAnchor = document.createElement('a');
	dlAnchor.setAttribute('href', dataStr);
	dlAnchor.setAttribute('download', `BodyRefactoring_Backup_${new Date().toISOString().split('T')[0]}.json`);
	document.body.appendChild(dlAnchor);
	dlAnchor.click();
	dlAnchor.remove();
}

/**
 * Import user data from a JSON file.
 *
 * Restores checkmarks, notes, weights, and unit preferences to localStorage.
 *
 * @param {HTMLInputElement} inputElement - File input element.
 * @return {void}
 */
function importData(inputElement) {
	const file = inputElement.files[0];
	if (!file) {
		return;
	}
	const reader = new FileReader();
	reader.onload = function (e) {
		try {
			const data = JSON.parse(e.target.result);
			Object.keys(data).forEach(key => {
				if (key.startsWith(STORAGE_PREFIX) || key.startsWith(NOTE_PREFIX) || key.startsWith(WEIGHT_PREFIX) || key.startsWith(UNIT_PREFIX) || key.startsWith(SICK_PREFIX) || key.startsWith(RECOVERY_PREFIX) || key === SHIELDS_KEY || key === SHIELDS_AWARDED_KEY) {
					localStorage.setItem(key, data[key]);
				}
			});
			alert('Daten importiert!');
			location.reload();
		} catch (err) {
			alert('Fehler beim Import.');
		}
	};
	reader.readAsText(file);
}

/**
 * Trigger a small confetti burst at a specific element's location.
 *
 * @param {HTMLElement} element - The element to center the confetti on.
 * @return {void}
 */
function miniConfetti(element) {
	const rect = element.getBoundingClientRect();
	confetti({
		particleCount: 20,
		spread: 50,
		origin: {
			x: (rect.left + rect.width / 2) / window.innerWidth,
			y: (rect.top + rect.height / 2) / window.innerHeight
		},
		colors: ['#38bdf8', '#f472b6', '#22c55e'],
		disableForReducedMotion: true,
		ticks: 50,
		gravity: 1.2,
		scalar: 0.6,
		startVelocity: 20
	});
}

/**
 * Trigger a full-screen confetti celebration.
 *
 * Fires confetti from both sides of the screen for 1.5 seconds.
 *
 * @return {void}
 */
function superConfetti() {
	var end = Date.now() + 1500;
	(function frame() {
		confetti({
			particleCount: 3,
			angle: 60,
			spread: 55,
			origin: {x: 0},
			colors: ['#38bdf8', '#f472b6', '#22c55e']
		});
		confetti({
			particleCount: 3,
			angle: 120,
			spread: 55,
			origin: {x: 1},
			colors: ['#38bdf8', '#f472b6', '#22c55e']
		});
		if (Date.now() < end) {
			requestAnimationFrame(frame);
		}
	}());
}

// --- SICK MODE / RECOVERY FUNCTIONS ---


/**
 * Get the current number of available shields.
 *
 * @return {number} Number of shields (0-3).
 */
function getShields() {
	const shields = domainStorage.getShieldCount();
	return Math.min( shields, MAX_SHIELDS );
}

/**
 * Get awarded shield milestones.
 *
 * @return {Set<number>} Set of milestone numbers that have been awarded.
 */
function getAwardedShieldMilestones() {
	return domainStorage.getShieldMilestones();
}

/**
 * Add a milestone to the awarded list.
 *
 * @param {number} milestone - The milestone number (e.g., 7, 14, 21).
 * @return {void}
 */
function addAwardedShieldMilestone( milestone ) {
	const milestones = getAwardedShieldMilestones();
	milestones.add( milestone );
	domainStorage.setShieldMilestones(milestones);
}

/**
 * Award a shield for completing a week.
 *
 * @return {void}
 */
function awardShield() {
	const current = getShields();
	if ( current < MAX_SHIELDS ) {
		domainStorage.setShieldCount(current + 1);
		updateShieldDisplay();
		// Show notification
		showShieldNotification( 'Neuer Schutzschild verdient! 🛡️' );
	}
}


/**
 * Update the shield display in the UI.
 *
 * @return {void}
 */
function updateShieldDisplay() {
	const shields = getShields();
	const containers = [
		document.getElementById( 'shields-container' ),
		document.getElementById( 'shields-container-modal' )
	];

	containers.forEach( container => {
		if ( ! container ) {
			return;
		}

		container.innerHTML = '';
		for ( let i = 0; i < MAX_SHIELDS; i++ ) {
			const shield = document.createElement( 'span' );
			shield.className = 'text-xl';
			shield.innerText = i < shields ? '🛡️' : '⚪';
			shield.title = i < shields ? 'Schutzschild verfügbar' : 'Kein Schutzschild';
			container.appendChild( shield );
		}
	} );
}

/**
 * Show a notification message (temporary).
 *
 * @param {string} message - The message to display.
 * @return {void}
 */
function showShieldNotification( message ) {
	const notification = document.createElement( 'div' );
	notification.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce';
	notification.innerText = message;
	document.body.appendChild( notification );
	setTimeout( () => {
		notification.remove();
	}, 3000 );
}

/**
 * Show the sick mode modal.
 *
 * @return {void}
 */
function showSickModeModal() {
	const modal = document.getElementById( 'sick-mode-modal' );
	if ( modal ) {
		modal.classList.add( 'open' );
		updateShieldDisplay();
	}
}

/**
 * Close the sick mode modal.
 *
 * @return {void}
 */
function closeSickModeModal() {
	const modal = document.getElementById( 'sick-mode-modal' );
	if ( modal ) {
		modal.classList.remove( 'open' );
	}
}

/**
 * Activate recovery mode for today.
 *
 * Marks today as a recovery day, disables normal exercises, and shows
 * recovery activities instead.
 *
 * @return {void}
 */
function activateRecoveryMode() {
	const today = getLocalISODate( new Date() );
	domainStorage.setRecoveryDay(today);
	closeSickModeModal();
	renderSchedule(); // Re-render to show recovery activities
}

/**
 * Use a shield for severe illness.
 *
 * Uses a shield to mark today as sick day with only hydration requirement.
 * Can also be used without shield, which will break the streak.
 *
 * @return {void}
 */
function useSickShield() {
	const shields = getShields();
	const today = getLocalISODate( new Date() );

	// Check if already in recovery or sick mode today
	if ( domainStorage.isRecoveryDay(today) ) {
		alert( 'Heute ist bereits als Recovery-Tag markiert!' );
		return;
	}

	if ( domainStorage.isSickDay(today) ) {
		alert( 'Heute ist bereits als Krank-Tag markiert!' );
		return;
	}

	if ( shields === 0 ) {
		// No shields available - offer to use sick mode without shield
		if ( confirm( '⚠️ Keine Schutzschilder verfügbar!\n\nMöchtest du trotzdem den Krank-Modus aktivieren?\n\nDein Streak wird unterbrochen, aber du kannst die Krankheit dokumentieren.' ) ) {
			// Mark as sick day without shield
			domainStorage.setSickDay(today, false);
			closeSickModeModal();
			renderSchedule();
			alert( '✅ Krank-Modus aktiviert (ohne Schild).\n\nGute Besserung! Trinke heute ausreichend Wasser/Tee.\n\n⚠️ Dein Streak wird unterbrochen.' );
		}
		return;
	}

	// Shields available - ask to use one
	if ( confirm( `Einen Schutzschild verwenden?\n\nDu hast noch ${shields} Schild(e) verfügbar.\nDer Tag wird als Ruhetag gezählt und dein Streak bleibt erhalten.\n\n(Alternativ: Abbrechen und ohne Schild fortfahren - Streak bricht)` ) ) {
		// Mark as sick day with shield
		domainStorage.setSickDay(today, true);
		// Decrement shields
		domainStorage.setShieldCount(shields - 1);
		updateShieldDisplay();
		closeSickModeModal();
		renderSchedule();
		alert( '✅ Schutzschild aktiviert! Gute Besserung!\n\nTrinke heute ausreichend Wasser/Tee.\n\n✅ Dein Streak bleibt erhalten.' );
	} else {
		// User cancelled - ask if they want to use without shield
		if ( confirm( '⚠️ Ohne Schild fortfahren?\n\nDein Streak wird unterbrochen, aber du kannst die Krankheit dokumentieren.' ) ) {
			domainStorage.setSickDay(today, false);
			closeSickModeModal();
			renderSchedule();
			alert( '✅ Krank-Modus aktiviert (ohne Schild).\n\nGute Besserung!\n\n⚠️ Dein Streak wird unterbrochen.' );
		}
	}
}

/**
 * Return to normal training mode from recovery or sick mode.
 *
 * Removes recovery/sick mode flags and restores normal exercises.
 * Requires confirmation. Also refunds shield if it was used today.
 *
 * @param {string} dateIso - ISO date string of the day.
 * @return {void}
 */
function backToNormal( dateIso ) {
	if ( ! confirm( 'Zurück zum normalen Training?\n\nAlle Recovery- oder Krank-Aktivitäten werden entfernt und normale Übungen wiederhergestellt.' ) ) {
		return;
	}

	// Check if shield was used and refund it
	const usedShield = domainStorage.wasSickDayShieldUsed(dateIso);
	if ( usedShield ) {
		const shields = getShields();
		if ( shields < MAX_SHIELDS ) {
			domainStorage.setShieldCount(shields + 1);
			updateShieldDisplay();
		}
	}

	// Remove all recovery activities
	recoveryActivities.forEach( activity => {
		domainStorage.removeRecoveryActivity(dateIso, activity.id);
	} );
	domainStorage.removeRecoveryDay(dateIso);

	// Remove sick day data
	domainStorage.removeSickDay(dateIso);

	// Re-render to show normal day
	renderSchedule();
	calculateStreak();

	alert( '✅ Zurück zum normalen Training!' + ( usedShield ? '\n🛡️ Schild wurde zurückerstattet.' : '' ) );
}

// --- EXPOSE FUNCTIONS TO GLOBAL SCOPE FOR INLINE EVENT HANDLERS ---
// Since app.js is now a module, functions are not automatically global.
// We need to explicitly expose functions that are called from inline HTML event handlers.

// Expose domainStorage for inline scripts (introduction modal, etc.)
window.domainStorage = domainStorage;

// Wrap closeIntroModal to pass domainStorage dependency
window.closeIntroModal = function() {
	closeIntroModal( domainStorage );
};

window.toggleCheck = toggleCheck;
window.closeMenuOutside = closeMenuOutside;
window.closeModal = closeModal;
window.toggleMenu = toggleMenu;
window.showSickModeModal = showSickModeModal;
window.exportData = exportData;
window.triggerImport = triggerImport;
window.forceUpdate = forceUpdate;
window.toggleDebugMode = toggleDebugMode;
window.updateDebugToggleButton = updateDebugToggleButton;
window.changeWeek = changeWeek;
window.goToToday = goToToday;
window.toggleTimer = toggleTimer;
window.activateRecoveryMode = activateRecoveryMode;
window.useSickShield = useSickShield;
window.closeSickModeModal = closeSickModeModal;
window.abortRepCounter = abortRepCounter;
window.startSpecificTimer = startSpecificTimer;
window.startRepCounter = startRepCounter;
window.backToNormal = backToNormal;
window.importData = importData;
window.miniConfetti = miniConfetti;
window.toggleAccordion = toggleAccordion;
window.toggleUnit = toggleUnit;
window.handleWeightBlur = handleWeightBlur;
window.saveNote = saveNote;
window.saveWeight = saveWeight;

// START APP
window.onload = initApp;

