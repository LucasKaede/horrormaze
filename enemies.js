// ==========================================
// 👹 enemies.js : 敵キャラクターのシステムと定義（円形オーラ完全対応版）
// ==========================================

window.Enemies = {};

window.Enemies.Helpers = {
    checkLineOfSight: function(x1, y1, x2, y2, mapData) {
        if (x1 !== x2 && y1 !== y2) return false; 
        let minX = Math.min(x1, x2), maxX = Math.max(x1, x2); 
        let minY = Math.min(y1, y2), maxY = Math.max(y1, y2); 
        if (y1 === y2) { for (let x = minX + 1; x < maxX; x++) { if (!mapData[y1] || mapData[y1][x] === 1) return false; } } 
        else { for (let y = minY + 1; y < maxY; y++) { if (!mapData[y] || mapData[y][x1] === 1) return false; } } 
        return true; 
    },
    getNextStepTowards: function(startX, startY, targetX, targetY, mapData, mapSize) {
        let path = this.getFullPath(startX, startY, targetX, targetY, mapData, mapSize);
        return path.length > 0 ? path[0] : null;
    },
    getFullPath: function(startX, startY, targetX, targetY, mapData, mapSize) {
        const dirVec = [{x: 0, y: -1}, {x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0}];
        let queue = [[startX, startY]]; let visited = {}; visited[startX + ',' + startY] = null; let found = false;
        while (queue.length > 0) {
            let [cx, cy] = queue.shift(); if (cx === targetX && cy === targetY) { found = true; break; }
            for (let d of dirVec) {
                let nx = cx + d.x, ny = cy + d.y;
                if (nx >= 0 && nx < mapSize && ny >= 0 && ny < mapSize && mapData[ny] && mapData[ny][nx] === 0) {
                    let k = nx + ',' + ny; if (!(k in visited)) { visited[k] = [cx, cy]; queue.push([nx, ny]); }
                }
            }
        }
        if (found) {
            let curr = [targetX, targetY]; let path = []; 
            while (curr !== null) { path.push(curr); curr = visited[curr[0] + ',' + curr[1]]; }
            path.reverse(); path.shift(); return path; 
        }
        return [];
    },
    
    // 💡 完全に円形（シームレス）で、距離に応じたスケールを持つオーラ描画
    drawAura: function(ctx, canvas, enemy, fov, maxDist, zBuffer, renderY, renderHeight, viewX, viewY, camAngle, colorRgb, auraRadius) {
        if (!zBuffer || zBuffer.length === 0) return;
        let mapData = window.Game.mapDataArray;
        if (!mapData) return;

        let ex = enemy.x + 0.5;
        let ey = enemy.y + 0.5;
        let dx = ex - viewX; 
        let dy = ey - viewY;
        let dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > maxDist + auraRadius) return; // 完全に遠すぎる場合はスキップ
        
        let spriteAngle = Math.atan2(dy, dx) - camAngle;
        while (spriteAngle < -Math.PI) spriteAngle += Math.PI * 2;
        while (spriteAngle > Math.PI) spriteAngle -= Math.PI * 2;
        
        // 視界外チェック（オーラ半径分だけ余裕を持たせる）
        let maxAngleExtent = Math.atan2(auraRadius, Math.max(0.1, dist));
        if (Math.abs(spriteAngle) > (fov / 1.5) + maxAngleExtent) return;
        
        let correctedDist = dist * Math.cos(spriteAngle);
        if (correctedDist < 0.1) correctedDist = 0.1;
        
        // 💡 スクリーン上のオーラの中心座標と、距離に応じた「半径（スケール）」を計算
        let screenX = Math.floor((1 - (spriteAngle + fov / 2) / fov) * canvas.width);
        let screenY = renderY + renderHeight / 2;
        let screenRadius = Math.floor((renderHeight / correctedDist) * auraRadius);
        
        if (screenRadius <= 0.1) return;

        let pulse = 0.7 + 0.3 * Math.sin(Date.now() / 300 + enemy.x);

        // 💡 画面全体で1つだけの「滑らかな円形グラデーション」を生成
        let grad = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, screenRadius);
        grad.addColorStop(0, `rgba(${colorRgb}, ${0.65 * pulse})`);
        grad.addColorStop(1, `rgba(${colorRgb}, 0)`);

        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = grad;

        let step = 2; // 描画の滑らかさ
        let startX = Math.max(0, Math.floor(screenX - screenRadius));
        let endX = Math.min(canvas.width, Math.floor(screenX + screenRadius));

        // 光が別の壁に遮蔽されていないか（角からの漏れ光）を計算
        let checkSight = function(x1, y1, x2, y2) {
            let cx = x2 - x1; let cy = y2 - y1;
            let steps = Math.max(Math.abs(cx), Math.abs(cy)) * 5; 
            if (steps === 0) return true;
            let xInc = cx / steps; let yInc = cy / steps;
            let curX = x1; let curY = y1;
            let targetX = Math.floor(x2), targetY = Math.floor(y2);

            for (let i = 0; i < steps; i++) {
                let mx = Math.floor(curX); let my = Math.floor(curY);
                // 照らされる壁自体は遮蔽物とみなさない
                if (mx === targetX && my === targetY) break; 
                
                if (mapData[my] && mapData[my][mx] === 1) return false;
                if (window.Game.fakeWalls && window.Game.fakeWalls[`${mx},${my}`] && window.Game.fakeWalls[`${mx},${my}`] > Date.now()) return false;
                curX += xInc; curY += yInc;
            }
            return true;
        };

        for (let x = startX; x < endX; x += step) {
            if (!zBuffer[x]) continue;
            let rayDist = zBuffer[x];
            
            let rayAngle = camAngle + Math.atan((x - canvas.width / 2) / (canvas.width / 2) * Math.tan(fov / 2));
            let hitX = viewX + (rayDist - 0.05) * Math.cos(rayAngle);
            let hitY = viewY + (rayDist - 0.05) * Math.sin(rayAngle);
            
            let distToHit = Math.sqrt((hitX - ex)**2 + (hitY - ey)**2);
            if (distToHit > auraRadius) continue; // オーラ範囲外
            
            if (!checkSight(ex, ey, hitX, hitY)) continue; // 光が曲がり角などに完全に遮られている
            
            // 💡 距離（rayDist）に応じて壁の高さを計算し、そこにだけグラデーションを塗る
            let wallBaseSize = Math.floor(renderHeight / rayDist);
            let wallBaseY = renderY + (renderHeight / 2) - (wallBaseSize / 2);
            
            let drawY = Math.max(renderY, wallBaseY);
            let drawH = Math.min(renderY + renderHeight, wallBaseY + wallBaseSize) - drawY;
            
            if (drawH > 0) {
                // 円形グラデーションを設定済みの fillStyle で矩形を塗るため、縦縞にならない
                ctx.fillRect(x, drawY, step, drawH);
            }
        }
        ctx.globalCompositeOperation = "source-over";
    }
};

