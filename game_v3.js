// ==========================================
// 🎮 game_v3.js : 全機能統合版（自律型AI オートプレイ強化版）
// ==========================================

window.Game = {
    MAP_SIZE: 31,
    steps: 0,
    battery: 100,
    mental: 100,
    isScaring: false,
    isAutoPlay: false,
    isTextTyping: false,
    
    isStealth: false,
    stoneCooldown: false,
    minimapStatic: false,

    autoTimer: null,
    chaserTimers: [], 
    player: { x: 1.5, y: 1.5, dir: 1 },
    chasers: [], 
    goal: { x: 15, y: 15 },
    mapDataArray: [],
    batteries: {},
    visitedTiles: {},
    fakeWalls: {}
};

let minimapCanvas, mctx;
let stepEl, batteryHud, mentalHud, autoBtn, scareOverlay, scareImg, pokemonTextEl;
const dirVec = [{x: 0, y: -1}, {x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0}];

let internalStepCounter = 0; let lastSpokenStep = 0;
window.audioCtx = null; window.currentBgmNodes = []; 

let stoneCooldownTimer = null;
let stoneCooldownSeconds = 0;

const stageThemes = [
    { name: "gray",   wall: '#444444', wallDark: '#222222', floor: '#111111', ceiling: '#0a0a0a' },
    { name: "blue",   wall: '#223344', wallDark: '#111a22', floor: '#08111a', ceiling: '#050a10' },
    { name: "red",    wall: '#552222', wallDark: '#2a1111', floor: '#1a0808', ceiling: '#100505' },
    { name: "green",  wall: '#224422', wallDark: '#112211', floor: '#081408', ceiling: '#050c05' },
    { name: "purple", wall: '#442244', wallDark: '#221122', floor: '#140814', ceiling: '#0c050c' }
];
let currentTheme = stageThemes[0];
window.getStageColors = function() { return currentTheme; };

window.stopSynthBgm = function() {
    if (window.bgmTimer) { clearTimeout(window.bgmTimer); window.bgmTimer = null; }
    if (window.currentBgmNodes && window.currentBgmNodes.length > 0) {
        window.currentBgmNodes.forEach(node => { try { node.stop(); } catch(e) {} try { node.disconnect(); } catch(e) {} });
        window.currentBgmNodes = [];
    }
};

function loadMusicScript(musicNumber) {
    window.stopSynthBgm(); window.playSynthBgm = null;
    let oldScript = document.getElementById('dynamic-bgm-script'); if (oldScript) oldScript.remove();
    let script = document.createElement('script'); script.id = 'dynamic-bgm-script'; script.src = `bgm/music${musicNumber}.js?t=${Date.now()}`;
    script.onload = function() { if (window.Game.isAutoPlay || (window.audioCtx && window.audioCtx.state === 'running')) { if (typeof window.playSynthBgm === 'function') window.playSynthBgm(); } };
    script.onerror = function() { let fallbackNumber = Math.random() < 0.5 ? 1 : 2; loadMusicScript(fallbackNumber); };
    document.head.appendChild(script);
}

window.forceUpdateFace = function(text) {
    let fImg = document.getElementById('pokemon-face-img'); if (!fImg) return;
    let bat = (window.Game && typeof window.Game.battery !== 'undefined') ? window.Game.battery : 100;
    let faceNum = (bat <= 0) ? 1 : 3;
    if (text && text.trim() !== "") {
        if (text.includes("電池") || text.includes("チャージ") || text.includes("バッテリー")) faceNum = 4;
        if (text.includes("うわあ") || text.includes("ひっ") || text.includes("びっくり") || text.includes("帰りたい")) faceNum = 5;
        if (text.includes("通らなかった") || text.includes("怖い") || text.includes("やだ") || text.includes("息潜めて")) faceNum = 2;
    }
    fImg.src = `assets/faces/${faceNum}.png`;
};

window.isWallCollision = function(x, y) {
    if (!window.Game.mapDataArray || window.Game.mapDataArray.length === 0) return true;
    let ix = Math.floor(x), iy = Math.floor(y);
    if (ix < 0 || iy < 0 || ix >= window.Game.MAP_SIZE || iy >= window.Game.MAP_SIZE) return true;
    return !window.Game.mapDataArray[iy] || window.Game.mapDataArray[iy][ix] === 1;
};

