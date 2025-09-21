/**
 * TimerModule - Timer functionality with modes
 */

class TimerModule extends EventEmitter {
    constructor() {
        super();
        
        // Timer state
        this.currentMode = 'focus';
        this.previousMode = 'focus';
        this.duration = 1500; // 25 minutes in seconds
        this.timeLeft = this.duration;
        this.isRunning = false;
        this.isPaused = false;
        this.startTime = null;
        this.interval = null;
        
        // Timer modes configuration
        this.modes = {
            focus: { duration: 1500, name: 'Focus Session' },
            'short-break': { duration: 300, name: 'Short Break' },
            'long-break': { duration: 3300, name: 'Long Break' }, // Changed from 900 to 3300 (55 minutes)
            custom: { duration: 1500, name: 'Custom Timer' }
        };
    }

    /**
     * Start the timer
     * @returns {boolean} Success status
     */
    start() {
        if (this.isRunning) return false;
        
        // If timer is at 0, reset to the full duration
        if (this.timeLeft <= 0) {
            this.timeLeft = this.duration;
        }
        
        this.isRunning = true;
        this._setupInterval();
        
        this.emit('start', { 
            mode: this.current, 
            duration: this.duration, 
            timeLeft: this.timeLeft 
        });
        
        return true;
    }

    /**
     * Pause the timer
     * @returns {boolean} Success status
     */
    pause() {
        if (!this.isRunning) return false;
        
        this.isRunning = false;
        clearInterval(this.interval);
        
        this.emit('pause', { 
            mode: this.current, 
            duration: this.duration, 
            timeLeft: this.timeLeft 
        });
        
        return true;
    }

    /**
     * Resume the timer
     * @returns {boolean} Success status
     */
    resume() {
        if (this.isRunning || this.timeLeft <= 0) return false;
        
        this.isRunning = true;
        this._setupInterval();
        
        this.emit('resume', { 
            mode: this.current, 
            duration: this.duration, 
            timeLeft: this.timeLeft 
        });
        
        return true;
    }

    /**
     * Reset the timer
     */
    reset() {
        this.isRunning = false;
        this.isPaused = false;
        this.timeLeft = this.duration;
        this.startTime = null;
        this._clearInterval();
        
        this.emit('reset', {
            mode: this.currentMode,
            duration: this.duration,
            timeLeft: this.timeLeft
        });
    }

    /**
     * Complete the timer (called when time reaches zero)
     */
    complete() {
        this.isRunning = false;
        this.timeLeft = 0;
        this._clearInterval();
        
        this.emit('complete', {
            mode: this.currentMode,
            duration: this.duration
        });
    }

    /**
     * Skip to completion
     */
    skip() {
        if (this.isRunning || this.isPaused) {
            this.complete();
        }
    }

    /**
     * Set timer mode and duration
     * @param {string} mode - Timer mode (focus, short-break, long-break, custom)
     * @param {number} duration - Duration in seconds (optional, uses mode default)
     */
    setMode(mode, duration = null) {
        // Stop current timer
        this._clearInterval();
        
        this.currentMode = mode;
        
        if (duration !== null) {
            this.duration = duration;
            // Update custom mode duration
            if (mode === 'custom') {
                this.modes.custom.duration = duration;
            }
        } else if (this.modes[mode]) {
            this.duration = this.modes[mode].duration;
        }
        
        this.timeLeft = this.duration;
        this.isRunning = false;
        this.isPaused = false;
        this.startTime = null;
        
        this.emit('modeChange', {
            mode: this.currentMode,
            duration: this.duration,
            timeLeft: this.timeLeft
        });
    }

    /**
     * Get current timer state
     * @returns {object} Current timer state
     */
    getState() {
        return {
            mode: this.currentMode,
            duration: this.duration,
            timeLeft: this.timeLeft,
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            startTime: this.startTime,
            timestamp: Date.now()
        };
    }

    /**
     * Set timer state (for synchronization)
     * @param {object} state - Timer state object
     */
    setState(state) {
        this._clearInterval();
        
        this.currentMode = state.mode;
        this.duration = state.duration;
        this.timeLeft = state.timeLeft;
        this.isPaused = state.isPaused;
        this.startTime = state.startTime;
        
        if (state.isRunning && state.startTime) {
            // Calculate current time left based on elapsed time
            const elapsed = (Date.now() - state.startTime) / 1000;
            this.timeLeft = Math.max(0, state.duration - elapsed);
            
            if (this.timeLeft > 0) {
                this.isRunning = true;
                this._startInterval();
            } else {
                this.complete();
            }
        } else {
            this.isRunning = false;
        }

        this.emit('stateSync', this.getState());
    }

    /**
     * Get mode display name
     * @param {string} mode - Mode key
     * @returns {string} Display name
     */
    getModeName(mode = this.currentMode) {
        return this.modes[mode]?.name || 'Unknown Mode';
    }

    /**
     * Get formatted time display
     * @param {number} seconds - Seconds to format
     * @returns {string} Formatted time (MM:SS)
     */
    formatTime(seconds = this.timeLeft) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Get progress percentage
     * @returns {number} Progress percentage (0-100)
     */
    getProgress() {
        return ((this.duration - this.timeLeft) / this.duration) * 100;
    }

    /**
     * Check if timer is active (running or paused)
     * @returns {boolean} True if timer is active
     */
    isActive() {
        return this.isRunning || this.isPaused;
    }

    /**
     * Add time to current timer
     * @param {number} seconds - Seconds to add
     */
    addTime(seconds) {
        this.timeLeft = Math.max(0, this.timeLeft + seconds);
        this.duration += seconds;
        
        this.emit('timeAdjusted', {
            timeLeft: this.timeLeft,
            duration: this.duration,
            adjustment: seconds
        });
    }

    /**
     * Start the internal interval timer
     * @private
     */
    _startInterval() {
        this._clearInterval();
        
        this.interval = setInterval(() => {
            if (this.isRunning) {
                const elapsed = (Date.now() - this.startTime) / 1000;
                this.timeLeft = Math.max(0, this.duration - elapsed);
                
                this.emit('tick', {
                    timeLeft: this.timeLeft,
                    duration: this.duration,
                    mode: this.currentMode,
                    progress: this.getProgress(),
                    formatted: this.formatTime()
                });
                
                if (this.timeLeft <= 0) {
                    this.complete();
                }
            }
        }, 100); // Update every 100ms for smooth animation
    }

    /**
     * Clear the internal interval timer
     * @private
     */
    _clearInterval() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    /**
     * Cleanup timer resources
     */
    destroy() {
        this._clearInterval();
        this.removeAllListeners();
    }
}

// Export for use in other modules
window.TimerModule = TimerModule;