// --- ストーカー（赤色のオーラ） ---
window.Enemies.Stalker = class {
    constructor(x, y) { this.x = x; this.y = y; this.state = "WANDER"; this.lastSeenPlayer = { x: null, y: null }; this.anim = { time: 0, state: 'WANDER', timer: 0 }; this.faceImgId = 'scare-img'; }
    destroy() {}
    getDistToPlayer(playerX, playerY) { return Math.abs(this.x - playerX) + Math.abs(this.y - playerY); }
    updateAI(playerX, playerY, mapData, mapSize) {
        let delay = 2000; let px = Math.floor(playerX), py = Math.floor(playerY);
        if (this.anim.state === 'CHARGE') return 300; else if (this.anim.state === 'ASSAULT') delay = 800;
        let dist = this.getDistToPlayer(playerX, playerY);
        if (dist > 12) {
            let wx = px + (Math.random() < 0.5 ? 4 : -4), wy = py + (Math.random() < 0.5 ? 4 : -4); wx = Math.max(1, Math.min(mapSize-2, wx)); wy = Math.max(1, Math.min(mapSize-2, wy));
            while (!mapData[wy] || mapData[wy][wx] === 1) { wx = (wx + 1) % (mapSize - 1); if(wx === 0) wx = 1; }
            this.x = wx; this.y = wy; this.state = "WANDER"; return delay;
        }
        if (window.Game.isStealth) { this.state = "WANDER"; } else { let hasSight = window.Enemies.Helpers.checkLineOfSight(this.x, this.y, px, py, mapData); if (hasSight) { this.state = "CHASE"; this.lastSeenPlayer = { x: px, y: py }; } }
        if (this.state === "CHASE") {
            let next = window.Enemies.Helpers.getNextStepTowards(this.x, this.y, this.lastSeenPlayer.x, this.lastSeenPlayer.y, mapData, mapSize); if (next) { this.x = next[0]; this.y = next[1]; }
            if (this.x === this.lastSeenPlayer.x && this.y === this.lastSeenPlayer.y) this.state = "WANDER";
        } else {
            const dirVec = [{x: 0, y: -1}, {x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0}]; let dirs = [...dirVec].sort(() => Math.random() - 0.5);
            for (let d of dirs) { let nx = this.x + d.x, ny = this.y + d.y; if (nx >= 0 && nx < mapSize && ny >= 0 && ny < mapSize && mapData[ny] && mapData[ny][nx] === 0) { this.x = nx; this.y = ny; break; } }
        }
        return delay;
    }
    render(ctx, canvas, fov, maxDist, zBuffer, renderY, renderHeight, viewX, viewY, cameraBackoff, camAngle) {
        window.Enemies.Helpers.drawAura(ctx, canvas, this, fov, maxDist, zBuffer, renderY, renderHeight, viewX, viewY, camAngle, "255, 0, 0", 4.0);
        let gx = this.x + 0.5 - viewX; let gy = this.y + 0.5 - viewY; let spriteAngle = Math.atan2(gy, gx) - camAngle;
        while (spriteAngle < -Math.PI) spriteAngle += Math.PI * 2; while (spriteAngle > Math.PI) spriteAngle -= Math.PI * 2;
        if (Math.abs(spriteAngle) >= fov / 1.5) return; let spriteDist = Math.sqrt(gx * gx + gy * gy); if (spriteDist <= 0.1 || spriteDist >= (maxDist + cameraBackoff)) return;
        let correctedDist = spriteDist * Math.cos(spriteAngle); if (correctedDist < 0.1) correctedDist = 0.1;
        let baseSize = Math.floor(renderHeight / correctedDist); let baseX = Math.floor((1 - (spriteAngle + fov / 2) / fov) * canvas.width); let baseY = renderY + (renderHeight / 2) - (baseSize / 2);
        let sShadow = 1.0 - (Math.max(0, spriteDist - cameraBackoff) / maxDist); if (sShadow < 0) sShadow = 0;
        this.anim.time += 0.05;
        if (spriteDist < 4.5 && this.anim.state === 'WANDER') { this.anim.state = 'CHARGE'; this.anim.timer = 50; } else if (this.anim.state === 'CHARGE') { this.anim.timer--; if (this.anim.timer <= 0) { this.anim.state = 'ASSAULT'; this.anim.timer = 120; } } else if (this.anim.state === 'ASSAULT') { this.anim.timer--; if (this.anim.timer <= 0 || spriteDist > 6.0) this.anim.state = 'WANDER'; } else if (spriteDist >= 5.0 && this.anim.state !== 'WANDER') { this.anim.state = 'WANDER'; }
        let headScale = 0.6, headY = -0.1, headX = 0; let bodyW = 0.25, bodyH = 0.5, bodyY = 0.4; let handW = 0.12, handH = 0.15, handL_Y = 0.4, handR_Y = 0.4, handX = 0.35;
        if (this.anim.state === 'CHARGE') { headY = 0.25; bodyY = 0.6; handL_Y = 0.6; handR_Y = 0.6; let twitch = 0.06; headX += (Math.random() - 0.5) * twitch; headY += (Math.random() - 0.5) * twitch; handX += (Math.random() - 0.5) * twitch; } else if (this.anim.state === 'ASSAULT') { headScale = 0.8; headY = -0.2; headX = (Math.random() - 0.5) * 0.02; handL_Y = -0.1; handR_Y = -0.1; handX = 0.45; } else { let walkAnim = this.anim.time * 2.5; headY += Math.abs(Math.sin(walkAnim)) * 0.04; bodyY += Math.abs(Math.sin(walkAnim)) * 0.02; handL_Y += Math.sin(walkAnim) * 0.1; handR_Y += Math.sin(walkAnim + Math.PI) * 0.1; }
        let faceImg = document.getElementById(this.faceImgId);
        function drawPart(pX, pY, pW, pH, isImg) {
            let cx = baseX + pX * baseSize; let cy = baseY + pY * baseSize; let w = isImg && faceImg ? pW * baseSize * (faceImg.naturalWidth / faceImg.naturalHeight) : pW * baseSize; let h = pH * baseSize;
            let startX = Math.floor(cx - w/2); let endX = Math.floor(cx + w/2); if (!isImg) ctx.fillStyle = `rgb(25, 5, 5)`; 
            for (let x = startX; x < endX; x++) { if (x < 0 || x >= canvas.width) continue; if (zBuffer[x] && spriteDist < zBuffer[x]) { let drawY = Math.max(renderY, cy); let drawH = Math.min(renderY + renderHeight, cy + h) - drawY; if (drawH > 0) { if (isImg && faceImg && faceImg.complete) { let texX = Math.floor(((x - startX) / w) * faceImg.naturalWidth); let yOffset = drawY - cy; let texY = (yOffset / h) * faceImg.naturalHeight; let texH = (drawH / h) * faceImg.naturalHeight; ctx.drawImage(faceImg, texX, texY, 1, texH, x, drawY, 1, drawH); if (sShadow < 1.0) { ctx.fillStyle = `rgba(0, 0, 0, ${1.0 - sShadow})`; ctx.fillRect(x, drawY, 1, drawH); } } else { ctx.fillRect(x, drawY, 1, drawH); if (sShadow < 1.0) { ctx.fillStyle = `rgba(0, 0, 0, ${1.0 - sShadow})`; ctx.fillRect(x, drawY, 1, drawH); } } } } }
        }
        drawPart(headX, bodyY, bodyW, bodyH, false); drawPart(headX - handX, handL_Y, handW, handH, false); drawPart(headX + handX, handR_Y, handW, handH, false); drawPart(headX, headY, headScale, headScale, true);    
    }
};

