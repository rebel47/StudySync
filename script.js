// Firebase configuration - Replace with your actual config
const firebaseConfig = {
    apiKey: "AIzaSyCHOhq4c1FxOU8MqgZmg58VVOPBe-0NsGE",
    authDomain: "studysync-7c87f.firebaseapp.com",
    databaseURL: "https://studysync-7c87f-default-rtdb.europe-west1.firebasedatabase.app/",
    projectId: "studysync-7c87f",
    storageBucket: "studysync-7c87f.firebasestorage.app",
    messagingSenderId: "176545965227",
    appId: "1:176545965227:web:465da8d394e1aa00eb43ee"
};

class StudyTimer {
    constructor() {
        this.currentMode = 'focus';
        this.duration = 1500; // 25 minutes in seconds
        this.timeLeft = this.duration;
        this.isRunning = false;
        this.isPaused = false;
        this.startTime = null;
        this.interval = null;
        this.roomId = null;
        this.isHost = false;
        this.participants = new Map();
        this.myId = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        this.isFullscreen = false;
        this.userName = 'Student ' + Math.floor(Math.random() * 1000);
        this.isChatOpen = false;
        this.unreadMessages = 0;
        this.chatHistory = [];
        
        // Firebase specific
        this.db = null;
        this.roomRef = null;
        this.participantsRef = null;
        this.timerRef = null;
        this.chatRef = null;
        this.firebaseInitialized = false;
        this.heartbeatInterval = null;
        
        this.initializeElements();
        this.attachEventListeners();
        this.initializeFirebase();
        this.checkForRoom();
    }
    
    async initializeFirebase() {
        try {
            // Check if Firebase config is set
            if (firebaseConfig.apiKey === "your-api-key-here") {
                console.warn('Firebase not configured. Please set your Firebase config.');
                this.showToast('Firebase not configured. Please check console for setup instructions.');
                return;
            }
            
            // Initialize Firebase
            firebase.initializeApp(firebaseConfig);
            this.db = firebase.database();
            this.firebaseInitialized = true;
            
            console.log('Firebase initialized successfully');
            this.showToast('Connected to Firebase! 🔥');
            
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            this.showToast('Firebase connection failed. Check console for details.');
        }
    }
    
