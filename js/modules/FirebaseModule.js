 
/**
 * FirebaseModule - Real-time database operations
 */

class FirebaseModule extends EventEmitter {
    constructor() {
        super();
        
        this.db = null;
        this.isInitialized = false;
        this.roomRef = null;
        this.currentRoomId = null;
        this.isConnected = false;
        
        // Connection monitoring
        this.connectionRef = null;
        this.heartbeatInterval = null;
        this.heartbeatDelay = 5000; // 5 seconds
    }

    /**
     * Initialize Firebase
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        try {
            if (!window.firebaseConfig) {
                throw new Error('Firebase config not found');
            }

            // Initialize Firebase app
            firebase.initializeApp(window.firebaseConfig);
            this.db = firebase.database();
            
            // Monitor connection status
            this._setupConnectionMonitoring();
            
            this.isInitialized = true;
            this.emit('initialized');
            
            console.log('Firebase initialized successfully');
            return true;
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            this.emit('error', { type: 'initialization', error });
            return false;
        }
    }

    /**
     * Create a new room
     * @param {string} roomId - Room identifier
     * @param {string} hostId - Host user ID
     * @param {object} initialData - Initial room data
     * @returns {Promise<boolean>} Success status
     */
    async createRoom(roomId, hostId, initialData) {
        if (!this.isInitialized) {
            this.emit('error', { type: 'notInitialized', message: 'Firebase not initialized' });
            return false;
        }

        try {
            this.roomRef = this.db.ref(`rooms/${roomId}`);
            
            const roomData = {
                created: firebase.database.ServerValue.TIMESTAMP,
                host: hostId,
                lastActivity: firebase.database.ServerValue.TIMESTAMP,
                ...initialData
            };

            await this.roomRef.set(roomData);
            this.currentRoomId = roomId;
            
            this._setupRoomListeners();
            this._startHeartbeat(roomId, hostId);
            
            this.emit('roomCreated', { roomId, hostId });
            return true;
        } catch (error) {
            console.error('Error creating room:', error);
            this.emit('error', { type: 'roomCreation', error, roomId });
            return false;
        }
    }

    /**
     * Join an existing room
     * @param {string} roomId - Room identifier
     * @param {string} userId - User ID
     * @param {object} userData - User data
     * @returns {Promise<boolean>} Success status
     */
    async joinRoom(roomId, userId, userData) {
        if (!this.isInitialized) {
            this.emit('error', { type: 'notInitialized', message: 'Firebase not initialized' });
            return false;
        }

        try {
            this.roomRef = this.db.ref(`rooms/${roomId}`);
            
            // Check if room exists
            const roomSnapshot = await this.roomRef.once('value');
            if (!roomSnapshot.exists()) {
                this.emit('error', { type: 'roomNotFound', roomId });
                return false;
            }

            // Add user to participants
            await this.roomRef.child('participants').child(userId).set({
                ...userData,
                joinedAt: firebase.database.ServerValue.TIMESTAMP,
                lastSeen: firebase.database.ServerValue.TIMESTAMP
            });

            this.currentRoomId = roomId;
            this._setupRoomListeners();
            this._startHeartbeat(roomId, userId);
            
            this.emit('roomJoined', { roomId, userId });
            return true;
        } catch (error) {
            console.error('Error joining room:', error);
            this.emit('error', { type: 'roomJoin', error, roomId });
            return false;
        }
    }

    /**
     * Leave current room
     * @param {string} userId - User ID
     */
    async leaveRoom(userId) {
        if (!this.roomRef || !userId) return;

        try {
            // Remove user from participants
            await this.roomRef.child('participants').child(userId).remove();
            
            this._cleanup();
            this.emit('roomLeft', { roomId: this.currentRoomId, userId });
        } catch (error) {
            console.error('Error leaving room:', error);
            this.emit('error', { type: 'roomLeave', error });
        }
    }

    /**
     * Update timer state in Firebase
     * @param {object} timerState - Timer state object
     */
    async updateTimer(timerState) {
        if (!this.roomRef) return;

        try {
            await this.roomRef.child('timer').update({
                ...timerState,
                lastUpdate: firebase.database.ServerValue.TIMESTAMP
            });
        } catch (error) {
            console.warn('Failed to update timer state:', error);
            this.emit('error', { type: 'timerUpdate', error });
        }
    }

