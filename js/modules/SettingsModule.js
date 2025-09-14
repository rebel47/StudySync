 /**
 * SettingsModule - User preferences and configuration
 */

class SettingsModule extends EventEmitter {
    constructor() {
        super();
        
        // Default settings
        this.defaults = {
            // Audio settings
            soundEnabled: true,
            soundVolume: 0.7,
            notificationSound: 'chime',
            
            // Timer settings
            autoBreak: false,
            autoFocus: false,
            customDuration: 25,
            skipConfirmation: false,
            
            // Notification settings
            notifications: false,
            notificationTitle: true,
            notificationBody: true,
            
            // UI settings
            theme: 'dark',
            animations: true,
            compactMode: false,
            showSeconds: false,
            
            // Focus mode settings
            focusMode: {
                autoEnter: false,
                hideControls: false,
                dimBackground: true,
                blockSites: false
            },
            
            // User preferences
            userName: this._generateRandomName(),
            dailyGoal: 4,
            weeklyGoal: 20,
            preferredBreakActivity: 'walk',
            
            // Data settings
            saveHistory: true,
            syncData: false,
            privacyMode: false
        };
        
        this.settings = { ...this.defaults };
        this.loadSettings();
        
        // Validation rules
        this.validationRules = {
            soundVolume: { min: 0, max: 1, type: 'number' },
            customDuration: { min: 1, max: 180, type: 'number' },
            dailyGoal: { min: 1, max: 20, type: 'number' },
            weeklyGoal: { min: 1, max: 100, type: 'number' },
            userName: { maxLength: 30, type: 'string' },
            theme: { values: ['dark', 'light', 'auto'], type: 'string' },
            notificationSound: { values: ['chime', 'bell', 'soft', 'none'], type: 'string' },
            preferredBreakActivity: { values: ['walk', 'stretch', 'meditate', 'hydrate', 'custom'], type: 'string' }
        };
    }

    /**
     * Get a setting value
     * @param {string} key - Setting key (supports dot notation)
     * @returns {*} Setting value
     */
    get(key) {
        return this._getNestedValue(this.settings, key);
    }

    /**
     * Set a setting value
     * @param {string} key - Setting key (supports dot notation)
     * @param {*} value - Setting value
     * @param {boolean} validate - Whether to validate the value
     * @returns {boolean} Success status
     */
    set(key, value, validate = true) {
        if (validate && !this._validateSetting(key, value)) {
            this.emit('validationError', { key, value, message: 'Invalid setting value' });
            return false;
        }

        const oldValue = this.get(key);
        this._setNestedValue(this.settings, key, value);
        
        this.saveSettings();
        
        this.emit('changed', { key, value, oldValue });
        this.emit(`changed:${key}`, { value, oldValue });
        
        return true;
    }

    /**
     * Get all settings
     * @returns {object} All settings
     */
    getAll() {
        return JSON.parse(JSON.stringify(this.settings));
    }

    /**
     * Set multiple settings at once
     * @param {object} newSettings - Settings object
     * @param {boolean} validate - Whether to validate values
     * @returns {boolean} Success status
     */
    setMultiple(newSettings, validate = true) {
        const changedSettings = {};
        let hasErrors = false;

        for (const [key, value] of Object.entries(newSettings)) {
            if (validate && !this._validateSetting(key, value)) {
                this.emit('validationError', { key, value });
                hasErrors = true;
                continue;
            }

            const oldValue = this.get(key);
            if (oldValue !== value) {
                this._setNestedValue(this.settings, key, value);
                changedSettings[key] = { value, oldValue };
            }
        }

        if (Object.keys(changedSettings).length > 0) {
            this.saveSettings();
            this.emit('multipleChanged', changedSettings);
            
            // Emit individual change events
            for (const [key, { value, oldValue }] of Object.entries(changedSettings)) {
                this.emit('changed', { key, value, oldValue });
                this.emit(`changed:${key}`, { value, oldValue });
            }
        }

        return !hasErrors;
    }

