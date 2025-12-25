# **🏋️‍♂️ Project: Body Refactoring**

**Body Refactoring** is a personal, gamified progressive web app (PWA) designed to treat fitness, strength training, and
habit building like a software project.

It runs primarily in the browser using LocalStorage for data persistence, but utilizes a lightweight **PHP backend** to
serve dynamic, evolvable training schedules without breaking historical data.

## **✨ Features**

### **🧠 Dynamic Scheduling Engine**

* **Evolvable Plans:** Workout routines are stored as JSON files (schedule-YYYY-MM-DD.json) in a trainings/ directory.
* **Smart History:** The app automatically loads the correct schedule for any given date. You can change your plan next
  week without breaking the logs of the past.
* **Time Travel:** Seamlessly navigate through past and future training weeks.

### **🎮 Gamification & UX**

* **Visual Feedback:** Confetti showers for every completed set and a massive fireworks display when a day is fully
  completed.
* **Streaks:** Tracks your consistency with visual flame counters and medals (Bronze/Silver/Gold).
* **NoSleep Mode:** Prevents iOS Safari from locking the screen during workouts using a background video hack.
* **Sound & Speech:** Integrated Text-to-Speech announces timer starts and completion naturally (e.g., "5 Minutes Rowing
  started").

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

## **⚙️ Configuration (JSON)**

You define your workouts in the trainings/ folder. The file name must follow the pattern schedule-YYYY-MM-DD.json. The
app always selects the schedule that is closest to (but not after) the current date being viewed.

### **Example JSON Structure**

```json
[
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
        "timers": [{"l":"5 Min", "s":300}, {"l":"10 Min", "s":600}] 
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
           { "title": "Outdoor Run", "desc": "Good weather", "timers": [...] },
           { "title": "Treadmill", "desc": "Rainy day", "timers": [...] }
        ]
      }
    ]
  }
]
```

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