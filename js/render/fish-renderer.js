// High-performance gradient caches (eliminates thousands of CPU/GPU gradient allocations per second)
const fishBodyGradCache = new Map();
const fishGlossGradCache = new Map();
const fishTailGradCache = new Map();

function getCachedBodyGrad(specId, primary, secondary, r) {
    const quantR = Math.round(r * 0.35) * 3;
    const key = `${specId}_${primary}_${secondary}_${quantR}`;
    let grad = fishBodyGradCache.get(key);
    if (!grad) {
        if (fishBodyGradCache.size > 220) fishBodyGradCache.clear();
        grad = ctx.createLinearGradient(0, -quantR * 0.75, 0, quantR * 0.75);
        grad.addColorStop(0, primary);
        grad.addColorStop(0.55, secondary);
        grad.addColorStop(1, '#f8fafc');
        fishBodyGradCache.set(key, grad);
    }
    return grad;
}

function getCachedGlossGrad(r) {
    const quantR = Math.round(r * 0.35) * 3;
    let grad = fishGlossGradCache.get(quantR);
    if (!grad) {
        if (fishGlossGradCache.size > 60) fishGlossGradCache.clear();
        grad = ctx.createLinearGradient(0, -quantR * 0.8, 0, 0);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.36)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        fishGlossGradCache.set(quantR, grad);
    }
    return grad;
}

function getCachedTailGrad(primary, finColor, r) {
    const quantR = Math.round(r * 0.35) * 3;
    const key = `${primary}_${finColor}_${quantR}`;
    let grad = fishTailGradCache.get(key);
    if (!grad) {
        if (fishTailGradCache.size > 220) fishTailGradCache.clear();
        grad = ctx.createLinearGradient(-quantR * 0.75, 0, -quantR * 2.4, 0);
        grad.addColorStop(0, primary);
        grad.addColorStop(0.5, finColor || '#38bdf8');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0.12)');
        fishTailGradCache.set(key, grad);
    }
    return grad;
}

