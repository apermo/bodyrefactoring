/**
 * Modal State Machine
 *
 * Manages modal visibility and prevents multiple modals from being open simultaneously.
 *
 * @package BodyRefactoring
 * @since 13.1.0
 */

import { StateMachine } from './state-machine.js';
import { MODAL_TYPES } from './constants.js';

/**
 * Modal State Machine class.
 *
 * Ensures only one modal is open at a time.
 */
export class ModalStateMachine extends StateMachine {
	/**
	 * Constructor.
	 */
	constructor() {
		super( MODAL_TYPES, MODAL_TYPES.NONE );
		this.setupTransitions();
	}

	/**
	 * Set up allowed state transitions.
	 *
	 * @return {void}
	 */
	setupTransitions() {
		// From NONE - can open any modal
		this.allow( MODAL_TYPES.NONE, [
			MODAL_TYPES.COMPLETION,
			MODAL_TYPES.SICK_MODE,
			MODAL_TYPES.REP_COUNTER,
			MODAL_TYPES.MENU,
		] );

		// From any modal - can only close (return to NONE)
		this.allow( MODAL_TYPES.COMPLETION, MODAL_TYPES.NONE );
		this.allow( MODAL_TYPES.SICK_MODE, MODAL_TYPES.NONE );
		this.allow( MODAL_TYPES.REP_COUNTER, MODAL_TYPES.NONE );
		this.allow( MODAL_TYPES.MENU, MODAL_TYPES.NONE );
	}

	/**
	 * Open completion modal.
	 *
	 * @return {boolean} True if transition successful.
	 */
	openCompletion() {
		return this.transition( MODAL_TYPES.COMPLETION, { action: 'open_completion' } );
	}

	/**
	 * Open sick mode modal.
	 *
	 * @return {boolean} True if transition successful.
	 */
	openSickMode() {
		return this.transition( MODAL_TYPES.SICK_MODE, { action: 'open_sick_mode' } );
	}

	/**
	 * Open rep counter modal.
	 *
	 * @return {boolean} True if transition successful.
	 */
	openRepCounter() {
		return this.transition( MODAL_TYPES.REP_COUNTER, { action: 'open_rep_counter' } );
	}

	/**
	 * Open menu modal.
	 *
	 * @return {boolean} True if transition successful.
	 */
	openMenu() {
		return this.transition( MODAL_TYPES.MENU, { action: 'open_menu' } );
	}

	/**
	 * Close current modal.
	 *
	 * @return {boolean} True if transition successful.
	 */
	close() {
		return this.transition( MODAL_TYPES.NONE, { action: 'close' } );
	}

	/**
	 * Force close (emergency).
	 *
	 * @return {void}
	 */
	forceClose() {
		this.forceTransition( MODAL_TYPES.NONE, { action: 'force_close' } );
	}

	/**
	 * Check if any modal is open.
	 *
	 * @return {boolean} True if a modal is open.
	 */
	isOpen() {
		return this.getState() !== MODAL_TYPES.NONE;
	}

	/**
	 * Check if no modal is open.
	 *
	 * @return {boolean} True if no modal is open.
	 */
	isClosed() {
		return this.getState() === MODAL_TYPES.NONE;
	}

	/**
	 * Check if completion modal is open.
	 *
	 * @return {boolean} True if completion modal is open.
	 */
	isCompletionOpen() {
		return this.getState() === MODAL_TYPES.COMPLETION;
	}

	/**
	 * Check if sick mode modal is open.
	 *
	 * @return {boolean} True if sick mode modal is open.
	 */
	isSickModeOpen() {
		return this.getState() === MODAL_TYPES.SICK_MODE;
	}

	/**
	 * Check if rep counter modal is open.
	 *
	 * @return {boolean} True if rep counter modal is open.
	 */
	isRepCounterOpen() {
		return this.getState() === MODAL_TYPES.REP_COUNTER;
	}

	/**
	 * Check if menu is open.
	 *
	 * @return {boolean} True if menu is open.
	 */
	isMenuOpen() {
		return this.getState() === MODAL_TYPES.MENU;
	}

	/**
	 * Get the currently open modal type.
	 *
	 * @return {string} Current modal type.
	 */
	getCurrentModal() {
		return this.getState();
	}
}

