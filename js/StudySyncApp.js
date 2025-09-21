/**
 * StudySyncApp - Main application orchestrator
 */

class StudySyncApp {
    constructor() {
        // Initialize modules
        this.timer = new TimerModule();
        this.firebase = new FirebaseModule();
        this.stats = new StatsModule();
        this.settings = new SettingsModule();
        this.ui = new UIModule();
        this.audio = new AudioModule();
        
        // App state
        this.roomId = null;
        this.userId = this._generateUserId();
        this.isHost = false;
        this.participants = new Map();
        this.isInitialized = false;
        
        // Heartbeat for presence
        this.heartbeatInterval = null;
        this.heartbeatDelay = 5000; // 5 seconds
        
        // Bind methods
        this._handleVisibilityChange = this._handleVisibilityChange.bind(this);
        this._handleBeforeUnload = this._handleBeforeUnload.bind(this);
    }

    /**
     * Initialize the application
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            console.log('🚀 Initializing StudySync Pro...');
            
            // Initialize Firebase first
            const firebaseSuccess = await this.firebase.initialize();
            if (!firebaseSuccess) {
                console.warn('Firebase initialization failed, continuing in offline mode');
            }
            
            // Initialize audio on user interaction
            document.addEventListener('click', async () => {
                if (!this.audio.audioContext) {
                    await this.audio.initialize();
                }
            }, { once: true });
            
            // Setup all event listeners
            this._setupEventListeners();
            
            // Initialize UI with current data
            this._initializeUI();
            
            // Check for room in URL
            this._checkForRoomInUrl();
            
            // Setup app lifecycle handlers
            this._setupLifecycleHandlers();
            
            // Request notification permission
            await this._requestNotificationPermission();
            
            this.isInitialized = true;
            console.log('✅ StudySync Pro initialized successfully!');
            
            this.ui.showToast('StudySync Pro ready! 🎯', 'success');
            
        } catch (error) {
            console.error('Failed to initialize StudySync:', error);
            this.ui.showToast('Initialization failed. Some features may not work.', 'error');
        }
    }

    /**
     * Setup all event listeners between modules
     * @private
     */
    _setupEventListeners() {
        // Timer events
        this.timer.on('tick', (data) => {
            this.ui.updateTimer(data.timeLeft, data.duration);
            
            // Update Firebase if host
            if (this.isHost && this.firebase.isInRoom()) {
                this.firebase.updateTimer(this.timer.getState());
            }
        });

        this.timer.on('start', () => {
            this.ui.updateControls(true, false);
            this.ui.showToast('Timer started! Stay focused 🎯');
            this.stats.startSession(this.timer.current);
        });

        this.timer.on('pause', () => {
            this.ui.updateControls(false, true);
            this.ui.showToast('Timer paused ⏸️');
        });

        this.timer.on('resume', () => {
            this.ui.updateControls(true, false);
            this.ui.showToast('Timer resumed ▶️');
        });

        this.timer.on('stop', () => {
            this.ui.updateControls(false, true);
        });

        this.timer.on('reset', () => {
            this.ui.updateControls(false, true);
        });

        this.timer.on('complete', (data) => {
            this._handleTimerComplete(data.mode);
        });

        this.timer.on('modeChange', (data) => {
            this.ui.updateMode(data.mode);
            this.ui.updateTimer(data.duration, data.duration);
            this.ui.showToast(`Switched to ${data.mode} mode`);
        });

        // UI events
        this.ui.on('toggleTimer', () => {
            if (this.timer.isRunning) {
                this.timer.pause();
            } else {
                this.timer.start();
            }
        });

        this.ui.on('startTimer', () => {
            this.timer.start();
        });

        this.ui.on('pauseTimer', () => {
            this.timer.pause();
        });

        this.ui.on('resetTimer', () => {
            this.timer.reset();
        });

        this.ui.on('skipTimer', () => {
            this.timer.skip();
        });

        this.ui.on('modeChange', (data) => {
            if (this.roomId && !this.isHost) {
                this.ui.showToast('Only the host can change timer modes! 🔒');
                return;
            }
            this.timer.setMode(data.mode, data.duration);
        });

        // Room management
        this.ui.on('createRoom', () => this._createRoom());
        this.ui.on('joinRoom', () => this._joinRoom());
        this.ui.on('copyRoom', () => this._copyRoomUrl());

        // Chat
        this.ui.on('sendMessage', (data) => this._sendMessage(data.message));

        // Settings
        this.ui.on('toggleSetting', (data) => {
            const currentValue = this.settings.get(data.setting);
            this.settings.set(data.setting, !currentValue);
        });
        
        this.ui.on('settingChange', (data) => {
            this.settings.set(data.key, data.value);
        });

        // Firebase events
        this.firebase.on('roomCreated', (data) => {
            this.roomId = data.roomId;
            this.isHost = true;
            this.ui.updateRoom(this.roomId, true);
            this.ui.showToast('Room created! Share the link to study together 🎯');
            this._startHeartbeat();
        });

        this.firebase.on('roomJoined', (data) => {
            this.roomId = data.roomId;
            this.ui.updateRoom(this.roomId, this.isHost);
            this.ui.showToast('Joined study room! 👥');
            this._startHeartbeat();
        });

        this.firebase.on('timerSync', (timerData) => {
            if (!this.isHost) {
                this.timer.setState(timerData);
                this.ui.updateTimer(this.timer.timeLeft, this.timer.duration);
                this.ui.updateMode(this.timer.currentMode);
                this.ui.updateControls(this.timer.isRunning, this.timer.isPaused);
            }
        });

        this.firebase.on('participantsUpdate', (participants) => {
            this._updateParticipants(participants);
        });

        this.firebase.on('messageReceived', (messageData) => {
            if (messageData.senderId !== this.userId) {
                this.ui.addChatMessage(messageData.message, false, messageData.senderName);
            }
        });

        this.firebase.on('connectionChange', (data) => {
            if (data.connected) {
                this.ui.showToast('Connected to server 🌐');
            } else {
                this.ui.showToast('Connection lost. Continuing offline 📱', 'warning');
            }
        });

        this.firebase.on('error', (error) => {
            console.error('Firebase error:', error);
            this.ui.showToast('Connection error. Please try again.', 'error');
        });

        // Settings events
        this.settings.on('changed', (data) => {
            this.ui.updateSettings(this.settings.getAll());
            this._applySettingChange(data.key, data.value);
        });

        // Stats events
        this.stats.on('updated', (stats) => {
            this.ui.updateStats(stats);
        });

        // Audio events
        this.audio.on('initError', () => {
            this.ui.showToast('Audio initialization failed. Notifications disabled.', 'warning');
        });
    }

