 
/**
 * StatsModule - Session tracking and productivity metrics
 */

class StatsModule extends EventEmitter {
    constructor() {
        super();
        
        // Daily stats
        this.todayStats = {
            sessions: 0,
            focusTime: 0, // in seconds
            breakTime: 0, // in seconds
            streak: 0,
            lastSessionDate: null,
            startTime: null
        };
        
        // All-time stats
        this.allTimeStats = {
            totalSessions: 0,
            totalFocusTime: 0,
            totalBreakTime: 0,
            longestStreak: 0,
            averageSessionLength: 0,
            firstSessionDate: null
        };
        
        // Session history
        this.sessionHistory = [];
        this.maxHistoryLength = 100;
        
        this.loadStats();
        this._resetDailyStatsIfNewDay();
    }

    /**
     * Add a completed session
     * @param {string} mode - Session mode (focus, short-break, long-break)
     * @param {number} duration - Session duration in seconds
     * @param {boolean} completed - Whether session was completed or skipped
     */
    addSession(mode, duration, completed = true) {
        const today = new Date().toDateString();
        const now = new Date();
        
        // Reset daily stats if new day
        if (this.todayStats.lastSessionDate !== today) {
            this._resetDailyStats(today);
        }

        // Create session record
        const session = {
            mode,
            duration,
            completed,
            timestamp: now.getTime(),
            date: today
        };

        // Update session history
        this.sessionHistory.unshift(session);
        if (this.sessionHistory.length > this.maxHistoryLength) {
            this.sessionHistory = this.sessionHistory.slice(0, this.maxHistoryLength);
        }

        // Update stats based on mode
        if (mode === 'focus') {
            this.todayStats.sessions++;
            this.allTimeStats.totalSessions++;
            
            if (completed) {
                this.todayStats.focusTime += duration;
                this.allTimeStats.totalFocusTime += duration;
                this._updateStreak();
            }
        } else if (mode.includes('break')) {
            if (completed) {
                this.todayStats.breakTime += duration;
                this.allTimeStats.totalBreakTime += duration;
            }
        }

        // Update all-time stats
        this._updateAllTimeStats();
        
        // Save and emit update
        this.saveStats();
        this.emit('sessionAdded', { session, stats: this.getStats() });
        this.emit('updated', this.getStats());
    }

    /**
     * Start a session timer
     * @param {string} mode - Session mode
     */
    startSession(mode) {
        this.todayStats.startTime = Date.now();
        
        this.emit('sessionStarted', { 
            mode, 
            startTime: this.todayStats.startTime 
        });
    }

    /**
     * End current session
     * @param {string} mode - Session mode
     * @param {boolean} completed - Whether session was completed
     */
    endSession(mode, completed = true) {
        if (!this.todayStats.startTime) return;
        
        const duration = Math.floor((Date.now() - this.todayStats.startTime) / 1000);
        this.todayStats.startTime = null;
        
        this.addSession(mode, duration, completed);
        
        this.emit('sessionEnded', { 
            mode, 
            duration, 
            completed 
        });
    }

    /**
     * Get current statistics
     * @returns {object} Current stats object
     */
    getStats() {
        const productivityScore = this._calculateProductivityScore();
        const focusTimeHours = Math.round(this.todayStats.focusTime / 3600 * 10) / 10;
        
        return {
            // Today's stats
            sessions: this.todayStats.sessions,
            focusTime: focusTimeHours,
            focusTimeSeconds: this.todayStats.focusTime,
            breakTime: this.todayStats.breakTime,
            streak: this.todayStats.streak,
            productivityScore,
            
            // All-time stats
            totalSessions: this.allTimeStats.totalSessions,
            totalFocusTime: this.allTimeStats.totalFocusTime,
            totalBreakTime: this.allTimeStats.totalBreakTime,
            longestStreak: this.allTimeStats.longestStreak,
            averageSessionLength: this.allTimeStats.averageSessionLength,
            
            // Additional metrics
            sessionHistory: this.sessionHistory.slice(0, 10), // Last 10 sessions
            isActiveSession: this.todayStats.startTime !== null
        };
    }

