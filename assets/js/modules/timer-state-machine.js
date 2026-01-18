/**
 * Timer State Machine
 *
 * Manages timer and rep counter states with proper lifecycle management.
 * Handles countdown, running, rest periods, and completion states.
 *
 * @package BodyRefactoring
 * @since 13.0.0
 */

import { StateMachine } from './state-machine.js';
import { TIMER_STATES, REP_COUNTER_STATES } from './constants.js';

/**
 * Timer State Machine class.
 *
 * Manages simple timer states (60s pause, custom timers).
 */
export class TimerStateMachine extends StateMachine {
	/**
	 * Constructor.
	 */
	constructor() {
		super( TIMER_STATES, TIMER_STATES.IDLE );
		this.setupTransitions();
	}

	/**
	 * Set up allowed state transitions.
	 *
	 * @return {void}
	 */
	setupTransitions() {
		// From IDLE - can start countdown or go directly to running
		this.allow( TIMER_STATES.IDLE, [
			TIMER_STATES.COUNTDOWN,
			TIMER_STATES.RUNNING
		] );

		// From COUNTDOWN - can go to running or back to idle (cancelled)
		this.allow( TIMER_STATES.COUNTDOWN, [
			TIMER_STATES.RUNNING,
			TIMER_STATES.IDLE
		] );

		// From RUNNING - can return to idle or pause for ready check
		this.allow( TIMER_STATES.RUNNING, [
			TIMER_STATES.IDLE,
			TIMER_STATES.WAITING_READY
		] );

		// From WAITING_READY - can resume running or cancel to idle
		this.allow( TIMER_STATES.WAITING_READY, [
			TIMER_STATES.RUNNING,
			TIMER_STATES.IDLE
		] );

		// REST_PERIOD not used for simple timer
	}

	/**
	 * Start timer with optional countdown.
	 *
	 * @param {boolean} withCountdown - Whether to start with countdown.
	 * @return {boolean} True if transition successful.
	 */
	start( withCountdown = false ) {
		const targetState = withCountdown ? TIMER_STATES.COUNTDOWN : TIMER_STATES.RUNNING;
		return this.transition( targetState, { action: 'start' } );
	}

	/**
	 * Begin countdown.
	 *
	 * @return {boolean} True if transition successful.
	 */
	startCountdown() {
		return this.transition( TIMER_STATES.COUNTDOWN, { action: 'countdown' } );
	}

	/**
	 * Move from countdown to running.
	 *
	 * @return {boolean} True if transition successful.
	 */
	beginRunning() {
		return this.transition( TIMER_STATES.RUNNING, { action: 'begin_running' } );
	}

	/**
	 * Complete or cancel timer.
	 *
	 * @param {string} reason - Reason for stopping (completed, cancelled).
	 * @return {boolean} True if transition successful.
	 */
	stop( reason = 'completed' ) {
		return this.transition( TIMER_STATES.IDLE, { action: 'stop', reason } );
	}

	/**
	 * Check if timer is idle.
	 *
	 * @return {boolean} True if idle.
	 */
	isIdle() {
		return this.getState() === TIMER_STATES.IDLE;
	}

	/**
	 * Check if timer is in countdown.
	 *
	 * @return {boolean} True if in countdown.
	 */
	isCountingDown() {
		return this.getState() === TIMER_STATES.COUNTDOWN;
	}

	/**
	 * Check if timer is running.
	 *
	 * @return {boolean} True if running.
	 */
	isRunning() {
		return this.getState() === TIMER_STATES.RUNNING;
	}

	/**
	 * Check if timer is active (countdown or running).
	 *
	 * @return {boolean} True if active.
	 */
	isActive() {
		return this.isCountingDown() || this.isRunning() || this.isWaitingReady();
	}

	/**
	 * Pause timer for ready check at 5 seconds.
	 *
	 * @return {boolean} True if transition successful.
	 */
	pauseForReady() {
		return this.transition( TIMER_STATES.WAITING_READY, { action: 'pause_for_ready' } );
	}

	/**
	 * Resume from ready check.
	 *
	 * @return {boolean} True if transition successful.
	 */
	resumeFromReady() {
		return this.transition( TIMER_STATES.RUNNING, { action: 'resume_from_ready' } );
	}

	/**
	 * Check if timer is waiting for ready confirmation.
	 *
	 * @return {boolean} True if waiting for ready.
	 */
	isWaitingReady() {
		return this.getState() === TIMER_STATES.WAITING_READY;
	}
}

/**
 * Rep Counter State Machine class.
 *
 * Manages complex rep counter states with sets, reps, and rest periods.
 */
export class RepCounterStateMachine extends StateMachine {
	/**
	 * Constructor.
	 */
	constructor() {
		super( REP_COUNTER_STATES, REP_COUNTER_STATES.INACTIVE );
		this.setupTransitions();
	}