function generatePerfectConnectedMaze() {
    window.Game.mapDataArray = [];
    for (let y = 0; y < window.Game.MAP_SIZE; y++) { let row = new Uint8Array(window.Game.MAP_SIZE); row.fill(1); window.Game.mapDataArray.push(row); }
    let stack = [[1, 1]]; window.Game.mapDataArray[1][1] = 0; 
    while (stack.length > 0) {
        let current = stack[stack.length - 1]; let cx = current[0]; let cy = current[1];
        let dirs = [ [0,-2], [2,0], [0,2], [-2,0] ];
        for (let i = dirs.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [dirs[i], dirs[j]] = [dirs[j], dirs[i]]; }
        let moved = false;
        for (let i = 0; i < dirs.length; i++) {
            let dx = dirs[i][0]; let dy = dirs[i][1]; let nx = cx + dx; let ny = cy + dy;
            if (nx > 0 && nx < window.Game.MAP_SIZE - 1 && ny > 0 && ny < window.Game.MAP_SIZE - 1 && window.Game.mapDataArray[ny][nx] === 1) {
                window.Game.mapDataArray[cy + dy / 2][cx + dx / 2] = 0; window.Game.mapDataArray[ny][nx] = 0; stack.push([nx, ny]); moved = true; break;
            }
        }
        if (!moved) stack.pop();
    }
    for (let y = 2; y < window.Game.MAP_SIZE - 2; y += 2) { for (let x = 2; x < window.Game.MAP_SIZE - 2; x += 2) { if (Math.random() < 0.2) { if (window.Game.mapDataArray[y-1][x] === 1) window.Game.mapDataArray[y-1][x] = 0; if (window.Game.mapDataArray[y][x-1] === 1) window.Game.mapDataArray[y][x-1] = 0; } } }
    for(let i=0; i<window.Game.MAP_SIZE; i++) { window.Game.mapDataArray[0][i] = 1; window.Game.mapDataArray[window.Game.MAP_SIZE-1][i] = 1; window.Game.mapDataArray[i][0] = 1; window.Game.mapDataArray[i][window.Game.MAP_SIZE-1] = 1; }
    let validPassages = [];
    for (let y = 1; y < window.Game.MAP_SIZE - 1; y++) { for (let x = 1; x < window.Game.MAP_SIZE - 1; x++) { if (window.Game.mapDataArray[y][x] === 0 && (x !== 1 || y !== 1)) { validPassages.push({ x: x, y: y }); } } }
    window.Game.goal = validPassages.length > 0 ? validPassages[Math.floor(Math.random() * validPassages.length)] : { x: window.Game.MAP_SIZE - 2, y: window.Game.MAP_SIZE - 2 };
    window.Game.batteries = {};
    for (let y = 1; y < window.Game.MAP_SIZE - 1; y++) { for (let x = 1; x < window.Game.MAP_SIZE - 1; x++) { if (window.Game.mapDataArray[y][x] === 0 && (x !== 1 || y !== 1) && (x !== window.Game.goal.x || y !== window.Game.goal.y)) { if (Math.random() < 0.03) { window.Game.batteries[x + ',' + y] = true; } } } }
}

function relocateChaserFarAway() {
    if (!window.Game.chasers) return;
    let px = Math.floor(window.Game.player.x), py = Math.floor(window.Game.player.y); 
    window.Game.chasers.forEach(chaser => {
        let candidates = [];
        for (let y = 1; y < window.Game.MAP_SIZE - 1; y++) { for (let x = 1; x < window.Game.MAP_SIZE - 1; x++) { if (window.Game.mapDataArray[y] && window.Game.mapDataArray[y][x] === 0) { let dist = Math.abs(x - px) + Math.abs(y - py); if (dist > 10) candidates.push({x, y}); } } }
        let target = candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : { x: window.Game.MAP_SIZE - 2, y: window.Game.MAP_SIZE - 2 };
        chaser.x = target.x; chaser.y = target.y; 
        if (chaser.state) chaser.state = "WANDER";
        if (chaser.anim) chaser.anim.state = "WANDER";
        if (chaser.visitedTiles) chaser.visitedTiles = {};
    });
}

function startChaserAILoop() {
    if (window.Game.chaserTimers) { window.Game.chaserTimers.forEach(t => clearTimeout(t)); }
    window.Game.chaserTimers = [];
    window.Game.chasers.forEach((chaser, index) => {
        function chaserTick() {
            if (!window.Game || window.Game.isScaring || window.Game.mental <= 0) {
                window.Game.chaserTimers[index] = setTimeout(chaserTick, 500); return;
            }
            let delay = chaser.updateAI(window.Game.player.x, window.Game.player.y, window.Game.mapDataArray, window.Game.MAP_SIZE);
            let px = Math.floor(window.Game.player.x), py = Math.floor(window.Game.player.y);
            if (chaser.x === px && chaser.y === py) { 
                if (!window.Game.isStealth) {
                    window.stopSynthBgm(); 
                    if (window.Game.isAutoPlay) clearTimeout(window.Game.autoTimer); 
                    window.Game.mental -= (Math.floor(Math.random() * 50) + 30); 
                    if (window.Game.mental < 0) window.Game.mental = 0;
                    let isGameOver = (window.Game.mental <= 0); 
                    window.triggerScare(isGameOver); 
                }
            }
            window.Game.chaserTimers[index] = setTimeout(chaserTick, delay);
        }
        window.Game.chaserTimers[index] = setTimeout(chaserTick, 2000);
    });
}