    /**
     * Initialize UI with current data
     * @private
     */
    _initializeUI() {
        this.ui.updateSettings(this.settings.getAll());
        this.ui.updateStats(this.stats.getStats());
        this.ui.updateTimer(this.timer.timeLeft, this.timer.duration);
        this.ui.updateMode(this.timer.currentMode);
        this.ui.updateControls(this.timer.isRunning, this.timer.isPaused);
        this.ui.updateParticipants(1, false);
    }

    /**
     * Handle timer completion
     * @param {string} mode - Completed timer mode
     * @private
     */
    async _handleTimerComplete(mode) {
        this.ui.updateControls(false, false);
        
        // Store the current mode before switching
        this.timer.previousMode = mode;
        
        // Play completion sound
        if (mode === 'focus' || mode === 'long-focus' || mode === 'custom') {
            await this.audio.playSuccess();
            this.ui.showToast('Focus session complete! Great work! 🎉', 'success');
            this.stats.endSession(mode, true);
            
            // Sync with auth module if signed in
            if (this.auth && this.auth.isAuthenticated) {
                await this.auth.addSession({
                    mode,
                    duration: this.timer.duration,
                    completed: true,
                    date: new Date().toDateString(),
                    timestamp: Date.now()
                });
            }
            
            // Auto-start break if enabled
            if (this.settings.get('autoBreak')) {
                setTimeout(() => {
                    this.timer.setMode('short-break', 300);
                    this.timer.start();
                }, 2000);
            }
        } else if (mode.includes('break')) {
            await this.audio.playCompletion();
            this.ui.showToast('Break time over! Ready to focus again? 💪', 'info');
            this.stats.endSession(mode, true);
            
            // Sync break session with auth module if signed in
            if (this.auth && this.auth.isAuthenticated) {
                await this.auth.addSession({
                    mode,
                    duration: this.timer.duration,
                    completed: true,
                    date: new Date().toDateString(),
                    timestamp: Date.now()
                });
            }
            
            // Auto-start the previous focus mode if autoFocus is enabled
            if (this.settings.get('autoFocus')) {
                setTimeout(() => {
                    // Get the duration based on the previous mode
                    let duration = 1500; // Default 25 minutes
                    let prevMode = this.timer.previousMode;
                    
                    if (prevMode === 'focus') {
                        duration = 1500; // 25 minutes
                    } else if (prevMode === 'long-focus') {
                        duration = 3300; // 55 minutes
                    } else if (prevMode === 'custom') {
                        duration = this.settings.get('customDuration') * 60;
                    }
                    
                    this.timer.setMode(prevMode, duration);
                    this.timer.start();
                }, 2000);
            }
        }

        // Show browser notification
        if (this.settings.get('notifications')) {
            this._showNotification(mode);
        }

        // Add system message in room
        if (this.roomId) {
            const message = mode.includes('focus') ? 
                'Focus session completed! 🎯' : 
                'Break time finished! 💪';
            this.ui.addChatMessage(message, false, 'System');
        }
    }

