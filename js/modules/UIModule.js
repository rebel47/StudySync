/**
 * UIModule - User interface management and DOM interactions
 */

class UIModule extends EventEmitter {
    constructor() {
        super();
        
        this.elements = {};
        this.state = {
            focusMode: false,
            settingsOpen: false,
            chatOpen: false
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
        this.elements.chatCard = document.getElementById('chatCard');
        this.elements.chatMessages = document.getElementById('chatMessages');
        this.elements.chatInput = document.getElementById('chatInput');
        this.elements.sendBtn = document.getElementById('sendBtn');
        
        // Focus mode elements
        this.elements.focusBtn = document.getElementById('focusBtn');
        this.elements.focusOverlay = document.getElementById('focusOverlay');
        this.elements.focusExitBtn = document.getElementById('focusExitBtn');
        
        // Settings elements
        this.elements.settingsBtn = document.getElementById('settingsBtn');
        this.elements.settingsPanel = document.getElementById('settingsPanel');
        this.elements.closeSettingsBtn = document.getElementById('closeSettingsBtn');
        
        // Settings controls
        this.elements.soundToggle = document.getElementById('soundToggle');
        this.elements.autoBreakToggle = document.getElementById('autoBreakToggle');
        this.elements.notificationToggle = document.getElementById('notificationToggle');
        this.elements.customDurationInput = document.getElementById('customDurationInput');
        this.elements.userNameInput = document.getElementById('userNameInput');
        
        // Toast element
        this.elements.toast = document.getElementById('toast');
    }

    /**
     * Attach event listeners to UI elements
     */
    attachEventListeners() {
        // Timer controls
        this._addEventListener('startBtn', 'click', () => this.emit('toggleTimer'));
        this._addEventListener('pauseBtn', 'click', () => this.emit('pauseTimer'));
        this._addEventListener('resetBtn', 'click', () => this.emit('resetTimer'));
        this._addEventListener('skipBtn', 'click', () => this.emit('skipTimer'));
        this._addEventListener('focusStartBtn', 'click', () => this.emit('toggleTimer'));
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

        // Chat sidebar open/close logic
        this._addEventListener('chatToggleBtn', 'click', () => {
            this.state.chatOpen = true;
            this._clearChatNotification();
        });
        this._addEventListener('chatCloseBtn', 'click', () => {
            this.state.chatOpen = false;
        });
        
        // Focus mode
        this._addEventListener('focusBtn', 'click', () => this.toggleFocusMode());
        this._addEventListener('focusExitBtn', 'click', () => this.exitFocusMode());
        
        // Settings
        this._addEventListener('settingsBtn', 'click', () => this.toggleSettings());
        this._addEventListener('closeSettingsBtn', 'click', () => this.closeSettings());
        
        // Settings toggles
        this._addEventListener('soundToggle', 'click', () => this._toggleSetting('soundEnabled'));
        this._addEventListener('autoBreakToggle', 'click', () => this._toggleSetting('autoBreak'));
        this._addEventListener('notificationToggle', 'click', () => this._toggleSetting('notifications'));
        
        // Settings inputs
        this._addEventListener('customDurationInput', 'change', (e) => {
            this.emit('settingChange', { key: 'customDuration', value: parseInt(e.target.value) });
        });
        this._addEventListener('userNameInput', 'change', (e) => {
            this.emit('settingChange', { key: 'userName', value: e.target.value });
        });
        
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => this._handleKeyboardShortcuts(e));
        
        // Click outside to close panels
        document.addEventListener('click', (e) => this._handleOutsideClick(e));
    }

    /**
     * Update timer display
     * @param {number} timeLeft - Time left in seconds
     * @param {number} duration - Total duration in seconds
     */
    updateTimer(timeLeft, duration) {
        const display = this._formatTime(timeLeft);
        
        this._setElementText('timerDisplay', display);
        this._setElementText('focusTimerDisplay', display);
        
        this._updateProgress(timeLeft, duration);
    }

