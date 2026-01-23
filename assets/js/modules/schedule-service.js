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
		this.specialScheduleCache = {};
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
	async initialize( schedules ) {
		this.availableSchedules = schedules;
		if ( schedules.length > 0 ) {
			this.startDate = new Date( schedules[ 0 ].date + 'T00:00:00' );
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
	setWeekOffset( offset ) {
		this.currentWeekOffset = offset;
	}

	/**
	 * Change week by direction.
	 *
	 * @param {number} direction - Direction to navigate (-1 = prev, 1 = next).
	 * @return {void}
	 */
	changeWeek( direction ) {
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
	async fetchScheduleForDate( dateStr ) {
		// Find latest schedule where schedule.date <= dateStr
		let bestMatch = null;
		for ( const sched of this.availableSchedules ) {
			if ( sched.date <= dateStr ) {
				bestMatch = sched;
			} else {
				break;
			}
		}

		if ( !bestMatch ) {
			return null;
		}

		// Check cache
		if ( this.scheduleCache[ bestMatch.url ] ) {
			return this.scheduleCache[ bestMatch.url ];
		}

		// Fetch via API URL with cache busting via mtime
		const cacheBuster = bestMatch.mtime ? `&v=${bestMatch.mtime}` : '';
		const res = await fetch( `${bestMatch.url}${cacheBuster}` );
		const json = await res.json();

		// Handle versioned structure (support v1 and v2)
		if ( json.version !== 1 && json.version !== 2 ) {
			console.error( `Unsupported schedule version: ${json.version}` );
			return null;
		}

		// Cache the days array
		this.scheduleCache[ bestMatch.url ] = json.days;
		return json.days;
	}

	/**
	 * Fetch a special schedule (recovery, sick).
	 *
	 * Special schedules are static templates not tied to dates.
	 *
	 * @async
	 * @param {string} type - Schedule type ('recovery' or 'sick').
	 * @return {Promise<Object|null>} Day configuration or null.
	 */
	async fetchSpecialSchedule( type ) {
		const validTypes = [ 'recovery', 'sick' ];
		if ( ! validTypes.includes( type ) ) {
			console.error( `Invalid special schedule type: ${type}` );
			return null;
		}

		// Check cache
		if ( this.specialScheduleCache[ type ] ) {
			return this.specialScheduleCache[ type ];
		}

		// Fetch via API
		try {
			// Always use 'schedules' endpoint (regardless of where files are stored server-side)
			const res = await fetch( `schedules/?file=schedule-${type}.json` );
			if ( ! res.ok ) {
				console.error( `Failed to fetch schedule-${type}.json` );
				return null;
			}
			const json = await res.json();

			// Validate version
			if ( json.version !== 1 && json.version !== 2 ) {
				console.error( `Unsupported schedule version: ${json.version}` );
				return null;
			}

			// Cache the first day (special schedules have only one day)
			this.specialScheduleCache[ type ] = json.days[ 0 ];
			return json.days[ 0 ];
		} catch ( error ) {
			console.error( `Error fetching schedule-${type}.json:`, error );
			return null;
		}
	}

	/**
	 * Check if previous week navigation is allowed.
	 *
	 * @param {Date} mondayDate - Monday date of current displayed week.
	 * @return {boolean} True if can navigate to previous week.
	 */
	canNavigatePrevious( mondayDate ) {
		if ( !this.startDate ) {
			return false;
		}

		const startDateClean = new Date( this.startDate );
		startDateClean.setHours( 0, 0, 0, 0 );

		return mondayDate > startDateClean;
	}

	/**
	 * Get week display text.
	 *
	 * @return {string} Week display text (e.g., "Aktuelle Woche", "+2 Wochen").
	 */
	getWeekDisplayText() {
		if ( this.currentWeekOffset === 0 ) {
			return 'Aktuelle Woche';
		} else if ( this.currentWeekOffset > 0 ) {
			return `+${this.currentWeekOffset} Wochen`;
		} 
		return `${this.currentWeekOffset} Wochen`;
		
	}
}

