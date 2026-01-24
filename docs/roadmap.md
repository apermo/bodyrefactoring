# Body Refactoring - Roadmap

**Vision**: A privacy-first, gamified progressive web app that can be customized for any recurring task tracking - from fitness routines to daily habits. Fork it, brand it, make it yours.

## Issue Tracking

All planned work is tracked via GitHub Issues and Milestones:

- **[View All Milestones](https://github.com/apermo/bodyrefactoring/milestones)**
- **[View All Open Issues](https://github.com/apermo/bodyrefactoring/issues)**

### CLI Quick Reference

```bash
# List all open issues
gh issue list

# Filter by milestone
gh issue list --milestone "v15.0.0"

# Filter by label
gh issue list --label "area: rep-counter"
gh issue list --label "type: refactor"

# Combine filters
gh issue list --milestone "v15.0.0" --label "priority: high"
```

---

## Milestones Overview

| Milestone | Focus | Issues |
|-----------|-------|--------|
| [v14.6.0](https://github.com/apermo/bodyrefactoring/milestone/1) | Multi-Use Gamified Todo List | 5 |
| [v15.0.0](https://github.com/apermo/bodyrefactoring/milestone/2) | app.js Refactoring (HIGH PRIORITY) | 12 |
| [v15.1.0](https://github.com/apermo/bodyrefactoring/milestone/3) | Advanced Rep Counter Features | 8 |
| [v15.2.0](https://github.com/apermo/bodyrefactoring/milestone/4) | Streak Feature Rework | 6 |
| [v16.0.0](https://github.com/apermo/bodyrefactoring/milestone/5) | Dynamic Rep/Set Management | 8 |
| [v17.0.0](https://github.com/apermo/bodyrefactoring/milestone/6) | XP & Progression System | 8 |
| [v18.0.0](https://github.com/apermo/bodyrefactoring/milestone/7) | Schedule Management Refactoring | 6 |
| [Backlog](https://github.com/apermo/bodyrefactoring/milestone/8) | Unscheduled future work | 5 |

---

## Version Summaries

### v14.6.0 - Multi-Use Gamified Todo List

Transform the app into a reusable, customizable gamified task tracker. Enable anyone to fork this project and create their own private, gamified todo list with custom branding, password protection, and easy schedule management.

**Key Features**: Password protection, schedule upload from phone, custom branding (logo, colors), configurable app name, deployment documentation.

### v15.0.0 - app.js Refactoring

**Priority: HIGH** - Break down the monolithic app.js into maintainable, modular components.

**Why Now?** app.js has grown too large and complex. Playwright tests (v14.5.0) provide safety net for refactoring. Clean foundation required before adding more features.

**Target**: Reduce app.js to ~100 lines of orchestration code. Extract into focused modules: UIService, ExerciseFlowService, WorkoutSessionService, EventCoordinator.

### v15.1.0 - Advanced Rep Counter Features

Complex rep counter enhancements built on the refactored codebase.

**Key Features**: Pause/resume functionality, set memory (survive page reload), tactile feedback (vibration), two-layer animated circle with color phases, configurable rest timer, quick access panel during cooldown, sleep prevention mechanism.

### v15.2.0 - Streak Feature Rework

Decouple streak calculation from individual task ticks.

**Problem**: Adding new exercises to an existing schedule retroactively "uncompletes" past days, breaking streaks.

**Solution**: Store "day completed" as a separate persistent flag. Schedule changes won't affect historical completion.

### v16.0.0 - Dynamic Rep/Set Management

Remove need to edit JSON files for rep/set adjustments.

**Key Features**: In-app exercise editor, CRUD operations, drag-and-drop reordering, auto-progression rules, weight increment configuration, schedule export/import.

### v17.0.0 - XP & Progression System

Gamification and schedule lifecycle management.

**Key Features**: XP calculation with visual progress bar, level-up mechanics tied to schedule completion, XP earning animations, achievement/badge system, daily/weekly XP goals, level-up survey with AI-friendly export.

### v18.0.0 - Schedule Management Refactoring

Privacy-first architecture with smooth transition.

**Key Features**: localStorage schedule management, privacy-first architecture (all data stays local), remove PHP backend dependency for schedules, offline schedule management, optional sync mechanism.

**Note**: Phase 1 with fallback to existing `/trainings/` directory. Repository cleanup in v18.1.0 or v19.0.0.

### Backlog

Unscheduled future work: tutorial video links for exercises, self-hosted preview deployments, server-side sync architecture, data export/backup, dark mode support.

---

## Completed Versions

### v14.5.0 - Automated Testing with Playwright
End-to-end testing for critical user flows. Tests for app initialization, navigation, exercise completion, rep counter, recovery/sick mode, and more.

### v14.4.0 - Rep Counter Enhancements
Rep counter timing log, countdown speech improvements ("Noch 3", "Noch 2", "Der letzte"), set info updates showing next set during cooldown.

### v14.3.0 - Linting & Code Quality
PHPCS, ESLint, Stylelint with threshold-based ratchet system. CI/CD integration with GitHub Actions.

---

## Technical Considerations

### Performance
- XP calculations cached (recalculate only on data changes)
- SVG animations use CSS transforms (GPU-accelerated)
- Quick access panel: lazy load, only when opened

### Storage
- Overrides and XP data add ~5-10KB per schedule
- Well within localStorage limits (5-10MB)
- Include in export/import functionality

### Mobile Optimization
All features optimized for iPhone/PWA:
- Touch-friendly buttons (min 44x44px)
- Swipe gestures for quick access panel
- Portrait-first design
