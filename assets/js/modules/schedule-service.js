/**
 * Schedule Service
 *
 * Handles schedule data fetching, caching, and week calculations.
 * Provides centralized access to schedule configuration.
 *
 * @package BodyRefactoring
 * @since 13.0.0
 */

/**
 * Schedule Service class.
 *
 * Manages schedule data operations and week navigation.
 */
export class ScheduleService {
	/**
	 * Constructor.
	 */
	constructor() {
		this.availableSchedules = [];
		this.scheduleCache = {};
		this.startDate = null;
		this.currentWeekOffset = 0;
	}

	/**
	 * Initialize schedule service with available schedules.
	 *
	 * @async
	 * @param {Array} schedules - Array of available schedules from backend.
	 * @return {Promise<void>}
	 */
	async initialize(schedules) {
		this.availableSchedules = schedules;
		if (schedules.length > 0) {
			this.startDate = new Date(schedules[0].date + 'T00:00:00');
		}
	}

	/**
	 * Get start date.
	 *
	 * @return {Date|null} Start date or null if not initialized.
	 */
	getStartDate() {
		return this.startDate;
	}

	/**
	 * Get current week offset.
	 *
	 * @return {number} Current week offset (0 = this week).
	 */
	getWeekOffset() {
		return this.currentWeekOffset;
	}

	/**
	 * Set current week offset.
	 *
	 * @param {number} offset - Week offset to set.
	 * @return {void}
	 */
	setWeekOffset(offset) {
		this.currentWeekOffset = offset;
	}

	/**
	 * Change week by direction.
	 *
	 * @param {number} direction - Direction to navigate (-1 = prev, 1 = next).
	 * @return {void}
	 */
	changeWeek(direction) {
		this.currentWeekOffset += direction;
	}

	/**
	 * Fetch schedule for a specific date.
	 *
	 * Finds the most recent schedule that applies to the given date.
	 * Implements caching to avoid repeated fetches.
	 *
	 * @async
	 * @param {string} dateStr - ISO date string (YYYY-MM-DD).
	 * @return {Promise<Array|null>} Array of day configurations or null.
	 */
	async fetchScheduleForDate(dateStr) {
		// Find latest schedule where schedule.date <= dateStr
		let bestMatch = null;
		for (const sched of this.availableSchedules) {
			if (sched.date <= dateStr) {
				bestMatch = sched;
			} else {
				break;
			}
		}

		if (!bestMatch) {
			return null;
		}

		// Check cache
		if (this.scheduleCache[bestMatch.file]) {
			return this.scheduleCache[bestMatch.file];
		}

		// Fetch
		const res = await fetch(`trainings/${bestMatch.file}`);
		const json = await res.json();

		// Handle versioned structure
		if (json.version !== 1) {
			console.error(`Unsupported schedule version: ${json.version}`);
			return null;
		}

		// Cache the days array
		this.scheduleCache[bestMatch.file] = json.days;
		return json.days;
	}

	/**
	 * Check if previous week navigation is allowed.
	 *
	 * @param {Date} mondayDate - Monday date of current displayed week.
	 * @return {boolean} True if can navigate to previous week.
	 */
	canNavigatePrevious(mondayDate) {
		if (!this.startDate) {
			return false;
		}

		const startDateClean = new Date(this.startDate);
		startDateClean.setHours(0, 0, 0, 0);

		return mondayDate > startDateClean;
	}

	/**
	 * Get week display text.
	 *
	 * @return {string} Week display text (e.g., "Aktuelle Woche", "+2 Wochen").
	 */
	getWeekDisplayText() {
		if (this.currentWeekOffset === 0) {
			return 'Aktuelle Woche';
		} else if (this.currentWeekOffset > 0) {
			return `+${this.currentWeekOffset} Wochen`;
		} else {
			return `${this.currentWeekOffset} Wochen`;
		}
	}
}