    /**
     * Get weekly stats
     * @returns {object} Weekly statistics
     */
    getWeeklyStats() {
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const weekSessions = this.sessionHistory.filter(s => s.timestamp >= oneWeekAgo);
        
        const weeklyFocusTime = weekSessions
            .filter(s => s.mode === 'focus' && s.completed)
            .reduce((total, s) => total + s.duration, 0);
        
        const dailyStats = {};
        for (let i = 0; i < 7; i++) {
            const date = new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toDateString();
            const daySessions = weekSessions.filter(s => s.date === date);
            
            dailyStats[date] = {
                sessions: daySessions.filter(s => s.mode === 'focus').length,
                focusTime: daySessions
                    .filter(s => s.mode === 'focus' && s.completed)
                    .reduce((total, s) => total + s.duration, 0)
            };
        }
        
        return {
            totalSessions: weekSessions.filter(s => s.mode === 'focus').length,
            totalFocusTime: weeklyFocusTime,
            averageDailyFocus: weeklyFocusTime / 7,
            dailyBreakdown: dailyStats
        };
    }

    /**
     * Get productivity insights
     * @returns {object} Productivity insights
     */
    getInsights() {
        const stats = this.getStats();
        const insights = [];
        
        // Streak insights
        if (stats.streak >= 7) {
            insights.push({
                type: 'achievement',
                title: 'Week Warrior!',
                description: `Amazing! You've maintained a ${stats.streak}-day streak!`,
                icon: '🔥'
            });
        } else if (stats.streak >= 3) {
            insights.push({
                type: 'progress',
                title: 'Building Momentum',
                description: `Great job! ${stats.streak} days in a row. Keep going!`,
                icon: '⭐'
            });
        }
        
        // Daily goal insights
        const dailyGoal = 4; // 4 focus sessions per day
        if (stats.sessions >= dailyGoal) {
            insights.push({
                type: 'achievement',
                title: 'Daily Goal Achieved!',
                description: `You've completed ${stats.sessions} focus sessions today!`,
                icon: '🎯'
            });
        } else if (stats.sessions > 0) {
            const remaining = dailyGoal - stats.sessions;
            insights.push({
                type: 'motivation',
                title: 'Keep Going!',
                description: `${remaining} more session${remaining > 1 ? 's' : ''} to reach your daily goal.`,
                icon: '💪'
            });
        }
        
        // Focus time insights
        if (stats.focusTime >= 4) {
            insights.push({
                type: 'achievement',
                title: 'Deep Work Master',
                description: `${stats.focusTime} hours of focused work today!`,
                icon: '🧠'
            });
        }
        
        // Productivity score insights
        if (stats.productivityScore >= 80) {
            insights.push({
                type: 'achievement',
                title: 'Highly Productive',
                description: `${stats.productivityScore}% productivity score today!`,
                icon: '🚀'
            });
        }
        
        return insights;
    }

    /**
     * Reset all statistics
     */
    resetStats() {
        this.todayStats = {
            sessions: 0,
            focusTime: 0,
            breakTime: 0,
            streak: 0,
            lastSessionDate: null,
            startTime: null
        };
        
        this.allTimeStats = {
            totalSessions: 0,
            totalFocusTime: 0,
            totalBreakTime: 0,
            longestStreak: 0,
            averageSessionLength: 0,
            firstSessionDate: null
        };
        
        this.sessionHistory = [];
        
        this.saveStats();
        this.emit('statsReset');
        this.emit('updated', this.getStats());
    }

    /**
     * Export stats data
     * @returns {object} All stats data
     */
    exportData() {
        return {
            todayStats: this.todayStats,
            allTimeStats: this.allTimeStats,
            sessionHistory: this.sessionHistory,
            exportDate: new Date().toISOString()
        };
    }

    /**
     * Import stats data
     * @param {object} data - Stats data to import
     */
    importData(data) {
        if (data.todayStats) this.todayStats = { ...this.todayStats, ...data.todayStats };
        if (data.allTimeStats) this.allTimeStats = { ...this.allTimeStats, ...data.allTimeStats };
        if (data.sessionHistory) this.sessionHistory = data.sessionHistory;
        
        this.saveStats();
        this.emit('dataImported', data);
        this.emit('updated', this.getStats());
    }