    /**
     * Update mode display
     * @param {string} mode - Current mode
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
        
        // Update active mode button
        this.elements.modeButtons?.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
    }

    /**
     * Update control buttons state
     * @param {boolean} isRunning - Timer running state
     * @param {boolean} canStart - Timer can start state
     */
    updateControls(isRunning, canStart) {
        const startBtn = this.elements.startBtn;
        const resetBtn = this.elements.resetBtn;
        
        if (!startBtn || !resetBtn) return;
        
        if (isRunning) {
            startBtn.textContent = 'Pause';
            startBtn.classList.remove('start');
            startBtn.classList.add('pause');
            resetBtn.disabled = false;
        } else {
            startBtn.textContent = canStart ? 'Start' : 'Start';
            startBtn.classList.remove('pause');
            startBtn.classList.add('start');
            resetBtn.disabled = !canStart;
        }
    }

    /**
     * Update statistics display
     * @param {object} stats - Statistics object
     */
    updateStats(stats) {
        this._setElementText('sessionsCompleted', stats.sessions);
        this._setElementText('focusTime', stats.focusTime + 'h');
        this._setElementText('currentStreak', stats.streak);
        this._setElementText('productivityScore', stats.productivityScore + '%');
    }

    /**
     * Update participant count and status
     * @param {number} count - Number of participants
     * @param {boolean} isHost - Whether user is host
     */
    updateParticipants(count, isHost = false) {
        const text = count === 1 ? '1 student' : `${count} students`;
        const hostText = isHost ? ' (host)' : '';
        
        this._setElementText('participantCount', text + hostText);
        
        // Update connection status indicator
        if (this.elements.connectionStatus) {
            this.elements.connectionStatus.style.background = count > 1 ? '#10b981' : '#7dd3fc';
        }
    }

    /**
     * Update room information
     * @param {string} roomId - Room ID
     * @param {boolean} isHost - Whether user is host
     */
    updateRoom(roomId, isHost = false) {
        this._setElementText('roomCode', roomId || 'Solo');
        
        if (roomId) {
            // Show the chat section and room URL group
            const chatSection = document.getElementById('chatSection');
            const roomUrlGroup = document.getElementById('roomUrlGroup');
            
            if (chatSection) {
                chatSection.style.display = 'block';
            }
            if (roomUrlGroup) {
                roomUrlGroup.style.display = 'block';
            }
            
            const url = new URL(window.location);
            url.searchParams.set('room', roomId);
            this._setElementValue('roomUrl', url.toString());
        } else {
            // Hide chat section and room URL group
            const chatSection = document.getElementById('chatSection');
            const roomUrlGroup = document.getElementById('roomUrlGroup');
            
            if (chatSection) {
                chatSection.style.display = 'none';
            }
            if (roomUrlGroup) {
                roomUrlGroup.style.display = 'none';
            }
        }
    }

    /**
     * Add message to chat
     * @param {string} message - Message text
     * @param {boolean} isOwn - Whether message is from current user
     * @param {string} senderName - Sender name
     */
    addChatMessage(message, isOwn = false, senderName = 'Unknown') {
        if (!this.elements.chatMessages) return;
        const messageEl = document.createElement('div');
        messageEl.className = `message ${isOwn ? 'own' : 'other'}`;
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        messageEl.innerHTML = `
            <div class="message-content">${this._escapeHtml(message)}</div>
            <div class="message-meta">${isOwn ? 'You' : this._escapeHtml(senderName)} • ${time}</div>
        `;
        this.elements.chatMessages.appendChild(messageEl);
        this._scrollToBottom(this.elements.chatMessages);
        // Auto-scroll animation
        messageEl.style.animationDelay = '0.1s';

        // Show chat notification if chat is closed and message is not own
        if (!this.state.chatOpen && !isOwn) {
            this._showChatNotification();
        }
    }

    /**
     * Update settings UI
     * @param {object} settings - Settings object
     */
    updateSettings(settings) {
        // Update toggle states
        this._updateToggle('soundToggle', settings.soundEnabled);
        this._updateToggle('autoBreakToggle', settings.autoBreak);
        this._updateToggle('notificationToggle', settings.notifications);
        
        // Update input values
        this._setElementValue('customDurationInput', settings.customDuration);
        this._setElementValue('userNameInput', settings.userName);
    }

    /**
     * Show toast notification
     * @param {string} message - Message to show
     * @param {string} type - Toast type (info, success, warning, error)
     * @param {number} duration - Display duration in ms
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
     * Get custom duration from input
     * @returns {number} Custom duration in minutes
     */
    getCustomDuration() {
        const value = this.elements.customDurationInput?.value;
        return parseInt(value) || 25;
    }

