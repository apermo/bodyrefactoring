/**
 * State Machine Implementation
 *
 * Generic state machine for managing application state transitions.
 * Enforces valid state transitions and notifies listeners of changes.
 *
 * @package BodyRefactoring
 * @since 13.0.0
 */

/**
 * State Machine class.
 *
 * Manages state transitions with validation and event notification.
 */
export class StateMachine {
	/**
	 * Constructor.
	 *
	 * @param {Object} states - Object containing valid state constants.
	 * @param {string} initialState - The initial state.
	 */
	constructor( states, initialState ) {
		this.states = states;
		this.currentState = initialState;
		this.listeners = [];
		this.transitions = new Map();
		this.history = [];
	}

	/**
	 * Get the current state.
	 *
	 * @return {string} Current state.
	 */
	getState() {
		return this.currentState;
	}

	/**
	 * Check if a transition to a given state is allowed.
	 *
	 * @param {string} toState - Target state.
	 * @return {boolean} True if transition is allowed.
	 */
	can( toState ) {
		const allowed = this.transitions.get( this.currentState ) || [];
		return allowed.includes( toState );
	}

	/**
	 * Transition to a new state.
	 *
	 * @param {string} toState - Target state.
	 * @param {Object} data - Optional data to pass to listeners.
	 * @return {boolean} True if transition was successful.
	 */
	transition( toState, data = {} ) {
		if ( ! this.can( toState ) ) {
			console.warn( `[StateMachine] Invalid transition: ${this.currentState} -> ${toState}` );
			return false;
		}

		const fromState = this.currentState;
		this.currentState = toState;
		this.history.push( { from: fromState, to: toState, timestamp: Date.now() } );

		console.log( `[StateMachine] ${fromState} -> ${toState}`, data );
		this.notify( fromState, toState, data );

		return true;
	}

	/**
	 * Force a state change without validation.
	 *
	 * Use with caution - primarily for error recovery.
	 *
	 * @param {string} toState - Target state.
	 * @param {Object} data - Optional data to pass to listeners.
	 * @return {void}
	 */
	forceTransition( toState, data = {} ) {
		const fromState = this.currentState;
		this.currentState = toState;
		this.history.push( { from: fromState, to: toState, timestamp: Date.now(), forced: true } );

		console.warn( `[StateMachine] Forced transition: ${fromState} -> ${toState}`, data );
		this.notify( fromState, toState, data );
	}

	/**
	 * Define allowed transitions from a state.
	 *
	 * @param {string} fromState - Source state.
	 * @param {string|string[]} toStates - Allowed target state(s).
	 * @return {void}
	 */
	allow( fromState, toStates ) {
		const statesArray = Array.isArray( toStates ) ? toStates : [ toStates ];
		this.transitions.set( fromState, statesArray );
	}

	/**
	 * Register a state change listener.
	 *
	 * @param {Function} callback - Callback function receiving {from, to, data}.
	 * @return {Function} Unsubscribe function.
	 */
	onChange( callback ) {
		this.listeners.push( callback );

		// Return unsubscribe function
		return () => {
			const index = this.listeners.indexOf( callback );
			if ( index > -1 ) {
				this.listeners.splice( index, 1 );
			}
		};
	}

	/**
	 * Notify all listeners of a state change.
	 *
	 * @param {string} from - Previous state.
	 * @param {string} to - New state.
	 * @param {Object} data - Additional data.
	 * @return {void}
	 */
	notify( from, to, data ) {
		this.listeners.forEach( ( callback ) => {
			try {
				callback( { from, to, data } );
			} catch ( error ) {
				console.error( '[StateMachine] Listener error:', error );
			}
		} );
	}

	/**
	 * Get state transition history.
	 *
	 * @param {number} limit - Maximum number of entries to return.
	 * @return {Object[]} History entries.
	 */
	getHistory( limit = 10 ) {
		return this.history.slice( -limit );
	}

	/**
	 * Clear transition history.
	 *
	 * @return {void}
	 */
	clearHistory() {
		this.history = [];
	}
}

