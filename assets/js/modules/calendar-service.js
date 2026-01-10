/**
 * Calendar Service
 *
 * Handles iCalendar (.ics) file generation for workout events.
 * Supports recurring events (RRULE) and integrates with iOS Calendar.
 *
 * @package BodyRefactoring
 * @since 14.2.0
 */

/**
 * Calculate workout duration based on exercises.
 *
 * Minimum 30 minutes, rounded up to next 15-minute interval.
 *
 * @param {Array} exercises - Array of exercise objects.
 * @return {number} Duration in minutes.
 */
export function calculateWorkoutDuration( exercises ) {
	let totalMinutes = 0;

	exercises.forEach( ( ex ) => {
		if ( ex.repCounter && ex.repCounter.sets && ex.repCounter.reps ) {
			// Rep counter exercises - calculate actual time
			const { sets, reps, restSeconds = 60, delayMilliseconds = 3000 } = ex.repCounter;

			// Time for all reps (in seconds)
			const repTime = ( reps * delayMilliseconds ) / 1000;

			// Rest time between sets (no rest after last set)
			const restTime = ( sets - 1 ) * restSeconds;

			// Total time for this exercise in minutes
			totalMinutes += ( repTime * sets + restTime ) / 60;
		} else {
			// Regular exercises without rep counter - estimate 2 min per set
			const sets = ex.sets || 3;
			totalMinutes += sets * 2;
		}
	} );

	// Minimum 30 minutes
	totalMinutes = Math.max( 30, totalMinutes );

	// Round up to next 15-minute interval
	return Math.ceil( totalMinutes / 15 ) * 15;
}

/**
 * Generate unique UID for calendar event.
 *
 * Format: workout-[date]-[hash]@bodyrefactoring.app
 * Same UID = update existing event when re-imported.
 *
 * @param {string} date - Date in YYYY-MM-DD format.
 * @param {Array} exercises - Array of exercise objects.
 * @return {string} Unique event UID.
 */
export function generateEventUID( date, exercises ) {
	// Create stable hash from exercise IDs
	const exerciseIds = exercises.map( ( e ) => e.id ).sort().join( '-' );
	const hash = simpleHash( exerciseIds );

	return `workout-${date}-${hash}@bodyrefactoring.app`;
}

/**
 * Simple string hash function.
 *
 * @param {string} str - String to hash.
 * @return {string} Hash as hex string.
 */
function simpleHash( str ) {
	let hash = 0;
	for ( let i = 0; i < str.length; i++ ) {
		const char = str.charCodeAt( i );
		hash = ( ( hash << 5 ) - hash ) + char;
		hash = hash & hash; // Convert to 32-bit integer
	}
	return Math.abs( hash ).toString( 36 );
}

/**
 * Format date and time for iCalendar (RFC 5545 format).
 *
 * Format: YYYYMMDDTHHMMSS (local time, no Z suffix)
 *
 * @param {string} date - Date in YYYY-MM-DD format.
 * @param {string} time - Time in HH:MM format.
 * @return {string} Formatted datetime string.
 */
export function formatDateTime( date, time ) {
	const [ year, month, day ] = date.split( '-' );
	const [ hour, minute ] = time.split( ':' );

	return `${year}${month}${day}T${hour}${minute}00`;
}

/**
 * Format date for UNTIL parameter (UTC).
 *
 * @param {Date} date - JavaScript Date object.
 * @return {string} Formatted date string (YYYYMMDDTHHMMSSZ).
 */
function formatUntilDate( date ) {
	const year = date.getUTCFullYear();
	const month = String( date.getUTCMonth() + 1 ).padStart( 2, '0' );
	const day = String( date.getUTCDate() ).padStart( 2, '0' );
	const hour = String( date.getUTCHours() ).padStart( 2, '0' );
	const minute = String( date.getUTCMinutes() ).padStart( 2, '0' );
	const second = String( date.getUTCSeconds() ).padStart( 2, '0' );

	return `${year}${month}${day}T${hour}${minute}${second}Z`;
}

/**
 * Get weekday abbreviation for RRULE.
 *
 * @param {string} date - Date in YYYY-MM-DD format.
 * @return {string} Weekday abbreviation (MO, TU, WE, TH, FR, SA, SU).
 */
function getWeekdayAbbreviation( date ) {
	const d = new Date( date );
	const days = [ 'SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA' ];
	return days[ d.getDay() ];
}

/**
 * Calculate UNTIL date for RRULE.
 *
 * Uses schedule targetDate + 4 weeks buffer, or 1 year from now as fallback.
 *
 * @param {Object|null} schedule - Schedule object (may have targetDate).
 * @return {Date} UNTIL date.
 */
