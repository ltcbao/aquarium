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
        // True 3D Cylindrical Countershading (Dorsal Shadow -> Vibrant Flank -> Shimmering Lateral Line -> Silvery Pearl Belly)
        grad = ctx.createLinearGradient(0, -quantR * 0.85, 0, quantR * 0.85);
        grad.addColorStop(0, primary);
        grad.addColorStop(0.35, primary);
        grad.addColorStop(0.65, secondary);
        grad.addColorStop(0.92, '#f8fafc');
        grad.addColorStop(1, 'rgba(241, 245, 249, 0.88)');
        fishBodyGradCache.set(key, grad);
    }
    return grad;
}

function getCachedGlossGrad(r) {
    const quantR = Math.round(r * 0.35) * 3;
    let grad = fishGlossGradCache.get(quantR);
    if (!grad) {
        if (fishGlossGradCache.size > 60) fishGlossGradCache.clear();
        grad = ctx.createLinearGradient(0, -quantR * 0.85, 0, -quantR * 0.1);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
        grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.18)');
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
        grad.addColorStop(0.45, finColor || '#38bdf8');
        grad.addColorStop(0.85, 'rgba(255, 255, 255, 0.38)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0.06)');
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

    // Dynamic Growth Celebration Subtle Shimmer (without geometric circles)
    if (fish.growthTimer > 0) {
        const gPulse = Math.sin(fish.growthTimer * Math.PI);
        if (Math.random() < 0.2) {
            spawnParticleBurst(fish.x, fish.y, fish.stage === 'adult' ? '#fbbf24' : '#34d399', 1, 'sparkle');
        }
    }

    // Sleek Minimalist Selection Pointer (Eliminates the crude circular hoop around the fish body)
    if (fish.id === selectedFishId) {
        ctx.save();
        const pointerY = -spec.baseSize * 1.35 * depthScale - 16 + Math.sin(now * 0.007) * 3;
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = 'rgba(56, 189, 248, 0.6)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(0, pointerY + 6);
        ctx.lineTo(-5, pointerY - 2);
        ctx.lineTo(5, pointerY - 2);
        ctx.closePath();
        ctx.fill();
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

    // Realistic organic swimming kinematics with 3D turn transition & body undulation
    const facing = fish.facing || 1;
    const renderFacing = fish.renderFacing !== undefined ? fish.renderFacing : facing;
    const bodyWiggle = Math.sin(fish.tailPhase) * 0.045;
    const smoothPitch = (fish.pitchAngle !== undefined ? fish.pitchAngle : (Math.max(-0.35, Math.min(0.35, (fish.vy || 0) * 0.14)) * facing)) + bodyWiggle;

    // 3D Volumetric Turn: never squashes to 0 flat cardboard; maintains volume and banks into the turn
    const turnAbs = Math.abs(renderFacing);
    const visualScaleX = Math.sign(renderFacing || 1) * (0.35 + 0.65 * turnAbs);
    const visualScaleY = 1.0 + (1.0 - turnAbs) * 0.16; // 3D foreshortening depth
    const bankTilt = (1.0 - turnAbs) * ((fish.vy || 0) < 0 ? -0.22 : 0.22) * Math.sign(renderFacing || 1);

    ctx.scale(visualScaleX, visualScaleY);
    ctx.rotate(smoothPitch + bankTilt);

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

    // Living Flexible Spine Wave & Dynamic Turning Curvature (Bơi uốn lượn cả thân mình)
    const turnBend = (fish.turnCurve || 0) * (r * 0.35);
    const spineWave = Math.sin(fish.tailPhase - 0.7) * (r * 0.12);
    const totalSpineFlex = spineWave + turnBend;

    const tailSwing = Math.sin(fish.tailPhase) * (r * 0.34) + turnBend * 1.25;
    const tailLag = Math.sin(fish.tailPhase - 0.85) * (r * 0.48) + turnBend * 1.5;
    const dorsalWave = Math.cos(fish.tailPhase - 0.6) * (r * 0.16) + turnBend * 0.4;
    const peduncleY = tailSwing * 0.45 + totalSpineFlex * 0.6;
    const snoutY = -totalSpineFlex * 0.22;
    const midSpineY = totalSpineFlex * 0.65;

    // Organic Spine Mapping across normalized X (-1.2 at tail -> +1.2 at snout)
    const getSpineY = (nx) => {
        if (nx >= 0) {
            const t = Math.min(1, Math.max(0, nx));
            return midSpineY * (1 - t) + snoutY * t;
        } else {
            const t = Math.min(1, Math.max(0, -nx));
            return midSpineY * (1 - t) + peduncleY * t;
        }
    };
    const getSpineSlope = (nx) => (nx >= 0 ? (snoutY - midSpineY) : (midSpineY - peduncleY)) * 0.65;

    // 1. MULTI-LAYERED FLOWING CAUDAL (TAIL) FIN
    const tailGrad = getCachedTailGrad(primaryCol, spec.finColor, r);
    ctx.fillStyle = tailGrad;

    ctx.beginPath();
    if (spec.bodyShape === 'betta' || spec.bodyShape === 'guppy' || spec.bodyShape === 'koi') {
        ctx.moveTo(-r * 0.78, peduncleY * 0.85);
        ctx.bezierCurveTo(-r * 1.35, -r * 1.25 + tailSwing, -r * 2.1, -r * 1.05 + tailLag, -r * 2.55, -r * 0.25 + tailLag * 1.25);
        ctx.quadraticCurveTo(-r * 2.75, tailLag * 1.35, -r * 2.55, r * 0.25 + tailLag * 1.25);
        ctx.bezierCurveTo(-r * 2.1, r * 1.05 + tailLag, -r * 1.35, r * 1.25 + tailSwing, -r * 0.78, peduncleY * 0.85);
    } else if (spec.bodyShape === 'angel' || spec.bodyShape === 'discus') {
        ctx.moveTo(-r * 0.8, peduncleY);
        ctx.quadraticCurveTo(-r * 1.35, -r * 0.65 + tailSwing, -r * 2.05, -r * 0.92 + tailLag);
        ctx.quadraticCurveTo(-r * 1.5, tailSwing * 0.4, -r * 2.05, r * 0.92 + tailLag);
        ctx.quadraticCurveTo(-r * 1.35, r * 0.65 + tailSwing, -r * 0.8, peduncleY);
    } else if (spec.bodyShape === 'arowana' || spec.bodyShape === 'flowerhorn') {
        ctx.moveTo(-r * 1.05, peduncleY);
        ctx.bezierCurveTo(-r * 1.55, -r * 0.72 + tailSwing, -r * 2.08, -r * 0.48 + tailLag, -r * 2.12, tailLag);
        ctx.bezierCurveTo(-r * 2.08, r * 0.48 + tailLag, -r * 1.55, r * 0.72 + tailSwing, -r * 1.05, peduncleY);
    } else {
        ctx.moveTo(-r * 0.85, peduncleY);
        ctx.quadraticCurveTo(-r * 1.3, -r * 0.52 + tailSwing * 0.7, -r * 1.75, -r * 0.68 + tailLag);
        ctx.lineTo(-r * 1.28, peduncleY * 0.5 + tailSwing * 0.35);
        ctx.lineTo(-r * 1.75, r * 0.68 + tailLag);
        ctx.quadraticCurveTo(-r * 1.3, r * 0.52 + tailSwing * 0.7, -r * 0.85, peduncleY);
    }
    ctx.closePath();
    ctx.fill();

    // Delicate Iridescent Fin Rays on Caudal Fin with Progressive Sinuous Phase Lag
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
    ctx.lineWidth = Math.max(0.75, r * 0.038);
    const rayCount = (spec.bodyShape === 'betta' || spec.bodyShape === 'guppy' || spec.bodyShape === 'koi') ? 7 : 5;
    ctx.beginPath();
    for (let i = 0; i < rayCount; i++) {
        const spread = (i / (rayCount - 1) - 0.5) * 1.35;
        const tipLag = Math.sin(fish.tailPhase - 1.1 + i * 0.22) * (r * 0.32) + turnBend * 1.5;
        ctx.moveTo(-r * 0.85, peduncleY * 0.8);
        ctx.bezierCurveTo(
            -r * 1.35,
            r * spread * 0.55 + tailSwing,
            -r * 1.82,
            r * spread * 0.88 + tailLag,
            -r * 2.15,
            r * spread * 1.12 + tipLag
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

    // 3. SCULPTED 3D BODY SILHOUETTE & IRIDESCENT SHADER (Flexible Undulating Spine)
    ctx.beginPath();
    if (spec.bodyShape === 'discus') {
        ctx.ellipse(0, midSpineY * 0.4, r * 0.96, r * 0.9, 0, 0, Math.PI * 2);
    } else if (spec.bodyShape === 'angel') {
        ctx.moveTo(r * 0.95, snoutY);
        ctx.quadraticCurveTo(r * 0.2, -r * 0.95 + midSpineY, -r * 0.88, peduncleY);
        ctx.quadraticCurveTo(r * 0.2, r * 0.95 + midSpineY, r * 0.95, snoutY);
    } else if (spec.bodyShape === 'arowana') {
        ctx.moveTo(r * 1.38, snoutY);
        ctx.bezierCurveTo(r * 0.6, -r * 0.45 + midSpineY, -r * 0.5, -r * 0.4 + midSpineY * 1.1, -r * 1.25, peduncleY);
        ctx.bezierCurveTo(-r * 0.5, r * 0.4 + midSpineY * 1.1, r * 0.6, r * 0.45 + midSpineY, r * 1.38, snoutY);
    } else if (spec.bodyShape === 'flowerhorn') {
        ctx.ellipse(-r * 0.05, midSpineY * 0.35, r * 1.05, r * 0.64, 0, 0, Math.PI * 2);
        ctx.arc(r * 0.62, -r * 0.44 + snoutY, r * 0.42, 0, Math.PI * 2);
    } else if (spec.bodyShape === 'pleco' || spec.bodyShape === 'cory') {
        ctx.moveTo(r * 1.08, r * 0.25 + snoutY);
        ctx.bezierCurveTo(r * 0.65, -r * 0.72 + midSpineY, -r * 0.35, -r * 0.62 + midSpineY * 1.1, -r * 1.05, r * 0.12 + peduncleY);
        ctx.lineTo(r * 1.08, r * 0.25 + snoutY);
    } else if (spec.bodyShape === 'eel' || spec.bodyShape === 'ribbon') {
        ctx.moveTo(r * 1.35, snoutY);
        ctx.bezierCurveTo(r * 0.45, -r * 0.32 + spineWave * 0.8, -r * 0.45, -r * 0.28 + totalSpineFlex * 1.2, -r * 1.45, tailSwing * 0.65 + totalSpineFlex * 1.4);
        ctx.bezierCurveTo(-r * 0.45, r * 0.28 + totalSpineFlex * 1.2, r * 0.45, r * 0.32 + spineWave * 0.8, r * 1.35, snoutY);
    } else if (spec.bodyShape === 'hatchet') {
        ctx.moveTo(r * 1.02, -r * 0.2 + snoutY);
        ctx.lineTo(-r * 0.92, -r * 0.15 + peduncleY);
        ctx.quadraticCurveTo(-r * 0.1, r * 1.15 + midSpineY, r * 1.02, -r * 0.2 + snoutY);
    } else if (spec.bodyShape === 'axolotl') {
        ctx.ellipse(-r * 0.1, midSpineY * 0.3, r * 1.25, r * 0.46, 0, 0, Math.PI * 2);
    } else if (spec.bodyShape === 'puffer') {
        ctx.ellipse(0, midSpineY * 0.2, r * 0.85, r * 0.78, 0, 0, Math.PI * 2);
    } else {
        // Classic fusiform fish (Tetra, Guppy, Danio, Rainbow, etc.)
        ctx.moveTo(r * 1.08, snoutY);
        ctx.bezierCurveTo(r * 0.65, -r * 0.68 + midSpineY, -r * 0.45, -r * 0.62 + midSpineY * 1.15, -r * 1.02, peduncleY);
        ctx.bezierCurveTo(-r * 0.45, r * 0.64 + midSpineY * 1.15, r * 0.65, r * 0.68 + midSpineY, r * 1.08, snoutY);
    }

    const bodyGrad = getCachedBodyGrad(spec.id, primaryCol, secondaryCol, r);
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // 4. INTRICATE SPECIES PATTERNS, METALLIC SCALES & SHIMMERING SHEEN (With Distance LOD)
    if (depthZ > -0.38) {
        ctx.save();
        ctx.clip();

    if (patternId === 'neon_tetra') {
        // Neon Tetra: Organic scarlet crimson belly curving along lower spine to tail peduncle
        const bellyGrad = ctx.createLinearGradient(0, getSpineY(-0.5), 0, getSpineY(-0.5) + r * 0.7);
        bellyGrad.addColorStop(0, '#ef4444');
        bellyGrad.addColorStop(0.65, '#dc2626');
        bellyGrad.addColorStop(1, '#991b1b');
        ctx.fillStyle = bellyGrad;
        ctx.beginPath();
        ctx.moveTo(-r * 0.05, getSpineY(-0.05) + r * 0.08);
        ctx.quadraticCurveTo(-r * 0.55, getSpineY(-0.55) + r * 0.12, -r * 1.02, peduncleY);
        ctx.lineTo(-r * 1.02, peduncleY + r * 0.28);
        ctx.quadraticCurveTo(-r * 0.55, getSpineY(-0.55) + r * 0.62, -r * 0.05, getSpineY(-0.05) + r * 0.45);
        ctx.closePath();
        ctx.fill();

        // Iridescent Bioluminescent Cyan Lateral Beam (Outer Bloom + Bright Core)
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.lineWidth = Math.max(3.8, r * 0.25);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(r * 0.72, getSpineY(0.72) - r * 0.05);
        ctx.bezierCurveTo(r * 0.15, getSpineY(0.15) - r * 0.06, -r * 0.4, getSpineY(-0.4) - r * 0.02, -r * 0.88, peduncleY - r * 0.02);
        ctx.stroke();

        ctx.strokeStyle = '#e0f2fe';
        ctx.lineWidth = Math.max(1.6, r * 0.11);
        ctx.beginPath();
        ctx.moveTo(r * 0.72, getSpineY(0.72) - r * 0.05);
        ctx.bezierCurveTo(r * 0.15, getSpineY(0.15) - r * 0.06, -r * 0.4, getSpineY(-0.4) - r * 0.02, -r * 0.88, peduncleY - r * 0.02);
        ctx.stroke();

        // Silvery pearl anterior abdomen shield
        ctx.fillStyle = 'rgba(241, 245, 249, 0.75)';
        ctx.beginPath();
        ctx.ellipse(r * 0.28, getSpineY(0.28) + r * 0.24, r * 0.24, r * 0.15, 0.1, 0, Math.PI * 2);
        ctx.fill();
    } else if (patternId === 'cardinal_tetra') {
        // Cardinal Tetra: Full-length deep scarlet crimson underbelly from throat to caudal base
        const cardBellyGrad = ctx.createLinearGradient(0, 0, 0, r * 0.7);
        cardBellyGrad.addColorStop(0, '#dc2626');
        cardBellyGrad.addColorStop(0.7, '#b91c1c');
        cardBellyGrad.addColorStop(1, '#7f1d1d');
        ctx.fillStyle = cardBellyGrad;
        ctx.beginPath();
        ctx.moveTo(r * 0.65, getSpineY(0.65) + r * 0.08);
        ctx.bezierCurveTo(r * 0.15, getSpineY(0.15) + r * 0.12, -r * 0.45, getSpineY(-0.45) + r * 0.12, -r * 1.02, peduncleY);
        ctx.lineTo(-r * 1.02, peduncleY + r * 0.28);
        ctx.bezierCurveTo(-r * 0.45, getSpineY(-0.45) + r * 0.65, r * 0.15, getSpineY(0.15) + r * 0.62, r * 0.65, getSpineY(0.65) + r * 0.32);
        ctx.closePath();
        ctx.fill();

        // Electric cyan-blue lateral line
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.lineWidth = Math.max(3.8, r * 0.24);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(r * 0.82, getSpineY(0.82) - r * 0.05);
        ctx.bezierCurveTo(r * 0.2, getSpineY(0.2) - r * 0.06, -r * 0.45, getSpineY(-0.45) - r * 0.02, -r * 0.92, peduncleY - r * 0.02);
        ctx.stroke();

        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = Math.max(1.6, r * 0.1);
        ctx.beginPath();
        ctx.moveTo(r * 0.82, getSpineY(0.82) - r * 0.05);
        ctx.bezierCurveTo(r * 0.2, getSpineY(0.2) - r * 0.06, -r * 0.45, getSpineY(-0.45) - r * 0.02, -r * 0.92, peduncleY - r * 0.02);
        ctx.stroke();
    } else if (patternId === 'clownfish') {
        // Clownfish (Amphiprion ocellaris): 3 Contoured Anatomical White Bars with Spine Curvature & Pitch Tilting
        const drawClownBar = (nx, width, peakForward = 0) => {
            const cy = getSpineY(nx);
            const slope = getSpineSlope(nx);
            const bx = r * nx;
            const w = r * width;
            ctx.beginPath();
            ctx.moveTo(bx - w * 0.5 - slope * 0.6, cy - r * 1.1);
            ctx.quadraticCurveTo(bx + peakForward * r * 0.2, cy, bx - w * 0.5 + slope * 0.6, cy + r * 1.1);
            ctx.lineTo(bx + w * 0.5 + slope * 0.6, cy + r * 1.1);
            ctx.quadraticCurveTo(bx + w * 0.5 + peakForward * r * 0.2, cy, bx + w * 0.5 - slope * 0.6, cy - r * 1.1);
            ctx.closePath();
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.strokeStyle = '#090d16';
            ctx.lineWidth = Math.max(1.5, r * 0.07);
            ctx.stroke();
        };
        drawClownBar(0.52, 0.18, 0.05);   // Head bar behind eye
        drawClownBar(-0.05, 0.24, 0.16);  // Mid bar with signature forward triangular crest
        drawClownBar(-0.68, 0.16, 0.02);  // Tail bar near caudal peduncle
    } else if (patternId === 'panda_cory') {
        // Panda Corydoras: Soft pearlescent body with velvety obsidian markings hugging spine curves
        ctx.fillStyle = '#0f172a';
        // Eye mask slanting across cheek
        const eyeCy = getSpineY(0.54);
        ctx.beginPath();
        ctx.ellipse(r * 0.54, eyeCy - r * 0.06, r * 0.18, r * 0.32, 0.35, 0, Math.PI * 2);
        ctx.fill();

        // Dorsal saddle hugging mid-spine crest
        const midCy = getSpineY(-0.02);
        ctx.beginPath();
        ctx.moveTo(-r * 0.28, midCy - r * 0.65);
        ctx.quadraticCurveTo(r * 0.02, midCy - r * 0.8, r * 0.18, midCy - r * 0.55);
        ctx.quadraticCurveTo(r * 0.05, midCy - r * 0.1, -r * 0.24, midCy - r * 0.15);
        ctx.closePath();
        ctx.fill();

        // Caudal peduncle black spot swaying with peduncleY
        ctx.beginPath();
        ctx.arc(-r * 0.85, peduncleY, r * 0.18, 0, Math.PI * 2);
        ctx.fill();

        // Delicate sensory barbels at snout
        ctx.strokeStyle = '#fde68a';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(r * 0.98, getSpineY(0.98) + r * 0.2);
        ctx.quadraticCurveTo(r * 1.18, getSpineY(0.98) + r * 0.32, r * 1.25, getSpineY(0.98) + r * 0.28 + Math.sin(now * 0.008) * 2);
        ctx.stroke();
    } else if (patternId === 'fancy_guppy') {
        // Fancy Guppy: Sinuous flame-like mosaic markings undulating along the spine
        const gupGrad = ctx.createLinearGradient(-r, 0, r, 0);
        gupGrad.addColorStop(0, '#ec4899');
        gupGrad.addColorStop(0.5, '#f59e0b');
        gupGrad.addColorStop(1, '#38bdf8');
        ctx.fillStyle = gupGrad;
        ctx.beginPath();
        ctx.moveTo(r * 0.5, getSpineY(0.5) - r * 0.15);
        ctx.bezierCurveTo(0, midSpineY - r * 0.25, -r * 0.6, getSpineY(-0.6) - r * 0.18, -r * 0.95, peduncleY);
        ctx.bezierCurveTo(-r * 0.6, getSpineY(-0.6) + r * 0.22, 0, midSpineY + r * 0.25, r * 0.5, getSpineY(0.5) + r * 0.15);
        ctx.closePath();
        ctx.fill();

        // Leopard / mosaic spots that undulate with the spine wave
        ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
        [-0.65, -0.4, -0.15, 0.1].forEach((nx, idx) => {
            const spotY = getSpineY(nx) + (idx % 2 === 0 ? -1 : 1) * r * 0.12;
            ctx.beginPath();
            ctx.ellipse(r * nx, spotY, r * 0.08, r * 0.05, 0.4 * (idx % 2 === 0 ? 1 : -1), 0, Math.PI * 2);
            ctx.fill();
        });
    } else if (patternId === 'angelfish') {
        // Angelfish: Bowing, Tapering Vertical Stress Bars conforming to spine curvature
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        [0.48, 0.05, -0.4, -0.78].forEach((nx, idx) => {
            const cy = getSpineY(nx);
            const slope = getSpineSlope(nx);
            const bx = r * nx;
            const w = idx === 1 ? r * 0.15 : (idx === 0 ? r * 0.11 : r * 0.08);
            ctx.beginPath();
            ctx.moveTo(bx - w * 0.5 - slope * 0.8, cy - r * 1.5);
            ctx.quadraticCurveTo(bx - slope * 0.1, cy, bx - w * 0.35 + slope * 0.8, cy + r * 1.5);
            ctx.lineTo(bx + w * 0.35 + slope * 0.8, cy + r * 1.5);
            ctx.quadraticCurveTo(bx + slope * 0.1, cy, bx + w * 0.5 - slope * 0.8, cy - r * 1.5);
            ctx.closePath();
            ctx.fill();
        });

        // Trailing filamentous pelvic streamers with wave lag
        ctx.strokeStyle = 'rgba(254, 240, 138, 0.85)';
        ctx.lineWidth = 1.2;
        const streamLag = Math.sin(fish.tailPhase - 1.2) * (r * 0.28);
        ctx.beginPath();
        ctx.moveTo(r * 0.18, getSpineY(0.18) + r * 0.65);
        ctx.quadraticCurveTo(r * 0.05, r * 1.6 + streamLag, -r * 0.45, r * 2.3 + streamLag * 1.3);
        ctx.moveTo(r * 0.22, getSpineY(0.22) + r * 0.62);
        ctx.quadraticCurveTo(r * 0.1, r * 1.5 + streamLag, -r * 0.38, r * 2.1 + streamLag * 1.3);
        ctx.stroke();
    } else if (patternId === 'discus') {
        // Discus: Luminous turquoise vermiculation ripples flowing across circular body
        ctx.strokeStyle = '#67e8f9';
        ctx.lineWidth = Math.max(1.8, r * 0.075);
        for (let s = -3; s <= 3; s++) {
            const nx = s * 0.24;
            const cy = getSpineY(nx);
            const bx = r * nx;
            ctx.beginPath();
            ctx.moveTo(bx, cy - r * 0.95);
            ctx.bezierCurveTo(
                bx + r * 0.12, cy - r * 0.35,
                bx - r * 0.12, cy + r * 0.35,
                bx, cy + r * 0.95
            );
            ctx.stroke();
        }
        // Translucent stress bars that flex with the spine
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.28)';
        ctx.lineWidth = Math.max(2.2, r * 0.09);
        [-0.5, -0.15, 0.2].forEach(nx => {
            const cy = getSpineY(nx);
            ctx.beginPath();
            ctx.moveTo(r * nx, cy - r * 0.9);
            ctx.lineTo(r * nx, cy + r * 0.9);
            ctx.stroke();
        });
    } else if (patternId === 'blue_tang') {
        // Blue Tang (Paracanthurus hepatus): Signature looping painter's palette & yellow tail wedge
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = r * 0.18;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(r * 0.55, getSpineY(0.55) - r * 0.15);
        ctx.bezierCurveTo(r * 0.1, midSpineY - r * 0.55, -r * 0.65, getSpineY(-0.65) - r * 0.45, -r * 0.85, peduncleY);
        ctx.bezierCurveTo(-r * 0.65, getSpineY(-0.65) + r * 0.25, -r * 0.1, midSpineY + r * 0.25, r * 0.05, getSpineY(0.05));
        ctx.bezierCurveTo(r * 0.15, getSpineY(0.15) - r * 0.2, r * 0.35, getSpineY(0.35) - r * 0.15, r * 0.55, getSpineY(0.55) - r * 0.15);
        ctx.stroke();

        // Brilliant canary yellow caudal wedge pointing forward
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.moveTo(-r * 0.35, peduncleY);
        ctx.lineTo(-r * 1.15, peduncleY - r * 0.45);
        ctx.lineTo(-r * 1.15, peduncleY + r * 0.45);
        ctx.closePath();
        ctx.fill();
    } else if (patternId === 'arowana') {
        // Asian Dragon Arowana: Overlapping golden dragon scales aligned along the undulating spine
        ctx.strokeStyle = 'rgba(254, 240, 138, 0.9)';
        ctx.lineWidth = 1.3;
        for (let sx = -0.95; sx < 0.95; sx += 0.24) {
            const cy = getSpineY(sx);
            const bx = r * sx;
            [-0.14, 0.12].forEach(yoff => {
                ctx.beginPath();
                ctx.arc(bx, cy + r * yoff, r * 0.15, -Math.PI * 0.45, Math.PI * 0.45);
                ctx.stroke();
            });
        }
        // Dragon chin barbels pointing forward
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(r * 1.3, snoutY + r * 0.08);
        ctx.quadraticCurveTo(r * 1.55, snoutY + r * 0.12, r * 1.65, snoutY + r * 0.06);
        ctx.stroke();
    } else if (patternId === 'koi_kohaku') {
        // Japanese Koi Kohaku: Pure porcelain white base with organic crimson "Hi" brush patches
        ctx.fillStyle = '#dc2626';
        // Head patch (flexes with snoutY)
        ctx.beginPath();
        ctx.ellipse(r * 0.65, getSpineY(0.65) - r * 0.08, r * 0.28, r * 0.18, -0.15, 0, Math.PI * 2);
        ctx.fill();

        // Mid-body stepped saddle (flexes with midSpineY)
        ctx.beginPath();
        ctx.ellipse(-r * 0.05, midSpineY - r * 0.12, r * 0.42, r * 0.28, 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Caudal peduncle step (flexes with peduncleY)
        ctx.beginPath();
        ctx.ellipse(-r * 0.65, peduncleY + r * 0.06, r * 0.28, r * 0.16, -0.2, 0, Math.PI * 2);
        ctx.fill();
    } else if (patternId === 'flowerhorn') {
        // Flowerhorn: High nuchal kok + calligraphic "dragon flower" lateral spots
        ctx.fillStyle = '#090d16';
        [-0.6, -0.25, 0.1].forEach(nx => {
            const cy = getSpineY(nx);
            ctx.beginPath();
            ctx.arc(r * nx, cy - r * 0.04, r * 0.13, 0, Math.PI * 2);
            ctx.fill();
        });
        // Metallic pearl spangles ("worm tracks")
        ctx.fillStyle = '#bae6fd';
        for (let px = -0.8; px <= 0.4; px += 0.24) {
            const cy = getSpineY(px);
            ctx.beginPath();
            ctx.arc(r * px, cy - r * 0.22, 1.5, 0, Math.PI * 2);
            ctx.arc(r * (px + 0.08), cy + r * 0.18, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (patternId === 'black_ghost_knife') {
        // Velvet Black Ghost Knifefish: Jet obsidian body + travelling ventral ribbon wave + ivory tail rings
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.ellipse(-r * 1.05, peduncleY, r * 0.05, r * 0.22, 0, 0, Math.PI * 2);
        ctx.ellipse(-r * 0.85, peduncleY, r * 0.05, r * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ivory dorsal blaze from snout over brow
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(r * 1.25, snoutY);
        ctx.quadraticCurveTo(r * 0.7, getSpineY(0.7) - r * 0.15, r * 0.2, midSpineY - r * 0.22);
        ctx.stroke();

        // Continuous travelling ventral ribbon wave
        ctx.strokeStyle = 'rgba(63, 63, 70, 0.95)';
        ctx.lineWidth = Math.max(3.0, r * 0.15);
        ctx.beginPath();
        for (let vx = -0.9; vx <= 0.6; vx += 0.05) {
            const cy = getSpineY(vx);
            const ribbonWave = Math.sin(now * 0.009 + vx * 14) * (r * 0.12);
            const px = r * vx;
            const py = cy + r * 0.32 + ribbonWave;
            if (vx === -0.9) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
    } else if (patternId === 'senegal_bichir') {
        // Senegal Dinosaur Bichir: Ganoid diamond scale crosshatch & serrated dorsal finlet row
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.75)';
        ctx.lineWidth = 1.0;
        for (let bx = -1.1; bx <= 0.8; bx += 0.22) {
            const cy = getSpineY(bx);
            ctx.beginPath();
            ctx.moveTo(r * bx, cy - r * 0.22);
            ctx.lineTo(r * (bx + 0.12), cy + r * 0.22);
            ctx.moveTo(r * (bx + 0.12), cy - r * 0.22);
            ctx.lineTo(r * bx, cy + r * 0.22);
            ctx.stroke();
        }
        // Rippling dinosaur dorsal finlets
        ctx.fillStyle = '#64748b';
        for (let fx = -0.85; fx <= 0.55; fx += 0.16) {
            const cy = getSpineY(fx);
            const finWave = Math.sin(fish.tailPhase - fx * 3) * (r * 0.06);
            ctx.beginPath();
            ctx.moveTo(r * fx, cy - r * 0.18);
            ctx.lineTo(r * (fx - 0.05), cy - r * 0.45 + finWave);
            ctx.lineTo(r * (fx + 0.05), cy - r * 0.18);
            ctx.closePath();
            ctx.fill();
        }
    } else if (patternId === 'pink_axolotl') {
        // Smiling Sakura Axolotl: Sakura blushing body + cheerful smiling mouth + 6 feathery external gills
        ctx.strokeStyle = '#e11d48';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(r * 0.72, getSpineY(0.72) + r * 0.06, r * 0.18, 0.2, Math.PI * 0.85);
        ctx.stroke();

        // 6 Branching feathered gills swaying in the current
        const gillSway = Math.sin(now * 0.005) * 4;
        ctx.fillStyle = '#f43f5e';
        [-1, 1].forEach(side => {
            for (let g = 0; g < 3; g++) {
                const gx = r * 0.2 - g * r * 0.12;
                const gy = side * (r * 0.42) + getSpineY(0.2) * 0.5;
                ctx.beginPath();
                ctx.ellipse(gx, gy + side * (g * 3 + gillSway * 0.4), r * 0.24, r * 0.08, side * (0.4 + g * 0.2), 0, Math.PI * 2);
                ctx.fill();
            }
        });
    } else if (patternId === 'glass_catfish') {
        // Phantom Glass Catfish: Segmented flexing spinal cord, chevron ribs, & beating organ sac
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.lineWidth = Math.max(2.0, r * 0.08);
        ctx.beginPath();
        ctx.moveTo(r * 0.65, getSpineY(0.65));
        for (let sx = 0.6; sx >= -1.05; sx -= 0.1) {
            ctx.lineTo(r * sx, getSpineY(sx));
        }
        ctx.stroke();

        // Chevron rib needles
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 0.9;
        for (let sx = -0.9; sx <= 0.45; sx += 0.11) {
            const cy = getSpineY(sx);
            ctx.beginPath();
            ctx.moveTo(r * sx, cy);
            ctx.lineTo(r * (sx - 0.06), cy - r * 0.18);
            ctx.moveTo(r * sx, cy);
            ctx.lineTo(r * (sx - 0.06), cy + r * 0.18);
            ctx.stroke();
        }

        // Beating translucent crimson heart sac
        const heartPulse = 1.0 + Math.sin(now * 0.012) * 0.25;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.ellipse(r * 0.45, getSpineY(0.45) + r * 0.06, r * 0.13 * heartPulse, r * 0.16 * heartPulse, 0, 0, Math.PI * 2);
        ctx.fill();

        // Sensory whiskered barbels
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(r * 0.95, getSpineY(0.95) + r * 0.04);
        ctx.quadraticCurveTo(r * 1.35, getSpineY(0.95) - r * 0.15, r * 1.6, getSpineY(0.95) - r * 0.1 + Math.sin(now * 0.007) * 3);
        ctx.stroke();
    } else if (patternId === 'peacock_gudgeon') {
        // Peacock Gudgeon: Cobalt flanks with tiger bars & gold-rimmed peacock tail eye-spot
        ctx.fillStyle = '#ea580c';
        for (let gx = -0.7; gx <= 0.6; gx += 0.22) {
            const cy = getSpineY(gx);
            ctx.beginPath();
            ctx.ellipse(r * gx, cy, r * 0.04, r * 0.35, 0.1, 0, Math.PI * 2);
            ctx.fill();
        }
        // Black peacock eye-spot rimmed in gold
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(-r * 0.85, peduncleY - r * 0.08, r * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(-r * 0.85, peduncleY - r * 0.08, r * 0.07, 0, Math.PI * 2);
        ctx.fill();
    } else if (patternId === 'marbled_hatchetfish') {
        // Silver Marbled Hatchetfish: Triangular silver keel belly with jagged lightning marble bars
        ctx.fillStyle = '#f1f5f9';
        ctx.beginPath();
        ctx.moveTo(r * 0.9, getSpineY(0.9) - r * 0.1);
        ctx.quadraticCurveTo(-r * 0.1, midSpineY + r * 1.15, -r * 0.8, peduncleY - r * 0.1);
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.8;
        for (let bx = -0.5; bx <= 0.5; bx += 0.26) {
            const cy = getSpineY(bx);
            ctx.beginPath();
            ctx.moveTo(r * bx, cy - r * 0.05);
            ctx.lineTo(r * (bx - 0.12), cy + r * 0.65);
            ctx.stroke();
        }
    } else if (patternId === 'kuhli_loach') {
        // Kuhli Loach: Serpentine espresso saddle bands wrapping smoothly along the eel body
        ctx.fillStyle = '#451a03';
        for (let kx = -0.92; kx <= 0.82; kx += 0.26) {
            const cy = getSpineY(kx);
            ctx.beginPath();
            ctx.ellipse(r * kx, cy - r * 0.05, r * 0.08, r * 0.26, 0.15, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (patternId === 'pleco') {
        // Pleco / Bristlenose: Armored scutes and leopard spots conforming to spine
        ctx.fillStyle = '#0f172a';
        for (let px = -0.8; px <= 0.75; px += 0.28) {
            const cy = getSpineY(px);
            ctx.beginPath();
            ctx.ellipse(r * px, cy - r * 0.1, r * 0.08, r * 0.38, 0.25, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (patternId === 'mandarin_fish') {
        // Synchiropus Mandarin Fish: Psychedelic labyrinth ribbons conforming to body contours
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(-r * 0.2, getSpineY(-0.2), r * 0.32, 0, Math.PI * 1.5);
        ctx.arc(r * 0.35, getSpineY(0.35) - r * 0.1, r * 0.25, 0.5, Math.PI * 1.8);
        ctx.stroke();
        ctx.strokeStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(-r * 0.5, getSpineY(-0.5) - r * 0.15, r * 0.2, 0, Math.PI * 2);
        ctx.arc(0, midSpineY + r * 0.2, r * 0.18, 0, Math.PI * 2);
        ctx.stroke();
    } else if (patternId === 'dragon_seahorse') {
        // Leafy Seadragon: Translucent leafy camouflage appendages swaying with current
        ctx.fillStyle = '#10b981';
        [-0.4, 0.1, 0.6].forEach(lx => {
            const cy = getSpineY(lx);
            ctx.beginPath();
            ctx.ellipse(r * lx, cy - r * 0.42, r * 0.2, r * 0.08, 0.5, 0, Math.PI * 2);
            ctx.ellipse(r * (lx - 0.1), cy + r * 0.38, r * 0.18, r * 0.08, -0.5, 0, Math.PI * 2);
            ctx.fill();
        });
    } else if (patternId === 'pea_puffer') {
        // Spotted Dwarf Pea Puffer: Irregular dark peacock-emerald circular target spots
        ctx.fillStyle = '#064e3b';
        const puffSpots = [
            { x: -0.3, y: -0.32, rad: 0.14 },
            { x: 0.15, y: -0.36, rad: 0.12 },
            { x: -0.48, y: -0.08, rad: 0.11 },
            { x: 0.32, y: -0.12, rad: 0.15 },
            { x: -0.1, y: 0.16, rad: 0.1 }
        ];
        puffSpots.forEach(s => {
            const cy = getSpineY(s.x);
            ctx.beginPath();
            ctx.arc(r * s.x, cy + r * s.y, r * s.rad, 0, Math.PI * 2);
            ctx.fill();
        });
    } else if (patternId === 'boesemani_rainbow') {
        // Boesemani Rainbowfish: Vertical iridescent sheen striations bending with spine curvature
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
        ctx.lineWidth = 1.3;
        for (let rx = -0.8; rx <= 0.8; rx += 0.2) {
            const cy = getSpineY(rx);
            ctx.beginPath();
            ctx.moveTo(r * rx, cy - r * 0.45);
            ctx.lineTo(r * rx, cy + r * 0.45);
            ctx.stroke();
        }
    } else if (patternId === 'amazon_leaf_fish') {
        // Amazon Leaf Fish: Sinuous leaf vein following spine wave with branching lateral veins
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(r * 0.9, getSpineY(0.9));
        for (let lx = 0.8; lx >= -0.9; lx -= 0.1) {
            ctx.lineTo(r * lx, getSpineY(lx));
        }
        ctx.stroke();
        for (let lx = -0.6; lx <= 0.6; lx += 0.3) {
            const cy = getSpineY(lx);
            ctx.beginPath();
            ctx.moveTo(r * lx, cy);
            ctx.lineTo(r * (lx + 0.15), cy - r * 0.42);
            ctx.moveTo(r * lx, cy);
            ctx.lineTo(r * (lx + 0.15), cy + r * 0.42);
            ctx.stroke();
        }
    } else if (patternId === 'elephantnose_fish') {
        // Peter's Elephantnose Fish: Sensory chin proboscis + white electric organ bands
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = r * 0.18;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(r * 0.95, snoutY + r * 0.15);
        ctx.quadraticCurveTo(r * 1.25, snoutY + r * 0.4, r * 1.15, snoutY + r * 0.75);
        ctx.stroke();
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-r * 0.75, peduncleY - r * 0.3);
        ctx.lineTo(-r * 0.75, peduncleY + r * 0.3);
        ctx.moveTo(-r * 0.92, peduncleY - r * 0.25);
        ctx.lineTo(-r * 0.92, peduncleY + r * 0.25);
        ctx.stroke();
    } else if (patternId === 'african_butterfly') {
        // Pantodon African Butterflyfish: Lace wing pectoral fins
        ctx.fillStyle = 'rgba(254, 243, 199, 0.48)';
        ctx.strokeStyle = '#a16207';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(0, midSpineY - r * 0.2);
        ctx.quadraticCurveTo(r * 0.6, midSpineY - r * 1.15, -r * 0.6, midSpineY - r * 1.25);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    } else if (patternId === 'hillstream_loach') {
        // Borneo Hillstream Loach: Honeycomb spots on aerodynamic wings
        ctx.fillStyle = '#fef08a';
        for (let hx = -0.7; hx <= 0.7; hx += 0.25) {
            const cy = getSpineY(hx);
            for (let hy = -0.38; hy <= 0.38; hy += 0.26) {
                ctx.beginPath();
                ctx.arc(r * hx, cy + r * hy, r * 0.08, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    } else if (patternId === 'betta') {
        ctx.strokeStyle = 'rgba(232, 121, 249, 0.55)';
        ctx.lineWidth = 0.9;
        for (let sx = -r * 0.75; sx < r * 0.55; sx += r * 0.24) {
            const cy = getSpineY(sx / r);
            ctx.beginPath();
            ctx.arc(sx, cy - r * 0.05, r * 0.14, -0.9, 0.9);
            ctx.stroke();
        }
    }

    // Custom Hybrid Chimera Color Tint Overlay when crossbred from 2 different species
    if (fish.hybridTraits && fish.hybridTraits.isHybrid) {
        ctx.save();
        ctx.globalAlpha = 0.38;
        const hybGrad = ctx.createLinearGradient(-r, -r * 0.6, r, r * 0.6);
        hybGrad.addColorStop(0, fish.hybridTraits.primaryColor);
        hybGrad.addColorStop(1, fish.hybridTraits.secondaryColor);
        ctx.fillStyle = hybGrad;
        ctx.beginPath();
        ctx.rect(-r * 1.4, -r * 1.2, r * 2.8, r * 2.4);
        ctx.fill();
        ctx.restore();
    }

        // Top 3D Specular Dorsal Gloss Highlight that organically bends with the spine
        ctx.fillStyle = getCachedGlossGrad(r);
        ctx.beginPath();
        ctx.moveTo(r * 0.85, snoutY - r * 0.15);
        ctx.quadraticCurveTo(0, midSpineY - r * 0.62, -r * 0.85, peduncleY - r * 0.22);
        ctx.lineTo(-r * 0.85, peduncleY);
        ctx.quadraticCurveTo(0, midSpineY - r * 0.08, r * 0.85, snoutY);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // 5. BREATHING GILL OPERCULUM & FLUTTERING PECTORAL FIN
    const gillBreath = Math.sin(now * 0.006 + fish.finPhase) * 1.2;
    const gillCy = getSpineY(0.42);
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.lineWidth = Math.max(1.2, r * 0.06);
    ctx.beginPath();
    ctx.arc(r * 0.42 + gillBreath * 0.3, gillCy - r * 0.02, r * 0.28, 2.3, 4.0);
    ctx.stroke();

    const pecFlap = Math.sin(fish.finPhase * 1.6) * 0.32;
    ctx.save();
    ctx.translate(r * 0.18, getSpineY(0.18) + r * 0.16);
    ctx.rotate(pecFlap);
    const pecGrad = ctx.createLinearGradient(0, 0, -r * 0.3, r * 0.15);
    pecGrad.addColorStop(0, spec.finColor || '#38bdf8');
    pecGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.42)');
    pecGrad.addColorStop(1, 'rgba(255, 255, 255, 0.08)');
    ctx.fillStyle = pecGrad;
    ctx.beginPath();
    ctx.ellipse(-r * 0.16, r * 0.08, r * 0.26, r * 0.13, 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-r * 0.28, r * 0.08);
    ctx.moveTo(0, 0);
    ctx.lineTo(-r * 0.24, r * 0.16);
    ctx.stroke();
    ctx.restore();

    // 6. EXPRESSIVE MULTI-LAYERED JEWEL EYE
    const eyeX = spec.bodyShape === 'arowana' ? r * 0.98 : r * 0.64;
    const eyeY = getSpineY(spec.bodyShape === 'arowana' ? 0.98 : 0.64) - r * 0.12;
    const eyeR = Math.max(2.2, r * 0.15);

    // Sclera / Iris Ring
    ctx.fillStyle = spec.id === 'angelfish' ? '#ef4444' : (fish.morph === 'cosmic' ? '#38bdf8' : '#fef08a');
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, eyeR, 0, Math.PI * 2);
    ctx.fill();

    // Fine dark limbal ring
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 0.75;
    ctx.stroke();

    // Deep Obsidian Pupil with lens depth
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.arc(eyeX + eyeR * 0.12, eyeY, eyeR * 0.62, 0, Math.PI * 2);
    ctx.fill();

    // Dual Corneal Glints (Primary crisp glint + secondary ambient reflection)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(eyeX + eyeR * 0.28, eyeY - eyeR * 0.26, eyeR * 0.26, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eyeX - eyeR * 0.15, eyeY + eyeR * 0.22, eyeR * 0.12, 0, Math.PI * 2);
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