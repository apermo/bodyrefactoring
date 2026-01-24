# Configuration System

The app uses a JSON-based configuration system for non-sensitive settings that can be customized per deployment.

## File Structure

```
config/
├── app-settings.json         # Default settings (committed)

custom-config/
├── app-settings.json         # User overrides (gitignored)
└── .gitkeep
```

## How It Works

1. **Default config** (`config/app-settings.json`) is committed to the repo
2. **Custom overrides** go in `custom-config/app-settings.json` (gitignored)
3. Configs are deep-merged: custom values override defaults
4. PHP and JavaScript both have access to the merged config

## Configuration Options

### Special Days

Customize activities for recovery and sick days:

```json
{
  "specialDays": {
    "recovery": {
      "name": "Recovery",
      "theme": "Regeneration",
      "icon": "heart-pulse",
      "colorClass": "text-emerald-400",
      "bgClass": "bg-emerald-500/10",
      "activities": [
        { "id": "breathing", "type": "main", "title": "5 Min Atemübungen", "desc": "Tiefes Ein- und Ausatmen" },
        { "id": "stretching", "type": "main", "title": "Leichtes Stretching", "desc": "5 Minuten sanfte Dehnübungen" }
      ]
    },
    "sick": {
      "name": "Krank",
      "theme": "Genesung",
      "icon": "thermometer",
      "colorClass": "text-red-400",
      "bgClass": "bg-red-500/10",
      "activities": [
        { "id": "hydration", "type": "main", "title": "Flüssigkeitszufuhr", "desc": "2 Liter Wasser/Tee trinken" }
      ]
    }
  }
}
```

Each activity requires:
- `id`: Unique identifier for the activity
- `type`: Always `"main"` for special day activities
- `title`: Display title (German)
- `desc`: Description (German)

### App Branding

Customize the app name, icon, and background image:

```json
{
  "app": {
    "name": "My App",
    "icon": "/assets/img/custom-icon.png",
    "backgroundImage": "/assets/img/custom-background.jpg"
  }
}
```

### Tailwind Class Mapping

Replace Tailwind color classes with different ones:

```json
{
  "tailwind": {
    "bg-slate-900": "bg-emerald-950",
    "bg-slate-800": "bg-emerald-900",
    "border-slate-700": "border-emerald-800",
    "text-slate-400": "text-emerald-300",
    "hover:bg-slate-700": "hover:bg-emerald-800"
  }
}
```

This replaces class names at render time - both in PHP and JavaScript generated HTML.

### Theme Colors

Override the color scheme:

```json
{
  "theme": {
    "colors": {
      "primary": "#22c55e",
      "primaryRgb": "34, 197, 94"
    }
  }
}
```

Colors are injected as CSS custom properties (`--color-primary`, etc.).

### Strings

Customize topic-specific text for non-fitness deployments:

```json
{
  "strings": {
    "training": {
      "complete": "Aufgaben erledigt!",
      "currentStreak": "Aktuelle Serie",
      "continueButton": "Weiter!"
    },
    "quotes": [
      "Gut gemacht!",
      "Ein Schritt nach dem anderen."
    ]
  }
}
```

### Feature Flags

Enable or disable features:

```json
{
  "features": {
    "loginEnabled": false,
    "speechEnabled": true,
    "notificationsEnabled": true,
    "debugLogEnabled": false
  }
}
```

### Defaults

Customize default values:

```json
{
  "defaults": {
    "timerDuration": 60,
    "repCounterCountdown": 3,
    "shieldAwardInterval": 7,
    "maxShields": 3
  }
}
```

## Usage

### PHP

```php
// Load the config loader
require_once __DIR__ . '/includes/config-loader.php';

// Get any config value by dot-notation path
$primary = get_config('theme.colors.primary', '#38bdf8');

// Get a localized string
$title = get_string('training.complete', 'Training Complete!');

// Check feature flags
if (is_feature_enabled('speechEnabled')) {
    // ...
}

// Generate CSS custom properties
echo generate_theme_css();
```

### JavaScript

```javascript
import configService from './modules/config-service.js';

// Get any config value
const primary = configService.get('theme.colors.primary');

// Get a string with placeholder replacement
const setInfo = configService.getString('repCounter.setInfo', {
    current: 1,
    total: 3
});

// Check feature flags
if (configService.isFeatureEnabled('speechEnabled')) {
    // ...
}

// Get quotes
const quotes = configService.getQuotes();
const randomQuote = configService.getRandomQuote();
```

## Playwright Test Overrides

Tests can inject config overrides that take priority over both default and custom configs:

```javascript
const { setupTestConfig } = require('./fixtures/test-helpers');

test('with custom config', async ({ page }) => {
    // Must be called before page.goto()
    await setupTestConfig(page, {
        features: { loginEnabled: true },
        strings: { quotes: ['Test quote'] }
    });

    await page.goto('/');
    // ...
});
```

## Example Configs

Two example configurations are provided in `config/examples/`:

- **green-learning.json** - Green theme for learning/study tracking
- **red-focus.json** - Red theme for focus/productivity tracking

To use an example, copy it to `custom-config/app-settings.json`:

```bash
cp config/examples/green-learning.json custom-config/app-settings.json
```

## What Stays in .env

Security-sensitive and server-specific settings remain in `.env`:

- `DEPLOY_SECRET` - GitHub webhook secret
- `APP_PASSWORD_HASH` - Authentication password hash
- `RESET_PASSWORD_MODE` - Mode reset password
- `SCHEDULE_PATH` - Directory for schedule files
- `SESSION_DURATION` - Authentication session duration

