# Architecture Documentation

## Overview

The Body Refactoring application is undergoing a major refactoring (v13.0) to improve code quality, maintainability, and testability. This document outlines the new modular architecture.

## Design Principles

The refactoring follows these core principles:

1. **SOLID Principles**
   - Single Responsibility: Each module/class has one clear purpose
   - Open/Closed: Modules are open for extension, closed for modification
   - Liskov Substitution: Subtypes are substitutable for base types
   - Interface Segregation: Small, focused interfaces over large ones
   - Dependency Inversion: Depend on abstractions, not concrete implementations

2. **Clean Code**
   - Functions under 20 lines where possible
   - Maximum nesting depth of 3 levels
   - Self-documenting code with clear naming
   - DRY (Don't Repeat Yourself)
   - YAGNI (You Aren't Gonna Need It)

3. **Testability**
   - Dependency injection for all services
   - Pure functions where possible
   - Minimal side effects
   - Clear separation of concerns

## Module Structure

### Phase 1: Core Foundation (v13.0) ✅

```
/assets/js/
├── app.js (main entry point - to be refactored in Phase 3)
├── schedule-editor.js (unchanged)
└── modules/
    ├── constants.js          # Constants, enums, configuration
    ├── state-machine.js      # Generic state machine implementation
    ├── storage-service.js    # localStorage abstraction
    ├── state-manager.js      # Centralized application state
    ├── utils.js              # Common utility functions
    └── speech-service.js     # Text-to-speech service
```

### Phase 2: State Machines (v13.0) ✅

```
/assets/js/modules/
├── app-state-machine.js      # Main application state machine
├── timer-state-machine.js    # Timer & rep counter state machines
└── modal-state-machine.js    # Modal management state machine
```

### Phase 3: Feature Modules (Planned)

```
/assets/js/modules/
├── schedule-service.js       # Schedule fetching & caching
├── schedule-renderer.js      # UI rendering logic
├── streak-calculator.js      # Streak calculation
├── sick-mode-handler.js      # Recovery/sick mode logic
├── confetti-service.js       # Visual effects
└── event-handlers.js         # Event delegation
```

### Phase 4: Integration (Planned)

The main `app.js` will become a thin orchestration layer that:
- Initializes all services
- Wires up state machines
- Delegates to feature modules
- Handles top-level error recovery

## Module Descriptions

### constants.js

**Purpose**: Single source of truth for all constants, configuration, and static data.

**Exports**:
- `STORAGE_KEYS`: LocalStorage key generators (type-safe)
- `CONFIG`: Application configuration (max shields, timeouts, etc.)
- `APP_STATES`: Main application states
- `TIMER_STATES`: Timer state machine states
- `REP_COUNTER_STATES`: Rep counter state machine states
- `MODAL_TYPES`: Modal types enum
- `QUOTES`: Motivational quotes
- `RECOVERY_ACTIVITIES`: Recovery mode activities

**Benefits**:
- No magic strings scattered in code
- Easy to update configuration
- Type-safe key generation
- Single place to audit all constants

### state-machine.js

**Purpose**: Generic state machine implementation with validation and event notification.

**Key Features**:
- Validates state transitions
- Maintains transition history
- Notifies listeners of changes
- Supports forced transitions (error recovery)
- Debug logging of all transitions

**Usage Example**:
```javascript
const machine = new StateMachine(APP_STATES, APP_STATES.INITIALIZING);
machine.allow(APP_STATES.INITIALIZING, APP_STATES.SCHEDULE_VIEW);
machine.onChange(({from, to}) => console.log(`${from} -> ${to}`));
machine.transition(APP_STATES.SCHEDULE_VIEW);
```

### storage-service.js

**Purpose**: Abstraction layer for localStorage with error handling and type conversion.

**Benefits**:
- Testable (can inject mock storage)
- Type-safe getters (getBoolean, getInt, getJSON)
- Consistent error handling
- Automatic prefix handling
- Import/export functionality
- Domain methods (getShields, isExerciseCompleted, etc.)

**Usage Example**:
```javascript
const storage = new StorageService();
storage.setExerciseCompleted('2026-01-05', 'pushups', true);
const completed = storage.isExerciseCompleted('2026-01-05', 'pushups');
```

### state-manager.js

**Purpose**: Centralized application state with reactive updates.

**Benefits**:
- Single source of truth
- Reactive updates via listeners
- No scattered global variables
- Clear state ownership
- Easier debugging

**State Categories**:
- Schedule state (availableSchedules, scheduleCache, startDate, weekOffset)
- Timer state (interval, isRunning, timeLeft, label)
- Rep counter state (active, sets, reps, intervals, etc.)

**Usage Example**:
```javascript
const state = new StateManager();
state.setCurrentWeekOffset(1);
state.subscribe('currentWeekOffset', (offset) => {
  console.log('Week changed:', offset);
});
```

### utils.js

**Purpose**: Common utility functions used throughout the app.

**Functions**:
- Date utilities (getLocalISODate, isToday, isPast, daysBetween)
- Formatting (formatTime)
- UI helpers (scrollToElement, showNotification)
- Function utilities (debounce, throttle)
- Safe JSON parsing/stringification

### speech-service.js

**Purpose**: Text-to-speech functionality with voice selection and error handling.

**Features**:
- Automatic German voice selection
- Voice preference (Anna, Helena, Markus)
- Queue management
- Abbreviation conversion (Min → Minuten)
- Promise-based API
- Error handling and fallbacks

**Usage Example**:
```javascript
const speech = new SpeechService();
await speech.speak('Fertig!');
speech.cancel(); // Stop all speech
```

## Migration Strategy

### Phase 1 (v13.0) ✅ COMPLETE
- [x] Create module structure
- [x] Extract constants
- [x] Build state machine foundation
- [x] Abstract storage layer
- [x] Centralize state management
- [x] Extract speech service

### Phase 2 (v13.0) ✅ COMPLETE
- [x] Implement app state machine
- [x] Implement timer state machine (+ rep counter state machine)
- [x] Implement modal state machine
- [ ] Wire up state transitions (Phase 3)
- [ ] Add state logging (Phase 3)

### Phase 3 (v13.2) - Feature Module Extraction
- [ ] Extract schedule service
- [ ] Extract schedule renderer (break up 200-line function)
- [ ] Extract streak calculator
- [ ] Extract sick mode handler
- [ ] Extract confetti service
- [ ] Implement event delegation

### Phase 4 (v13.3) - Integration & Polish
- [ ] Refactor main app.js
- [ ] Wire all modules together
- [ ] Add error boundaries
- [ ] Performance optimization
- [ ] Documentation updates

## Testing Strategy

While unit tests are not written in v13.0, the architecture is designed for testability:

### Testable Design Patterns

1. **Dependency Injection**:
```javascript
// Production
const storage = new StorageService(localStorage);

// Testing
const mockStorage = { getItem: jest.fn(), setItem: jest.fn() };
const storage = new StorageService(mockStorage);
```

2. **Pure Functions**:
```javascript
// Pure - easy to test
function calculateStreak(completedDays) {
  return completedDays.length;
}

// Impure - hard to test
function calculateStreak() {
  const days = getDaysFromDOM(); // DOM dependency
  return days.length;
}
```

3. **State Isolation**:
```javascript
// Instead of global state
let currentWeekOffset = 0;

// Use state manager (mockable)
const state = new StateManager();
state.setCurrentWeekOffset(0);
```

## Backend Architecture (v15.0+)

### PHP Classes

```
/includes/
├── Database.php           # PDO singleton, connection management
├── ScheduleService.php    # Schedule queries and business logic
├── config-loader.php      # JSON configuration loading
└── database/
    └── schema.sql         # MySQL schema definition
```

### Database Layer

**Database.php** provides:
- PDO connection singleton
- Prepared statement helpers (`query`, `query_one`, `execute`)
- Transaction support (`begin_transaction`, `commit`, `rollback`)
- Schema initialization (`init_schema`, `tables_exist`)

**ScheduleService.php** handles:
- Template lookup by date (`get_active_template`)
- Day retrieval with exercises (`get_template_day`, `get_day_exercises`)
- Override application (replace, add, skip)
- Date validation and response formatting

### Schedule API

**Per-day endpoint** (`/schedules/day/?date=YYYY-MM-DD`):
```json
{
  "date": "2026-01-25",
  "dayIndex": 6,
  "id": "sat",
  "name": "SAMSTAG",
  "theme": "Full Body",
  "details": [...],
  "hasOverride": false,
  "templateName": "Schedule 2026-01-19"
}
```

**Override types:**
- `replace`: Completely replace day configuration
- `add`: Merge additional exercises into template day
- `skip`: Return 204 No Content (day hidden)

### Database Schema

```sql
schedule_templates (id, name, start_date, end_date, is_active)
    └── schedule_days (id, template_id, day_index, name, theme, ...)
            └── schedule_exercises (id, day_id, exercise_id, type, title, ...)

date_overrides (id, target_date, override_type, day_config, exercises, note)
```

## Error Handling

All modules implement consistent error handling:

1. **Try-Catch Blocks**: Around all external interactions (fetch, localStorage, DOM)
2. **Logging**: Console errors with module prefix: `[ModuleName] Error message`
3. **Graceful Degradation**: Return sensible defaults on error
4. **User Feedback**: Show notifications for user-facing errors

---

**Last Updated**: 2026-01-24 (v15.0.0)
**Status**: Phase 2 Complete, Backend Architecture Added

