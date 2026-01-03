# Schedule Editor Documentation

The Schedule Editor is a web-based visual tool for creating and editing training schedule JSON files for Body Refactoring.

**Access:** `https://your-domain.com/schedule-editor.php`

---

## Overview

The Schedule Editor provides a user-friendly interface for managing training schedules without manually editing JSON files. It includes a visual day-by-day editor, validation tools, and import/export capabilities.

### Key Features

- 📝 **Visual Editor**: Create and edit schedules using a graphical interface
- 📁 **Load Existing**: Browse and load schedules from the server
- 📤 **Import**: Load schedules from JSON files or clipboard
- 📥 **Export**: Download schedules as JSON files
- ✏️ **Day-by-Day Editing**: Tabbed interface for all 7 days of the week
- ➕ **Exercise Management**: Add, edit, remove, and reorder exercises
- ✅ **Built-in Validation**: Check schedules for errors before deployment
- 🎨 **Full Type Support**: Handle all exercise types (warmup, main, cool, alternatives)

---

## Getting Started

### Accessing the Editor

1. Navigate to `schedule-editor.php` in your web browser
2. The editor interface will load with three main options:
   - Create New Schedule
   - Load Existing Schedule
   - Import JSON

### Creating a New Schedule

1. **Select Date**: Choose a date for your schedule using the date picker
2. **Click "Create New"**: This generates a basic 7-day structure
3. **Edit Days**: Use the day tabs to switch between days
4. **Add Exercises**: Click "Add Exercise" to start building your workout
5. **Validate**: Click "Validate" to check for errors
6. **Export**: Click "Export & Deploy via Git" to download the JSON file

### Loading an Existing Schedule

1. **Select Schedule**: Choose a schedule from the dropdown menu
2. **Click "Load Schedule"**: The schedule loads into the editor
3. **Make Changes**: Edit any day or exercise as needed
4. **Export**: Download the modified schedule

### Importing a Schedule

**From File:**
1. Click "Import File"
2. Select a JSON file from your computer
3. The schedule loads into the editor

**From Clipboard:**
1. Click "Paste JSON"
2. Paste your JSON code into the prompt
3. The schedule loads into the editor

---

## Interface Guide

### Main Controls

The top section provides three cards for different actions:

#### New Schedule
- **Date Picker**: Select the start date for the schedule
- **Create New Button**: Generates an empty 7-day schedule structure

#### Load Existing
- **Dropdown Menu**: Lists all schedules currently on the server
- **Load Schedule Button**: Loads the selected schedule

#### Import JSON
- **Import File Button**: Opens file picker for JSON files
- **Paste JSON Button**: Opens prompt to paste JSON directly

### Editor Area

Once a schedule is loaded, the editor area appears:

#### Schedule Info Bar
- **Schedule Name**: Shows the current filename
- **Validate Button**: Runs validation checks (yellow)
- **Export & Deploy via Git Button**: Downloads the schedule (green)
- **Deployment Instructions**: Quick reference for Git workflow

#### Day Tabs
- 7 tabs representing each day of the week (Sunday - Saturday)
- Click any tab to switch to that day
- Active tab is highlighted in blue
- Current day's data is automatically saved when switching tabs

#### Day Properties Panel (Left Side)
Edit the properties for the current day:
- **ID**: Unique identifier (lowercase, underscores only)
- **Name**: Display name (e.g., "MONDAY")
- **Theme**: Workout focus (e.g., "Upper Body Strength")
- **Icon**: Lucide icon name (e.g., "dumbbell")
- **Color Class**: Tailwind color class (e.g., "text-blue-400")
- **Background Class**: Tailwind background class (e.g., "bg-blue-500/10")

#### Exercises Panel (Right Side)
Manage exercises for the current day:
- **Add Exercise Button**: Opens modal to create new exercise
- **Exercise Cards**: Each exercise shows:
  - Type badge (🔥 Warm Up, 💪 Main, ❄️ Cool Down, 🔀 Alternatives)
  - Exercise ID
  - Title and description
  - Action buttons: Move Up, Move Down, Edit, Delete

---

## Exercise Management

### Adding an Exercise

1. Click **"Add Exercise"** button
2. The exercise modal opens
3. Fill in the exercise details (see Exercise Types below)
4. Click **"Save Exercise"**
5. The exercise appears in the list

### Editing an Exercise

1. Click the **Edit** button (blue pencil icon) on any exercise
2. The exercise modal opens with current values
3. Modify any fields
4. Click **"Save Exercise"**