function updateHudUI() {
    if (stepEl) stepEl.innerText = window.Game.steps.toString().padStart(6, '0');
    if (batteryHud) { batteryHud.innerText = `⚡LIGHT: ${window.Game.battery}%`; if (window.Game.battery > 50) batteryHud.style.color = "#0f0"; else if (window.Game.battery < 20) batteryHud.style.color = "#f00"; else batteryHud.style.color = "#ff0"; }
    if (mentalHud) { mentalHud.innerText = `❤️MENTAL: ${window.Game.mental}%`; if (window.Game.mental > 50) mentalHud.style.color = "#ff00ff"; else if (window.Game.mental < 20) mentalHud.style.color = "#ff99ff"; else mentalHud.style.color = "#ff0000"; }
}

function updateChaserWarnings() {
    if (!window.Game.chasers) return;
    let minStalkerDist = 999;
    for (let chaser of window.Game.chasers) {
        if (chaser instanceof window.Enemies.Stalker) {
            let dist = chaser.getDistToPlayer(window.Game.player.x, window.Game.player.y);
            if (dist < minStalkerDist) minStalkerDist = dist;
        }
    }
    let batteryHud = document.getElementById('battery-hud');
    if (minStalkerDist <= 6) {
        if (Math.random() < 0.1) batteryHud.style.opacity = (Math.random() > 0.5) ? '0' : '1';
        else batteryHud.style.opacity = '1';
    } else {
        batteryHud.style.opacity = '1';
    }
    window.Game.minimapStatic = (minStalkerDist <= 3);
}

function checkAndTriggerWalkingDialogue() {
    let currentSteps = window.Game.steps; if (currentSteps === internalStepCounter) return;
    internalStepCounter = currentSteps; let elapsed = currentSteps - lastSpokenStep;
    if (elapsed >= 12 && elapsed < 24 && pokemonTextEl && pokemonTextEl.innerText !== "" && !window.Game.isScaring) { pokemonTextEl.innerText = ""; if (typeof window.forceUpdateFace === 'function') window.forceUpdateFace(""); }
    if (elapsed >= 24 && !window.Game.isScaring) { lastSpokenStep = currentSteps; window.Game.isTextTyping = false; if (typeof window.triggerRandomWalkingDialogue === 'function') window.triggerRandomWalkingDialogue(); }
}

function onPlayerMove() {
    updateHudUI();
    updateChaserWarnings(); 
    checkAndTriggerWalkingDialogue();
    let px = Math.floor(window.Game.player.x), py = Math.floor(window.Game.player.y); let currentKey = px + ',' + py;
    window.Game.visitedTiles[currentKey] = (window.Game.visitedTiles[currentKey] || 0) + 1;
    if (px === window.Game.goal.x && py === window.Game.goal.y) { window.triggerClear(); return true; }
    window.Game.battery--; if (window.Game.battery < 0) window.Game.battery = 0;
    if (window.Game.battery <= 0) { if (window.Game.steps % 3 === 0) window.Game.mental--; } else { if (window.Game.steps % 3 === 0) window.Game.mental++; }
    if (window.Game.mental > 100) window.Game.mental = 100; if (window.Game.mental < 0) window.Game.mental = 0;
    if (window.Game.mental <= 0) { window.stopSynthBgm(); if (window.Game.isAutoPlay) handleAutoBtnClick(new Event('click')); initGame(); return true; }
    if (window.Game.batteries[currentKey]) {
        window.Game.battery = 100; if (typeof window.playBatteryGetSound === 'function') window.playBatteryGetSound(); 
        delete window.Game.batteries[currentKey]; if (typeof window.triggerBatteryDialogue === 'function') window.triggerBatteryDialogue();
    }
    updateHudUI(); checkAndTriggerWalkingDialogue();
    for (let chaser of window.Game.chasers) {
        if (px === chaser.x && py === chaser.y) { 
            if (!window.Game.isStealth) {
                window.stopSynthBgm(); if (window.Game.isAutoPlay) clearTimeout(window.Game.autoTimer); window.Game.mental -= (Math.floor(Math.random() * 50) + 30); if (window.Game.mental < 0) window.Game.mental = 0;
                let isGameOver = (window.Game.mental <= 0); window.triggerScare(isGameOver); return true; 
            }
        }
    }
    return false;
}

