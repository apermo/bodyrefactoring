# **🏋️‍♂️ Project: Body Refactoring**

**Body Refactoring** is a personal, gamified progressive web app (PWA) designed to treat fitness, strength training, and
habit building like a software project.

It runs primarily in the browser using LocalStorage for data persistence, but utilizes a lightweight **PHP backend** to
serve dynamic, evolvable training schedules without breaking historical data.

## **📚 Documentation**

- **[Schedule Validation Guide](docs/schedule-validation.md)** - Complete guide for creating and validating training schedules

## **✨ Features**

### **🧠 Dynamic Scheduling Engine**

* **Evolvable Plans:** Workout routines are stored as JSON files (schedule-YYYY-MM-DD.json) in a trainings/ directory.
* **Smart History:** The app automatically loads the correct schedule for any given date. You can change your plan next
  week without breaking the logs of the past.
* **Time Travel:** Seamlessly navigate through past and future training weeks.

### **🎮 Gamification & UX**

* **Visual Feedback:** Confetti showers for every completed set and a massive fireworks display when a day is fully
  completed.
* **Streaks:** Tracks your consistency with visual flame counters.
* **Streak Insurance:** Earn up to 3 shields (🛡️) by completing 7 consecutive training days. Use shields when severely ill to maintain your streak.
* **NoSleep Mode:** Prevents iOS Safari from locking the screen during workouts using a background video hack.
* **Sound & Speech:** Integrated Text-to-Speech announces timer starts and completion naturally (e.g., "5 Minutes Rowing
  started").

### **🏥 Sick Mode / Recovery System**

* **Recovery Mode:** When feeling under the weather but not fully sick, activate recovery mode with 3 light activities (breathing exercises, light stretching, hydration). Completing all 3 maintains your streak.
* **Sick Mode with Shield:** Use a streak insurance shield when severely ill. Only requires hydration tracking and preserves your streak.
* **Sick Mode without Shield:** Document longer illnesses even without shields. Breaks the streak but maintains honest tracking.
* **Back to Normal:** Cancel recovery or sick mode anytime during the day if you feel better. Shields are refunded automatically.
* **Visual Integration:** Original exercises are shown as disabled/greyed out, recovery or sick activities are displayed inline with clear visual distinction.

### **📈 Smart Progressive Overload**

* **Intelligent Weight Tracking:** If you increase the weight for an exercise today, this new standard is automatically
  applied to all *future* workouts.
* **Historical Integrity:** Past logs remain unchanged.
* **Day-by-Day Lookback:** The system finds your last used weight for specific exercises, even if the schedule changes.

### **🛡️ Data Security & Privacy**

* **Local First:** All user data (ticks, weights, notes) resides in localStorage.
* **JSON Backup:** Full export/import functionality to move data between devices.
* **Privacy:** No external tracking. No cookies. No consent banners needed (private use).

### **📱 iOS Native Feel**

* Optimized as a **PWA** for the iOS Home Screen.
* **Haptic Feedback:** Vibrations on timer completion.
* **Input Optimization:** Custom numeric input handling for easier weight logging on mobile.

## **🏗️ Architecture**

### **File Structure**

```
bodyrefactoring/
├── index.php                  # Main application entry point (PHP for cache busting)
├── assets/
│   ├── cachebuster.php       # Cache busting helper function
│   ├── css/
│   │   └── styles.css        # All application styles
│   └── js/
│       └── app.js            # All application logic
├── trainings/
│   ├── index.php             # API endpoint for available schedules
│   ├── validate-schedule.php # Schedule validator (CLI only)
│   └── *.json                # Training schedule files
├── deploy.php                # GitHub webhook handler
├── .env                      # Environment configuration (not in repo)
└── .htaccess                 # Apache configuration
```

### **Cache Busting**

The app uses file modification timestamps for automatic cache invalidation:

- CSS and JS files are loaded with `?v=<timestamp>` query parameter
- Ensures users always get the latest version after updates
- Implemented via PHP's `filemtime()` function

### **Separation of Concerns**

- **HTML (index.php)**: Structure and layout only
- **CSS (assets/css/styles.css)**: All styling and animations
- **JavaScript (assets/js/app.js)**: All application logic and interactivity
- **PHP Backend**: Dynamic schedule loading and cache busting

## **🚀 Installation & Setup**

Unlike the initial version, v8.0+ requires a web server (Apache/Nginx/PHP) to list the schedule files.

## **🔄 Automatic Deployment (Plesk)**

This repository supports automatic deployment via GitHub Webhooks to Plesk-powered web hosting.

### **Server Setup**

1. **Clone repository:**

```bash
cd /var/www/vhosts/your-domain.com
git clone git@github.com:apermo/bodyrefactoring.git httpdocs
cd httpdocs
```

2. **Create .env file:**

```bash
cp .env.example .env
```

Generate a secure secret:

```bash
openssl rand -hex 32
```

Edit `.env` and add the secret:

```bash
nano .env
```

Example:

```
DEPLOY_SECRET=a1b2c3d4e5f6...
REPO_PATH=/var/www/vhosts/your-domain.com/httpdocs
```

3. **Set permissions:**

```bash
# Make .env readable only by owner (security)
chmod 600 .env

# Ensure git can write to the directory
# Note: On Plesk, file permissions are usually already correct
# If you get permission errors, contact your hosting provider
```

4. **Git configuration:**

```bash
git config user.email "deploy@your-domain.com"
git config user.name "Plesk Deploy"
```

5. **SSH key for GitHub:**

```bash
# Generate SSH key if not already exists
ssh-keygen -t ed25519 -C "deploy@your-domain.com"

# Display public key to add to GitHub
cat ~/.ssh/id_ed25519.pub
```

Add the public key as a **Deploy Key**:  
👉 https://github.com/apermo/bodyrefactoring/settings/keys

6. **Configure GitHub Webhook:**
  - URL: `https://your-domain.com/deploy.php`
  - Content-Type: `application/json`
  - Secret: Your `DEPLOY_SECRET` from `.env`
  - Events: "Just the push event"

### **Testing**

```bash
git commit --allow-empty -m "Test deployment"
git push origin main
tail -f deploy.log
```

### **1\. Requirements**

* A web server with **PHP** support (e.g., XAMPP, Docker, or any standard shared hosting).
* (Optional) GitHub Pages is **no longer sufficient** for the dynamic JSON loading (unless you hardcode the file list).

### **2\. Deployment**

1. Upload the contents of this repository to your web server.
2. Ensure the folder structure is correct:

```plaintext
   / (root)  
   ├── index.html          \# Main App  
   ├── gymlogo.png         \# Icon  
   ├── background.jpg      \# Wallpaper  
   └── trainings/          \# Config Directory  
       ├── index.php       \# JSON Loader API  
       └── schedule-2025-12-22.json
```

3. Open the URL in your browser.

### **3\. iPhone Installation**

1. Open the URL in **Safari**.
2. Tap the **Share Button** (square with an upward arrow).
3. Select **"Add to Home Screen"**.

## **💪 Usage**

### **Daily Training**

- Complete exercises by tapping the checkboxes
- Adjust weights inline - they automatically carry forward to future workouts
- Use timers for cardio and timed exercises
- Add notes in the logbook section

### **Sick Mode / Recovery**

**When to use:**
- **Recovery Mode**: Minor illness, not feeling 100%, or preventive rest day
- **Sick Mode**: Moderate to severe illness, unable to complete normal training

**How to use:**

1. **Access Sick Mode:**
   - Click the menu button (☰) in the top right
   - Select "Krank / Recovery"

2. **Choose Your Option:**

   **🌱 Recovery Mode** (No shield required)
   - Light activities to maintain streak
   - Complete 3 simple tasks:
     - 5 Min breathing exercises
     - Light stretching
     - Hydration (2L water/tea)
   - Streak continues ✅
   - Original exercises shown as disabled
   
   **🛡️ Sick Mode with Shield** (Requires 1 shield)
   - Only requires hydration tracking
   - Streak continues ✅
   - Shield is consumed
   - Best for severe illness
   
   **🛡️ Sick Mode without Shield**
   - Available when no shields left
   - Only requires hydration tracking
   - Streak breaks ⚠️
   - Allows proper documentation of longer illness

3. **Back to Normal:**
   - If you feel better during the day, click "Zurück zu Normal" button
   - Restores normal exercises
   - Automatically refunds shield if one was used

**Earning Shields:**
- Complete 7 consecutive training days → earn 1 shield 🛡️
- Maximum 3 shields can be stored
- Shields shown in header next to streak counter
- Recovery days don't count toward earning shields (only full training days)

## **⚙️ Configuration (JSON)**

You define your workouts in the trainings/ folder. The file name must follow the pattern schedule-YYYY-MM-DD.json. The
app always selects the schedule that is closest to (but not after) the current date being viewed.

### **Schedule Validation**

All schedules should be validated before deployment. The validator runs from the command line and checks for proper JSON structure, required fields, and data integrity.

📖 **[Complete Validation Guide](docs/schedule-validation.md)** - Commands, workflow, error reference, and troubleshooting

**Quick Start:**
```bash
cd trainings/
php validate-schedule.php  # Validates all schedules
```

### **Example JSON Structure**

```json
{
  "version": 1,
  "days": [
    {
      "id": "mon",
      "dayIndex": 1,
      "name": "MONDAY",
      "theme": "Push Day",
      "details": [
        {
          "id": "warmup_row",
          "type": "warmup",
          "title": "Rowing",
          "desc": "Warmup",
          "timers": [
            {
              "l": "5 Min",
              "s": 300
            },
            {
              "l": "10 Min",
              "s": 600
            }
          ]
        },
        {
          "id": "ex_benchpress",
          "type": "main",
          "title": "Bench Press",
          "desc": "3 x 12 Reps",
          "weight": "40",
          "defaultUnit": "KG"
        },
        {
          "id": "alt_cardio",
          "type": "alternatives",
          "alternatives": [
            {
              "title": "Outdoor Run",
              "desc": "Good weather",
              "timers": [
                {
                  "l": "20 Min",
                  "s": 1200
                }
              ]
            },
            {
              "title": "Treadmill",
              "desc": "Rainy day",
              "timers": [
                {
                  "l": "20 Min",
                  "s": 1200
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### **Schedule Structure**

A schedule is a JSON object with a version number and an array of days. Each day contains exercises that can be of three types: warmup, main (weighted), cool, or alternatives (multiple options).

**Key Requirements:**
- Root level: `version` (integer, currently 1) and `days` (array)
- Filename: `schedule-YYYY-MM-DD.json`
- Unique IDs for days and exercises (lowercase, underscores only)
- dayIndex: 0 or 7 = Sunday, 1 = Monday, ..., 6 = Saturday
- Required day fields: id, dayIndex, name, theme, details

📖 **[Complete Field Reference](docs/schedule-validation.md#field-reference)** - Detailed field documentation and validation rules

### **JSON Schema**

A complete JSON Schema is available at `trainings/schema-schedule-v1.json` for IDE integration (VS Code, PhpStorm, etc.).

## **⚠️ Disclaimer**

1. **No Medical Advice:** This software is for informational purposes only. Consult a physician before starting any
   training program.
2. **Private Use:** This app is designed for personal use. If you host it publicly, you are responsible for GDPR
   compliance regarding server logs (IP addresses).

## **🤝 Credits & Vibe Coding**

This project was built using **Vibe Coding** — a fluid, iterative collaboration between human creativity and AI
capability.

* **Concept & Vision:** [apermo](https://github.com/apermo)
* **AI Co-Pilot:** Google Gemini (Code generation, Logic implementation, UI Design)

## **📄 License**

This project is licensed under the **GPL-3.0 License**.
