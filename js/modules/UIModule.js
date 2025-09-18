/**
 * Complete UIModule - User interface management with authentication
 * File: js/modules/UIModule.js
 */

class UIModule extends EventEmitter {
    constructor() {
        super();
        
        this.elements = {};
        this.state = {
            focusMode: false,
            settingsOpen: false,
            chatOpen: false,
            profileOpen: false,
            achievementsOpen: false
        };
        
        this.initializeElements();
        this.attachEventListeners();
    }

    /**
     * Initialize DOM element references
     */
    initializeElements() {
        // Timer elements
        this.elements.timerDisplay = document.getElementById('timerDisplay');
        this.elements.focusTimerDisplay = document.getElementById('focusTimerDisplay');
        this.elements.modeDisplay = document.getElementById('modeDisplay');
        this.elements.focusModeDisplay = document.getElementById('focusModeDisplay');
        this.elements.progressCircle = document.getElementById('progressCircle');
        
        // Control buttons
        this.elements.startBtn = document.getElementById('startBtn');
        this.elements.pauseBtn = document.getElementById('pauseBtn');
        this.elements.resetBtn = document.getElementById('resetBtn');
        this.elements.skipBtn = document.getElementById('skipBtn');
        this.elements.focusStartBtn = document.getElementById('focusStartBtn');
        this.elements.focusResetBtn = document.getElementById('focusResetBtn');
        
        // Mode buttons
        this.elements.modeButtons = document.querySelectorAll('.mode-btn');
        
        // Stats elements
        this.elements.sessionsCompleted = document.getElementById('sessionsCompleted');
        this.elements.focusTime = document.getElementById('focusTime');
        this.elements.currentStreak = document.getElementById('currentStreak');
        this.elements.productivityScore = document.getElementById('productivityScore');
        
        // Room elements
        this.elements.roomCode = document.getElementById('roomCode');
        this.elements.createRoomBtn = document.getElementById('createRoomBtn');
        this.elements.joinRoomBtn = document.getElementById('joinRoomBtn');
        this.elements.roomUrlGroup = document.getElementById('roomUrlGroup');
        this.elements.roomUrl = document.getElementById('roomUrl');
        this.elements.copyRoomBtn = document.getElementById('copyRoomBtn');
        this.elements.participantCount = document.getElementById('participantCount');
        this.elements.connectionStatus = document.getElementById('connectionStatus');
        
        // Chat elements
        this.elements.chatToggleBtn = document.getElementById('chatToggleBtn');
        this.elements.chatSidebar = document.getElementById('chatSidebar');
        this.elements.chatOverlay = document.getElementById('chatOverlay');
        this.elements.chatCloseBtn = document.getElementById('chatCloseBtn');
        this.elements.chatMessages = document.getElementById('chatMessages');
        this.elements.chatInput = document.getElementById('chatInput');
        this.elements.sendBtn = document.getElementById('sendBtn');
        this.elements.chatNotification = document.getElementById('chatNotification');
        
        // Focus mode elements
        this.elements.focusBtn = document.getElementById('focusBtn');
        this.elements.focusOverlay = document.getElementById('focusOverlay');
        this.elements.focusExitBtn = document.getElementById('focusExitBtn');
        
        // Settings elements
        this.elements.settingsBtn = document.getElementById('settingsBtn');
        this.elements.settingsPanel = document.getElementById('settingsPanel');
        this.elements.closeSettingsBtn = document.getElementById('closeSettingsBtn');
        this.elements.soundToggle = document.getElementById('soundToggle');
        this.elements.autoBreakToggle = document.getElementById('autoBreakToggle');
        this.elements.notificationToggle = document.getElementById('notificationToggle');
        this.elements.customDurationInput = document.getElementById('customDurationInput');
        this.elements.userNameInput = document.getElementById('userNameInput');
        
        // Auth elements
        this.elements.googleSignInBtn = document.getElementById('googleSignInBtn');
        this.elements.googleSignOutBtn = document.getElementById('googleSignOutBtn');
        this.elements.userProfile = document.getElementById('userProfile');
        this.elements.userNameDisplay = document.getElementById('userNameDisplay');
        this.elements.userAvatar = document.getElementById('userAvatar');
        this.elements.syncStatus = document.getElementById('syncStatus');
        this.elements.exportDataBtn = document.getElementById('exportDataBtn');
        this.elements.profileCard = document.getElementById('profileCard');
        
        // Level and Achievement elements
        this.elements.levelDisplay = document.getElementById('levelDisplay');
        this.elements.currentLevel = document.getElementById('currentLevel');
        this.elements.experienceBar = document.getElementById('experienceBar');
        this.elements.experienceText = document.getElementById('experienceText');
        this.elements.totalExperience = document.getElementById('totalExperience');
        this.elements.achievementsList = document.getElementById('achievementsList');
        this.elements.achievementsCount = document.getElementById('achievementsCount');
        this.elements.achievementsPreview = document.getElementById('achievementsPreview');
        this.elements.viewAchievementsBtn = document.getElementById('viewAchievementsBtn');
        this.elements.achievementsPanel = document.getElementById('achievementsPanel');
        this.elements.profilePanel = document.getElementById('profilePanel');
        this.elements.closeProfileBtn = document.getElementById('closeProfileBtn');
        
        // Profile elements
        this.elements.profileName = document.getElementById('profileName');
        this.elements.profileEmail = document.getElementById('profileEmail');
        this.elements.profileAvatar = document.getElementById('profileAvatar');
        this.elements.memberSince = document.getElementById('memberSince');
        this.elements.lastLogin = document.getElementById('lastLogin');
        this.elements.signOutFromProfile = document.getElementById('signOutFromProfile');
        
        // Toast element
        this.elements.toast = document.getElementById('toast');
    }

