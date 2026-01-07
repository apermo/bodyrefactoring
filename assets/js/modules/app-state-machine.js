/**
 * Application State Machine
 *
 * Manages high-level application states and transitions.
 * Prevents conflicting operations like running timer and rep counter simultaneously.
 *
 * @package BodyRefactoring
 * @since 13.1.0
 */

import { StateMachine } from './state-machine.js';
import { APP_STATES } from './constants.js';

/**
 * Application State Machine class.
 *
 * Orchestrates main application states and enforces valid transitions.
 */
export class AppStateMachine extends StateMachine {
	/**
	 * Constructor.
	 */
	constructor() {
		super( APP_STATES, APP_STATES.INITIALIZING );
		this.setupTransitions();
	}

	/**
	 * Set up allowed state transitions.
	 *
	 * @return {void}
	 */
	setupTransitions() {
		// From INITIALIZING - can only go to SCHEDULE_VIEW
		this.allow( APP_STATES.INITIALIZING, APP_STATES.SCHEDULE_VIEW );

		// From SCHEDULE_VIEW - can start timer, rep counter, or open modal
		this.allow( APP_STATES.SCHEDULE_VIEW, [
			APP_STATES.TIMER_ACTIVE,
			APP_STATES.REP_COUNTER_ACTIVE,
			APP_STATES.MODAL_OPEN
		] );

		// From TIMER_ACTIVE - can only return to schedule view
		this.allow( APP_STATES.TIMER_ACTIVE, APP_STATES.SCHEDULE_VIEW );

		// From REP_COUNTER_ACTIVE - can only return to schedule view
		this.allow( APP_STATES.REP_COUNTER_ACTIVE, APP_STATES.SCHEDULE_VIEW );

		// From MODAL_OPEN - can only return to schedule view
		this.allow( APP_STATES.MODAL_OPEN, APP_STATES.SCHEDULE_VIEW );
	}

	/**
	 * Check if timer can be started.
	 *
	 * @return {boolean} True if timer can start.
	 */
	canStartTimer() {
		return this.can( APP_STATES.TIMER_ACTIVE );
	}

	/**
	 * Check if rep counter can be started.
	 *
	 * @return {boolean} True if rep counter can start.
	 */
	canStartRepCounter() {
		return this.can( APP_STATES.REP_COUNTER_ACTIVE );
	}

	/**
	 * Check if modal can be opened.
	 *
	 * @return {boolean} True if modal can open.
	 */
	canOpenModal() {
		return this.can( APP_STATES.MODAL_OPEN );
	}

	/**
	 * Start timer (transition to TIMER_ACTIVE).
	 *
	 * @return {boolean} True if transition successful.
	 */
	startTimer() {
		return this.transition( APP_STATES.TIMER_ACTIVE, { action: 'start_timer' } );
	}

	/**
	 * Start rep counter (transition to REP_COUNTER_ACTIVE).
	 *
	 * @return {boolean} True if transition successful.
	 */
	startRepCounter() {
		return this.transition( APP_STATES.REP_COUNTER_ACTIVE, { action: 'start_rep_counter' } );
	}

	/**
	 * Open modal (transition to MODAL_OPEN).
	 *
	 * @param {string} modalType - Type of modal being opened.
	 * @return {boolean} True if transition successful.
	 */
	openModal( modalType = 'unknown' ) {
		return this.transition( APP_STATES.MODAL_OPEN, { action: 'open_modal', modalType } );
	}

	/**
	 * Return to schedule view.
	 *
	 * @param {string} reason - Reason for returning.
	 * @return {boolean} True if transition successful.
	 */
	returnToSchedule( reason = 'completed' ) {
		return this.transition( APP_STATES.SCHEDULE_VIEW, { action: 'return_to_schedule', reason } );
	}

	/**
	 * Force return to schedule view (emergency).
	 *
	 * Used for error recovery.
	 *
	 * @param {string} reason - Reason for forced return.
	 * @return {void}
	 */
	forceReturnToSchedule( reason = 'error' ) {
		this.forceTransition( APP_STATES.SCHEDULE_VIEW, { action: 'force_return', reason } );
	}

	/**
	 * Check if app is in schedule view.
	 *
	 * @return {boolean} True if in schedule view.
	 */
	isInScheduleView() {
		return this.getState() === APP_STATES.SCHEDULE_VIEW;
	}

	/**
	 * Check if timer is active.
	 *
	 * @return {boolean} True if timer active.
	 */
	isTimerActive() {
		return this.getState() === APP_STATES.TIMER_ACTIVE;
	}

	/**
	 * Check if rep counter is active.
	 *
	 * @return {boolean} True if rep counter active.
	 */
	isRepCounterActive() {
		return this.getState() === APP_STATES.REP_COUNTER_ACTIVE;
	}

	/**
	 * Check if modal is open.
	 *
	 * @return {boolean} True if modal open.
	 */
	isModalOpen() {
		return this.getState() === APP_STATES.MODAL_OPEN;
	}
}

