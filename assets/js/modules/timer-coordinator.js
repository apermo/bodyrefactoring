/**
 * Timer Coordinator
 *
 * Centralized management of all timers, timeouts, and speech synthesis.
 * Ensures clean cleanup and prevents orphaned timers/speech commands.
 *
 * @package BodyRefactoring
 * @since 13.0.0
 */

import { SpeechService } from './speech-service.js';

/**
 * Timer Coordinator class.
 *
 * Manages all timing operations and speech synthesis to prevent conflicts.
 */
export class TimerCoordinator {
	/**
	 * Constructor.
	 */
	constructor() {
		this.intervals = new Map();
		this.timeouts = new Map();
		this.speechService = new SpeechService();
		this.activeOperation = null; // 'timer' | 'rep_counter' | null
	}

	/**
	 * Set interval with tracking.
	 *
	 * @param {Function} callback - Function to call repeatedly.
	 * @param {number} delay - Delay in milliseconds.
	 * @param {string} id - Unique identifier for this interval.
	 * @return {number} Interval ID.
	 */
	setInterval(callback, delay, id) {
		// Clear any existing interval with same ID
		this.clearInterval(id);

		const intervalId = setInterval(callback, delay);
		this.intervals.set(id, intervalId);
		return intervalId;
	}

	/**
	 * Clear specific interval.
	 *
	 * @param {string} id - Interval identifier.
	 * @return {void}
	 */
	clearInterval(id) {
		if (this.intervals.has(id)) {
			clearInterval(this.intervals.get(id));
			this.intervals.delete(id);
		}
	}

	/**
	 * Set timeout with tracking.
	 *
	 * @param {Function} callback - Function to call after delay.
	 * @param {number} delay - Delay in milliseconds.
	 * @param {string} id - Unique identifier for this timeout.
	 * @return {number} Timeout ID.
	 */
	setTimeout(callback, delay, id) {
		// Clear any existing timeout with same ID
		this.clearTimeout(id);

		const timeoutId = setTimeout(callback, delay);
		this.timeouts.set(id, timeoutId);
		return timeoutId;
	}

	/**
	 * Clear specific timeout.
	 *
	 * @param {string} id - Timeout identifier.
	 * @return {void}
	 */
	clearTimeout(id) {
		if (this.timeouts.has(id)) {
			clearTimeout(this.timeouts.get(id));
			this.timeouts.delete(id);
		}
	}

	/**
	 * Clear all intervals.
	 *
	 * @return {void}
	 */
	clearAllIntervals() {
		this.intervals.forEach((intervalId) => {
			clearInterval(intervalId);
		});
		this.intervals.clear();
	}

	/**
	 * Clear all timeouts.
	 *
	 * @return {void}
	 */
	clearAllTimeouts() {
		this.timeouts.forEach((timeoutId) => {
			clearTimeout(timeoutId);
		});
		this.timeouts.clear();
	}

	/**
	 * Speak text through centralized speech service.
	 *
	 * @param {string} text - Text to speak.
	 * @return {Promise<void>} Resolves when speech complete.
	 */
	async speak(text) {
		return this.speechService.speak(text);
	}

	/**
	 * Cancel all speech immediately.
	 *
	 * @return {void}
	 */
	cancelSpeech() {
		this.speechService.cancel();
	}

	/**
	 * Complete reset - clears everything.
	 *
	 * Call this when stopping any operation to ensure clean state.
	 *
	 * @return {void}
	 */
	reset() {
		this.clearAllIntervals();
		this.clearAllTimeouts();
		this.cancelSpeech();
		this.activeOperation = null;
	}

	/**
	 * Start timer operation.
	 *
	 * Resets everything and marks timer as active.
	 *
	 * @return {void}
	 */
	startTimer() {
		this.reset();
		this.activeOperation = 'timer';
	}

	/**
	 * Start rep counter operation.
	 *
	 * Resets everything and marks rep counter as active.
	 *
	 * @return {void}
	 */
	startRepCounter() {
		this.reset();
		this.activeOperation = 'rep_counter';
	}

	/**
	 * Stop current operation.
	 *
	 * Resets everything and clears active operation.
	 *
	 * @return {void}
	 */
	stop() {
		this.reset();
	}

	/**
	 * Get active operation type.
	 *
	 * @return {string|null} Current operation ('timer', 'rep_counter', or null).
	 */
	getActiveOperation() {
		return this.activeOperation;
	}

	/**
	 * Check if timer is active.
	 *
	 * @return {boolean} True if timer is running.
	 */
	isTimerActive() {
		return this.activeOperation === 'timer';
	}

	/**
	 * Check if rep counter is active.
	 *
	 * @return {boolean} True if rep counter is running.
	 */
	isRepCounterActive() {
		return this.activeOperation === 'rep_counter';
	}
}