window.drawMinimap = function() {
    if (!mctx || !minimapCanvas || !window.Game || !window.Game.mapDataArray || window.Game.mapDataArray.length === 0) return;

    let now = Date.now();
    if (!window.Game.fakeWalls) window.Game.fakeWalls = {};
    for (let key in window.Game.fakeWalls) {
        if (window.Game.fakeWalls[key] < now) delete window.Game.fakeWalls[key];
    }

    mctx.fillStyle = '#000'; mctx.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);
    if (window.Game.minimapStatic) {
        let timeSeed = Math.floor(Date.now() / 100) % 3; let mosaicSize = 4; 
        let random = (x, y, seed) => { let n = Math.sin(x * 12.9898 + y * 78.233 + seed * 43.11) * 43758.5453; return n - Math.floor(n); };
        for (let y = 0; y < minimapCanvas.height; y += mosaicSize) {
            for (let x = 0; x < minimapCanvas.width; x += mosaicSize) {
                let r = random(x, y, timeSeed);
                if (r < 0.33) mctx.fillStyle = '#111'; else if (r < 0.66) mctx.fillStyle = '#555'; else mctx.fillStyle = '#aaa'; 
                mctx.fillRect(x, y, mosaicSize, mosaicSize);
            }
        }
        return; 
    }
    
    const VIEW_RANGE = 4; const cellSize = Math.floor(minimapCanvas.width / (VIEW_RANGE * 2 + 1));
    let px = Math.floor(window.Game.player.x), py = Math.floor(window.Game.player.y);

    for (let ky = -VIEW_RANGE; ky <= VIEW_RANGE; ky++) {
        for (let kx = -VIEW_RANGE; kx <= VIEW_RANGE; kx++) {
            let mapX = px + kx, mapY = py + ky; 
            let screenX = (kx + VIEW_RANGE) * cellSize, screenY = (ky + VIEW_RANGE) * cellSize;
            
            if (mapX >= 0 && mapX < window.Game.MAP_SIZE && mapY >= 0 && mapY < window.Game.MAP_SIZE) {
                let isFakeWall = window.Game.fakeWalls[`${mapX},${mapY}`] !== undefined;

                if (window.Game.mapDataArray[mapY] && window.Game.mapDataArray[mapY][mapX] === 1 || isFakeWall) { 
                    mctx.fillStyle = '#444444'; 
                    mctx.fillRect(screenX, screenY, cellSize - 1, cellSize - 1); 
                } 
                else { 
                    mctx.fillStyle = '#111111'; 
                    mctx.fillRect(screenX, screenY, cellSize - 1, cellSize - 1); 
                    if (window.Game.batteries[mapX + ',' + mapY]) { 
                        mctx.fillStyle = '#0f0'; 
                        mctx.fillRect(screenX + cellSize/3, screenY + cellSize/3, cellSize/3, cellSize/3); 
                    } 
                }
                
                if (mapX === window.Game.goal.x && mapY === window.Game.goal.y) { 
                    mctx.fillStyle = '#00ffff'; 
                    mctx.fillRect(screenX + 1, screenY + 1, cellSize - 3, cellSize - 3); 
                }
                
                for (let chaser of window.Game.chasers) {
                    if (mapX === chaser.x && mapY === chaser.y) { 
                        if (isFakeWall) continue; 
                        
                        if (window.Enemies && window.Enemies.Helpers) {
                            let hasSight = window.Enemies.Helpers.checkLineOfSight(px, py, chaser.x, chaser.y, window.Game.mapDataArray);
                            if (!hasSight) continue; 
                        }

                        if (chaser instanceof window.Enemies.MimicBattery && (chaser.state === "DISGUISED" || chaser.state === "REVEALING")) {
                            mctx.fillStyle = '#0f0'; mctx.fillRect(screenX + cellSize/3, screenY + cellSize/3, cellSize/3, cellSize/3);
                        } else {
                            mctx.fillStyle = '#f00'; mctx.beginPath(); mctx.arc(screenX + cellSize/2, screenY + cellSize/2, cellSize/3, 0, Math.PI*2); mctx.fill(); 
                        }
                    }
                }
            }
        }
    }
    let pScreenX = VIEW_RANGE * cellSize + cellSize / 2, pScreenY = VIEW_RANGE * cellSize + cellSize / 2;
    mctx.fillStyle = window.Game.isStealth ? '#00ffff' : '#00ff00'; mctx.beginPath(); mctx.arc(pScreenX, pScreenY, cellSize / 3, 0, Math.PI * 2); mctx.fill();
    mctx.strokeStyle = window.Game.isStealth ? '#00ffff' : '#00ff00'; mctx.lineWidth = 2; mctx.beginPath(); mctx.moveTo(pScreenX, pScreenY);
    if (window.camV) { mctx.lineTo(pScreenX + Math.cos(window.camV.angle) * (cellSize / 1.5), pScreenY + Math.sin(window.camV.angle) * (cellSize / 1.5)); }
    mctx.stroke();
};

window.triggerClear = function() {
    window.Game.isScaring = true; window.stopSynthBgm(); 
    if (window.Game.isAutoPlay) clearTimeout(window.Game.autoTimer); if (typeof window.playClearSound === 'function') window.playClearSound();
    if (scareOverlay) { scareOverlay.style.backgroundColor = '#fff'; scareOverlay.style.display = 'flex'; }
    if (scareImg) scareImg.style.display = 'none'; 
    if (typeof window.typeWriterMessage === 'function') { window.typeWriterMessage("🎉出られたぁぁああ！！お外の空気おいしいよぉぉ！！泣", 40); }
    setTimeout(() => {
        if (scareOverlay) { scareOverlay.style.display = 'none'; scareOverlay.style.backgroundColor = 'rgba(0,0,0,0.85)'; }
        if (scareImg) scareImg.style.display = 'block'; window.Game.isScaring = false; initGame(); if (window.Game.isAutoPlay) startAutoPlayLoop();
    }, 4000);
};

