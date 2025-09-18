/**
 * AuthModule - Complete Google Authentication and User Data Management
 * File: js/modules/AuthModule.js
 */

class AuthModule extends EventEmitter {
    constructor() {
        super();
        
        this.user = null;
        this.isAuthenticated = false;
        this.isInitialized = false;
        this.db = null;
        this.auth = null;
        
        // User data structure
        this.userData = {
            profile: {
                uid: null,
                email: null,
                displayName: null,
                photoURL: null,
                createdAt: null,
                lastLoginAt: null
            },
            progress: {
                sessionsCompleted: 0,
                totalFocusTime: 0,
                currentStreak: 0,
                longestStreak: 0,
                totalBreakTime: 0,
                productivityScore: 0,
                level: 1,
                experience: 0
            },
            settings: {
                syncEnabled: true,
                privateProfile: false,
                emailNotifications: true,
                weeklyReports: true
            },
            achievements: [],
            sessionHistory: [],
            joinedRooms: []
        };
        
        // Sync queue for offline operations
        this.syncQueue = [];
        this.isOnline = navigator.onLine;
        
        this.setupOnlineStatusMonitoring();
    }

    /**
     * Initialize Firebase Auth
     */
    async initialize() {
        try {
            if (!firebase || !firebase.auth) {
                throw new Error('Firebase Auth not available');
            }

            this.auth = firebase.auth();
            this.db = firebase.database();
            
            // Set up auth state listener
            this.auth.onAuthStateChanged((user) => {
                this.handleAuthStateChange(user);
            });
            
            // Set up persistence
            await this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
            
            this.isInitialized = true;
            this.emit('initialized');
            
            console.log('Auth module initialized successfully');
            return true;
        } catch (error) {
            console.error('Auth initialization failed:', error);
            this.emit('error', { type: 'initialization', error });
            return false;
        }
    }

    /**
     * Sign in with Google
     */
    async signInWithGoogle() {
        if (!this.isInitialized) {
            this.emit('error', { type: 'notInitialized', message: 'Auth not initialized' });
            return false;
        }

        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');
            provider.setCustomParameters({
                prompt: 'select_account'
            });

            const result = await this.auth.signInWithPopup(provider);
            
            if (result.user) {
                this.emit('signInSuccess', { user: result.user });
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Google sign-in failed:', error);
            this.handleAuthError(error);
            return false;
        }
    }

    /**
     * Sign out user
     */
    async signOut() {
        try {
            await this.syncUserData();
            await this.auth.signOut();
            this.emit('signOutSuccess');
            return true;
        } catch (error) {
            console.error('Sign out failed:', error);
            this.emit('error', { type: 'signOut', error });
            return false;
        }
    }

    /**
     * Handle authentication state changes
     */
    async handleAuthStateChange(user) {
        if (user) {
            this.user = user;
            this.isAuthenticated = true;
            
            await this.loadUserData();
            
            this.emit('authStateChanged', { 
                isAuthenticated: true, 
                user: this.getUserProfile() 
            });
            
            console.log('User signed in:', user.displayName);
        } else {
            this.user = null;
            this.isAuthenticated = false;
            this.resetUserData();
            
            this.emit('authStateChanged', { 
                isAuthenticated: false, 
                user: null 
            });
            
            console.log('User signed out');
        }
    }

    /**
     * Load user data from Firebase
     */
    async loadUserData() {
        if (!this.user) return;

        try {
            const userRef = this.db.ref(`users/${this.user.uid}`);
            const snapshot = await userRef.once('value');
            
            if (snapshot.exists()) {
                const data = snapshot.val();
                this.userData = this.mergeUserData(this.userData, data);
                
                await this.updateLastLogin();
                this.emit('userDataLoaded', this.userData);
            } else {
                await this.createUserProfile();
            }
        } catch (error) {
            console.error('Failed to load user data:', error);
            this.emit('error', { type: 'dataLoad', error });
        }
    }