// --- ランナー（青色のオーラ） ---
window.Enemies.SoundRunner = class {
    constructor(x, y) { this.x = x; this.y = y; this.anim = { time: 0 }; this.faceImgId = 'scare-img'; this.dirX = 1; this.dirY = 0; this.visitedTiles = {}; this.visitedTiles[x + ',' + y] = 1; this.audioInitialized = false; }
    destroy() { if (this.osc) { try { this.osc.stop(); this.osc.disconnect(); } catch(e){} try { this.lfo.stop(); this.lfo.disconnect(); } catch(e){} } }
    playDistinctSound(dist) { if (!window.audioCtx || window.audioCtx.state !== 'running') return; let vol = Math.max(0, 1.0 - (dist / 15.0)); if (vol <= 0.01) return; let now = window.audioCtx.currentTime; let oscLow = window.audioCtx.createOscillator(); let gainLow = window.audioCtx.createGain(); oscLow.type = 'square'; oscLow.frequency.setValueAtTime(100 + (15-dist)*3, now); oscLow.frequency.exponentialRampToValueAtTime(10, now + 0.15); gainLow.gain.setValueAtTime(vol * 0.8, now); gainLow.gain.exponentialRampToValueAtTime(0.001, now + 0.15); oscLow.connect(gainLow); gainLow.connect(window.audioCtx.destination); oscLow.start(now); oscLow.stop(now + 0.2); let oscHigh = window.audioCtx.createOscillator(); let gainHigh = window.audioCtx.createGain(); oscHigh.type = 'sawtooth'; oscHigh.frequency.setValueAtTime(600 + (15-dist)*30, now); oscHigh.frequency.exponentialRampToValueAtTime(100, now + 0.1); gainHigh.gain.setValueAtTime(vol * 0.3, now); gainHigh.gain.exponentialRampToValueAtTime(0.001, now + 0.1); oscHigh.connect(gainHigh); gainHigh.connect(window.audioCtx.destination); oscHigh.start(now); oscHigh.stop(now + 0.15); }
    updateAI(playerX, playerY, mapData, mapSize) {
        let delay = 300; let dist = Math.abs(this.x - playerX) + Math.abs(this.y - playerY); this.playDistinctSound(dist);
        const dirVec = [{x: 0, y: -1}, {x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0}]; let candidates = [];
        for (let d of dirVec) { let nx = this.x + d.x, ny = this.y + d.y; if (nx >= 0 && nx < mapSize && ny >= 0 && ny < mapSize && mapData[ny] && mapData[ny][nx] === 0) { candidates.push({ x: nx, y: ny, dx: d.x, dy: d.y, visits: this.visitedTiles[nx + ',' + ny] || 0 }); } }
        if (candidates.length > 0) { let minVisits = Math.min(...candidates.map(c => c.visits)); let bestCandidates = candidates.filter(c => c.visits === minVisits); let straight = bestCandidates.find(c => c.dx === this.dirX && c.dy === this.dirY); let nextMove = (straight && Math.random() < 0.7) ? straight : bestCandidates[Math.floor(Math.random() * bestCandidates.length)]; this.dirX = nextMove.dx; this.dirY = nextMove.dy; this.x = nextMove.x; this.y = nextMove.y; this.visitedTiles[this.x + ',' + this.y] = (this.visitedTiles[this.x + ',' + this.y] || 0) + 1; }
        return delay;
    }
    render(ctx, canvas, fov, maxDist, zBuffer, renderY, renderHeight, viewX, viewY, cameraBackoff, camAngle) {
        window.Enemies.Helpers.drawAura(ctx, canvas, this, fov, maxDist, zBuffer, renderY, renderHeight, viewX, viewY, camAngle, "30, 80, 255", 3.5);
        let gx = this.x + 0.5 - viewX; let gy = this.y + 0.5 - viewY; let spriteAngle = Math.atan2(gy, gx) - camAngle; while (spriteAngle < -Math.PI) spriteAngle += Math.PI * 2; while (spriteAngle > Math.PI) spriteAngle -= Math.PI * 2; if (Math.abs(spriteAngle) >= fov / 1.5) return; let spriteDist = Math.sqrt(gx * gx + gy * gy); if (spriteDist <= 0.1 || spriteDist >= (maxDist + cameraBackoff)) return;
        let correctedDist = spriteDist * Math.cos(spriteAngle); if (correctedDist < 0.1) correctedDist = 0.1; let baseSize = Math.floor(renderHeight / correctedDist); let baseX = Math.floor((1 - (spriteAngle + fov / 2) / fov) * canvas.width); let baseY = renderY + (renderHeight / 2) - (baseSize / 2); let sShadow = 1.0 - (Math.max(0, spriteDist - cameraBackoff) / maxDist); if (sShadow < 0) sShadow = 0;
        this.anim.time += 0.2; let headScale = 0.7; let headX = (Math.random() - 0.5) * 0.1; let headY = (Math.random() - 0.5) * 0.1; let faceImg = document.getElementById(this.faceImgId); let cx = baseX + headX * baseSize; let cy = baseY + headY * baseSize; let w = faceImg ? headScale * baseSize * (faceImg.naturalWidth / faceImg.naturalHeight) : headScale * baseSize; let h = headScale * baseSize; let startX = Math.floor(cx - w/2); let endX = Math.floor(cx + w/2);
        for (let x = startX; x < endX; x++) { if (x < 0 || x >= canvas.width) continue; if (zBuffer[x] && spriteDist < zBuffer[x]) { let drawY = Math.max(renderY, cy); let drawH = Math.min(renderY + renderHeight, cy + h) - drawY; if (drawH > 0) { if (faceImg && faceImg.complete) { let texX = Math.floor(((x - startX) / w) * faceImg.naturalWidth); let yOffset = drawY - cy; let texY = (yOffset / h) * faceImg.naturalHeight; let texH = (drawH / h) * faceImg.naturalHeight; ctx.drawImage(faceImg, texX, texY, 1, texH, x, drawY, 1, drawH); ctx.fillStyle = `rgba(0, 50, 150, 0.4)`; ctx.fillRect(x, drawY, 1, drawH); if (sShadow < 1.0) { ctx.fillStyle = `rgba(0, 0, 0, ${1.0 - sShadow})`; ctx.fillRect(x, drawY, 1, drawH); } } else { ctx.fillStyle = `rgb(50, 50, 200)`; ctx.fillRect(x, drawY, 1, drawH); if (sShadow < 1.0) { ctx.fillStyle = `rgba(0, 0, 0, ${1.0 - sShadow})`; ctx.fillRect(x, drawY, 1, drawH); } } } } }
    }
};

