// ==========================================
// 🎥 camera.js : 3Dレイトレーシング描画エンジン（ミミック連携対応版）
// ==========================================

(function() {
    let noiseY = 0;

    const stageThemes = [
        { name: "gray",   wall: '#444444', wallDark: '#222222', floor: '#111111', ceiling: '#0a0a0a' },
        { name: "blue",   wall: '#223344', wallDark: '#111a22', floor: '#08111a', ceiling: '#050a10' },
        { name: "red",    wall: '#552222', wallDark: '#2a1111', floor: '#1a0808', ceiling: '#100505' },
        { name: "green",  wall: '#224422', wallDark: '#112211', floor: '#081408', ceiling: '#050c05' },
        { name: "purple", wall: '#442244', wallDark: '#221122', floor: '#140814', ceiling: '#0c050c' }
    ];

    const currentTheme = stageThemes[Math.floor(Math.random() * stageThemes.length)];
    window.getStageColors = function() { return currentTheme; };

    function getDynamicMaxDist() {
        if (!window.Game || typeof window.Game.battery === 'undefined') return 9.0;
        let bat = window.Game.battery;
        return 0.5 + (bat / 100) * 8.5;
    }

    // 💡 外部（enemies.js）からミミックが電池のフリをするためにグローバル化
    window.batteryTex = document.createElement('canvas');
    window.batteryTex.width = 32; window.batteryTex.height = 64;
    const bCtx = window.batteryTex.getContext('2d');
    bCtx.clearRect(0, 0, 32, 64);
    bCtx.fillStyle = '#000000'; bCtx.fillRect(9, 1, 14, 8); bCtx.fillRect(3, 7, 26, 55);
    bCtx.fillStyle = '#cccccc'; bCtx.fillRect(10, 2, 12, 6);
    bCtx.fillStyle = '#333333'; bCtx.fillRect(4, 8, 24, 53);
    bCtx.fillStyle = '#00ff00'; bCtx.fillRect(6, 26, 20, 33);
    bCtx.fillStyle = '#aaffaa'; bCtx.fillRect(6, 26, 20, 4);
    bCtx.fillStyle = 'rgba(255, 255, 255, 0.3)'; bCtx.fillRect(6, 8, 6, 53);
    bCtx.fillStyle = '#ffffff'; bCtx.beginPath();
    bCtx.moveTo(18, 30); bCtx.lineTo(10, 42); bCtx.lineTo(16, 42);
    bCtx.lineTo(14, 54); bCtx.lineTo(24, 40); bCtx.lineTo(18, 40); bCtx.fill();

    const goalTex = document.createElement('canvas');
    goalTex.width = 64; goalTex.height = 64;
    const gCtx = goalTex.getContext('2d');
    gCtx.clearRect(0, 0, 64, 64);
    let grad = gCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(0, 255, 255, 1)'); grad.addColorStop(0.5, 'rgba(0, 255, 255, 0.5)'); grad.addColorStop(1, 'rgba(0, 255, 255, 0)');
    gCtx.fillStyle = grad; gCtx.fillRect(0, 0, 64, 64);
    gCtx.fillStyle = '#ffffff'; gCtx.beginPath(); gCtx.arc(32, 32, 8, 0, Math.PI * 2); gCtx.fill();

    // 💡 外部から描画関数を呼び出せるように window にアタッチ
    window.renderSprite = function(ctx, canvas, sprite, texture, fov, maxDist, zBuffer, renderY, renderHeight, viewX, viewY, cameraBackoff, scale = 1.0, groundAlign = false) {
        if (!sprite) return;
        let gx = sprite.x + 0.5 - viewX; let gy = sprite.y + 0.5 - viewY;
        let spriteAngle = Math.atan2(gy, gx) - window.camV.angle;
        while (spriteAngle < -Math.PI) spriteAngle += Math.PI * 2; while (spriteAngle > Math.PI) spriteAngle -= Math.PI * 2;
        
        if (Math.abs(spriteAngle) < fov / 1.5) {
            let spriteDist = Math.sqrt(gx * gx + gy * gy);
            if (spriteDist > 0.1 && spriteDist < (maxDist + cameraBackoff)) {
                let correctedDist = spriteDist * Math.cos(spriteAngle); if (correctedDist < 0.1) correctedDist = 0.1;
                let baseSpriteSize = Math.floor(renderHeight / correctedDist);
                let actualSpriteSize = baseSpriteSize * scale;
                let isCanvas = (typeof texture !== 'function');
                let spriteWidth = isCanvas ? actualSpriteSize * (texture.width / texture.height) : actualSpriteSize / 4;
                let spriteX = Math.floor((1 - (spriteAngle + fov / 2) / fov) * canvas.width);
                let spriteY = renderY + (renderHeight / 2) - (actualSpriteSize / 2);
                
                if (groundAlign) {
                    let wallBottom = renderY + (renderHeight / 2) + (baseSpriteSize / 2);
                    spriteY = wallBottom - actualSpriteSize;
                }

                let shadowDist = Math.max(0, spriteDist - cameraBackoff); let sShadow = 1.0 - (shadowDist / maxDist); if (sShadow < 0) sShadow = 0;
                let startX = Math.floor(spriteX - spriteWidth / 2); let endX = Math.floor(spriteX + spriteWidth / 2);
                
                for (let x = startX; x < endX; x++) {
                    if (x < 0 || x >= canvas.width) continue;
                    if (zBuffer[x] && spriteDist < zBuffer[x]) {
                        let drawY = Math.max(renderY, spriteY); let drawH = Math.min(renderY + renderHeight, spriteY + actualSpriteSize) - drawY;
                        if (drawH > 0) {
                            if (isCanvas) {
                                let texX = Math.floor(((x - startX) / spriteWidth) * texture.width);
                                if (texX < 0) texX = 0; if (texX >= texture.width) texX = texture.width - 1;
                                let yOffset = drawY - spriteY; let texY = (yOffset / actualSpriteSize) * texture.height; let texH = (drawH / actualSpriteSize) * texture.height;
                                if (texH > 0 && texY >= 0) ctx.drawImage(texture, texX, texY, 1, texH, x, drawY, 1, drawH);
                                if (sShadow < 1.0) { ctx.fillStyle = `rgba(0, 0, 0, ${1.0 - sShadow})`; ctx.fillRect(x, drawY, 1, drawH); }
                            } else {
                                ctx.fillStyle = texture(sShadow); ctx.fillRect(x, drawY, 1, drawH); 
                            }
                        }
                    }
                }
            }
        }
    }

    window.animationRenderLoop = function() {
        if (!window.Game || window.Game.isScaring) { requestAnimationFrame(window.animationRenderLoop); return; }
        let ctx = window.ctx; let canvas = window.canvas;
        if (!ctx || !canvas) { requestAnimationFrame(window.animationRenderLoop); return; }

        if (!window.camV) { window.camV = { x: window.Game.player.x, y: window.Game.player.y, angle: 0, drawX: window.Game.player.x, drawY: window.Game.player.y }; }
        let targetAngle = window.Game.player.dir * (Math.PI / 2) - (Math.PI / 2);
        let diffA = targetAngle - window.camV.angle;
        while (diffA < -Math.PI) diffA += Math.PI * 2; while (diffA > Math.PI) diffA -= Math.PI * 2;
        window.camV.angle += diffA * 0.25; window.camV.drawX += (window.Game.player.x - window.camV.drawX) * 0.25; window.camV.drawY += (window.Game.player.y - window.camV.drawY) * 0.25;

        let renderHeight = Math.floor(canvas.width * 0.88); if (renderHeight > canvas.height) renderHeight = canvas.height;
        let renderY = Math.floor((canvas.height - renderHeight) / 2);
        ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, canvas.width, canvas.height);

        let colors = window.getStageColors();
        ctx.fillStyle = colors.ceiling; ctx.fillRect(0, renderY, canvas.width, renderHeight / 2);
        ctx.fillStyle = colors.floor; ctx.fillRect(0, renderY + renderHeight / 2, canvas.width, renderHeight / 2);

        let maxDist = getDynamicMaxDist(); let fov = 1.0; let numRays = canvas.width;
        let zBuffer = new Float32Array(numRays);
        let cameraBackoff = 0.5; let viewX = window.camV.drawX - Math.cos(window.camV.angle) * cameraBackoff; let viewY = window.camV.drawY - Math.sin(window.camV.angle) * cameraBackoff;

        let backGridX = Math.floor(viewX); let backGridY = Math.floor(viewY); let originalWallState = 0; let hasModifiedMap = false;
        if (backGridX >= 0 && backGridX < window.Game.MAP_SIZE && backGridY >= 0 && backGridY < window.Game.MAP_SIZE) {
            if (window.Game.mapDataArray[backGridY][backGridX] === 1) { originalWallState = 1; window.Game.mapDataArray[backGridY][backGridX] = 0; hasModifiedMap = true; }
        }

        for (let i = 0; i < numRays; i++) {
            let rayAngle = (window.camV.angle - fov / 2) + (i / numRays) * fov;
            let distanceToWall = 0; let hitWall = false; let sideHit = false; let eyeX = Math.cos(rayAngle); let eyeY = Math.sin(rayAngle); let startX = viewX; let startY = viewY;
            while (!hitWall && distanceToWall < (maxDist + cameraBackoff)) {
                distanceToWall += 0.04; let testX = Math.floor(startX + eyeX * distanceToWall); let testY = Math.floor(startY + eyeY * distanceToWall);
                if (testX < 0 || testX >= window.Game.MAP_SIZE || testY < 0 || testY >= window.Game.MAP_SIZE) { hitWall = true; distanceToWall = maxDist + cameraBackoff; } 
                else if (window.Game.mapDataArray[testY] && window.Game.mapDataArray[testY][testX] === 1) {
                    hitWall = true; let blockMidX = testX + 0.5; let blockMidY = testY + 0.5; let testPointX = startX + eyeX * distanceToWall; let testPointY = startY + eyeY * distanceToWall;
                    if (Math.abs(testPointX - blockMidX) > Math.abs(testPointY - blockMidY)) sideHit = true;
                }
            }
            zBuffer[i] = distanceToWall;
            let correctedDist = distanceToWall * Math.cos(rayAngle - window.camV.angle); if (correctedDist < 0.1) correctedDist = 0.1;
            let wallHeight = Math.floor(renderHeight / correctedDist); let ceilingPos = (renderY + (renderHeight / 2)) - (wallHeight / 2);
            let shadow = 1.0 - (Math.max(0, distanceToWall - cameraBackoff) / maxDist); if (shadow < 0) shadow = 0;
            let drawY = Math.max(renderY, ceilingPos); let drawH = Math.min(renderY + renderHeight, ceilingPos + wallHeight) - drawY;

            if (drawH > 0) {
                let baseColor = sideHit ? colors.wallDark : colors.wall;
                ctx.fillStyle = baseColor; ctx.fillRect(i, drawY, 1, drawH);
                if (shadow < 1.0) { ctx.fillStyle = `rgba(0, 0, 0, ${1.0 - shadow})`; ctx.fillRect(i, drawY, 1, drawH); }
            }
        }
        if (hasModifiedMap) window.Game.mapDataArray[backGridY][backGridX] = originalWallState;

        if (window.Game.goal) window.renderSprite(ctx, canvas, window.Game.goal, goalTex, fov, maxDist, zBuffer, renderY, renderHeight, viewX, viewY, cameraBackoff, 1.0, false);
        if (window.Game.batteries) { 
            for (let key in window.Game.batteries) { 
                if (window.Game.batteries[key]) { 
                    let [bx, by] = key.split(',').map(Number); let batterySprite = { x: bx, y: by }; 
                    window.renderSprite(ctx, canvas, batterySprite, window.batteryTex, fov, maxDist, zBuffer, renderY, renderHeight, viewX, viewY, cameraBackoff, 0.4, true); 
                } 
            } 
        }

        if (window.Game.chasers && window.Game.chasers.length > 0) {
            let sortedChasers = window.Game.chasers.slice().sort((a, b) => {
                let distA = Math.pow(a.x + 0.5 - viewX, 2) + Math.pow(a.y + 0.5 - viewY, 2);
                let distB = Math.pow(b.x + 0.5 - viewX, 2) + Math.pow(b.y + 0.5 - viewY, 2);
                return distB - distA; 
            });
            for (let chaser of sortedChasers) {
                if (typeof chaser.render === 'function') chaser.render(ctx, canvas, fov, maxDist, zBuffer, renderY, renderHeight, viewX, viewY, cameraBackoff, window.camV.angle);
            }
        }

        noiseY += 2.5; if (noiseY > canvas.height) noiseY = 0;
        if (noiseY >= renderY && noiseY <= (renderY + renderHeight)) { ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'; ctx.fillRect(0, noiseY, canvas.width, 4); }

        if (window.Game.isStealth) {
            ctx.fillStyle = 'rgba(0, 255, 255, 0.15)'; ctx.fillRect(0, renderY, canvas.width, renderHeight);
            let pulse = Math.abs(Math.sin(Date.now() / 200)) * 0.1;
            ctx.fillStyle = `rgba(255, 255, 255, ${0.05 + pulse})`; ctx.fillRect(0, renderY, canvas.width, renderHeight);
        }

        if (typeof window.drawMinimap === 'function') window.drawMinimap();
        requestAnimationFrame(window.animationRenderLoop);
    };

    window.resizeCamera = function() {
        let canvas = window.canvas; if (!canvas) return;
        let container = canvas.parentElement;
        if (container) { canvas.width = container.clientWidth; canvas.height = container.clientHeight; }
    };
})();
// camera.js の最後の方に以下を追加してください

