/**
 * Storage Service
 *
 * Abstraction layer for localStorage operations.
 * Provides a testable interface and consistent error handling.
 *
 * @package BodyRefactoring
 * @since 13.0.0
 */

import { STORAGE_KEYS } from './constants.js';

/**
 * Storage Service class.
 *
 * Handles all localStorage operations with error handling and type conversion.
 */
export class StorageService {
	/**
	 * Constructor.
	 *
	 * @param {Storage} storage - Storage implementation (default: localStorage).
	 */
	constructor( storage = localStorage ) {
		this.storage = storage;
	}

	/**
	 * Get a value from storage.
	 *
	 * @param {string} key - Storage key.
	 * @param {*} defaultValue - Default value if key doesn't exist.
	 * @return {*} Stored value or default.
	 */
	get( key, defaultValue = null ) {
		try {
			const value = this.storage.getItem( key );
			return value !== null ? value : defaultValue;
		} catch ( error ) {
			console.error( `[StorageService] Error getting key "${key}":`, error );
			return defaultValue;
		}
	}

	/**
	 * Set a value in storage.
	 *
	 * @param {string} key - Storage key.
	 * @param {*} value - Value to store.
	 * @return {boolean} True if successful.
	 */
	set( key, value ) {
		try {
			this.storage.setItem( key, value );
			return true;
		} catch ( error ) {
			console.error( `[StorageService] Error setting key "${key}":`, error );
			return false;
		}
	}

	/**
	 * Remove a value from storage.
	 *
	 * @param {string} key - Storage key.
	 * @return {boolean} True if successful.
	 */
	remove( key ) {
		try {
			this.storage.removeItem( key );
			return true;
		} catch ( error ) {
			console.error( `[StorageService] Error removing key "${key}":`, error );
			return false;
		}
	}

	/**
	 * Get a boolean value from storage.
	 *
	 * @param {string} key - Storage key.
	 * @param {boolean} defaultValue - Default value.
	 * @return {boolean} Stored boolean or default.
	 */
	getBoolean( key, defaultValue = false ) {
		const value = this.get( key );
		if ( value === 'true' ) {
			return true;
		}
		if ( value === 'false' ) {
			return false;
		}
		return defaultValue;
	}

	/**
	 * Get an integer value from storage.
	 *
	 * @param {string} key - Storage key.
	 * @param {number} defaultValue - Default value.
	 * @return {number} Stored integer or default.
	 */
	getInt( key, defaultValue = 0 ) {
		const value = this.get( key );
		const parsed = parseInt( value, 10 );
		return isNaN( parsed ) ? defaultValue : parsed;
	}

	/**
	 * Get a JSON value from storage.
	 *
	 * @param {string} key - Storage key.
	 * @param {*} defaultValue - Default value.
	 * @return {*} Parsed JSON or default.
	 */
	getJSON( key, defaultValue = null ) {
		try {
			const value = this.get( key );
			return value ? JSON.parse( value ) : defaultValue;
		} catch ( error ) {
			console.error( `[StorageService] Error parsing JSON for key "${key}":`, error );
			return defaultValue;
		}
	}

	/**
	 * Set a JSON value in storage.
	 *
	 * @param {string} key - Storage key.
	 * @param {*} value - Value to stringify and store.
	 * @return {boolean} True if successful.
	 */
	setJSON( key, value ) {
		try {
			const json = JSON.stringify( value );
			return this.set( key, json );
		} catch ( error ) {
			console.error( `[StorageService] Error stringifying JSON for key "${key}":`, error );
			return false;
		}
	}

	/**
	 * Check if exercise is completed.
	 *
	 * @param {string} date - ISO date string.
	 * @param {string} exerciseId - Exercise identifier.
	 * @return {boolean} True if completed.
	 */
	isExerciseCompleted( date, exerciseId ) {
		return this.getBoolean( STORAGE_KEYS.exercise( date, exerciseId ) );
	}

