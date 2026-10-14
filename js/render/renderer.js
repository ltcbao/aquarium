function renderAquarium(now) {
    const frameStartTime = performance.now();

    // 1-3. Background water, caustics, waves & surface
    drawWaterBackground(now);

    // 4. Substrate gravel, bottom shadows & ambient sand details
    drawSubstrate(now);

    // 5. Aquascape live plants, rocks & ornaments
    drawDecorations(now);

    // 6. Substrate biological waste spots
    drawWasteSpots(now);

    // 7. Tank bottom helper snail & snail egg clutches
    drawTankSnail(now);
    drawSnailClutches(now);

    // 8. Bubbles rising from bottom substrate
    drawBubbles(now);

    // 9. Floating food flakes/pellets
    drawFoodParticles();

    // 9.5. Suspended Marine Snow / Micro Bio-Particulates (3D Water Column Depth)
    drawMarineSnow(now);

    // 10. Fish entities sorted by Z-Depth (throttled to every 8 frames for smooth 60fps)
    renderAquarium.sortCounter = (renderAquarium.sortCounter || 0) + 1;
    if (renderAquarium.sortCounter % 8 === 0) {
        state.fish.sort((a, b) => (a.z || 0) - (b.z || 0));
    }
    for (let i = 0; i < state.fish.length; i++) {
        drawSingleFishOrEgg(state.fish[i], now);
    }

    // 11. Physics wake rings & surface movement
    drawWakeRings();

    // 12. Floating text & ripples VFX + Expanding Growth Shockwaves
    drawRipplesAndFloatingText();
    drawGrowthShockwaves(now);

    // 13. Interactive Laser Toy Indicator
    if (currentMode === 'laser' && mousePos.active) {
        drawLaserToy(now);
    }

    // 13.5. Starphire Crystal Glass Bevel, Depth Vignette & Surface Meniscus
    drawAquariumGlassFrame(now);

    // 14. Performance Profiler & Frame Budget Benchmark Overlay
    profilerMetrics.frameTimeMs = performance.now() - frameStartTime;
    profilerMetrics.frameCount++;
    if (now - profilerMetrics.fpsTimer >= 400) {
        profilerMetrics.fps = Math.round((profilerMetrics.frameCount * 1000) / (now - profilerMetrics.fpsTimer));
        profilerMetrics.frameCount = 0;
        profilerMetrics.fpsTimer = now;
    }
    profilerMetrics.entitiesCount = state.fish.length + foodParticles.length + state.waste.length + bubbles.length + fxSparks.length;

    if (showFpsProfiler) {
        drawPerformanceProfiler(now);
    }
}

function drawLaserToy(now) {
    const lx = mousePos.x;
    const ly = Math.max(95, Math.min(substrateY - 20, mousePos.y));
    const pulse = 1 + Math.sin(now * 0.015) * 0.25;

    ctx.save();

    // Subtle pointer light ray from surface down to target point
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.14)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(lx, 80);
    ctx.lineTo(lx, ly);
    ctx.stroke();
    ctx.setLineDash([]);

    // Glowing Concentric Caustic Rings
    ctx.strokeStyle = 'rgba(251, 113, 133, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(lx, ly, 16 * pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(244, 63, 94, 0.75)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(lx, ly, 7 * pulse, 0, Math.PI * 2);
    ctx.stroke();

    // Center Hotspot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(lx, ly, 3, 0, Math.PI * 2);
    ctx.fill();

    // Rotating Crosshair ticks
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(now * 0.003);
    ctx.strokeStyle = 'rgba(254, 205, 211, 0.85)';
    ctx.lineWidth = 1.4;
    for (let a = 0; a < 4; a++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(15, 0);
        ctx.stroke();
    }
    ctx.restore();

    ctx.restore();
}