    initializeElements() {
        this.timerDisplay = document.getElementById('timer-display');
        this.modeDisplay = document.getElementById('mode-display');
        this.startBtn = document.getElementById('start-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.participantCount = document.getElementById('participant-count');
        this.roomUrl = document.getElementById('room-url');
        this.createRoomBtn = document.getElementById('create-room-btn');
        this.copyBtn = document.getElementById('copy-btn');
        this.joinRoomBtn = document.getElementById('join-room-btn');
        this.toast = document.getElementById('toast');
        this.progressCircle = document.getElementById('progress-circle');
        this.modeButtons = document.querySelectorAll('.mode-btn');
        this.fullscreenBtn = document.getElementById('fullscreen-btn');
        this.fullscreenExitBtn = document.getElementById('fullscreen-exit-btn');
        
        // Chat elements
        this.chatPanel = document.getElementById('chat-panel');
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.sendChatBtn = document.getElementById('send-chat-btn');
        this.toggleChatBtn = document.getElementById('toggle-chat-btn');
        this.closeChatBtn = document.getElementById('close-chat-btn');
        
        // Custom timer modal elements
        this.customModal = document.getElementById('custom-modal');
        this.customMinutesInput = document.getElementById('custom-minutes');
        this.closeModalBtn = document.getElementById('close-modal-btn');
        this.cancelCustomBtn = document.getElementById('cancel-custom-btn');
        this.setCustomBtn = document.getElementById('set-custom-btn');
        this.customModeBtn = document.getElementById('custom-mode-btn');
        
        // Initially hide the exit button
        if (this.fullscreenExitBtn) {
            this.fullscreenExitBtn.style.display = 'none';
        }
    }
    
    attachEventListeners() {
        this.startBtn.addEventListener('click', () => this.toggleTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());
        this.createRoomBtn.addEventListener('click', () => this.createRoom());
        this.copyBtn.addEventListener('click', () => this.copyRoomUrl());
        this.joinRoomBtn.addEventListener('click', () => this.joinRoom());
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        
        if (this.fullscreenExitBtn) {
            this.fullscreenExitBtn.addEventListener('click', () => this.exitFullscreen());
        }
        
        // Chat event listeners
        if (this.toggleChatBtn) {
            this.toggleChatBtn.addEventListener('click', () => this.toggleChat());
        }
        if (this.sendChatBtn) {
            this.sendChatBtn.addEventListener('click', () => this.sendMessage());
        }
        if (this.chatInput) {
            this.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }
        if (this.closeChatBtn) {
            this.closeChatBtn.addEventListener('click', () => this.closeChat());
        }
        
        // Custom timer modal event listeners
        if (this.customModeBtn) {
            this.customModeBtn.addEventListener('click', () => this.openCustomModal());
        }
        if (this.closeModalBtn) {
            this.closeModalBtn.addEventListener('click', () => this.closeCustomModal());
        }
        if (this.cancelCustomBtn) {
            this.cancelCustomBtn.addEventListener('click', () => this.closeCustomModal());
        }
        if (this.setCustomBtn) {
            this.setCustomBtn.addEventListener('click', () => this.setCustomTimer());
        }
        
        // ESC key to exit fullscreen
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isFullscreen) {
                this.exitFullscreen();
            }
        });
        
        this.modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                const duration = parseInt(btn.dataset.duration);
                this.changeMode(mode, duration);
            });
        });
    }
    
    checkForRoom() {
        let roomId = null;
        
        if (window.location.protocol === 'file:') {
            const search = window.location.search;
            if (search) {
                const params = new URLSearchParams(search);
                roomId = params.get('room');
            }
        } else {
            const urlParams = new URLSearchParams(window.location.search);
            roomId = urlParams.get('room');
        }
        
        if (roomId) {
            this.roomId = roomId;
            this.roomUrl.value = window.location.href;
            this.copyBtn.disabled = false;
            this.joinExistingRoom();
        }
    }
    
    async createRoom() {
        if (!this.firebaseInitialized) {
            this.showToast('Please wait for Firebase to initialize...');
            return;
        }
        
        this.roomId = this.generateRoomId();
        this.isHost = true;
        
        const url = new URL(window.location);
        url.searchParams.set('room', this.roomId);
        window.history.pushState({}, '', url);
        
        this.roomUrl.value = url.toString();
        this.copyBtn.disabled = false;
        
        try {
            // Initialize room in Firebase
            this.roomRef = this.db.ref(`rooms/${this.roomId}`);
            this.participantsRef = this.roomRef.child('participants');
            this.timerRef = this.roomRef.child('timer');
            this.chatRef = this.roomRef.child('chat');
            
            // Set initial room data
            await this.roomRef.set({
                created: firebase.database.ServerValue.TIMESTAMP,
                host: this.myId,
                timer: {
                    mode: this.currentMode,
                    duration: this.duration,
                    timeLeft: this.timeLeft,
                    isRunning: false,
                    isPaused: false,
                    startTime: null,
                    lastUpdate: firebase.database.ServerValue.TIMESTAMP
                },
                chat: {
                    messages: []
                }
            });
            
            // Add myself as participant
            await this.participantsRef.child(this.myId).set({
                name: this.userName,
                isHost: true,
                joinedAt: firebase.database.ServerValue.TIMESTAMP,
                lastSeen: firebase.database.ServerValue.TIMESTAMP
            });
            
            this.setupFirebaseListeners();
            this.startHeartbeat();
            this.updateControlsVisibility();
            
            this.showToast('Room created! Share the link to study together 🎯');
            this.addChatMessage('Study room created! Welcome to your collaborative study session.', 'system');
            
        } catch (error) {
            console.error('Error creating room:', error);
            this.showToast('Failed to create room. Please try again.');
        }
    }
    
    async joinRoom() {
        if (!this.firebaseInitialized) {
            this.showToast('Please wait for Firebase to initialize...');
            return;
        }
        
        const roomCode = prompt('Enter room code (the letters/numbers after ?room= in the link):');
        if (roomCode && roomCode.trim()) {
            this.roomId = roomCode.trim().toLowerCase();
            this.isHost = false;
            
            const url = new URL(window.location);
            url.searchParams.set('room', this.roomId);
            window.history.pushState({}, '', url);
            
            this.roomUrl.value = url.toString();
            this.copyBtn.disabled = false;
            
            this.joinExistingRoom();
        }
    }
    
    async joinExistingRoom() {
        if (!this.firebaseInitialized) {
            // Wait for Firebase to initialize
            setTimeout(() => this.joinExistingRoom(), 1000);
            return;
        }
        
        try {
            this.roomRef = this.db.ref(`rooms/${this.roomId}`);
            this.participantsRef = this.roomRef.child('participants');
            this.timerRef = this.roomRef.child('timer');
            this.chatRef = this.roomRef.child('chat');
            
            // Check if room exists
            const roomSnapshot = await this.roomRef.once('value');
            if (!roomSnapshot.exists()) {
                this.showToast('Room not found. Please check the room code.');
                return;
            }
            
            // Add myself as participant
            await this.participantsRef.child(this.myId).set({
                name: this.userName,
                isHost: false,
                joinedAt: firebase.database.ServerValue.TIMESTAMP,
                lastSeen: firebase.database.ServerValue.TIMESTAMP
            });
            
            this.setupFirebaseListeners();
            this.startHeartbeat();
            this.updateControlsVisibility();
            
            this.showToast('Joined study room! 🔍');
            
        } catch (error) {
            console.error('Error joining room:', error);
            this.showToast('Failed to join room. Please try again.');
        }
    }
    
    setupFirebaseListeners() {
        // Listen for participant changes
        this.participantsRef.on('value', (snapshot) => {
            this.participants.clear();
            const participantsData = snapshot.val();
            
            if (participantsData) {
                Object.keys(participantsData).forEach(participantId => {
                    this.participants.set(participantId, participantsData[participantId]);
                });
            }
            
            this.updateParticipantCount();
            
            // Check if I should become host
            if (!this.isHost && !this.hasActiveHost()) {
                this.becomeHost();
            }
        });
        
        // Listen for timer changes
        this.timerRef.on('value', (snapshot) => {
            const timerData = snapshot.val();
            if (timerData && !this.isHost) {
                this.syncWithHost(timerData);
            }
        });
        
        // Listen for chat messages
        this.chatRef.child('messages').on('child_added', (snapshot) => {
            const messageData = snapshot.val();
            if (messageData && messageData.senderId !== this.myId) {
                this.addChatMessage(messageData.message, 'other', messageData.senderName);
                
                if (!this.isChatOpen) {
                    this.unreadMessages++;
                    this.updateChatNotification();
                }
            }
        });
    }
    
    startHeartbeat() {
        // Update heartbeat every 5 seconds
        this.heartbeatInterval = setInterval(async () => {
            if (this.participantsRef) {
                try {
                    await this.participantsRef.child(this.myId).update({
                        lastSeen: firebase.database.ServerValue.TIMESTAMP
                    });
                } catch (error) {
                    console.warn('Heartbeat failed:', error);
                }
            }
        }, 5000);
    }
    
    hasActiveHost() {
        for (const participant of this.participants.values()) {
            if (participant.isHost) {
                return true;
            }
        }
        return false;
    }
    
    async becomeHost() {
        this.isHost = true;
        
        try {
            // Update my participant status
            await this.participantsRef.child(this.myId).update({
                isHost: true
            });
            
            // Update room host
            await this.roomRef.update({
                host: this.myId
            });
            
            this.updateControlsVisibility();
            this.showToast('You are now the room host! 👑');
            
        } catch (error) {
            console.error('Error becoming host:', error);
        }
    }
    
    syncWithHost(timerData) {
        console.log('Syncing with host timer:', timerData);
        
        this.currentMode = timerData.mode;
        this.duration = timerData.duration;
        this.timeLeft = timerData.timeLeft;
        this.isRunning = timerData.isRunning;
        this.isPaused = timerData.isPaused;
        
        this.stopLocalTimer();
        
        if (timerData.isRunning && timerData.startTime) {
            const elapsed = (Date.now() - timerData.startTime) / 1000;
            this.timeLeft = Math.max(0, timerData.duration - elapsed);
            this.startTime = timerData.startTime;
            this.startLocalTimer();
        } else {
            this.startTime = timerData.startTime;
        }
        
        this.updateDisplay();
        this.updateModeDisplay();
        this.updateButtons();
        this.updateProgress();
        this.updateModeButtons();
    }
    
    async updateTimerInFirebase() {
        if (!this.isHost || !this.timerRef) return;
        
        try {
            await this.timerRef.update({
                mode: this.currentMode,
                duration: this.duration,
                timeLeft: this.timeLeft,
                isRunning: this.isRunning,
                isPaused: this.isPaused,
                startTime: this.startTime,
                lastUpdate: firebase.database.ServerValue.TIMESTAMP
            });
        } catch (error) {
            console.warn('Failed to update timer in Firebase:', error);
        }
    }
    
    generateRoomId() {
        return Math.random().toString(36).substring(2, 8).toLowerCase();
    }
    
    copyRoomUrl() {
        this.roomUrl.select();
        navigator.clipboard.writeText(this.roomUrl.value).then(() => {
            this.showToast('Room link copied! 📋');
        }).catch(() => {
            document.execCommand('copy');
            this.showToast('Room link copied! 📋');
        });
    }
    
    toggleFullscreen() {
        if (this.isFullscreen) {
            this.exitFullscreen();
        } else {
            this.enterFullscreen();
        }
    }
    
    enterFullscreen() {
        this.isFullscreen = true;
        document.body.classList.add('fullscreen-mode');
        
        if (this.fullscreenBtn) this.fullscreenBtn.style.display = 'none';
        if (this.fullscreenExitBtn) this.fullscreenExitBtn.style.display = 'flex';
        
        this.showToast('Focus Mode: Press ESC or click "Exit Focus" to return');
    }
    
    exitFullscreen() {
        this.isFullscreen = false;
        document.body.classList.remove('fullscreen-mode');
        
        if (this.fullscreenBtn) this.fullscreenBtn.style.display = 'flex';
        if (this.fullscreenExitBtn) this.fullscreenExitBtn.style.display = 'none';
    }
    
    toggleChat() {
        if (this.isChatOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }
    
    openChat() {
        this.isChatOpen = true;
        this.chatPanel.classList.add('open');
        this.unreadMessages = 0;
        this.updateChatNotification();
        this.chatInput.focus();
    }
    
    closeChat() {
        this.isChatOpen = false;
        this.chatPanel.classList.remove('open');
    }
    
    openCustomModal() {
        if (this.customModal) {
            this.customModal.style.display = 'flex';
            if (this.customMinutesInput) {
                this.customMinutesInput.focus();
            }
        }
    }
    
    closeCustomModal() {
        if (this.customModal) {
            this.customModal.style.display = 'none';
        }
    }
    
    setCustomTimer() {
        if (!this.customMinutesInput) return;
        
        const minutes = parseInt(this.customMinutesInput.value);
        if (isNaN(minutes) || minutes < 1 || minutes > 180) {
            this.showToast('Please enter a valid time between 1-180 minutes');
            return;
        }
        
        this.changeMode('custom', minutes * 60);
        this.closeCustomModal();
        this.showToast(`Custom timer set to ${minutes} minutes`);
    }
    
    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message || !this.roomId || !this.chatRef) return;
        
        try {
            // Add message to Firebase
            await this.chatRef.child('messages').push({
                message: message,
                senderName: this.userName,
                senderId: this.myId,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
            
            // Add to my local chat
            this.addChatMessage(message, 'own', this.userName);
            
            // Clear input
            this.chatInput.value = '';
            
        } catch (error) {
            console.error('Failed to send message:', error);
            this.showToast('Failed to send message');
        }
    }
    
    addChatMessage(message, type, sender = null) {
        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${type}`;
        
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        if (type === 'system') {
            messageEl.innerHTML = `
                <span class="message-text">${this.escapeHtml(message)}</span>
            `;
        } else {
            messageEl.innerHTML = `
                ${sender ? `<span class="message-sender">${this.escapeHtml(sender)}</span>` : ''}
                <span class="message-text">${this.escapeHtml(message)}</span>
                <span class="message-time">${timeStr}</span>
            `;
        }
        
        this.chatMessages.appendChild(messageEl);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    updateChatNotification() {
        const existingNotification = this.toggleChatBtn.querySelector('.chat-notification');
        
        if (this.unreadMessages > 0 && !this.isChatOpen) {
            if (!existingNotification) {
                const notification = document.createElement('span');
                notification.className = 'chat-notification';
                notification.textContent = this.unreadMessages;
                this.toggleChatBtn.appendChild(notification);
            } else {
                existingNotification.textContent = this.unreadMessages;
            }
        } else if (existingNotification) {
            existingNotification.remove();
        }
    }
    
    updateControlsVisibility() {
        const isDisabled = this.roomId && !this.isHost;
        this.startBtn.disabled = isDisabled;
        this.resetBtn.disabled = isDisabled;
        
        this.modeButtons.forEach(btn => {
            if (isDisabled) {
                btn.style.opacity = '0.5';
                btn.style.pointerEvents = 'none';
            } else {
                btn.style.opacity = '1';
                btn.style.pointerEvents = 'auto';
            }
        });
        
        if (this.roomId) {
            const statusText = this.isHost ? '👑 Host' : '👥 Participant';
            document.querySelector('.title').textContent = `StudySync - ${statusText}`;
            
            if (this.toggleChatBtn) {
                this.toggleChatBtn.disabled = false;
            }
        } else {
            if (this.toggleChatBtn) {
                this.toggleChatBtn.disabled = true;
            }
        }
    }
    
    toggleTimer() {
        if (this.roomId && !this.isHost) {
            this.showToast('Only the host can control the timer! 🔒');
            return;
        }
        
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }
    
    startTimer() {
        this.isRunning = true;
        this.isPaused = false;
        this.startTime = Date.now() - (this.duration - this.timeLeft) * 1000;
        
        this.startLocalTimer();
        this.updateButtons();
        this.updateTimerInFirebase();
    }
    
    pauseTimer() {
        this.isRunning = false;
        this.isPaused = true;
        
        this.stopLocalTimer();
        this.updateButtons();
        this.updateTimerInFirebase();
    }
    
    resetTimer() {
        if (this.roomId && !this.isHost) {
            this.showToast('Only the host can reset the timer! 🔒');
            return;
        }
        
        this.isRunning = false;
        this.isPaused = false;
        this.timeLeft = this.duration;
        this.startTime = null;
        
        this.stopLocalTimer();
        this.updateDisplay();
        this.updateButtons();
        this.updateProgress();
        this.updateTimerInFirebase();
    }
    
    changeMode(mode, duration) {
        if (this.roomId && !this.isHost) {
            this.showToast('Only the host can change the timer mode! 🔒');
            return;
        }
        
        this.currentMode = mode;
        this.duration = duration;
        this.resetTimer();
        
        this.updateModeButtons();
        this.updateModeDisplay();
        this.updateTimerInFirebase();
    }
    
    startLocalTimer() {
        this.stopLocalTimer();
        this.interval = setInterval(() => {
            if (this.isRunning) {
                const elapsed = (Date.now() - this.startTime) / 1000;
                this.timeLeft = Math.max(0, this.duration - elapsed);
                
                this.updateDisplay();
                this.updateProgress();
                
                if (this.timeLeft <= 0) {
                    this.onTimerComplete();
                }
            }
        }, 100);
    }
    
    stopLocalTimer() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
    
    onTimerComplete() {
        this.isRunning = false;
        this.timeLeft = 0;
        this.stopLocalTimer();
        this.updateButtons();
        this.updateTimerInFirebase();
        
        this.playNotificationSound();
        
        const modeText = this.currentMode === 'focus' ? 'Focus session' : 'Break';
        this.showToast(`${modeText} complete! Great work! 🎉`);
        
        if (this.roomId) {
            const completionMsg = `Timer completed: ${modeText} finished! 🎯`;
            this.addChatMessage(completionMsg, 'system');
        }
        
        setTimeout(() => {
            if (this.currentMode === 'focus') {
                this.showToast('Ready for a break? 🧘‍♀️');
            } else {
                this.showToast('Ready to focus again? 💪');
            }
        }, 2000);
    }
    
    playNotificationSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.warn('Audio notification not supported');
        }
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = Math.floor(this.timeLeft % 60);
        this.timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    updateProgress() {
        const progress = (this.duration - this.timeLeft) / this.duration;
        const circumference = 2 * Math.PI * 54;
        const offset = circumference * (1 - progress);
        this.progressCircle.style.strokeDashoffset = offset;
    }
    
    updateButtons() {
        if (this.isRunning) {
            this.startBtn.textContent = 'Pause';
        } else if (this.isPaused) {
            this.startBtn.textContent = 'Resume';
        } else {
            this.startBtn.textContent = 'Start';
        }
    }
    
    updateModeDisplay() {
        const modeNames = {
            'focus': 'Focus Session',
            'short-break': 'Short Break',
            'long-break': 'Long Break',
            'extended': 'Extended Session',
            'custom': 'Custom Timer'
        };
        this.modeDisplay.textContent = modeNames[this.currentMode] || 'Focus Session';
    }
    
    updateModeButtons() {
        this.modeButtons.forEach(btn => {
            if (btn.dataset.mode) {
                btn.classList.toggle('active', btn.dataset.mode === this.currentMode);
            } else if (btn.id === 'custom-mode-btn') {
                btn.classList.toggle('active', this.currentMode === 'custom');
            }
        });
    }
    
    updateParticipantCount() {
        const count = this.participants.size;
        
        if (count === 1) {
            this.participantCount.textContent = '1 student';
        } else {
            this.participantCount.textContent = `${count} students`;
        }
        
        if (this.roomId && this.isHost && count > 1) {
            this.participantCount.textContent += ' (you are host)';
        }
        
        const dot = document.querySelector('.dot');
        if (dot) {
            if (count > 1) {
                dot.style.background = '#10b981';
            } else {
                dot.style.background = '#7dd3fc';
            }
        }
    }
    
    showToast(message) {
        this.toast.textContent = message;
        this.toast.classList.add('show');
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }
    
    cleanup() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        
        this.stopLocalTimer();
        
        if (this.participantsRef) {
            this.participantsRef.child(this.myId).remove();
        }
        
        if (this.roomRef) {
            this.roomRef.off();
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.studyTimer = new StudyTimer();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.studyTimer) {
        window.studyTimer.cleanup();
    }
});