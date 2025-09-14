 
/**
 * AudioModule - Audio notifications and sound management
 */

class AudioModule extends EventEmitter {
    constructor() {
        super();
        
        this.audioContext = null;
        this.enabled = true;
        this.volume = 0.7;
        this.soundType = 'chime';
        
        // Sound configurations
        this.sounds = {
            chime: {
                frequencies: [523.25, 659.25, 783.99], // C5, E5, G5
                type: 'sine',
                duration: 0.3,
                interval: 0.15
            },
            bell: {
                frequencies: [440, 554.37, 659.25], // A4, C#5, E5
                type: 'triangle',
                duration: 0.5,
                interval: 0.2
            },
            soft: {
                frequencies: [349.23, 415.30], // F4, G#4
                type: 'sine',
                duration: 0.8,
                interval: 0.3
            },
            success: {
                frequencies: [523.25, 659.25, 783.99, 1046.50], // C5, E5, G5, C6
                type: 'sine',
                duration: 0.2,
                interval: 0.1
            }
        };
        
        this.isPlaying = false;
    }

    /**
     * Initialize audio context
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Handle browser autoplay policy
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            this.emit('initialized');
            return true;
        } catch (error) {
            console.warn('Audio initialization failed:', error);
            this.emit('initError', error);
            return false;
        }
    }

    /**
     * Play notification sound
     * @param {string} type - Sound type (chime, bell, soft, success)
     * @returns {Promise<void>}
     */
    async playNotification(type = this.soundType) {
        if (!this.enabled || this.isPlaying) return;
        
        try {
            await this._ensureAudioContext();
            await this._playSound(type);
            this.emit('notificationPlayed', { type });
        } catch (error) {
            console.warn('Failed to play notification:', error);
            this.emit('playError', error);
        }
    }

    /**
     * Play success sound (for completed sessions)
     * @returns {Promise<void>}
     */
    async playSuccess() {
        await this.playNotification('success');
    }

    /**
     * Play completion sound (for timer completion)
     * @returns {Promise<void>}
     */
    async playCompletion() {
        await this.playNotification(this.soundType);
    }

    /**
     * Play custom tone
     * @param {number} frequency - Frequency in Hz
     * @param {number} duration - Duration in seconds
     * @param {string} type - Oscillator type
     * @returns {Promise<void>}
     */
    async playTone(frequency, duration = 0.3, type = 'sine') {
        if (!this.enabled) return;
        
        try {
            await this._ensureAudioContext();
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            
            // Create envelope
            const now = this.audioContext.currentTime;
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, now + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
            
            oscillator.start(now);
            oscillator.stop(now + duration);
            
            this.emit('tonePlayed', { frequency, duration, type });
        } catch (error) {
            console.warn('Failed to play tone:', error);
        }
    }

    /**
     * Test audio system
     * @returns {Promise<boolean>} Success status
     */
    async testAudio() {
        try {
            await this.playTone(440, 0.2); // A4 note
            return true;
        } catch (error) {
            console.warn('Audio test failed:', error);
            return false;
        }
    }

    /**
     * Set audio enabled state
     * @param {boolean} enabled - Enabled state
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        this.emit('enabledChanged', { enabled });
    }

    /**
     * Set audio volume
     * @param {number} volume - Volume (0-1)
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.emit('volumeChanged', { volume: this.volume });
    }

    /**
     * Set sound type
     * @param {string} type - Sound type
     */
    setSoundType(type) {
        if (this.sounds[type]) {
            this.soundType = type;
            this.emit('soundTypeChanged', { type });
        }
    }

    /**
     * Get available sound types
     * @returns {string[]} Available sound types
     */
    getAvailableSounds() {
        return Object.keys(this.sounds);
    }

    /**
     * Get current settings
     * @returns {object} Current audio settings
     */
    getSettings() {
        return {
            enabled: this.enabled,
            volume: this.volume,
            soundType: this.soundType,
            isSupported: this._isAudioSupported(),
            contextState: this.audioContext?.state || 'not-initialized'
        };
    }

    /**
     * Preload audio context (call on user interaction)
     * @returns {Promise<void>}
     */
    async preload() {
        await this._ensureAudioContext();
        this.emit('preloaded');
    }

    /**
     * Create audio context fade effect
     * @param {number} startVolume - Start volume
     * @param {number} endVolume - End volume
     * @param {number} duration - Fade duration in seconds
     * @returns {Promise<void>}
     */
    async fadeVolume(startVolume, endVolume, duration = 1.0) {
        if (!this.audioContext) return;
        
        const gainNode = this.audioContext.createGain();
        gainNode.connect(this.audioContext.destination);
        
        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(startVolume * this.volume, now);
        gainNode.gain.linearRampToValueAtTime(endVolume * this.volume, now + duration);
        
        this.emit('fadeStarted', { startVolume, endVolume, duration });
        
        return new Promise(resolve => {
            setTimeout(resolve, duration * 1000);
        });
    }

