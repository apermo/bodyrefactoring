/**
 * Domain Storage Service
 *
 * Provides domain-specific storage operations for Body Refactoring app.
 * Encapsulates key structure and type conversions.
 *
 * @package BodyRefactoring
 * @since 13.0.0
 */

import { STORAGE_KEYS } from './constants.js';

/**
 * Domain Storage Service class.
 *
 * High-level storage API with domain-specific methods.
 * Hides key structure and provides type-safe operations.
 */
export class DomainStorageService {
	/**
	 * Constructor.
	 *
	 * @param {Object} storage - Generic storage service instance.
	 */
	constructor(storage) {
		this.storage = storage;
	}

	// --- Exercise Completion ---

	/**
	 * Check if exercise is completed.
	 *
	 * @param {string} date - ISO date string.
	 * @param {string} exerciseId - Exercise ID.
	 * @return {boolean} True if completed.
	 */
	isExerciseComplete(date, exerciseId) {
		const key = `${STORAGE_KEYS.PREFIX}${date}_${exerciseId}`;
		return this.storage.get(key) === 'true';
	}

	/**
	 * Mark exercise as completed.
	 *
	 * @param {string} date - ISO date string.
	 * @param {string} exerciseId - Exercise ID.
	 * @return {void}
	 */
	setExerciseComplete(date, exerciseId) {
		const key = `${STORAGE_KEYS.PREFIX}${date}_${exerciseId}`;
		this.storage.set(key, 'true');
	}

	/**
	 * Mark exercise as incomplete (remove completion).
	 *
	 * @param {string} date - ISO date string.
	 * @param {string} exerciseId - Exercise ID.
	 * @return {void}
	 */
	setExerciseIncomplete(date, exerciseId) {
		const key = `${STORAGE_KEYS.PREFIX}${date}_${exerciseId}`;
		this.storage.remove(key);
	}

	// --- Recovery Mode ---

	/**
	 * Check if date is recovery day.
	 *
	 * @param {string} date - ISO date string.
	 * @return {boolean} True if recovery day.
	 */
	isRecoveryDay(date) {
		const key = `${STORAGE_KEYS.RECOVERY_PREFIX}${date}_active`;
		return this.storage.get(key) === 'true';
	}

	/**
	 * Set date as recovery day.
	 *
	 * @param {string} date - ISO date string.
	 * @return {void}
	 */
	setRecoveryDay(date) {
		const key = `${STORAGE_KEYS.RECOVERY_PREFIX}${date}_active`;
		this.storage.set(key, 'true');
	}

	/**
	 * Remove recovery day status.
	 *
	 * @param {string} date - ISO date string.
	 * @return {void}
	 */
	removeRecoveryDay(date) {
		const key = `${STORAGE_KEYS.RECOVERY_PREFIX}${date}_active`;
		this.storage.remove(key);
	}

	/**
	 * Check if recovery activity is completed.
	 *
	 * @param {string} date - ISO date string.
	 * @param {string} activityId - Activity ID.
	 * @return {boolean} True if completed.
	 */
	isRecoveryActivityComplete(date, activityId) {
		const key = `${STORAGE_KEYS.RECOVERY_PREFIX}${date}_${activityId}`;
		return this.storage.get(key) === 'true';
	}

	/**
	 * Set recovery activity as completed.
	 *
	 * @param {string} date - ISO date string.
	 * @param {string} activityId - Activity ID.
	 * @return {void}
	 */
	setRecoveryActivityComplete(date, activityId) {
		const key = `${STORAGE_KEYS.RECOVERY_PREFIX}${date}_${activityId}`;
		this.storage.set(key, 'true');
	}

	/**
	 * Remove recovery activity.
	 *
	 * @param {string} date - ISO date string.
	 * @param {string} activityId - Activity ID.
	 * @return {void}
	 */
	removeRecoveryActivity(date, activityId) {
		const key = `${STORAGE_KEYS.RECOVERY_PREFIX}${date}_${activityId}`;
		this.storage.remove(key);
	}

	// --- Sick Mode ---

	/**
	 * Check if date is sick day.
	 *
	 * @param {string} date - ISO date string.
	 * @return {boolean} True if sick day.
	 */
	isSickDay(date) {
		const key = `${STORAGE_KEYS.SICK_PREFIX}${date}_active`;
		return this.storage.get(key) === 'true';
	}

	/**
	 * Set date as sick day.
	 *
	 * @param {string} date - ISO date string.
	 * @param {boolean} withShield - Whether shield is used.
	 * @return {void}
	 */
	setSickDay(date, withShield = false) {
		this.storage.set(`${STORAGE_KEYS.SICK_PREFIX}${date}_active`, 'true');
		this.storage.set(`${STORAGE_KEYS.SICK_PREFIX}${date}_shield`, withShield ? 'true' : 'false');
	}

