# 📚 StudySync - Collaborative Study Timer

> **Boost your productivity with friends!** A beautiful, real-time collaborative Pomodoro timer that helps students study together, stay motivated, and achieve their goals.

**🚀 [Try StudySync Live](https://rebel47.github.io/StudySync/)**

![StudySync Preview](https://img.shields.io/badge/StudySync-Live%20Demo-blue?style=for-the-badge&logo=github)

## ✨ Features

### 🎯 **Collaborative Study Sessions**
- **Real-time sync** - Timer syncs perfectly across all devices
- **Host control** - Room creator manages the timer for everyone
- **Live participant counter** - See who's studying with you
- **Instant joining** - Share a simple link to invite friends

### ⏰ **Smart Pomodoro Timer**
- **25-minute focus sessions** with 5/15-minute breaks
- **Visual progress ring** - Beautiful animated countdown
- **Audio notifications** - Gentle beep when sessions complete
- **Mode switching** - Easy toggle between work and break modes

### 💬 **Built-in Study Chat**
- **Real-time messaging** - Chat with your study partners
- **Slide-out interface** - Doesn't interfere with studying
- **Unread indicators** - Never miss important messages
- **Auto-generated usernames** - Fun names like "SmartStudent42"

### 🎨 **Focus Mode**
- **Distraction-free fullscreen** - Hide everything except the timer
- **Zen-like black background** - Minimize visual distractions
- **Larger display** - Timer becomes the center of attention
- **ESC to exit** - Quick return to normal view

### 📱 **Perfect for Students**
- **No setup required** - Works instantly without registration
- **Mobile responsive** - Study on any device
- **GitHub Pages hosted** - Fast, reliable, and always available
- **Zero configuration** - No API keys or complex setup

## 🚀 Quick Start

### For Solo Study
1. **Visit** [StudySync](https://rebel47.github.io/StudySync/)
2. **Click Start** - Begin your 25-minute focus session
3. **Enter Focus Mode** - Click "Focus Mode" for distraction-free studying

### For Group Study
1. **Create a room** - Click "Create Room" 
2. **Share the link** - Copy and send to study partners
3. **Study together** - Timer syncs across all devices automatically
4. **Chat and motivate** - Use built-in chat to stay connected

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Real-time Sync**: BroadcastChannel API
- **Hosting**: GitHub Pages
- **Design**: Modern CSS with animations and gradients
- **Audio**: Web Audio API for notifications

## 📖 How It Works

### Room Management
- **Host Control**: Only the room creator can start/pause/reset the timer
- **Automatic Sync**: All participants see the same timer state
- **Participant Tracking**: Real-time count of active studiers
- **Host Handover**: If host leaves, oldest participant becomes new host

### Chat System
- **Privacy-First**: Messages are real-time only, not stored
- **Safe Messaging**: HTML escaping prevents any malicious content
- **Character Limits**: 200 character limit keeps messages focused
- **Smart Notifications**: Badge shows unread message count

### Focus Features
- **Pomodoro Technique**: 25-min work, 5-min short break, 15-min long break
- **Visual Feedback**: Animated progress ring and gradient timer display
- **Audio Cues**: Gentle notification sounds for session completion
- **Fullscreen Mode**: Immersive studying experience

## 🎨 Screenshots

### Main Interface
- Clean, modern design with dark theme
- Large, easy-to-read timer display
- Intuitive control buttons
- Real-time participant counter

### Focus Mode
- Full-screen timer display
- Minimal distractions
- Black background for eye comfort
- Essential controls only

### Chat Interface
- Slide-out messaging panel
- Message bubbles with timestamps
- System notifications for joins/leaves
- Unread message indicators

## 🔧 Local Development

### Prerequisites
- Modern web browser
- Local web server (optional)

### Setup
```bash
# Clone the repository
git clone https://github.com/rebel47/StudySync.git

# Navigate to project directory
cd StudySync

# Serve locally (optional)
python -m http.server 3000
# OR
npx serve .
# OR simply open index.html in your browser
```

### File Structure
```
StudySync/
├── index.html          # Main HTML structure
├── styles.css          # All styling and animations
├── script.js           # JavaScript functionality
└── README.md           # This file
```

## 🌟 Use Cases

### **Study Groups**
- Coordinate study sessions with classmates
- Stay motivated with real-time progress sharing
- Use chat for quick questions and encouragement
- Perfect for virtual study dates

### **Solo Focus**
- Eliminate distractions with focus mode
- Follow proven Pomodoro technique
- Track your study sessions visually
- Build consistent study habits

### **Remote Learning**
- Study "together" while apart
- Create accountability with friends
- Share study schedules and breaks
- Make online learning more social

### **Work/Productivity**
- Use for any focused work sessions
- Team sprint planning and execution
- Break reminder for long work days
- Collaborative project time tracking

## 🎯 Benefits

### **For Students**
- ✅ **Increased Focus** - Pomodoro technique proven to boost concentration
- ✅ **Social Accountability** - Study with friends for motivation
- ✅ **Habit Building** - Consistent timing builds study routines
- ✅ **Reduced Procrastination** - Shared timer creates commitment

### **For Study Groups**
- ✅ **Perfect Sync** - Everyone stays on the same schedule
- ✅ **Easy Coordination** - No complex scheduling needed
- ✅ **Built-in Communication** - Chat without switching apps
- ✅ **Inclusive** - Works on any device, no downloads required

## 🚀 Deployment

StudySync is designed for **GitHub Pages** deployment:

1. **Fork this repository**
2. **Enable GitHub Pages** in repository settings
3. **Your timer is live!** Share your custom URL

### Custom Domain (Optional)
- Add a `CNAME` file with your domain
- Configure DNS settings
- Enable HTTPS in GitHub Pages settings

## 🤝 Contributing

We welcome contributions! Here are ways to help:

### **Bug Reports**
- Found an issue? Open a GitHub issue
- Include browser information and steps to reproduce
- Screenshots help us understand the problem

### **Feature Requests**
- Have an idea? Start a discussion
- Explain the use case and benefits
- Consider how it fits with study-focused design

### **Code Contributions**
- Fork the repository
- Create a feature branch
- Make your changes
- Submit a pull request

### **Documentation**
- Improve this README
- Add code comments
- Create tutorials or guides
- Translate to other languages

## 📝 Roadmap

### **Planned Features**
- [ ] **Study Statistics** - Track your focus time and habits
- [ ] **Theme Customization** - Light mode and custom colors
- [ ] **Sound Options** - Different notification sounds
- [ ] **Break Activities** - Suggested activities for break time
- [ ] **Room Passwords** - Private study rooms
- [ ] **Mobile App** - Native iOS/Android apps

### **Potential Enhancements**
- [ ] **Calendar Integration** - Schedule study sessions
- [ ] **Goal Setting** - Daily/weekly study targets
- [ ] **Badges/Achievements** - Gamify the study experience
- [ ] **Study Music Integration** - Built-in focus playlists
- [ ] **Break Reminders** - Smart notifications for optimal breaks

## 🐛 Known Issues

- **Browser Compatibility**: Requires modern browser with BroadcastChannel support
- **Cross-Device Sync**: Only works within same browser family (Chrome-to-Chrome, etc.)
- **Message Persistence**: Chat messages don't save between sessions (by design)

## 💡 Tips for Best Results

### **Maximize Focus**
- Use Focus Mode to eliminate distractions
- Put your phone in another room
- Prepare everything before starting timer
- Take breaks seriously - they're important!

### **Group Study Success**
- Agree on study goals before starting
- Use chat sparingly during focus time
- Celebrate completions together
- Respect the host's timer control

### **Building Habits**
- Start with shorter sessions if 25 minutes feels long
- Study at the same time daily
- Track your progress informally
- Reward yourself for consistency

## 📄 License

MIT License - feel free to use, modify, and distribute!

## 🙏 Acknowledgments

- **Pomodoro Technique** - Francesco Cirillo for the productivity method
- **Modern Web APIs** - BroadcastChannel for real-time sync
- **GitHub Pages** - Free, reliable hosting for students
- **Open Source Community** - Inspiration and best practices

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/rebel47/StudySync/issues)
- **Discussions**: [GitHub Discussions](https://github.com/rebel47/StudySync/discussions)
- **Live Demo**: [StudySync App](https://rebel47.github.io/StudySync/)

---

**Made with ❤️ for students everywhere. Happy studying! 📚✨**

> *"The secret to getting ahead is getting started. The secret to getting started is breaking your complex overwhelming tasks into small manageable tasks, and starting on the first one."* - Mark Twain

# StudySync Pro (temporary project notes)

WARNING: This README temporarily contains project metadata and Firebase config for migration/recreation purposes. Remove sensitive values once migration is complete.

---

Project: StudySync Pro — Enhanced Collaborative Timer (Pomodoro)
Deployed: https://rebel47.github.io/StudySync/

Summary
- Browser-based collaborative Pomodoro/timer app with chat, rooms, focus mode, and Firebase backend.
- Modular JS structure under `js/modules` (Timer, Firebase, Stats, Settings, UI, Audio, Auth).

Important files and folders
- index.html — main HTML (includes script tags and overlays).
- js/config/firebase.js — Firebase configuration (used by app).
- js/main.js — app bootstrap (creates StudySyncApp instance).
- js/StudySyncApp.js — main orchestrator tying modules together.
- js/modules/TimerModule.js — timer logic (start/pause/resume/reset, modes).
- js/modules/FirebaseModule.js — realtime DB / rooms / chat integration.
- js/modules/StatsModule.js — tracking sessions, streaks, analytics.
- js/modules/UIModule.js — DOM bindings and UI updates.
- js/modules/AuthModule.js — Firebase Authentication (Google Sign-In).
- styles/ — CSS files (main.css, components.css, responsive.css)

Firebase config (from js/config/firebase.js) — TEMPORARY COPY
Replace values with your own if recreating; if this project belongs to you, keys are the same as in the config file.

```
const firebaseConfig = {
    apiKey: "AIzaSyCHOhq4c1FxOU8MqgZmg58VVOPBe-0NsGE",
    authDomain: "studysync-7c87f.firebaseapp.com",
    databaseURL: "https://studysync-7c87f-default-rtdb.europe-west1.firebasedatabase.app/",
    projectId: "studysync-7c87f",
    storageBucket: "studysync-7c87f.firebasestorage.app",
    messagingSenderId: "176545965227",
    appId: "1:176545965227:web:465da8d394e1aa00eb43ee"
};
```

Notes when recreating a Firebase project
1. Create a Firebase project in the Firebase Console.
2. Enable Realtime Database and set rules appropriate for your app (start in test mode for quick testing).
3. Enable Authentication -> Sign-in method -> Google and add authorized domain (e.g. `rebel47.github.io` or `localhost`).
4. Replace `js/config/firebase.js` config with your project's config (or use environment injection during build).
5. If using GitHub Pages, add the domain to OAuth allowed domains.

Quick local dev steps
1. Clone the repository to your machine.
2. Ensure the `js/config/firebase.js` has valid Firebase config for your project.
3. Serve the project locally (static server):
   - Python: `python -m http.server 8000` (from project root)
   - or install `serve`: `npx serve .` / `npm i -g serve` then `serve .`
4. Open `http://localhost:8000` and test Google Sign-In and timer functionality.

Recreate / Migration checklist
- [ ] Create Firebase project and configure Realtime DB and Auth (Google).
- [ ] Update or regenerate `js/config/firebase.js` with new project config.
- [ ] Audit Firebase Realtime Database rules and indexes used by FirebaseModule.
- [ ] Run locally and test: sign-in, create/join room, start timer, chat, sync.
- [ ] Deploy to GitHub Pages (or other static host). Update OAuth redirect/allowed domains.

Development notes & recommendations
- Modular structure: keep modules small and single-responsibility (Timer, UI, Firebase, Stats, Settings, Audio, Auth).
- Remove console.debug logs and temporary debug scripts before production deploy.
- Move Firebase config out of source in production (use build-time env or server-side proxy).
- Use Firestore for more structured data if you plan to scale chat/rooms beyond simple prototypes.

Temporary debug artifacts to remove after migration
- Any `console.log` debugging in TimerModule, StudySyncApp, and index.html debug script.
- The README copy of Firebase keys — remove once migration completes.

Contact / Notes
- Deployed demo (original): https://rebel47.github.io/StudySync/

---

This file is intentionally concise. If you want, I can also generate a migration script, a cleaned starter repo (without your Firebase keys), or a step-by-step automation (bash/PowerShell) to recreate the project and inject new Firebase config.