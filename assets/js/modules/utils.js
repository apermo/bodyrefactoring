/**
 * Utility Functions
 *
 * Common utility functions used throughout the application.
 *
 * @package BodyRefactoring
 * @since 13.0.0
 */

/**
 * Convert a Date object to ISO date string in local timezone.
 *
 * @param {Date} date - The date to convert.
 * @return {string} ISO date string (YYYY-MM-DD) in local timezone.
 */
export function getLocalISODate( date ) {
	const offset = date.getTimezoneOffset();
	const localDate = new Date( date.getTime() - ( offset * 60 * 1000 ) );
	return localDate.toISOString().split( 'T' )[ 0 ];
}

/**
 * Get today's date at midnight.
 *
 * @return {Date} Today at 00:00:00.
 */
export function getToday() {
	const today = new Date();
	today.setHours( 0, 0, 0, 0 );
	return today;
}

/**
 * Get a random item from an array.
 *
 * @param {Array} array - Source array.
 * @return {*} Random item.
 */
export function getRandomItem( array ) {
	return array[ Math.floor( Math.random() * array.length ) ];
}

/**
 * Debounce a function.
 *
 * @param {Function} func - Function to debounce.
 * @param {number} wait - Wait time in milliseconds.
 * @return {Function} Debounced function.
 */
export function debounce( func, wait ) {
	let timeout;
	return function executedFunction( ...args ) {
		const later = () => {
			clearTimeout( timeout );
			func( ...args );
		};
		clearTimeout( timeout );
		timeout = setTimeout( later, wait );
	};
}

/**
 * Throttle a function.
 *
 * @param {Function} func - Function to throttle.
 * @param {number} limit - Time limit in milliseconds.
 * @return {Function} Throttled function.
 */
export function throttle( func, limit ) {
	let inThrottle;
	return function executedFunction( ...args ) {
		if ( ! inThrottle ) {
			func( ...args );
			inThrottle = true;
			setTimeout( () => {
				inThrottle = false;
			}, limit );
		}
	};
}

/**
 * Format seconds as MM:SS.
 *
 * @param {number} seconds - Total seconds.
 * @return {string} Formatted time string.
 */
export function formatTime( seconds ) {
	const mins = Math.floor( seconds / 60 );
	const secs = seconds % 60;
	return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Show a temporary notification.
 *
 * @param {string} message - Message to display.
 * @param {string} type - Notification type (success, error, info).
 * @param {number} duration - Duration in milliseconds.
 * @return {void}
 */
export function showNotification( message, type = 'success', duration = 3000 ) {
	const colors = {
		success: 'bg-green-500',
		error: 'bg-red-500',
		info: 'bg-blue-500',
	};

	const notification = document.createElement( 'div' );
	notification.className = `fixed top-20 left-1/2 transform -translate-x-1/2 ${colors[ type ] || colors.info} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce`;
	notification.innerText = message;

	document.body.appendChild( notification );

	setTimeout( () => {
		notification.remove();
	}, duration );
}

/**
 * Safely parse JSON with fallback.
 *
 * @param {string} json - JSON string.
 * @param {*} fallback - Fallback value on error.
 * @return {*} Parsed JSON or fallback.
 */
export function safeJSONParse( json, fallback = null ) {
	try {
		return JSON.parse( json );
	} catch ( error ) {
		console.error( '[Utils] JSON parse error:', error );
		return fallback;
	}
}

/**
 * Safely stringify JSON with fallback.
 *
 * @param {*} value - Value to stringify.
 * @param {string} fallback - Fallback string on error.
 * @return {string} JSON string or fallback.
 */
export function safeJSONStringify( value, fallback = '' ) {
	try {
		return JSON.stringify( value );
	} catch ( error ) {
		console.error( '[Utils] JSON stringify error:', error );
		return fallback;
	}
}

/**
 * Clamp a number between min and max.
 *
 * @param {number} value - Value to clamp.
 * @param {number} min - Minimum value.
 * @param {number} max - Maximum value.
 * @return {number} Clamped value.
 */
export function clamp( value, min, max ) {
	return Math.min( Math.max( value, min ), max );
}

/**
 * Check if a date is today.
 *
 * @param {Date|string} date - Date to check.
 * @return {boolean} True if date is today.
 */
export function isToday( date ) {
	const checkDate = typeof date === 'string' ? new Date( date ) : date;
	const today = getToday();
	return getLocalISODate( checkDate ) === getLocalISODate( today );
}

/**
 * Check if a date is in the past.
 *
 * @param {Date|string} date - Date to check.
 * @return {boolean} True if date is in the past.
 */
export function isPast( date ) {
	const checkDate = typeof date === 'string' ? new Date( date + 'T00:00:00' ) : date;
	const today = getToday();
	return checkDate < today;
}

/**
 * Check if a date is in the future.
 *
 * @param {Date|string} date - Date to check.
 * @return {boolean} True if date is in the future.
 */
export function isFuture( date ) {
	const checkDate = typeof date === 'string' ? new Date( date + 'T00:00:00' ) : date;
	const today = getToday();
	return checkDate > today;
}

/**
 * Calculate days between two dates.
 *
 * @param {Date} date1 - First date.
 * @param {Date} date2 - Second date.
 * @return {number} Days between dates.
 */
export function daysBetween( date1, date2 ) {
	const diffTime = Math.abs( date2 - date1 );
	return Math.floor( diffTime / ( 1000 * 60 * 60 * 24 ) );
}

/**
 * Scroll to an element smoothly.
 *
 * @param {string} elementId - Element ID.
 * @param {number} offset - Offset in pixels.
 * @param {number} delay - Delay before scrolling.
 * @return {void}
 */
export function scrollToElement( elementId, offset = 0, delay = 0 ) {
	setTimeout( () => {
		const element = document.getElementById( elementId );
		if ( element ) {
			const y = element.getBoundingClientRect().top + window.pageYOffset - offset;
			window.scrollTo( { top: y, behavior: 'smooth' } );
		}
	}, delay );
}