function calculateUntilDate( schedule ) {
	if ( schedule && schedule.targetDate ) {
		// Use schedule targetDate + 4 weeks buffer
		const scheduleEnd = new Date( schedule.targetDate );
		scheduleEnd.setDate( scheduleEnd.getDate() + 28 ); // +4 weeks
		return scheduleEnd;
	}

	// Fallback: 1 year from now
	const defaultEnd = new Date();
	defaultEnd.setFullYear( defaultEnd.getFullYear() + 1 );
	return defaultEnd;
}

/**
 * Escape special characters for iCalendar format.
 *
 * @param {string} text - Text to escape.
 * @return {string} Escaped text.
 */
function escapeICalText( text ) {
	return text
		.replace( /\\/g, '\\\\' )  // Backslash
		.replace( /;/g, '\\;' )     // Semicolon
		.replace( /,/g, '\\,' )     // Comma
		.replace( /\n/g, '\\n' );   // Newline
}

/**
 * Generate iCalendar (.ics) file content.
 *
 * @param {Object} config - Configuration object.
 * @param {string} config.date - Date in YYYY-MM-DD format (e.g., "2026-01-13").
 * @param {string} config.time - Time in HH:MM format (e.g., "18:00").
 * @param {number} config.duration - Duration in minutes (e.g., 45).
 * @param {Array} config.exercises - Array of exercise objects.
 * @param {string} config.dayName - Day name (e.g., "Beine & Po").
 * @param {number} config.reminderMinutes - Reminder time before event (default: 15).
 * @param {boolean} config.recurring - Whether to create recurring event (default: false).
 * @param {Object|null} config.schedule - Schedule object (for targetDate).
 * @return {string} iCalendar file content.
 */
export function generateICS( config ) {
	const {
		date,
		time,
		duration,
		exercises,
		dayName,
		reminderMinutes = 15,
		recurring = false,
		schedule = null
	} = config;

	const uid = generateEventUID( date, exercises );
	const dtStart = formatDateTime( date, time );

	// Create summary (title)
	const summary = escapeICalText( `Body Refactoring: ${dayName}` );

	// Create description with exercise list
	const exerciseList = exercises
		.map( ( ex ) => {
			if ( ex.repCounter && ex.repCounter.sets && ex.repCounter.reps ) {
				return `- ${ex.name}: ${ex.repCounter.sets}x${ex.repCounter.reps}`;
			}
			return `- ${ex.name}`;
		} )
		.join( '\\n' );

	const description = escapeICalText(
		`Trainingsplan: ${dayName}\\n\\nÜbungen:\\n${exerciseList}`
	);

	// Calculate end time
	const endDateTime = new Date( `${date}T${time}` );
	endDateTime.setMinutes( endDateTime.getMinutes() + duration );
	const dtEnd = formatDateTime(
		endDateTime.toISOString().split( 'T' )[ 0 ],
		endDateTime.toTimeString().slice( 0, 5 )
	);

	// Build RRULE if recurring
	let rrule = '';
	if ( recurring ) {
		const weekday = getWeekdayAbbreviation( date );
		const untilDate = calculateUntilDate( schedule );
		const until = formatUntilDate( untilDate );

		rrule = `RRULE:FREQ=WEEKLY;BYDAY=${weekday};UNTIL=${until}\n`;
	}

	// Build alarm (reminder)
	const alarmTrigger = `-PT${reminderMinutes}M`;

	// Generate .ics content
	const ics = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//Body Refactoring//Workout//EN',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		'BEGIN:VEVENT',
		`UID:${uid}`,
		`DTSTAMP:${formatDateTime( new Date().toISOString().split( 'T' )[ 0 ], new Date().toTimeString().slice( 0, 5 ) )}`,
		`DTSTART:${dtStart}`,
		`DTEND:${dtEnd}`,
		`SUMMARY:${summary}`,
		`DESCRIPTION:${description}`,
		'LOCATION:Home Gym',
		'STATUS:CONFIRMED',
		rrule, // Empty string if not recurring
		'BEGIN:VALARM',
		'ACTION:DISPLAY',
		`TRIGGER:${alarmTrigger}`,
		`DESCRIPTION:Training in ${reminderMinutes} Minuten`,
		'END:VALARM',
		'END:VEVENT',
		'END:VCALENDAR'
	].filter( line => line !== '' ).join( '\r\n' ); // Filter empty RRULE line

	return ics;
}

/**
 * Trigger download of .ics file.
 *
 * @param {string} content - iCalendar file content.
 * @param {string} filename - Filename (e.g., "workout-2026-01-13.ics").
 * @return {void}
 */
export function downloadICS( content, filename ) {
	const blob = new Blob( [ content ], { type: 'text/calendar;charset=utf-8' } );
	const url = URL.createObjectURL( blob );

	const link = document.createElement( 'a' );
	link.href = url;
	link.download = filename;
	document.body.appendChild( link );
	link.click();
	document.body.removeChild( link );

	// Clean up blob URL
	setTimeout( () => URL.revokeObjectURL( url ), 100 );
}