// --- ニセ電池（ミミック）（緑色のオーラ） ---
window.Enemies.MimicBattery = class {
    constructor(x, y) { this.x = x; this.y = y; this.state = "DISGUISED"; this.anim = { time: 0, timer: 0 }; }
    destroy() {}
    getDistToPlayer(playerX, playerY) { return Math.abs(this.x - playerX) + Math.abs(this.y - playerY); }
    updateAI(playerX, playerY, mapData, mapSize) {
        let px = Math.floor(playerX), py = Math.floor(playerY); let dist = this.getDistToPlayer(px, py);
        if (this.state === "DISGUISED") {
            let hasSight = window.Enemies.Helpers.checkLineOfSight(this.x, this.y, px, py, mapData);
            let playerAngle = (window.Game.player.dir * Math.PI / 2) - (Math.PI / 2); let angleToMimic = Math.atan2(this.y - py, this.x - px);
            let angleDiff = Math.abs(angleToMimic - playerAngle); if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
            let inSight = angleDiff < Math.PI / 4;
            if (dist <= 3 && hasSight && inSight) {
                this.state = "REVEALING"; this.anim.timer = 90;
                if (window.audioCtx) { let now = window.audioCtx.currentTime; let osc = window.audioCtx.createOscillator(); let gain = window.audioCtx.createGain(); osc.type = 'sawtooth'; osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(50, now + 1.5); gain.gain.setValueAtTime(0.5, now); gain.gain.linearRampToValueAtTime(0, now + 1.5); osc.connect(gain); gain.connect(window.audioCtx.destination); osc.start(now); osc.stop(now + 1.5); }
                return 1500;
            }
            return 500;
        }
        if (this.state === "REVEALING") { this.state = "CHASE"; return 1000; }
        if (dist > 15) {
            let wx = px + (Math.random() < 0.5 ? 6 : -6), wy = py + (Math.random() < 0.5 ? 6 : -6); wx = Math.max(1, Math.min(mapSize-2, wx)); wy = Math.max(1, Math.min(mapSize-2, wy));
            while (!mapData[wy] || mapData[wy][wx] === 1) { wx = (wx + 1) % (mapSize - 1); if(wx === 0) wx = 1; }
            this.x = wx; this.y = wy; this.state = "DISGUISED"; this.anim.time = 0; return 500;
        }
        let next = window.Enemies.Helpers.getNextStepTowards(this.x, this.y, px, py, mapData, mapSize); if (next) { this.x = next[0]; this.y = next[1]; }
        return 2000; 
    }
    render(ctx, canvas, fov, maxDist, zBuffer, renderY, renderHeight, viewX, viewY, cameraBackoff, camAngle) {
        if (this.state === "DISGUISED") { 
            window.Enemies.Helpers.drawAura(ctx, canvas, this, fov, maxDist, zBuffer, renderY, renderHeight, viewX, viewY, camAngle, "20, 255, 20", 2.0);
            window.renderSprite(ctx, canvas, this, window.batteryTex, fov, maxDist, zBuffer, renderY, renderHeight, viewX, viewY, cameraBackoff, 0.4, true); 
            return; 
        }
        window.Enemies.Helpers.drawAura(ctx, canvas, this, fov, maxDist, zBuffer, renderY, renderHeight, viewX, viewY, camAngle, "20, 255, 20", 3.0);
        let gx = this.x + 0.5 - viewX; let gy = this.y + 0.5 - viewY; let spriteAngle = Math.atan2(gy, gx) - camAngle; while (spriteAngle < -Math.PI) spriteAngle += Math.PI * 2; while (spriteAngle > Math.PI) spriteAngle -= Math.PI * 2; if (Math.abs(spriteAngle) >= fov / 1.5) return; let spriteDist = Math.sqrt(gx * gx + gy * gy); if (spriteDist <= 0.1 || spriteDist >= (maxDist + cameraBackoff)) return;
        let correctedDist = spriteDist * Math.cos(spriteAngle); if (correctedDist < 0.1) correctedDist = 0.1; let baseSize = Math.floor(renderHeight / correctedDist); let baseX = Math.floor((1 - (spriteAngle + fov / 2) / fov) * canvas.width); let baseY = renderY + (renderHeight / 2) - (baseSize / 2); let sShadow = 1.0 - (Math.max(0, spriteDist - cameraBackoff) / maxDist); if (sShadow < 0) sShadow = 0;
        this.anim.time += 0.1; let headScale = 0.3, headY = -0.1, headX = 0; let bodyW = 0.15, bodyH = 0.6, bodyY = 0.3; let handW = 0.08, handH = 0.3, handL_Y = 0.3, handR_Y = 0.3, handX = 0.2; let color = `rgb(10, 40, 10)`;
        if (this.state === "REVEALING") { let progress = 1.0 - (this.anim.timer / 90); this.anim.timer--; headX += (Math.random() - 0.5) * 0.1 * (1 - progress); headY = 0.4 - progress * 0.6; bodyY = 0.7 - progress * 0.4; } else { let walk = this.anim.time * 2.0; headY += Math.sin(walk) * 0.05; handL_Y += Math.sin(walk) * 0.2; handR_Y += Math.sin(walk + Math.PI) * 0.2; handX += Math.cos(walk) * 0.05; }
        const drawPart = (pX, pY, pW, pH) => { let cx = baseX + pX * baseSize; let cy = baseY + pY * baseSize; let w = pW * baseSize; let h = pH * baseSize; let startX = Math.floor(cx - w/2); let endX = Math.floor(cx + w/2); for (let x = startX; x < endX; x++) { if (x < 0 || x >= canvas.width) continue; if (zBuffer[x] && spriteDist < zBuffer[x]) { let drawY = Math.max(renderY, cy); let drawH = Math.min(renderY + renderHeight, cy + h) - drawY; if (drawH > 0) { ctx.fillStyle = color; ctx.fillRect(x, drawY, 1, drawH); if (sShadow < 1.0) { ctx.fillStyle = `rgba(0, 0, 0, ${1.0 - sShadow})`; ctx.fillRect(x, drawY, 1, drawH); } } } } };
        drawPart(headX, bodyY, bodyW, bodyH); drawPart(headX - handX, handL_Y, handW, handH); drawPart(headX + handX, handR_Y, handW, handH);
        let s = baseSize * 0.3; let headStartX = Math.floor(baseX - s/2 + headX * baseSize); let headEndX = Math.floor(baseX + s/2 + headX * baseSize); let headTopY = baseY + headY * baseSize; let headHeight = s * 2;
        if (window.batteryTex) { for (let x = headStartX; x < headEndX; x++) { if (x < 0 || x >= canvas.width) continue; if (zBuffer[x] && spriteDist < zBuffer[x]) { let drawY = Math.max(renderY, headTopY); let drawH = Math.min(renderY + renderHeight, headTopY + headHeight) - drawY; if (drawH > 0) { let texX = Math.floor(((x - headStartX) / s) * window.batteryTex.width); if (texX < 0) texX = 0; if (texX >= window.batteryTex.width) texX = window.batteryTex.width - 1; let yOffset = drawY - headTopY; let texY = (yOffset / headHeight) * window.batteryTex.height; let texH = (drawH / headHeight) * window.batteryTex.height; if (texH > 0 && texY >= 0) { ctx.drawImage(window.batteryTex, texX, texY, 1, texH, x, drawY, 1, drawH); } if (sShadow < 1.0) { ctx.fillStyle = `rgba(0, 0, 0, ${1.0 - sShadow})`; ctx.fillRect(x, drawY, 1, drawH); } } } } }
    }
};