	/**
	 * Set exercise completion status.
	 *
	 * @param {string} date - ISO date string.
	 * @param {string} exerciseId - Exercise identifier.
	 * @param {boolean} completed - Completion status.
	 * @return {boolean} True if successful.
	 */
	setExerciseCompleted( date, exerciseId, completed ) {
		const key = STORAGE_KEYS.exercise( date, exerciseId );
		return completed ? this.set( key, 'true' ) : this.remove( key );
	}

	/**
	 * Get note for a specific date.
	 *
	 * @param {string} date - ISO date string.
	 * @return {string} Note content or empty string.
	 */
	getNote( date ) {
		return this.get( STORAGE_KEYS.note( date ), '' );
	}

	/**
	 * Set note for a specific date.
	 *
	 * @param {string} date - ISO date string.
	 * @param {string} content - Note content.
	 * @return {boolean} True if successful.
	 */
	setNote( date, content ) {
		return this.set( STORAGE_KEYS.note( date ), content );
	}

	/**
	 * Get weight for an exercise on a specific date.
	 *
	 * @param {string} exerciseId - Exercise identifier.
	 * @param {string} date - ISO date string.
	 * @return {string|null} Weight value or null.
	 */
	getWeight( exerciseId, date ) {
		return this.get( STORAGE_KEYS.weight( exerciseId, date ) );
	}

	/**
	 * Set weight for an exercise on a specific date.
	 *
	 * @param {string} exerciseId - Exercise identifier.
	 * @param {string} date - ISO date string.
	 * @param {string|number} weight - Weight value.
	 * @return {boolean} True if successful.
	 */
	setWeight( exerciseId, date, weight ) {
		return this.set( STORAGE_KEYS.weight( exerciseId, date ), weight.toString() );
	}

	/**
	 * Get unit preference for an exercise.
	 *
	 * @param {string} exerciseId - Exercise identifier.
	 * @param {string} defaultUnit - Default unit.
	 * @return {string} Unit preference.
	 */
	getUnit( exerciseId, defaultUnit = 'KG' ) {
		return this.get( STORAGE_KEYS.unit( exerciseId ), defaultUnit );
	}

	/**
	 * Set unit preference for an exercise.
	 *
	 * @param {string} exerciseId - Exercise identifier.
	 * @param {string} unit - Unit value.
	 * @return {boolean} True if successful.
	 */
	setUnit( exerciseId, unit ) {
		return this.set( STORAGE_KEYS.unit( exerciseId ), unit );
	}

	/**
	 * Get number of shields.
	 *
	 * @return {number} Number of shields (0-3).
	 */
	getShields() {
		return Math.min( this.getInt( STORAGE_KEYS.SHIELDS ), 3 );
	}

	/**
	 * Set number of shields.
	 *
	 * @param {number} count - Shield count.
	 * @return {boolean} True if successful.
	 */
	setShields( count ) {
		return this.set( STORAGE_KEYS.SHIELDS, Math.max( 0, Math.min( count, 3 ) ).toString() );
	}

	/**
	 * Get awarded shield milestones.
	 *
	 * @return {Set<number>} Set of milestone numbers.
	 */
	getAwardedShieldMilestones() {
		const array = this.getJSON( STORAGE_KEYS.SHIELDS_AWARDED, [] );
		return new Set( array );
	}

	/**
	 * Add a shield milestone.
	 *
	 * @param {number} milestone - Milestone number.
	 * @return {boolean} True if successful.
	 */
	addShieldMilestone( milestone ) {
		const milestones = this.getAwardedShieldMilestones();
		milestones.add( milestone );
		return this.setJSON( STORAGE_KEYS.SHIELDS_AWARDED, Array.from( milestones ) );
	}

	/**
	 * Check if recovery mode is active for a date.
	 *
	 * @param {string} date - ISO date string.
	 * @return {boolean} True if active.
	 */
	isRecoveryActive( date ) {
		return this.getBoolean( STORAGE_KEYS.recoveryActive( date ) );
	}

