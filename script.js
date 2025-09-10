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
        this.channel = null;
        this.participants = new Map(); // Store participant data with timestamps
        this.myId = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        this.heartbeatInterval = null;
        this.cleanupInterval = null;
        this.isFullscreen = false;
        
        this.initializeElements();
        this.attachEventListeners();
        this.checkForRoom();
        this.setupBroadcastChannel();
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
        this.chatPanel = document.getElementById('chat-panel');
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.sendChatBtn = document.getElementById('send-chat-btn');
        this.toggleChatBtn = document.getElementById('toggle-chat-btn');
        this.userName = 'Student ' + Math.floor(Math.random() * 1000);
        this.isChatOpen = false;
        this.unreadMessages = 0;
    }
    
    attachEventListeners() {
        this.startBtn.addEventListener('click', () => this.toggleTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());
        this.createRoomBtn.addEventListener('click', () => this.createRoom());
        this.copyBtn.addEventListener('click', () => this.copyRoomUrl());
        this.joinRoomBtn.addEventListener('click', () => this.joinRoom());
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        
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
        const urlParams = new URLSearchParams(window.location.search);
        const roomId = urlParams.get('room');
        
        if (roomId) {
            this.roomId = roomId;
            this.roomUrl.value = window.location.href;
            this.copyBtn.disabled = false;
            this.setupBroadcastChannel();
            this.joinExistingRoom();
        }
    }
    
    setupBroadcastChannel() {
        if (!this.roomId) return;
        
        try {
            this.channel = new BroadcastChannel(`study-timer-${this.roomId}`);
            this.channel.addEventListener('message', (event) => {
                this.handleBroadcastMessage(event.data);
            });
            
            // Add myself to participants
            this.participants.set(this.myId, {
                id: this.myId,
                joinTime: Date.now(),
                lastSeen: Date.now(),
                isHost: this.isHost
            });
            
            // Announce presence
            this.broadcastMessage({
                type: 'join',
                participantId: this.myId,
                isHost: this.isHost,
                timestamp: Date.now()
            });
            
            // Start heartbeat to maintain presence
            this.startHeartbeat();
            
            // Start cleanup for stale participants
            this.startParticipantCleanup();
            
            this.updateParticipantCount();
        } catch (error) {
            console.warn('BroadcastChannel not supported');
            // Fallback for single user
            this.updateParticipantCount();
        }
    }
    
    startHeartbeat() {
        // Send heartbeat every 2 seconds
        this.heartbeatInterval = setInterval(() => {
            if (this.channel) {
                this.broadcastMessage({
                    type: 'heartbeat',
                    participantId: this.myId,
                    timestamp: Date.now()
                });
            }
        }, 2000);
    }
    
    startParticipantCleanup() {
        // Clean up stale participants every 5 seconds
        this.cleanupInterval = setInterval(() => {
            const now = Date.now();
            const timeout = 8000; // 8 seconds timeout
            
            let removedAny = false;
            for (const [id, participant] of this.participants.entries()) {
                if (id !== this.myId && (now - participant.lastSeen) > timeout) {
                    this.participants.delete(id);
                    removedAny = true;
                }
            }
            
            if (removedAny) {
                this.updateParticipantCount();
                
                // If host left and I'm the oldest remaining participant, become host
                if (!this.isHost && !this.hasActiveHost()) {
                    this.becomeHost();
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
    
    becomeHost() {
        this.isHost = true;
        this.participants.get(this.myId).isHost = true;
        this.updateControlsVisibility();
        this.showToast('You are now the room host!');
        
        // Broadcast new host status
        this.broadcastMessage({
            type: 'host-change',
            newHostId: this.myId,
            timestamp: Date.now()
        });
    }
    
    broadcastMessage(data) {
        if (this.channel) {
            try {
                this.channel.postMessage(data);
            } catch (error) {
                console.warn('Failed to broadcast message:', error);
            }
        }
    }
    
    handleBroadcastMessage(data) {
        // Ignore messages from myself
        if (data.participantId === this.myId) return;
        
        switch (data.type) {
            case 'join':
                this.participants.set(data.participantId, {
                    id: data.participantId,
                    joinTime: data.timestamp,
                    lastSeen: data.timestamp,
                    isHost: data.isHost || false
                });
                this.updateParticipantCount();
                
                // If I'm the host, send current state to new participant
                if (this.isHost) {
                    setTimeout(() => {
                        this.broadcastTimerState();
                    }, 500);
                }
                break;
                
            case 'heartbeat':
                if (this.participants.has(data.participantId)) {
                    this.participants.get(data.participantId).lastSeen = data.timestamp;
                }
                break;
                
            case 'timer-state':
                // Only accept timer state from host
                const sender = this.participants.get(data.participantId);
                if (sender && sender.isHost && !this.isHost) {
                    this.syncWithHost(data);
                }
                break;
                
            case 'timer-action':
                // Only accept timer actions from host
                const actionSender = this.participants.get(data.participantId);
                if (actionSender && actionSender.isHost && !this.isHost) {
                    this.handleRemoteAction(data.action, data.data);
                }
                break;
                
            case 'host-change':
                if (data.newHostId !== this.myId) {
                    // Update the new host in participants
                    for (const participant of this.participants.values()) {
                        participant.isHost = (participant.id === data.newHostId);
                    }
                }
                break;
                
            case 'chat-message':
                if (this.chatMessages) {
                    this.addChatMessage(data.message, 'other', data.userName);
                    if (!this.isChatOpen) {
                        this.unreadMessages++;
                        this.updateChatNotification();
                    }
                }
                break;
        }
    }
    
    syncWithHost(data) {
        this.currentMode = data.mode;
        this.duration = data.duration;
        this.timeLeft = data.timeLeft;
        this.isRunning = data.isRunning;
        this.isPaused = data.isPaused;
        
        if (data.isRunning && data.startTime) {
            const elapsed = (Date.now() - data.startTime) / 1000;
            this.timeLeft = Math.max(0, data.duration - elapsed);
            this.startLocalTimer();
        } else {
            this.stopLocalTimer();
        }
        
        this.updateDisplay();
        this.updateModeDisplay();
        this.updateButtons();
    }
    
    handleRemoteAction(action, data) {
        switch (action) {
            case 'start':
                this.startTimer(false);
                break;
            case 'pause':
                this.pauseTimer(false);
                break;
            case 'reset':
                this.resetTimer(false);
                break;
            case 'mode-change':
                this.changeMode(data.mode, data.duration, false);
                break;
        }
    }
    
    createRoom() {
        this.roomId = this.generateRoomId();
        this.isHost = true;
        
        const url = new URL(window.location);
        url.searchParams.set('room', this.roomId);
        window.history.pushState({}, '', url);
        
        this.roomUrl.value = url.toString();
        this.copyBtn.disabled = false;
        
        this.setupBroadcastChannel();
        this.updateControlsVisibility();
        this.showToast('Room created! You are the host - you control the timer.');
    }
    
    updateControlsVisibility() {
        // Only host can control timer
        const isDisabled = this.roomId && !this.isHost;
        this.startBtn.disabled = isDisabled;
        this.resetBtn.disabled = isDisabled;
        
        // Disable mode buttons for non-hosts
        this.modeButtons.forEach(btn => {
            if (isDisabled) {
                btn.style.opacity = '0.5';
                btn.style.pointerEvents = 'none';
            } else {
                btn.style.opacity = '1';
                btn.style.pointerEvents = 'auto';
            }
        });
        
        // Update UI to show host status
        if (this.roomId) {
            const statusText = this.isHost ? '👑 Host' : '👥 Participant';
            document.querySelector('.title').textContent = `StudySync - ${statusText}`;
        }
    }
    
    joinRoom() {
        const roomCode = prompt('Enter room code (the letters/numbers after ?room= in the link):');
        if (roomCode) {
            this.roomId = roomCode;
            this.isHost = false;
            
            const url = new URL(window.location);
            url.searchParams.set('room', roomCode);
            window.history.pushState({}, '', url);
            
            this.roomUrl.value = url.toString();
            this.copyBtn.disabled = false;
            
            this.setupBroadcastChannel();
            this.joinExistingRoom();
        }
    }
    
    joinExistingRoom() {
        this.isHost = false;
        this.updateControlsVisibility();
        this.showToast('Joined study room! The host controls the timer.');
    }
    
    generateRoomId() {
        return Math.random().toString(36).substring(2, 8).toLowerCase();
    }
    
    copyRoomUrl() {
        this.roomUrl.select();
        navigator.clipboard.writeText(this.roomUrl.value).then(() => {
            this.showToast('Link copied to clipboard!');
        }).catch(() => {
            // Fallback for older browsers
            document.execCommand('copy');
            this.showToast('Link copied to clipboard!');
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
        
        // Hide everything except timer
        document.body.classList.add('fullscreen-mode');
        
        // Update fullscreen button
        this.fullscreenBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M5.5 0a.5.5 0 0 1 .5.5v4A1.5 1.5 0 0 1 4.5 6h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5zm5 0a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 10 4.5v-4a.5.5 0 0 1 .5-.5zM0 10.5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 6 11.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zm10 1a1.5 1.5 0 0 1 1.5-1.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4z"/>
            </svg>
            Exit Focus
        `;
    }
    
    // Chat functionality
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
    
    sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message || !this.roomId) return;
        
        // Add my message to chat
        this.addChatMessage(message, 'own', this.userName);
        
        // Broadcast message to others
        this.broadcastMessage({
            type: 'chat-message',
            participantId: this.myId,
            userName: this.userName,
            message: message,
            timestamp: Date.now()
        });
        
        // Clear input
        this.chatInput.value = '';
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
    
    exitFullscreen() {
        this.isFullscreen = false;
        
        // Show everything back
        document.body.classList.remove('fullscreen-mode');
        
        // Update fullscreen button
        this.fullscreenBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1h-4zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zM.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5zm15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5z"/>
            </svg>
            Focus Mode
        `;
    }
    
    toggleTimer() {
        // Only host can control timer
        if (this.roomId && !this.isHost) {
            this.showToast('Only the host can control the timer!');
            return;
        }
        
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }
    
    startTimer(broadcast = true) {
        this.isRunning = true;
        this.isPaused = false;
        this.startTime = Date.now() - (this.duration - this.timeLeft) * 1000;
        
        this.startLocalTimer();
        this.updateButtons();
        
        if (broadcast) {
            this.broadcastTimerState();
            this.broadcastMessage({
                type: 'timer-action',
                participantId: this.myId,
                action: 'start'
            });
        }
    }
    
    pauseTimer(broadcast = true) {
        this.isRunning = false;
        this.isPaused = true;
        
        this.stopLocalTimer();
        this.updateButtons();
        
        if (broadcast) {
            this.broadcastTimerState();
            this.broadcastMessage({
                type: 'timer-action',
                participantId: this.myId,
                action: 'pause'
            });
        }
    }
    
    resetTimer(broadcast = true) {
        // Only host can reset timer
        if (this.roomId && !this.isHost && broadcast) {
            this.showToast('Only the host can reset the timer!');
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
        
        if (broadcast) {
            this.broadcastTimerState();
            this.broadcastMessage({
                type: 'timer-action',
                participantId: this.myId,
                action: 'reset'
            });
        }
    }
    
    changeMode(mode, duration, broadcast = true) {
        // Only host can change mode
        if (this.roomId && !this.isHost && broadcast) {
            this.showToast('Only the host can change the timer mode!');
            return;
        }
        
        this.currentMode = mode;
        this.duration = duration;
        this.resetTimer(false);
        
        this.updateModeButtons();
        this.updateModeDisplay();
        
        if (broadcast) {
            this.broadcastTimerState();
            this.broadcastMessage({
                type: 'timer-action',
                participantId: this.myId,
                action: 'mode-change',
                data: { mode, duration }
            });
        }
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
        
        // Play notification sound
        this.playNotificationSound();
        
        // Show completion message
        const modeText = this.currentMode === 'focus' ? 'Focus session' : 'Break';
        this.showToast(`${modeText} complete! Great work! 🎉`);
        
        // Auto-suggest next mode
        setTimeout(() => {
            if (this.currentMode === 'focus') {
                this.showToast('Ready for a break?');
            } else {
                this.showToast('Ready to focus again?');
            }
        }, 2000);
        
        if (this.isHost || !this.roomId) {
            this.broadcastTimerState();
        }
    }
    
    playNotificationSound() {
        // Create a simple beep sound using Web Audio API
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
    
    broadcastTimerState() {
        if (!this.roomId || !this.isHost) return;
        
        this.broadcastMessage({
            type: 'timer-state',
            participantId: this.myId,
            mode: this.currentMode,
            duration: this.duration,
            timeLeft: this.timeLeft,
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            startTime: this.startTime
        });
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
            this.startBtn.classList.remove('primary');
            this.startBtn.classList.add('primary');
        } else if (this.isPaused) {
            this.startBtn.textContent = 'Resume';
            this.startBtn.classList.add('primary');
        } else {
            this.startBtn.textContent = 'Start';
            this.startBtn.classList.add('primary');
        }
    }
    
    updateModeDisplay() {
        const modeNames = {
            'focus': 'Focus Session',
            'short-break': 'Short Break',
            'long-break': 'Long Break'
        };
        this.modeDisplay.textContent = modeNames[this.currentMode] || 'Focus Session';
    }
    
    updateModeButtons() {
        this.modeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === this.currentMode);
        });
    }
    
    updateParticipantCount() {
        const count = this.participants.size;
        if (count === 1) {
            this.participantCount.textContent = '1 student';
        } else {
            this.participantCount.textContent = `${count} students`;
        }
        
        // Show host indicator
        if (this.roomId && this.isHost && count > 1) {
            this.participantCount.textContent += ' (you are host)';
        }
    }
    
    showToast(message) {
        this.toast.textContent = message;
        this.toast.classList.add('show');
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize the timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.studyTimer = new StudyTimer();
});

// Cleanup when page is closed
window.addEventListener('beforeunload', () => {
    if (window.studyTimer && window.studyTimer.channel) {
        window.studyTimer.broadcastMessage({
            type: 'leave',
            participantId: window.studyTimer.myId,
            timestamp: Date.now()
        });
    }
});