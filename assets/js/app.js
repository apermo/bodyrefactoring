/**
 * Body Refactoring App - Main JavaScript
 *
 * @package BodyRefactoring
 * @version 9.0.0
 */

// --- GLOBAL STATE ---
let currentWeekOffset = 0;
const STORAGE_PREFIX = 'body_refactoring_v1_';
const NOTE_PREFIX = 'body_refactoring_note_';
const WEIGHT_PREFIX = 'body_refactoring_weight_';
const UNIT_PREFIX = 'body_refactoring_unit_';

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

const quotes = [
	'Stark! Wieder einen Tag geschafft.',
	'Konsistenz ist der Schlüssel zum Erfolg.',
	'Dein Zukunfts-Ich dankt dir.',
	'Keine Ausreden, nur Ergebnisse.',
	'Level Up! Du wirst jeden Tag besser.',
	'Schweiß ist nur Fett, das weint.',
	'Disziplin ist Freiheit.',
	'Ein Schritt näher am Ziel.'
];

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
	try {
		const response = await fetch('trainings/index.php');
		if (!response.ok) {
			throw new Error('API Error');
		}

		state.availableSchedules = await response.json();

		if (state.availableSchedules.length > 0) {
			state.startDate = new Date(state.availableSchedules[0].date + 'T00:00:00');
			await renderSchedule(); // Initial render
			setTimeout(() => {
				document.getElementById('splash-screen').style.opacity = '0';
			}, 800);
			setTimeout(() => {
				document.getElementById('splash-screen').style.display = 'none';
			}, 1300);
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
 * Convert a Date object to ISO date string in local timezone.
 *
 * @param {Date} date - The date to convert.
 * @return {string} ISO date string (YYYY-MM-DD) in local timezone.
 */
function getLocalISODate(date) {
	const offset = date.getTimezoneOffset();
	const localDate = new Date(date.getTime() - (offset * 60 * 1000));
	return localDate.toISOString().split('T')[0];
}

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
		let isLocked = targetDate > today || diffDays > 3;
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
	const weekDisplay = document.getElementById('week-display');

	// Allow going back only if Monday is >= Global Start Date
	const mondayDate = computedSchedule[0].fullDateObj;
	const startDateClean = new Date(state.startDate);
	startDateClean.setHours(0, 0, 0, 0);

	btnPrev.disabled = mondayDate <= startDateClean;

	if (currentWeekOffset === 0) {
		weekDisplay.innerText = 'Aktuelle Woche';
	} else if (currentWeekOffset > 0) {
		weekDisplay.innerText = `+${currentWeekOffset} Wochen`;
	} else {
		weekDisplay.innerText = `${currentWeekOffset} Wochen`;
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
		day.details.forEach(ex => {
			const uniqueKey = `${STORAGE_PREFIX}${day.storageDate}_${ex.id}`;
			let isChecked = localStorage.getItem(uniqueKey) === 'true';

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

				let rightSide = '';
				if (ex.weight) {
					const unitKey = `${UNIT_PREFIX}${ex.id}`;
					const userUnit = localStorage.getItem(unitKey) || ex.defaultUnit || 'KG';
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
						</div>
						${rightSide}
					</div>
				`;
			}
		});

		const noteKey = `${NOTE_PREFIX}${day.storageDate}`;
		const savedNote = localStorage.getItem(noteKey) || '';
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
		const key = `${WEIGHT_PREFIX}${exerciseId}_${dateStr}`;
		const saved = localStorage.getItem(key);
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
	return localStorage.getItem(`${NOTE_PREFIX}${prevIso}`);
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
		localStorage.setItem(storageKey, 'true');
		miniConfetti(row.querySelector('.check-circle'));
	} else {
		localStorage.removeItem(storageKey);
	}
	checkDayCompletion(dateId);
	calculateStreak();
}

/**
 * Save a note to localStorage.
 *
 * @param {string} key - LocalStorage key.
 * @param {string} value - Note content.
 * @return {void}
 */
function saveNote(key, value) {
	localStorage.setItem(key, value);
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
	localStorage.setItem(`${WEIGHT_PREFIX}${exId}_${dateIso}`, value);
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
	localStorage.setItem(`${UNIT_PREFIX}${exId}`, newUnit);
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
 * Updates the streak display in the UI and modal.
 *
 * @async
 * @return {Promise<void>} Resolves when streak calculation is complete.
 */
async function calculateStreak() {
	let streak = 0;
	let checkDate = new Date();
	const todayIso = getLocalISODate(checkDate);

	// Check Today
	let config = await fetchScheduleForDate(todayIso);
	let dayIdx = checkDate.getDay();
	let dayData = config ? config.find(d => d.dayIndex === dayIdx) : null;

	if (dayData && isDayComplete(todayIso, dayData.details)) {
		streak++;
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

		if (dayData && isDayComplete(dateStr, dayData.details)) {
			streak++;
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
}

/**
 * Check if all exercises in a day are completed.
 *
 * @param {string} dateIso - ISO date string.
 * @param {Array} details - Array of exercise objects for the day.
 * @return {boolean} True if all exercises are completed, false otherwise.
 */
function isDayComplete(dateIso, details) {
	if (!details || details.length === 0) {
		return false;
	}
	return details.every(ex => {
		return localStorage.getItem(`${STORAGE_PREFIX}${dateIso}_${ex.id}`) === 'true';
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
 * @param {string} text - The text to speak.
 * @return {void}
 */
function speak(text) {
	if ('speechSynthesis' in window) {
		const utterance = new SpeechSynthesisUtterance(text);
		utterance.lang = 'de-DE';
		utterance.rate = 1.1;
		window.speechSynthesis.speak(utterance);
	}
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
	resetTimer();
	timeLeft = seconds;
	currentTimerLabel = label;
	document.getElementById('timer-text').innerText = label;
	const spokenLabel = getSpokenText(label);
	startTimerLogic(spokenLabel);
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
		timeLeft = 60;
		currentTimerLabel = '60s Pause';
		document.getElementById('timer-text').innerText = currentTimerLabel;
		startTimerLogic('60 Sekunden Pause');
	}
}

/**
 * Start the timer countdown logic.
 *
 * Enables NoSleep, announces start, updates UI every second,
 * provides time announcements, and triggers completion effects.
 *
 * @param {string} spokenTextStart - The spoken announcement text.
 * @return {void}
 */
function startTimerLogic(spokenTextStart) {
	enableNoSleep();
	speak(`${spokenTextStart} gestartet.`);
	isRunning = true;
	document.getElementById('fab-timer').classList.add('running');

	timerInterval = setInterval(() => {
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
	}, 1000);
}

/**
 * Reset the timer to default state.
 *
 * Stops the countdown, resets UI, cancels speech synthesis.
 *
 * @return {void}
 */
function resetTimer() {
	clearInterval(timerInterval);
	isRunning = false;
	document.getElementById('fab-timer').classList.remove('running');
	document.getElementById('fab-timer').innerHTML = '<i data-lucide="timer" class="w-6 h-6"></i><span id="timer-text">60s Pause</span>';
	lucide.createIcons();
	window.speechSynthesis.cancel();
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
		if (key.startsWith(STORAGE_PREFIX) || key.startsWith(NOTE_PREFIX) || key.startsWith(WEIGHT_PREFIX) || key.startsWith(UNIT_PREFIX)) {
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
				if (key.startsWith(STORAGE_PREFIX) || key.startsWith(NOTE_PREFIX) || key.startsWith(WEIGHT_PREFIX) || key.startsWith(UNIT_PREFIX)) {
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

// START APP
window.onload = initApp;