    /**
     * Create new user profile
     */
    async createUserProfile() {
        if (!this.user) return;

        try {
            const now = Date.now();
            
            this.userData.profile = {
                uid: this.user.uid,
                email: this.user.email,
                displayName: this.user.displayName,
                photoURL: this.user.photoURL,
                createdAt: now,
                lastLoginAt: now
            };
            
            await this.syncUserData();
            
            this.emit('userProfileCreated', this.userData);
            console.log('User profile created for:', this.user.displayName);
        } catch (error) {
            console.error('Failed to create user profile:', error);
            this.emit('error', { type: 'profileCreation', error });
        }
    }

    /**
     * Update user progress data
     */
    async updateProgress(progressData) {
        if (!this.isAuthenticated) return;

        try {
            this.userData.progress = { ...this.userData.progress, ...progressData };
            this.calculateLevelAndExperience();
            await this.checkAchievements();
            
            if (this.isOnline) {
                await this.syncProgress();
            } else {
                this.queueSync('progress', this.userData.progress);
            }
            
            this.emit('progressUpdated', this.userData.progress);
        } catch (error) {
            console.error('Failed to update progress:', error);
            this.emit('error', { type: 'progressUpdate', error });
        }
    }

    /**
     * Add session to history
     */
    async addSession(session) {
        if (!this.isAuthenticated) return;

        try {
            const sessionWithId = {
                ...session,
                id: Date.now().toString(),
                userId: this.user.uid,
                syncedAt: Date.now()
            };
            
            this.userData.sessionHistory.unshift(sessionWithId);
            
            if (this.userData.sessionHistory.length > 100) {
                this.userData.sessionHistory = this.userData.sessionHistory.slice(0, 100);
            }
            
            await this.updateProgressFromSession(session);
            
            if (this.isOnline) {
                await this.syncSessionHistory();
            } else {
                this.queueSync('sessionHistory', this.userData.sessionHistory);
            }
            
            this.emit('sessionAdded', sessionWithId);
        } catch (error) {
            console.error('Failed to add session:', error);
            this.emit('error', { type: 'sessionAdd', error });
        }
    }

    /**
     * Update progress from session data
     */
    async updateProgressFromSession(session) {
        const updates = {};
        
        if (session.mode === 'focus' && session.completed) {
            updates.sessionsCompleted = (this.userData.progress.sessionsCompleted || 0) + 1;
            updates.totalFocusTime = (this.userData.progress.totalFocusTime || 0) + session.duration;
            
            // Update streak
            const today = new Date().toDateString();
            const lastSession = this.userData.sessionHistory.find(s => 
                s.mode === 'focus' && s.completed && s.date === today
            );
            
            if (!lastSession) {
                const yesterday = new Date(Date.now() - 86400000).toDateString();
                const yesterdaySession = this.userData.sessionHistory.find(s => 
                    s.mode === 'focus' && s.completed && s.date === yesterday
                );
                
                if (yesterdaySession) {
                    updates.currentStreak = (this.userData.progress.currentStreak || 0) + 1;
                } else {
                    updates.currentStreak = 1;
                }
                
                updates.longestStreak = Math.max(
                    this.userData.progress.longestStreak || 0,
                    updates.currentStreak
                );
            }
        } else if (session.mode.includes('break') && session.completed) {
            updates.totalBreakTime = (this.userData.progress.totalBreakTime || 0) + session.duration;
        }
        
        updates.productivityScore = this.calculateProductivityScore();
        await this.updateProgress(updates);
    }

    /**
     * Calculate user level and experience
     */
    calculateLevelAndExperience() {
        const sessions = this.userData.progress.sessionsCompleted || 0;
        const focusHours = Math.floor((this.userData.progress.totalFocusTime || 0) / 3600);
        
        const experience = (sessions * 10) + (focusHours * 50);
        
        let level = 1;
        let requiredXP = 100;
        let totalXP = 0;
        
        while (totalXP + requiredXP <= experience) {
            totalXP += requiredXP;
            level++;
            requiredXP += 50;
        }
        
        this.userData.progress.level = level;
        this.userData.progress.experience = experience;
    }

    /**
     * Calculate productivity score
     */
    calculateProductivityScore() {
        const sessions = this.userData.progress.sessionsCompleted || 0;
        const focusTime = this.userData.progress.totalFocusTime || 0;
        const streak = this.userData.progress.currentStreak || 0;
        
        const sessionScore = Math.min(40, sessions * 2);
        const timeScore = Math.min(40, focusTime / 3600);
        const streakScore = Math.min(20, streak * 2);
        
        return Math.round(sessionScore + timeScore + streakScore);
    }