    /**
     * Reset a setting to default
     * @param {string} key - Setting key
     */
    reset(key) {
        const defaultValue = this._getNestedValue(this.defaults, key);
        if (defaultValue !== undefined) {
            this.set(key, defaultValue, false);
            this.emit('reset', { key, value: defaultValue });
        }
    }

    /**
     * Reset all settings to defaults
     */
    resetAll() {
        this.settings = JSON.parse(JSON.stringify(this.defaults));
        this.saveSettings();
        this.emit('resetAll');
        this.emit('multipleChanged', this.settings);
    }

    /**
     * Toggle a boolean setting
     * @param {string} key - Setting key
     * @returns {boolean} New value
     */
    toggle(key) {
        const currentValue = this.get(key);
        if (typeof currentValue === 'boolean') {
            this.set(key, !currentValue);
            return !currentValue;
        }
        return currentValue;
    }

    /**
     * Import settings from object
     * @param {object} importedSettings - Settings to import
     * @param {boolean} merge - Whether to merge with existing settings
     */
    importSettings(importedSettings, merge = true) {
        try {
            let newSettings;
            
            if (merge) {
                newSettings = this._deepMerge(this.settings, importedSettings);
            } else {
                newSettings = { ...this.defaults, ...importedSettings };
            }
            
            // Validate all settings
            const validSettings = {};
            let hasErrors = false;
            
            for (const [key, value] of Object.entries(newSettings)) {
                if (this._validateSetting(key, value)) {
                    validSettings[key] = value;
                } else {
                    hasErrors = true;
                    console.warn(`Invalid setting during import: ${key} = ${value}`);
                }
            }
            
            this.settings = validSettings;
            this.saveSettings();
            
            this.emit('imported', { settings: validSettings, hasErrors });
            this.emit('multipleChanged', validSettings);
            
            return !hasErrors;
        } catch (error) {
            this.emit('importError', error);
            return false;
        }
    }

    /**
     * Export settings as object
     * @param {boolean} includeDefaults - Whether to include default values
     * @returns {object} Settings object
     */
    exportSettings(includeDefaults = false) {
        if (includeDefaults) {
            return this.getAll();
        }
        
        // Only export non-default settings
        const exported = {};
        
        for (const [key, value] of Object.entries(this.settings)) {
            const defaultValue = this._getNestedValue(this.defaults, key);
            if (JSON.stringify(value) !== JSON.stringify(defaultValue)) {
                exported[key] = value;
            }
        }
        
        return exported;
    }

    /**
     * Get setting schema/metadata
     * @param {string} key - Setting key
     * @returns {object} Setting metadata
     */
    getSettingMeta(key) {
        const value = this.get(key);
        const defaultValue = this._getNestedValue(this.defaults, key);
        const validation = this.validationRules[key];
        
        return {
            key,
            value,
            defaultValue,
            type: typeof defaultValue,
            validation,
            isDefault: JSON.stringify(value) === JSON.stringify(defaultValue)
        };
    }

    /**
     * Get all setting categories for UI organization
     * @returns {object} Categorized settings
     */
    getCategories() {
        return {
            audio: {
                title: 'Audio & Notifications',
                settings: ['soundEnabled', 'soundVolume', 'notificationSound', 'notifications']
            },
            timer: {
                title: 'Timer Settings',
                settings: ['autoBreak', 'autoFocus', 'customDuration', 'skipConfirmation']
            },
            interface: {
                title: 'Interface',
                settings: ['theme', 'animations', 'compactMode', 'showSeconds']
            },
            focus: {
                title: 'Focus Mode',
                settings: ['focusMode.autoEnter', 'focusMode.hideControls', 'focusMode.dimBackground']
            },
            personal: {
                title: 'Personal',
                settings: ['userName', 'dailyGoal', 'weeklyGoal', 'preferredBreakActivity']
            },
            privacy: {
                title: 'Privacy & Data',
                settings: ['saveHistory', 'syncData', 'privacyMode']
            }
        };
    }

    /**
     * Check if setting has been modified from default
     * @param {string} key - Setting key
     * @returns {boolean} True if modified
     */
    isModified(key) {
        const current = this.get(key);
        const defaultValue = this._getNestedValue(this.defaults, key);
        return JSON.stringify(current) !== JSON.stringify(defaultValue);
    }

