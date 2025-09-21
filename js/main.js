/**
 * Main entry point for StudySync Pro
 * Handles app initialization and global error handling
 */

(function() {
    'use strict';
    
    // Global app instance
    let app = null;
    
    /**
     * Initialize the application
     */
    async function initializeApp() {
        try {
            console.log('🎯 Starting StudySync Pro...');
            
            // Check for required dependencies
            if (!checkDependencies()) {
                throw new Error('Required dependencies not loaded');
            }
            
            // Create and initialize app
            app = new StudySyncApp();
            await app.initialize();
            
            // Store global reference for debugging
            window.studySyncApp = app;
            
            console.log('🚀 StudySync Pro is ready!');
            
        } catch (error) {
            console.error('💥 Failed to initialize StudySync:', error);
            showErrorMessage('Failed to initialize app. Please refresh the page.');
        }
    }
    
    /**
     * Check if all required dependencies are loaded
     * @returns {boolean} Dependencies loaded status
     */
    function checkDependencies() {
        const required = [
            'EventEmitter',
            'TimerModule',
            'FirebaseModule', 
            'StatsModule',
            'SettingsModule',
            'UIModule',
            'AudioModule',
            'StudySyncApp'
        ];
        
        const missing = required.filter(dep => !window[dep]);
        
        if (missing.length > 0) {
            console.error('Missing dependencies:', missing);
            return false;
        }
        
        // Check for Firebase
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK not loaded');
            return false;
        }
        
        return true;
    }
    
    /**
     * Show error message to user
     * @param {string} message - Error message
     */
    function showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
            backdrop-filter: blur(20px);
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
    
    /**
     * Setup global error handling
     */
    function setupErrorHandling() {
        // Handle uncaught JavaScript errors
        window.addEventListener('error', (event) => {
            console.error('Global error:', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
            
            showErrorMessage('An unexpected error occurred. Please refresh the page.');
        });
        
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            
            showErrorMessage('An unexpected error occurred. Please refresh the page.');
            
            // Prevent the default browser behavior
            event.preventDefault();
        });
    }
    
    /**
     * Setup performance monitoring
     */
    function setupPerformanceMonitoring() {
        // Log performance metrics
        window.addEventListener('load', () => {
            if (window.performance && window.performance.timing) {
                const timing = window.performance.timing;
                const loadTime = timing.loadEventEnd - timing.navigationStart;
                const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
                
                console.log('📊 Performance metrics:', {
                    totalLoadTime: `${loadTime}ms`,
                    domReadyTime: `${domReady}ms`,
                    dnsLookup: `${timing.domainLookupEnd - timing.domainLookupStart}ms`,
                    serverResponse: `${timing.responseEnd - timing.requestStart}ms`
                });
            }
        });
        
        // Monitor memory usage (if available)
        if (window.performance && window.performance.memory) {
            setInterval(() => {
                const memory = window.performance.memory;
                console.log('🧠 Memory usage:', {
                    used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
                    total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
                    limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`
                });
            }, 60000); // Log every minute
        }
    }
    
    /**
     * Setup app lifecycle management
     */
    function setupLifecycleManagement() {
        // Handle page unload
        window.addEventListener('beforeunload', () => {
            if (app) {
                app.cleanup();
            }
        });
        
        // Handle page visibility changes for better performance
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('📱 App hidden - reducing background activity');
            } else {
                console.log('👁️ App visible - resuming normal activity');
            }
        });
        
        // Handle online/offline status
        window.addEventListener('online', () => {
            console.log('🌐 App is online');
            if (app && app.ui) {
                app.ui.showToast('Connection restored! 🌐', 'success');
            }
        });
        
        window.addEventListener('offline', () => {
            console.log('📴 App is offline');
            if (app && app.ui) {
                app.ui.showToast('You are offline. Some features may not work.', 'warning');
            }
        });
    }
    
    /**
     * Setup development helpers
     */
    function setupDevelopmentHelpers() {
        // Only in development/debug mode
        if (window.location.hostname === 'localhost' || window.location.search.includes('debug=true')) {
            // Add debug utilities to window
            window.studySyncDebug = {
                getAppStatus: () => app ? app.getStatus() : 'App not initialized',
                getTimerState: () => app ? app.timer.getState() : null,
                getStats: () => app ? app.stats.getStats() : null,
                getSettings: () => app ? app.settings.getAll() : null,
                testAudio: () => app ? app.audio.testAudio() : false,
                simulateTimerComplete: () => app ? app.timer.complete() : null,
                resetAllData: () => {
                    localStorage.clear();
                    location.reload();
                }
            };
            
            console.log('🔧 Debug utilities available at window.studySyncDebug');
        }
    }
    
    /**
     * Show loading indicator
     */
    function showLoadingIndicator() {
        const loader = document.createElement('div');
        loader.id = 'app-loader';
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #0a0f1c 0%, #0f1724 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            color: #e6eef6;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        `;
        
        loader.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 2rem; margin-bottom: 1rem;">🎯</div>
                <div style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; background: linear-gradient(135deg, #3b82f6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">StudySync Pro</div>
                <div style="opacity: 0.7;">Loading...</div>
            </div>
        `;
        
        document.body.appendChild(loader);
        
        // Remove loader when app is ready
        window.addEventListener('load', () => {
            setTimeout(() => {
                const loader = document.getElementById('app-loader');
                if (loader) {
                    loader.style.opacity = '0';
                    loader.style.transition = 'opacity 0.3s ease';
                    setTimeout(() => {
                        if (loader.parentNode) {
                            loader.parentNode.removeChild(loader);
                        }
                    }, 300);
                }
            }, 1000); // Show loader for at least 1 second
        });
    }
    
    /**
     * Main initialization function
     */
    function main() {
        console.log('🎯 StudySync Pro - Enhanced Collaborative Timer');
        console.log('Version: 2.0.0 | Made with ❤️ for students everywhere');
        
        // Setup everything
        setupErrorHandling();
        setupPerformanceMonitoring();
        setupLifecycleManagement();
        setupDevelopmentHelpers();
        
        // Show loading indicator
        showLoadingIndicator();
        
        // Initialize app when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeApp);
        } else {
            // DOM already loaded
            setTimeout(initializeApp, 100);
        }
    }
    
    // Start the application
    main();
    
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Main.js DOMContentLoaded');
        
        // Create app and expose to window for debugging
        window.app = new StudySyncApp();
        
        // Initialize the app
        window.app.initialize().then(() => {
            console.log('App initialized successfully');
        }).catch(error => {
            console.error('App initialization failed:', error);
        });
        
        console.log('App created and initialization started');
    });
    
})();