# **🏋️‍♂️ Project: Body Refactoring**

**Body Refactoring** is a personal, gamified dashboard designed to treat fitness, strength training, and weight loss like a software project.

It is a **Single-Page Application (SPA)** that runs entirely in your browser. It requires no backend, no database, and no installation of dependencies. All data belongs to you and is stored securely in your browser's LocalStorage.

## **✨ Features**

### **🎮 Gamification & Motivation**

* **Visual Feedback:** Confetti showers for every completed set and a massive fireworks display when a day is fully completed.  
* **Streaks:** Green borders and badges highlight successfully completed days.  
* **Leveling:** Treat your training consistency like an RPG.

### **📈 Smart Progressive Overload**

* **Intelligent Weight Tracking:** If you increase the weight for an exercise today, this new standard is automatically applied to all *future* workouts.  
* **History Protection:** Weights recorded in the *past* remain unchanged, ensuring an honest log of your progression.  
* **Time Travel Logic:** Navigate through past and upcoming weeks to review performance or plan ahead.

### **🧠 Memo System ("Message to Future Self")**

* **Logbook:** Record pain points, successes, or feelings for every training day.  
* **Automatic Review:** Below today's note field, the app automatically displays what you wrote **last week** on this same day (e.g., "Next time, increase by 2kg\!" or "Shoulder hurt, go easy").

### **🛡️ Data Security & Privacy**

* **100% Offline:** No data leaves your device. Everything resides in localStorage.  
* **Backup System:** Export your entire progress as a .json file and import it on other devices.  
* **Anti-Cheat:** Future days are locked. Days older than 3 days are archived (read-only) to prevent retroactive manipulation.

### **📱 iOS Native Feel**

* Optimized as a **PWA (Progressive Web App)** for the iOS Home Screen.  
* Runs in full-screen mode without browser UI.  
* Supports Safe-Area-Insets and touch feedback.

## **🚀 Installation & Usage**

### **Quick Start (Desktop)**

1. Download the index.html file and the gymlogo.png image.  
2. Place both files in the same folder.  
3. Open the HTML file in any modern browser (Chrome, Safari, Firefox).

### **Installation on iPhone (Home Screen)**

1. Upload the files to a web server (GitHub Pages is perfect for this\!) or send them to your device via AirDrop.  
2. Open the URL in **Safari** on your iPhone.  
3. Tap the **Share Button** (square with an upward arrow).  
4. Select **"Add to Home Screen"**.  
5. The app icon will appear on your home screen, and the app will launch in full-screen mode.

## **⚙️ Customization (Important\!)**

This plan is tailored to **my specific needs** (187cm, 120kg, Home-Gym setup). **You must adapt the code to your own requirements before starting\!**

Open the HTML file in a text editor and locate the const scheduleTemplate section. There you can:

1. **Set Start Date:** Change const USER\_START\_DATE to your specific start date.  
2. **Modify Exercises:** Adjust the details arrays within the weekdays to match your equipment and goals.  
3. **Change Days:** If you prefer training on Tuesdays instead of Mondays, move the blocks accordingly.

```
// Example code customization:
const scheduleTemplate = [
    { 
      id: 'mon', 
      name: 'MONDAY', 
      theme: 'Leg Day', 
      details: [
          { id: 'm1', type: 'main', title: 'Squats', desc: '3 x 10', weight: '60' }
      ] 
    },
    // ... other days
];
```

## **⚠️ Medical Disclaimer & Liability Waiver**

**Please read carefully:**

1. **No Medical Advice:** This software and the sample workout plans contained within are for informational and entertainment purposes only. They do not constitute medical advice, diagnosis, or treatment.  
2. **Personal Responsibility:** Use of this app and performance of the exercises are at your own risk. Every body is different. What works for the creator of this repository may be unsuitable or even harmful to another person.  
3. **Consultation:** Before starting a new exercise program or making drastic dietary changes, **always** consult a physician or qualified sports medicine professional—especially if you have pre-existing conditions, are significantly overweight, or have been physically inactive for a long time.  
4. **Liability:** The creator of this code assumes no liability for injuries, health issues, or property damage resulting from the use of this software or following the training plan.

**You must adapt the plan to your own fitness level and health requirements\!**

## **🤝 Credits & Vibe Coding**

This project was built using **Vibe Coding** — a fluid, iterative collaboration between human creativity and AI capability.

* **Concept & Vision:** [apermo](https://github.com/apermo)  
* **AI Co-Pilot:** Google Gemini (Code generation, Logic implementation, UI Design)

## **📄 License**

This project is licensed under the GPL-3.0 License.  
This guarantees that you are free to run, study, share, and modify the software, provided that any derived works are also distributed under the same license terms.
