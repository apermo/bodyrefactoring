/**
 * Application Constants
 *
 * Centralized constants for the Body Refactoring application.
 * Includes storage keys, configuration values, and enums.
 *
 * @package BodyRefactoring
 * @since 13.0.0
 */

/**
 * LocalStorage key prefixes.
 *
 * @type {Object}
 */
export const STORAGE_KEYS = {
	PREFIX: 'body_refactoring_v1_',
	NOTE_PREFIX: 'body_refactoring_note_',
	WEIGHT_PREFIX: 'body_refactoring_weight_',
	UNIT_PREFIX: 'body_refactoring_unit_',
	SICK_PREFIX: 'body_refactoring_sick_',
	RECOVERY_PREFIX: 'body_refactoring_recovery_',
	SHIELDS: 'body_refactoring_shields',
	SHIELDS_AWARDED: 'body_refactoring_shields_awarded',
	INTRO_SEEN: 'body_refactoring_intro_seen',

	/**
	 * Generate exercise completion key.
	 *
	 * @param {string} date - ISO date string (YYYY-MM-DD).
	 * @param {string} exerciseId - Exercise identifier.
	 * @return {string} Storage key.
	 */
	exercise( date, exerciseId ) {
		return `${this.PREFIX}${date}_${exerciseId}`;
	},

	/**
	 * Generate note key.
	 *
	 * @param {string} date - ISO date string (YYYY-MM-DD).
	 * @return {string} Storage key.
	 */
	note( date ) {
		return `${this.NOTE_PREFIX}${date}`;
	},

	/**
	 * Generate weight key.
	 *
	 * @param {string} exerciseId - Exercise identifier.
	 * @param {string} date - ISO date string (YYYY-MM-DD).
	 * @return {string} Storage key.
	 */
	weight( exerciseId, date ) {
		return `${this.WEIGHT_PREFIX}${exerciseId}_${date}`;
	},

	/**
	 * Generate unit key.
	 *
	 * @param {string} exerciseId - Exercise identifier.
	 * @return {string} Storage key.
	 */
	unit( exerciseId ) {
		return `${this.UNIT_PREFIX}${exerciseId}`;
	},

	/**
	 * Generate recovery activity key.
	 *
	 * @param {string} date - ISO date string (YYYY-MM-DD).
	 * @param {string} activityId - Activity identifier.
	 * @return {string} Storage key.
	 */
	recovery( date, activityId ) {
		return `${this.RECOVERY_PREFIX}${date}_${activityId}`;
	},

	/**
	 * Generate recovery active flag key.
	 *
	 * @param {string} date - ISO date string (YYYY-MM-DD).
	 * @return {string} Storage key.
	 */
	recoveryActive( date ) {
		return `${this.RECOVERY_PREFIX}${date}_active`;
	},

	/**
	 * Generate sick day key.
	 *
	 * @param {string} date - ISO date string (YYYY-MM-DD).
	 * @param {string} field - Field name (active, shield, hydration).
	 * @return {string} Storage key.
	 */
	sick( date, field ) {
		return `${this.SICK_PREFIX}${date}_${field}`;
	}
};

/**
 * Application configuration.
 *
 * @type {Object}
 */
export const CONFIG = {
	MAX_SHIELDS: 3,
	SHIELD_AWARD_INTERVAL: 7, // Days
	DEBUG_MODE: window.location.hash === '#debug',
	SPLASH_SCREEN_FADE_DELAY: 800, // ms
	SPLASH_SCREEN_HIDE_DELAY: 1300, // ms
	SCROLL_DELAY: 200, // ms
	SCROLL_OFFSET: 140 // px
};

/**
 * Application states for the main state machine.
 *
 * @type {Object}
 */
export const APP_STATES = {
	INITIALIZING: 'initializing',
	SCHEDULE_VIEW: 'schedule_view',
	TIMER_ACTIVE: 'timer_active',
	REP_COUNTER_ACTIVE: 'rep_counter_active',
	MODAL_OPEN: 'modal_open'
};

/**
 * Timer states for the timer state machine.
 *
 * @type {Object}
 */
export const TIMER_STATES = {
	IDLE: 'idle',
	COUNTDOWN: 'countdown',
	RUNNING: 'running',
	REST_PERIOD: 'rest_period'
};

/**
 * Rep counter states for the rep counter state machine.
 *
 * @type {Object}
 */
export const REP_COUNTER_STATES = {
	INACTIVE: 'inactive',
	COUNTDOWN: 'countdown',
	SHOWING_GO: 'showing_go',
	COUNTING_REPS: 'counting',
	RESTING: 'resting',
	COMPLETED: 'completed'
};

/**
 * Modal types.
 *
 * @type {Object}
 */
export const MODAL_TYPES = {
	NONE: 'none',
	COMPLETION: 'completion',
	SICK_MODE: 'sick_mode',
	REP_COUNTER: 'rep_counter',
	MENU: 'menu'
};

/**
 * Motivational quotes for completion popup.
 *
 * @type {string[]}
 */
export const QUOTES = [
	'Stark! Wieder einen Tag geschafft.',
	'Konsistenz ist der Schlüssel zum Erfolg.',
	'Dein Zukunfts-Ich dankt dir.',
	'Keine Ausreden, nur Ergebnisse.',
	'Level Up! Du wirst jeden Tag besser.',
	'Schweiß ist nur Fett, das weint.',
	'Disziplin ist Freiheit.',
	'Ein Schritt näher am Ziel.'
];

/**
 * Recovery mode activities (light activities for sick days).
 *
 * @type {Object[]}
 */
export const RECOVERY_ACTIVITIES = [
	{ id: 'breathing', title: '5 Min Atemübungen', desc: 'Tiefes Ein- und Ausatmen' },
	{ id: 'stretching', title: 'Leichtes Stretching', desc: '5 Minuten sanfte Dehnübungen' },
	{ id: 'hydration', title: 'Flüssigkeitszufuhr', desc: '2 Liter Wasser/Tee trinken' }
];