window.triggerScare = function(isGameOver = false) {
    window.Game.isScaring = true; if (typeof window.playScareSound === 'function') window.playScareSound(); 
    if (scareImg) { scareImg.src = `assets/scares/1.png`; scareImg.classList.add('show'); }
    if (scareOverlay) scareOverlay.style.display = 'flex';
    if (typeof window.forceScareFace === 'function') window.forceScareFace();
    setTimeout(() => {
        if (scareImg) scareImg.classList.remove('show'); 
        setTimeout(() => {
            if (scareOverlay) scareOverlay.style.display = 'none'; window.Game.isScaring = false;
            if (isGameOver) { initGame(); } else { relocateChaserFarAway(); if (typeof window.playSynthBgm === 'function') window.playSynthBgm(); if (typeof window.triggerPanicDialogue === 'function') window.triggerPanicDialogue(); if (window.Game.isAutoPlay) startAutoPlayLoop(); }
        }, 250); 
    }, 1200);
};

// ==================================================
// 🤖 超進化版 自律型オートプレイAI（BFSマッピング＆危険回避）
// ==================================================
function startAutoPlayLoop() {
    if (!window.Game.isAutoPlay || window.Game.isScaring) return;
    window.Game.autoTimer = setTimeout(() => {
        let px = Math.floor(window.Game.player.x), py = Math.floor(window.Game.player.y);
        
        // 1. 敵の脅威度と危険地帯のマッピング
        let threatLevel = 0;
        let dangerousTiles = {};
        let nearestEnemyDist = 999;
        
        window.Game.chasers.forEach(chaser => {
            let cx = Math.floor(chaser.x), cy = Math.floor(chaser.y);
            let dist = Math.abs(px - cx) + Math.abs(py - cy);
            if (dist < nearestEnemyDist) nearestEnemyDist = dist;
            
            if (dist <= 6) {
                // 敵の周囲を危険地帯として避ける
                dangerousTiles[`${cx},${cy}`] = true;
                for(let d of dirVec) dangerousTiles[`${cx+d.x},${cy+d.y}`] = true;
                
                // 視線が通っていればパニック度アップ
                if (window.Enemies && window.Enemies.Helpers && window.Enemies.Helpers.checkLineOfSight(px, py, cx, cy, window.Game.mapDataArray)) {
                    threatLevel += (7 - dist);
                }
            }
        });
        
        // 2. 透明化（ステルス）の自動発動判断
        if ((threatLevel >= 3 || nearestEnemyDist <= 2) && !window.Game.isStealth && !window.Game.stoneCooldown) {
            let btn = document.getElementById('stone-btn');
            if (btn) btn.click();
        }
        
        // ステルス中は敵を無視して強行突破
        if (window.Game.isStealth) dangerousTiles = {};
        
        // 3. ゴールの視認判定（ミニマップチート無し）
        let knownGoal = null;
        let goalDist = Math.abs(px - window.Game.goal.x) + Math.abs(py - window.Game.goal.y);
        if (goalDist <= 6 && window.Enemies && window.Enemies.Helpers) {
            if (window.Enemies.Helpers.checkLineOfSight(px, py, window.Game.goal.x, window.Game.goal.y, window.Game.mapDataArray)) {
                knownGoal = { x: window.Game.goal.x, y: window.Game.goal.y }; // 視界に捉えた！
            }
        }
        
        // 4. BFSによる経路探索（最大20マス先まで）
        let queue = [{x: px, y: py, path: []}];
        let visited = {};
        visited[`${px},${py}`] = true;
        
        let targetPath = null;
        let fallbackPath = null;
        
        while (queue.length > 0) {
            let curr = queue.shift();
            
            if (curr.path.length > 0) {
                // 優先度1: 視認済みのゴール
                if (knownGoal && curr.x === knownGoal.x && curr.y === knownGoal.y) {
                    targetPath = curr.path; break;
                }
                // 優先度2: バッテリーの自発的回収
                if (window.Game.batteries[`${curr.x},${curr.y}`] && window.Game.battery <= 85) {
                    targetPath = curr.path; break;
                }
                // 優先度3: マッピング（未訪問のマスへ）
                if (!window.Game.visitedTiles[`${curr.x},${curr.y}`]) {
                    targetPath = curr.path; break;
                }
                fallbackPath = curr.path;
            }
            if (curr.path.length > 20) continue; 
            
            let dirs = [0, 1, 2, 3].sort(() => Math.random() - 0.5); // 行動のランダム性
            for (let i of dirs) {
                let nx = curr.x + dirVec[i].x, ny = curr.y + dirVec[i].y;
                let key = `${nx},${ny}`;
                
                if (nx <= 0 || nx >= window.Game.MAP_SIZE - 1 || ny <= 0 || ny >= window.Game.MAP_SIZE - 1) continue;
                if (window.Game.mapDataArray[ny][nx] === 1) continue; // 壁
                if (window.Game.fakeWalls && window.Game.fakeWalls[key] > Date.now()) continue; // 偽壁
                if (dangerousTiles[key]) continue; // 危険地帯
                
                if (!visited[key]) {
                    visited[key] = true;
                    queue.push({x: nx, y: ny, path: curr.path.concat(i)});
                }
            }
        }
        
        let nextDir = -1;
        if (targetPath && targetPath.length > 0) {
            nextDir = targetPath[0];
        } else if (fallbackPath && fallbackPath.length > 0) {
            nextDir = fallbackPath[0]; // 行き止まりなら一番遠くまで行ける道へ退避
        } else {
            // パニック状態（安全な道が全くない場合）はランダムに足掻く
            let cands = [];
            for (let i = 0; i < 4; i++) {
                let nx = px + dirVec[i].x, ny = py + dirVec[i].y;
                if (window.Game.mapDataArray[ny] && window.Game.mapDataArray[ny][nx] === 0) cands.push(i);
            }
            if (cands.length > 0) nextDir = cands[Math.floor(Math.random() * cands.length)];
        }
        
        if (nextDir !== -1) {
            window.Game.player.dir = nextDir; 
            window.Game.player.x = px + dirVec[nextDir].x + 0.5; 
            window.Game.player.y = py + dirVec[nextDir].y + 0.5; 
            window.Game.steps++; 
            if (typeof window.playFootstep === 'function') window.playFootstep(); 
            if (onPlayerMove()) return;
        }
        
        if (window.Game.isAutoPlay) {
            checkAndTriggerWalkingDialogue(); 
            startAutoPlayLoop(); 
        }
    }, 800); // サクサク動かす
}

