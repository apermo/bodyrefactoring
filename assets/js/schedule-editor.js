/**
 * Schedule Editor JavaScript
 *
 * Handles all schedule creation, editing, and management functionality.
 *
 * @package BodyRefactoring
 * @version 9.1.0
 */

// Global state
let currentSchedule = null;
let currentDayIndex = 1;
let currentExerciseIndex = -1;
let scheduleFilename = null;

/**
 * Load list of available schedules from server.
 *
 * @return {Promise<void>}
 */
async function loadAvailableSchedules() {
	try {
		const response = await fetch( 'trainings/index.php' );
		const schedules = await response.json();

		const select = document.getElementById( 'existing-schedules' );
		select.innerHTML = '<option value="">Select a schedule...</option>';

		schedules.forEach( schedule => {
			const option = document.createElement( 'option' );
			option.value = schedule.file;
			option.textContent = `${schedule.date} - ${schedule.file}`;
			select.appendChild( option );
		} );
	} catch ( error ) {
		console.error( 'Error loading schedules:', error );
		alert( 'Failed to load available schedules.' );
	}
}

/**
 * Create a new empty schedule.
 *
 * @return {void}
 */
function createNewSchedule() {
	const dateInput = document.getElementById( 'new-schedule-date' );
	const date = dateInput.value;

	if ( ! date ) {
		alert( 'Please select a date for the new schedule.' );
		return;
	}

	// Create empty schedule structure
	currentSchedule = {
		version: 1,
		days: [],
	};

	// Create 7 empty days
	const dayNames = [ 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY' ];
	const dayIds = [ 'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat' ];

	for ( let i = 0; i < 7; i++ ) {
		currentSchedule.days.push( {
			id: dayIds[ i ],
			dayIndex: i,
			name: dayNames[ i ],
			theme: 'Training Day',
			icon: 'dumbbell',
			colorClass: 'text-blue-400',
			bgClass: 'bg-blue-500/10',
			details: [],
		} );
	}

	scheduleFilename = `schedule-${date}.json`;
	currentDayIndex = 1; // Monday

	showEditor();
	updateScheduleInfo();
	renderDay();
}

/**
 * Load an existing schedule from server.
 *
 * @return {Promise<void>}
 */
async function loadSchedule() {
	const select = document.getElementById( 'existing-schedules' );
	const filename = select.value;

	if ( ! filename ) {
		alert( 'Please select a schedule to load.' );
		return;
	}

	try {
		const response = await fetch( `trainings/${filename}` );
		const data = await response.json();

		currentSchedule = data;
		scheduleFilename = filename;
		currentDayIndex = 1;

		showEditor();
		updateScheduleInfo();
		renderDay();
	} catch ( error ) {
		console.error( 'Error loading schedule:', error );
		alert( 'Failed to load schedule file.' );
	}
}

/**
 * Import schedule from file upload.
 *
 * @param {HTMLInputElement} input - File input element.
 * @return {void}
 */
function importSchedule( input ) {
	const file = input.files[ 0 ];
	if ( ! file ) {
		return;
	}

	const reader = new FileReader();
	reader.onload = function( e ) {
		try {
			const data = JSON.parse( e.target.result );

			// Validate basic structure
			if ( ! data.version || ! data.days || ! Array.isArray( data.days ) ) {
				throw new Error( 'Invalid schedule structure' );
			}

			currentSchedule = data;
			scheduleFilename = file.name;
			currentDayIndex = 1;

			showEditor();
			updateScheduleInfo();
			renderDay();

			alert( 'Schedule imported successfully!' );
		} catch ( error ) {
			console.error( 'Import error:', error );
			alert( 'Failed to import schedule: ' + error.message );
		}
	};
	reader.readAsText( file );

	// Reset input
	input.value = '';
}

/**
 * Paste JSON directly from clipboard.
 *
 * @return {Promise<void>}
 */
async function pasteJSON() {
	const json = prompt( 'Paste your schedule JSON here:' );
	if ( ! json ) {
		return;
	}

	try {
		const data = JSON.parse( json );

		if ( ! data.version || ! data.days || ! Array.isArray( data.days ) ) {
			throw new Error( 'Invalid schedule structure' );
		}

		currentSchedule = data;
		scheduleFilename = 'imported-schedule.json';
		currentDayIndex = 1;

		showEditor();
		updateScheduleInfo();
		renderDay();

		alert( 'Schedule imported successfully!' );
	} catch ( error ) {
		console.error( 'Parse error:', error );
		alert( 'Failed to parse JSON: ' + error.message );
	}
}

/**
 * Show the editor area.
 *
 * @return {void}
 */
function showEditor() {
	document.getElementById( 'editor-area' ).classList.remove( 'hidden' );
}

/**
 * Update schedule info display.
 *
 * @return {void}
 */
function updateScheduleInfo() {
	const info = document.getElementById( 'schedule-info' );
	info.textContent = scheduleFilename || 'Untitled schedule';
}

/**
 * Switch to a different day tab.
 *
 * @param {number} dayIndex - Day index (0-6).
 * @return {void}
 */
function switchDay( dayIndex ) {
	// Save current day data first
	saveDayData();

	// Switch active tab
	document.querySelectorAll( '.day-tab' ).forEach( tab => {
		tab.classList.remove( 'active' );
	} );
	document.querySelector( `.day-tab[data-day="${dayIndex}"]` ).classList.add( 'active' );

	currentDayIndex = dayIndex;
	renderDay();
}

/**
 * Save current day data from form inputs.
 *
 * @return {void}
 */
function saveDayData() {
	if ( ! currentSchedule || currentDayIndex < 0 ) {
		return;
	}

	const day = currentSchedule.days[ currentDayIndex ];
	if ( ! day ) {
		return;
	}

	day.id = document.getElementById( 'day-id' ).value;
	day.name = document.getElementById( 'day-name' ).value;
	day.theme = document.getElementById( 'day-theme' ).value;
	day.icon = document.getElementById( 'day-icon' ).value;
	day.colorClass = document.getElementById( 'day-color' ).value;
	day.bgClass = document.getElementById( 'day-bg' ).value;
}

/**
 * Render current day in the editor.
 *
 * @return {void}
 */
function renderDay() {
	if ( ! currentSchedule ) {
		return;
	}

	const day = currentSchedule.days[ currentDayIndex ];
	if ( ! day ) {
		return;
	}

	// Fill day properties
	document.getElementById( 'day-id' ).value = day.id || '';
	document.getElementById( 'day-name' ).value = day.name || '';
	document.getElementById( 'day-theme' ).value = day.theme || '';
	document.getElementById( 'day-icon' ).value = day.icon || '';
	document.getElementById( 'day-color' ).value = day.colorClass || '';
	document.getElementById( 'day-bg' ).value = day.bgClass || '';

	// Render exercises
	renderExercises();
}

/**
 * Render exercises list for current day.
 *
 * @return {void}
 */
function renderExercises() {
	const day = currentSchedule.days[ currentDayIndex ];
	const container = document.getElementById( 'exercises-list' );

	if ( ! day.details || day.details.length === 0 ) {
		container.innerHTML = '<div class="text-slate-500 text-center py-8">No exercises yet. Click "Add Exercise" to start.</div>';
		return;
	}

	container.innerHTML = '';

	day.details.forEach( ( exercise, index ) => {
		const div = document.createElement( 'div' );
		div.className = 'exercise-item p-3 rounded-lg bg-slate-800/50 border border-slate-700 cursor-move';
		div.draggable = true;
		div.dataset.index = index;

		const typeLabels = {
			warmup: '🔥 Warm Up',
			main: '💪 Main',
			cool: '❄️ Cool Down',
			alternatives: '🔀 Alternatives',
		};

		div.innerHTML = `
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3 flex-1">
					<div class="text-slate-500 cursor-move">
						<i data-lucide="grip-vertical" class="w-4 h-4"></i>
					</div>
					<div class="flex-1">
						<div class="flex items-center gap-2 mb-1">
							<span class="text-xs font-bold text-slate-400">${typeLabels[ exercise.type ] || exercise.type}</span>
							<span class="text-xs text-slate-500 font-mono">${exercise.id}</span>
						</div>
						<div class="font-bold text-white">${exercise.title || exercise.type}</div>
						<div class="text-xs text-slate-400">${exercise.desc || ''}</div>
					</div>
				</div>
				<div class="flex items-center gap-2">
					<button onclick="editExercise(${index})" class="p-2 hover:bg-slate-700 rounded text-blue-400">
						<i data-lucide="edit" class="w-4 h-4"></i>
					</button>
					<button onclick="deleteExercise(${index})" class="p-2 hover:bg-slate-700 rounded text-red-400">
						<i data-lucide="trash-2" class="w-4 h-4"></i>
					</button>
				</div>
			</div>
		`;

		// Add drag event listeners
		div.addEventListener( 'dragstart', handleDragStart );
		div.addEventListener( 'dragover', handleDragOver );
		div.addEventListener( 'drop', handleDrop );
		div.addEventListener( 'dragend', handleDragEnd );

		container.appendChild( div );
	} );

	lucide.createIcons();
}

let draggedElement = null;

/**
 * Handle drag start event.
 *
 * @param {DragEvent} e - Drag event.
 * @return {void}
 */
function handleDragStart( e ) {
	draggedElement = this;
	this.style.opacity = '0.4';
	e.dataTransfer.effectAllowed = 'move';
	e.dataTransfer.setData( 'text/html', this.innerHTML );
}

/**
 * Handle drag over event.
 *
 * @param {DragEvent} e - Drag event.
 * @return {void}
 */
function handleDragOver( e ) {
	if ( e.preventDefault ) {
		e.preventDefault();
	}
	e.dataTransfer.dropEffect = 'move';

	const afterElement = getDragAfterElement( this.parentElement, e.clientY );
	if ( afterElement === null ) {
		this.parentElement.appendChild( draggedElement );
	} else {
		this.parentElement.insertBefore( draggedElement, afterElement );
	}

	return false;
}

/**
 * Handle drop event.
 *
 * @param {DragEvent} e - Drag event.
 * @return {void}
 */
function handleDrop( e ) {
	if ( e.stopPropagation ) {
		e.stopPropagation();
	}

	if ( draggedElement !== this ) {
		// Get new order from DOM
		const container = document.getElementById( 'exercises-list' );
		const items = Array.from( container.children );
		const newOrder = items.map( item => parseInt( item.dataset.index ) );

		// Reorder exercises array
		const day = currentSchedule.days[ currentDayIndex ];
		const newDetails = newOrder.map( index => day.details[ index ] );
		day.details = newDetails;

		// Re-render
		renderExercises();
	}

	return false;
}

/**
 * Handle drag end event.
 *
 * @return {void}
 */
function handleDragEnd() {
	this.style.opacity = '1';
	draggedElement = null;
}

/**
 * Get element after cursor position during drag.
 *
 * @param {HTMLElement} container - Container element.
 * @param {number} y - Y coordinate.
 * @return {HTMLElement|null} Element after cursor or null.
 */
function getDragAfterElement( container, y ) {
	const draggableElements = [ ...container.querySelectorAll( '.exercise-item:not(.dragging)' ) ];

	return draggableElements.reduce( ( closest, child ) => {
		const box = child.getBoundingClientRect();
		const offset = y - box.top - box.height / 2;

		if ( offset < 0 && offset > closest.offset ) {
			return { offset, element: child };
		} 
		return closest;
		
	}, { offset: Number.NEGATIVE_INFINITY } ).element;
}


/**
 * Delete an exercise.
 *
 * @param {number} index - Exercise index.
 * @return {void}
 */
function deleteExercise( index ) {
	if ( ! confirm( 'Delete this exercise?' ) ) {
		return;
	}

	const day = currentSchedule.days[ currentDayIndex ];
	day.details.splice( index, 1 );

	renderExercises();
}

/**
 * Add a new exercise.
 *
 * @return {void}
 */
function addExercise() {
	currentExerciseIndex = -1; // New exercise
	showExerciseModal( {
		id: '',
		type: 'main',
		title: '',
		desc: '',
		weight: '',
		defaultUnit: 'KG',
	} );
}

/**
 * Edit an existing exercise.
 *
 * @param {number} index - Exercise index.
 * @return {void}
 */
function editExercise( index ) {
	currentExerciseIndex = index;
	const day = currentSchedule.days[ currentDayIndex ];
	showExerciseModal( day.details[ index ] );
}

/**
 * Get all unique exercise IDs from current schedule.
 *
 * @return {Array<string>} Array of unique exercise IDs.
 */
function getAllExerciseIds() {
	if ( ! currentSchedule || ! currentSchedule.days ) {
		return [];
	}

	const ids = new Set();
	currentSchedule.days.forEach( day => {
		if ( day.details ) {
			day.details.forEach( exercise => {
				if ( exercise.id ) {
					ids.add( exercise.id );
				}
			} );
		}
	} );

	return Array.from( ids ).sort();
}

/**
 * Show exercise modal with form.
 *
 * @param {Object} exercise - Exercise data.
 * @return {void}
 */
function showExerciseModal( exercise ) {
	const form = document.getElementById( 'exercise-form' );

	if ( exercise.type === 'alternatives' ) {
		form.innerHTML = renderAlternativesForm( exercise );
	} else {
		form.innerHTML = renderRegularExerciseForm( exercise );
	}

	document.getElementById( 'exercise-modal' ).classList.remove( 'hidden' );
	setupIdAutocomplete();
	lucide.createIcons();
}

/**
 * Render form for regular exercise.
 *
 * @param {Object} exercise - Exercise data.
 * @return {string} HTML string.
 */
function renderRegularExerciseForm( exercise ) {
	return `
		<div>
			<label class="text-xs text-slate-400 block mb-1">Type</label>
			<select id="ex-type" class="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2">
				<option value="warmup" ${exercise.type === 'warmup' ? 'selected' : ''}>Warm Up</option>
				<option value="main" ${exercise.type === 'main' ? 'selected' : ''}>Main Exercise</option>
				<option value="cool" ${exercise.type === 'cool' ? 'selected' : ''}>Cool Down</option>
				<option value="alternatives" ${exercise.type === 'alternatives' ? 'selected' : ''}>Alternatives</option>
			</select>
		</div>
		<div>
			<label class="text-xs text-slate-400 block mb-1">ID (lowercase, underscores only)</label>
			<input type="text" id="ex-id" list="exercise-ids" value="${exercise.id || ''}" class="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2" placeholder="e.g., ex_benchpress" />
			<datalist id="exercise-ids"></datalist>
			<div class="text-xs text-slate-500 mt-1">Suggestions from existing exercises. You can also type a new ID.</div>
		</div>
		<div>
			<label class="text-xs text-slate-400 block mb-1">Title</label>
			<input type="text" id="ex-title" value="${exercise.title || ''}" class="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2" />
		</div>
		<div>
			<label class="text-xs text-slate-400 block mb-1">Description</label>
			<input type="text" id="ex-desc" value="${exercise.desc || ''}" class="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2" />
		</div>
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label class="text-xs text-slate-400 block mb-1">Weight (optional)</label>
				<input type="text" id="ex-weight" value="${exercise.weight || ''}" class="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2" />
			</div>
			<div>
				<label class="text-xs text-slate-400 block mb-1">Unit</label>
				<input type="text" id="ex-unit" list="unit-suggestions" value="${exercise.defaultUnit || 'KG'}" class="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2" placeholder="KG, STUFE, LBS..." />
				<datalist id="unit-suggestions">
					<option value="KG">
					<option value="STUFE">
				</datalist>
			</div>
		</div>
		<div>
			<label class="text-xs text-slate-400 block mb-2">Timers (JSON array, optional)</label>
			<textarea id="ex-timers" class="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 font-mono text-xs" rows="3">${exercise.timers ? JSON.stringify( exercise.timers, null, 2 ) : ''}</textarea>
			<div class="text-xs text-slate-500 mt-1">Example: [{"l": "5 Min", "s": 300}]</div>
		</div>
		<div>
			<label class="text-xs text-slate-400 block mb-2">Rep Counter (JSON object, optional)</label>
			<textarea id="ex-repcounter" class="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 font-mono text-xs" rows="5">${exercise.repCounter ? JSON.stringify( exercise.repCounter, null, 2 ) : ''}</textarea>
			<div class="text-xs text-slate-500 mt-1">Example: {"sets": 3, "reps": 12, "restSeconds": 60, "delayMilliseconds": 3000}</div>
		</div>
	`;
}

/**
 * Render form for alternatives exercise.
 *
 * @param {Object} exercise - Exercise data.
 * @return {string} HTML string.
 */
function renderAlternativesForm( exercise ) {
	return `
		<div>
			<label class="text-xs text-slate-400 block mb-1">Type</label>
			<select id="ex-type" class="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2">
				<option value="warmup">Warm Up</option>
				<option value="main">Main Exercise</option>
				<option value="cool">Cool Down</option>
				<option value="alternatives" selected>Alternatives</option>
			</select>
		</div>
		<div>
			<label class="text-xs text-slate-400 block mb-1">ID (lowercase, underscores only)</label>
			<input type="text" id="ex-id" list="exercise-ids" value="${exercise.id || ''}" class="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2" placeholder="e.g., alt_cardio" />
			<datalist id="exercise-ids"></datalist>
			<div class="text-xs text-slate-500 mt-1">Suggestions from existing exercises. You can also type a new ID.</div>
		</div>
		<div>
			<label class="text-xs text-slate-400 block mb-2">Alternatives (JSON array)</label>
			<textarea id="ex-alternatives" class="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 font-mono text-xs" rows="10">${exercise.alternatives ? JSON.stringify( exercise.alternatives, null, 2 ) : '[]'}</textarea>
			<div class="text-xs text-slate-500 mt-1">
				Example:<br>
				[{<br>
				&nbsp;&nbsp;"title": "Option 1",<br>
				&nbsp;&nbsp;"desc": "Description",<br>
				&nbsp;&nbsp;"timers": [{"l": "20 Min", "s": 1200}]<br>
				}]
			</div>
		</div>
	`;
}

/**
 * Close exercise modal.
 *
 * @return {void}
 */
function closeExerciseModal() {
	document.getElementById( 'exercise-modal' ).classList.add( 'hidden' );
}

/**
 * Setup autocomplete for exercise ID input.
 *
 * @return {void}
 */
function setupIdAutocomplete() {
	const datalist = document.getElementById( 'exercise-ids' );
	if ( ! datalist ) {
		return;
	}

	// Get all existing exercise IDs
	const existingIds = getAllExerciseIds();

	// Populate datalist
	datalist.innerHTML = '';
	existingIds.forEach( id => {
		const option = document.createElement( 'option' );
		option.value = id;
		datalist.appendChild( option );
	} );
}

/**
 * Save exercise from modal form.
 *
 * @return {void}
 */
function saveExercise() {
	try {
		const type = document.getElementById( 'ex-type' ).value;

		let exercise;

		if ( type === 'alternatives' ) {
			const alternativesText = document.getElementById( 'ex-alternatives' ).value;
			exercise = {
				id: document.getElementById( 'ex-id' ).value,
				type: 'alternatives',
				alternatives: alternativesText ? JSON.parse( alternativesText ) : [],
			};
		} else {
			const timersText = document.getElementById( 'ex-timers' ).value;
			const repCounterText = document.getElementById( 'ex-repcounter' ).value;
			exercise = {
				id: document.getElementById( 'ex-id' ).value,
				type,
				title: document.getElementById( 'ex-title' ).value,
				desc: document.getElementById( 'ex-desc' ).value,
			};

			const weight = document.getElementById( 'ex-weight' ).value;
			if ( weight ) {
				exercise.weight = weight;
				exercise.defaultUnit = document.getElementById( 'ex-unit' ).value;
			}

			if ( timersText ) {
				exercise.timers = JSON.parse( timersText );
			}

			if ( repCounterText ) {
				exercise.repCounter = JSON.parse( repCounterText );
			}
		}

		// Validate ID format
		if ( ! /^[a-z_]+$/.test( exercise.id ) ) {
			alert( 'ID must contain only lowercase letters and underscores.' );
			return;
		}

		// Add or update exercise
		const day = currentSchedule.days[ currentDayIndex ];
		if ( currentExerciseIndex === -1 ) {
			day.details.push( exercise );
		} else {
			day.details[ currentExerciseIndex ] = exercise;
		}

		closeExerciseModal();
		renderExercises();
	} catch ( error ) {
		alert( 'Error saving exercise: ' + error.message );
	}
}

/**
 * Validate current schedule.
 *
 * @return {void}
 */
function validateSchedule() {
	saveDayData();

	const errors = [];

	// Check root structure
	if ( currentSchedule.version !== 1 ) {
		errors.push( 'Version must be 1' );
	}

	if ( ! currentSchedule.days || currentSchedule.days.length !== 7 ) {
		errors.push( 'Must have exactly 7 days' );
	}

	// Check each day
	const seenIds = new Set();
	const seenDayIndexes = new Set();

	currentSchedule.days.forEach( ( day, i ) => {
		if ( ! day.id || ! /^[a-z_]+$/.test( day.id ) ) {
			errors.push( `Day ${i}: Invalid ID format` );
		}
		if ( seenIds.has( day.id ) ) {
			errors.push( `Day ${i}: Duplicate ID '${day.id}'` );
		}
		seenIds.add( day.id );

		if ( day.dayIndex < 0 || day.dayIndex > 7 ) {
			errors.push( `Day ${i}: dayIndex must be 0-7` );
		}
		if ( seenDayIndexes.has( day.dayIndex ) ) {
			errors.push( `Day ${i}: Duplicate dayIndex '${day.dayIndex}'` );
		}
		seenDayIndexes.add( day.dayIndex );

		if ( ! day.name ) {
			errors.push( `Day ${i}: Missing name` );
		}
		if ( ! day.theme ) {
			errors.push( `Day ${i}: Missing theme` );
		}
		if ( ! day.details || ! Array.isArray( day.details ) ) {
			errors.push( `Day ${i}: Missing or invalid details array` );
		}

		// Check exercises
		day.details.forEach( ( ex, j ) => {
			if ( ! ex.id || ! /^[a-z_]+$/.test( ex.id ) ) {
				errors.push( `Day ${i}, Exercise ${j}: Invalid ID format` );
			}
			if ( ! ex.type || ! [ 'warmup', 'main', 'cool', 'alternatives' ].includes( ex.type ) ) {
				errors.push( `Day ${i}, Exercise ${j}: Invalid type` );
			}
			if ( ex.type === 'alternatives' ) {
				if ( ! ex.alternatives || ex.alternatives.length < 2 ) {
					errors.push( `Day ${i}, Exercise ${j}: Alternatives must have at least 2 options` );
				}
			} else {
				if ( ! ex.title ) {
					errors.push( `Day ${i}, Exercise ${j}: Missing title` );
				}
				if ( ! ex.desc ) {
					errors.push( `Day ${i}, Exercise ${j}: Missing description` );
				}
			}
		} );
	} );

	if ( errors.length === 0 ) {
		alert( '✅ Schedule is valid!' );
	} else {
		alert( '❌ Validation errors:\n\n' + errors.join( '\n' ) );
	}
}

/**
 * Export schedule as JSON file.
 *
 * @return {void}
 */
function exportSchedule() {
	saveDayData();

	const json = JSON.stringify( currentSchedule, null, 2 );
	const blob = new Blob( [ json ], { type: 'application/json' } );
	const url = URL.createObjectURL( blob );

	const a = document.createElement( 'a' );
	a.href = url;
	a.download = scheduleFilename || 'schedule.json';
	document.body.appendChild( a );
	a.click();
	document.body.removeChild( a );
	URL.revokeObjectURL( url );

	alert( 'Schedule exported! Commit to Git to deploy.' );
}

// Expose functions to global scope for HTML onclick handlers
window.loadAvailableSchedules = loadAvailableSchedules;
window.createNewSchedule = createNewSchedule;
window.loadSchedule = loadSchedule;
window.importSchedule = importSchedule;
window.pasteJSON = pasteJSON;
window.switchDay = switchDay;
window.deleteExercise = deleteExercise;
window.addExercise = addExercise;
window.editExercise = editExercise;
window.saveExercise = saveExercise;
window.validateSchedule = validateSchedule;
window.exportSchedule = exportSchedule;
