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
        this.fullscreenBtn = document.getElementById('fullscreen-btn');
        this.fullscreenExitBtn = document.getElementById('fullscreen-exit-btn');
        this.container = document.querySelector('.container');
        this.card = document.querySelector('.card');
        
        // Initially hide the exit button
        if (this.fullscreenExitBtn) {
            this.fullscreenExitBtn.style.display = 'none';
        }
        
        // Chat elements
        this.chatPanel = document.getElementById('chat-panel');
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.sendChatBtn = document.getElementById('send-chat-btn');
        this.toggleChatBtn = document.getElementById('toggle-chat-btn');
        this.closeChatBtn = document.getElementById('close-chat-btn');
        this.userName = 'Student ' + Math.floor(Math.random() * 1000);
        this.isChatOpen = false;
        this.unreadMessages = 0;
        
        // Custom timer modal elements
        this.customModal = document.getElementById('custom-modal');
        this.customMinutesInput = document.getElementById('custom-minutes');
        this.closeModalBtn = document.getElementById('close-modal-btn');
        this.cancelCustomBtn = document.getElementById('cancel-custom-btn');
        this.setCustomBtn = document.getElementById('set-custom-btn');
        this.customModeBtn = document.getElementById('custom-mode-btn');
    }
    
    attachEventListeners() {
        this.startBtn.addEventListener('click', () => this.toggleTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());
        this.createRoomBtn.addEventListener('click', () => this.createRoom());
        this.copyBtn.addEventListener('click', () => this.copyRoomUrl());
        this.joinRoomBtn.addEventListener('click', () => this.joinRoom());
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        
        // Fullscreen exit button event listener
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
        // Handle both http:// and file:// URLs
        let roomId = null;
        
        if (window.location.protocol === 'file:') {
            // For file:// URLs, parse the search string manually
            const search = window.location.search;
            if (search) {
                const params = new URLSearchParams(search);
                roomId = params.get('room');
            }
        } else {
            // For http:// URLs, use standard URLSearchParams
            const urlParams = new URLSearchParams(window.location.search);
            roomId = urlParams.get('room');
        }
        
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
            this.showToast('ERROR: BroadcastChannel not supported. Open with Live Server or http:// URL for collaboration.');
            // Fallback for single user
            this.updateParticipantCount();
        }
    }
    
    startHeartbeat() {
        // Send heartbeat every 2 seconds
        this.heartbeatInterval = setInterval(() => {
            if (this.channel && this.roomId) {
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
            const timeout = 15000; // 15 seconds timeout (increased from 8)
            
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
                console.log('Broadcasting message:', data.type, 'to room:', this.roomId);
                this.channel.postMessage(data);
            } catch (error) {
                console.warn('Failed to broadcast message:', error);
            }
        } else {
            console.warn('No broadcast channel available');
        }
    }
    
    handleBroadcastMessage(data) {
        // Ignore messages from myself
        if (data.participantId === this.myId) return;
        // Always log received messages
        console.log('Received message:', data.type, 'from:', data.participantId, data);
        switch (data.type) {
            case 'timer-state':
                // Always sync timer for non-hosts
                if (!this.isHost) {
                    this.syncWithHost(data);
                }
                // If I'm host and receive timer-state from a participant, rebroadcast my state
                if (this.isHost) {
                    this.broadcastTimerState();
                }
                break;
            case 'join':
                this.participants.set(data.participantId, {
                    id: data.participantId,
                    joinTime: data.timestamp,
                    lastSeen: data.timestamp,
                    isHost: data.isHost || false
                });
                this.updateParticipantCount();
                // Host broadcasts full state after join
                if (this.isHost) {
                    this.broadcastTimerState();
                    this.broadcastMessage({
                        type: 'participant-list',
                        participants: Array.from(this.participants.values()),
                        timestamp: Date.now()
                    });
                    this.broadcastMessage({
                        type: 'chat-history',
                        history: Array.from(this.chatMessages.children).map(el => el.innerHTML),
                        timestamp: Date.now()
                    });
                }
                break;
            case 'participant-list':
                if (Array.isArray(data.participants)) {
                    this.participants.clear();
                    for (const p of data.participants) {
                        this.participants.set(p.id, p);
                    }
                    this.updateParticipantCount();
                }
                break;
            case 'chat-message':
                this.addChatMessage(data.message, 'other', data.userName);
                if (!this.isChatOpen) {
                    this.unreadMessages++;
                    this.updateChatNotification();
                }
                // Host rebroadcasts chat history
                if (this.isHost) {
                    this.broadcastMessage({
                        type: 'chat-history',
                        history: Array.from(this.chatMessages.children).map(el => el.innerHTML),
                        timestamp: Date.now()
                    });
                }
                break;
            case 'chat-history':
                if (!this.isHost && Array.isArray(data.history)) {
                    this.chatMessages.innerHTML = '';
                    for (const html of data.history) {
                        const div = document.createElement('div');
                        div.innerHTML = html;
                        this.chatMessages.appendChild(div);
                    }
                }
                break;
        }
    }
    
    syncWithHost(data) {
        // Only update if the incoming timer is different from mine
        if (this.timeLeft !== data.timeLeft || this.currentMode !== data.mode || this.isRunning !== data.isRunning) {
            this.currentMode = data.mode;
            this.duration = data.duration;
            this.timeLeft = data.timeLeft;
            this.isRunning = data.isRunning;
            this.isPaused = data.isPaused;
            this.stopLocalTimer();
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
            this.updateProgress();
        }
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
        
        // Broadcast initial timer state
        setTimeout(() => {
            this.broadcastTimerState();
        }, 100);
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
            
            // Enable chat button when in a room
            if (this.toggleChatBtn) {
                this.toggleChatBtn.disabled = false;
            }
        } else {
            // Disable chat button when not in a room
            if (this.toggleChatBtn) {
                this.toggleChatBtn.disabled = true;
            }
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
            
            // Request current state immediately
            setTimeout(() => {
                this.broadcastMessage({
                    type: 'request-state',
                    participantId: this.myId,
                    timestamp: Date.now()
                });
            }, 100);
        }
    }
    
    joinExistingRoom() {
        this.isHost = false;
        this.updateControlsVisibility();
        this.showToast('Joined study room! The host controls the timer.');
        // Request current timer state from host multiple times to ensure sync
        const requestState = () => {
            this.broadcastTimerState(); // Also broadcast my state for redundancy
            this.broadcastMessage({
                type: 'request-state',
                participantId: this.myId,
                timestamp: Date.now()
            });
        };
        // Request immediately
        requestState();
        // Request again after 500ms, 1 second, and 2 seconds
        setTimeout(requestState, 500);
        setTimeout(requestState, 1000);
        setTimeout(requestState, 2000);
        // Also request periodically every 10 seconds as fallback
        setInterval(() => {
            if (!this.isHost && this.roomId) {
                requestState();
            }
        }, 10000);
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
        
        // Hide the fullscreen button and show exit button
        if (this.fullscreenBtn) this.fullscreenBtn.style.display = 'none';
        if (this.fullscreenExitBtn) this.fullscreenExitBtn.style.display = 'flex';
        
        this.showToast('Focus Mode: Press ESC or click "Exit Focus" to return');
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
        // Also broadcast chat history if host
        if (this.isHost) {
            this.broadcastMessage({
                type: 'chat-history',
                history: Array.from(this.chatMessages.children).map(el => el.innerHTML),
                timestamp: Date.now()
            });
        }
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
        
        // Show the fullscreen button and hide exit button
        if (this.fullscreenBtn) this.fullscreenBtn.style.display = 'flex';
        if (this.fullscreenExitBtn) this.fullscreenExitBtn.style.display = 'none';
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
        let broadcastCounter = 0;
        this.interval = setInterval(() => {
            if (this.isRunning) {
                const elapsed = (Date.now() - this.startTime) / 1000;
                this.timeLeft = Math.max(0, this.duration - elapsed);
                
                this.updateDisplay();
                this.updateProgress();
                
                // Broadcast timer state every 2 seconds if we're the host
                broadcastCounter++;
                if (this.isHost && this.roomId && broadcastCounter >= 20) { // 20 * 100ms = 2 seconds
                    this.broadcastTimerState();
                    broadcastCounter = 0;
                }
                
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
        if (!this.roomId) return;
        // Host always broadcasts, but participants also broadcast their state on join for redundancy
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
        console.log('Updating participant count:', count, 'participants:', Array.from(this.participants.keys()));
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
            userName: window.studyTimer.userName,
            timestamp: Date.now()
        });
    }
});