    /**
     * Create a new room
     * @private
     */
    async _createRoom() {
        if (!this.firebase.isInitialized) {
            this.ui.showToast('Please wait for connection...', 'warning');
            return;
        }
        
        const roomId = this._generateRoomId();
        const success = await this.firebase.createRoom(roomId, this.userId, {
            timer: this.timer.getState(),
            participants: {
                [this.userId]: {
                    name: this.settings.get('userName'),
                    isHost: true,
                    joinedAt: Date.now(),
                    lastSeen: Date.now()
                }
            },
            chat: { messages: [] }
        });

        if (success) {
            // Update URL
            const url = new URL(window.location);
            url.searchParams.set('room', roomId);
            window.history.pushState({}, '', url);
        }
    }

    /**
     * Join an existing room
     * @private
     */
    async _joinRoom() {
        if (!this.firebase.isInitialized) {
            this.ui.showToast('Please wait for connection...', 'warning');
            return;
        }
        
        const roomCode = prompt('Enter room code:');
        if (!roomCode?.trim()) return;

        const roomId = roomCode.trim().toLowerCase();
        const success = await this.firebase.joinRoom(roomId, this.userId, {
            name: this.settings.get('userName'),
            isHost: false
        });

        if (success) {
            // Update URL
            const url = new URL(window.location);
            url.searchParams.set('room', roomId);
            window.history.pushState({}, '', url);
        }
    }

    /**
     * Copy room URL to clipboard
     * @private
     */
    _copyRoomUrl() {
        if (!this.roomId) return;
        
        const url = new URL(window.location);
        url.searchParams.set('room', this.roomId);
        
        navigator.clipboard.writeText(url.toString()).then(() => {
            this.ui.showToast('Room link copied! 📋', 'success');
        }).catch(() => {
            this.ui.showToast('Failed to copy link', 'error');
        });
    }

    /**
     * Send chat message
     * @param {string} message - Message to send
     * @private
     */
    async _sendMessage(message) {
        if (!this.roomId || !message.trim()) return;
        
        await this.firebase.sendMessage({
            message: message.trim(),
            senderId: this.userId,
            senderName: this.settings.get('userName')
        });
        
        this.ui.addChatMessage(message, true, 'You');
    }

    /**
     * Update participants list
     * @param {object} participants - Participants data from Firebase
     * @private
     */
    _updateParticipants(participants) {
        this.participants.clear();
        
        Object.keys(participants).forEach(id => {
            this.participants.set(id, participants[id]);
        });
        
        this.ui.updateParticipants(this.participants.size, this.isHost);
        
        // Check if we should become host
        if (!this.isHost && !this._hasActiveHost()) {
            this._becomeHost();
        }
    }

    /**
     * Check if there's an active host
     * @returns {boolean} Has active host
     * @private
     */
    _hasActiveHost() {
        for (const participant of this.participants.values()) {
            if (participant.isHost) return true;
        }
        return false;
    }

    /**
     * Become the room host
     * @private
     */
    async _becomeHost() {
        this.isHost = true;
        this.ui.updateParticipants(this.participants.size, true);
        this.ui.showToast('You are now the host! 👑', 'info');

        // Update Firebase
        if (this.firebase.isInRoom()) {
            await this.firebase.updateHost(this.userId);
        }
    }

