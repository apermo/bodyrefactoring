# Body Refactoring - Planned Features & Roadmap

This document outlines planned features and improvements for the Body Refactoring app.

## 📋 Feature Roadmap

### v14.0.0 - Rep Counter Enhancements

**Priority: High**  
**Focus**: Improved rep counter usability and interaction during workouts

#### ✅ Navigation Improvements
- **"Today" Button in Week Navigation**
  - Appears in week navigation bar (right side of week display)
  - Only visible when viewing a week other than current week
  - Quick jump back to today's date
  - Keeps week display centered as long as space available
  - Mobile-optimized placement (doesn't interfere with week arrows)

#### Sick/Recovery Completion Modal
- **Subdued Completion Celebration**
  - Modal appears when completing sick/recovery day
  - Less celebrational tone than normal streak modal
  - Shows updated streak status (maintained/paused)
  - Different visual style:
    - Softer colors (blues/purples instead of bright colors)
    - Calmer messaging ("Taking care of yourself" vs "Great job!")
    - Minimal confetti (10-20 particles vs 100+)
    - Recovery icon (🩹 or 💊) instead of trophy/medal
  - Acknowledges effort while respecting recovery state
  - Quick dismiss (no excessive celebration)

#### Rep Cooldown Timer Improvements
- **Quick Access Panel During Cooldown**
  - Access day's logbook/notes without aborting rep counter
  - Adjust weight/level settings directly from cooldown screen
  - Swipe or tab interface to access these features
  - Changes saved immediately to storage
  
- **Sleep Prevention Mechanism**
  - Add "Ready?" confirmation button at 10s mark during cooldown
  - Forces user interaction to prevent screen sleep
  - Alternative to background video approach
  - Visual countdown to "Ready?" prompt (60s → 10s → "Ready?")

#### Rep Counting Animation Improvements
- **Timing Adjustment**
  - Count on color change at 50% progress (not at start)
  - First 50% = "Tension" phase
  - Second 50% = "Relax" phase
  - More accurate sync with actual movement

- **Visual Progress Indicator**
  - Animated circle with moving dot (clockwise)
  - Odd reps: Draw circle progressively
  - Even reps: Erase circle progressively
  - Color coding:
    - "Up" phase: Blue/cyan
    - "Down" phase: Green
    - Creates visual rhythm matching exercise tempo

- **Transition Bug Fixes**
  - Add small delay (500-1000ms) after last rep before switching to cooldown
  - Ensure color changes happen simultaneously with content changes
  - Smooth state transitions (rep completion → cooldown start)
  - State machine should handle transition timing
  - Visual feedback should be consistent throughout all state changes
  - Current issue: Abrupt switch from last rep to cooldown, color/content mismatch

**Technical Implementation:**
- ✅ Add "Today" button to week navigation component
  - Conditionally render based on `currentWeekOffset !== 0`
  - Position: Right side of week display (after week text)
  - Button style: Minimal, icon-based (🏠 or 📅 icon)
  - Click handler: Reset week offset to 0, reload current day view
- ✅ Update week navigation layout:
  - Use flexbox with space-between for arrows, week text, and today button
  - Keep week text centered when today button not visible
  - Adjust layout for mobile (ensure touch targets are 44x44px minimum)
- ✅ State management:
  - Track current week offset in app state
  - Compare against today's date to determine button visibility
  - Smooth transition animation when jumping to today
- Create sick/recovery completion modal component
  - Separate modal styles for sick vs recovery mode
  - Reduced confetti configuration (particleCount: 10-20, spread: 40)
  - Custom messaging based on mode:
    - Sick: "Ruhe dich gut aus 💊" / "Rest and recover"
    - Recovery: "Gut gemacht, sanft erholt 🩹" / "Well done, gentle recovery"
  - Display current streak status with context
  - Icon selection: 🩹 for recovery, 💊 for sick
  - Softer color palette (blues, purples, muted tones)
  - Quick fade-out after 2-3 seconds (vs 5+ for normal modal)
- Modify `RepCounterStateMachine` to include cooldown states
- Create `QuickAccessPanel` component for cooldown overlay
- Update `getRepDelay()` to return object with phases: `{ upPhase: ms, downPhase: ms }`
  - Update the schedule.json schema to allow upPhase/downPhase configuration (optional)
  - Default to equal split if not specified
- Implement SVG circle animation with stroke-dasharray/stroke-dashoffset
- Add state machine transitions for "Ready?" confirmation
- Store quick-access changes via DomainStorageService
- Fix rep counter transitions:
  - Add transition delay state between last rep completion and cooldown start
  - Duration: 500-1000ms hold on completion state
  - Synchronize color changes with content updates (atomic state change)
  - Update `RepCounterStateMachine` states:
    - Add `REP_COMPLETE` state (brief hold after last rep)
    - Transition: `COUNTING` → `REP_COMPLETE` → `COOLDOWN` or `SET_COMPLETE`
  - Ensure UI updates happen together (no color/content mismatch)
  - Visual feedback: Brief "✓" or completion animation before cooldown

---

### v15.0.0 - Dynamic Rep/Set Management

**Priority: High**  
**Focus**: Remove need to edit JSON files for Rep/Set adjustments

#### In-App Rep/Set Editor
- **UI for Exercise Configuration**
  - Add "Edit Exercise" button in schedule view
  - Modal with fields:
    - Current Rep/Set
    - Target Rep/Set (for auto-progression)
  - Only affects future instances, preserves history
  
- **Auto-Progression Feature**
  - When exercise completed X times at current weight, suggest increase
  - When exercise consistently completed at target reps/sets, suggest adjustment
  - User can accept/decline/adjust suggestion
  - Configurable progression rules per exercise type
  - **Note**: Check both weight progression AND reps/sets progression during implementation
  
- **Override System**
  - Overrides stored in localStorage with priority over schedule.json
  - Schedule.json remains base template
  - Overrides exportable/importable with other data

**Technical Implementation:**
- Create `ExerciseOverrideService` module
- Add new storage keys: `EXERCISE_OVERRIDE_PREFIX`
- Extend DomainStorageService with override methods
- Create modal UI for exercise editing
- Add methods to get/set rep and set overrides
- Modify exercise rendering to check overrides first before using schedule.json values
- Add override indicator in UI (e.g., "⚙️" icon showing exercise has custom reps/sets)

**Migration Path:**
- Existing data unaffected
- Overrides layer on top of existing schedule configuration
- Can reset to schedule defaults anytime

---

### v16.0.0 - XP & Progression System

**Priority: Medium**  
**Focus**: Gamification and schedule lifecycle management

#### XP System
- **Points & Progress**
  - Award XP for each completed task (exercise, recovery activity, hydration)
  - Progressive XP bar at top of app
  - Silent XP removal if task unchecked (no penalties shown)
  - No actual numerical values displayed - just visual progress
  - Satisfying fill animations

- **Level Up Mechanics**
  - Target: Level up on Sundays when schedule becomes "old"
  - Schedule includes optional `targetDate` field (ISO 8601)
  - If no `targetDate`: Default to 4 weeks from schedule start
  - Level up triggers when:
    - Current date ≥ targetDate
    - XP bar full (or close to full)
  - Post-levelup: XP continues to accumulate but no further levels
  - Sunday reminder if level full: "🎉 Time to create a new schedule!"

- **XP Calculation Algorithm**
  - Total XP needed = Days until targetDate × Exercises per day (avg)
  - XP per task = Total XP / Total tasks
  - Ensures bar fills naturally over schedule duration
  - Accounts for sick days, recovery days (fewer tasks)

#### Level Up Survey
- **Survey Modal (triggered on level up)**
  - "💪 Schedule Complete! How did it go?"
  - Questions:
    1. "What exercises felt easy?" (checkboxes with schedule exercises)
    2. "What exercises were challenging?" (checkboxes)
    3. "Any injuries or discomfort?" (free text)
    4. "Overall satisfaction" (1-5 stars)
    5. "Additional notes" (free text)
  
- **Weight Change Summary**
  - Automatic section: "Weight Progression"
  - Lists all exercises with weight changes
  - Format: `Exercise: Start → End (±change)`
  - Pulled from weight history

- **AI-Friendly Export**
  - "Copy for AI Assistant" button
  - Structured markdown format:
    ```markdown
    # Training Schedule Review
    **Period**: YYYY-MM-DD to YYYY-MM-DD (X weeks)
    **Completion**: X% of scheduled workouts
    
    ## Easy Exercises
    - Exercise 1
    - Exercise 2
    
    ## Challenging Exercises
    - Exercise 3 (Notes: ...)
    
    ## Weight Progression
    - Bench Press: 40kg → 50kg (+10kg)
    - Squats: 60kg → 75kg (+15kg)
    
    ## Injuries/Discomfort
    [User notes]
    
    ## Overall Satisfaction
    ⭐⭐⭐⭐⭐
    
    ## Additional Notes
    [User notes]
    ```
  - Copied to clipboard for pasting into AI assistant (Gemini, ChatGPT, etc.)
  - Helps AI generate next schedule with appropriate progressions

**Technical Implementation:**
- Create `XPService` module with calculation logic
- Add `targetDate` to schedule schema v2 (optional field, strongly recommended)
  - Validator shows warning if omitted
  - App uses 4-week default if not present
- Update validator to support v2 schema
  - Check version field
  - Validate targetDate format (if present)
  - Warn (not error) if targetDate missing
- Store XP progress in localStorage via DomainStorageService
- Create level-up survey modal component
- Generate weight change report from weight history
- Implement clipboard API for survey export
- Add reminder system for Sunday level-up prompts
- Schedule editor pre-fills targetDate field (start date + 4 weeks)

**Schema Changes (v2):**
```json
{
  "version": 2,
  "targetDate": "2026-02-15T23:59:59Z",
  "days": [ ... ]
}
```

**Field Specifications:**
- `version`: **Required**, must be `2`
- `targetDate`: **Optional but STRONGLY RECOMMENDED**
  - ISO 8601 datetime string
  - When schedule should be reviewed/leveled up
  - Default: Schedule start date + 4 weeks (if omitted)
  - Recommendation: Set explicitly based on your training plan (typically 4-8 weeks)
  
**Validator Behavior:**
- ✓ Valid if targetDate present
- ⚠️ Warning if targetDate omitted: "Using 4-week default, consider setting explicitly"

**Schedule Editor:**
- Field pre-filled with "start date + 4 weeks"
- User can adjust before saving
- Clear label: "Review/Level-Up Date (recommended)"

**Migration from v1 to v2:**
- **No migration needed!** v1 schedules work forever
- v1 behavior: `targetDate = startDate + 4 weeks` (computed automatically)
- v2 behavior: `targetDate = schedule.targetDate ?? startDate + 4 weeks`
- Both produce same result if v2 omits targetDate
- Users can keep v1 schedules indefinitely or upgrade to v2 when creating new ones

---

## 🎯 Feature Prioritization & Rationale

### High Priority (v14-v15)
**Rep Counter Enhancements** and **Dynamic Rep/Set Management** are high priority because:
1. **Immediate UX improvements** - Affect every workout session
2. **Reduce friction** - No need to abort rep counter or edit JSON files
3. **Safety** - Sleep prevention ensures proper rest timing
4. **User feedback** - Requested features based on actual usage pain points

### Medium Priority (v16)
**XP System** is medium priority because:
1. **Nice-to-have gamification** - Not blocking current functionality
2. **Complex implementation** - Requires schema changes and new systems
3. **Schedule lifecycle** - Useful but not urgent (current schedule workflow functions)
4. **AI integration** - Innovative but experimental feature

---

## 💡 Suggested Adjustments

### Rep Counter Cooldown Access
**Original**: Access log and weight during cooldown  
**Adjustment**: Add minimal overlay with quick actions:
- Keep cooldown timer visible (top)
- Swipe up to reveal quick access panel (bottom 2/3 of screen)
- Three tabs: "Notes" | "Weight" | "Timer"
- Changes auto-save, no "Save" button needed

**Reasoning**: Full screen transitions would be jarring during workout flow. Overlay maintains context.

### Rep Animation Timing
**Original**: Count at 50% color change  
**Adjustment**: Implement as described, but add option to adjust timing in debug mode
- Default: Count at 50%
- Debug: Adjustable from 0-100% (testing different movement patterns)

**Reasoning**: Different exercises have different tempo. Flexibility helps tune for optimal sync.

### XP System
**Original**: Silent XP removal on untick  
**Adjustment**: Add subtle undo notification (3 seconds, bottom of screen)
- "Exercise unchecked (-XP)" with "Undo" button
- Disappears after 3s or on undo
- Doesn't block workflow but provides feedback

**Reasoning**: Completely silent removal might feel like a bug. Subtle notification confirms action.

### Level Up Frequency
**Original**: Level up when schedule old  
**Adjustment**: Add flexibility:
- Option 1: Level up at targetDate (recommended)
- Option 2: Manual level up anytime (for early schedule changes)
- Option 3: Extend current schedule (push targetDate)

**Reasoning**: Life happens. Users might want to extend a working schedule or switch early.

---

## 🔧 Technical Considerations

### Performance
- XP calculations should be cached (recalculate only on data changes)
- SVG animations use CSS transforms (GPU-accelerated)
- Quick access panel: Lazy load, only when opened

### Storage
- Overrides and XP data add ~5-10KB per schedule
- Still well within localStorage limits (5-10MB)
- Include in export/import functionality

### Backward Compatibility
- Schema v1 schedules continue to work indefinitely (no migration needed)
  - v1 schedules automatically use 4-week default for targetDate calculation
  - XP system works with v1 schedules using computed targetDate
  - No need to update existing schedules to v2
- Schema v2 is opt-in for explicit targetDate control
- XP system disabled if schedule too old (beyond computed targetDate)
- Overrides don't affect users who don't use the feature

### Testing
- Rep counter timing: Debug mode with adjustable delays
- XP calculation: Verify bar fills naturally over 4-week period
- Survey export: Test clipboard API on iOS Safari, Chrome

---

## 📱 Mobile Optimization

All features optimized for iPhone/PWA:
- Touch-friendly buttons (min 44×44px)
- Swipe gestures for quick access panel
- Haptic feedback on XP gain (if available)
- Portrait-first design (landscape secondary)

---

## 🚀 Implementation Order

1. **v14.0.0 - Part 1**: Rep cooldown quick access (2-3 days)
2. **v14.0.0 - Part 2**: Rep animation improvements (1-2 days)
3. **v15.0.0**: Dynamic rep/set management (3-4 days)
4. **v16.0.0 - Part 1**: XP system core (4-5 days)
5. **v16.0.0 - Part 2**: Level up survey & AI export (2-3 days)

**Total estimated effort**: 12-17 development days (2-3 weeks of actual calendar time)

---

## 📝 Notes

- All features maintain privacy-first approach (localStorage only)
- No breaking changes to existing data
- Export/import includes all new data types
- German UI text, English code/comments
- Follows WordPress coding standards
- Full JSDoc documentation required

### GitHub Actions Architecture

**Current Structure:**
- Each validation check has its own workflow file for better reusability and maintainability
- Files located in `.github/workflows/`:
  - `validate-conventional-commits.yml` - Commit message format validation
  - `pr-validation.yml` - Version bump and CHANGELOG checks
  - `pr-summary.yml` - AI-generated PR summaries

**Benefits:**
- ✅ **Modular** - Each check is independent
- ✅ **Reusable** - Workflows can be reused across projects
- ✅ **Maintainable** - Easy to update/debug individual checks
- ✅ **Clear separation** - Each file has single responsibility
- ✅ **Faster debugging** - Failed checks are immediately identifiable

**Future Additions:**
- Schedule JSON validation workflow (when implementing v16.0.0 schema v2)
- Automated changelog generation workflow
- Release automation workflow

---

## 🗂️ Backlog - Code Quality & Refactoring

Tasks without specific version assignment. Pick when they fit naturally into planned work or during refactoring sprints.

### Refactor: renderSchedule() Function

**Current State:**
- ~307 lines long (too large for single function)
- Handles multiple responsibilities:
  - Navigation logic (week buttons, display)
  - Day card creation and rendering
  - Exercise rendering (normal, alternatives, recovery, sick)
  - Weight/unit display logic
  - Notes/logbook rendering
  - Icon initialization and scroll logic
- Mixed concerns: DOM manipulation, business logic, state management

**Proposed Refactoring:**
- **Create `ScheduleRenderer` class** with clear separation of concerns
  - Constructor: Takes dependencies (domainStorage, state, etc.)
  - Methods:
    - `render()` - Main entry point
    - `renderNavigation()` - Week navigation UI
    - `renderDayCard()` - Single day card rendering
    - `renderExercise()` - Single exercise row
    - `renderRecoveryDay()` - Recovery mode rendering
    - `renderSickDay()` - Sick mode rendering
    - `renderNotes()` - Logbook section
    - `updateIcons()` - Lucide icon refresh
    - `scrollToToday()` - Scroll behavior
  - Benefits:
    - Testable individual methods
    - Clearer responsibility boundaries
    - Easier to extend with new exercise types
    - Reusable rendering logic

**Dependencies to Consider:**
- v14.0.0 adds sick/recovery completion modal (might affect completion rendering)
- v15.0.0 adds rep/set overrides (will affect exercise rendering logic)
- Any changes to schedule.json schema

**Recommendation:**
- **Best timing**: After v15.0.0 (after rep/set management is complete)
- Reason: v15 will already touch exercise rendering logic, combine both refactorings
- Alternative: Do incrementally - extract small methods now, full class later

**Estimated Effort:** 2-3 days
- Extract methods (1 day)
- Create class structure (1 day)
- Testing and bug fixes (1 day)

---

### Refactor: calculateStreak() Function

**Current State:**
- ~130 lines long
- Handles multiple responsibilities:
  - Streak calculation logic (day-by-day iteration)
  - Shield awarding logic
  - Milestone tracking
  - DOM updates (streak display, shield display)
  - Recovery/sick day special handling
- Async function with await in loop (performance consideration)

**Proposed Refactoring:**
- **Create `StreakCalculator` class** (or use existing `StreakCalculatorService`)
  - Currently, `StreakCalculatorService` exists but only has `getDayCount()` helper
  - Expand to handle full streak calculation
  - Methods:
    - `calculate()` - Main calculation, returns streak data object
    - `isDayCountable()` - Check if day counts toward streak (normal/recovery/sick with shield)
    - `checkShieldMilestone()` - Shield awarding logic
    - `updateDisplay()` - Separate DOM updates from calculation
  - Benefits:
    - Pure calculation logic separated from display
    - Testable without DOM
    - Reusable in other contexts (XP system, statistics)
    - Better performance (can cache results)

**Alternative Approach:**
- **Enhance existing `StreakCalculatorService`**
  - Already exists in modules/streak-calculator-service.js
  - Currently minimal functionality
  - Expand to be the single source of truth for streak logic
  - Move shield logic into separate `ShieldService` or keep together

**Dependencies to Consider:**
- v14.0.0 sick/recovery modal needs streak calculation
- v16.0.0 XP system might need streak data
- Shield system is tightly coupled (might want separate `ShieldManager`)

**Recommendation:**
- **Best timing**: During v14.0.0 (needs refactor for sick/recovery modal anyway)
- Reason: Sick/recovery completion modal will need to call streak calculation
- Clean separation will make modal integration cleaner

**Estimated Effort:** 1-2 days
- Expand StreakCalculatorService (0.5 day)
- Refactor calculateStreak to use service (0.5 day)
- Separate shield logic (optional, 0.5 day)
- Testing (0.5 day)

---

### Decision Guidelines

**When to pick these tasks:**
1. **renderSchedule refactor** → Do during/after v15.0.0
   - Will already be touching exercise rendering for overrides
   - Combine both efforts for cleaner result
   
2. **calculateStreak refactor** → Do during v14.0.0
   - Sick/recovery modal needs clean streak calculation
   - Good opportunity to enhance existing service
   - Won't block other work

**Signs it's time to refactor:**
- Adding new feature requires changing multiple parts of these functions
- Bug fixes become difficult due to function complexity
- Code duplication appears
- Testing becomes impossible without DOM

---

**Last Updated**: January 8, 2026  
**Current Stable Release**: v13.0.0  
**Development Cycle**: v14