function drawSingleFishOrEgg(fish, now) {
    const spec = getEffectiveSpec(fish);
    const patternId = spec.patternId || spec.id;
    const theme = LIGHT_THEMES[state.lightThemeIndex || 0];
    const isNeonTheme = theme.id === 'bioluminescent' || theme.id === 'moonlight';
    const isPrism = fish.morph === 'prism';
    const isCosmic = fish.morph === 'cosmic';
    const isLustre = fish.morph === 'lustre';
    const isVip = spec.rarity && spec.rarity.includes('VIP');
    const hueShift = Math.floor((now * 0.08 + fish.x * 0.5) % 360);

    // 1. High-Performance Unified Trail (Only for Special VIP / Cosmic / Prism fish)
    if ((isPrism || isCosmic || isVip) && fish.trail && fish.trail.length > 2) {
        ctx.beginPath();
        ctx.moveTo(fish.trail[0].x, fish.trail[0].y);
        for (let i = 1; i < fish.trail.length; i++) {
            ctx.lineTo(fish.trail[i].x, fish.trail[i].y);
        }
        ctx.strokeStyle = isCosmic
            ? 'rgba(192, 132, 252, 0.32)'
            : (isPrism ? `hsla(${hueShift}, 95%, 70%, 0.32)` : spec.primaryColor);
        ctx.globalAlpha = (isPrism || isCosmic) ? 0.9 : 0.28;
        ctx.lineWidth = Math.max(1.2, spec.baseSize * 0.22);
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.globalAlpha = 1.0;
    }

    // 3D Depth & Growth Animation Scale Multipliers
    const depthZ = fish.z !== undefined ? fish.z : 0;
    const depthScale = 1.0 + depthZ * 0.28;
    const parallaxX = mousePos.active ? (mousePos.x - cw * 0.5) * (depthZ * 0.04) : 0;
    let growthPop = 1.0;
    if (fish.growthTimer > 0) {
        growthPop = 1.0 + Math.sin(fish.growthTimer * Math.PI) * 0.42;
    }

    // 2. Soft Volumetric Shadow on the Sand Bed (scaled by 3D depth, zero save/restore overhead)
    const floorY = getSubstrateHeightAt(fish.x + parallaxX);
    const distFromFloor = floorY - fish.y;
    if (distFromFloor > 0 && distFromFloor < 240 && depthZ > -0.45) {
        const shadowScale = (1 - distFromFloor / 240) * depthScale;
        ctx.fillStyle = `rgba(2, 6, 23, ${0.28 * shadowScale})`;
        ctx.beginPath();
        ctx.ellipse(fish.x + parallaxX, floorY + 5, spec.baseSize * 0.88 * shadowScale, 3.8 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.save();
    ctx.translate(fish.x + parallaxX, fish.y);

    // Deep background water atmospheric perspective haze
    if (depthZ < -0.05) {
        ctx.globalAlpha = Math.max(0.58, 1.0 + depthZ * 0.42);
    }

    // Dynamic Growth Celebration Aura & Rotating Sacred Geometry Ring
    if (fish.growthTimer > 0) {
        ctx.save();
        const gPulse = Math.sin(fish.growthTimer * Math.PI);
        const auraCol = fish.stage === 'adult' ? '#fbbf24' : (fish.stage === 'juvenile' ? '#34d399' : '#38bdf8');
        
        // Rotating celestial halo
        ctx.save();
        ctx.rotate(now * 0.003);
        ctx.strokeStyle = auraCol;
        ctx.lineWidth = 2.2;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, spec.baseSize * 1.8 * depthScale + 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Radiant expansion aura
        const glowGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, spec.baseSize * 2.4 * depthScale);
        glowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
        glowGrad.addColorStop(0.35, auraCol);
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowGrad;
        ctx.globalAlpha = gPulse * 0.65;
        ctx.beginPath();
        ctx.arc(0, 0, spec.baseSize * 2.4 * depthScale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // 3. Fast GPU-friendly Bioluminescent, Prismatic & Cosmic Aura Glow
    if (isCosmic || isPrism || isNeonTheme || isLustre || (spec.rarity && spec.rarity.includes('VIP'))) {
        const auraR = spec.baseSize * 1.4 * depthScale;
        const auraCol = isCosmic
            ? 'rgba(192, 132, 252, 0.22)'
            : (isPrism ? `hsla(${hueShift}, 95%, 65%, 0.2)` : 'rgba(56, 189, 248, 0.16)');
        ctx.fillStyle = auraCol;
        ctx.beginPath();
        ctx.arc(0, 0, auraR, 0, Math.PI * 2);
        ctx.fill();
    }

    // Selection halo if inspected
    if (fish.id === selectedFishId) {
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.rotate(now * 0.0015);
        ctx.beginPath();
        ctx.arc(0, 0, spec.baseSize * 1.45 * depthScale + 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    // STAGE 1: EGG / ROE RENDERING WITH VISIBLE EMBRYO HEARTBEAT
    if (fish.stage === 'egg') {
        const pulse = (1 + Math.sin(now * 0.009) * 0.08) * growthPop;
        ctx.scale(pulse, pulse);

        ctx.fillStyle = isCosmic ? 'rgba(192, 132, 252, 0.28)' : 'rgba(56, 189, 248, 0.24)';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();

        const grad = ctx.createRadialGradient(-2.5, -2.5, 1, 0, 0, 8.5);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.45, isCosmic ? '#a855f7' : (isPrism ? `hsl(${hueShift}, 90%, 70%)` : spec.primaryColor));
        grad.addColorStop(1, 'rgba(15, 23, 42, 0.75)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, 8.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = 1.1;
        ctx.stroke();

        ctx.strokeStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0.5, 0.5, 4.2, -0.4, Math.PI * 1.15);
        ctx.stroke();
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(3.2, -1.2, 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return;
    }

    // Scale based on Lifecycle Stage, 3D Depth, and Growth Bounce
    const stageScale = fish.stage === 'fry' ? 0.45 : (fish.stage === 'juvenile' ? 0.74 : 1.08);
    const r = spec.baseSize * stageScale * depthScale * growthPop;

    // Morph color overrides

    const primaryCol = isCosmic
        ? '#7e22ce'
        : (isPrism ? `hsl(${hueShift}, 90%, 62%)` : spec.primaryColor);
    const secondaryCol = isCosmic
        ? '#38bdf8'
        : (isPrism ? `hsl(${(hueShift + 75) % 360}, 90%, 55%)` : spec.secondaryColor);

    // SPECIAL RENDER 1: BIOLUMINESCENT MOON JELLYFISH
    if (spec.bodyShape === 'jellyfish') {
        const bellPulse = Math.sin(fish.tailPhase * 0.7);
        const bellW = r * (1.05 - bellPulse * 0.14);
        const bellH = r * (0.78 + bellPulse * 0.14);

        for (let t = -4; t <= 4; t++) {
            const tx = t * (bellW * 0.18);
            const wave1 = Math.sin(now * 0.004 + t) * 10;
            const wave2 = Math.cos(now * 0.003 + t * 1.5) * 16;
            ctx.strokeStyle = t % 2 === 0 ? primaryCol : secondaryCol;
            ctx.globalAlpha = 0.65;
            ctx.lineWidth = Math.abs(t) <= 1 ? 2.4 : 1.2;
            ctx.beginPath();
            ctx.moveTo(tx, bellH * 0.2);
            ctx.bezierCurveTo(tx + wave1, bellH + r * 0.5, tx + wave2, bellH + r * 1.1, tx + wave1 * 1.2, bellH + r * 1.65);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        const jellyGrad = ctx.createRadialGradient(0, -bellH * 0.2, r * 0.1, 0, 0, bellW);
        jellyGrad.addColorStop(0, '#ffffff');
        jellyGrad.addColorStop(0.45, primaryCol);
        jellyGrad.addColorStop(0.85, secondaryCol);
        jellyGrad.addColorStop(1, 'rgba(56, 189, 248, 0.15)');
        ctx.fillStyle = jellyGrad;
        ctx.beginPath();
        ctx.arc(0, 0, bellW, Math.PI, 0, false);
        ctx.quadraticCurveTo(0, bellH * 0.35, -bellW, 0);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = 1.4;
        for (let a = 0; a < 4; a++) {
            ctx.beginPath();
            ctx.arc(Math.cos(a * Math.PI / 2) * r * 0.22, -r * 0.25 + Math.sin(a * Math.PI / 2) * r * 0.12, r * 0.11, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
        return;
    }

    // SPECIAL RENDER 2: POM POM BOXER CRAB
    if (spec.bodyShape === 'crab') {
        const legWave = Math.sin(now * 0.015) * 3;
        ctx.strokeStyle = primaryCol;
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        for (let side of [-1, 1]) {
            for (let l = 0; l < 3; l++) {
                ctx.beginPath();
                ctx.moveTo(side * r * 0.5, l * 3 - 2);
                ctx.lineTo(side * (r * 1.05 + l * 2), r * 0.4 + (l % 2 === 0 ? legWave : -legWave));
                ctx.stroke();
            }
        }
        ctx.fillStyle = primaryCol;
        ctx.strokeStyle = '#7c2d12';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.78, r * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        for (let side of [-1, 1]) {
            const pomX = side * r * 1.05;
            const pomY = -r * 0.45 + Math.sin(now * 0.008 + side) * 4;
            ctx.strokeStyle = primaryCol;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(side * r * 0.5, -r * 0.2);
            ctx.lineTo(pomX, pomY);
            ctx.stroke();

            ctx.fillStyle = '#f472b6';
            ctx.beginPath();
            ctx.arc(pomX, pomY, r * 0.36, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(pomX, pomY, r * 0.16, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(-r * 0.26, -r * 0.52, 2.4, 0, Math.PI * 2);
        ctx.arc(r * 0.26, -r * 0.52, 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return;
    }

    // Standard & Specialized Directional Swimming Orientation
    const bodyWiggle = Math.sin(fish.tailPhase) * 0.065;
    const pitch = Math.max(-0.36, Math.min(0.36, fish.vy * 0.14)) * fish.facing + bodyWiggle;
    ctx.scale(fish.facing, 1);
    ctx.rotate(pitch);

    // SPECIAL RENDER 3: RED CHERRY SHRIMP
    if (spec.bodyShape === 'shrimp') {
        ctx.strokeStyle = 'rgba(254, 202, 202, 0.8)';
        ctx.lineWidth = 1.2;
        for (let leg = -3; leg <= 3; leg++) {
            const swing = Math.sin(now * 0.02 + leg) * 2.5;
            ctx.beginPath();
            ctx.moveTo(leg * r * 0.18, r * 0.2);
            ctx.lineTo(leg * r * 0.18 + swing, r * 0.58);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(r * 0.85, -r * 0.05);
        ctx.quadraticCurveTo(r * 1.6, -r * 0.55, r * 2.1, -r * 0.2 + Math.sin(now * 0.008) * 4);
        ctx.moveTo(r * 0.85, r * 0.05);
        ctx.quadraticCurveTo(r * 1.5, r * 0.35, r * 1.9, r * 0.45);
        ctx.stroke();

        const shGrad = ctx.createLinearGradient(-r, 0, r, 0);
        shGrad.addColorStop(0, primaryCol);
        shGrad.addColorStop(0.6, secondaryCol);
        shGrad.addColorStop(1, primaryCol);
        ctx.fillStyle = shGrad;
        ctx.beginPath();
        ctx.moveTo(r * 0.95, 0);
        ctx.quadraticCurveTo(0, -r * 0.58, -r * 0.95, r * 0.1);
        ctx.lineTo(-r * 1.25, r * 0.32);
        ctx.lineTo(-r * 0.85, r * 0.32);
        ctx.quadraticCurveTo(0, r * 0.15, r * 0.95, 0);
        ctx.fill();

        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(r * 0.68, -r * 0.12, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return;
    }

    // SPECIAL RENDER 4: MOTORO FRESHWATER STINGRAY
    if (spec.bodyShape === 'stingray') {
        const wingWave = Math.sin(fish.tailPhase * 1.1) * (r * 0.28);
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-r * 0.85, 0);
        ctx.quadraticCurveTo(-r * 1.45, wingWave * 0.4, -r * 2.05, -wingWave * 0.3);
        ctx.stroke();

        const rayGrad = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r * 1.15);
        rayGrad.addColorStop(0, '#92400e');
        rayGrad.addColorStop(0.75, primaryCol);
        rayGrad.addColorStop(1, secondaryCol);
        ctx.fillStyle = rayGrad;
        ctx.beginPath();
        ctx.moveTo(r * 1.05, 0);
        ctx.bezierCurveTo(r * 0.4, -r * 0.72 + wingWave, -r * 0.5, -r * 0.68 - wingWave, -r * 0.92, 0);
        ctx.bezierCurveTo(-r * 0.5, r * 0.62 - wingWave, r * 0.4, r * 0.68 + wingWave, r * 1.05, 0);
        ctx.fill();

        [[-0.35, -0.18], [0.15, -0.22], [-0.15, 0.18], [0.35, 0.14], [-0.55, 0.02]].forEach(([sx, sy]) => {
            ctx.fillStyle = '#fbbf24';
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.arc(r * sx, r * sy, r * 0.11, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(r * 0.52, -r * 0.12, 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return;
    }

    const tailSwing = Math.sin(fish.tailPhase) * (r * 0.34);
    const tailLag = Math.sin(fish.tailPhase - 0.85) * (r * 0.48);
    const dorsalWave = Math.cos(fish.tailPhase - 0.6) * (r * 0.16);

    // 1. MULTI-LAYERED FLOWING CAUDAL (TAIL) FIN
    const tailGrad = getCachedTailGrad(primaryCol, spec.finColor, r);
    ctx.fillStyle = tailGrad;

    ctx.beginPath();
    if (spec.bodyShape === 'betta' || spec.bodyShape === 'guppy' || spec.bodyShape === 'koi') {
        ctx.moveTo(-r * 0.78, 0);
        ctx.bezierCurveTo(-r * 1.35, -r * 1.25 + tailSwing, -r * 2.1, -r * 1.05 + tailLag, -r * 2.55, -r * 0.25 + tailLag * 1.25);
        ctx.quadraticCurveTo(-r * 2.75, tailLag * 1.35, -r * 2.55, r * 0.25 + tailLag * 1.25);
        ctx.bezierCurveTo(-r * 2.1, r * 1.05 + tailLag, -r * 1.35, r * 1.25 + tailSwing, -r * 0.78, 0);
    } else if (spec.bodyShape === 'angel' || spec.bodyShape === 'discus') {
        ctx.moveTo(-r * 0.8, 0);
        ctx.quadraticCurveTo(-r * 1.35, -r * 0.65 + tailSwing, -r * 2.05, -r * 0.92 + tailLag);
        ctx.quadraticCurveTo(-r * 1.5, tailSwing * 0.4, -r * 2.05, r * 0.92 + tailLag);
        ctx.quadraticCurveTo(-r * 1.35, r * 0.65 + tailSwing, -r * 0.8, 0);
    } else if (spec.bodyShape === 'arowana' || spec.bodyShape === 'flowerhorn') {
        ctx.moveTo(-r * 1.05, 0);
        ctx.bezierCurveTo(-r * 1.55, -r * 0.72 + tailSwing, -r * 2.08, -r * 0.48 + tailLag, -r * 2.12, tailLag);
        ctx.bezierCurveTo(-r * 2.08, r * 0.48 + tailLag, -r * 1.55, r * 0.72 + tailSwing, -r * 1.05, 0);
    } else {
        ctx.moveTo(-r * 0.85, 0);
        ctx.quadraticCurveTo(-r * 1.3, -r * 0.52 + tailSwing * 0.7, -r * 1.75, -r * 0.68 + tailLag);
        ctx.lineTo(-r * 1.28, tailSwing * 0.35);
        ctx.lineTo(-r * 1.75, r * 0.68 + tailLag);
        ctx.quadraticCurveTo(-r * 1.3, r * 0.52 + tailSwing * 0.7, -r * 0.85, 0);
    }
    ctx.closePath();
    ctx.fill();

    // Delicate Iridescent Fin Rays on Caudal Fin
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
    ctx.lineWidth = 0.85;
    const rayCount = (spec.bodyShape === 'betta' || spec.bodyShape === 'guppy' || spec.bodyShape === 'koi') ? 6 : 4;
    ctx.beginPath();
    for (let i = 0; i < rayCount; i++) {
        const spread = (i / (rayCount - 1) - 0.5) * 1.3;
        ctx.moveTo(-r * 0.85, 0);
        ctx.quadraticCurveTo(
            -r * 1.35,
            r * spread * 0.5 + tailSwing,
            -r * 1.72,
            r * spread * 0.75 + tailLag
        );
    }
    ctx.stroke();

    // 2. DORSAL, ANAL & VENTRAL RIBBON FINS
    ctx.fillStyle = tailGrad;
    if (spec.bodyShape === 'angel') {
        ctx.beginPath();
        ctx.moveTo(r * 0.15, -r * 0.55);
        ctx.bezierCurveTo(-r * 0.15, -r * 1.75, -r * 0.65, -r * 2.25 + dorsalWave, -r * 1.28, -r * 2.15 + tailLag * 0.7);
        ctx.quadraticCurveTo(-r * 0.75, -r * 1.25, -r * 0.55, -r * 0.45);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(r * 0.05, r * 0.55);
        ctx.bezierCurveTo(-r * 0.15, r * 1.75, -r * 0.65, r * 2.25 + dorsalWave, -r * 1.28, r * 2.15 + tailLag * 0.7);
        ctx.quadraticCurveTo(-r * 0.75, r * 1.25, -r * 0.55, r * 0.45);
        ctx.closePath();
        ctx.fill();
    } else if (spec.bodyShape === 'betta' || spec.bodyShape === 'flowerhorn') {
        ctx.beginPath();
        ctx.moveTo(r * 0.2, -r * 0.42);
        ctx.bezierCurveTo(-r * 0.35, -r * 1.48 + dorsalWave, -r * 1.15, -r * 1.35 + tailSwing, -r * 1.55, -r * 0.75 + tailLag);
        ctx.lineTo(-r * 0.78, -r * 0.28);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(r * 0.1, r * 0.42);
        ctx.bezierCurveTo(-r * 0.35, r * 1.52 + dorsalWave, -r * 1.2, r * 1.42 + tailSwing, -r * 1.6, r * 0.8 + tailLag);
        ctx.lineTo(-r * 0.78, r * 0.28);
        ctx.closePath();
        ctx.fill();
    } else if (spec.bodyShape === 'discus') {
        ctx.beginPath();
        ctx.moveTo(r * 0.35, -r * 0.72);
        ctx.quadraticCurveTo(-r * 0.35, -r * 1.35 + dorsalWave, -r * 0.95, -r * 0.45 + tailSwing * 0.4);
        ctx.lineTo(-r * 0.7, -r * 0.5);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(r * 0.25, r * 0.72);
        ctx.quadraticCurveTo(-r * 0.35, r * 1.35 - dorsalWave, -r * 0.95, r * 0.45 + tailSwing * 0.4);
        ctx.lineTo(-r * 0.7, r * 0.5);
        ctx.closePath();
        ctx.fill();
    } else {
        const dorsalH = (spec.bodyShape === 'pleco' || spec.bodyShape === 'cory') ? 1.42 : 1.12;
        ctx.beginPath();
        ctx.moveTo(r * 0.26, -r * 0.42);
        ctx.quadraticCurveTo(-r * 0.28, -r * dorsalH + dorsalWave, -r * 0.85, -r * 0.36 + tailSwing * 0.3);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(r * 0.08, r * 0.42);
        ctx.quadraticCurveTo(-r * 0.28, r * 0.9 - dorsalWave * 0.6, -r * 0.68, r * 0.34);
        ctx.closePath();
        ctx.fill();
    }

    // 3. SCULPTED 3D BODY SILHOUETTE & IRIDESCENT SHADER
    ctx.beginPath();
    if (spec.bodyShape === 'discus') {
        ctx.ellipse(0, 0, r * 0.96, r * 0.9, 0, 0, Math.PI * 2);
    } else if (spec.bodyShape === 'angel') {
        ctx.moveTo(r * 0.95, 0);
        ctx.quadraticCurveTo(r * 0.2, -r * 0.95, -r * 0.88, 0);
        ctx.quadraticCurveTo(r * 0.2, r * 0.95, r * 0.95, 0);
    } else if (spec.bodyShape === 'arowana') {
        ctx.ellipse(0, 0, r * 1.38, r * 0.43, 0, 0, Math.PI * 2);
    } else if (spec.bodyShape === 'flowerhorn') {
        ctx.ellipse(-r * 0.05, 0, r * 1.05, r * 0.64, 0, 0, Math.PI * 2);
        ctx.arc(r * 0.62, -r * 0.44, r * 0.42, 0, Math.PI * 2);
    } else if (spec.bodyShape === 'pleco' || spec.bodyShape === 'cory') {
        ctx.moveTo(r * 1.08, r * 0.25);
        ctx.bezierCurveTo(r * 0.65, -r * 0.72, -r * 0.35, -r * 0.62, -r * 1.05, r * 0.12);
        ctx.lineTo(r * 1.08, r * 0.25);
    } else if (spec.bodyShape === 'eel') {
        ctx.ellipse(0, 0, r * 1.48, r * 0.3, 0, 0, Math.PI * 2);
    } else if (spec.bodyShape === 'hatchet') {
        ctx.moveTo(r * 1.02, -r * 0.2);
        ctx.lineTo(-r * 0.92, -r * 0.15);
        ctx.quadraticCurveTo(-r * 0.1, r * 1.15, r * 1.02, -r * 0.2);
    } else if (spec.bodyShape === 'axolotl') {
        ctx.ellipse(-r * 0.1, 0, r * 1.25, r * 0.46, 0, 0, Math.PI * 2);
    } else if (spec.bodyShape === 'puffer') {
        ctx.ellipse(0, 0, r * 0.85, r * 0.78, 0, 0, Math.PI * 2);
    } else if (spec.bodyShape === 'ribbon') {
        ctx.ellipse(-r * 0.12, 0, r * 1.45, r * 0.38, 0, 0, Math.PI * 2);
    } else {
        ctx.moveTo(r * 1.08, 0);
        ctx.bezierCurveTo(r * 0.65, -r * 0.68, -r * 0.45, -r * 0.62, -r * 1.02, 0);
        ctx.bezierCurveTo(-r * 0.45, r * 0.64, r * 0.65, r * 0.68, r * 1.08, 0);
    }

    const bodyGrad = getCachedBodyGrad(spec.id, primaryCol, secondaryCol, r);
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // 4. INTRICATE SPECIES PATTERNS, METALLIC SCALES & SHIMMERING SHEEN (With Distance LOD)
    if (depthZ > -0.38) {
        ctx.save();
        ctx.clip();

    if (patternId === 'neon_tetra') {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-r * 1.1, -r * 0.05, r * 1.05, r * 0.75);
        ctx.strokeStyle = '#7dd3fc';
        ctx.lineWidth = Math.max(2.8, r * 0.22);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(r * 0.72, -r * 0.06);
        ctx.quadraticCurveTo(0, -r * 0.16, -r * 0.78, -r * 0.04);
        ctx.stroke();
    } else if (patternId === 'fancy_guppy') {
        const gupGrad = ctx.createLinearGradient(-r, 0, r, 0);
        gupGrad.addColorStop(0, '#ec4899');
        gupGrad.addColorStop(0.5, '#f59e0b');
        gupGrad.addColorStop(1, '#fde047');
        ctx.fillStyle = gupGrad;
        ctx.fillRect(-r * 1.1, -r, r * 2.2, r * 1.55);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
        [-0.55, -0.25, 0.05].forEach((bx, idx) => {
            ctx.beginPath();
            ctx.arc(r * bx, (idx % 2 === 0 ? -1 : 1) * r * 0.12, r * 0.09, 0, Math.PI * 2);
            ctx.fill();
        });
    } else if (patternId === 'panda_cory') {
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(-r * 1.2, -r, r * 2.4, r * 2);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(r * 0.42, -r, r * 0.34, r * 1.6);
        ctx.fillRect(-r * 0.92, -r, r * 0.35, r * 1.6);
    } else if (patternId === 'pleco') {
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-r * 1.2, -r, r * 2.4, r * 2);
        ctx.fillStyle = '#0f172a';
        for (let px = -0.8; px <= 0.75; px += 0.32) {
            ctx.beginPath();
            ctx.ellipse(r * px, -r * 0.1, r * 0.09, r * 0.45, 0.25, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (patternId === 'clownfish') {
        ctx.fillStyle = '#f97316';
        ctx.fillRect(-r * 1.2, -r, r * 2.4, r * 2);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = Math.max(1.5, r * 0.08);
        [-r * 0.58, -r * 0.02, r * 0.48].forEach(bx => {
            ctx.beginPath();
            ctx.moveTo(bx - r * 0.12, -r);
            ctx.quadraticCurveTo(bx - r * 0.04, 0, bx - r * 0.12, r);
            ctx.lineTo(bx + r * 0.12, r);
            ctx.quadraticCurveTo(bx + r * 0.2, 0, bx + r * 0.12, -r);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        });
    } else if (patternId === 'betta') {
        ctx.strokeStyle = 'rgba(232, 121, 249, 0.55)';
        ctx.lineWidth = 0.9;
        for (let sx = -r * 0.75; sx < r * 0.55; sx += r * 0.24) {
            ctx.beginPath();
            ctx.arc(sx, -r * 0.05, r * 0.14, -0.9, 0.9);
            ctx.stroke();
        }
    } else if (patternId === 'angelfish') {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
        [-r * 0.44, r * 0.04, r * 0.46].forEach(bx => {
            ctx.beginPath();
            ctx.moveTo(bx - r * 0.08, -r);
            ctx.quadraticCurveTo(bx + r * 0.04, 0, bx - r * 0.08, r);
            ctx.lineTo(bx + r * 0.09, r);
            ctx.quadraticCurveTo(bx + r * 0.18, 0, bx + r * 0.09, -r);
            ctx.fill();
        });
    } else if (patternId === 'discus') {
        ctx.strokeStyle = '#67e8f9';
        ctx.lineWidth = Math.max(1.8, r * 0.075);
        for (let s = -3; s <= 3; s++) {
            ctx.beginPath();
            ctx.moveTo(s * r * 0.22, -r);
            ctx.bezierCurveTo(s * r * 0.22 + r * 0.12, -r * 0.3, s * r * 0.22 - r * 0.12, r * 0.3, s * r * 0.22, r);
            ctx.stroke();
        }
    } else if (patternId === 'blue_tang') {
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(-r * 1.2, -r, r * 2.4, r * 2);
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = r * 0.17;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(-r * 0.12, -r * 0.04, r * 0.46, -0.45, Math.PI + 0.45);
        ctx.stroke();
    } else if (patternId === 'flowerhorn') {
        const fhGrad = ctx.createLinearGradient(-r, 0, r, 0);
        fhGrad.addColorStop(0, '#0ea5e9');
        fhGrad.addColorStop(0.55, '#f43f5e');
        fhGrad.addColorStop(1, '#e11d48');
        ctx.fillStyle = fhGrad;
        ctx.fillRect(-r * 1.3, -r, r * 2.6, r * 2);

        ctx.fillStyle = '#090d16';
        [-0.6, -0.25, 0.1].forEach(fx => {
            ctx.beginPath();
            ctx.arc(r * fx, -r * 0.05, r * 0.13, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.fillStyle = '#bae6fd';
        for (let px = -0.8; px <= 0.4; px += 0.26) {
            ctx.beginPath();
            ctx.arc(r * px, -r * 0.24, 1.4, 0, Math.PI * 2);
            ctx.arc(r * (px + 0.1), r * 0.18, 1.4, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (patternId === 'koi_kohaku') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-r * 1.3, -r, r * 2.6, r * 2);
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(r * 0.65, -r * 0.18, r * 0.24, 0, Math.PI * 2);
        ctx.arc(-r * 0.05, -r * 0.15, r * 0.42, 0, Math.PI * 2);
        ctx.arc(-r * 0.62, r * 0.08, r * 0.32, 0, Math.PI * 2);
        ctx.fill();
    } else if (patternId === 'arowana') {
        const goldSheen = ctx.createLinearGradient(-r * 1.3, -r * 0.4, r * 1.3, r * 0.4);
        goldSheen.addColorStop(0, '#b45309');
        goldSheen.addColorStop(0.5, '#fbbf24');
        goldSheen.addColorStop(1, '#fef08a');
        ctx.fillStyle = goldSheen;
        ctx.fillRect(-r * 1.4, -r * 0.5, r * 2.8, r);

        ctx.strokeStyle = 'rgba(254, 249, 195, 0.85)';
        ctx.lineWidth = 1.25;
        for (let sx = -r * 0.95; sx < r * 0.95; sx += r * 0.28) {
            ctx.beginPath();
            ctx.arc(sx, -r * 0.12, r * 0.15, -Math.PI * 0.48, Math.PI * 0.48);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(sx + r * 0.12, r * 0.1, r * 0.15, -Math.PI * 0.48, Math.PI * 0.48);
            ctx.stroke();
        }
    } else if (patternId === 'cardinal_tetra') {
        // Full belly scarlet crimson
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-r * 1.1, -r * 0.1, r * 2.2, r * 0.8);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = Math.max(2.6, r * 0.2);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(r * 0.8, -r * 0.12);
        ctx.quadraticCurveTo(0, -r * 0.18, -r * 0.85, -r * 0.08);
        ctx.stroke();
    } else if (patternId === 'kuhli_loach') {
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(-r * 1.4, -r * 0.5, r * 2.8, r);
        ctx.fillStyle = '#451a03';
        for (let kx = -0.9; kx <= 0.8; kx += 0.28) {
            ctx.beginPath();
            ctx.ellipse(r * kx, -r * 0.08, r * 0.09, r * 0.32, 0.15, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (patternId === 'mandarin_fish') {
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(-r * 1.2, -r, r * 2.4, r * 2);
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(-r * 0.2, 0, r * 0.32, 0, Math.PI * 1.5);
        ctx.arc(r * 0.35, -r * 0.1, r * 0.25, 0.5, Math.PI * 1.8);
        ctx.stroke();
        ctx.strokeStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(-r * 0.5, -r * 0.15, r * 0.2, 0, Math.PI * 2);
        ctx.arc(0, r * 0.2, r * 0.18, 0, Math.PI * 2);
        ctx.stroke();
    } else if (patternId === 'dragon_seahorse') {
        ctx.fillStyle = '#eab308';
        ctx.fillRect(-r * 1.2, -r, r * 2.4, r * 2);
        // Leafy camouflage appendages
        ctx.fillStyle = '#10b981';
        [-0.4, 0.1, 0.6].forEach(lx => {
            ctx.beginPath();
            ctx.ellipse(r * lx, -r * 0.45, r * 0.2, r * 0.08, 0.5, 0, Math.PI * 2);
            ctx.ellipse(r * (lx - 0.1), r * 0.4, r * 0.18, r * 0.08, -0.5, 0, Math.PI * 2);
            ctx.fill();
        });
    } else if (patternId === 'marbled_hatchetfish') {
        // Silver Marbled Hatchetfish: Triangular silver keel belly with jagged lightning marble bars
        ctx.fillStyle = '#f1f5f9';
        ctx.beginPath();
        ctx.moveTo(r * 0.9, -r * 0.1);
        ctx.quadraticCurveTo(-r * 0.1, r * 1.1, -r * 0.8, -r * 0.1);
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.8;
        for (let bx = -0.5; bx <= 0.5; bx += 0.28) {
            ctx.beginPath();
            ctx.moveTo(r * bx, -r * 0.05);
            ctx.lineTo(r * (bx - 0.12), r * 0.65);
            ctx.stroke();
        }
    } else if (patternId === 'peacock_gudgeon') {
        // Peacock Gudgeon: Cobalt blue flanks with orange-red vertical tiger bars & tail eye-spot
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(-r * 1.1, -r * 0.5, r * 2.2, r);
        ctx.fillStyle = '#ea580c';
        for (let gx = -0.7; gx <= 0.6; gx += 0.22) {
            ctx.fillRect(r * gx, -r * 0.4, r * 0.08, r * 0.8);
        }
        // Black peacock eye-spot rimmed in gold near tail
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(-r * 0.85, -r * 0.1, r * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(-r * 0.85, -r * 0.1, r * 0.07, 0, Math.PI * 2);
        ctx.fill();
    } else if (patternId === 'glass_catfish') {
        // Phantom Glass Catfish: Transparent body with segmented white spinal cord & pulsing internal red organ
        ctx.fillStyle = 'rgba(241, 245, 249, 0.22)';
        ctx.fillRect(-r * 1.4, -r * 0.6, r * 2.8, r * 1.2);
        // Segmented white spinal cord
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(r * 0.6, 0);
        ctx.lineTo(-r * 1.1, 0);
        ctx.stroke();
        // Tiny vertebrae ribs
        ctx.lineWidth = 1;
        for (let sx = -0.9; sx <= 0.4; sx += 0.12) {
            ctx.beginPath();
            ctx.moveTo(r * sx, -r * 0.18);
            ctx.lineTo(r * sx, r * 0.18);
            ctx.stroke();
        }
        // Beating internal vital red heart/organ sac
        const heartPulse = 1.0 + Math.sin(now * 0.012) * 0.25;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.ellipse(r * 0.45, r * 0.06, r * 0.14 * heartPulse, r * 0.18 * heartPulse, 0, 0, Math.PI * 2);
        ctx.fill();
    } else if (patternId === 'pea_puffer') {
        // Spotted Dwarf Pea Puffer: Yellow belly with dark emerald-black circular target spots
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-r * 0.9, 0, r * 1.8, r * 0.8);
        ctx.fillStyle = '#064e3b';
        const puffSpots = [
            { x: -0.3, y: -0.35, rad: 0.14 },
            { x: 0.15, y: -0.4, rad: 0.12 },
            { x: -0.5, y: -0.1, rad: 0.11 },
            { x: 0.35, y: -0.15, rad: 0.15 },
            { x: -0.1, y: 0.15, rad: 0.1 }
        ];
        puffSpots.forEach(s => {
            ctx.beginPath();
            ctx.arc(r * s.x, r * s.y, r * s.rad, 0, Math.PI * 2);
            ctx.fill();
        });
    } else if (patternId === 'boesemani_rainbow') {
        // Boesemani Rainbowfish: Split gradient (front cobalt blue, rear blazing tangerine)
        const rainGrad = ctx.createLinearGradient(-r * 1.2, 0, r * 1.2, 0);
        rainGrad.addColorStop(0, '#f97316');
        rainGrad.addColorStop(0.48, '#fb923c');
        rainGrad.addColorStop(0.52, '#0284c7');
        rainGrad.addColorStop(1, '#1e40af');
        ctx.fillStyle = rainGrad;
        ctx.fillRect(-r * 1.2, -r * 0.8, r * 2.4, r * 1.6);
        // Vertical iridescent sheen bars
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.2;
        for (let rx = -0.8; rx <= 0.8; rx += 0.22) {
            ctx.beginPath();
            ctx.moveTo(r * rx, -r * 0.5);
            ctx.lineTo(r * rx, r * 0.5);
            ctx.stroke();
        }
    } else if (patternId === 'amazon_leaf_fish') {
        // Mimic Amazon Leaf Fish: Veined dead-leaf camouflage outline with stem chin barbel
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-r * 1.2, -r * 0.7, r * 2.4, r * 1.4);
        // Center leaf vein
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(r * 0.9, 0);
        ctx.lineTo(-r * 0.9, 0);
        ctx.stroke();
        // Leaf vein branches
        for (let lx = -0.6; lx <= 0.6; lx += 0.3) {
            ctx.beginPath();
            ctx.moveTo(r * lx, 0);
            ctx.lineTo(r * (lx + 0.15), -r * 0.45);
            ctx.moveTo(r * lx, 0);
            ctx.lineTo(r * (lx + 0.15), r * 0.45);
            ctx.stroke();
        }
    } else if (patternId === 'elephantnose_fish') {
        // Peter's Elephantnose Fish: Dark body with down-curved sensory chin trunk & electric stripes
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-r * 1.3, -r * 0.6, r * 2.6, r * 1.2);
        // Downcurved chin proboscis
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = r * 0.18;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(r * 0.95, r * 0.15);
        ctx.quadraticCurveTo(r * 1.25, r * 0.4, r * 1.15, r * 0.75);
        ctx.stroke();
        // White electric organ stripes on tail
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-r * 0.75, -r * 0.3);
        ctx.lineTo(-r * 0.75, r * 0.3);
        ctx.moveTo(-r * 0.92, -r * 0.25);
        ctx.lineTo(-r * 0.92, r * 0.25);
        ctx.stroke();
    } else if (patternId === 'african_butterfly') {
        // Pantodon African Butterflyfish: Broad surface lace wings & marble camouflage
        ctx.fillStyle = '#713f12';
        ctx.fillRect(-r * 1.2, -r * 0.6, r * 2.4, r * 1.2);
        // Large fan lace wings spread on sides
        ctx.fillStyle = 'rgba(254, 243, 199, 0.45)';
        ctx.strokeStyle = '#a16207';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.2);
        ctx.quadraticCurveTo(r * 0.6, -r * 1.1, -r * 0.6, -r * 1.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    } else if (patternId === 'hillstream_loach') {
        // Borneo Hillstream Loach: Honeycomb labyrinth spots on aerodynamic saucer wings
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(-r * 1.2, -r * 0.8, r * 2.4, r * 1.6);
        ctx.fillStyle = '#fef08a';
        for (let hx = -0.7; hx <= 0.7; hx += 0.25) {
            for (let hy = -0.4; hy <= 0.4; hy += 0.26) {
                ctx.beginPath();
                ctx.arc(r * hx, r * hy, r * 0.08, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    } else if (patternId === 'black_ghost_knife') {
        // Velvet Black Ghost Knifefish: Jet black body, undulating belly ribbon fin & ivory tail rings
        ctx.fillStyle = '#09090b';
        ctx.fillRect(-r * 1.4, -r * 0.6, r * 2.8, r * 1.2);
        // Ivory white tail rings
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-r * 1.05, -r * 0.2, r * 0.08, r * 0.4);
        ctx.fillRect(-r * 0.85, -r * 0.2, r * 0.08, r * 0.4);
        // Undulating bottom ribbon fin
        const knifeWave = Math.sin(now * 0.008);
        ctx.strokeStyle = 'rgba(39, 39, 42, 0.9)';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(r * 0.5, r * 0.35);
        ctx.quadraticCurveTo(0, r * 0.6 + knifeWave * 3, -r * 1.0, r * 0.35);
        ctx.stroke();
    } else if (patternId === 'senegal_bichir') {
        // Armored Dinosaur Bichir: Ganoid scales crosshatch & serrated dorsal finlet row
        ctx.fillStyle = '#475569';
        ctx.fillRect(-r * 1.5, -r * 0.5, r * 3.0, r);
        // Sawtooth dorsal finlets
        ctx.fillStyle = '#64748b';
        for (let fx = -0.8; fx <= 0.6; fx += 0.18) {
            ctx.beginPath();
            ctx.moveTo(r * fx, -r * 0.28);
            ctx.lineTo(r * (fx - 0.06), -r * 0.6);
            ctx.lineTo(r * (fx + 0.06), -r * 0.28);
            ctx.closePath();
            ctx.fill();
        }
    } else if (patternId === 'pink_axolotl') {
        // Smiling Sakura Axolotl: Sakura blushing body, smiling mouth, & 6 feathery crimson external gills
        ctx.fillStyle = '#fecdd3';
        ctx.fillRect(-r * 1.3, -r * 0.6, r * 2.6, r * 1.2);
        // Cheerful curved smiling mouth
        ctx.strokeStyle = '#e11d48';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(r * 0.72, r * 0.08, r * 0.18, 0.2, Math.PI * 0.85);
        ctx.stroke();
        // 6 Branching external feathered crimson gills on head sides
        const gillSway = Math.sin(now * 0.005) * 4;
        ctx.fillStyle = '#f43f5e';
        [-1, 1].forEach(side => {
            for (let g = 0; g < 3; g++) {
                const gx = r * 0.2 - g * r * 0.12;
                const gy = side * (r * 0.42);
                ctx.beginPath();
                ctx.ellipse(gx, gy + side * (g * 3 + gillSway * 0.4), r * 0.24, r * 0.08, side * (0.4 + g * 0.2), 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    // Custom Hybrid Chimera Color Tint Overlay when crossbred from 2 different species
    if (fish.hybridTraits && fish.hybridTraits.isHybrid) {
        ctx.save();
        ctx.globalAlpha = 0.42;
        const hybGrad = ctx.createLinearGradient(-r, -r * 0.6, r, r * 0.6);
        hybGrad.addColorStop(0, fish.hybridTraits.primaryColor);
        hybGrad.addColorStop(1, fish.hybridTraits.secondaryColor);
        ctx.fillStyle = hybGrad;
        ctx.fillRect(-r * 1.4, -r, r * 2.8, r * 2);
        ctx.restore();
    }

        // Top 3D Specular Gloss Highlight (Cached)
        ctx.fillStyle = getCachedGlossGrad(r);
        ctx.fillRect(-r * 1.4, -r, r * 2.8, r * 0.7);
        ctx.restore();
    }

    // 5. BREATHING GILL OPERCULUM & FLUTTERING PECTORAL FIN
    const gillBreath = Math.sin(now * 0.006 + fish.finPhase) * 1.2;
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.38)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(r * 0.42 + gillBreath * 0.3, -r * 0.02, r * 0.28, 2.3, 4.0);
    ctx.stroke();

    const pecFlap = Math.sin(fish.finPhase * 1.6) * 0.32;
    ctx.save();
    ctx.translate(r * 0.18, r * 0.16);
    ctx.rotate(pecFlap);
    ctx.fillStyle = spec.finColor;
    ctx.beginPath();
    ctx.ellipse(-r * 0.16, r * 0.08, r * 0.26, r * 0.13, 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 6. EXPRESSIVE MULTI-LAYERED JEWEL EYE
    const eyeX = spec.bodyShape === 'arowana' ? r * 0.98 : r * 0.64;
    const eyeY = -r * 0.12;
    const eyeR = Math.max(2.2, r * 0.15);

    ctx.fillStyle = spec.id === 'angelfish' ? '#ef4444' : '#fef08a';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, eyeR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.arc(eyeX + eyeR * 0.15, eyeY, eyeR * 0.58, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(eyeX + eyeR * 0.3, eyeY - eyeR * 0.28, eyeR * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 7. Status Overhead Indicators (unflipped text)
    if (fish.hunger < 25) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = '600 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🍽️ Hungry', fish.x, fish.y - r - 11);
    } else if (fish.id === selectedFishId) {
        ctx.fillStyle = '#f8fafc';
        ctx.font = '700 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        const morphTag = fish.morph === 'cosmic' ? ' 🌌' : (fish.morph === 'prism' ? ' 🌈' : (fish.morph === 'lustre' ? ' ✨' : ''));
        const hybTag = (fish.hybridTraits && fish.hybridTraits.isHybrid) ? ' 🧬' : '';
        ctx.fillText(fish.name + morphTag + hybTag, fish.x, fish.y - r - 11);
    }
}