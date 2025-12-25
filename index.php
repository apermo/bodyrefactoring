<?php
require_once 'assets/cachebuster.php';

$version = '8.0';

?>
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="BodyRefactoring">
    <link rel="apple-touch-icon" href="gymlogo.png">
    <link rel="icon" type="image/png" href="gymlogo.png">
    <meta name="robots" content="noindex, nofollow, noarchive">
    <title>Body Refactoring App v<?php echo $version; ?></title>

    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Roboto:wght@300;400;700;900&display=swap"
          rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>

    <link rel="stylesheet" href="<?php echo asset( 'assets/css/styles.css' ); ?>">
</head>
<body onclick="closeMenuOutside(event)">

<div id="bg-fixed"></div>

<video id="nosleep-video" playsinline muted loop
       style="opacity: 0; pointer-events: none; position: absolute; width: 1px; height: 1px;">
    <source src="data:video/mp4;base64,AAAAHGZ0eXBNNEVAAAAAAAEAAQAAAAAAAAAAAAAAAAtmoovlmD7AAAABh1tZGF0AAAAAAAAAAAAAA=="
            type="video/mp4">
</video>

<input type="file" id="import-input" class="hidden" accept=".json" onchange="importData(this)">

<div id="completion-modal" class="modal-overlay">
    <div class="modal-content">
        <div class="text-6xl mb-4">🔥</div>
        <h2 class="text-2xl font-black text-white mb-2 uppercase">Training Complete!</h2>
        <p id="modal-quote" class="text-slate-400 mb-6 italic">"Konsistenz schlägt Intensität."</p>
        <div class="bg-slate-800 rounded-xl p-4 mb-6 border border-slate-700">
            <div class="text-xs text-slate-500 uppercase tracking-widest">Aktuelle Streak</div>
            <div class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500"
                 id="modal-streak">0 Tage
            </div>
        </div>
        <button onclick="closeModal()"
                class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition">Weiter so!
        </button>
    </div>
</div>

<div id="splash-screen">
    <h1 class="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-4 animate-pulse">
        BODY REFACTORING</h1>
    <div class="text-slate-500 font-mono text-xs">INITIALIZING v<?php echo $version; ?>...</div>
</div>

