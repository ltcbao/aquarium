function spawnWakeRing(x, y, vx, vy, radius, color) {
    if (wakeRings.length > 24) return;
    wakeRings.push({
        x,
        y,
        vx: -vx * 0.25,
        vy: -vy * 0.25,
        r: Math.max(2, radius * 0.22),
        maxR: radius * 0.9,
        alpha: 0.38,
        color: color || 'rgba(186, 230, 253, 0.5)',
        angle: Math.atan2(vy, vx)
    });
}

function spawnParticleBurst(x, y, color = '#38bdf8', count = 12, style = 'sparkle') {
    const actualCount = Math.min(count, 14);
    if (fxSparks.length > 60) fxSparks.splice(0, actualCount);
    for (let i = 0; i < actualCount; i++) {
        const angle = (Math.PI * 2 * i) / actualCount + (Math.random() - 0.5) * 0.5;
        const speed = 1.2 + Math.random() * 3.4;
        fxSparks.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.5,
            r: 2 + Math.random() * 3,
            color,
            alpha: 1.0,
            style
        });
    }
}

function triggerGlassTap(x, y) {
    for (let i = 0; i < 3; i++) {
        waterRipples.push({ x, y, r: 6 + i * 16, alpha: 0.9 - i * 0.2, color: '#38bdf8' });
    }
    spawnParticleBurst(x, y, '#7dd3fc', 16, 'sparkle');
    playSound('clean');
    // Curious fish turn and dart toward or react to the glass tap
    state.fish.forEach(f => {
        if (f.stage === 'egg') return;
        const angle = Math.atan2(y - f.y, x - f.x);
        f.vx += Math.cos(angle) * 2.1;
        f.vy += Math.sin(angle) * 2.1;
        f.targetX = x + (Math.random() - 0.5) * 140;
        f.targetY = Math.max(100, Math.min(substrateY - 40, y + (Math.random() - 0.5) * 120));
    });
    addFloatingText(x, y - 22, '🔔 Glass Tap!', '#7dd3fc');
}

function togglePhotoMode() {
    photoMode = !photoMode;
    const header = document.querySelector('header');
    const nav = document.querySelector('nav');
    const sub = document.getElementById('sub-toolbar');
    if (photoMode) {
        header.style.opacity = '0.12';
        nav.style.opacity = '0.12';
        sub.style.opacity = '0';
        closeDrawer();
        closeInspector();
        showToast('📸 Cinematic View Enabled! Click the camera icon again to restore full HUD.', 'cyan');
    } else {
        header.style.opacity = '1';
        nav.style.opacity = '1';
        sub.style.opacity = '1';
    }
}

function spawnGrowthShockwave(x, y, color = '#fbbf24', stage = 'adult') {
    if (growthShockwaves.length > 8) growthShockwaves.shift();
    const maxR = stage === 'adult' ? 120 : (stage === 'juvenile' ? 85 : 55);
    growthShockwaves.push({
        x,
        y,
        r: 8,
        maxR: maxR,
        color: color || '#fbbf24',
        alpha: 1.0,
        stage: stage,
        createdAt: performance.now(),
        duration: 1600
    });
    // Multi-angle sparkle burst
    const count = stage === 'adult' ? 24 : 16;
    for (let i = 0; i < count; i++) {
        const ang = (Math.PI * 2 * i) / count;
        const spd = 1.2 + Math.random() * 3.0;
        fxSparks.push({
            x,
            y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd - 0.8,
            r: 2.2 + Math.random() * 2.8,
            color,
            alpha: 1.0,
            style: 'sparkle'
        });
    }
}

function drawGrowthShockwaves(now) {
    if (!growthShockwaves || !growthShockwaves.length) return;
    ctx.save();
    for (let i = growthShockwaves.length - 1; i >= 0; i--) {
        const sw = growthShockwaves[i];
        const elapsed = now - sw.createdAt;
        const progress = Math.min(1.0, elapsed / sw.duration);
        if (progress >= 1.0) {
            growthShockwaves.splice(i, 1);
            continue;
        }

        const easeOut = 1 - Math.pow(1 - progress, 3);
        const curR = sw.r + (sw.maxR - sw.r) * easeOut;
        const alpha = (1.0 - progress) * 0.85;

        // 1. Expanding Glow Ring
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = Math.max(1, 4 * (1 - progress));
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, curR, 0, Math.PI * 2);
        ctx.stroke();

        // 2. Secondary Inner Shimmer Ring
        ctx.strokeStyle = '#ffffff';
        ctx.globalAlpha = alpha * 0.7;
        ctx.lineWidth = Math.max(1, 2 * (1 - progress));
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, Math.max(2, curR * 0.7), 0, Math.PI * 2);
        ctx.stroke();

        // 3. Ascending Divine Light Beams / Sunburst Spikes
        const spikeCount = sw.stage === 'adult' ? 8 : 6;
        ctx.globalAlpha = alpha * 0.45;
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = 1.5;
        for (let s = 0; s < spikeCount; s++) {
            const sang = (Math.PI * 2 * s) / spikeCount + elapsed * 0.002;
            const innerR = curR * 0.3;
            const outerR = curR * 1.35;
            ctx.beginPath();
            ctx.moveTo(sw.x + Math.cos(sang) * innerR, sw.y + Math.sin(sang) * innerR);
            ctx.lineTo(sw.x + Math.cos(sang) * outerR, sw.y + Math.sin(sang) * outerR);
            ctx.stroke();
        }
    }
    ctx.restore();
}