    /**
     * Send chat message
     * @param {object} messageData - Message data
     */
    async sendMessage(messageData) {
        if (!this.roomRef) return;

        try {
            await this.roomRef.child('chat').child('messages').push({
                ...messageData,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
        } catch (error) {
            console.error('Failed to send message:', error);
            this.emit('error', { type: 'messageSend', error });
        }
    }

    /**
     * Update user heartbeat
     * @param {string} userId - User ID
     */
    async updateHeartbeat(userId) {
        if (!this.roomRef || !userId) return;

        try {
            await this.roomRef.child('participants').child(userId).update({
                lastSeen: firebase.database.ServerValue.TIMESTAMP
            });
        } catch (error) {
            console.warn('Heartbeat update failed:', error);
        }
    }

    /**
     * Update room host
     * @param {string} newHostId - New host user ID
     */
    async updateHost(newHostId) {
        if (!this.roomRef) return;

        try {
            await this.roomRef.update({
                host: newHostId,
                lastActivity: firebase.database.ServerValue.TIMESTAMP
            });

            await this.roomRef.child('participants').child(newHostId).update({
                isHost: true
            });

            this.emit('hostChanged', { newHostId, roomId: this.currentRoomId });
        } catch (error) {
            console.error('Failed to update host:', error);
            this.emit('error', { type: 'hostUpdate', error });
        }
    }

    /**
     * Get room data once
     * @param {string} roomId - Room identifier
     * @returns {Promise<object|null>} Room data or null
     */
    async getRoomData(roomId) {
        if (!this.isInitialized) return null;

        try {
            const snapshot = await this.db.ref(`rooms/${roomId}`).once('value');
            return snapshot.exists() ? snapshot.val() : null;
        } catch (error) {
            console.error('Failed to get room data:', error);
            return null;
        }
    }

    /**
     * Check if room exists
     * @param {string} roomId - Room identifier
     * @returns {Promise<boolean>} Room exists status
     */
    async roomExists(roomId) {
        const data = await this.getRoomData(roomId);
        return data !== null;
    }

    /**
     * Setup room event listeners
     * @private
     */
    _setupRoomListeners() {
        if (!this.roomRef) return;

        // Timer state changes
        this.roomRef.child('timer').on('value', (snapshot) => {
            const timerData = snapshot.val();
            if (timerData) {
                this.emit('timerSync', timerData);
            }
        });

        // Participants changes
        this.roomRef.child('participants').on('value', (snapshot) => {
            const participants = snapshot.val() || {};
            this.emit('participantsUpdate', participants);
        });

        // New chat messages
        this.roomRef.child('chat').child('messages').on('child_added', (snapshot) => {
            const message = snapshot.val();
            if (message) {
                this.emit('messageReceived', {
                    id: snapshot.key,
                    ...message
                });
            }
        });

        // Room metadata changes
        this.roomRef.on('value', (snapshot) => {
            const roomData = snapshot.val();
            if (roomData) {
                this.emit('roomDataUpdate', roomData);
            } else {
                // Room was deleted
                this.emit('roomDeleted', { roomId: this.currentRoomId });
                this._cleanup();
            }
        });
    }

    /**
     * Setup connection monitoring
     * @private
     */
    _setupConnectionMonitoring() {
        this.connectionRef = this.db.ref('.info/connected');
        
        this.connectionRef.on('value', (snapshot) => {
            const connected = snapshot.val();
            this.isConnected = connected;
            
            this.emit('connectionChange', { connected });
            
            if (connected) {
                console.log('Connected to Firebase');
            } else {
                console.log('Disconnected from Firebase');
            }
        });
    }

    /**
     * Start heartbeat for user presence
     * @param {string} roomId - Room identifier
     * @param {string} userId - User ID
     * @private
     */
    _startHeartbeat(roomId, userId) {
        this._stopHeartbeat();
        
        this.heartbeatInterval = setInterval(async () => {
            await this.updateHeartbeat(userId);
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
     * Cleanup Firebase references and listeners
     * @private
     */
    _cleanup() {
        if (this.roomRef) {
            this.roomRef.off();
            this.roomRef = null;
        }
        
        this._stopHeartbeat();
        this.currentRoomId = null;
    }

    /**
     * Get connection status
     * @returns {boolean} Connection status
     */
    getConnectionStatus() {
        return this.isConnected;
    }

    /**
     * Get current room ID
     * @returns {string|null} Current room ID
     */
    getCurrentRoomId() {
        return this.currentRoomId;
    }

    /**
     * Check if user is in a room
     * @returns {boolean} In room status
     */
    isInRoom() {
        return this.currentRoomId !== null;
    }

    /**
     * Cleanup all resources
     */
    destroy() {
        this._cleanup();
        
        if (this.connectionRef) {
            this.connectionRef.off();
            this.connectionRef = null;
        }
        
        this.removeAllListeners();
        
        if (this.db) {
            // Firebase doesn't have a direct cleanup method
            // but we can clear our reference
            this.db = null;
        }
        
        this.isInitialized = false;
    }
}

// Export for use in other modules
window.FirebaseModule = FirebaseModule;