	/**
	 * Set recovery mode active status.
	 *
	 * @param {string} date - ISO date string.
	 * @param {boolean} active - Active status.
	 * @return {boolean} True if successful.
	 */
	setRecoveryActive( date, active ) {
		const key = STORAGE_KEYS.recoveryActive( date );
		return active ? this.set( key, 'true' ) : this.remove( key );
	}

	/**
	 * Check if sick mode is active for a date.
	 *
	 * @param {string} date - ISO date string.
	 * @return {boolean} True if active.
	 */
	isSickActive( date ) {
		return this.getBoolean( STORAGE_KEYS.sick( date, 'active' ) );
	}

	/**
	 * Set sick mode active status.
	 *
	 * @param {string} date - ISO date string.
	 * @param {boolean} active - Active status.
	 * @return {boolean} True if successful.
	 */
	setSickActive( date, active ) {
		const key = STORAGE_KEYS.sick( date, 'active' );
		return active ? this.set( key, 'true' ) : this.remove( key );
	}

	/**
	 * Check if shield was used for a sick day.
	 *
	 * @param {string} date - ISO date string.
	 * @return {boolean} True if shield was used.
	 */
	wasSickShieldUsed( date ) {
		return this.getBoolean( STORAGE_KEYS.sick( date, 'shield' ) );
	}

	/**
	 * Set sick shield usage.
	 *
	 * @param {string} date - ISO date string.
	 * @param {boolean} used - Whether shield was used.
	 * @return {boolean} True if successful.
	 */
	setSickShieldUsed( date, used ) {
		const key = STORAGE_KEYS.sick( date, 'shield' );
		return used ? this.set( key, 'true' ) : this.remove( key );
	}

	/**
	 * Export all app data.
	 *
	 * @return {Object} All storage data with app prefixes.
	 */
	exportAll() {
		const data = {};
		const prefixes = [
			STORAGE_KEYS.PREFIX,
			STORAGE_KEYS.NOTE_PREFIX,
			STORAGE_KEYS.WEIGHT_PREFIX,
			STORAGE_KEYS.UNIT_PREFIX,
			STORAGE_KEYS.SICK_PREFIX,
			STORAGE_KEYS.RECOVERY_PREFIX,
		];
		const singleKeys = [ STORAGE_KEYS.SHIELDS, STORAGE_KEYS.SHIELDS_AWARDED ];

		try {
			for ( let i = 0; i < this.storage.length; i++ ) {
				const key = this.storage.key( i );
				const shouldExport = prefixes.some( ( prefix ) => key.startsWith( prefix ) ) ||
					singleKeys.includes( key );

				if ( shouldExport ) {
					data[ key ] = this.storage.getItem( key );
				}
			}
		} catch ( error ) {
			console.error( '[StorageService] Error exporting data:', error );
		}

		return data;
	}

	/**
	 * Import data from an object.
	 *
	 * @param {Object} data - Data to import.
	 * @return {number} Number of keys imported.
	 */
	importAll( data ) {
		let imported = 0;
		const prefixes = [
			STORAGE_KEYS.PREFIX,
			STORAGE_KEYS.NOTE_PREFIX,
			STORAGE_KEYS.WEIGHT_PREFIX,
			STORAGE_KEYS.UNIT_PREFIX,
			STORAGE_KEYS.SICK_PREFIX,
			STORAGE_KEYS.RECOVERY_PREFIX,
		];
		const singleKeys = [ STORAGE_KEYS.SHIELDS, STORAGE_KEYS.SHIELDS_AWARDED ];

		Object.keys( data ).forEach( ( key ) => {
			const shouldImport = prefixes.some( ( prefix ) => key.startsWith( prefix ) ) ||
				singleKeys.includes( key );

			if ( shouldImport && this.set( key, data[ key ] ) ) {
				imported++;
			}
		} );

		return imported;
	}
}

