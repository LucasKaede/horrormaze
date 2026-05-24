// ==========================================
// 🎹 bgm/music3.js : 永劫の回廊・深淵四重奏（超ロング静寂・完全和声＆微細アルペジオ版）
// ==========================================

(function() {
    // 💡【和音感 ＆ さりげないきらめき】
    // 全ての楽器が完璧に1つのコードとしてハモる絶対ルールを維持したまま、
    // 次のコードへ移る直前の静寂の隙間に、影が動くような極小のアルペジオを融合させました。
    const megaPureChords = [
        { name: "Am",       base: 55.00,  mid: 220.00, high: 261.63, bell: 440.00, arp: [220.00, 261.63, 329.63, 440.00] }, 
        { name: "Am/G#",    base: 51.91,  mid: 207.65, high: 261.63, bell: 415.30, arp: [207.65, 261.63, 329.63, 415.30] }, 
        { name: "Am/G",     base: 49.00,  mid: 196.00, high: 261.63, bell: 392.00, arp: [196.00, 261.63, 329.63, 392.00] }, 
        { name: "Am/F#",    base: 46.25,  mid: 185.00, high: 261.63, bell: 369.99, arp: [185.00, 261.63, 329.63, 369.99] }, 
        
        { name: "F",        base: 43.65,  mid: 174.61, high: 220.00, bell: 349.23, arp: [174.61, 220.00, 261.63, 349.23] }, 
        { name: "Fm",       base: 43.65,  mid: 174.61, high: 207.65, bell: 349.23, arp: [174.61, 207.65, 261.63, 349.23] }, 
        { name: "C",        base: 65.41,  mid: 261.63, high: 329.63, bell: 523.25, arp: [261.63, 329.63, 392.00, 523.25] }, 
        { name: "E7",       base: 41.20,  mid: 164.81, high: 207.65, bell: 329.63, arp: [164.81, 207.65, 246.94, 329.63] }, 
        
        { name: "Dm",       base: 36.71,  mid: 146.83, high: 174.61, bell: 293.66, arp: [146.83, 174.61, 220.00, 293.66] }, 
        { name: "D#dim",    base: 38.89,  mid: 155.56, high: 185.00, bell: 311.13, arp: [155.56, 185.00, 220.00, 311.13] }, 
        { name: "Am/E",     base: 41.20,  mid: 164.81, high: 220.00, bell: 329.63, arp: [164.81, 220.00, 261.63, 329.63] }, 
        { name: "F7",       base: 43.65,  mid: 174.61, high: 220.00, bell: 349.23, arp: [174.61, 220.00, 261.63, 349.23] }, 
        
        { name: "Bm7-5",    base: 61.74,  mid: 246.94, high: 293.66, bell: 493.88, arp: [246.94, 293.66, 392.00, 493.88] }, 
        { name: "E7sus4",   base: 41.20,  mid: 164.81, high: 196.00, bell: 329.63, arp: [164.81, 196.00, 246.94, 329.63] }, 
        { name: "E7",       base: 41.20,  mid: 164.81, high: 207.65, bell: 329.63, arp: [164.81, 207.65, 246.94, 329.63] }, 
        { name: "Asus4",    base: 55.00,  mid: 220.00, high: 293.66, bell: 440.00, arp: [220.00, 293.66, 329.63, 440.00] }  
    ];

    window.playSynthBgm = function() {
        if (!window.audioCtx || window.bgmTimer) return;
        let ctx = window.audioCtx;

        // ① 低音ピアノ（主旋律ベース：Triangle波） 🚀 爆音仕様
        let pianoBaseOsc = ctx.createOscillator(); let pianoBaseGain = ctx.createGain();
        pianoBaseOsc.type = 'triangle'; pianoBaseGain.gain.setValueAtTime(0.45, ctx.currentTime);
        pianoBaseOsc.connect(pianoBaseGain); pianoBaseGain.connect(ctx.destination); pianoBaseOsc.start();
        window.currentBgmNodes.push(pianoBaseOsc, pianoBaseGain);

        // ② 中音ピアノ（和音階：Triangle波） 🚀 爆音仕様
        let pianoMidOsc = ctx.createOscillator(); let pianoMidGain = ctx.createGain();
        pianoMidOsc.type = 'triangle'; pianoMidGain.gain.setValueAtTime(0.40, ctx.currentTime);
        pianoMidOsc.connect(pianoMidGain); pianoMidGain.connect(ctx.destination); pianoMidOsc.start();
        window.currentBgmNodes.push(pianoMidOsc, pianoMidGain);

        // ③ 背景低音：深淵を這う地鳴り（Sine波） 🚀 臨場感の重低音
        let droneOsc = ctx.createOscillator(); let droneGain = ctx.createGain();
        droneOsc.type = 'sine'; droneGain.gain.setValueAtTime(0.35, ctx.currentTime);
        droneOsc.connect(droneGain); droneGain.connect(ctx.destination); droneOsc.start();
        window.currentBgmNodes.push(droneOsc, droneGain);

        // ④ 遙か天井から滴る極小のベル（高音ハモり：Sine波） 🚀 極小まろやか仕様
        let bellOsc = ctx.createOscillator(); let bellGain = ctx.createGain();
        bellOsc.type = 'sine'; bellGain.gain.setValueAtTime(0.012, ctx.currentTime); 
        bellOsc.connect(bellGain); bellGain.connect(ctx.destination); bellOsc.start();
        window.currentBgmNodes.push(bellOsc, bellGain);

        // ⑤【新楽器】暗闇をかすめる這い寄りアルペジオ（Triangle波） 🚀 追加！
        // 💡 存在感を消した極小ボリューム（0.05）で、背後の隙間をさらさらと駆け上がります
        let shadowArpOsc = ctx.createOscillator(); let shadowArpGain = ctx.createGain();
        shadowArpOsc.type = 'triangle'; shadowArpGain.gain.setValueAtTime(0, ctx.currentTime); // 初期状態は消音
        shadowArpOsc.connect(shadowArpGain); shadowArpGain.connect(ctx.destination); shadowArpOsc.start();
        window.currentBgmNodes.push(shadowArpOsc, shadowArpGain);

        let currentChordIdx = 0, currentNoteIdx = 0;

        function loop() {
            if (!window.currentBgmNodes || window.currentBgmNodes.length === 0) return;
            let activeChord = megaPureChords[currentChordIdx];

            let uniformSpeed = 280; // 初代ホラーの 280ms 周期

            if (currentNoteIdx === 0) {
                // 🚀【和音の一体化】全楽器を完全同期させてドン！と鳴らす
                pianoBaseOsc.frequency.setTargetAtTime(activeChord.mid, ctx.currentTime, 0.005);
                pianoMidOsc.frequency.setTargetAtTime(activeChord.high, ctx.currentTime, 0.005);
                droneOsc.frequency.setTargetAtTime(activeChord.base, ctx.currentTime, 0.05);
                bellOsc.frequency.setTargetAtTime(activeChord.bell, ctx.currentTime, 0.005);

                pianoBaseGain.gain.setTargetAtTime(0.45, ctx.currentTime, 0.01);
                pianoMidGain.gain.setTargetAtTime(0.40, ctx.currentTime, 0.01);
                bellGain.gain.setTargetAtTime(0.012, ctx.currentTime, 0.01);
                shadowArpGain.gain.setTargetAtTime(0, ctx.currentTime, 0.01); // アルペジオはまだ出さない
            } 
            else if (currentNoteIdx === 1) {
                // 💡 2拍目：高音ベルが「ぽつん…」と綺麗に残響
                bellGain.gain.setValueAtTime(0.012, ctx.currentTime);
                bellGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
            }
            else if (currentNoteIdx === 2) {
                // 💡 3拍目：静寂への突入（ピアノとベルの完全ミュート）
                pianoBaseGain.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
                pianoMidGain.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
                bellGain.gain.setTargetAtTime(0, ctx.currentTime, 0.01);
            }
            else if (currentNoteIdx === 3) {
                // 💡【新機構：4拍目の裏でさりげない高速アルペジオ】
                // 静寂の余韻を残したまま、次の小節へ移る直前の280msの間に、
                // 4つの音が「さらららん…」と流れるように超高速（55ms間隔）で爪弾かれます！
                shadowArpGain.gain.setTargetAtTime(0.05, ctx.currentTime, 0.01); // 🚀 絶妙な隠し味ボリューム
                let now = ctx.currentTime;
                activeChord.arp.forEach((freq, idx) => {
                    shadowArpOsc.frequency.setValueAtTime(freq, now + (idx * 0.055));
                });
                // 弾き終わったらフッと消音
                shadowArpGain.gain.setTargetAtTime(0, now + 0.24, 0.01);
            }

            currentNoteIdx++;
            
            if (currentNoteIdx >= 4) {
                currentNoteIdx = 0; 
                currentChordIdx = (currentChordIdx + 1) % megaPureChords.length;
            }
            
            window.bgmTimer = setTimeout(loop, uniformSpeed);
        }
        loop();
    };
})();
