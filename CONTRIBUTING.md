# Contributing to Body Refactoring

This document provides setup instructions for development tools and coding standards.

## Quick Start

```bash
# Install PHP dependencies
composer install

# Install Node.js dependencies
npm install

# Set up git hooks
bash .githooks/setup.sh
```

## Development Setup

### Prerequisites

- PHP 8.3+
- Node.js 18+
- Composer

### Installing Dependencies

**PHP (PHPCS for linting):**
```bash
composer install
```

**Node.js (ESLint, Stylelint, lint-staged):**
```bash
npm install
```

### Git Hooks

Enable automatic linting and commit message validation:
```bash
bash .githooks/setup.sh
```

This configures:
- **pre-commit**: Runs lint-staged (lints only staged files)
- **commit-msg**: Validates Conventional Commits format

## Linting

### Running All Linters

```bash
npm run lint        # Check all files
npm run lint:fix    # Auto-fix all files
npm run lint:check  # Check without fixing (used in CI)
```

### Individual Linters

**PHP (PHPCS - WordPress Coding Standards):**
```bash
npm run lint:php        # Check PHP files
npm run lint:php:fix    # Auto-fix with PHPCBF
```

**JavaScript (ESLint):**
```bash
npm run lint:js         # Check JS files
npm run lint:js:fix     # Auto-fix issues
```

**CSS (Stylelint):**
```bash
npm run lint:css        # Check CSS files
npm run lint:css:fix    # Auto-fix issues
```

### Common Lint Errors and Fixes

**PHP - Missing DocBlock:**
```php
// Add before function:
/**
 * Description of what the function does.
 *
 * @param string $param Description.
 * @return bool Description.
 */
```

**JavaScript - Unused variable:**
```javascript
// Prefix with underscore to ignore:
function example( _unusedParam ) { }
```

**CSS - Wrong indentation:**
```css
/* Use tabs, not spaces */
.selector {
	property: value;
}
```

## Coding Standards

### General

- **Indentation**: Tabs (not spaces)
- **Language**: English for code/comments, German for UI text
- **Line length**: 120 characters max

### PHP

- WordPress PHP Coding Standards
- DocBlocks required for all functions
- Braces always required, even for single statements

### JavaScript

- WordPress JavaScript Coding Standards (adapted for ES6 modules)
- JSDoc comments required for functions
- Use `const`/`let` only (no `var`)
- Strict equality (`===`, `!==`)

### CSS

- One selector per line
- Properties alphabetically ordered (or logically grouped)
- Use double quotes for strings

## Commit Messages

Format: `<type>(<scope>): <subject>`

**Types**: feat, fix, docs, style, refactor, test, chore, perf

**Character limits:**
- Subject line: 50 characters max (72 hard limit)
- Body lines: 72 characters max

**Examples:**
```
feat(timer): add pause functionality
fix: resolve memory leak in schedule service
docs: update README with setup instructions
```

## Schedule Validation

Before committing schedule changes:
```bash
cd trainings/
php validate-schedule.php
```

## Testing

- Test on iOS Safari (primary target)
- Test as installed PWA (Add to Home Screen)
- Verify offline functionality works

## Questions?

See `CLAUDE.md` for detailed coding guidelines and project architecture.