function handleAutoBtnClick(e) {
    if(e) e.stopPropagation(); 
    if(!window.audioCtx) { window.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    if(window.audioCtx && window.audioCtx.state === 'suspended') { window.audioCtx.resume(); }
    window.Game.isAutoPlay = !window.Game.isAutoPlay;
    if (autoBtn) {
        if (window.Game.isAutoPlay) { autoBtn.innerText = "LIVE: ON"; autoBtn.classList.add('active'); if (typeof window.playSynthBgm === 'function') window.playSynthBgm(); startAutoPlayLoop(); } 
        else { autoBtn.innerText = "LIVE: OFF"; autoBtn.classList.remove('active'); clearTimeout(window.Game.autoTimer); }
    }
}

let touchStartX = 0, touchStartY = 0;
function handleTouchStart(e) { 
    if (window.Game.isScaring || window.Game.isAutoPlay) return; 
    touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; 
    if(!window.audioCtx) { window.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    if(window.audioCtx && window.audioCtx.state === 'suspended') { window.audioCtx.resume().then(() => { if (typeof window.playSynthBgm === 'function') window.playSynthBgm(); }); } else { if (typeof window.playSynthBgm === 'function') window.playSynthBgm(); }
}
function handleTouchEnd(e) {
    if (window.Game.isScaring || window.Game.isAutoPlay) return;
    let dx = e.changedTouches[0].clientX - touchStartX, dy = e.changedTouches[0].clientY - touchStartY; let distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > 40 && Math.abs(dx) > Math.abs(dy)) { window.Game.player.dir = (dx > 0) ? (window.Game.player.dir + 1) % 4 : (window.Game.player.dir + 3) % 4; } 
    else if (distance < 40) { 
        if (!window.Game || !window.Game.player || !window.Game.mapDataArray || window.Game.mapDataArray.length === 0) return;
        let px = Math.floor(window.Game.player.x), py = Math.floor(window.Game.player.y); if (typeof window.Game.player.dir === 'undefined' || !dirVec[window.Game.player.dir]) return;
        let fwd = dirVec[window.Game.player.dir]; let nx = px + fwd.x, ny = py + fwd.y; 
        if (window.Game.mapDataArray[ny] && window.Game.mapDataArray[ny][nx] === 0) { window.Game.player.x = nx + 0.5; window.Game.player.y = ny + 0.5; window.Game.steps++; if (typeof window.playFootstep === 'function') window.playFootstep(); onPlayerMove(); } 
    }
}

function triggerInitialTextSafety() { setTimeout(() => { if (typeof window.typeWriterMessage === 'function') window.typeWriterMessage("うわ、真っ暗……。ここどこだよ、早く帰りたいんだけど……。", 60); }, 400); }

// 💡 透明化ボタンのUI更新ロジック
function updateStoneBtnUI() {
    let btn = document.getElementById('stone-btn');
    if (!btn) return;
    if (window.Game.isStealth) {
        btn.innerText = "透明化中";
        btn.style.background = "#00ffff";
        btn.style.color = "#000";
        btn.style.boxShadow = "0 0 15px #00ffff";
    } else if (window.Game.stoneCooldown) {
        btn.innerText = stoneCooldownSeconds.toString(); // 💡 秒数のみをシンプルに表示
        btn.style.background = "#333";
        btn.style.color = "#888";
        btn.style.borderColor = "#555";
        btn.style.boxShadow = "none";
    } else {
        btn.innerText = "透明化";
        btn.style.background = "#003366";
        btn.style.color = "#00ffff";
        btn.style.borderColor = "#00ffff";
        btn.style.boxShadow = "none";
    }
}

function cooldownTick() {
    if (stoneCooldownSeconds > 0) {
        stoneCooldownSeconds--;
        updateStoneBtnUI();
        if (stoneCooldownSeconds > 0) {
            stoneCooldownTimer = setTimeout(cooldownTick, 1000);
        } else {
            window.Game.stoneCooldown = false;
            updateStoneBtnUI();
        }
    }
}

// 💡 透明化スキルの実行ロジック（UI変更＆回転バグ防止対応）
function useStone(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); } 
    if (window.Game.stoneCooldown || window.Game.isStealth) return;
    
    window.Game.isStealth = true; 
    window.Game.stoneCooldown = true;
    updateStoneBtnUI();

    if (typeof window.playStoneSound === 'function') window.playStoneSound();
    if (typeof window.typeWriterMessage === 'function') window.typeWriterMessage("お願い……！気づかないで、息潜めてるから……ッ！！", 40);
    
    setTimeout(() => {
        window.Game.isStealth = false;
        stoneCooldownSeconds = 20; // 💡 20秒のカウントダウン開始
        updateStoneBtnUI();
        stoneCooldownTimer = setTimeout(cooldownTick, 1000);
    }, 5000); // 💡 5秒間効果持続
}