<div class="app-container">

    <div class="flex justify-between items-center mb-6 pt-4 relative z-50">
        <div>
            <h1 class="text-xl font-black text-white uppercase leading-none">
                <span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Body</span>
                Refactoring
            </h1>
            <p class="text-slate-500 font-mono text-[10px] mt-1">v<?php echo $version; ?></p>
        </div>

        <div class="flex items-center gap-3">
            <div id="streak-container" class="streak-badge hidden">
                <i data-lucide="flame" class="w-4 h-4 fill-white"></i>
                <span id="streak-count">0</span>
                <span id="medal-icon" class="ml-1"></span>
            </div>

            <button id="menu-btn" onclick="toggleMenu(event)"
                    class="p-2 bg-slate-800/80 backdrop-blur rounded-lg text-slate-300 border border-slate-700 hover:bg-slate-700 transition">
                <i data-lucide="menu" class="w-6 h-6"></i>
            </button>
        </div>

        <div id="menu-dropdown"
             class="hidden absolute right-0 top-16 w-60 bg-slate-800/95 backdrop-blur border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex-col">
            <button onclick="exportData()"
                    class="px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white border-b border-slate-700 flex items-center gap-3">
                <i data-lucide="download" class="w-4 h-4 text-blue-400"></i> Backup speichern
            </button>
            <button onclick="triggerImport()"
                    class="px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white border-b border-slate-700 flex items-center gap-3">
                <i data-lucide="upload" class="w-4 h-4 text-emerald-400"></i> Backup laden
            </button>
            <button onclick="forceUpdate()"
                    class="px-4 py-3 text-left text-sm text-yellow-400 hover:bg-slate-700 hover:text-yellow-300 flex items-center gap-3 border-b border-slate-700">
                <i data-lucide="refresh-cw" class="w-4 h-4"></i> App aktualisieren
            </button>
            <a href="https://christoph-daum.de" target="_blank"
               class="px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-3">
                <i data-lucide="globe" class="w-4 h-4"></i> Website
            </a>
            <a href="https://github.com/apermo/bodyrefactoring" target="_blank"
               class="px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-3">
                <i data-lucide="github" class="w-4 h-4"></i> GitHub Repo
            </a>
        </div>
    </div>

    <div class="bg-slate-800/80 backdrop-blur-sm p-3 rounded-2xl border border-slate-700/50 flex justify-between items-center sticky top-2 z-30 shadow-lg mb-6">
        <button onclick="changeWeek(-1)" id="btn-prev" class="nav-btn w-10 h-10"><i data-lucide="chevron-left"
                                                                                    class="w-6 h-6"></i></button>
        <div class="text-center">
            <div class="text-[10px] text-slate-500 uppercase tracking-widest font-bold">WOCHE</div>
            <div id="week-display" class="font-bold text-white text-base">Aktuell</div>
        </div>
        <button onclick="changeWeek(1)" id="btn-next" class="nav-btn w-10 h-10"><i data-lucide="chevron-right"
                                                                                   class="w-6 h-6"></i></button>
    </div>

    <div id="schedule-container"></div>

    <button id="fab-timer" class="fab-timer" onclick="toggleTimer()">
        <i data-lucide="timer" class="w-6 h-6"></i>
        <span id="timer-text">60s Pause</span>
    </button>

    <footer class="mt-12 pt-8 border-t border-slate-800/50 text-center space-y-4 pb-8">
        <div class="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed px-4 bg-slate-900/50 p-4 rounded-xl backdrop-blur-sm">
            Dies ist eine private Web App zur persönlichen Nutzung. Da die URL nicht öffentlich beworben wird, erfolgt
            keine explizite Consent-Abfrage. Durch die Einbindung externer Ressourcen (CDNs) ist es möglich, dass
            technische Daten (wie deine IP-Adresse) von Dritten verarbeitet werden. Alle Trainingsdaten werden
            ausschließlich lokal auf deinem Gerät gespeichert.
        </div>
        <div class="flex justify-center items-center gap-6 text-xs font-mono">
            <a href="https://christoph-daum.de" target="_blank"
               class="text-slate-300 hover:text-white transition flex items-center gap-2 bg-slate-900/50 px-3 py-1 rounded-full">
                <i data-lucide="globe" class="w-3 h-3 inline"></i> Christoph Daum
            </a>
            <a href="https://github.com/apermo/bodyrefactoring" target="_blank"
               class="text-slate-300 hover:text-white transition flex items-center gap-2 bg-slate-900/50 px-3 py-1 rounded-full">
                <i data-lucide="github" class="w-3 h-3 inline"></i> GitHub Repo
            </a>
        </div>
    </footer>

</div>

