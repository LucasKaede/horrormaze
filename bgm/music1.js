// ==========================================
// 🎹 bgm/music1.js : 3重アルペジオ（オリジナル・爆音クオリティ復活版）
// ==========================================

(function() {
    const chords = [
        { notes: [55.00, 65.41, 82.41, 110.00, 82.41, 65.41], rootHigh: 440.00 }, 
        { notes: [43.65, 65.41, 87.31, 130.81, 87.31, 65.41], rootHigh: 349.23 },
        { notes: [73.42, 87.31, 110.00, 146.83, 110.00, 87.31], rootHigh: 293.66 }, 
        { notes: [82.41, 103.83, 123.47, 164.81, 123.47, 103.83], rootHigh: 329.63 } 
    ];
    const counterNotes = [ 131.81, 164.81, 220.00, 130.81, 174.61, 261.63, 146.83, 174.61, 220.00, 164.81, 207.65, 246.94 ];

    window.playSynthBgm = function() {
        if (!window.audioCtx || window.bgmTimer) return;
        let ctx = window.audioCtx;

        // ① アルペジオ（主旋律：Triangle波） 🚀 爆音仕様
        let arpOsc = ctx.createOscillator(); let arpGain = ctx.createGain();
        arpOsc.type = 'triangle'; arpGain.gain.setValueAtTime(0.55, ctx.currentTime);
        arpOsc.connect(arpGain); arpGain.connect(ctx.destination); arpOsc.start();
        window.currentBgmNodes.push(arpOsc, arpGain);

        // ② ドローンベース（背景重低音：Sine波） 🚀 爆音仕様
        let droneOsc = ctx.createOscillator(); let droneGain = ctx.createGain();
        droneOsc.type = 'sine'; droneGain.gain.setValueAtTime(0.35, ctx.currentTime);
        droneOsc.connect(droneGain); droneGain.connect(ctx.destination); droneOsc.start();
        window.currentBgmNodes.push(droneOsc, droneGain);

        // ③ カウンター（裏メロ：Sawtooth波 ＋ ローパスフィルター） 🚀 爆音仕様
        let counterOsc = ctx.createOscillator(); let counterGain = ctx.createGain(); let filter = ctx.createBiquadFilter();
        counterOsc.type = 'sawtooth'; filter.type = 'lowpass'; filter.frequency.value = 700;
        counterGain.gain.setValueAtTime(0.18, ctx.currentTime);
        counterOsc.connect(filter); filter.connect(counterGain); counterGain.connect(ctx.destination); counterOsc.start();
        window.currentBgmNodes.push(counterOsc, counterGain, filter);

        let currentChordIdx = 0, currentNoteIdx = 0, counterTickIdx = 0;

        function loop() {
            if (!window.currentBgmNodes || window.currentBgmNodes.length === 0) return;
            let activeChord = chords[currentChordIdx];

            arpOsc.frequency.setTargetAtTime(activeChord.notes[currentNoteIdx], ctx.currentTime, 0.02);
            if (currentNoteIdx === 0) {
                droneOsc.frequency.setTargetAtTime(activeChord.rootHigh, ctx.currentTime, 0.15);
            }
            if (currentNoteIdx % 2 === 0) {
                counterOsc.frequency.setTargetAtTime(counterNotes[counterTickIdx], ctx.currentTime, 0.04);
                counterTickIdx = (counterTickIdx + 1) % counterNotes.length;
            }

            currentNoteIdx++;
            if (currentNoteIdx >= activeChord.notes.length) {
                currentNoteIdx = 0; currentChordIdx = (currentChordIdx + 1) % chords.length;
            }
            window.bgmTimer = setTimeout(loop, 250); // 元の爽快な250msテンポ
        }
        loop();
    };
})();