    /**
     * Attach event listeners to UI elements
     */
    attachEventListeners() {
        // Timer controls
        this._addEventListener('startBtn', 'click', () => this.emit('startTimer'));
        this._addEventListener('pauseBtn', 'click', () => this.emit('pauseTimer'));
        this._addEventListener('resetBtn', 'click', () => this.emit('resetTimer'));
        this._addEventListener('skipBtn', 'click', () => this.emit('skipTimer'));
        this._addEventListener('focusStartBtn', 'click', () => this.emit('startTimer'));
        this._addEventListener('focusResetBtn', 'click', () => this.emit('resetTimer'));
        
        // Mode selection
        this.elements.modeButtons?.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                let duration = parseInt(btn.dataset.duration);
                
                if (mode === 'custom') {
                    duration = this.getCustomDuration() * 60;
                }
                
                this.emit('modeChange', { mode, duration });
            });
        });
        
        // Room management
        this._addEventListener('createRoomBtn', 'click', () => this.emit('createRoom'));
        this._addEventListener('joinRoomBtn', 'click', () => this.emit('joinRoom'));
        this._addEventListener('copyRoomBtn', 'click', () => this.emit('copyRoom'));
        
        // Chat functionality
        this._addEventListener('sendBtn', 'click', () => this._sendChatMessage());
        this._addEventListener('chatInput', 'keypress', (e) => {
            if (e.key === 'Enter') this._sendChatMessage();
        });
        this._addEventListener('chatToggleBtn', 'click', () => this._openChat());
        this._addEventListener('chatCloseBtn', 'click', () => this._closeChat());
        this._addEventListener('chatOverlay', 'click', () => this._closeChat());
        
        // Focus mode
        this._addEventListener('focusBtn', 'click', () => this.toggleFocusMode());
        this._addEventListener('focusExitBtn', 'click', () => this.exitFocusMode());
        
        // Settings
        this._addEventListener('settingsBtn', 'click', () => this.toggleSettings());
        this._addEventListener('closeSettingsBtn', 'click', () => this.closeSettings());
        this._addEventListener('soundToggle', 'click', () => this._toggleSetting('soundEnabled'));
        this._addEventListener('autoBreakToggle', 'click', () => this._toggleSetting('autoBreak'));
        this._addEventListener('notificationToggle', 'click', () => this._toggleSetting('notifications'));
        this._addEventListener('customDurationInput', 'change', (e) => {
            this.emit('settingChange', { key: 'customDuration', value: parseInt(e.target.value) });
        });
        this._addEventListener('userNameInput', 'change', (e) => {
            this.emit('settingChange', { key: 'userName', value: e.target.value });
        });
        
        // Auth events
        this._addEventListener('googleSignInBtn', 'click', () => this.emit('signInGoogle'));
        this._addEventListener('googleSignOutBtn', 'click', () => this.emit('signOut'));
        this._addEventListener('signOutFromProfile', 'click', () => this.emit('signOut'));
        this._addEventListener('exportDataBtn', 'click', () => this.emit('exportData'));
        this._addEventListener('userProfile', 'click', () => this.toggleProfilePanel());
        this._addEventListener('closeProfileBtn', 'click', () => this.closeProfilePanel());
        this._addEventListener('viewAchievementsBtn', 'click', () => this.toggleAchievementsPanel());
        
        // Achievements panel
        if (this.elements.achievementsPanel) {
            this.elements.achievementsPanel.addEventListener('click', (e) => {
                if (e.target.classList.contains('close-btn')) {
                    this.closeAchievementsPanel();
                }
            });
        }
        
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => this._handleKeyboardShortcuts(e));
        document.addEventListener('click', (e) => this._handleOutsideClick(e));
    }

    /**
     * Update timer display
     */
    updateTimer(timeLeft, duration) {
        const display = this._formatTime(timeLeft);
        
        this._setElementText('timerDisplay', display);
        this._setElementText('focusTimerDisplay', display);
        
        this._updateProgress(timeLeft, duration);
    }

    /**
     * Update mode display
     */
    updateMode(mode) {
        const modeNames = {
            'focus': 'Focus Session',
            'short-break': 'Short Break',
            'long-break': 'Long Break',
            'custom': 'Custom Timer'
        };
        
        const displayName = modeNames[mode] || 'Focus Session';
        this._setElementText('modeDisplay', displayName);
        this._setElementText('focusModeDisplay', displayName);
        
        this.elements.modeButtons?.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
    }

    /**
     * Update control buttons state
     */
    updateControls(isRunning, isPaused) {
        if (this.elements.startBtn) {
            this.elements.startBtn.textContent = isRunning ? 'Running' : (isPaused ? 'Resume' : 'Start');
            this.elements.startBtn.style.display = isRunning ? 'none' : 'block';
        }
        
        if (this.elements.pauseBtn) {
            this.elements.pauseBtn.style.display = isRunning ? 'block' : 'none';
        }
        
        if (this.elements.focusStartBtn) {
            this.elements.focusStartBtn.textContent = isRunning ? 'Running' : (isPaused ? 'Resume' : 'Start');
        }
    }

    /**
     * Update statistics display
     */
    updateStats(stats) {
        this._setElementText('sessionsCompleted', stats.sessions);
        this._setElementText('focusTime', stats.focusTime + 'h');
        this._setElementText('currentStreak', stats.streak);
        this._setElementText('productivityScore', stats.productivityScore + '%');
    }

    /**
     * Enhanced stats update to include level and experience
     */
    updateStatsEnhanced(stats) {
        this.updateStats(stats);
        
        if (stats.level !== undefined || stats.experience !== undefined) {
            this.updateLevelAndExperience(stats);
        }
    }

    /**
     * Update level and experience display
     */
    updateLevelAndExperience(progress) {
        if (progress.level !== undefined) {
            this._setElementText('levelDisplay', `Level ${progress.level}`);
            this._setElementText('currentLevel', progress.level.toString());
        }
        
        if (progress.experience !== undefined && this.elements.experienceBar) {
            const level = progress.level || 1;
            const baseXP = this.calculateLevelXP(level - 1);
            const nextLevelXP = this.calculateLevelXP(level);
            const currentLevelXP = progress.experience - baseXP;
            const requiredXP = nextLevelXP - baseXP;
            
            const percentage = Math.min(100, (currentLevelXP / requiredXP) * 100);
            
            const progressBar = this.elements.experienceBar.querySelector('.experience-progress');
            if (progressBar) {
                progressBar.style.width = `${percentage}%`;
            }
            
            this._setElementText('experienceText', `${currentLevelXP}/${requiredXP} XP`);
            this._setElementText('totalExperience', `${progress.experience} Total XP`);
        }
    }

    /**
     * Calculate XP required for a specific level
     */
    calculateLevelXP(level) {
        let totalXP = 0;
        for (let i = 1; i <= level; i++) {
            totalXP += 100 + (i - 1) * 50;
        }
        return totalXP;
    }

    /**
     * Update participant count and status
     */
    updateParticipants(count, isHost = false) {
        const text = count === 1 ? '1 student' : `${count} students`;
        const hostText = isHost ? ' (host)' : '';
        
        this._setElementText('participantCount', text + hostText);
        
        if (this.elements.connectionStatus) {
            this.elements.connectionStatus.style.background = count > 1 ? '#10b981' : '#7dd3fc';
        }
    }

    /**
     * Update room information
     */
    updateRoom(roomId, isHost = false) {
        this._setElementText('roomCode', roomId || 'Solo');
        
        if (roomId) {
            this._showElement('chatToggleBtn');
            this._showElement('roomUrlGroup');
            
            const url = new URL(window.location);
            url.searchParams.set('room', roomId);
            this._setElementValue('roomUrl', url.toString());
        } else {
            this._hideElement('chatToggleBtn');
            this._hideElement('roomUrlGroup');
        }
    }

    /**
     * Update authentication state in UI
     */
    updateAuthState(authStatus) {
        const { isAuthenticated, user, isOnline, syncQueueLength } = authStatus;
        
        if (isAuthenticated && user) {
            this._hideElement('googleSignInBtn');
            this._showElement('googleSignOutBtn');
            this._showElement('userProfile');
            this._showElement('profileCard');
            
            this._setElementText('userNameDisplay', user.displayName || 'User');
            
            if (user.photoURL && this.elements.userAvatar) {
                this.elements.userAvatar.src = user.photoURL;
                this.elements.userAvatar.style.display = 'block';
            }
            
            this.updateSyncStatus(isOnline, syncQueueLength);
        } else {
            this._showElement('googleSignInBtn');
            this._hideElement('googleSignOutBtn');
            this._hideElement('userProfile');
            this._hideElement('profileCard');
            
            this._setElementText('userNameDisplay', '');
            
            if (this.elements.userAvatar) {
                this.elements.userAvatar.style.display = 'none';
            }
        }
    }

    /**
     * Update user profile information
     */
    updateUserProfile(profile) {
        if (!profile) {
            this._hideElement('profileCard');
            return;
        }
        
        this._showElement('profileCard');
        
        this._setElementText('profileName', profile.displayName);
        this._setElementText('profileEmail', profile.email);
        
        if (profile.photoURL && this.elements.profileAvatar) {
            this.elements.profileAvatar.src = profile.photoURL;
        }
        
        if (profile.createdAt) {
            const createdDate = new Date(profile.createdAt).toLocaleDateString();
            this._setElementText('memberSince', `Member since ${createdDate}`);
        }
        
        if (profile.lastLoginAt) {
            const lastLogin = new Date(profile.lastLoginAt).toLocaleDateString();
            this._setElementText('lastLogin', `Last login: ${lastLogin}`);
        }
    }

    /**
     * Update sync status indicator
     */
    updateSyncStatus(isOnline, queueLength = 0) {
        if (!this.elements.syncStatus) return;
        
        if (isOnline) {
            if (queueLength > 0) {
                this.elements.syncStatus.className = 'sync-status syncing';
                this.elements.syncStatus.textContent = `Syncing ${queueLength} items...`;
            } else {
                this.elements.syncStatus.className = 'sync-status synced';
                this.elements.syncStatus.textContent = 'Synced';
            }
        } else {
            this.elements.syncStatus.className = 'sync-status offline';
            this.elements.syncStatus.textContent = queueLength > 0 ? 
                `Offline (${queueLength} pending)` : 'Offline';
        }
    }

    /**
     * Update user achievements
     */
    updateAchievements(achievements) {
        if (!this.elements.achievementsList) return;
        
        this.elements.achievementsList.innerHTML = '';
        
        if (achievements.length === 0) {
            this.elements.achievementsList.innerHTML = `
                <div class="no-achievements">
                    <div class="achievement-icon">🏆</div>
                    <p>No achievements yet</p>
                    <small>Complete focus sessions to unlock achievements!</small>
                </div>
            `;
            this._setElementText('achievementsCount', '0');
            return;
        }
        
        achievements.forEach(achievement => {
            const achievementEl = document.createElement('div');
            achievementEl.className = 'achievement-item';
            achievementEl.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-content">
                    <h4 class="achievement-title">${achievement.title}</h4>
                    <p class="achievement-description">${achievement.description}</p>
                    <small class="achievement-date">
                        Unlocked ${new Date(achievement.unlockedAt).toLocaleDateString()}
                    </small>
                </div>
            `;
            this.elements.achievementsList.appendChild(achievementEl);
        });
        
        this._setElementText('achievementsCount', achievements.length.toString());
        
        // Update preview
        if (this.elements.achievementsPreview) {
            this.elements.achievementsPreview.innerHTML = '';
            achievements.slice(0, 3).forEach(achievement => {
                const previewEl = document.createElement('div');
                previewEl.className = 'achievement-preview-item';
                previewEl.textContent = achievement.icon;
                previewEl.title = achievement.title;
                this.elements.achievementsPreview.appendChild(previewEl);
            });
        }
    }

    /**
     * Show achievement unlock animation
     */
    showAchievementUnlock(achievement) {
        const achievementNotification = document.createElement('div');
        achievementNotification.className = 'achievement-notification';
        achievementNotification.innerHTML = `
            <div class="achievement-popup">
                <div class="achievement-header">
                    <span class="achievement-unlock-icon">🏆</span>
                    <span class="achievement-unlock-text">Achievement Unlocked!</span>
                </div>
                <div class="achievement-details">
                    <span class="achievement-icon-large">${achievement.icon}</span>
                    <div>
                        <h3>${achievement.title}</h3>
                        <p>${achievement.description}</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(achievementNotification);
        
        setTimeout(() => {
            achievementNotification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            achievementNotification.classList.remove('show');
            setTimeout(() => {
                if (achievementNotification.parentNode) {
                    achievementNotification.parentNode.removeChild(achievementNotification);
                }
            }, 300);
        }, 5000);
        
        achievementNotification.addEventListener('click', () => {
            achievementNotification.classList.remove('show');
            setTimeout(() => {
                if (achievementNotification.parentNode) {
                    achievementNotification.parentNode.removeChild(achievementNotification);
                }
            }, 300);
        });
    }

    /**
     * Show data export success message
     */
    showExportSuccess(filename) {
        const exportSuccess = document.createElement('div');
        exportSuccess.className = 'export-success-notification';
        exportSuccess.innerHTML = `
            <div class="export-popup">
                <div class="export-icon">📄</div>
                <div class="export-content">
                    <h3>Data Exported Successfully!</h3>
                    <p>Your data has been saved as:</p>
                    <code>${filename}</code>
                    <small>You can import this file to restore your progress</small>
                </div>
            </div>
        `;
        
        document.body.appendChild(exportSuccess);
        
        setTimeout(() => {
            exportSuccess.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            exportSuccess.classList.remove('show');
            setTimeout(() => {
                if (exportSuccess.parentNode) {
                    exportSuccess.parentNode.removeChild(exportSuccess);
                }
            }, 300);
        }, 4000);
    }

    /**
     * Add message to chat
     */
    addChatMessage(message, isOwn = false, senderName = 'Unknown') {
        if (!this.elements.chatMessages) return;
        
        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${isOwn ? 'own' : 'other'}`;
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageEl.innerHTML = `
            <div class="message-content">${this._escapeHtml(message)}</div>
            <div class="message-meta">${isOwn ? 'You' : this._escapeHtml(senderName)} • ${time}</div>
        `;
        
        this.elements.chatMessages.appendChild(messageEl);
        this._scrollToBottom(this.elements.chatMessages);
        
        if (!this.state.chatOpen && !isOwn) {
            this._showChatNotification();
        }
    }

    /**
     * Update settings UI
     */
    updateSettings(settings) {
        this._updateToggle('soundToggle', settings.soundEnabled);
        this._updateToggle('autoBreakToggle', settings.autoBreak);
        this._updateToggle('notificationToggle', settings.notifications);
        
        this._setElementValue('customDurationInput', settings.customDuration);
        this._setElementValue('userNameInput', settings.userName);
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info', duration = 3000) {
        if (!this.elements.toast) return;
        
        this.elements.toast.textContent = message;
        this.elements.toast.className = `toast show ${type}`;
        
        setTimeout(() => {
            this.elements.toast.classList.remove('show');
        }, duration);
    }

    /**
     * Toggle focus mode
     */
    toggleFocusMode() {
        if (this.state.focusMode) {
            this.exitFocusMode();
        } else {
            this.enterFocusMode();
        }
    }

    /**
     * Enter focus mode
     */
    enterFocusMode() {
        this.state.focusMode = true;
        this.elements.focusOverlay?.classList.add('active');
        document.body.classList.add('focus-mode');
        
        this.emit('focusModeEntered');
        this.showToast('Focus Mode: Press ESC to exit', 'info', 2000);
    }

    /**
     * Exit focus mode
     */
    exitFocusMode() {
        this.state.focusMode = false;
        this.elements.focusOverlay?.classList.remove('active');
        document.body.classList.remove('focus-mode');
        
        this.emit('focusModeExited');
    }

    /**
     * Toggle settings panel
     */
    toggleSettings() {
        if (this.state.settingsOpen) {
            this.closeSettings();
        } else {
            this.openSettings();
        }
    }

    /**
     * Open settings panel
     */
    openSettings() {
        this.state.settingsOpen = true;
        this.elements.settingsPanel?.classList.add('open');
        this.emit('settingsOpened');
    }

    /**
     * Close settings panel
     */
    closeSettings() {
        this.state.settingsOpen = false;
        this.elements.settingsPanel?.classList.remove('open');
        this.emit('settingsClosed');
    }

    /**
     * Toggle profile panel
     */
    toggleProfilePanel() {
        if (this.state.profileOpen) {
            this.closeProfilePanel();
        } else {
            this.openProfilePanel();
        }
    }

    /**
     * Open profile panel
     */
    openProfilePanel() {
        this.state.profileOpen = true;
        this.elements.profilePanel?.classList.add('open');
        this.emit('profileOpened');
    }

    /**
     * Close profile panel
     */
    closeProfilePanel() {
        this.state.profileOpen = false;
        this.elements.profilePanel?.classList.remove('open');
        this.emit('profileClosed');
    }

    /**
     * Toggle achievements panel
     */
    toggleAchievementsPanel() {
        if (this.state.achievementsOpen) {
            this.closeAchievementsPanel();
        } else {
            this.openAchievementsPanel();
        }
    }

    /**
     * Open achievements panel
     */
    openAchievementsPanel() {
        this.state.achievementsOpen = true;
        this.elements.achievementsPanel?.classList.add('open');
        this.emit('achievementsOpened');
    }

    /**
     * Close achievements panel
     */
    closeAchievementsPanel() {
        this.state.achievementsOpen = false;
        this.elements.achievementsPanel?.classList.remove('open');
        this.emit('achievementsClosed');
    }

    /**
     * Get custom duration from input
     */
    getCustomDuration() {
        const value = this.elements.customDurationInput?.value;
        return parseInt(value) || 25;
    }

    /**
     * Open chat
     */
    _openChat() {
        this.state.chatOpen = true;
        this.elements.chatSidebar?.classList.add('open');
        this.elements.chatOverlay?.classList.add('active');
        this._clearChatNotification();
    }

    /**
     * Close chat
     */
    _closeChat() {
        this.state.chatOpen = false;
        this.elements.chatSidebar?.classList.remove('open');
        this.elements.chatOverlay?.classList.remove('active');
    }

    /**
     * Show chat notification
     */
    _showChatNotification() {
        if (!this.elements.chatNotification) return;
        
        const current = parseInt(this.elements.chatNotification.textContent) || 0;
        const newCount = current + 1;
        
        this.elements.chatNotification.textContent = newCount;
        this.elements.chatNotification.style.display = 'block';
        
        if (this.elements.chatToggleBtn) {
            this.elements.chatToggleBtn.style.animation = 'pulse 2s infinite';
        }
    }

    /**
     * Clear chat notification
     */
    _clearChatNotification() {
        if (this.elements.chatNotification) {
            this.elements.chatNotification.style.display = 'none';
            this.elements.chatNotification.textContent = '0';
        }
        
        if (this.elements.chatToggleBtn) {
            this.elements.chatToggleBtn.style.animation = '';
        }
    }

    /**
     * Send chat message
     */
    _sendChatMessage() {
        const message = this.elements.chatInput?.value.trim();
        if (message) {
            this.emit('sendMessage', { message });
            this.elements.chatInput.value = '';
        }
    }

    /**
     * Toggle setting and emit event
     */
    _toggleSetting(setting) {
        this.emit('toggleSetting', { setting });
    }

    /**
     * Handle keyboard shortcuts
     */
    _handleKeyboardShortcuts(e) {
        if (e.key === 'Escape' && this.state.focusMode) {
            this.exitFocusMode();
            return;
        }
        
        if (e.key === ' ' && !e.target.matches('input, textarea')) {
            e.preventDefault();
            this.emit('toggleTimer');
            return;
        }
        
        if (e.key === 'Enter' && e.target === this.elements.chatInput) {
            this._sendChatMessage();
            return;
        }
    }

    /**
     * Handle clicks outside panels to close them
     */
    _handleOutsideClick(e) {
        if (this.state.settingsOpen && 
            !this.elements.settingsPanel?.contains(e.target) &&
            !this.elements.settingsBtn?.contains(e.target)) {
            this.closeSettings();
        }
        
        if (this.state.profileOpen && 
            !this.elements.profilePanel?.contains(e.target) &&
            !this.elements.userProfile?.contains(e.target)) {
            this.closeProfilePanel();
        }
    }

    /**
     * Set element text content safely
     */
    _setElementText(elementId, text) {
        const element = this.elements[elementId];
        if (element) element.textContent = text;
    }

    /**
     * Set element value safely
     */
    _setElementValue(elementId, value) {
        const element = this.elements[elementId];
        if (element) element.value = value;
    }

    /**
     * Show element
     */
    _showElement(elementId) {
        const element = this.elements[elementId];
        if (element) element.style.display = '';
    }

    /**
     * Hide element
     */
    _hideElement(elementId) {
        const element = this.elements[elementId];
        if (element) element.style.display = 'none';
    }

    /**
     * Update progress circle
     */
    _updateProgress(timeLeft, duration) {
        if (!this.elements.progressCircle) return;
        
        const progress = (duration - timeLeft) / duration;
        const circumference = 2 * Math.PI * 90;
        const offset = circumference * (1 - progress);
        
        this.elements.progressCircle.style.strokeDashoffset = offset;
    }

    /**
     * Format time display
     */
    _formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Update toggle switch state
     */
    _updateToggle(toggleId, active) {
        const toggle = this.elements[toggleId];
        if (toggle) {
            toggle.classList.toggle('active', active);
        }
    }

    /**
     * Safely add event listener to element
     */
    _addEventListener(elementId, event, handler) {
        const element = this.elements[elementId];
        if (element) {
            element.addEventListener(event, handler);
        }
    }

    /**
     * Scroll element to bottom
     */
    _scrollToBottom(element) {
        if (element) {
            element.scrollTop = element.scrollHeight;
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Cleanup UI resources
     */
    destroy() {
        this.removeAllListeners();
    }
}

// Export for use in other modules
window.UIModule = UIModule;