### Reordering Exercises

- Click **Up Arrow** to move exercise up in the list
- Click **Down Arrow** to move exercise down in the list
- Order determines display order in the main app

### Deleting an Exercise

1. Click the **Delete** button (red trash icon)
2. Confirm the deletion
3. Exercise is removed from the day

---

## Exercise Types

The editor supports four exercise types:

### 1. Warmup Exercise

Used for warm-up activities before the main workout.

**Required Fields:**
- **Type**: Select "Warm Up"
- **ID**: Unique identifier (e.g., `warmup_row`)
- **Title**: Exercise name (e.g., "Rowing Machine")
- **Description**: Instructions (e.g., "5-10 min warm up")

**Optional Fields:**
- **Weight**: Default weight value
- **Unit**: Weight unit (KG, LBS, STUFE)
- **Timers**: JSON array of timer objects

**Example Timer JSON:**
```json
[
  { "l": "5 Min", "s": 300 },
  { "l": "10 Min", "s": 600 }
]
```

### 2. Main Exercise

Used for primary strength training exercises.

**Required Fields:**
- **Type**: Select "Main Exercise"
- **ID**: Unique identifier (e.g., `ex_benchpress`)
- **Title**: Exercise name (e.g., "Bench Press")
- **Description**: Rep scheme (e.g., "3 x 12 Reps")

**Optional Fields:**
- **Weight**: Starting weight (e.g., "40")
- **Unit**: Weight unit (e.g., "KG")
- **Timers**: Timer array for timed exercises

### 3. Cool Down Exercise

Used for cooldown and recovery activities.

**Required Fields:**
- **Type**: Select "Cool Down"
- **ID**: Unique identifier (e.g., `cool_stretch`)
- **Title**: Exercise name (e.g., "Full Body Stretch")
- **Description**: Instructions (e.g., "Hold each stretch 30s")

**Optional Fields:**
- **Timers**: Timer array for timed activities

### 4. Alternatives Exercise

Used when multiple exercise options are available (e.g., outdoor vs indoor cardio).

**Required Fields:**
- **Type**: Select "Alternatives"
- **ID**: Unique identifier (e.g., `alt_cardio`)
- **Alternatives**: JSON array of alternative exercise objects

**Alternatives JSON Structure:**
```json
[
  {
    "title": "Outdoor Run",
    "desc": "Good weather option",
    "timers": [
      { "l": "20 Min", "s": 1200 },
      { "l": "30 Min", "s": 1800 }
    ]
  },
  {
    "title": "Indoor Bike",
    "desc": "Rainy day option",
    "timers": [
      { "l": "20 Min", "s": 1200 },
      { "l": "30 Min", "s": 1800 }
    ]
  }
]
```

---

## Validation

### Running Validation

Click the **"Validate"** button to check your schedule for errors.

### Validation Checks

The validator checks for:

**Root Structure:**
- Version field must equal 1
- Must have exactly 7 days

**Day Properties:**
- Unique day IDs (lowercase, underscores only)
- Unique dayIndex values (0-7)
- All required fields present (id, name, theme, details)

**Exercise Properties:**
- Unique exercise IDs within the schedule
- Valid exercise types (warmup, main, cool, alternatives)
- Required fields based on type
- Alternatives must have at least 2 options

**ID Format:**
- Must match pattern: `^[a-z_]+$`
- Only lowercase letters and underscores
- No spaces, numbers, or special characters

### Validation Results

**Success:**
```
✅ Schedule is valid!
```

**Errors:**
```
❌ Validation errors:

Day 0: Invalid ID format
Day 1, Exercise 2: Missing title
Day 3: Duplicate dayIndex '3'
```

Fix all errors before exporting and deploying.

---

## Deployment Workflow

The Schedule Editor uses a **Git-based deployment** workflow for security and version control.

### Step-by-Step Deployment

#### 1. Create/Edit Schedule
Use the Schedule Editor interface to create or modify your schedule.

#### 2. Validate
Click **"Validate"** to ensure the schedule has no errors.

#### 3. Export
Click **"Export & Deploy via Git"** to download the JSON file.

#### 4. Move to Repository
```bash
# Move the downloaded file to your repository
mv ~/Downloads/schedule-2026-01-15.json ~/repos/bodyrefactoring/trainings/
```

#### 5. Validate with CLI
```bash
cd ~/repos/bodyrefactoring/trainings/
php validate-schedule.php schedule-2026-01-15.json
```

Expected output:
```
✓ schedule-2026-01-15.json: VALID
```

