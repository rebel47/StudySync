/**
 * StudySyncApp - Complete Main application orchestrator with authentication
 * File: js/StudySyncApp.js
 */

class StudySyncApp {
    constructor() {
        // Initialize modules
        this.timer = new TimerModule();
        this.firebase = new FirebaseModule();
        this.auth = new AuthModule();
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
     */
    async initialize() {
        try {
            console.log('🚀 Initializing StudySync Pro...');
            
            // Initialize Firebase first
            const firebaseSuccess = await this.firebase.initialize();
            if (!firebaseSuccess) {
                console.warn('Firebase initialization failed, continuing in offline mode');
            }
            
            // Initialize Auth module
            if (firebaseSuccess) {
                const authSuccess = await this.auth.initialize();
                if (!authSuccess) {
                    console.warn('Auth initialization failed, continuing without authentication');
                }
            }
            
            // Initialize audio on user interaction
            document.addEventListener('click', async () => {
                if (!this.audio.audioContext) {
                    await this.audio.initialize();
                }
            }, { once: true });
            
            // Setup all event listeners
            this._setupEventListeners();
            this._setupAuthEventListeners();
            
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
     * Setup authentication event listeners
     */
    _setupAuthEventListeners() {
        // Auth module events
        this.auth.on('initialized', () => {
            console.log('Auth module initialized');
            this.ui.updateAuthState(this.auth.getAuthStatus());
        });

        this.auth.on('authStateChanged', (data) => {
            console.log('Auth state changed:', data.isAuthenticated);
            this.ui.updateAuthState(this.auth.getAuthStatus());
            
            if (data.isAuthenticated) {
                this.ui.showToast(`Welcome back, ${data.user.displayName}! 👋`, 'success');
                this._syncWithAuth();
            } else {
                this.ui.showToast('Signed out successfully 👋');
                this._resetLocalData();
            }
        });

        this.auth.on('signInSuccess', (data) => {
            this.ui.showToast(`Signed in as ${data.user.displayName} ✅`, 'success');
        });

        this.auth.on('userDataLoaded', (userData) => {
            console.log('User data loaded:', userData);
            this._updateStatsFromAuth(userData.progress);
            this.ui.updateUserProfile(userData.profile);
            this.ui.updateAchievements(userData.achievements);
            this.ui.updateLevelAndExperience(userData.progress);
        });

        this.auth.on('progressUpdated', (progress) => {
            console.log('Progress updated:', progress);
            const transformedStats = this._transformProgressToStats(progress);
            this.ui.updateStatsEnhanced(transformedStats);
            this.ui.updateLevelAndExperience(progress);
        });

        this.auth.on('achievementsUnlocked', (achievements) => {
            achievements.forEach(achievement => {
                this.ui.showToast(`🏆 Achievement Unlocked: ${achievement.title}!`, 'success', 5000);
                this.ui.showAchievementUnlock(achievement);
            });
            this.ui.updateAchievements(this.auth.getUserAchievements());
        });

        this.auth.on('authError', (error) => {
            this.ui.showToast(`Sign-in failed: ${error.message}`, 'error');
        });

        this.auth.on('onlineStatusChanged', (status) => {
            if (status.online) {
                this.ui.showToast('Back online - syncing data... 🌐', 'info');
            } else {
                this.ui.showToast('Offline mode - data will sync when reconnected 📱', 'warning');
            }
            this.ui.updateSyncStatus(status.online, 0);
        });

        this.auth.on('dataSynced', () => {
            this.ui.showToast('Data synced to cloud ☁️', 'success', 2000);
            this.ui.updateSyncStatus(true, 0);
        });

        // UI events for auth
        this.ui.on('signInGoogle', () => this._handleSignIn());
        this.ui.on('signOut', () => this._handleSignOut());
        this.ui.on('exportData', () => this._handleExportData());
        this.ui.on('viewAchievements', () => this.ui.toggleAchievementsPanel());
    }

    /**
     * Handle Google sign-in
     */
    async _handleSignIn() {
        if (!this.auth.isInitialized) {
            this.ui.showToast('Please wait, initializing...', 'warning');
            return;
        }

        this.ui.showToast('Opening sign-in window...', 'info');
        const success = await this.auth.signInWithGoogle();
        
        if (!success) {
            this.ui.showToast('Sign-in was cancelled or failed', 'error');
        }
    }

    /**
     * Handle sign-out
     */
    async _handleSignOut() {
        const success = await this.auth.signOut();
        if (!success) {
            this.ui.showToast('Sign-out failed. Please try again.', 'error');
        }
    }

    /**
     * Handle data export
     */
    _handleExportData() {
        if (!this.auth.isAuthenticated) {
            this.ui.showToast('Please sign in to export data', 'warning');
            return;
        }

        try {
            const userData = this.auth.exportUserData();
            const filename = `studysync-data-${new Date().toISOString().split('T')[0]}.json`;
            const blob = new Blob([JSON.stringify(userData, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.ui.showToast('Data exported successfully! 📄', 'success');
            this.ui.showExportSuccess(filename);
        } catch (error) {
            console.error('Export failed:', error);
            this.ui.showToast('Export failed. Please try again.', 'error');
        }
    }

    /**
     * Sync local stats with auth module
     */
    async _syncWithAuth() {
        if (!this.auth.isAuthenticated) return;
        
        const localStats = this.stats.getStats();
        
        await this.auth.updateProgress({
            sessionsCompleted: localStats.sessions,
            totalFocusTime: localStats.focusTimeSeconds,
            currentStreak: localStats.streak
        });
    }

    /**
     * Update local stats from auth data
     */
    _updateStatsFromAuth(authProgress) {
        this.stats.importData({
            todayStats: {
                sessions: authProgress.sessionsCompleted || 0,
                focusTime: authProgress.totalFocusTime || 0,
                streak: authProgress.currentStreak || 0
            },
            allTimeStats: {
                totalSessions: authProgress.sessionsCompleted || 0,
                totalFocusTime: authProgress.totalFocusTime || 0,
                longestStreak: authProgress.longestStreak || 0
            }
        });
    }

    /**
     * Transform progress data to stats format
     */
    _transformProgressToStats(progress) {
        return {
            sessions: progress.sessionsCompleted || 0,
            focusTime: Math.round((progress.totalFocusTime || 0) / 3600 * 10) / 10,
            focusTimeSeconds: progress.totalFocusTime || 0,
            streak: progress.currentStreak || 0,
            productivityScore: progress.productivityScore || 0,
            level: progress.level || 1,
            experience: progress.experience || 0
        };
    }

    /**
     * Reset local data on sign out
     */
    _resetLocalData() {
        this.ui.updateUserProfile(null);
        this.ui.updateAchievements([]);
        this.ui.updateAuthState({ isAuthenticated: false, user: null });
    }

    /**
     * Handle timer completion with auth integration
     */
    async _handleTimerComplete(mode) {
        this.ui.updateControls(false, false);
        
        if (mode === 'focus') {
            await this.audio.playSuccess();
            this.ui.showToast('Focus session complete! Great work! 🎉', 'success');
            this.stats.endSession(mode, true);
            
            // Sync with auth module if signed in
            if (this.auth.isAuthenticated) {
                await this.auth.addSession({
                    mode,
                    duration: this.timer.duration,
                    completed: true,
                    date: new Date().toDateString(),
                    timestamp: Date.now()
                });
            }
            
            if (this.settings.get('autoBreak')) {
                setTimeout(() => {
                    this.timer.setMode('short-break', 300);
                    this.timer.start();
                }, 2000);
            }
        } else {
            await this.audio.playCompletion();
            this.ui.showToast('Break time over! Ready to focus again? 💪', 'info');
            this.stats.endSession(mode, true);
            
            // Sync break session with auth module if signed in
            if (this.auth.isAuthenticated) {
                await this.auth.addSession({
                    mode,
                    duration: this.timer.duration,
                    completed: true,
                    date: new Date().toDateString(),
                    timestamp: Date.now()
                });
            }
            
            if (this.settings.get('autoFocus')) {
                setTimeout(() => {
                    this.timer.setMode('focus', this.settings.get('customDuration') * 60);
                    this.timer.start();
                }, 2000);
            }
        }

        if (this.settings.get('notifications')) {
            this._showNotification(mode);
        }

        if (this.roomId) {
            const message = mode === 'focus' ? 
                'Focus session completed! 🎯' : 
                'Break time finished! 💪';
            this.ui.addChatMessage(message, false, 'System');
        }
    }

    /**
     * Setup all event listeners between modules
     */
    _setupEventListeners() {
        // Timer events
        this.timer.on('tick', (data) => {
            this.ui.updateTimer(data.timeLeft, data.duration);
            
            if (this.isHost && this.firebase.isInRoom()) {
                this.firebase.updateTimer(this.timer.getState());
            }
        });

        this.timer.on('start', () => {
            this.ui.updateControls(true, false);
            this.ui.showToast('Timer started! Stay focused 🎯');
            this.stats.startSession(this.timer.currentMode);
        });

        this.timer.on('pause', () => {
            this.ui.updateControls(false, true);
            this.ui.showToast('Timer paused ⏸️');
        });

        this.timer.on('reset', () => {
            this.ui.updateControls(false, false);
            this.ui.updateTimer(this.timer.timeLeft, this.timer.duration);
            this.ui.showToast('Timer reset 🔄');
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
        this.ui.on('startTimer', () => this.timer.start());
        this.ui.on('pauseTimer', () => this.timer.pause());
        this.ui.on('resetTimer', () => this.timer.reset());
        this.ui.on('skipTimer', () => this.timer.skip());
        this.ui.on('toggleTimer', () => {
            if (this.timer.isRunning) {
                this.timer.pause();
            } else {
                this.timer.start();
            }
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
     */
    _initializeUI() {
        this.ui.updateSettings(this.settings.getAll());
        this.ui.updateStats(this.stats.getStats());
        this.ui.updateTimer(this.timer.timeLeft, this.timer.duration);
        this.ui.updateMode(this.timer.currentMode);
        this.ui.updateControls(this.timer.isRunning, this.timer.isPaused);
        this.ui.updateParticipants(1, false);
        this.ui.updateAuthState(this.auth.getAuthStatus());
    }

    /**
     * Create a new room
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
            const url = new URL(window.location);
            url.searchParams.set('room', roomId);
            window.history.pushState({}, '', url);
        }
    }

    /**
     * Join an existing room
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
            const url = new URL(window.location);
            url.searchParams.set('room', roomId);
            window.history.pushState({}, '', url);
        }
    }

    /**
     * Copy room URL to clipboard
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
     */
    _updateParticipants(participants) {
        this.participants.clear();
        
        Object.keys(participants).forEach(id => {
            this.participants.set(id, participants[id]);
        });
        
        this.ui.updateParticipants(this.participants.size, this.isHost);
        
        if (!this.isHost && !this._hasActiveHost()) {
            this._becomeHost();
        }
    }

    /**
     * Check if there's an active host
     */
    _hasActiveHost() {
        for (const participant of this.participants.values()) {
            if (participant.isHost) return true;
        }
        return false;
    }

    /**
     * Become the room host
     */
    async _becomeHost() {
        this.isHost = true;
        this.ui.updateParticipants(this.participants.size, true);
        this.ui.showToast('You are now the host! 👑', 'info');

        if (this.firebase.isInRoom()) {
            await this.firebase.updateHost(this.userId);
        }
    }

    /**
     * Check for room in URL parameters
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
                if (this.timer.currentMode === 'custom') {
                    this.timer.setMode('custom', value * 60);
                }
                break;
        }
    }

    /**
     * Show browser notification
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
     */
    async _requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            this.settings.set('notifications', permission === 'granted');
        }
    }

    /**
     * Start heartbeat for presence
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
     */
    _stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * Setup app lifecycle handlers
     */
    _setupLifecycleHandlers() {
        document.addEventListener('visibilitychange', this._handleVisibilityChange);
        window.addEventListener('beforeunload', this._handleBeforeUnload);
    }

    /**
     * Handle page visibility changes
     */
    _handleVisibilityChange() {
        if (document.hidden) {
            this._stopHeartbeat();
        } else {
            if (this.firebase.isInRoom()) {
                this._startHeartbeat();
            }
        }
    }

    /**
     * Handle page unload
     */
    _handleBeforeUnload() {
        this.cleanup();
    }

    /**
     * Generate unique user ID
     */
    _generateUserId() {
        return 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    }

    /**
     * Generate room ID
     */
    _generateRoomId() {
        return Math.random().toString(36).substring(2, 8).toLowerCase();
    }

    /**
     * Get app status information
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            roomId: this.roomId,
            isHost: this.isHost,
            participantCount: this.participants.size,
            timerState: this.timer.getState(),
            firebaseConnected: this.firebase.getConnectionStatus(),
            audioEnabled: this.audio.getSettings().enabled,
            authStatus: this.auth.getAuthStatus()
        };
    }

    /**
     * Cleanup app resources
     */
    cleanup() {
        console.log('🧹 Cleaning up StudySync...');
        
        this._stopHeartbeat();
        
        if (this.firebase.isInRoom()) {
            this.firebase.leaveRoom(this.userId);
        }
        
        // Cleanup modules
        this.timer.destroy();
        this.firebase.destroy();
        this.auth.destroy();
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