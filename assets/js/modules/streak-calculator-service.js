/**
 * Streak Calculator Service
 *
 * Calculates workout streaks, handles shield awards, and manages streak display.
 * Integrates with recovery mode and sick day functionality.
 *
 * @package BodyRefactoring
 * @since 13.0.0
 */

import { STORAGE_KEYS, CONFIG } from './constants.js';
import { getLocalISODate } from './utils.js';

/**
 * Streak Calculator Service class.
 *
 * Manages streak calculations and shield rewards.
 */
export class StreakCalculatorService {
	/**
	 * Constructor.
	 *
	 * @param {Object} storage - Storage service instance.
	 * @param {Object} scheduleService - Schedule service instance.
	 */
	constructor( storage, scheduleService ) {
		this.storage = storage;
		this.scheduleService = scheduleService;
	}

	/**
	 * Calculate current streak.
	 *
	 * Counts consecutive days backwards from today where day is complete.
	 * Handles recovery mode and sick days with shields.
	 *
	 * @async
	 * @param {Function} isDayComplete - Function to check if day is complete.
	 * @param {Array} _recoveryActivities - Recovery activities array (unused).
	 * @return {Promise<number>} Current streak count.
	 */
	async calculateStreak( isDayComplete, _recoveryActivities ) {
		let streak = 0;
		let weekCounter = 0;
		const checkDate = new Date();
		const todayIso = getLocalISODate( checkDate );

		const awardedMilestones = this.getAwardedShieldMilestones();

		// Check today
		const config = await this.scheduleService.fetchScheduleForDate( todayIso );
		const dayIdx = checkDate.getDay();
		const dayData = config ? config.find( d => d.dayIndex === dayIdx ) : null;

		const todayComplete = dayData && isDayComplete( todayIso, dayData.details );
		const todayRecovery = this.storage.get( `${STORAGE_KEYS.RECOVERY_PREFIX}${todayIso}_active` ) === 'true' && isDayComplete( todayIso, [] );
		const todaySickWithShield = this.storage.get( `${STORAGE_KEYS.SICK_PREFIX}${todayIso}_active` ) === 'true' &&
			this.storage.get( `${STORAGE_KEYS.SICK_PREFIX}${todayIso}_shield` ) === 'true' &&
			isDayComplete( todayIso, [] );

		if ( todayComplete || todayRecovery || todaySickWithShield ) {
			streak++;
			if ( todayComplete ) {
				weekCounter++;
				if ( weekCounter % 7 === 0 && !awardedMilestones.has( weekCounter ) ) {
					this.awardShield();
					this.addAwardedShieldMilestone( weekCounter );
				}
			}
		}

		checkDate.setDate( checkDate.getDate() - 1 );

		// Check historical days
		while ( true ) {
			const dateStr = getLocalISODate( checkDate );
			if ( dateStr < getLocalISODate( this.scheduleService.getStartDate() ) ) {
				break;
			}

			const histConfig = await this.scheduleService.fetchScheduleForDate( dateStr );
			const histDayIdx = checkDate.getDay();
			const histDayData = histConfig ? histConfig.find( d => d.dayIndex === histDayIdx ) : null;

			const dayComplete = histDayData && isDayComplete( dateStr, histDayData.details );
			const recoveryComplete = this.storage.get( `${STORAGE_KEYS.RECOVERY_PREFIX}${dateStr}_active` ) === 'true' && isDayComplete( dateStr, [] );
			const sickDayWithShield = this.storage.get( `${STORAGE_KEYS.SICK_PREFIX}${dateStr}_active` ) === 'true' &&
				this.storage.get( `${STORAGE_KEYS.SICK_PREFIX}${dateStr}_shield` ) === 'true' &&
				isDayComplete( dateStr, [] );

			if ( dayComplete || recoveryComplete || sickDayWithShield ) {
				streak++;
				if ( dayComplete ) {
					weekCounter++;
					if ( weekCounter % 7 === 0 && !awardedMilestones.has( weekCounter ) ) {
						this.awardShield();
						this.addAwardedShieldMilestone( weekCounter );
					}
				}
				checkDate.setDate( checkDate.getDate() - 1 );
			} else {
				break;
			}
		}

		return streak;
	}

	/**
	 * Get number of available shields.
	 *
	 * @return {number} Number of shields (0-MAX_SHIELDS).
	 */
	getShields() {
		const shields = parseInt( this.storage.get( STORAGE_KEYS.SHIELDS ) || '0' );
		return Math.min( shields, CONFIG.MAX_SHIELDS );
	}

	/**
	 * Get awarded shield milestones.
	 *
	 * @return {Set<number>} Set of milestone numbers.
	 */
	getAwardedShieldMilestones() {
		const stored = this.storage.get( STORAGE_KEYS.SHIELDS_AWARDED );
		if ( !stored ) {
			return new Set();
		}
		try {
			const array = JSON.parse( stored );
			return new Set( array );
		} catch ( e ) {
			return new Set();
		}
	}

	/**
	 * Add milestone to awarded list.
	 *
	 * @param {number} milestone - Milestone number.
	 * @return {void}
	 */
	addAwardedShieldMilestone( milestone ) {
		const milestones = this.getAwardedShieldMilestones();
		milestones.add( milestone );
		this.storage.set( STORAGE_KEYS.SHIELDS_AWARDED, JSON.stringify( Array.from( milestones ) ) );
	}

	/**
	 * Award a shield.
	 *
	 * @return {void}
	 */
	awardShield() {
		const current = this.getShields();
		if ( current < CONFIG.MAX_SHIELDS ) {
			this.storage.set( STORAGE_KEYS.SHIELDS, ( current + 1 ).toString() );
		}
	}

	/**
	 * Use a shield (decrement count).
	 *
	 * @return {boolean} True if shield was used, false if none available.
	 */
	useShield() {
		const current = this.getShields();
		if ( current > 0 ) {
			this.storage.set( STORAGE_KEYS.SHIELDS, ( current - 1 ).toString() );
			return true;
		}
		return false;
	}

	/**
	 * Refund a shield (increment count).
	 *
	 * @return {void}
	 */
	refundShield() {
		const current = this.getShields();
		if ( current < CONFIG.MAX_SHIELDS ) {
			this.storage.set( STORAGE_KEYS.SHIELDS, ( current + 1 ).toString() );
		}
	}
}