	/**
	 * Set up allowed state transitions.
	 *
	 * @return {void}
	 */
	setupTransitions() {
		// From INACTIVE - can only start with countdown
		this.allow( REP_COUNTER_STATES.INACTIVE, REP_COUNTER_STATES.COUNTDOWN );

		// From COUNTDOWN - can go to SHOWING_GO or back to INACTIVE (cancelled)
		this.allow( REP_COUNTER_STATES.COUNTDOWN, [
			REP_COUNTER_STATES.SHOWING_GO,
			REP_COUNTER_STATES.INACTIVE
		] );

		// From SHOWING_GO - can go to COUNTING_REPS or back to INACTIVE (cancelled)
		this.allow( REP_COUNTER_STATES.SHOWING_GO, [
			REP_COUNTER_STATES.COUNTING_REPS,
			REP_COUNTER_STATES.INACTIVE
		] );

		// From COUNTING_REPS - can go to RESTING, COMPLETED, or INACTIVE (cancelled)
		this.allow( REP_COUNTER_STATES.COUNTING_REPS, [
			REP_COUNTER_STATES.RESTING,
			REP_COUNTER_STATES.COMPLETED,
			REP_COUNTER_STATES.INACTIVE
		] );

		// From RESTING - can go back to COUNTING_REPS or INACTIVE (cancelled)
		this.allow( REP_COUNTER_STATES.RESTING, [
			REP_COUNTER_STATES.COUNTING_REPS,
			REP_COUNTER_STATES.INACTIVE
		] );

		// From COMPLETED - can only return to INACTIVE
		this.allow( REP_COUNTER_STATES.COMPLETED, REP_COUNTER_STATES.INACTIVE );
	}

	/**
	 * Start rep counter (begin countdown).
	 *
	 * @return {boolean} True if transition successful.
	 */
	start() {
		return this.transition( REP_COUNTER_STATES.COUNTDOWN, { action: 'start' } );
	}

	/**
	 * Show "Los!" message.
	 *
	 * @return {boolean} True if transition successful.
	 */
	showGo() {
		return this.transition( REP_COUNTER_STATES.SHOWING_GO, { action: 'show_go' } );
	}

	/**
	 * Begin counting reps.
	 *
	 * @return {boolean} True if transition successful.
	 */
	startCounting() {
		return this.transition( REP_COUNTER_STATES.COUNTING_REPS, { action: 'start_counting' } );
	}

	/**
	 * Enter rest period.
	 *
	 * @return {boolean} True if transition successful.
	 */
	startRest() {
		return this.transition( REP_COUNTER_STATES.RESTING, { action: 'start_rest' } );
	}

	/**
	 * Resume counting after rest.
	 *
	 * @return {boolean} True if transition successful.
	 */
	resumeCounting() {
		return this.transition( REP_COUNTER_STATES.COUNTING_REPS, { action: 'resume_counting' } );
	}

	/**
	 * Complete all sets.
	 *
	 * @return {boolean} True if transition successful.
	 */
	complete() {
		return this.transition( REP_COUNTER_STATES.COMPLETED, { action: 'complete' } );
	}

	/**
	 * Cancel and return to inactive.
	 *
	 * @param {string} reason - Reason for cancellation.
	 * @return {boolean} True if transition successful.
	 */
	cancel( reason = 'user_cancelled' ) {
		return this.transition( REP_COUNTER_STATES.INACTIVE, { action: 'cancel', reason } );
	}

	/**
	 * Reset to inactive state.
	 *
	 * @return {boolean} True if transition successful.
	 */
	reset() {
		return this.transition( REP_COUNTER_STATES.INACTIVE, { action: 'reset' } );
	}

	/**
	 * Check if inactive.
	 *
	 * @return {boolean} True if inactive.
	 */
	isInactive() {
		return this.getState() === REP_COUNTER_STATES.INACTIVE;
	}

	/**
	 * Check if in countdown.
	 *
	 * @return {boolean} True if in countdown.
	 */
	isCountingDown() {
		return this.getState() === REP_COUNTER_STATES.COUNTDOWN;
	}

	/**
	 * Check if showing "Go!" message.
	 *
	 * @return {boolean} True if showing go.
	 */
	isShowingGo() {
		return this.getState() === REP_COUNTER_STATES.SHOWING_GO;
	}

	/**
	 * Check if counting reps.
	 *
	 * @return {boolean} True if counting.
	 */
	isCounting() {
		return this.getState() === REP_COUNTER_STATES.COUNTING_REPS;
	}

	/**
	 * Check if in rest period.
	 *
	 * @return {boolean} True if resting.
	 */
	isResting() {
		return this.getState() === REP_COUNTER_STATES.RESTING;
	}

	/**
	 * Check if completed.
	 *
	 * @return {boolean} True if completed.
	 */
	isCompleted() {
		return this.getState() === REP_COUNTER_STATES.COMPLETED;
	}

	/**
	 * Check if active (any state except inactive).
	 *
	 * @return {boolean} True if active.
	 */
	isActive() {
		return ! this.isInactive();
	}
}