// 💡 電池と周囲の歯をセットで描画する専用関数
window.renderTrap = function(ctx, canvas, sprite, texture, fov, maxDist, zBuffer, renderY, renderHeight, viewX, viewY, cameraBackoff) {
    if (!sprite) return;
    
    // 既存の renderSprite と同じ投影計算を使用
    let gx = sprite.x + 0.5 - viewX; let gy = sprite.y + 0.5 - viewY;
    let spriteAngle = Math.atan2(gy, gx) - window.camV.angle;
    while (spriteAngle < -Math.PI) spriteAngle += Math.PI * 2; while (spriteAngle > Math.PI) spriteAngle -= Math.PI * 2;
    if (Math.abs(spriteAngle) >= fov / 1.5) return;
    let spriteDist = Math.sqrt(gx * gx + gy * gy);
    if (spriteDist <= 0.1 || spriteDist >= (maxDist + cameraBackoff)) return;
    
    let correctedDist = spriteDist * Math.cos(spriteAngle);
    let baseSize = Math.floor(renderHeight / correctedDist);
    let baseX = Math.floor((1 - (spriteAngle + fov / 2) / fov) * canvas.width);
    let baseY = renderY + (renderHeight / 2) + (baseSize * 0.2); // 底辺

    // 💡 1. まず「歯」を先に描画（電池の裏側になるように）
    ctx.fillStyle = "#111"; // 黒に近いダークグレー
    for (let i = 0; i < 8; i++) {
        let angle = (i / 8) * Math.PI * 2;
        let tx = baseX + Math.cos(angle) * (baseSize * 0.3);
        let ty = baseY + Math.sin(angle) * (baseSize * 0.3);
        // Zバッファ判定（壁の向こうなら描画しない）
        let rayIdx = Math.floor((1 - (spriteAngle + fov / 2) / fov) * canvas.width);
        if (zBuffer[rayIdx] && spriteDist < zBuffer[rayIdx]) {
            ctx.beginPath(); ctx.moveTo(tx, ty); 
            ctx.lineTo(tx + Math.cos(angle)*15, ty + Math.sin(angle)*15); 
            ctx.lineTo(tx + 5, ty + 5); ctx.fill();
        }
    }

    // 💡 2. 電池本体を重ねて描画
    window.renderSprite(ctx, canvas, sprite, texture, fov, maxDist, zBuffer, renderY, renderHeight, viewX, viewY, cameraBackoff, 0.4, true);
};