function drawPerformanceProfiler(now) {
    ctx.save();
    const w = 310;
    const h = 86;
    const x = Math.max(12, cw - w - 16);
    const y = 84;

    // Glass panel card
    ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, w, h, 14) : ctx.rect(x, y, w, h);
    ctx.fill();
    ctx.stroke();

    // FPS badge
    const fps = profilerMetrics.fps || 60;
    const isGoodFps = fps >= 55;
    ctx.fillStyle = isGoodFps ? '#34d399' : (fps >= 30 ? '#fbbf24' : '#f87171');
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`⚡ ${fps} FPS`, x + 12, y + 20);

    // Frame Time & Budget
    const tot = profilerMetrics.totalLoopMs || profilerMetrics.frameTimeMs || 1.2;
    const budgetPct = Math.min(100, Math.round((tot / 16.67) * 100));
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 10.5px "JetBrains Mono", monospace';
    ctx.fillText(`JS Total: ${tot.toFixed(1)}ms (${budgetPct}% budget)`, x + 105, y + 20);

    // Budget progress bar
    ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
    ctx.fillRect(x + 12, y + 28, w - 24, 4);
    ctx.fillStyle = isGoodFps ? '#38bdf8' : '#f59e0b';
    ctx.fillRect(x + 12, y + 28, Math.max(2, (w - 24) * (budgetPct / 100)), 4);

    // Per-phase breakdown
    const simT = (profilerMetrics.simTimeMs || 0).toFixed(1);
    const physT = (profilerMetrics.physicsTimeMs || 0).toFixed(1);
    const rendT = (profilerMetrics.renderTimeMs || profilerMetrics.frameTimeMs || 0).toFixed(1);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '500 10px "JetBrains Mono", monospace';
    ctx.fillText(`⚙️ Sim: ${simT}ms | 🌊 Phys: ${physT}ms | 🎨 Rend: ${rendT}ms`, x + 12, y + 48);

    // Metrics text: Active Entities & Spatial Grid Boids
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '500 10px Inter, sans-serif';
    ctx.fillText(`🐟 Entities: ${profilerMetrics.entitiesCount} • Spatial Grid: ${profilerMetrics.schoolingChecks || 0} checks/frame`, x + 12, y + 64);
    ctx.fillText(`⚡ Zero-GC Caches & HW Blend Active`, x + 12, y + 78);

    ctx.restore();
}

function drawBubbles(now) {
    if (bubbles.length > 55) {
        bubbles.length = 55;
    }
    ctx.save();
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.55)';
    ctx.fillStyle = 'rgba(224, 242, 254, 0.16)';
    ctx.lineWidth = 1;
    const spdMult = 0.85 + Math.min(simSpeed, 2) * 0.15;
    for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        b.y -= b.speed * spdMult;
        b.x += Math.sin(now * 0.003 + b.wobble) * 0.35;

        // Recycle bubble when reaching surface without re-allocating
        if (b.y < 82) {
            b.y = substrateY - 10;
            b.x = Math.random() * cw;
        }

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    ctx.restore();
}

function drawFoodParticles() {
    ctx.save();
    foodParticles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();
}