    /**
     * Create binaural beats (experimental)
     * @param {number} baseFreq - Base frequency
     * @param {number} beatFreq - Beat frequency difference
     * @param {number} duration - Duration in seconds
     * @returns {Promise<void>}
     */
    async playBinauralBeats(baseFreq = 440, beatFreq = 10, duration = 60) {
        if (!this.enabled) return;
        
        try {
            await this._ensureAudioContext();
            
            // Left ear
            const oscLeft = this.audioContext.createOscillator();
            const gainLeft = this.audioContext.createGain();
            const merger = this.audioContext.createChannelMerger(2);
            
            // Right ear
            const oscRight = this.audioContext.createOscillator();
            const gainRight = this.audioContext.createGain();
            
            // Connect left channel
            oscLeft.connect(gainLeft);
            gainLeft.connect(merger, 0, 0);
            
            // Connect right channel
            oscRight.connect(gainRight);
            gainRight.connect(merger, 0, 1);
            
            // Connect to destination
            merger.connect(this.audioContext.destination);
            
            // Set frequencies
            oscLeft.frequency.value = baseFreq;
            oscRight.frequency.value = baseFreq + beatFreq;
            
            // Set volume
            const volume = this.volume * 0.1; // Lower volume for binaural beats
            gainLeft.gain.value = volume;
            gainRight.gain.value = volume;
            
            // Start and schedule stop
            const now = this.audioContext.currentTime;
            oscLeft.start(now);
            oscRight.start(now);
            oscLeft.stop(now + duration);
            oscRight.stop(now + duration);
            
            this.emit('binauralBeatsStarted', { baseFreq, beatFreq, duration });
        } catch (error) {
            console.warn('Failed to play binaural beats:', error);
        }
    }

    /**
     * Ensure audio context is initialized and ready
     * @returns {Promise<void>}
     * @private
     */
    async _ensureAudioContext() {
        if (!this.audioContext) {
            await this.initialize();
        }
        
        if (this.audioContext?.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    /**
     * Play a sound configuration
     * @param {string} type - Sound type
     * @returns {Promise<void>}
     * @private
     */
    async _playSound(type) {
        const config = this.sounds[type];
        if (!config) {
            throw new Error(`Unknown sound type: ${type}`);
        }
        
        this.isPlaying = true;
        
        try {
            const promises = config.frequencies.map((freq, index) => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        this._playToneWithConfig(freq, config).then(resolve);
                    }, index * config.interval * 1000);
                });
            });
            
            await Promise.all(promises);
            
            // Add extra delay for the last note to finish
            await new Promise(resolve => {
                setTimeout(resolve, config.duration * 1000);
            });
        } finally {
            this.isPlaying = false;
        }
    }

    /**
     * Play a tone with specific configuration
     * @param {number} frequency - Frequency in Hz
     * @param {object} config - Sound configuration
     * @returns {Promise<void>}
     * @private
     */
    async _playToneWithConfig(frequency, config) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = config.type;
        
        // Create envelope
        const now = this.audioContext.currentTime;
        const attackTime = 0.01;
        const releaseTime = config.duration * 0.3;
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, now + attackTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + config.duration - releaseTime);
        gainNode.gain.linearRampToValueAtTime(0, now + config.duration);
        
        oscillator.start(now);
        oscillator.stop(now + config.duration);
        
        return new Promise(resolve => {
            oscillator.onended = resolve;
        });
    }

    /**
     * Check if audio is supported
     * @returns {boolean} Audio support status
     * @private
     */
    _isAudioSupported() {
        return !!(window.AudioContext || window.webkitAudioContext);
    }

    /**
     * Create white noise generator
     * @param {number} duration - Duration in seconds
     * @returns {Promise<void>}
     */
    async playWhiteNoise(duration = 30) {
        if (!this.enabled) return;
        
        try {
            await this._ensureAudioContext();
            
            const bufferSize = this.audioContext.sampleRate * duration;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const output = buffer.getChannelData(0);
            
            // Generate white noise
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }
            
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = buffer;
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            gainNode.gain.value = this.volume * 0.1; // Very low volume for white noise
            
            source.start();
            
            this.emit('whiteNoiseStarted', { duration });
        } catch (error) {
            console.warn('Failed to play white noise:', error);
        }
    }

    /**
     * Create brown noise generator (more relaxing than white noise)
     * @param {number} duration - Duration in seconds
     * @returns {Promise<void>}
     */
    async playBrownNoise(duration = 30) {
        if (!this.enabled) return;
        
        try {
            await this._ensureAudioContext();
            
            const bufferSize = this.audioContext.sampleRate * duration;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const output = buffer.getChannelData(0);
            
            let lastOut = 0;
            
            // Generate brown noise
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                output[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = output[i];
                output[i] *= 3.5; // Boost volume
            }
            
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = buffer;
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            gainNode.gain.value = this.volume * 0.05;
            
            source.start();
            
            this.emit('brownNoiseStarted', { duration });
        } catch (error) {
            console.warn('Failed to play brown noise:', error);
        }
    }

    /**
     * Stop all current audio
     */
    stopAll() {
        if (this.audioContext) {
            // Create a new audio context to stop all sounds
            this.audioContext.close();
            this.audioContext = null;
            this.isPlaying = false;
            this.emit('allStopped');
        }
    }

    /**
     * Get audio context state information
     * @returns {object} Audio context info
     */
    getAudioInfo() {
        return {
            isSupported: this._isAudioSupported(),
            contextState: this.audioContext?.state || 'not-initialized',
            sampleRate: this.audioContext?.sampleRate || null,
            isPlaying: this.isPlaying,
            settings: this.getSettings()
        };
    }

    /**
     * Cleanup audio resources
     */
    destroy() {
        this.stopAll();
        this.removeAllListeners();
    }
}

// Export for use in other modules
window.AudioModule = AudioModule;