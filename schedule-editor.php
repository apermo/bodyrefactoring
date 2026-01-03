<?php
/**
 * Schedule Editor/Generator Tool
 *
 * A web-based interface for creating, editing, and managing training schedule JSON files.
 *
 * @package BodyRefactoring
 */

require_once __DIR__ . '/tools.php';
require_once __DIR__ . '/assets/cachebuster.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Schedule Editor - Body Refactoring</title>
	<script src="https://cdn.tailwindcss.com"></script>
	<script src="https://unpkg.com/lucide@latest"></script>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Roboto:wght@400;500;700;900&display=swap" rel="stylesheet">
	<style>
		body {
			font-family: 'Roboto', sans-serif;
			background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
			min-height: 100vh;
		}
		.font-mono {
			font-family: 'JetBrains Mono', monospace;
		}
		.card {
			background: rgba(30, 41, 59, 0.8);
			backdrop-filter: blur(10px);
			border: 1px solid rgba(148, 163, 184, 0.1);
		}
		.btn {
			transition: all 0.2s ease;
		}
		.btn:hover {
			transform: translateY(-2px);
		}
		.exercise-item {
			transition: all 0.2s ease;
		}
		.exercise-item:hover {
			background: rgba(51, 65, 85, 0.5);
		}
		.day-tab {
			cursor: pointer;
			transition: all 0.2s ease;
		}
		.day-tab.active {
			background: rgba(59, 130, 246, 0.2);
			border-color: rgb(59, 130, 246);
		}
	</style>
</head>
<body class="text-slate-200 p-4">