<script>
    // --- GLOBAL STATE ---
    let currentWeekOffset = 0;
    const STORAGE_PREFIX = "body_refactoring_v1_";
    const NOTE_PREFIX = "body_refactoring_note_";
    const WEIGHT_PREFIX = "body_refactoring_weight_";
    const UNIT_PREFIX = "body_refactoring_unit_";

    // Global State for Dynamic Scheduling
    const state = {
        availableSchedules: [], // List of { date: 'YYYY-MM-DD', file: '...' }
        scheduleCache: {},      // Cache content of JSON files
        startDate: null         // Derived from first schedule
    };

    const quotes = [
        "Stark! Wieder einen Tag geschafft.",
        "Konsistenz ist der Schlüssel zum Erfolg.",
        "Dein Zukunfts-Ich dankt dir.",
        "Keine Ausreden, nur Ergebnisse.",
        "Level Up! Du wirst jeden Tag besser.",
        "Schweiß ist nur Fett, das weint.",
        "Disziplin ist Freiheit.",
        "Ein Schritt näher am Ziel."
    ];

    // --- INIT & DATA FETCHING ---
    async function initApp() {
        try {
            const response = await fetch('trainings/index.php');
            if (!response.ok) throw new Error("API Error");

            state.availableSchedules = await response.json();

            if (state.availableSchedules.length > 0) {
                state.startDate = new Date(state.availableSchedules[0].date + "T00:00:00");
                await renderSchedule(); // Initial render
                setTimeout(() => {
                    document.getElementById('splash-screen').style.opacity = '0';
                }, 800);
                setTimeout(() => {
                    document.getElementById('splash-screen').style.display = 'none';
                }, 1300);
            } else {
                alert("Keine Trainingspläne gefunden.");
            }
        } catch (e) {
            console.error(e);
            alert("Fehler beim Laden der Trainingspläne. Webserver erforderlich!");
        }
    }

    async function fetchScheduleForDate(dateStr) {
        // Logic: Find latest schedule where schedule.date <= dateStr
        // Schedules are sorted asc by date from backend
        let bestMatch = null;
        for (const sched of state.availableSchedules) {
            if (sched.date <= dateStr) {
                bestMatch = sched;
            } else {
                break;
            }
        }

        if (!bestMatch) return null; // Should not happen if date >= startDate

        // Check Cache
        if (state.scheduleCache[bestMatch.file]) {
            return state.scheduleCache[bestMatch.file];
        }

        // Fetch
        const res = await fetch(`trainings/${bestMatch.file}`);
        const json = await res.json();
        state.scheduleCache[bestMatch.file] = json;
        return json;
    }

    // --- CORE FUNCTIONS ---
    function getLocalISODate(date) {
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
    }

    async function getComputedSchedule() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const currentDayIndex = today.getDay();
        const distanceToMonday = (currentDayIndex + 6) % 7;

        const thisWeekMonday = new Date(today);
        thisWeekMonday.setDate(today.getDate() - distanceToMonday);

        const displayedMonday = new Date(thisWeekMonday);
        displayedMonday.setDate(thisWeekMonday.getDate() + (currentWeekOffset * 7));

        // Generate 7 day objects async
        const daysPromise = Array.from({length: 7}, async (_, idx) => {
            const targetDate = new Date(displayedMonday);
            targetDate.setDate(displayedMonday.getDate() + idx);
            targetDate.setHours(0, 0, 0, 0);

            const isoDate = getLocalISODate(targetDate);
            const currentYear = new Date().getFullYear();
            let dateOptions = {day: '2-digit', month: '2-digit'};
            if (targetDate.getFullYear() !== currentYear) dateOptions.year = 'numeric';
            const dateStr = targetDate.toLocaleDateString('de-DE', dateOptions);

            // Fetch Config for this specific day
            // (This allows mid-week schedule changes!)
            const scheduleConfig = await fetchScheduleForDate(isoDate);

            // Find correct day in config (Mon=1 ... Sun=0)
            // Note: getDay() returns 0 for Sun, 1 for Mon
            const targetDayIndex = targetDate.getDay();

            let dayData = null;
            if (scheduleConfig) {
                dayData = scheduleConfig.find(d => d.dayIndex === targetDayIndex);
            }

            // If no data found (e.g. before start date), return dummy or null
            if (!dayData) {
                return {
                    id: 'invalid', name: '---', theme: '', details: [],
                    displayDate: dateStr, storageDate: isoDate, fullDateObj: targetDate,
                    isRealToday: false, isLocked: true
                };
            }

            const diffTime = today - targetDate;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            let isLocked = targetDate > today || diffDays > 3;
            const isRealToday = getLocalISODate(today) === isoDate;

            // Merge static config with calculated props
            return {
                ...dayData,
                displayDate: dateStr,
                storageDate: isoDate,
                fullDateObj: targetDate,
                isRealToday: isRealToday,
                isLocked: isLocked
            };
        });

        return Promise.all(daysPromise);
    }

    async function renderSchedule() {
        const container = document.getElementById('schedule-container');
        // Don't clear immediately to prevent flickering if it's fast
        // container.innerHTML = '<div class="text-center text-slate-500 py-8">Lade Daten...</div>';

        const computedSchedule = await getComputedSchedule();
        container.innerHTML = ''; // Clear now

        // Nav Logic
        const btnPrev = document.getElementById('btn-prev');
        const weekDisplay = document.getElementById('week-display');

        // Allow going back only if Monday is >= Global Start Date
        const mondayDate = computedSchedule[0].fullDateObj;
        const startDateClean = new Date(state.startDate);
        startDateClean.setHours(0, 0, 0, 0);

        btnPrev.disabled = mondayDate <= startDateClean;

        if (currentWeekOffset === 0) weekDisplay.innerText = "Aktuelle Woche";
        else if (currentWeekOffset > 0) weekDisplay.innerText = `+${currentWeekOffset} Wochen`;
        else weekDisplay.innerText = `${currentWeekOffset} Wochen`;

        let activeElementId = null;

        computedSchedule.forEach((day) => {
            if (day.id === 'invalid') return; // Skip invalid days

            const card = document.createElement('div');
            card.id = `card-${day.storageDate}`;

            let lockedClass = day.isLocked ? 'day-locked' : '';
            let activeClass = day.isRealToday ? 'day-active' : '';
            if (day.isRealToday) activeElementId = `card-${day.storageDate}`;

            card.className = `day-card rounded-2xl bg-slate-800/40 border border-slate-700/50 overflow-hidden cursor-pointer ${activeClass} ${lockedClass}`;

            // Check Completion (Sync check is fine here)
            let allDone = false;
            if (day.details.length > 0) {
                allDone = isDayComplete(day.storageDate, day.details);
            }

            if (allDone) card.classList.add('day-complete');

            let lockIcon = day.isLocked ? `<span class="bg-slate-700/50 text-slate-500 px-2 py-1 rounded ml-2 flex items-center lock-icon"><i data-lucide="lock" class="w-3 h-3"></i></span>` : '';

            let headerHtml = `
                    <div class="p-5 flex justify-between items-center card-header-content" onclick="toggleAccordion('${day.storageDate}')">
                        <div class="flex items-center gap-4">
                            <div class="${day.bgClass} ${day.colorClass} p-3 rounded-xl">
                                <i data-lucide="${day.icon}"></i>
                            </div>
                            <div>
                                <h3 class="text-lg font-bold text-white flex items-center gap-2 flex-wrap">
                                    ${day.name} 
                                    <span class="text-slate-500 font-normal text-xs ml-1 bg-slate-900/50 px-2 py-0.5 rounded">${day.displayDate}</span>
                                    ${day.isRealToday ? '<span class="today-badge">HEUTE</span>' : ''}
                                    <span class="completed-badge" style="display:${allDone ? 'inline-block' : 'none'}" id="badge-${day.storageDate}">DONE</span>
                                    ${lockIcon}
                                </h3>
                                <p class="text-xs ${day.colorClass} font-mono opacity-80 mt-1">${day.theme}</p>
                            </div>
                        </div>
                        <i data-lucide="chevron-down" id="icon-${day.storageDate}" class="text-slate-500 transition-transform duration-300 ${day.isRealToday ? 'rotate-180' : ''}"></i>
                    </div>
                `;

            let exercisesHtml = '';
            day.details.forEach(ex => {
                const uniqueKey = `${STORAGE_PREFIX}${day.storageDate}_${ex.id}`;
                let isChecked = localStorage.getItem(uniqueKey) === 'true';

                // --- RENDER LOGIC ---
                if (ex.type === 'alternatives') {
                    let altContent = '';
                    ex.alternatives.forEach((alt, idx) => {
                        let altTimersHtml = '';
                        if (alt.timers) {
                            altTimersHtml = `<div class="flex gap-2 mt-1 flex-wrap">` +
                                alt.timers.map(t => `<div class="timer-chip" onclick="startSpecificTimer(${t.s}, '${t.l} ${alt.title}')"><i data-lucide="clock" class="w-3 h-3"></i> ${t.l}</div>`).join('') +
                                `</div>`;
                        }

                        altContent += `
                                <div>
                                    <div class="font-bold text-white text-lg leading-tight">${alt.title}</div>
                                    <div class="text-xs text-slate-400 mt-0.5">${alt.desc}</div>
                                    ${altTimersHtml}
                                </div>
                            `;
                        if (idx < ex.alternatives.length - 1) {
                            altContent += `<div class="alt-divider">ODER</div>`;
                        }
                    });

                    exercisesHtml += `
                            <div class="flex items-start gap-4 exercise-row group py-4 border-b border-slate-800/50 last:border-0 ${isChecked ? 'completed' : ''}" 
                                 onclick="${day.isLocked ? '' : `toggleCheck(this, '${uniqueKey}', '${day.storageDate}')`}">
                                <div class="w-8 h-8 rounded-full border-2 border-slate-500 check-circle flex items-center justify-center flex-shrink-0 mt-1">
                                    <i data-lucide="check" class="w-5 h-5 text-slate-900"></i>
                                </div>
                                <div class="flex-grow exercise-text">
                                    <div class="phase-badge badge-main mb-1">MISSION</div>
                                    <div class="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                                        ${altContent}
                                    </div>
                                </div>
                            </div>
                        `;
                } else {
                    let badgeClass = ex.type === 'warmup' ? 'badge-warmup' : ex.type === 'main' ? 'badge-main' : 'badge-cool';
                    let badgeText = ex.type === 'warmup' ? 'Warm Up' : ex.type === 'main' ? 'Mission' : 'Cooldown';

                    let timersHtml = '';
                    if (ex.timers) {
                        timersHtml = `<div class="flex gap-2 mt-2 flex-wrap">` +
                            ex.timers.map(t => `<div class="timer-chip" onclick="startSpecificTimer(${t.s}, '${t.l} ${ex.title}')"><i data-lucide="clock" class="w-3 h-3"></i> ${t.l}</div>`).join('') +
                            `</div>`;
                    }

                    let rightSide = '';
                    if (ex.weight) {
                        const unitKey = `${UNIT_PREFIX}${ex.id}`;
                        const userUnit = localStorage.getItem(unitKey) || ex.defaultUnit || 'KG';
                        const currentWeight = getSmartWeight(ex.id, day.fullDateObj, ex.weight);

                        rightSide = `
                                <div class="weight-box rounded-lg p-2 w-24 flex flex-col items-center justify-center border border-slate-700 bg-slate-900/80 z-10" onclick="event.stopPropagation()">
                                    <input type="number" 
                                        inputmode="numeric" 
                                        pattern="[0-9]*" 
                                        class="weight-input" 
                                        value="${currentWeight}" 
                                        onfocus="focusWeightInput(this)"
                                        onblur="handleWeightBlur('${ex.id}', '${day.storageDate}', this)"
                                        onkeydown="if(event.key==='Enter') this.blur()"
                                    >
                                    <span class="text-[9px] text-slate-500 uppercase font-bold mt-1 unit-toggle" onclick="toggleUnit('${ex.id}', this)">${userUnit}</span>
                                </div>`;
                    }

                    exercisesHtml += `
                            <div class="flex items-start gap-4 exercise-row group py-4 border-b border-slate-800/50 last:border-0 ${isChecked ? 'completed' : ''}" 
                                 onclick="${day.isLocked ? '' : `toggleCheck(this, '${uniqueKey}', '${day.storageDate}')`}">
                                <div class="w-8 h-8 rounded-full border-2 border-slate-500 check-circle flex items-center justify-center flex-shrink-0 mt-1">
                                    <i data-lucide="check" class="w-5 h-5 text-slate-900"></i>
                                </div>
                                <div class="flex-grow exercise-text">
                                    <div class="${badgeClass} mb-1">${badgeText}</div>
                                    <div class="font-bold text-white text-lg leading-tight">${ex.title}</div>
                                    <div class="text-xs text-slate-400 mt-0.5">${ex.desc}</div>
                                    ${timersHtml}
                                </div>
                                ${rightSide}
                            </div>
                        `;
                }
            });

            const noteKey = `${NOTE_PREFIX}${day.storageDate}`;
            const savedNote = localStorage.getItem(noteKey) || '';
            const prevMemo = getPreviousMemo(day.storageDate);
            let prevMemoHtml = prevMemo ? `<div class="mt-2 p-3 rounded-lg border border-dashed border-slate-700 bg-slate-800/50"><div class="text-[10px] text-slate-500 uppercase flex items-center gap-1 mb-1"><i data-lucide="history" class="w-3 h-3"></i> Memo von letzter Woche</div><div class="text-sm text-slate-400 italic">"${prevMemo}"</div></div>` : '';

            const detailsHtml = `
                    <div id="details-${day.storageDate}" class="${day.isRealToday ? '' : 'hidden'} border-t border-slate-700/50 bg-slate-900/30">
                        <div class="p-5">
                            ${exercisesHtml}
                            <div class="mt-4 pt-4 border-t border-slate-800">
                                <label class="text-[10px] text-slate-500 uppercase font-bold mb-2 block tracking-wider">Logbuch</label>
                                <textarea oninput="saveNote('${noteKey}', this.value)" class="w-full bg-slate-900/80 border border-slate-700 rounded-lg p-3 text-sm text-slate-300 focus:outline-none focus:border-blue-500 transition-colors h-24 resize-none mb-2" placeholder="Notizen...">${savedNote}</textarea>
                                ${prevMemoHtml}
                            </div>
                        </div>
                    </div>
                `;

            card.innerHTML = headerHtml + detailsHtml;
            container.appendChild(card);
        });

        lucide.createIcons();

        // Scroll logic
        if (activeElementId) {
            setTimeout(() => {
                const el = document.getElementById(activeElementId);
                if (el) {
                    const y = el.getBoundingClientRect().top + window.pageYOffset - 140;
                    window.scrollTo({top: y, behavior: 'smooth'});
                }
            }, 200); // Slight delay for rendering
        }

        calculateStreak();
    }

    // --- HELPERS ---
    function getSmartWeight(exerciseId, targetDate, defaultWeight) {
        let searchDate = new Date(targetDate);
        searchDate.setHours(0, 0, 0, 0);

        while (searchDate >= state.startDate) {
            const dateStr = getLocalISODate(searchDate);
            const key = `${WEIGHT_PREFIX}${exerciseId}_${dateStr}`;
            const saved = localStorage.getItem(key);
            if (saved) return saved;
            searchDate.setDate(searchDate.getDate() - 1);
        }
        return defaultWeight;
    }

    function getPreviousMemo(targetDateIso) {
        const current = new Date(targetDateIso);
        const prevDate = new Date(current);
        prevDate.setDate(prevDate.getDate() - 7);
        const prevIso = getLocalISODate(prevDate);
        return localStorage.getItem(`${NOTE_PREFIX}${prevIso}`);
    }

    function changeWeek(direction) {
        if (direction === -1 && document.getElementById('btn-prev').disabled) return;
        currentWeekOffset += direction;
        renderSchedule();
    }

    function toggleAccordion(dateId) {
        const details = document.getElementById(`details-${dateId}`);
        const icon = document.getElementById(`icon-${dateId}`);
        if (details.classList.contains('hidden')) {
            details.classList.remove('hidden');
            icon.style.transform = 'rotate(180deg)';
        } else {
            details.classList.add('hidden');
            icon.style.transform = 'rotate(0deg)';
        }
    }

    function toggleCheck(row, storageKey, dateId) {
        row.classList.toggle('completed');
        if (row.classList.contains('completed')) {
            localStorage.setItem(storageKey, 'true');
            miniConfetti(row.querySelector('.check-circle'));
        } else {
            localStorage.removeItem(storageKey);
        }
        checkDayCompletion(dateId);
        calculateStreak();
    }

    function saveNote(key, value) {
        localStorage.setItem(key, value);
    }

    function saveWeight(exId, dateIso, value) {
        localStorage.setItem(`${WEIGHT_PREFIX}${exId}_${dateIso}`, value);
    }

    function toggleUnit(exId, element) {
        event.stopPropagation();
        const current = element.innerText;
        const newUnit = current === 'KG' ? 'STUFE' : 'KG';
        element.innerText = newUnit;
        localStorage.setItem(`${UNIT_PREFIX}${exId}`, newUnit);
    }

    function focusWeightInput(input) {
        const val = input.value;
        input.value = '';
        input.value = val;
    }

    function handleWeightBlur(exId, dateIso, input) {
        let val = parseInt(input.value);
        if (isNaN(val) || val < 0) val = 0;
        input.value = val;
        saveWeight(exId, dateIso, val);
    }

    // Updated completion check needs to handle async rendering,
    // but here we call it from click handlers where data is ready.
    // HOWEVER: isDayComplete needs 'details' array which we don't have globally anymore.
    // We need to fetch it from the 'computedSchedule' or similar.
    // But since we render, we can pass it or look it up.
    // Simple fix: We reload the schedule for that day? Expensive.
    // Better: We rely on the rendered DOM or pass the details.

    // REFACTOR: checkDayCompletion now just triggers UI updates, actual logic in isDayComplete
    // But isDayComplete needs the list of exercises.
    // Solution: Since we need to look up config anyway, let's keep it simple:
    // When clicking, we check if all .exercise-row in current container are checked.
    function checkDayCompletion(dateId) {
        const container = document.getElementById(`details-${dateId}`);
        const card = document.getElementById(`card-${dateId}`);
        const badge = document.getElementById(`badge-${dateId}`);

        const total = container.querySelectorAll('.exercise-row').length;
        const done = container.querySelectorAll('.exercise-row.completed').length;

        if (total > 0 && total === done) {
            if (!card.classList.contains('day-complete')) {
                card.classList.add('day-complete');
                badge.style.display = 'inline-block';
                showCompletionPopup();
            }
        } else {
            card.classList.remove('day-complete');
            badge.style.display = 'none';
        }
    }

    // Helper for Streak Calculation (needs config access)
    // Since streak calculation is heavy with dynamic schedules, we optimize:
    // We only check streak on init and when a task changes.
    // We need to iterate dates backwards and fetch config for each.
    async function calculateStreak() {
        let streak = 0;
        let checkDate = new Date();
        const todayIso = getLocalISODate(checkDate);

        // To do this properly async, we need the schedule config for 'checkDate'
        // We can reuse fetchScheduleForDate which caches.

        // Check Today
        let config = await fetchScheduleForDate(todayIso);
        let dayIdx = checkDate.getDay();
        let dayData = config ? config.find(d => d.dayIndex === dayIdx) : null;

        if (dayData && isDayComplete(todayIso, dayData.details)) {
            streak++;
        }

        checkDate.setDate(checkDate.getDate() - 1);

        while (true) {
            const dateStr = getLocalISODate(checkDate);
            if (dateStr < getLocalISODate(state.startDate)) break;

            config = await fetchScheduleForDate(dateStr);
            dayIdx = checkDate.getDay();
            dayData = config ? config.find(d => d.dayIndex === dayIdx) : null;

            if (dayData && isDayComplete(dateStr, dayData.details)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        const streakEl = document.getElementById('streak-container');
        const countEl = document.getElementById('streak-count');
        const medalEl = document.getElementById('medal-icon');

        if (streak > 0) {
            streakEl.classList.remove('hidden');
            countEl.innerText = streak;
            document.getElementById('modal-streak').innerText = `${streak} Tage`;

            let medal = '';
            if (streak >= 14) medal = '🥇';
            else if (streak >= 7) medal = '🥈';
            else if (streak >= 3) medal = '🥉';
            medalEl.innerText = medal;
        } else {
            streakEl.classList.add('hidden');
            document.getElementById('modal-streak').innerText = `0 Tage`;
        }
    }

    // Logic check using passed details
    function isDayComplete(dateIso, details) {
        if (!details || details.length === 0) return false;
        return details.every(ex => {
            return localStorage.getItem(`${STORAGE_PREFIX}${dateIso}_${ex.id}`) === 'true';
        });
    }

    function showCompletionPopup() {
        const modal = document.getElementById('completion-modal');
        const quoteEl = document.getElementById('modal-quote');
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        quoteEl.innerText = `"${randomQuote}"`;
        modal.classList.add('open');
        superConfetti();
    }

    function closeModal() {
        document.getElementById('completion-modal').classList.remove('open');
    }

    function toggleMenu(e) {
        if (e) e.stopPropagation();
        const menu = document.getElementById('menu-dropdown');
        menu.classList.toggle('hidden');
    }

    function closeMenuOutside(e) {
        const menu = document.getElementById('menu-dropdown');
        const btn = document.getElementById('menu-btn');
        if (!menu.classList.contains('hidden') && !menu.contains(e.target) && !btn.contains(e.target)) {
            menu.classList.add('hidden');
        }
    }

    function triggerImport() {
        document.getElementById('import-input').click();
        toggleMenu();
    }

    function forceUpdate() {
        if (confirm("Update laden?")) {
            const url = new URL(window.location.href);
            url.searchParams.set('update', Date.now());
            window.location.href = url.toString();
        }
    }

    function enableNoSleep() {
        const video = document.getElementById('nosleep-video');
        video.play().catch(e => console.log("Video play failed", e));
    }

    function speak(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'de-DE';
            utterance.rate = 1.1;
            window.speechSynthesis.speak(utterance);
        }
    }

    function getSpokenText(label) {
        return label.replace(/\bMin\b/g, "Minuten").replace(/(\d+)s\b/g, "$1 Sekunden");
    }

    function startSpecificTimer(seconds, label) {
        event.stopPropagation();
        resetTimer();
        timeLeft = seconds;
        currentTimerLabel = label;
        document.getElementById('timer-text').innerText = label;
        const spokenLabel = getSpokenText(label);
        startTimerLogic(spokenLabel);
    }

    function toggleTimer() {
        if (isRunning) {
            resetTimer();
            speak("Timer abgebrochen.");
        } else {
            timeLeft = 60;
            currentTimerLabel = "60s Pause";
            document.getElementById('timer-text').innerText = currentTimerLabel;
            startTimerLogic("60 Sekunden Pause");
        }
    }

    function startTimerLogic(spokenTextStart) {
        enableNoSleep();
        speak(`${spokenTextStart} gestartet.`);
        isRunning = true;
        document.getElementById('fab-timer').classList.add('running');

        timerInterval = setInterval(() => {
            timeLeft--;
            const mins = Math.floor(timeLeft / 60);
            const secs = timeLeft % 60;
            const displayTime = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
            document.getElementById('timer-text').innerText = displayTime;

            if (timeLeft === 600) speak("Noch zehn Minuten.");
            if (timeLeft === 300) speak("Noch fünf Minuten.");
            if (timeLeft === 60) speak("Noch eine Minute.");
            if (timeLeft === 30) speak("Noch dreißig Sekunden.");
            if (timeLeft === 10) speak("Zehn Sekunden.");
            if (timeLeft <= 3 && timeLeft > 0) speak(timeLeft.toString());

            if (timeLeft <= 0) {
                resetTimer();
                speak("Zeit abgelaufen! Weiter geht's!");
                navigator.vibrate([200, 100, 200]);
                superConfetti();
            }
        }, 1000);
    }

    function resetTimer() {
        clearInterval(timerInterval);
        isRunning = false;
        document.getElementById('fab-timer').classList.remove('running');
        document.getElementById('fab-timer').innerHTML = '<i data-lucide="timer" class="w-6 h-6"></i><span id="timer-text">60s Pause</span>';
        lucide.createIcons();
        window.speechSynthesis.cancel();
    }

    function exportData() {
        const exportObj = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(STORAGE_PREFIX) || key.startsWith(NOTE_PREFIX) || key.startsWith(WEIGHT_PREFIX) || key.startsWith(UNIT_PREFIX)) {
                exportObj[key] = localStorage.getItem(key);
            }
        }
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
        const dlAnchor = document.createElement('a');
        dlAnchor.setAttribute("href", dataStr);
        dlAnchor.setAttribute("download", `BodyRefactoring_Backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(dlAnchor);
        dlAnchor.click();
        dlAnchor.remove();
    }

    function importData(inputElement) {
        const file = inputElement.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const data = JSON.parse(e.target.result);
                Object.keys(data).forEach(key => {
                    if (key.startsWith(STORAGE_PREFIX) || key.startsWith(NOTE_PREFIX) || key.startsWith(WEIGHT_PREFIX) || key.startsWith(UNIT_PREFIX)) {
                        localStorage.setItem(key, data[key]);
                    }
                });
                alert('Daten importiert!');
                location.reload();
            } catch (err) {
                alert('Fehler beim Import.');
            }
        };
        reader.readAsText(file);
    }

    function miniConfetti(element) {
        const rect = element.getBoundingClientRect();
        confetti({
            particleCount: 20, spread: 50,
            origin: {
                x: (rect.left + rect.width / 2) / window.innerWidth,
                y: (rect.top + rect.height / 2) / window.innerHeight
            },
            colors: ['#38bdf8', '#f472b6', '#22c55e'], disableForReducedMotion: true,
            ticks: 50, gravity: 1.2, scalar: 0.6, startVelocity: 20
        });
    }

    function superConfetti() {
        var end = Date.now() + 1500;
        (function frame() {
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: {x: 0},
                colors: ['#38bdf8', '#f472b6', '#22c55e']
            });
            confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: {x: 1},
                colors: ['#38bdf8', '#f472b6', '#22c55e']
            });
            if (Date.now() < end) requestAnimationFrame(frame);
        }());
    }

    // START APP
    window.onload = initApp;
</script>
</body>
</html>