    /**
     * Calculate productivity score
     * @returns {number} Productivity score (0-100)
     * @private
     */
    _calculateProductivityScore() {
        const dailyGoal = 4; // 4 focus sessions
        const timeGoal = 2 * 60 * 60; // 2 hours in seconds
        
        const sessionScore = Math.min(100, (this.todayStats.sessions / dailyGoal) * 50);
        const timeScore = Math.min(100, (this.todayStats.focusTime / timeGoal) * 50);
        
        return Math.round(sessionScore + timeScore);
    }

    /**
     * Update streak count
     * @private
     */
    _updateStreak() {
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        if (this.todayStats.lastSessionDate === today) {
            // First session of the day - check if we had sessions yesterday
            if (this.todayStats.sessions === 1) {
                const yesterdaySession = this.sessionHistory.find(s => 
                    s.date === yesterday && s.mode === 'focus' && s.completed
                );
                
                if (yesterdaySession) {
                    this.todayStats.streak++;
                } else {
                    this.todayStats.streak = 1;
                }
            }
        }
        
        // Update longest streak
        if (this.todayStats.streak > this.allTimeStats.longestStreak) {
            this.allTimeStats.longestStreak = this.todayStats.streak;
        }
    }

    /**
     * Update all-time statistics
     * @private
     */
    _updateAllTimeStats() {
        // Calculate average session length
        const focusSessions = this.sessionHistory.filter(s => 
            s.mode === 'focus' && s.completed
        );
        
        if (focusSessions.length > 0) {
            const totalDuration = focusSessions.reduce((sum, s) => sum + s.duration, 0);
            this.allTimeStats.averageSessionLength = Math.round(totalDuration / focusSessions.length);
        }
        
        // Set first session date
        if (this.sessionHistory.length > 0 && !this.allTimeStats.firstSessionDate) {
            const oldestSession = this.sessionHistory[this.sessionHistory.length - 1];
            this.allTimeStats.firstSessionDate = oldestSession.date;
        }
    }

    /**
     * Reset daily stats for new day
     * @param {string} today - Today's date string
     * @private
     */
    _resetDailyStats(today) {
        // Preserve streak if we had sessions yesterday
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        const hadYesterdaySession = this.sessionHistory.some(s => 
            s.date === yesterday && s.mode === 'focus' && s.completed
        );
        
        if (!hadYesterdaySession && this.todayStats.lastSessionDate !== yesterday) {
            this.todayStats.streak = 0; // Break streak if no session yesterday
        }
        
        this.todayStats.sessions = 0;
        this.todayStats.focusTime = 0;
        this.todayStats.breakTime = 0;
        this.todayStats.lastSessionDate = today;
        this.todayStats.startTime = null;
    }

    /**
     * Check and reset daily stats if new day
     * @private
     */
    _resetDailyStatsIfNewDay() {
        const today = new Date().toDateString();
        if (this.todayStats.lastSessionDate !== today) {
            this._resetDailyStats(today);
            this.saveStats();
        }
    }

    /**
     * Save stats to localStorage
     */
    saveStats() {
        try {
            const data = {
                todayStats: this.todayStats,
                allTimeStats: this.allTimeStats,
                sessionHistory: this.sessionHistory
            };
            localStorage.setItem('studysync-stats', JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to save stats:', error);
        }
    }

    /**
     * Load stats from localStorage
     */
    loadStats() {
        try {
            const saved = localStorage.getItem('studysync-stats');
            if (saved) {
                const data = JSON.parse(saved);
                
                this.todayStats = { ...this.todayStats, ...data.todayStats };
                this.allTimeStats = { ...this.allTimeStats, ...data.allTimeStats };
                this.sessionHistory = data.sessionHistory || [];
            }
        } catch (error) {
            console.warn('Failed to load stats:', error);
        }
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.saveStats();
        this.removeAllListeners();
    }
}

// Export for use in other modules
window.StatsModule = StatsModule;