    /**
     * Check for room in URL parameters
     * @private
     */
    _checkForRoomInUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const roomId = urlParams.get('room');
        
        if (roomId && this.firebase.isInitialized) {
            setTimeout(() => {
                this.firebase.joinRoom(roomId, this.userId, {
                    name: this.settings.get('userName'),
                    isHost: false
                });
            }, 1000);
        }
    }

    /**
     * Apply setting changes
     * @param {string} key - Setting key
     * @param {*} value - Setting value
     * @private
     */
    _applySettingChange(key, value) {
        switch (key) {
            case 'soundEnabled':
                this.audio.setEnabled(value);
                break;
                
            case 'soundVolume':
                this.audio.setVolume(value);
                break;
                
            case 'notificationSound':
                this.audio.setSoundType(value);
                break;
                
            case 'customDuration':
                // Update custom mode if currently selected
                if (this.timer.currentMode === 'custom') {
                    this.timer.setMode('custom', value * 60);
                }
                break;
        }
    }

    /**
     * Show browser notification
     * @param {string} mode - Timer mode that completed
     * @private
     */
    _showNotification(mode) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const title = mode === 'focus' ? 
                'Focus session complete!' : 
                'Break time over!';
            const body = mode === 'focus' ? 
                'Great work! Time for a well-deserved break.' : 
                'Ready to get back to work?';
            
            new Notification(title, {
                body,
                icon: '/favicon.ico',
                tag: 'studysync-timer',
                requireInteraction: false
            });
        }
    }

    /**
     * Request notification permission
     * @private
     */
    async _requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            this.settings.set('notifications', permission === 'granted');
        }
    }

    /**
     * Start heartbeat for presence
     * @private
     */
    _startHeartbeat() {
        if (this.heartbeatInterval) return;
        
        this.heartbeatInterval = setInterval(() => {
            if (this.firebase.isInRoom()) {
                this.firebase.updateHeartbeat(this.userId);
            }
        }, this.heartbeatDelay);
    }

    /**
     * Stop heartbeat
     * @private
     */
    _stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * Setup app lifecycle handlers
     * @private
     */
    _setupLifecycleHandlers() {
        // Handle visibility changes
        document.addEventListener('visibilitychange', this._handleVisibilityChange);
        
        // Handle page unload
        window.addEventListener('beforeunload', this._handleBeforeUnload);
    }

    /**
     * Handle page visibility changes
     * @private
     */
    _handleVisibilityChange() {
        if (document.hidden) {
            // Page is hidden - pause non-essential operations
            this._stopHeartbeat();
        } else {
            // Page is visible - resume operations
            if (this.firebase.isInRoom()) {
                this._startHeartbeat();
            }
        }
    }

    /**
     * Handle page unload
     * @private
     */
    _handleBeforeUnload() {
        this.cleanup();
    }

    /**
     * Generate unique user ID
     * @returns {string} User ID
     * @private
     */
    _generateUserId() {
        return 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    }

    /**
     * Generate room ID
     * @returns {string} Room ID
     * @private
     */
    _generateRoomId() {
        return Math.random().toString(36).substring(2, 8).toLowerCase();
    }

    /**
     * Get app status information
     * @returns {object} App status
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            roomId: this.roomId,
            isHost: this.isHost,
            participantCount: this.participants.size,
            timerState: this.timer.getState(),
            firebaseConnected: this.firebase.getConnectionStatus(),
            audioEnabled: this.audio.getSettings().enabled
        };
    }

    /**
     * Cleanup app resources
     */
    cleanup() {
        console.log('🧹 Cleaning up StudySync...');
        
        this._stopHeartbeat();
        
        // Leave room if in one
        if (this.firebase.isInRoom()) {
            this.firebase.leaveRoom(this.userId);
        }
        
        // Cleanup modules
        this.timer.destroy();
        this.firebase.destroy();
        this.stats.destroy();
        this.settings.destroy();
        this.ui.destroy();
        this.audio.destroy();
        
        // Remove event listeners
        document.removeEventListener('visibilitychange', this._handleVisibilityChange);
        window.removeEventListener('beforeunload', this._handleBeforeUnload);
        
        console.log('✅ StudySync cleanup complete');
    }
}

// Export for use in main.js
window.StudySyncApp = StudySyncApp;