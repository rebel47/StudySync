/**
 * TimerModule - Timer functionality with modes
 */

class TimerModule extends EventEmitter {
    constructor() {
        super();
        this.duration = 1500; // Default 25 min
        this.timeLeft = this.duration;
        this.mode = 'focus';
        this.state = 'stopped'; // 'stopped', 'running', 'paused'
        this.interval = null;
        this.availableModes = {
            'focus': { name: 'Focus Session', duration: 1500 },
            'short-break': { name: 'Short Break', duration: 300 },
            'long-break': { name: 'Long Break', duration: 900 },
            'long-focus': { name: 'Long Focus', duration: 3300 },
            'custom': { name: 'Custom Timer', duration: 3000 }
        };
    }

    setMode(mode, duration = null) {
        this.stop();
        this.mode = mode;
        this.duration = duration || this.availableModes[mode]?.duration || 1500;
        this.timeLeft = this.duration;
        this.emit('modeChange', { mode: this.mode, duration: this.duration, timeLeft: this.timeLeft });
    }

    start() {
        if (this.state === 'running') return;
        if (this.timeLeft <= 0) this.timeLeft = this.duration;
        this.state = 'running';
        this._startInterval();
        this.emit('start', { mode: this.mode, duration: this.duration, timeLeft: this.timeLeft });
    }

    pause() {
        if (this.state !== 'running') return;
        this.state = 'paused';
        this._clearInterval();
        this.emit('pause', { mode: this.mode, duration: this.duration, timeLeft: this.timeLeft });
    }

    resume() {
        if (this.state !== 'paused') return;
        this.state = 'running';
        this._startInterval();
        this.emit('resume', { mode: this.mode, duration: this.duration, timeLeft: this.timeLeft });
    }

    reset() {
        this._clearInterval();
        this.timeLeft = this.duration;
        this.state = 'stopped';
        this.emit('reset', { mode: this.mode, duration: this.duration, timeLeft: this.timeLeft });
    }

    stop() {
        this._clearInterval();
        this.state = 'stopped';
    }

    _startInterval() {
        this._clearInterval();
        this.interval = setInterval(() => {
            this.timeLeft--;
            this.emit('tick', { timeLeft: this.timeLeft, duration: this.duration });
            if (this.timeLeft <= 0) {
                this._clearInterval();
                this.state = 'stopped';
                this.emit('complete', { mode: this.mode, duration: this.duration });
            }
        }, 1000);
    }

    _clearInterval() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    getState() {
        return {
            mode: this.mode,
            duration: this.duration,
            timeLeft: this.timeLeft,
            state: this.state
        };
    }

    destroy() {
        this._clearInterval();
        this.removeAllListeners();
    }
}
window.TimerModule = TimerModule;