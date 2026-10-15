// Web Audio API Synthesizer for relaxing underwater plops & chimes
let audioCtx = null;
function playSound(type) {
    if (!state.soundEnabled) return;
    try {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        const now = audioCtx.currentTime;

        if (type === 'bubble' || type === 'feed') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(320 + Math.random() * 180, now);
            osc.frequency.exponentialRampToValueAtTime(680, now + 0.09);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
            osc.start(now);
            osc.stop(now + 0.09);
        } else if (type === 'coin' || type === 'buy') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(587.33, now); // D5
            osc.frequency.setValueAtTime(880, now + 0.07); // A5
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
            osc.start(now);
            osc.stop(now + 0.22);
        } else if (type === 'hatch' || type === 'levelup') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now);
            osc.frequency.setValueAtTime(659.25, now + 0.08);
            osc.frequency.setValueAtTime(783.99, now + 0.16);
            osc.frequency.setValueAtTime(1046.50, now + 0.24);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
            osc.start(now);
            osc.stop(now + 0.45);
        } else if (type === 'clean') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(720, now + 0.12);
            gain.gain.setValueAtTime(0.07, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc.start(now);
            osc.stop(now + 0.12);
        } else if (type === 'laser') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.exponentialRampToValueAtTime(1480, now + 0.06);
            gain.gain.setValueAtTime(0.04, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
            osc.start(now);
            osc.stop(now + 0.06);
        } else if (type === 'quest') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now); // A4
            osc.frequency.setValueAtTime(554.37, now + 0.08); // C#5
            osc.frequency.setValueAtTime(659.25, now + 0.16); // E5
            osc.frequency.setValueAtTime(880, now + 0.24); // A5
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            osc.start(now);
            osc.stop(now + 0.5);
        } else if (type === 'event') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.24); // C6
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
            osc.start(now);
            osc.stop(now + 0.6);
        } else if (type === 'affection') {
            // Sweet music box kalimba chime with tender harmonic sparkle
            osc.type = 'sine';
            const chord = [523.25, 659.25, 783.99, 1046.50]; // C - E - G - C
            const note = chord[Math.floor(Math.random() * chord.length)];
            osc.frequency.setValueAtTime(note, now);
            osc.frequency.exponentialRampToValueAtTime(note * 1.5, now + 0.25);
            gain.gain.setValueAtTime(0.14, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
            osc.start(now);
            osc.stop(now + 0.45);
        } else if (type === 'music_box') {
            // Delicate lullaby bell
            osc.type = 'triangle';
            const notes = [440, 523.25, 587.33, 659.25, 783.99, 880];
            const n = notes[Math.floor(Math.random() * notes.length)];
            osc.frequency.setValueAtTime(n, now);
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
            osc.start(now);
            osc.stop(now + 0.65);
        }
    } catch (e) {
        // Ignore audio errors if browser blocks autoplay
    }
}

// Relaxing ambient music box lullaby scheduler for cozy healing vibes
let ambientMusicBoxTimer = null;
function playLullabyArpeggio() {
    if (!state.soundEnabled) return;
    try {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();
        }
        if (audioCtx.state === 'suspended') return;

        const chordProgressions = [
            [523.25, 659.25, 783.99, 1046.50], // C - E - G - High C
            [587.33, 739.99, 880.00, 1174.66], // D - F# - A - High D
            [440.00, 523.25, 659.25, 880.00],  // A - C - E - High A
            [659.25, 783.99, 987.77, 1318.51]  // E - G - B - High E
        ];
        const phrase = chordProgressions[Math.floor(Math.random() * chordProgressions.length)];

        phrase.forEach((freq, idx) => {
            setTimeout(() => {
                if (!state.soundEnabled || !audioCtx || audioCtx.state === 'suspended') return;
                try {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.type = 'triangle';
                    const t = audioCtx.currentTime;
                    osc.frequency.setValueAtTime(freq, t);
                    gain.gain.setValueAtTime(0.04, t);
                    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.start(t);
                    osc.stop(t + 0.95);
                } catch (e) {}
            }, idx * 280);
        });
    } catch (e) {}
}

function startAmbientMusicBox() {
    if (ambientMusicBoxTimer) clearInterval(ambientMusicBoxTimer);
    ambientMusicBoxTimer = setInterval(() => {
        if (state.soundEnabled && Math.random() < 0.75) {
            playLullabyArpeggio();
        }
    }, 22000);
}

if (typeof window !== 'undefined') {
    startAmbientMusicBox();
}