    /**
     * Get count of modified settings
     * @returns {number} Number of modified settings
     */
    getModifiedCount() {
        let count = 0;
        for (const key in this.settings) {
            if (this.isModified(key)) count++;
        }
        return count;
    }

    /**
     * Generate random username
     * @returns {string} Random username
     * @private
     */
    _generateRandomName() {
        const adjectives = ['Smart', 'Focused', 'Productive', 'Efficient', 'Brilliant', 'Dedicated', 'Motivated'];
        const nouns = ['Student', 'Learner', 'Scholar', 'Thinker', 'Achiever', 'Performer', 'Worker'];
        
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        const num = Math.floor(Math.random() * 1000);
        
        return `${adj}${noun}${num}`;
    }

    /**
     * Validate setting value
     * @param {string} key - Setting key
     * @param {*} value - Value to validate
     * @returns {boolean} Valid status
     * @private
     */
    _validateSetting(key, value) {
        const rule = this.validationRules[key];
        if (!rule) return true; // No validation rule = valid
        
        // Type validation
        if (rule.type && typeof value !== rule.type) {
            return false;
        }
        
        // Number validation
        if (rule.type === 'number') {
            if (rule.min !== undefined && value < rule.min) return false;
            if (rule.max !== undefined && value > rule.max) return false;
        }
        
        // String validation
        if (rule.type === 'string') {
            if (rule.maxLength && value.length > rule.maxLength) return false;
            if (rule.values && !rule.values.includes(value)) return false;
        }
        
        return true;
    }

    /**
     * Get nested object value using dot notation
     * @param {object} obj - Object to search
     * @param {string} path - Dot notation path
     * @returns {*} Value or undefined
     * @private
     */
    _getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Set nested object value using dot notation
     * @param {object} obj - Object to modify
     * @param {string} path - Dot notation path
     * @param {*} value - Value to set
     * @private
     */
    _setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            return current[key];
        }, obj);
        target[lastKey] = value;
    }

    /**
     * Deep merge two objects
     * @param {object} target - Target object
     * @param {object} source - Source object
     * @returns {object} Merged object
     * @private
     */
    _deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this._deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            const data = {
                settings: this.settings,
                version: '1.0',
                timestamp: Date.now()
            };
            localStorage.setItem('studysync-settings', JSON.stringify(data));
            this.emit('saved', data);
        } catch (error) {
            console.warn('Failed to save settings:', error);
            this.emit('saveError', error);
        }
    }

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('studysync-settings');
            if (saved) {
                const data = JSON.parse(saved);
                
                // Migrate old settings format if needed
                if (data.settings) {
                    this.settings = { ...this.defaults, ...data.settings };
                } else {
                    // Old format - direct settings object
                    this.settings = { ...this.defaults, ...data };
                }
                
                this.emit('loaded', data);
            }
        } catch (error) {
            console.warn('Failed to load settings:', error);
            this.settings = { ...this.defaults };
            this.emit('loadError', error);
        }
    }

    /**
     * Clear all settings from storage
     */
    clearStorage() {
        try {
            localStorage.removeItem('studysync-settings');
            this.emit('storageCleared');
        } catch (error) {
            this.emit('clearError', error);
        }
    }

    /**
     * Get storage size information
     * @returns {object} Storage information
     */
    getStorageInfo() {
        try {
            const data = localStorage.getItem('studysync-settings');
            const size = data ? new Blob([data]).size : 0;
            
            return {
                size,
                sizeFormatted: this._formatBytes(size),
                exists: !!data,
                itemCount: data ? Object.keys(JSON.parse(data).settings || {}).length : 0
            };
        } catch (error) {
            return {
                size: 0,
                sizeFormatted: '0 B',
                exists: false,
                itemCount: 0,
                error: error.message
            };
        }
    }

    /**
     * Format bytes as human readable string
     * @param {number} bytes - Bytes to format
     * @returns {string} Formatted string
     * @private
     */
    _formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.saveSettings();
        this.removeAllListeners();
    }
}

// Export for use in other modules
window.SettingsModule = SettingsModule;