#### 6. Commit to Git
```bash
cd ~/repos/bodyrefactoring
git add trainings/schedule-2026-01-15.json
git commit -m "feat: add training schedule for 2026-01-15"
```

#### 7. Deploy
```bash
git push origin main
```

The GitHub webhook automatically deploys the schedule to your server.

### Why Git-Based Deployment?

**Benefits:**
- ✅ **Version Control**: Full history of all schedule changes
- ✅ **Code Review**: Changes can be reviewed before deployment
- ✅ **Rollback**: Easy to revert to previous versions
- ✅ **Audit Trail**: Track who changed what and when
- ✅ **Validation**: CLI validation ensures quality
- ✅ **Security**: No direct file system access from web interface

---

## Common Workflows

### Modifying an Existing Schedule

**Scenario:** You want to change Monday's workout in the current schedule.

1. Load the current schedule from the dropdown
2. Click the **Monday** tab
3. Edit exercises as needed (add, remove, reorder)
4. Click **Validate**
5. Click **Export & Deploy via Git**
6. Save with a new date (e.g., `schedule-2026-01-15.json`)
7. Follow deployment workflow

### Creating a Weekly Rotation

**Scenario:** You have 3 different weekly schedules to rotate.

1. Create **Schedule A** with date `2026-01-15`
2. Export and deploy
3. Create **Schedule B** with date `2026-01-22`
4. Export and deploy
5. Create **Schedule C** with date `2026-01-29`
6. Export and deploy

The app automatically loads the correct schedule based on date.

### Duplicating a Schedule

**Scenario:** You want to start with last week's schedule and make minor changes.

1. Load the previous schedule
2. Make your modifications
3. Export with a new date
4. Deploy

### Emergency Schedule Change

**Scenario:** Gym is closed, need to switch to home workout immediately.

1. Load current schedule
2. Use **Import** to load a pre-made home workout schedule
3. Export with today's date
4. Quick validation with CLI
5. Commit and push (webhook deploys within seconds)

---

## Tips & Best Practices

### Naming Conventions

**Day IDs:**
- Use short, consistent IDs: `mon`, `tue`, `wed`, `thu`, `fri`, `sat`, `sun`
- Lowercase only
- No spaces or special characters

**Exercise IDs:**
- Use descriptive prefixes: `warmup_`, `ex_`, `cool_`, `alt_`
- Examples: `warmup_row`, `ex_benchpress`, `cool_stretch`, `alt_cardio`
- Keep them short but meaningful

**Themes:**
- Be descriptive and motivating
- Examples: "Upper Body Strength", "Cardio Blast", "Active Recovery"
- Use consistent terminology across schedules

### Icon Selection

Common icons for different day types:

| Day Type | Icon | Use Case |
|----------|------|----------|
| `dumbbell` | 🏋️ | Strength training |
| `footprints` | 👣 | Walking, light activity |
| `heart-pulse` | ❤️ | Cardio |
| `flame` | 🔥 | High intensity |
| `coffee` | ☕ | Rest days |
| `trees` | 🌲 | Outdoor activities |

