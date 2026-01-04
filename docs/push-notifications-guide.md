# Push Notifications - Benutzeranleitung

**Version:** 11.0.0  
**Status:** Production Ready

---

## 🔔 Was sind Push Notifications?

Push Notifications erinnern dich automatisch an dein Training zur gewünschten Zeit. Die Benachrichtigungen funktionieren am besten, wenn die App als PWA (Progressive Web App) installiert ist.

---

## 📱 Einrichtung

### Schritt 1: Benachrichtigungen aktivieren

1. Öffne das **Menü** (☰ oben rechts)
2. Wähle **"Benachrichtigungen"**
3. Aktiviere den Toggle **"Erinnerungen aktivieren"**
4. Erlaube Benachrichtigungen im Browser-Dialog

### Schritt 2: Zeit einstellen

1. Wähle deine bevorzugte **Erinnerungszeit** (Standard: 18:00)
2. Die App prüft automatisch, ob es Zeit für dein Workout ist
3. Du erhältst eine Benachrichtigung zur eingestellten Zeit

### Schritt 3: Als PWA installieren (Optional, aber empfohlen!)

**iOS Safari:**
1. Tippe auf den **Teilen-Button** (📤)
2. Scrolle nach unten zu **"Zum Home-Bildschirm"**
3. Tippe auf **"Hinzufügen"**
4. Die App erscheint auf deinem Home-Bildschirm

**Chrome Desktop:**
1. Klicke auf das **Install-Icon** in der Adressleiste
2. Oder: Menü → **"App installieren"**
3. Bestätige die Installation

---

## 🎯 Wie es funktioniert

### Wenn die App geöffnet ist
- Benachrichtigungen erscheinen als **In-App Banner**
- Zusätzlich native Browser-Benachrichtigung (wenn Permission erteilt)
- Prüfung alle 5 Minuten

### Wenn die App geschlossen ist (nur als PWA!)
- Service Worker prüft zur eingestellten Zeit
- Native Benachrichtigung wird angezeigt
- Tap auf Benachrichtigung öffnet die App

### iOS Safari Besonderheiten
- Benachrichtigungen **NUR** als installierte PWA
- Im normalen Browser **NICHT** verfügbar
- Nach Installation: Volle Notification-Support

---

## ⚙️ Einstellungen

### Benachrichtigungen ein/ausschalten
- Menü → Benachrichtigungen → Toggle an/aus

### Zeit ändern
- Menü → Benachrichtigungen → Zeit-Picker

### Test-Benachrichtigung
- Menü → Benachrichtigungen → "Test-Benachrichtigung senden"
- Überprüfe, ob alles funktioniert

---

## 🚀 Vorteile als PWA

**✅ Installiert als PWA:**
- Benachrichtigungen auch wenn Browser geschlossen
- Offline-Support für alle Workouts
- Schnellerer App-Start
- Native App-Feeling
- Eigenes Icon auf Home-Bildschirm

**⚠️ Nur im Browser:**
- Benachrichtigungen nur wenn Browser offen
- Kein echter Background-Support
- Eingeschränkte Funktionalität

---

## 🔧 Troubleshooting

### Keine Benachrichtigungen erhalten?

**1. Permission prüfen:**
- Ist "Erinnerungen aktivieren" eingeschaltet?
- Hat der Browser Benachrichtigungs-Permission?

**2. iOS Safari:**
- Ist die App als PWA installiert?
- Öffnest du die App vom Home-Bildschirm?
- Im normalen Safari funktionieren keine Benachrichtigungen!

**3. Browser-Einstellungen:**
- Chrome: Einstellungen → Datenschutz → Website-Einstellungen → Benachrichtigungen
- Safari: Einstellungen → Websites → Benachrichtigungen
- Stelle sicher, dass die Domain nicht blockiert ist

**4. Test-Benachrichtigung:**
- Sende eine Test-Benachrichtigung
- Wenn diese nicht erscheint → Permission-Problem
- Wenn sie erscheint → Timing-Problem (falsche Zeit eingestellt?)

### Service Worker Probleme?

**App aktualisieren:**
- Menü → "App aktualisieren"
- Lädt den neuesten Service Worker

**Cache leeren:**
- Browser-Einstellungen → Browserdaten löschen
- Nur "Gecachte Bilder und Dateien"
- **NICHT** "Cookies und Website-Daten" (sonst gehen Trainingsdaten verloren!)

---

## 📊 Technische Details

### Service Worker
- Datei: `/assets/js/sw.js`
- Cache-Version: Dynamisch aus `composer.json` via `/assets/js/sw-version.php`
- Caching-Strategie: Network first, fallback to cache
- Scope: `/` (komplette App)

### Notification Manager
- Datei: `/assets/js/push-notifications.js`
- Prüfintervall: 5 Minuten (wenn App offen)
- Reminder-Fenster: ±5 Minuten um eingestellte Zeit

### Browser-Support
- ✅ iOS Safari 16.4+ (als PWA)
- ✅ Chrome Desktop
- ✅ Safari Desktop
- ⚠️ Chrome iOS (gleich wie Safari iOS)
- ❌ Ältere Browser

---

## 💡 Tipps & Tricks

### Optimale Nutzung
1. **Installiere als PWA** für beste Experience
2. **Stelle Zeit passend ein** zu deinem Trainingsplan
3. **Test-Benachrichtigung** nach Setup senden
4. **App offen lassen** im Hintergrund für iOS (wenn nicht als PWA)

### Multiple Devices
- Einstellungen werden **lokal** gespeichert (localStorage)
- Auf jedem Gerät separat einrichten
- Überlege, auf welchem Device du Erinnerungen willst

### Batterie-Verbrauch
- Service Worker ist sehr effizient
- Minimaler Batterie-Impact
- Nur aktiv wenn nötig

---

## 🎓 FAQ

**Q: Kann ich mehrere Erinnerungszeiten einstellen?**  
A: Aktuell nur eine Zeit. Feature für mehrere Zeiten kommt in v11.1.0

**Q: Funktioniert es auch am Wochenende?**  
A: Standardmäßig Mo-Sa. Sonntag = Ruhetag. Anpassbar in zukünftigen Versionen.

**Q: Kann ich unterschiedliche Zeiten pro Tag?**  
A: Noch nicht. Aktuell eine feste Zeit für alle Trainingstage.

**Q: Was passiert an Sick/Recovery Tagen?**  
A: Du bekommst trotzdem die Erinnerung - für Recovery-Aktivitäten.

**Q: Brauche ich Internet für Benachrichtigungen?**  
A: Nein! Service Worker funktioniert offline (als PWA).

---

## 🆘 Support

**Problem nicht gelöst?**
1. Prüfe ob Service Worker registriert: Developer Console → Application → Service Workers
2. Prüfe Notification Permission: Developer Console → Application → Storage → Permissions
3. Test mit anderen Websites (z.B. web.dev/notifications-test)
4. Falls nichts hilft: Browser-Problem, nicht App-Problem

---

## 🔮 Roadmap

**Geplante Features:**
- v11.1.0: Multiple Erinnerungszeiten
- v11.2.0: Tagesspezifische Zeiten
- v11.3.0: Smart Reminders (basierend auf Streak)
- v12.0.0: Optionale Server-Push (für echte Background Notifications)

---

**Viel Erfolg mit deinen Trainings-Erinnerungen! 🏋️💪**