function initGame() {
    window.stopSynthBgm(); 
    currentTheme = stageThemes[Math.floor(Math.random() * stageThemes.length)];
    let musicNumber = (Math.floor(Math.random() * stageThemes.length) % 3) + 1; 
    loadMusicScript(musicNumber);
    generatePerfectConnectedMaze();
    
    window.Game.fakeWalls = {}; 

    window.Game.player = { x: 1.5, y: 1.5, dir: 1 }; window.Game.visitedTiles = { '1,1': 1 };
    
    if (window.Game.chasers) {
        window.Game.chasers.forEach(c => { if(typeof c.destroy === 'function') c.destroy(); });
    }
    window.Game.chasers = [];
    
    window.Game.chasers.push(new window.Enemies.Stalker(window.Game.MAP_SIZE - 2, window.Game.MAP_SIZE - 2));
    if (Math.random() < 0.5) window.Game.chasers.push(new window.Enemies.SoundRunner(2, window.Game.MAP_SIZE - 2));
    
    window.Game.chasers.push(new window.Enemies.Builder(window.Game.MAP_SIZE - 5, 5));

    let mimic = new window.Enemies.MimicBattery(15, 15);
    while(!window.Game.mapDataArray[mimic.y] || window.Game.mapDataArray[mimic.y][mimic.x] === 1 || (mimic.x === 1 && mimic.y === 1)) {
        mimic.x = Math.floor(Math.random() * (window.Game.MAP_SIZE - 2)) + 1; mimic.y = Math.floor(Math.random() * (window.Game.MAP_SIZE - 2)) + 1;
    }
    window.Game.chasers.push(mimic);

    window.Game.chasers.forEach(chaser => {
        while(!window.Game.mapDataArray[chaser.y] || window.Game.mapDataArray[chaser.y][chaser.x] === 1) { 
            chaser.x--; if(chaser.x < 1) { chaser.x = 1; break; } 
        }
    });
    
    window.camV = { x: 1.5, y: 1.5, angle: 0, drawX: 1.5, drawY: 1.5 };
    window.Game.steps = 0; window.Game.battery = 100; window.Game.mental = 100;
    
    window.Game.isStealth = false; 
    window.Game.stoneCooldown = false; 
    window.Game.minimapStatic = false; 
    stoneCooldownSeconds = 0;
    if (stoneCooldownTimer) clearTimeout(stoneCooldownTimer);
    updateStoneBtnUI();

    if (stepEl) stepEl.innerText = "000000"; 
    updateHudUI(); triggerInitialTextSafety(); startChaserAILoop();
}

document.addEventListener("DOMContentLoaded", () => {
    window.canvas = document.getElementById('gameCanvas'); if (window.canvas) window.ctx = window.canvas.getContext('2d');
    minimapCanvas = document.getElementById('minimapCanvas'); if (minimapCanvas) mctx = minimapCanvas.getContext('2d');
    stepEl = document.getElementById('steps'); batteryHud = document.getElementById('battery-hud'); mentalHud = document.getElementById('mental-hud'); 
    autoBtn = document.getElementById('auto-btn'); scareOverlay = document.getElementById('scare-overlay'); scareImg = document.getElementById('scare-img'); pokemonTextEl = document.getElementById('pokemon-text');
    if (autoBtn) autoBtn.addEventListener('click', handleAutoBtnClick); 
    window.addEventListener('touchstart', handleTouchStart, {passive: false}); window.addEventListener('touchend', handleTouchEnd); 
    
    let stoneBtn = document.createElement('button');
    stoneBtn.id = 'stone-btn'; 
    stoneBtn.innerText = '透明化';
    stoneBtn.style.cssText = "position: absolute; bottom: 130px; left: 10px; z-index: 100; padding: 12px 18px; background: #003366; color: #00ffff; border: 2px solid #00ffff; font-family: 'DotGothic16', monospace; font-size: 16px; font-weight: bold; border-radius: 6px; cursor: pointer; text-shadow: 0 0 5px #00ffff; transition: all 0.3s; min-width: 80px; text-align: center;";
    document.body.appendChild(stoneBtn);
    
    stoneBtn.addEventListener('click', useStone); 
    stoneBtn.addEventListener('touchstart', useStone, {passive: false});
    stoneBtn.addEventListener('touchend', (e) => { e.preventDefault(); e.stopPropagation(); }, {passive: false});
});