    /**
     * Set element text content safely
     * @param {string} elementId - Element ID
     * @param {string} text - Text to set
     * @private
     */
    _setElementText(elementId, text) {
        const element = this.elements[elementId];
        if (element) element.textContent = text;
    }

    /**
     * Set element value safely
     * @param {string} elementId - Element ID
     * @param {string} value - Value to set
     * @private
     */
    _setElementValue(elementId, value) {
        const element = this.elements[elementId];
        if (element) element.value = value;
    }

    /**
     * Show element
     * @param {string} elementId - Element ID
     * @private
     */
    _showElement(elementId) {
        const element = this.elements[elementId];
        if (element) element.style.display = '';
    }

    /**
     * Hide element
     * @param {string} elementId - Element ID
     * @private
     */
    _hideElement(elementId) {
        const element = this.elements[elementId];
        if (element) element.style.display = 'none';
    }

    /**
     * Update progress circle
     * @param {number} timeLeft - Time left in seconds
     * @param {number} duration - Total duration in seconds
     * @private
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
     * @param {number} seconds - Seconds to format
     * @returns {string} Formatted time
     * @private
     */
    _formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Update toggle switch state
     * @param {string} toggleId - Toggle element ID
     * @param {boolean} active - Active state
     * @private
     */
    _updateToggle(toggleId, active) {
        const toggle = this.elements[toggleId];
        if (toggle) {
            toggle.classList.toggle('active', active);
        }
    }

    /**
     * Send chat message
     * @private
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
     * @param {string} setting - Setting key
     * @private
     */
    _toggleSetting(setting) {
        this.emit('toggleSetting', { setting });
    }

    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} e - Keyboard event
     * @private
     */
    _handleKeyboardShortcuts(e) {
        // ESC to exit focus mode
        if (e.key === 'Escape' && this.state.focusMode) {
            this.exitFocusMode();
            return;
        }
        
        // Space to start/pause timer (when not in input)
        if (e.key === ' ' && !e.target.matches('input, textarea')) {
            e.preventDefault();
            this.emit('toggleTimer');
            return;
        }
        
        // Enter to send message (when chat input is focused)
        if (e.key === 'Enter' && e.target === this.elements.chatInput) {
            this._sendChatMessage();
            return;
        }
    }

    /**
     * Handle clicks outside panels to close them
     * @param {MouseEvent} e - Click event
     * @private
     */
    _handleOutsideClick(e) {
        // Close settings panel if clicking outside
        if (this.state.settingsOpen && 
            !this.elements.settingsPanel?.contains(e.target) &&
            !this.elements.settingsBtn?.contains(e.target)) {
            this.closeSettings();
        }
    }

    /**
     * Safely add event listener to element
     * @param {string} elementId - Element ID
     * @param {string} event - Event type
     * @param {function} handler - Event handler
     * @private
     */
    _addEventListener(elementId, event, handler) {
        const element = this.elements[elementId];
        if (element) {
            element.addEventListener(event, handler);
        }
    }

    /**
     * Scroll element to bottom
     * @param {HTMLElement} element - Element to scroll
     * @private
     */
    _scrollToBottom(element) {
        if (element) {
            element.scrollTop = element.scrollHeight;
        }
    }

    /**
     * Show chat notification
     * @private
     */
    _showChatNotification() {
        if (!this.elements.chatNotification) return;
        
        const current = parseInt(this.elements.chatNotification.textContent) || 0;
        const newCount = current + 1;
        
        this.elements.chatNotification.textContent = newCount;
        this.elements.chatNotification.style.display = 'block';
        
        // Make chat button pulse
        if (this.elements.chatToggleBtn) {
            this.elements.chatToggleBtn.style.animation = 'pulse 2s infinite';
        }
    }

    /**
     * Clear chat notification
     * @private
     */
    _clearChatNotification() {
        if (this.elements.chatNotification) {
            this.elements.chatNotification.style.display = 'none';
            this.elements.chatNotification.textContent = '0';
        }
        
        // Stop button pulse
        if (this.elements.chatToggleBtn) {
            this.elements.chatToggleBtn.style.animation = '';
        }
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     * @private
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
        // Remove event listeners would go here if we stored them
        this.removeAllListeners();
    }
}

// Export for use in other modules
window.UIModule = UIModule;