// ==========================================
// 🎹 bgm/music2.js : 慟哭のロンド（完全調和・高速哀愁アルペジオ版）
// ==========================================

(function() {
    // 💡【悲哀と疾走感の完全調和】
    // 音楽理論に基づき、ベース・主旋律・裏メロの周波数を1Hzの狂いもなく完全同期。
    // テンポをアップさせつつ、階段を転げ落ちるような激しくも悲しい「哀愁のクリシェ進行」を構築しました。
    const sorrowChords = [
        { name: "Am",    notes: [110.00, 130.81, 164.81, 220.00, 164.81, 130.81], drone: 55.00,  counter: 220.00 }, // Am (切なさの起点)
        { name: "Am/G",  notes: [98.00,  130.81, 164.81, 196.00, 164.81, 130.81], drone: 49.00,  counter: 196.00 }, // Am/G (ベースが下がる悲哀)
        { name: "F",     notes: [87.31,  110.00, 130.81, 174.61, 130.81, 110.00], drone: 43.65,  counter: 174.61 }, // F (こみ上げる涙)
        { name: "E7",    notes: [82.41,  103.83, 130.81, 164.81, 130.81, 103.83], drone: 41.20,  counter: 164.81 }, // E7 (狂おしい焦燥感)
        { name: "Dm",    notes: [146.83, 174.61, 220.00, 293.66, 220.00, 174.61], drone: 73.42,  counter: 220.00 }, // Dm (深い絶望)
        { name: "Am/C",  notes: [130.81, 164.81, 220.00, 261.63, 220.00, 164.81], drone: 65.41,  counter: 261.63 }, // Am/C (あきらめ)
        { name: "Bm7-5", notes: [123.47, 146.83, 174.61, 246.94, 174.61, 146.83], drone: 61.74,  counter: 174.61 }, // Bm7-5 (崩壊へのカウントダウン)
        { name: "E7sus4",notes: [123.47, 146.83, 196.00, 246.94, 196.00, 146.83], drone: 82.41,  counter: 246.94 }  // 緊迫のサスペンス ➔ 最初へ
    ];

    window.playSynthBgm = function() {
        if (!window.audioCtx || window.bgmTimer) return;
        let ctx = window.audioCtx;

        // ① アルペジオ（主旋律：Triangle波） 🚀 music1と同じ大迫力の爆音
        let arpOsc = ctx.createOscillator(); let arpGain = ctx.createGain();
        arpOsc.type = 'triangle'; arpGain.gain.setValueAtTime(0.55, ctx.currentTime);
        arpOsc.connect(arpGain); arpGain.connect(ctx.destination); arpOsc.start();
        window.currentBgmNodes.push(arpOsc, arpGain);

        // ② ドローンベース（背景重低音：Sine波） 🚀 music1と同じ大迫力の爆音
        let droneOsc = ctx.createOscillator(); let droneGain = ctx.createGain();
        droneOsc.type = 'sine'; droneGain.gain.setValueAtTime(0.35, ctx.currentTime);
        droneOsc.connect(droneGain); droneGain.connect(ctx.destination); droneOsc.start();
        window.currentBgmNodes.push(droneOsc, droneGain);

        // ③ カウンター（裏メロ：Sawtooth波 ＋ ローパスフィルター） 🚀 music1と同じ大迫力の爆音
        let counterOsc = ctx.createOscillator(); let counterGain = ctx.createGain(); let filter = ctx.createBiquadFilter();
        counterOsc.type = 'sawtooth'; filter.type = 'lowpass'; filter.frequency.value = 750; // 哀愁を引き立てる抜けの良い高音設定
        counterGain.gain.setValueAtTime(0.18, ctx.currentTime);
        counterOsc.connect(filter); filter.connect(counterGain); counterGain.connect(ctx.destination); counterOsc.start();
        window.currentBgmNodes.push(counterOsc, counterGain, filter);

        let currentChordIdx = 0, currentNoteIdx = 0;

        function loop() {
            if (!window.currentBgmNodes || window.currentBgmNodes.length === 0) return;
            let activeChord = sorrowChords[currentChordIdx];

            // 💡【テンポ調整】：心地よく、かつ疾走感の引き立つ300msの高速等間隔
            let fastSpeed = 300;

            // アルペジオの周波数を追従
            arpOsc.frequency.setTargetAtTime(activeChord.notes[currentNoteIdx], ctx.currentTime, 0.02);
            
            // コードの切り替わりと同時にベースと裏メロを完全同期
            if (currentNoteIdx === 0) {
                droneOsc.frequency.setTargetAtTime(activeChord.drone, ctx.currentTime, 0.08);
                counterOsc.frequency.setTargetAtTime(activeChord.counter, ctx.currentTime, 0.04);
            }
            
            // リズムにフックを作るため、4音目でオクターブ上の綺麗なハモりを裏メロにブレンド
            if (currentNoteIdx === 3) {
                counterOsc.frequency.setTargetAtTime(activeChord.notes[3], ctx.currentTime, 0.04);
            }

            currentNoteIdx++;
            if (currentNoteIdx >= activeChord.notes.length) {
                currentNoteIdx = 0; 
                currentChordIdx = (currentChordIdx + 1) % sorrowChords.length;
            }
            
            window.bgmTimer = setTimeout(loop, fastSpeed);
        }
        loop();
    };
})();