window.onload = function() {
    if (typeof window.resizeCamera === 'function') window.addEventListener('resize', window.resizeCamera); 
    initGame(); 
    setTimeout(() => {
        let diagBox = document.getElementById('dialogue-window'); let textBox = document.getElementById('text-box');
        if (diagBox) { diagBox.style.pointerEvents = "auto"; diagBox.style.zIndex = "99999"; diagBox.style.opacity = "1"; diagBox.style.display = "flex"; }
        if (textBox) { textBox.style.display = "block"; textBox.style.visibility = "visible"; textBox.style.height = "100%"; }
        if (pokemonTextEl) { pokemonTextEl.style.color = "#ffffff"; pokemonTextEl.style.fontWeight = "bold"; pokemonTextEl.style.fontSize = "14px"; pokemonTextEl.style.display = "block"; pokemonTextEl.style.visibility = "visible"; pokemonTextEl.style.zIndex = "999999"; }
        if (typeof window.resizeCamera === 'function') window.resizeCamera(); 
        if (typeof window.animationRenderLoop === 'function') requestAnimationFrame(window.animationRenderLoop); 
    }, 150);
};

window.playStoneSound = function() {
    if (!window.audioCtx) return; let now = window.audioCtx.currentTime; let osc = window.audioCtx.createOscillator(); let gain = window.audioCtx.createGain();
    osc.type = "sine"; osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(1500, now + 0.1); osc.frequency.exponentialRampToValueAtTime(200, now + 1.5);
    gain.gain.setValueAtTime(1.0, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
    osc.connect(gain); gain.connect(window.audioCtx.destination); osc.start(now); osc.stop(now + 2.1);
};
window.playFootstep = function() {
    if (!window.audioCtx) return; let now = window.audioCtx.currentTime; let osc = window.audioCtx.createOscillator(); let gain = window.audioCtx.createGain();
    osc.type = "triangle"; osc.frequency.setValueAtTime(60, now); osc.frequency.exponentialRampToValueAtTime(10, now + 0.12);
    gain.gain.setValueAtTime(0.6, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain); gain.connect(window.audioCtx.destination); osc.start(now); osc.stop(now + 0.13);
};
window.playScareSound = function() {
    if (!window.audioCtx) return; let now = window.audioCtx.currentTime;
    for (let i = 0; i < 3; i++) {
        let osc = window.audioCtx.createOscillator(); let gain = window.audioCtx.createGain();       
        osc.type = "sawtooth"; osc.frequency.setValueAtTime(100 + i * 45, now); osc.frequency.linearRampToValueAtTime(800 - i * 100, now + 0.8);
        gain.gain.setValueAtTime(0.6, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
        osc.connect(gain); gain.connect(window.audioCtx.destination); osc.start(now); osc.stop(now + 1.0);
    }
};
window.playBatteryGetSound = function() {
    if (!window.audioCtx) return; let now = window.audioCtx.currentTime; let freqs = [330, 440, 660, 880];
    freqs.forEach((f, idx) => {
        let osc = window.audioCtx.createOscillator(); let gain = window.audioCtx.createGain();
        osc.type = "sine"; osc.frequency.setValueAtTime(f, now + idx * 0.05); gain.gain.setValueAtTime(0.5, now + idx * 0.05); gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.2);
        osc.connect(gain); gain.connect(window.audioCtx.destination); osc.start(now + idx * 0.05); osc.stop(now + idx * 0.05 + 0.22);
    });
};
window.playClearSound = function() {
    if (!window.audioCtx) return; let now = window.audioCtx.currentTime; let chord = [261.63, 329.63, 392.00, 523.25];
    chord.forEach(f => {
        let osc = window.audioCtx.createOscillator(); let gain = window.audioCtx.createGain();
        osc.type = "sine"; osc.frequency.setValueAtTime(f, now); osc.frequency.linearRampToValueAtTime(f * 2, now + 2.0);
        gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.15, now + 0.2); gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
        osc.connect(gain); gain.connect(window.audioCtx.destination); osc.start(now); osc.stop(now + 2.5);
    });
};
window.playTrapSound = function() {
    if (!window.audioCtx) return; 
    let now = window.audioCtx.currentTime;
    let osc = window.audioCtx.createOscillator();
    let gain = window.audioCtx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(1000, now + 0.05);
    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain); gain.connect(window.audioCtx.destination);
    osc.start(now); osc.stop(now + 0.2);
};
