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