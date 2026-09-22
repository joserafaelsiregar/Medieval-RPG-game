/**
 * Sound FX & Ambient Audio Synthesizer (Web Audio API)
 * Zero external audio assets required.
 */
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.masterVolume = 0.4;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.initialized = true;
        } catch (e) {
            console.warn("Web Audio API not supported", e);
        }
    }

    play(name, customPitch = 1.0) {
        if (this.muted) return;
        if (!this.initialized) this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const now = this.ctx.currentTime;
        switch (name) {
            case 'slash1':
                this._createSlash(now, 400 * customPitch, 150 * customPitch, 0.12, 0.25);
                break;
            case 'slash2':
                this._createSlash(now, 550 * customPitch, 200 * customPitch, 0.14, 0.28);
                break;
            case 'slash3':
                this._createSlash(now, 700 * customPitch, 120 * customPitch, 0.2, 0.35);
                break;
            case 'heavySlash':
                this._createHeavySlash(now, customPitch);
                break;
            case 'hit':
                this._createHitSound(now, customPitch);
                break;
            case 'parry':
                this._createParrySound(now);
                break;
            case 'block':
                this._createBlockSound(now);
                break;
            case 'dodge':
                this._createDodgeSound(now);
                break;
            case 'spell':
                this._createSpellSound(now);
                break;
            case 'arrowShoot':
                this._createArrowSound(now);
                break;
            case 'potion':
                this._createPotionSound(now);
                break;
            case 'coin':
                this._createCoinSound(now);
                break;
            case 'chest':
                this._createChestSound(now);
                break;
            case 'bossRoar':
                this._createBossRoar(now);
                break;
            case 'bossSlam':
                this._createBossSlam(now);
                break;
            case 'playerDeath':
                this._createDeathSound(now);
                break;
            case 'upgrade':
                this._createUpgradeSound(now);
                break;
            case 'herb':
                this._createHerbSound(now);
                break;
            case 'jump':
                this._createJumpSound(now);
                break;
            default:
                break;
        }
    }

    _createSlash(now, startFreq, endFreq, duration, vol) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);

        gain.gain.setValueAtTime(vol * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
    }

    _createHeavySlash(now, pitch) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250 * pitch, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);

        gain.gain.setValueAtTime(0.4 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
    }

    _createHitSound(now, pitch) {
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.08);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.35 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        noise.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(now);
    }

    _createParrySound(now) {
        const freqs = [1800, 2400, 3200];
        freqs.forEach((f, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now);
            osc.frequency.exponentialRampToValueAtTime(f * 0.95, now + 0.5);

            gain.gain.setValueAtTime((0.3 / (idx + 1)) * this.masterVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.5);
        });
    }

    _createBlockSound(now) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);

        gain.gain.setValueAtTime(0.35 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    _createDodgeSound(now) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.25);

        gain.gain.setValueAtTime(0.25 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
    }

    _createSpellSound(now) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.35);

        gain.gain.setValueAtTime(0.25 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
    }

    _createArrowSound(now) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);

        gain.gain.setValueAtTime(0.2 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
    }

    _createPotionSound(now) {
        [300, 450, 600, 800].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.06);

            gain.gain.setValueAtTime(0.2 * this.masterVolume, now + i * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.1);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + i * 0.06);
            osc.stop(now + i * 0.06 + 0.1);
        });
    }

    _createCoinSound(now) {
        const freqs = [987.77, 1318.51];
        freqs.forEach((f, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now + idx * 0.08);

            gain.gain.setValueAtTime(0.25 * this.masterVolume, now + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.2);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.2);
        });
    }

    _createChestSound(now) {
        const chord = [261.63, 329.63, 392.00, 523.25];
        chord.forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, now + i * 0.1);

            gain.gain.setValueAtTime(0.3 * this.masterVolume, now + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.35);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.35);
        });
    }

    _createBossRoar(now) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.6);
        osc.frequency.exponentialRampToValueAtTime(30, now + 1.2);

        gain.gain.setValueAtTime(0.5 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 1.2);
    }

    _createBossSlam(now) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.5);

        gain.gain.setValueAtTime(0.6 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.5);
    }

    _createDeathSound(now) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.8);

        gain.gain.setValueAtTime(0.4 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.8);
    }

    _createUpgradeSound(now) {
        const chord = [392.00, 493.88, 587.33, 783.99];
        chord.forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, now + i * 0.08);

            gain.gain.setValueAtTime(0.28 * this.masterVolume, now + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 0.3);
        });
    }

    _createHerbSound(now) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(780, now + 0.15);

        gain.gain.setValueAtTime(0.3 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    _createJumpSound(now) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(540, now + 0.16);

        gain.gain.setValueAtTime(0.25 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
    }
}

window.soundEngine = new SoundEngine();
