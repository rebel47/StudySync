# 📚 StudySync

A modern, collaborative study application that combines note-taking with real-time study sessions, Pomodoro timers, and integrated chat functionality.

## 🌐 Live Demo

**🚀 [Try StudySync Now](https://rebel47.github.io/StudySync/)**

**📂 [GitHub Repository](https://github.com/rebel47/StudySync)**

## ✨ Features

### 🎯 **Collaborative Study Sessions**
- **Create & Join Rooms** - Generate session codes to study with friends
- **Real-time Timer Sync** - Pomodoro timer synchronizes across all participants
- **Live Participant Counter** - See who's currently studying
- **Host Controls** - Session creator manages timer for everyone

### ⏰ **Smart Pomodoro Timer**
- **25-minute focus sessions** with 5/15-minute breaks
- **Beautiful animated progress ring** with gradient colors
- **Audio notifications** - Gentle beep when sessions complete
- **Automatic mode switching** - Seamless transition between work/break
- **Cross-device synchronization** in collaborative sessions

### 💬 **Built-in Study Chat**
- **Real-time messaging** - Instant communication with study partners
- **Slide-out interface** - Clean UI that doesn't interfere with studying
- **Unread notifications** - Badge shows message count with animations
- **Google account integration** - Uses real names instead of random usernames
- **Browser notifications** - Desktop alerts when chat is closed

### 🎨 **Focus Mode**
- **Distraction-free fullscreen** - Hide everything except the timer
- **Zen-like black background** - Minimize visual distractions
- **Large timer display** - Timer becomes center of attention
- **ESC to exit** - Quick return to normal view

### 📝 **Personal Notes**
- **Create, edit, delete** notes with rich text support
- **Cloud sync** - Notes saved to Firebase Firestore
- **User isolation** - Your notes are private and secure
- **Modern card-based UI** - Clean, organized note display

## 🚀 Quick Start

### Prerequisites
- Modern web browser with JavaScript enabled
- Google account for authentication
- Firebase project with Authentication, Firestore, and Realtime Database enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rebel47/StudySync.git
   cd StudySync
   ```

2. **Configure Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Google provider)
   - Enable Firestore Database
   - Enable Realtime Database
   - Copy your Firebase config and update `app.js`

3. **Set up Firebase Security Rules**
   
   **Firestore Rules:**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/notes/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

   **Realtime Database Rules:**
   Copy the rules from `firebase-rules.json` to your Firebase Console → Realtime Database → Rules

4. **Deploy**
   - Upload files to your web server or use Firebase Hosting
   - Or simply open `index.html` in a web browser for local testing

## 🔧 Configuration

### Firebase Setup

1. **Authentication**
   - Go to Firebase Console → Authentication → Sign-in method
   - Enable Google sign-in provider
   - Add your domain to authorized domains

2. **Firestore Database**
   - Create database in production mode
   - Apply the security rules provided above

3. **Realtime Database**
   - Create database in locked mode
   - Apply the security rules from `firebase-rules.json`

4. **Deploy**
   - Upload files to your web server or use Firebase Hosting
   - Or simply open `index.html` in a web browser for local testing

## 🎮 Usage

### Getting Started
1. **Sign in** with your Google account
2. **Create a study session** or join an existing one with a session code
3. **Start the Pomodoro timer** and begin studying
4. **Take notes** and chat with study partners
5. **Use Focus Mode** for distraction-free studying

### Study Sessions
- **Creating**: Click "Create Room" to generate a session code
- **Joining**: Click "Join Room" and enter a 6-character code
- **Sharing**: Share the session code with friends to study together
- **Timer Control**: Host or any participant can control the timer
- **Leaving**: Click "Leave Room" to exit the session

### Notes Management
- **Add**: Click "+ New" to create a note
- **Edit**: Click "Edit" on any note card
- **Delete**: Click "Delete" with confirmation
- **Auto-save**: Notes are automatically saved to the cloud

### Chat Features
- **Open Chat**: Click the chat button (💬) in bottom-right
- **Send Messages**: Type and press Enter or click Send
- **Notifications**: Unread count appears on chat button
- **Close Chat**: Click × or chat button to close

## 🏗️ Project Structure

```
StudySync/
├── index.html          # Main HTML structure
├── styles.css          # Modern CSS styling with animations
├── app.js              # Core JavaScript functionality
├── firebase-rules.json # Realtime Database security rules
├── .gitignore         # Git ignore configuration
└── README.md          # This file
```

## 🔒 Security

### Data Protection
- **User Isolation**: Notes are private to each user
- **Session Security**: Only participants can access session data
- **Secure Rules**: Firebase rules prevent unauthorized access
- **No Data Leaks**: Proper validation and sanitization

### Privacy Features
- **Google Auth**: Secure authentication via Google
- **Real Names**: Uses actual Google account names in chat
- **Session Codes**: 6-character codes for easy sharing
- **Automatic Cleanup**: Sessions auto-expire when empty

## 🎨 Design Philosophy

### Modern UI/UX
- **Minimalist Design**: Clean, distraction-free interface
- **Dark Theme**: Easy on the eyes for long study sessions
- **Smooth Animations**: Subtle transitions and micro-interactions
- **Responsive Layout**: Works on desktop, tablet, and mobile

### Accessibility
- **Keyboard Navigation**: ESC key support, Enter key shortcuts
- **Clear Visual Hierarchy**: Proper contrast and typography
- **Intuitive Controls**: Self-explanatory buttons and actions
- **Mobile-Friendly**: Touch-optimized for mobile devices

## 🚀 Deployment

### Firebase Hosting (Recommended)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Manual Deployment
- Upload all files to your web server
- Ensure HTTPS is enabled (required for notifications)
- Configure your domain in Firebase Console

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Firebase** for backend services
- **Google Fonts** for Inter typography
- **Google Auth** for secure authentication
- **CSS Gradients** for modern visual effects

## 📞 Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Check existing issues for solutions
- Contact the development team

---

**Built with ❤️ for productive studying**