    /**
     * Check for new achievements
     */
    async checkAchievements() {
        const newAchievements = [];
        const existing = this.userData.achievements.map(a => a.id);
        
        const achievements = [
            {
                id: 'first_session',
                title: 'Getting Started',
                description: 'Complete your first focus session',
                icon: '🎯',
                check: () => this.userData.progress.sessionsCompleted >= 1
            },
            {
                id: 'session_10',
                title: 'Focus Fighter',
                description: 'Complete 10 focus sessions',
                icon: '💪',
                check: () => this.userData.progress.sessionsCompleted >= 10
            },
            {
                id: 'session_50',
                title: 'Productivity Pro',
                description: 'Complete 50 focus sessions',
                icon: '🏆',
                check: () => this.userData.progress.sessionsCompleted >= 50
            },
            {
                id: 'streak_7',
                title: 'Week Warrior',
                description: 'Maintain a 7-day streak',
                icon: '🔥',
                check: () => this.userData.progress.currentStreak >= 7
            },
            {
                id: 'time_10h',
                title: 'Deep Work Master',
                description: 'Accumulate 10 hours of focus time',
                icon: '🧠',
                check: () => this.userData.progress.totalFocusTime >= 36000
            },
            {
                id: 'level_5',
                title: 'Rising Star',
                description: 'Reach level 5',
                icon: '⭐',
                check: () => this.userData.progress.level >= 5
            }
        ];
        
        for (const achievement of achievements) {
            if (!existing.includes(achievement.id) && achievement.check()) {
                const newAchievement = {
                    ...achievement,
                    unlockedAt: Date.now()
                };
                
                this.userData.achievements.push(newAchievement);
                newAchievements.push(newAchievement);
            }
        }
        
        if (newAchievements.length > 0) {
            this.emit('achievementsUnlocked', newAchievements);
            
            if (this.isOnline) {
                await this.syncAchievements();
            } else {
                this.queueSync('achievements', this.userData.achievements);
            }
        }
    }

    /**
     * Sync user data to Firebase
     */
    async syncUserData() {
        if (!this.isAuthenticated || !this.isOnline) return;

        try {
            const userRef = this.db.ref(`users/${this.user.uid}`);
            await userRef.set({
                ...this.userData,
                lastSyncAt: Date.now()
            });
            
            this.syncQueue = [];
            this.emit('dataSynced');
        } catch (error) {
            console.error('Failed to sync user data:', error);
            this.emit('error', { type: 'sync', error });
        }
    }

    /**
     * Sync specific data sections
     */
    async syncProgress() {
        if (!this.isAuthenticated || !this.isOnline) return;
        
        try {
            const progressRef = this.db.ref(`users/${this.user.uid}/progress`);
            await progressRef.set(this.userData.progress);
        } catch (error) {
            console.error('Failed to sync progress:', error);
        }
    }

    async syncSessionHistory() {
        if (!this.isAuthenticated || !this.isOnline) return;
        
        try {
            const historyRef = this.db.ref(`users/${this.user.uid}/sessionHistory`);
            await historyRef.set(this.userData.sessionHistory);
        } catch (error) {
            console.error('Failed to sync session history:', error);
        }
    }

    async syncAchievements() {
        if (!this.isAuthenticated || !this.isOnline) return;
        
        try {
            const achievementsRef = this.db.ref(`users/${this.user.uid}/achievements`);
            await achievementsRef.set(this.userData.achievements);
        } catch (error) {
            console.error('Failed to sync achievements:', error);
        }
    }

    /**
     * Update last login timestamp
     */
    async updateLastLogin() {
        if (!this.isAuthenticated) return;
        
        try {
            const loginRef = this.db.ref(`users/${this.user.uid}/profile/lastLoginAt`);
            await loginRef.set(Date.now());
        } catch (error) {
            console.error('Failed to update last login:', error);
        }
    }

