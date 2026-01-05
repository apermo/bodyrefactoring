/**
 * State Manager
 *
 * Centralized application state management.
 * Single source of truth for all app state.
 *
 * @package BodyRefactoring
 * @since 13.0.0
 */

/**
 * State Manager class.
 *
 * Manages global application state with reactive updates.
 */
export class StateManager {
	/**
	 * Constructor.
	 */
	constructor() {
		// Schedule state
		this.availableSchedules = [];
		this.scheduleCache = {};
		this.startDate = null;
		this.currentWeekOffset = 0;

		// Timer state
		this.timer = {
			interval: null,
			isRunning: false,
			timeLeft: 0,
			currentLabel: ''
		};

		// Rep counter state
		this.repCounter = {
			active: false,
			interval: null,
			countdownInterval: null,
			startTimeout: null,
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

		// State change listeners
		this.listeners = new Map();
	}

	/**
	 * Subscribe to state changes.
	 *
	 * @param {string} key - State key to watch.
	 * @param {Function} callback - Callback function.
	 * @return {Function} Unsubscribe function.
	 */
	subscribe( key, callback ) {
		if ( ! this.listeners.has( key ) ) {
			this.listeners.set( key, [] );
		}

		this.listeners.get( key ).push( callback );

		// Return unsubscribe function
		return () => {
			const callbacks = this.listeners.get( key );
			const index = callbacks.indexOf( callback );
			if ( index > -1 ) {
				callbacks.splice( index, 1 );
			}
		};
	}

	/**
	 * Notify listeners of state change.
	 *
	 * @param {string} key - State key that changed.
	 * @param {*} value - New value.
	 * @return {void}
	 */
	notify( key, value ) {
		if ( this.listeners.has( key ) ) {
			this.listeners.get( key ).forEach( ( callback ) => {
				try {
					callback( value );
				} catch ( error ) {
					console.error( `[StateManager] Listener error for "${key}":`, error );
				}
			} );
		}
	}

	// Schedule state getters/setters

	/**
	 * Get available schedules.
	 *
	 * @return {Array} Available schedules.
	 */
	getAvailableSchedules() {
		return this.availableSchedules;
	}

	/**
	 * Set available schedules.
	 *
	 * @param {Array} schedules - Schedule list.
	 * @return {void}
	 */
	setAvailableSchedules( schedules ) {
		this.availableSchedules = schedules;
		this.notify( 'availableSchedules', schedules );
	}

	/**
	 * Get schedule from cache.
	 *
	 * @param {string} file - Schedule filename.
	 * @return {Array|null} Cached schedule or null.
	 */
	getCachedSchedule( file ) {
		return this.scheduleCache[ file ] || null;
	}

	/**
	 * Set schedule in cache.
	 *
	 * @param {string} file - Schedule filename.
	 * @param {Array} schedule - Schedule data.
	 * @return {void}
	 */
	setCachedSchedule( file, schedule ) {
		this.scheduleCache[ file ] = schedule;
	}

	/**
	 * Get start date.
	 *
	 * @return {Date|null} Start date.
	 */
	getStartDate() {
		return this.startDate;
	}

	/**
	 * Set start date.
	 *
	 * @param {Date} date - Start date.
	 * @return {void}
	 */
	setStartDate( date ) {
		this.startDate = date;
		this.notify( 'startDate', date );
	}

	/**
	 * Get current week offset.
	 *
	 * @return {number} Week offset.
	 */
	getCurrentWeekOffset() {
		return this.currentWeekOffset;
	}

	/**
	 * Set current week offset.
	 *
	 * @param {number} offset - Week offset.
	 * @return {void}
	 */
	setCurrentWeekOffset( offset ) {
		this.currentWeekOffset = offset;
		this.notify( 'currentWeekOffset', offset );
	}

	/**
	 * Change week by direction.
	 *
	 * @param {number} direction - Direction (-1 or 1).
	 * @return {void}
	 */
	changeWeek( direction ) {
		this.currentWeekOffset += direction;
		this.notify( 'currentWeekOffset', this.currentWeekOffset );
	}

	// Timer state getters/setters

	/**
	 * Get timer state.
	 *
	 * @return {Object} Timer state.
	 */
	getTimerState() {
		return this.timer;
	}

	/**
	 * Set timer running state.
	 *
	 * @param {boolean} isRunning - Running state.
	 * @return {void}
	 */
	setTimerRunning( isRunning ) {
		this.timer.isRunning = isRunning;
		this.notify( 'timer.isRunning', isRunning );
	}

	/**
	 * Set timer interval.
	 *
	 * @param {number|null} interval - Interval ID.
	 * @return {void}
	 */
	setTimerInterval( interval ) {
		this.timer.interval = interval;
	}

	/**
	 * Set timer time left.
	 *
	 * @param {number} seconds - Seconds remaining.
	 * @return {void}
	 */
	setTimerTimeLeft( seconds ) {
		this.timer.timeLeft = seconds;
		this.notify( 'timer.timeLeft', seconds );
	}

	/**
	 * Set timer label.
	 *
	 * @param {string} label - Timer label.
	 * @return {void}
	 */
	setTimerLabel( label ) {
		this.timer.currentLabel = label;
		this.notify( 'timer.label', label );
	}

	/**
	 * Reset timer state.
	 *
	 * @return {void}
	 */
	resetTimer() {
		if ( this.timer.interval ) {
			clearInterval( this.timer.interval );
		}

		this.timer.interval = null;
		this.timer.isRunning = false;
		this.timer.timeLeft = 0;
		this.timer.currentLabel = '';

		this.notify( 'timer.reset', true );
	}

	// Rep counter state getters/setters

	/**
	 * Get rep counter state.
	 *
	 * @return {Object} Rep counter state.
	 */
	getRepCounterState() {
		return this.repCounter;
	}

	/**
	 * Set rep counter active state.
	 *
	 * @param {boolean} active - Active state.
	 * @return {void}
	 */
	setRepCounterActive( active ) {
		this.repCounter.active = active;
		this.notify( 'repCounter.active', active );
	}

	/**
	 * Initialize rep counter with exercise data.
	 *
	 * @param {Object} config - Rep counter configuration.
	 * @return {void}
	 */
	initRepCounter( config ) {
		this.repCounter = {
			...this.repCounter,
			...config,
			active: true,
			interval: null,
			countdownInterval: null,
			startTimeout: null
		};

		this.notify( 'repCounter.init', config );
	}

	/**
	 * Update rep counter progress.
	 *
	 * @param {number} set - Current set.
	 * @param {number} rep - Current rep.
	 * @return {void}
	 */
	updateRepCounterProgress( set, rep ) {
		this.repCounter.currentSet = set;
		this.repCounter.currentRep = rep;
		this.notify( 'repCounter.progress', { set, rep } );
	}

	/**
	 * Reset rep counter state.
	 *
	 * @return {void}
	 */
	resetRepCounter() {
		// Clear all intervals and timeouts
		if ( this.repCounter.interval ) {
			clearInterval( this.repCounter.interval );
		}
		if ( this.repCounter.countdownInterval ) {
			clearInterval( this.repCounter.countdownInterval );
		}
		if ( this.repCounter.startTimeout ) {
			clearTimeout( this.repCounter.startTimeout );
		}

		this.repCounter = {
			active: false,
			interval: null,
			countdownInterval: null,
			startTimeout: null,
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

		this.notify( 'repCounter.reset', true );
	}
}