<div class="max-w-7xl mx-auto">
	<!-- Header -->
	<div class="mb-6">
		<div class="flex items-center justify-between mb-2">
			<h1 class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
				Schedule Editor
			</h1>
			<span class="text-xs text-slate-500 font-mono">v<?php echo APP_VERSION; ?></span>
		</div>
		<p class="text-slate-400 text-sm">Create and edit training schedule JSON files</p>
	</div>

	<!-- Main Controls -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
		<div class="card p-4 rounded-lg">
			<h3 class="font-bold text-white mb-3 flex items-center gap-2">
				<i data-lucide="file-plus" class="w-5 h-5 text-green-400"></i>
				New Schedule
			</h3>
			<input type="date" id="new-schedule-date" class="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm mb-2" />
			<button onclick="createNewSchedule()" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded btn">
				Create New
			</button>
		</div>

		<div class="card p-4 rounded-lg">
			<h3 class="font-bold text-white mb-3 flex items-center gap-2">
				<i data-lucide="folder-open" class="w-5 h-5 text-blue-400"></i>
				Load Existing
			</h3>
			<select id="existing-schedules" class="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm mb-2">
				<option value="">Select a schedule...</option>
			</select>
			<button onclick="loadSchedule()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded btn">
				Load Schedule
			</button>
		</div>

		<div class="card p-4 rounded-lg">
			<h3 class="font-bold text-white mb-3 flex items-center gap-2">
				<i data-lucide="upload" class="w-5 h-5 text-purple-400"></i>
				Import JSON
			</h3>
			<input type="file" id="import-file" accept=".json" class="hidden" onchange="importSchedule(this)" />
			<button onclick="document.getElementById('import-file').click()" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded btn mb-2">
				Import File
			</button>
			<button onclick="pasteJSON()" class="w-full bg-purple-600/50 hover:bg-purple-700/50 text-white font-bold py-2 px-4 rounded btn text-sm">
				Paste JSON
			</button>
		</div>
	</div>

	<!-- Editor Area (Hidden by default) -->
	<div id="editor-area" class="hidden">
		<!-- Schedule Info -->
		<div class="card p-4 rounded-lg mb-4">
			<div class="flex items-center justify-between mb-4">
				<div>
					<h2 class="text-xl font-bold text-white">Editing Schedule</h2>
					<p class="text-sm text-slate-400" id="schedule-info">No schedule loaded</p>
				</div>
				<div class="flex gap-2">
					<button onclick="validateSchedule()" class="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded btn flex items-center gap-2">
						<i data-lucide="check-circle" class="w-4 h-4"></i>
						Validate
					</button>
					<button onclick="exportSchedule()" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded btn flex items-center gap-2">
						<i data-lucide="download" class="w-4 h-4"></i>
						Export & Deploy via Git
					</button>
				</div>
			</div>
			<div class="text-xs text-slate-400 bg-slate-900/50 border border-slate-700 rounded p-3">
				<strong>💡 Deployment:</strong> Export the schedule, save it to <code class="text-cyan-400">trainings/</code> folder, validate with CLI, then commit and push to Git for automatic deployment.
			</div>
		</div>

		<!-- Day Tabs -->
		<div class="flex gap-2 mb-4 overflow-x-auto pb-2">
			<div class="day-tab card px-4 py-2 rounded-lg border-2 border-transparent" data-day="0" onclick="switchDay(0)">
				<div class="font-bold text-sm">Sunday</div>
			</div>
			<div class="day-tab card px-4 py-2 rounded-lg border-2 border-transparent active" data-day="1" onclick="switchDay(1)">
				<div class="font-bold text-sm">Monday</div>
			</div>
			<div class="day-tab card px-4 py-2 rounded-lg border-2 border-transparent" data-day="2" onclick="switchDay(2)">
				<div class="font-bold text-sm">Tuesday</div>
			</div>
			<div class="day-tab card px-4 py-2 rounded-lg border-2 border-transparent" data-day="3" onclick="switchDay(3)">
				<div class="font-bold text-sm">Wednesday</div>
			</div>
			<div class="day-tab card px-4 py-2 rounded-lg border-2 border-transparent" data-day="4" onclick="switchDay(4)">
				<div class="font-bold text-sm">Thursday</div>
			</div>
			<div class="day-tab card px-4 py-2 rounded-lg border-2 border-transparent" data-day="5" onclick="switchDay(5)">
				<div class="font-bold text-sm">Friday</div>
			</div>
			<div class="day-tab card px-4 py-2 rounded-lg border-2 border-transparent" data-day="6" onclick="switchDay(6)">
				<div class="font-bold text-sm">Saturday</div>
			</div>
		</div>

		<!-- Day Editor -->
		<div id="day-editor" class="grid grid-cols-1 lg:grid-cols-3 gap-4">
			<!-- Day Properties -->
			<div class="card p-4 rounded-lg">
				<h3 class="font-bold text-white mb-3">Day Properties</h3>
				<div class="space-y-3">
					<div>
						<label class="text-xs text-slate-400 block mb-1">ID</label>
						<input type="text" id="day-id" class="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm" />
					</div>
					<div>
						<label class="text-xs text-slate-400 block mb-1">Name</label>
						<input type="text" id="day-name" class="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm" />
					</div>
					<div>
						<label class="text-xs text-slate-400 block mb-1">Theme</label>
						<input type="text" id="day-theme" class="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm" />
					</div>
					<div>
						<label class="text-xs text-slate-400 block mb-1">Icon</label>
						<input type="text" id="day-icon" class="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm" placeholder="dumbbell" />
					</div>
					<div>
						<label class="text-xs text-slate-400 block mb-1">Color Class</label>
						<input type="text" id="day-color" class="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm" placeholder="text-blue-400" />
					</div>
					<div>
						<label class="text-xs text-slate-400 block mb-1">Background Class</label>
						<input type="text" id="day-bg" class="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm" placeholder="bg-blue-500/10" />
					</div>
				</div>
			</div>

			<!-- Exercises List -->
			<div class="lg:col-span-2 card p-4 rounded-lg">
				<div class="flex items-center justify-between mb-3">
					<h3 class="font-bold text-white">Exercises</h3>
					<button onclick="addExercise()" class="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded btn text-sm flex items-center gap-1">
						<i data-lucide="plus" class="w-4 h-4"></i>
						Add Exercise
					</button>
				</div>
				<div id="exercises-list" class="space-y-2 max-h-[600px] overflow-y-auto">
					<!-- Exercises will be rendered here -->
				</div>
			</div>
		</div>
	</div>

	<!-- Exercise Modal -->
	<div id="exercise-modal" class="hidden fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
		<div class="card p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between mb-4">
				<h3 class="text-xl font-bold text-white">Edit Exercise</h3>
				<button onclick="closeExerciseModal()" class="text-slate-400 hover:text-white">
					<i data-lucide="x" class="w-6 h-6"></i>
				</button>
			</div>
			<div id="exercise-form" class="space-y-4">
				<!-- Form will be dynamically generated -->
			</div>
			<div class="flex gap-2 mt-6">
				<button onclick="saveExercise()" class="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded btn">
					Save Exercise
				</button>
				<button onclick="closeExerciseModal()" class="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded btn">
					Cancel
				</button>
			</div>
		</div>
	</div>
</div>

<script src="<?php echo asset( 'assets/js/schedule-editor.js' ); ?>"></script>
<script>
	// Initialize Lucide icons
	lucide.createIcons();

	// Load available schedules on page load
	window.onload = () => {
		loadAvailableSchedules();
	};
</script>

</body>
</html>