Full icon library: [Lucide Icons](https://lucide.dev/icons/)

### Color Schemes

Create visual consistency across weeks:

**Upper Body:**
- Color: `text-blue-400`
- Background: `bg-blue-500/10`

**Lower Body:**
- Color: `text-purple-400`
- Background: `bg-purple-500/10`

**Cardio:**
- Color: `text-red-400`
- Background: `bg-red-500/10`

**Recovery:**
- Color: `text-emerald-400`
- Background: `bg-emerald-500/10`

**Rest:**
- Color: `text-slate-400`
- Background: `bg-slate-500/10`

### Weight Progression

- Start with conservative weights
- Users can increase weights in the app
- Weight increases automatically carry forward
- Don't overthink initial values

### Timer Configurations

Provide multiple timer options for flexibility:

**Cardio:**
```json
[
  { "l": "10 Min", "s": 600 },
  { "l": "20 Min", "s": 1200 },
  { "l": "30 Min", "s": 1800 }
]
```

**Stretching:**
```json
[
  { "l": "5 Min", "s": 300 },
  { "l": "10 Min", "s": 600 }
]
```

**HIIT Intervals:**
```json
[
  { "l": "20s", "s": 20 },
  { "l": "30s", "s": 30 },
  { "l": "45s", "s": 45 }
]
```

---

## Troubleshooting

### Schedule Won't Load

**Issue:** Dropdown shows schedules but loading fails.

**Solutions:**
- Check browser console for errors
- Verify the JSON file exists in `trainings/` folder
- Ensure JSON is valid (use a JSON validator)
- Check file permissions on server

### Validation Fails

**Issue:** Getting validation errors when exporting.

**Solutions:**
- Read error messages carefully
- Check all IDs are unique
- Verify ID format (lowercase, underscores only)
- Ensure all required fields are filled
- For alternatives, verify at least 2 options exist

### Can't Save Changes

**Issue:** Changes aren't being saved.

**Solution:**
- The editor doesn't save directly to server (by design)
- Use "Export & Deploy via Git" workflow
- Changes are saved to the exported JSON file

### Timers Not Working

**Issue:** Timers don't appear in the app.

**Solutions:**
- Verify JSON format in timers field
- Check for syntax errors (commas, brackets)
- Ensure `"s"` values are integers (not strings)
- Use the example format provided in the editor

### Import Fails

**Issue:** Can't import JSON file.

**Solutions:**
- Verify JSON structure has `version` and `days` fields
- Check for valid JSON syntax (use JSONLint.com)
- Ensure file uses UTF-8 encoding
- Try pasting JSON directly instead of file upload

---

## Security Considerations

### Access Control

**Development:**
- Editor is accessible to anyone with the URL
- Fine for local development or private networks

**Production:**
- Consider restricting access to localhost only
- Add authentication (basic auth, IP whitelist)
- Use HTTPS for all connections

**Implementation Options:**

**Localhost Only** (edit `schedule-editor.php`):
```php
// Uncomment these lines at the top of the file:
$allowed_ips = [ '127.0.0.1', '::1' ];
$client_ip   = $_SERVER['REMOTE_ADDR'] ?? '';

if ( ! in_array( $client_ip, $allowed_ips, true ) ) {
    http_response_code( 403 );
    die( 'Access denied. This tool is only accessible from localhost.' );
}
```

**Basic Authentication** (`.htaccess`):
```apache
<Files "schedule-editor.php">
    AuthType Basic
    AuthName "Schedule Editor"
    AuthUserFile /path/to/.htpasswd
    Require valid-user
</Files>
```

### Why No Direct Server Saves?

The editor intentionally **does not** save directly to the server's filesystem:

**Security:**
- No web-based file system access reduces attack surface
- No risk of unauthorized schedule modifications
- File permissions remain simple

**Version Control:**
- All changes tracked in Git
- Full audit trail of modifications
- Easy rollback if issues arise

**Code Review:**
- Changes can be reviewed before deployment
- Team collaboration possible
- Quality assurance via validation

---

## Advanced Usage

### Custom Exercise Types

While the editor supports the standard types, you can add custom properties via JSON:

```json
{
  "id": "ex_custom",
  "type": "main",
  "title": "Custom Exercise",
  "desc": "3 x 12 Reps",
  "customProperty": "customValue"
}
```

The app ignores unknown properties, so they won't break anything.

### Bulk Editing

**Scenario:** Change all weights by 10%.

1. Export the schedule
2. Open in a text editor
3. Use find/replace: `"weight": "40"` → `"weight": "44"`
4. Import the modified JSON
5. Validate and re-export

### Template Schedules

Create reusable templates:

1. Build a generic schedule (e.g., "4-Day Split Template")
2. Export with a template date (e.g., `schedule-template-4day.json`)
3. Store outside `trainings/` folder
4. Import and modify when needed
5. Export with actual date for deployment

### Programmatic Generation

For complex schedules, generate JSON programmatically:

```javascript
// Generate a schedule with progressive overload
const schedule = {
  version: 1,
  days: generateDays({
    startWeight: 40,
    increment: 2.5,
    weeks: 12
  })
};
```

Import the generated JSON into the editor for final touches.

---

## Related Documentation

- **[Schedule Validation Guide](schedule-validation.md)** - Complete validation reference
- **[AI Schedule Creation Guide](ai-schedule-creation.md)** - Guide for AI assistants
- **[Changelog](../CHANGELOG.md)** - Version history and changes
- **[Main README](../README.md)** - Project overview and setup

---

## Support & Feedback

For issues or suggestions:
- **Repository**: https://github.com/apermo/bodyrefactoring
- **Issues**: https://github.com/apermo/bodyrefactoring/issues

---

## Version History

- **v9.1.0** - Schedule Editor added with full CRUD capabilities
- Future versions will add more features based on user feedback

---

**Last Updated:** January 3, 2026