// --- ビルダー（白色のオーラ） ---
window.Enemies.Builder = class {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.timer = 10000; 
        this.faceImgId = 'scare-img';
        this.animTime = 0;
        if (!window.Game.fakeWalls) window.Game.fakeWalls = {};
    }

    destroy() {}

    playBuildSound() {
        if (!window.audioCtx || window.audioCtx.state !== 'running') return;
        let now = window.audioCtx.currentTime;
        let osc = window.audioCtx.createOscillator();
        let gain = window.audioCtx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain); gain.connect(window.audioCtx.destination);
        osc.start(now); osc.stop(now + 0.2);
    }

    updateAI(playerX, playerY, mapData, mapSize) {
        let delay = 500;
        this.timer -= delay;

        let now = Date.now();
        for (let key in window.Game.fakeWalls) {
            if (window.Game.fakeWalls[key] < now) delete window.Game.fakeWalls[key];
        }

        if (this.timer <= 0) {
            let candidates = [];
            for (let y = 1; y < mapSize - 1; y++) {
                for (let x = 1; x < mapSize - 1; x++) {
                    if (mapData[y][x] === 0) candidates.push({x, y});
                }
            }

            if (candidates.length > 0) {
                let target = candidates[Math.floor(Math.random() * candidates.length)];
                this.x = target.x; this.y = target.y;

                let wallCands = [];
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        let nx = this.x + dx; let ny = this.y + dy;
                        if (mapData[ny] && mapData[ny][nx] === 0) {
                            wallCands.push({x: nx, y: ny});
                        }
                    }
                }
                if (wallCands.length > 0) {
                    let wallTarget = wallCands[Math.floor(Math.random() * wallCands.length)];
                    window.Game.fakeWalls[`${wallTarget.x},${wallTarget.y}`] = now + 60000;
                }
                this.playBuildSound();
            }
            this.timer = 10000; 
        }
        return delay;
    }

    render(ctx, canvas, fov, maxDist, zBuffer, renderY, renderHeight, viewX, viewY, cameraBackoff, camAngle) {
        window.Enemies.Helpers.drawAura(ctx, canvas, this, fov, maxDist, zBuffer, renderY, renderHeight, viewX, viewY, camAngle, "220, 220, 220", 3.5);

        let gx = this.x + 0.5 - viewX; let gy = this.y + 0.5 - viewY; let spriteAngle = Math.atan2(gy, gx) - camAngle;
        while (spriteAngle < -Math.PI) spriteAngle += Math.PI * 2; while (spriteAngle > Math.PI) spriteAngle -= Math.PI * 2;
        
        if (Math.abs(spriteAngle) < fov / 1.5) {
            let spriteDist = Math.sqrt(gx * gx + gy * gy);
            if (spriteDist > 0.1 && spriteDist < (maxDist + cameraBackoff)) {
                let correctedDist = spriteDist * Math.cos(spriteAngle); if (correctedDist < 0.1) correctedDist = 0.1;
                let baseSize = Math.floor(renderHeight / correctedDist); let baseX = Math.floor((1 - (spriteAngle + fov / 2) / fov) * canvas.width); let baseY = renderY + (renderHeight / 2) - (baseSize / 2);
                let sShadow = 1.0 - (Math.max(0, spriteDist - cameraBackoff) / maxDist); if (sShadow < 0) sShadow = 0;
                
                this.animTime += 0.05;
                let floatY = Math.sin(this.animTime) * 0.05;

                let headScale = 0.5, headY = -0.15 + floatY, headX = 0; 
                let bodyW = 0.3, bodyH = 0.55, bodyY = 0.35 + floatY; 
                let handW = 0.1, handH = 0.2, handL_Y = 0.3 + floatY, handR_Y = 0.3 + floatY, handX = 0.25;
                
                let bodyColor = `rgb(220, 220, 220)`;
                
                const drawPart = (pX, pY, pW, pH) => { 
                    let cx = baseX + pX * baseSize; let cy = baseY + pY * baseSize; let w = pW * baseSize; let h = pH * baseSize; 
                    let startX = Math.floor(cx - w/2); let endX = Math.floor(cx + w/2); 
                    for (let x = startX; x < endX; x++) { 
                        if (x < 0 || x >= canvas.width) continue; 
                        if (zBuffer[x] && spriteDist < zBuffer[x]) { 
                            let drawY = Math.max(renderY, cy); let drawH = Math.min(renderY + renderHeight, cy + h) - drawY; 
                            if (drawH > 0) { 
                                ctx.fillStyle = bodyColor; ctx.fillRect(x, drawY, 1, drawH); 
                                if (sShadow < 1.0) { ctx.fillStyle = `rgba(0, 0, 0, ${1.0 - sShadow})`; ctx.fillRect(x, drawY, 1, drawH); } 
                            } 
                        } 
                    } 
                };
                
                drawPart(headX, bodyY, bodyW, bodyH); 
                drawPart(headX - handX, handL_Y, handW, handH); 
                drawPart(headX + handX, handR_Y, handW, handH); 
                
                let faceImg = document.getElementById(this.faceImgId);
                if (faceImg && faceImg.complete) {
                    let w = headScale * baseSize * (faceImg.naturalWidth / faceImg.naturalHeight);
                    let h = headScale * baseSize;
                    let cx = baseX + headX * baseSize; let cy = baseY + headY * baseSize;
                    let startX = Math.floor(cx - w/2); let endX = Math.floor(cx + w/2);
                    for (let x = startX; x < endX; x++) {
                        if (x < 0 || x >= canvas.width) continue;
                        if (zBuffer[x] && spriteDist < zBuffer[x]) {
                            let drawY = Math.max(renderY, cy); let drawH = Math.min(renderY + renderHeight, cy + h) - drawY;
                            if (drawH > 0) {
                                let texX = Math.floor(((x - startX) / w) * faceImg.naturalWidth);
                                let yOffset = drawY - cy; let texY = (yOffset / h) * faceImg.naturalHeight; let texH = (drawH / h) * faceImg.naturalHeight;
                                ctx.drawImage(faceImg, texX, texY, 1, texH, x, drawY, 1, drawH);
                                if (sShadow < 1.0) { ctx.fillStyle = `rgba(0, 0, 0, ${1.0 - sShadow})`; ctx.fillRect(x, drawY, 1, drawH); }
                            }
                        }
                    }
                }
            }
        }

        let now = Date.now();
        for (let key in window.Game.fakeWalls) {
            if (window.Game.fakeWalls[key] < now) continue;
            
            let [fx, fy] = key.split(',').map(Number);
            let wgx = fx + 0.5 - viewX;
            let wgy = fy + 0.5 - viewY;
            let wAngle = Math.atan2(wgy, wgx) - camAngle;
            while (wAngle < -Math.PI) wAngle += Math.PI * 2;
            while (wAngle > Math.PI) wAngle -= Math.PI * 2;
            if (Math.abs(wAngle) >= fov / 1.5) continue;

            let wDist = Math.sqrt(wgx * wgx + wgy * wgy);
            if (wDist <= 0.1 || wDist >= (maxDist + cameraBackoff)) continue;

            let wCorrected = wDist * Math.cos(wAngle);
            if (wCorrected < 0.1) wCorrected = 0.1;
            
            let wBaseSize = Math.floor(renderHeight / wCorrected);
            let wBaseX = Math.floor((1 - (wAngle + fov / 2) / fov) * canvas.width);
            let wBaseY = renderY + (renderHeight / 2) - (wBaseSize / 2);

            let startX = Math.floor(wBaseX - wBaseSize / 2);
            let endX = Math.floor(wBaseX + wBaseSize / 2);

            ctx.fillStyle = `rgba(100, 150, 150, 0.45)`;
            for (let x = startX; x < endX; x++) {
                if (x < 0 || x >= canvas.width) continue;
                if (zBuffer[x] && wDist < zBuffer[x]) {
                    let drawY = Math.max(renderY, wBaseY);
                    let drawH = Math.min(renderY + renderHeight, wBaseY + wBaseSize) - drawY;
                    if (drawH > 0) {
                        ctx.fillRect(x, drawY, 1, drawH);
                    }
                }
            }
        }
    }
};
