let cachedBgGrad = null;
let cachedSandGrad = null;
let cachedRayGrad = null;
let cachedThemeKey = '';
let cachedSandKey = '';
let cachedRayKey = '';

function invalidateBgGradients() {
    cachedBgGrad = null;
    cachedSandGrad = null;
    cachedRayGrad = null;
    cachedThemeKey = '';
    cachedSandKey = '';
    cachedRayKey = '';
    if (typeof updateThreeEnvironment === 'function') {
        updateThreeEnvironment();
    }
}

function drawWaterBackground(now) {
    const biome = (typeof BIOMES_CATALOG !== 'undefined' && BIOMES_CATALOG.find(b => b.id === state.currentBiome)) || (typeof BIOMES_CATALOG !== 'undefined' ? BIOMES_CATALOG[0] : null);
    const baseTheme = (typeof LIGHT_THEMES !== 'undefined') ? LIGHT_THEMES[state.lightThemeIndex || 0] : null;

    let topGrad = biome ? biome.topGrad : '#062820';
    let midGrad = biome ? biome.midGrad : '#041c19';
    let botGrad = biome ? biome.botGrad : '#020e0d';
    let rayColor = biome ? biome.causticColor : 'rgba(125, 211, 252, 0.08)';
    let isNeonTheme = (baseTheme && (baseTheme.id === 'bioluminescent' || baseTheme.id === 'moonlight')) || (biome && biome.id === 'cyber_trench');

    // Environmental Event Atmospheric Overrides
    if (activeTankEvent) {
        if (activeTankEvent.id === 'golden_hour') {
            topGrad = '#78350f';
            midGrad = '#b45309';
            botGrad = '#1e1b4b';
            rayColor = 'rgba(251, 191, 36, 0.24)';
        } else if (activeTankEvent.id === 'bioluminescent_night') {
            topGrad = '#020617';
            midGrad = '#0f172a';
            botGrad = '#1e1b4b';
            rayColor = 'rgba(192, 132, 252, 0.26)';
            isNeonTheme = true;
        } else if (activeTankEvent.id === 'algae_bloom') {
            topGrad = '#064e3b';
            midGrad = '#047857';
            botGrad = '#022c22';
            rayColor = 'rgba(52, 211, 153, 0.20)';
        }
    }

    const currentKey = `${topGrad}_${midGrad}_${botGrad}_${ch}_${cw}`;
    if (!cachedBgGrad || cachedThemeKey !== currentKey) {
        cachedBgGrad = ctx.createLinearGradient(0, 0, 0, ch);
        cachedBgGrad.addColorStop(0, topGrad);
        cachedBgGrad.addColorStop(0.55, midGrad);
        cachedBgGrad.addColorStop(1, botGrad);
        cachedThemeKey = currentKey;
    }

    // 1. Deep Water Atmospheric Gradient
    ctx.fillStyle = cachedBgGrad;
    ctx.fillRect(0, 0, cw, ch);

    // 2. Multi-Layer Parallax Distant Silhouettes (Horizon & Biome Hardscape)
    const parallaxOffset = mousePos.active ? (mousePos.x - cw * 0.5) * 0.035 : 0;
    const style = biome ? biome.silhouetteStyle : 'roots';

    ctx.save();
    if (style === 'roots') {
        // Amazon: Deep submerged mangrove & peat roots
        ctx.fillStyle = 'rgba(1, 15, 12, 0.42)';
        ctx.beginPath();
        ctx.moveTo(0, substrateY);
        for (let x = 0; x <= cw; x += 60) {
            const h = 55 + Math.sin((x + parallaxOffset) * 0.007) * 32 + Math.cos((x + parallaxOffset) * 0.018) * 16;
            ctx.lineTo(x, substrateY - h);
        }
        ctx.lineTo(cw, substrateY);
        ctx.closePath();
        ctx.fill();

        // Gnarled roots silhouettes
        ctx.strokeStyle = 'rgba(2, 20, 16, 0.35)';
        ctx.lineWidth = 6;
        for (let rx = 70; rx < cw; rx += 210) {
            const px = rx + parallaxOffset * 0.6;
            ctx.beginPath();
            ctx.moveTo(px, 70);
            ctx.quadraticCurveTo(px + 35, substrateY * 0.5, px - 20, substrateY);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(px + 20, substrateY * 0.4);
            ctx.quadraticCurveTo(px + 65, substrateY * 0.7, px + 40, substrateY);
            ctx.stroke();
        }
    } else if (style === 'coral_mountains') {
        // Coral Reef: Distant ocean coral arches and reef silhouette
        ctx.fillStyle = 'rgba(2, 44, 75, 0.38)';
        ctx.beginPath();
        ctx.moveTo(0, substrateY);
        for (let x = 0; x <= cw; x += 50) {
            const h = 75 + Math.sin((x + parallaxOffset) * 0.012) * 45 + Math.sin((x + parallaxOffset) * 0.025) * 22;
            ctx.lineTo(x, substrateY - h);
        }
        ctx.lineTo(cw, substrateY);
        ctx.closePath();
        ctx.fill();

        // Distant oceanic arch
        ctx.beginPath();
        const archX = cw * 0.68 + parallaxOffset * 0.5;
        ctx.ellipse(archX, substrateY - 45, 55, 65, 0, Math.PI, 0);
        ctx.lineWidth = 14;
        ctx.strokeStyle = 'rgba(2, 44, 75, 0.4)';
        ctx.stroke();
    } else if (style === 'atlantis_pillars') {
        // Atlantis: Sunken ancient temple columns & collapsed pediments
        ctx.fillStyle = 'rgba(8, 7, 26, 0.52)';
        ctx.beginPath();
        ctx.moveTo(0, substrateY);
        for (let x = 0; x <= cw; x += 80) {
            const h = 40 + Math.sin((x + parallaxOffset) * 0.006) * 20;
            ctx.lineTo(x, substrateY - h);
        }
        ctx.lineTo(cw, substrateY);
        ctx.closePath();
        ctx.fill();

        for (let px = 90; px < cw; px += 180) {
            const cx = px + parallaxOffset * 0.7;
            ctx.fillRect(cx - 9, substrateY - 110, 18, 110);
            ctx.fillRect(cx - 15, substrateY - 118, 30, 9);
            // Mystical glowing rune notch
            ctx.fillStyle = 'rgba(192, 132, 252, 0.35)';
            ctx.fillRect(cx - 2, substrateY - 70, 4, 18);
            ctx.fillStyle = 'rgba(8, 7, 26, 0.52)';
        }
    } else {
        // Cyber Trench: Thermal chimney spires with cyan/purple bioluminescent vents
        ctx.fillStyle = 'rgba(2, 4, 18, 0.58)';
        ctx.beginPath();
        ctx.moveTo(0, substrateY);
        for (let x = 0; x <= cw; x += 70) {
            const h = 50 + Math.sin((x + parallaxOffset) * 0.015) * 35;
            ctx.lineTo(x, substrateY - h);
        }
        ctx.lineTo(cw, substrateY);
        ctx.closePath();
        ctx.fill();

        for (let sx = 120; sx < cw; sx += 240) {
            const px = sx + parallaxOffset * 0.8;
            ctx.beginPath();
            ctx.moveTo(px - 14, substrateY);
            ctx.lineTo(px - 6, substrateY - 130);
            ctx.lineTo(px + 6, substrateY - 130);
            ctx.lineTo(px + 14, substrateY);
            ctx.closePath();
            ctx.fill();

            // Vent plume glow
            const ventPulse = 0.5 + Math.sin(now * 0.005 + sx) * 0.3;
            ctx.fillStyle = `rgba(34, 211, 238, ${0.35 * ventPulse})`;
            ctx.beginPath();
            ctx.arc(px, substrateY - 134, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(2, 4, 18, 0.58)';
        }
    }
    ctx.restore();

    // 3. Animated Volumetric Sun/Moon Caustic Light Rays
    ctx.save();
    const rayKey = `${rayColor}_${substrateY}`;
    if (!cachedRayGrad || cachedRayKey !== rayKey) {
        cachedRayGrad = ctx.createLinearGradient(0, 65, 0, substrateY);
        cachedRayGrad.addColorStop(0, rayColor);
        cachedRayGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        cachedRayKey = rayKey;
    }
    ctx.fillStyle = cachedRayGrad;
    for (let i = 0; i < 5; i++) {
        const rayX = (cw / 4.5) * i + Math.sin(now * 0.0005 + i) * 65;
        const rayW = 90 + Math.sin(now * 0.0009 + i * 1.7) * 35;
        ctx.beginPath();
        ctx.moveTo(rayX - rayW * 0.35, 72);
        ctx.lineTo(rayX + rayW * 0.35, 72);
        ctx.lineTo(rayX + rayW * 1.2 - 85, substrateY);
        ctx.lineTo(rayX - rayW * 1.2 - 85, substrateY);
        ctx.closePath();
        ctx.fill();
    }

    // 4. Procedural High-Fidelity 3D Caustic Network across Water Column & Substrate
    ctx.save();
    const causticBaseColor = biome ? biome.causticColor : 'rgba(255, 255, 255, 0.14)';
    ctx.strokeStyle = causticBaseColor;
    ctx.lineWidth = 1.4;

    // Multi-frequency undulating caustic ribbons intersecting diagonally
    for (let layer = 0; layer < 4; layer++) {
        const yBase = substrateY - 110 + layer * 28;
        const waveSpeed = now * 0.0016 * (layer % 2 === 0 ? 1 : -1.2);
        const freq = 0.018 + layer * 0.005;
        ctx.beginPath();
        for (let x = 0; x <= cw; x += 48) {
            const dy = Math.sin(x * freq + waveSpeed) * 7 + Math.cos(x * (freq * 1.8) - waveSpeed * 0.8) * 4.5;
            if (x === 0) ctx.moveTo(x, yBase + dy);
            else ctx.lineTo(x, yBase + dy);
        }
        ctx.stroke();
    }

    // Secondary diagonal caustic nodes (Sunlight refraction web)
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = causticBaseColor;
    for (let cx = 60; cx < cw; cx += 160) {
        for (let cy = substrateY - 120; cy < substrateY; cy += 55) {
            const shiftX = Math.sin(now * 0.002 + cy * 0.02) * 16;
            const shiftY = Math.cos(now * 0.0025 + cx * 0.02) * 8;
            ctx.beginPath();
            ctx.ellipse(cx + shiftX, cy + shiftY, 22, 9, 0.35, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore();

    // 5. Interactive Cursor Underwater Spotlight
    if (mousePos.active) {
        ctx.save();
        const spotGrad = ctx.createRadialGradient(mousePos.x, mousePos.y, 10, mousePos.x, mousePos.y, 195);
        spotGrad.addColorStop(0, isNeonTheme ? 'rgba(56, 189, 248, 0.14)' : 'rgba(255, 255, 255, 0.08)');
        spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = spotGrad;
        ctx.beginPath();
        ctx.arc(mousePos.x, mousePos.y, 195, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // 6. Water Surface Waves & Dual Shimmer Ribbons
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 78);
    for (let x = 0; x <= cw; x += 35) {
        const y = 78 + Math.sin(x * 0.016 + now * 0.0028) * 4.5 + Math.cos(x * 0.035 - now * 0.0018) * 2;
        ctx.lineTo(x, y);
    }
    ctx.lineTo(cw, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fillStyle = isNeonTheme ? 'rgba(14, 165, 233, 0.18)' : 'rgba(56, 189, 248, 0.13)';
    ctx.fill();

    ctx.beginPath();
    for (let x = 0; x <= cw; x += 35) {
        const y = 80 + Math.sin(x * 0.014 + now * 0.0022 + 1.2) * 3;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = isNeonTheme ? 'rgba(56, 189, 248, 0.48)' : 'rgba(255, 255, 255, 0.38)';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();
}

function drawSubstrate(now) {
    if (!sandMounds.length) return;
    const biome = (typeof BIOMES_CATALOG !== 'undefined' && BIOMES_CATALOG.find(b => b.id === state.currentBiome)) || (typeof BIOMES_CATALOG !== 'undefined' ? BIOMES_CATALOG[0] : null);
    const sandColors = biome ? biome.sandColors : ['#c29b61', '#96713c', '#422c15'];
    const sandRim = biome ? biome.sandRim : 'rgba(254, 243, 199, 0.25)';

    const currentKey = `${sandColors.join('_')}_${ch}_${cw}`;
    if (!cachedSandGrad || cachedSandKey !== currentKey) {
        cachedSandGrad = ctx.createLinearGradient(0, substrateY - 15, 0, ch);
        cachedSandGrad.addColorStop(0, sandColors[0]);
        cachedSandGrad.addColorStop(0.35, sandColors[1]);
        cachedSandGrad.addColorStop(1, sandColors[2]);
        cachedSandKey = currentKey;
    }

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, ch);
    sandMounds.forEach(pt => ctx.lineTo(pt.x, pt.y));
    ctx.lineTo(cw, ch);
    ctx.closePath();
    ctx.fillStyle = cachedSandGrad;
    ctx.fill();

    // Subtle Substrate Sand Texture Specks (Deterministic pseudo-random pebbles)
    ctx.fillStyle = sandColors[2];
    for (let i = 0; i < sandMounds.length; i += 2) {
        const pt = sandMounds[i];
        ctx.beginPath();
        ctx.arc(pt.x + 8, pt.y + 12, 1.8, 0, Math.PI * 2);
        ctx.arc(pt.x - 12, pt.y + 24, 1.4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Shimmering sand crest wave
    ctx.strokeStyle = sandRim;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    sandMounds.forEach((pt, idx) => {
        const wave = Math.sin(idx * 0.9 + now * 0.003) * 1.5;
        if (idx === 0) ctx.moveTo(pt.x, pt.y + wave);
        else ctx.lineTo(pt.x, pt.y + wave);
    });
    ctx.stroke();
    ctx.restore();
}