	/**
	 * Check if shield was used for sick day.
	 *
	 * @param {string} date - ISO date string.
	 * @return {boolean} True if shield used.
	 */
	wasSickDayShieldUsed(date) {
		const key = `${STORAGE_KEYS.SICK_PREFIX}${date}_shield`;
		return this.storage.get(key) === 'true';
	}

	/**
	 * Remove sick day status.
	 *
	 * @param {string} date - ISO date string.
	 * @return {void}
	 */
	removeSickDay(date) {
		this.storage.remove(`${STORAGE_KEYS.SICK_PREFIX}${date}_active`);
		this.storage.remove(`${STORAGE_KEYS.SICK_PREFIX}${date}_shield`);
		this.storage.remove(`${STORAGE_KEYS.SICK_PREFIX}${date}_hydration`);
	}

	/**
	 * Check if hydration is completed on sick day.
	 *
	 * @param {string} date - ISO date string.
	 * @return {boolean} True if hydration completed.
	 */
	isSickDayHydrationComplete(date) {
		const key = `${STORAGE_KEYS.SICK_PREFIX}${date}_hydration`;
		return this.storage.get(key) === 'true';
	}

	// --- Notes ---

	/**
	 * Get note for date.
	 *
	 * @param {string} date - ISO date string.
	 * @return {string} Note content or empty string.
	 */
	getNote(date) {
		const key = `${STORAGE_KEYS.NOTE_PREFIX}${date}`;
		return this.storage.get(key) || '';
	}

	/**
	 * Save note for date.
	 *
	 * @param {string} date - ISO date string.
	 * @param {string} content - Note content.
	 * @return {void}
	 */
	setNote(date, content) {
		const key = `${STORAGE_KEYS.NOTE_PREFIX}${date}`;
		this.storage.set(key, content);
	}

	// --- Weights ---

	/**
	 * Get weight for exercise on date.
	 *
	 * @param {string} exerciseId - Exercise ID.
	 * @param {string} date - ISO date string.
	 * @return {string|null} Weight value or null.
	 */
	getWeight(exerciseId, date) {
		const key = `${STORAGE_KEYS.WEIGHT_PREFIX}${exerciseId}_${date}`;
		return this.storage.get(key);
	}

	/**
	 * Set weight for exercise on date.
	 *
	 * @param {string} exerciseId - Exercise ID.
	 * @param {string} date - ISO date string.
	 * @param {string|number} weight - Weight value.
	 * @return {void}
	 */
	setWeight(exerciseId, date, weight) {
		const key = `${STORAGE_KEYS.WEIGHT_PREFIX}${exerciseId}_${date}`;
		this.storage.set(key, weight.toString());
	}

	// --- Units ---

	/**
	 * Get unit for exercise (KG or STUFE).
	 *
	 * @param {string} exerciseId - Exercise ID.
	 * @return {string|null} Unit or null if not set.
	 */
	getUnit(exerciseId) {
		const key = `${STORAGE_KEYS.UNIT_PREFIX}${exerciseId}`;
		return this.storage.get(key);
	}

	/**
	 * Set unit for exercise.
	 *
	 * @param {string} exerciseId - Exercise ID.
	 * @param {string} unit - Unit (KG or STUFE).
	 * @return {void}
	 */
	setUnit(exerciseId, unit) {
		const key = `${STORAGE_KEYS.UNIT_PREFIX}${exerciseId}`;
		this.storage.set(key, unit);
	}

	// --- Shields ---

	/**
	 * Get number of shields.
	 *
	 * @return {number} Number of shields.
	 */
	getShieldCount() {
		return parseInt(this.storage.get(STORAGE_KEYS.SHIELDS) || '0');
	}

	/**
	 * Set number of shields.
	 *
	 * @param {number} count - Number of shields.
	 * @return {void}
	 */
	setShieldCount(count) {
		this.storage.set(STORAGE_KEYS.SHIELDS, count.toString());
	}

	/**
	 * Get awarded shield milestones.
	 *
	 * @return {Set<number>} Set of milestone numbers.
	 */
	getShieldMilestones() {
		const stored = this.storage.get(STORAGE_KEYS.SHIELDS_AWARDED);
		if (!stored) {
			return new Set();
		}
		try {
			const array = JSON.parse(stored);
			return new Set(array);
		} catch (e) {
			return new Set();
		}
	}

	/**
	 * Set shield milestones.
	 *
	 * @param {Set<number>} milestones - Set of milestone numbers.
	 * @return {void}
	 */
	setShieldMilestones(milestones) {
		this.storage.set(STORAGE_KEYS.SHIELDS_AWARDED, JSON.stringify(Array.from(milestones)));
	}

	// --- Direct Storage Access (for export/import) ---

	/**
	 * Get underlying storage service for direct access.
	 *
	 * Use only when necessary (e.g., export/import, iteration).
	 *
	 * @return {Object} Storage service instance.
	 */
	getUnderlyingStorage() {
		return this.storage;
	}
}