    /**
     * Queue sync operation for offline mode
     */
    queueSync(type, data) {
        this.syncQueue.push({
            type,
            data,
            timestamp: Date.now()
        });
        
        if (this.syncQueue.length > 50) {
            this.syncQueue = this.syncQueue.slice(-50);
        }
    }

    /**
     * Process sync queue when coming back online
     */
    async processSyncQueue() {
        if (!this.isAuthenticated || !this.isOnline || this.syncQueue.length === 0) return;
        
        try {
            const grouped = {};
            for (const item of this.syncQueue) {
                grouped[item.type] = item.data;
            }
            
            for (const [type, data] of Object.entries(grouped)) {
                const ref = this.db.ref(`users/${this.user.uid}/${type}`);
                await ref.set(data);
            }
            
            this.syncQueue = [];
            this.emit('syncQueueProcessed');
        } catch (error) {
            console.error('Failed to process sync queue:', error);
        }
    }

    /**
     * Setup online status monitoring
     */
    setupOnlineStatusMonitoring() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.emit('onlineStatusChanged', { online: true });
            this.processSyncQueue();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.emit('onlineStatusChanged', { online: false });
        });
    }

    /**
     * Handle authentication errors
     */
    handleAuthError(error) {
        let message = 'Authentication failed';
        
        switch (error.code) {
            case 'auth/popup-closed-by-user':
                message = 'Sign-in was cancelled';
                break;
            case 'auth/popup-blocked':
                message = 'Pop-up was blocked. Please allow pop-ups for this site';
                break;
            case 'auth/network-request-failed':
                message = 'Network error. Please check your connection';
                break;
            case 'auth/too-many-requests':
                message = 'Too many attempts. Please try again later';
                break;
            default:
                message = error.message || 'Authentication failed';
        }
        
        this.emit('authError', { code: error.code, message });
    }

    /**
     * Merge user data safely
     */
    mergeUserData(defaultData, loadedData) {
        const merged = JSON.parse(JSON.stringify(defaultData));
        
        for (const [key, value] of Object.entries(loadedData)) {
            if (merged[key] && typeof merged[key] === 'object' && !Array.isArray(merged[key])) {
                merged[key] = { ...merged[key], ...value };
            } else {
                merged[key] = value;
            }
        }
        
        return merged;
    }

    /**
     * Reset user data to defaults
     */
    resetUserData() {
        this.userData = {
            profile: {
                uid: null,
                email: null,
                displayName: null,
                photoURL: null,
                createdAt: null,
                lastLoginAt: null
            },
            progress: {
                sessionsCompleted: 0,
                totalFocusTime: 0,
                currentStreak: 0,
                longestStreak: 0,
                totalBreakTime: 0,
                productivityScore: 0,
                level: 1,
                experience: 0
            },
            settings: {
                syncEnabled: true,
                privateProfile: false,
                emailNotifications: true,
                weeklyReports: true
            },
            achievements: [],
            sessionHistory: [],
            joinedRooms: []
        };
    }

    /**
     * Get user profile information
     */
    getUserProfile() {
        return this.isAuthenticated ? this.userData.profile : null;
    }

    /**
     * Get user progress data
     */
    getUserProgress() {
        return this.userData.progress;
    }

    /**
     * Get user achievements
     */
    getUserAchievements() {
        return this.userData.achievements;
    }

    /**
     * Get user session history
     */
    getUserSessions(limit = 20) {
        return this.userData.sessionHistory.slice(0, limit);
    }

    /**
     * Get authentication status
     */
    getAuthStatus() {
        return {
            isAuthenticated: this.isAuthenticated,
            isInitialized: this.isInitialized,
            user: this.getUserProfile(),
            isOnline: this.isOnline,
            syncQueueLength: this.syncQueue.length
        };
    }

    /**
     * Export user data
     */
    exportUserData() {
        return {
            ...this.userData,
            exportedAt: Date.now(),
            exportVersion: '1.0'
        };
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.removeAllListeners();
        
        if (this.auth) {
            this.auth = null;
        }
        
        this.db = null;
        this.user = null;
        this.isAuthenticated = false;
        this.isInitialized = false;
    }
}

// Export for use in other modules
window.AuthModule = AuthModule;