function drawWakeRings() {
    if (!wakeRings.length) return;
    ctx.save();
    for (let i = wakeRings.length - 1; i >= 0; i--) {
        const wr = wakeRings[i];
        wr.x += wr.vx;
        wr.y += wr.vy;
        wr.r += (wr.maxR - wr.r) * 0.08;
        wr.alpha -= 0.018;
        if (wr.alpha <= 0.01) {
            wakeRings[i] = wakeRings[wakeRings.length - 1];
            wakeRings.pop();
            continue;
        }
        ctx.save();
        ctx.translate(wr.x, wr.y);
        ctx.rotate(wr.angle);
        ctx.strokeStyle = wr.color;
        ctx.globalAlpha = wr.alpha;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(0, 0, wr.r * 0.45, wr.r, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
}

function drawRipplesAndFloatingText() {
    ctx.save();
    // 1. Expanding Sonic Water Ripples
    for (let i = waterRipples.length - 1; i >= 0; i--) {
        const rp = waterRipples[i];
        rp.r += 1.85;
        rp.alpha -= 0.025;
        if (rp.alpha <= 0) {
            waterRipples[i] = waterRipples[waterRipples.length - 1];
            waterRipples.pop();
            continue;
        }
        ctx.strokeStyle = `rgba(125, 211, 252, ${rp.alpha})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.stroke();
    }

    // 2. Celebratory Sparkle & Heart Bursts
    for (let i = fxSparks.length - 1; i >= 0; i--) {
        const sp = fxSparks[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vy += 0.04; // Gentle underwater buoyancy/gravity
        sp.alpha -= 0.022;
        if (sp.alpha <= 0) {
            fxSparks[i] = fxSparks[fxSparks.length - 1];
            fxSparks.pop();
            continue;
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, sp.alpha);
        ctx.fillStyle = sp.color;
        if (sp.style === 'heart') {
            ctx.font = '12px sans-serif';
            ctx.fillText('💖', sp.x, sp.y);
        } else {
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    // 3. Floating Text Popups
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y -= 0.9;
        ft.alpha -= 0.017;
        if (ft.alpha <= 0) {
            floatingTexts[i] = floatingTexts[floatingTexts.length - 1];
            floatingTexts.pop();
            continue;
        }
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.font = '700 12px Inter, sans-serif';
        ctx.fillStyle = ft.color;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.restore();
}

function drawMarineSnow(now) {
    if (!snowMotes || !snowMotes.length) return;
    ctx.save();
    for (let i = 0; i < snowMotes.length; i++) {
        const m = snowMotes[i];
        const z = m.z || 0;
        const depthScale = 1.0 + z * 0.35;
        const alpha = Math.max(0.12, Math.min(0.65, (m.alpha || 0.28) * (1.2 + z * 0.4)));
        const r = Math.max(0.8, m.r * depthScale);
        ctx.fillStyle = `rgba(224, 242, 254, ${alpha})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

let cachedGlassLeft = null;
let cachedGlassRight = null;
let cachedVignette = null;
let cachedGlassSizeKey = '';

function drawAquariumGlassFrame(now) {
    const sizeKey = `${cw}_${ch}`;
    if (!cachedGlassLeft || cachedGlassSizeKey !== sizeKey) {
        cachedGlassLeft = ctx.createLinearGradient(0, 0, 18, 0);
        cachedGlassLeft.addColorStop(0, 'rgba(56, 189, 248, 0.12)');
        cachedGlassLeft.addColorStop(1, 'rgba(56, 189, 248, 0)');

        cachedGlassRight = ctx.createLinearGradient(cw, 0, cw - 18, 0);
        cachedGlassRight.addColorStop(0, 'rgba(56, 189, 248, 0.12)');
        cachedGlassRight.addColorStop(1, 'rgba(56, 189, 248, 0)');

        cachedVignette = ctx.createRadialGradient(cw * 0.5, ch * 0.5, cw * 0.35, cw * 0.5, ch * 0.5, cw * 0.75);
        cachedVignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        cachedVignette.addColorStop(1, 'rgba(2, 6, 23, 0.35)');

        cachedGlassSizeKey = sizeKey;
    }

    ctx.save();
    // 1. Crystal Glass Edge Bevel Highlights
    ctx.fillStyle = cachedGlassLeft;
    ctx.fillRect(0, 0, 18, ch);

    ctx.fillStyle = cachedGlassRight;
    ctx.fillRect(cw - 18, 0, 18, ch);

    // 2. Subtle Cinematic Corner Vignette (Simulates glass tank depth & refraction)
    ctx.fillStyle = cachedVignette;
    ctx.fillRect(0, 0, cw, ch);

    // 3. Water Surface Meniscus Underside Glow (Snell's Window Total Internal Reflection)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(0, 78);
    for (let x = 0; x <= cw; x += 35) {
        ctx.lineTo(x, 78 + Math.sin(x * 0.015 + now * 0.002) * 2.5);
    }
    ctx.stroke();

    ctx.restore();
}