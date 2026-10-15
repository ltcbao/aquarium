const decorGradCache = new Map();

function getCachedDecorGrad(key, createFn) {
    let grad = decorGradCache.get(key);
    if (!grad) {
        grad = createFn();
        decorGradCache.set(key, grad);
    }
    return grad;
}

function drawDecorations(now, layer = 'all') {
    if (!Array.isArray(state.decorations)) return;

    state.decorations.forEach(d => {
        const x = d.xRatio * cw;
        const floorY = getSubstrateHeightAt(x) + 6;
        const baseY = d.yRatio !== undefined ? (d.yRatio * ch) : floorY;

        // Depth calculation: items placed higher up or with negative zDepth are in background
        const isNearFloor = (floorY - baseY) < 35;
        const z = d.zDepth !== undefined ? d.zDepth : (isNearFloor ? 0.15 : -0.55);

        // Multi-layer split if layer is 'back' or 'front'
        if (layer === 'back' && z >= -0.1) return;
        if (layer === 'front' && z < -0.1) return;

        const cat = DECOR_CATALOG.find(c => c.id === d.id);
        const isPlant = cat && cat.isPlant;
        const growthRatio = isPlant ? Math.max(0.35, (d.growth || 100) / 100) : 1.0;
        const isFlowering = isPlant && ((d.growth || 0) >= 95 || d.stage === 'flowering');

        // Scale & Parallax based on depth z
        const depthScale = Math.max(0.60, Math.min(1.22, 1.0 + z * 0.38));
        const parallaxX = mousePos.active ? (mousePos.x - cw * 0.5) * (z * 0.035) : 0;

        // Hydrodynamic deflection: plants yield and bend softly when fish swim past!
        let fishDeflect = 0;
        if (isPlant && state.fish) {
            const checkY = baseY - 65 * depthScale;
            for (let i = 0; i < state.fish.length; i++) {
                const f = state.fish[i];
                if (f.stage === 'egg') continue;
                const dx = f.x - (x + parallaxX);
                if (dx > 45 || dx < -45) continue;
                const dy = f.y - checkY;
                if (dy > 85 || dy < -85) continue;
                fishDeflect += (dx > 0 ? -1 : 1) * Math.min(7.5, Math.abs(f.vx || 1) * 3.5);
            }
        }

        const sway = Math.sin(now * 0.002 + d.xRatio * 10) * (6 * depthScale) + fishDeflect;

        ctx.save();
        ctx.translate(x + parallaxX, baseY);
        ctx.scale(depthScale, depthScale);

        // Atmospheric perspective haze for background decor (creates rich underwater depth)
        if (z < -0.1) {
            ctx.globalAlpha = Math.max(0.68, 1.0 + z * 0.36);
        }

        // Decorate / Drag Mode selection box & Depth Layer Indicators
        if (currentMode === 'decorate') {
            const isDragging = (typeof draggingDecor !== 'undefined') && draggingDecor === d;
            ctx.strokeStyle = isDragging ? '#38bdf8' : (z < -0.2 ? 'rgba(56, 189, 248, 0.75)' : 'rgba(16, 185, 129, 0.6)');
            ctx.lineWidth = isDragging ? 2.2 : 1.5;
            ctx.setLineDash([4, 4]);
            ctx.strokeRect(-45, -120, 90, 120);
            ctx.setLineDash([]);

            // Depth layer badge indicator
            ctx.save();
            ctx.font = '600 11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = isDragging ? '#38bdf8' : (z < -0.2 ? '#7dd3fc' : '#a7f3d0');
            const depthLabel = z < -0.2 ? '🏞️ Hậu cảnh' : (z < 0.1 ? '🌿 Trung cảnh' : '🪨 Tiền cảnh');
            ctx.fillText(depthLabel, 0, -126);
            ctx.restore();
        }

        // Garden Care Mode Interactive Rings & Indicators
        if (currentMode === 'garden' && isPlant) {
            const isReadyToPrune = (d.growth || 0) >= 85;
            const isSelected = selectedPlantUid === d.uid;

            ctx.strokeStyle = isReadyToPrune ? 'rgba(250, 204, 21, 0.85)' : 'rgba(52, 211, 153, 0.75)';
            ctx.lineWidth = isSelected ? 2.5 : 1.5;
            if (isSelected) ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.arc(0, -60 * growthRatio, 38 * growthRatio + 15, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // Status Badge
            ctx.save();
            ctx.font = '700 11px Inter, sans-serif';
            ctx.textAlign = 'center';
            if (isReadyToPrune) {
                const bounce = Math.sin(now * 0.008) * 3;
                ctx.fillStyle = '#fef08a';
                ctx.fillText(`✂️ Prune (+${cat.pruneReward || 25}🪙)`, 0, -115 * growthRatio + bounce);
            } else {
                ctx.fillStyle = '#6ee7b7';
                ctx.fillText(`🌱 ${Math.floor(d.growth || 0)}%`, 0, -100 * growthRatio);
            }
            ctx.restore();
        }

        // ================= PLANT & HARDSCAPE RENDERERS =================
        if (d.id === 'amazon_sword') {
            const leaves = [-24, -12, 0, 12, 24];
            leaves.forEach((angleOffset, i) => {
                ctx.fillStyle = i % 2 === 0 ? '#059669' : '#10b981';
                ctx.beginPath();
                ctx.moveTo(0, 0);
                const tipX = (angleOffset * 1.6 + sway * (0.6 + i * 0.12)) * growthRatio;
                const tipY = (-95 - (i === 2 ? 28 : (i % 2 === 0 ? 5 : 18))) * growthRatio;
                ctx.quadraticCurveTo(angleOffset * 1.8 * growthRatio, tipY * 0.5, tipX, tipY);
                ctx.quadraticCurveTo(angleOffset * 0.3 * growthRatio, tipY * 0.5, 0, 0);
                ctx.fill();
            });

            // Delicate White Blossom on top when flowering
            if (isFlowering) {
                const flowerY = -128 * growthRatio;
                const flowerX = sway * 0.8;
                ctx.fillStyle = '#ffffff';
                for (let p = 0; p < 5; p++) {
                    const ang = (p / 5) * Math.PI * 2 + now * 0.001;
                    ctx.beginPath();
                    ctx.ellipse(flowerX + Math.cos(ang) * 5, flowerY + Math.sin(ang) * 5, 4.5, 3, ang, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.fillStyle = '#facc15';
                ctx.beginPath();
                ctx.arc(flowerX, flowerY, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (d.id === 'red_ludwigia') {
            const stems = [-18, -5, 8, 20];
            stems.forEach((sx, idx) => {
                const topX = (sx + sway * 1.1) * growthRatio;
                const topY = (-110 - (idx % 2) * 22) * growthRatio;
                ctx.strokeStyle = '#9f1239';
                ctx.lineWidth = 2.5 * growthRatio;
                ctx.beginPath();
                ctx.moveTo(sx * growthRatio, 0);
                ctx.quadraticCurveTo(sx * growthRatio + sway * 0.5, topY * 0.5, topX, topY);
                ctx.stroke();

                for (let h = 20 * growthRatio; h < Math.abs(topY); h += 18 * growthRatio) {
                    const t = h / Math.abs(topY);
                    const lx = sx * growthRatio + sway * t;
                    const ly = -h;
                    ctx.fillStyle = idx % 2 === 0 ? '#e11d48' : '#fb7185';
                    ctx.beginPath();
                    ctx.ellipse(lx - 7 * growthRatio, ly, 7 * growthRatio, 3.5 * growthRatio, -0.4, 0, Math.PI * 2);
                    ctx.ellipse(lx + 7 * growthRatio, ly, 7 * growthRatio, 3.5 * growthRatio, 0.4, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Star Flower crown when flowering
                if (isFlowering) {
                    ctx.fillStyle = '#fde047';
                    ctx.beginPath();
                    ctx.arc(topX, topY - 3, 3.2, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        } else if (d.id === 'anubias_log') {
            // Sunken wood base
            ctx.fillStyle = '#5c3a21';
            ctx.strokeStyle = '#3b2313';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-55, 4);
            ctx.quadraticCurveTo(-15, -48, 52, -26);
            ctx.lineTo(46, -8);
            ctx.quadraticCurveTo(-5, -22, -35, 6);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Broad thick Anubias leaves
            [-22, -6, 12, 28].forEach((lx, i) => {
                ctx.fillStyle = i % 2 === 0 ? '#15803d' : '#22c55e';
                ctx.beginPath();
                ctx.ellipse((lx + sway * 0.25) * growthRatio, (-34 - (i % 2) * 8) * growthRatio, 12 * growthRatio, 6.5 * growthRatio, (i - 1.5) * 0.3, 0, Math.PI * 2);
                ctx.fill();
            });

            // White spathe flower
            if (isFlowering) {
                const fx = 4 * growthRatio + sway * 0.3;
                const fy = -55 * growthRatio;
                ctx.strokeStyle = '#22c55e';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, -25);
                ctx.lineTo(fx, fy);
                ctx.stroke();

                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.ellipse(fx, fy, 4, 9, 0.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fef08a';
                ctx.beginPath();
                ctx.arc(fx, fy, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (d.id === 'giant_kelp') {
            // Towering amber ocean kelp
            const kelpHeight = 220 * growthRatio;
            ctx.strokeStyle = '#854d0e';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(0, 0);

            // S-curve kelp spine
            const p1x = sway * 0.8;
            const p1y = -kelpHeight * 0.35;
            const p2x = -sway * 0.6;
            const p2y = -kelpHeight * 0.7;
            const topKelpX = sway * 1.3;
            const topKelpY = -kelpHeight;
            ctx.bezierCurveTo(p1x, p1y, p2x, p2y, topKelpX, topKelpY);
            ctx.stroke();

            // Gas bulbs & long undulating blades
            const bladeSteps = Math.floor(6 * growthRatio);
            for (let i = 1; i <= bladeSteps; i++) {
                const t = i / (bladeSteps + 1);
                const bx = (1 - t) * (1 - t) * 0 + 2 * (1 - t) * t * p1x + t * t * topKelpX;
                const by = -kelpHeight * t;
                const side = i % 2 === 0 ? 1 : -1;

                // Buoyancy Bulb
                ctx.fillStyle = '#eab308';
                ctx.beginPath();
                ctx.arc(bx, by, 3.8 * growthRatio, 0, Math.PI * 2);
                ctx.fill();

                // Long amber kelp leaf blade
                ctx.fillStyle = i % 2 === 0 ? '#ca8a04' : '#a16207';
                ctx.beginPath();
                ctx.moveTo(bx, by);
                const tipX = bx + side * (32 + Math.sin(now * 0.003 + i) * 6) * growthRatio;
                const tipY = by - 12 * growthRatio;
                ctx.quadraticCurveTo(bx + side * 15 * growthRatio, by + 6, tipX, tipY);
                ctx.quadraticCurveTo(bx + side * 18 * growthRatio, by - 6, bx, by);
                ctx.fill();
            }
        } else if (d.id === 'lotus_lily') {
            // Water Lily: Slender trailing stem rising from sand up toward surface
            const stemH = 175 * growthRatio;
            ctx.strokeStyle = '#15803d';
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            const midSway = sway * 0.7;
            ctx.quadraticCurveTo(midSway, -stemH * 0.5, midSway * 1.2, -stemH);
            ctx.stroke();

            // Floating Lilypad Pad
            const padX = midSway * 1.2;
            const padY = -stemH;
            ctx.fillStyle = '#16a34a';
            ctx.beginPath();
            ctx.ellipse(padX, padY, 26 * growthRatio, 7 * growthRatio, 0, 0.25, Math.PI * 1.85);
            ctx.lineTo(padX, padY);
            ctx.closePath();
            ctx.fill();

            // Radiant Blooming Lotus Blossom
            if (isFlowering) {
                const bloomPulse = 1 + Math.sin(now * 0.004) * 0.04;
                ctx.save();
                ctx.translate(padX + 5, padY - 5);
                ctx.scale(bloomPulse, bloomPulse);

                // Outer pink petals
                ctx.fillStyle = '#f472b6';
                for (let p = 0; p < 6; p++) {
                    const ang = (p / 6) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.ellipse(Math.cos(ang) * 9, Math.sin(ang) * 5, 8 * growthRatio, 4 * growthRatio, ang, 0, Math.PI * 2);
                    ctx.fill();
                }
                // Inner white petals
                ctx.fillStyle = '#fdf2f8';
                for (let p = 0; p < 5; p++) {
                    const ang = (p / 5) * Math.PI * 2 + 0.3;
                    ctx.beginPath();
                    ctx.ellipse(Math.cos(ang) * 5, Math.sin(ang) * 3, 5 * growthRatio, 3 * growthRatio, ang, 0, Math.PI * 2);
                    ctx.fill();
                }
                // Center yellow core
                ctx.fillStyle = '#facc15';
                ctx.beginPath();
                ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        } else if (d.id === 'neon_coral') {
            // Bioluminescent Anemone with pulsing tentacles
            const tentacleCount = 12;
            ctx.fillStyle = '#4c1d95';
            ctx.beginPath();
            ctx.ellipse(0, 0, 18 * growthRatio, 8 * growthRatio, 0, 0, Math.PI * 2);
            ctx.fill();

            for (let i = 0; i < tentacleCount; i++) {
                const angle = (i / tentacleCount) * Math.PI - Math.PI;
                const tentacleLen = (38 + Math.sin(now * 0.004 + i * 1.2) * 8) * growthRatio;
                const tx = Math.cos(angle) * (14 * growthRatio);
                const tipX = tx + Math.cos(angle) * tentacleLen + sway * 0.6;
                const tipY = Math.sin(angle) * tentacleLen;

                ctx.strokeStyle = i % 2 === 0 ? '#22d3ee' : '#e879f9';
                ctx.lineWidth = 2.2 * growthRatio;
                ctx.beginPath();
                ctx.moveTo(tx, -2);
                ctx.quadraticCurveTo(tx + sway * 0.3, tipY * 0.5, tipX, tipY);
                ctx.stroke();

                // Glowing bioluminescent tip
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(tipX, tipY, 2.2, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (d.id === 'marimo_moss') {
            // Japanese Marimo Moss Ball
            const mossR = 22 * growthRatio;
            const roll = Math.sin(now * 0.002 + d.xRatio * 5) * 0.25;
            ctx.save();
            ctx.rotate(roll);
            const mossGrad = ctx.createRadialGradient(-mossR * 0.3, -mossR * 0.3, 2, 0, 0, mossR);
            mossGrad.addColorStop(0, '#34d399');
            mossGrad.addColorStop(0.6, '#059669');
            mossGrad.addColorStop(1, '#064e3b');
            ctx.fillStyle = mossGrad;
            ctx.beginPath();
            ctx.arc(0, -mossR + 4, mossR, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([2, 3]);
            ctx.stroke();
            ctx.restore();
        } else if (d.id === 'weeping_moss') {
            // Weeping Moss Bonsai Tree
            ctx.fillStyle = '#451a03';
            ctx.beginPath();
            ctx.moveTo(-16, 4);
            ctx.quadraticCurveTo(-6, -45 * growthRatio, 8, -65 * growthRatio);
            ctx.lineTo(20, -65 * growthRatio);
            ctx.quadraticCurveTo(8, -35 * growthRatio, 18, 4);
            ctx.closePath();
            ctx.fill();

            const clusters = [[0, -65], [-24, -50], [28, -52], [-12, -40], [18, -42]];
            clusters.forEach(([cx, cy], i) => {
                const clusterSway = sway * (0.6 + i * 0.15);
                ctx.fillStyle = i % 2 === 0 ? '#10b981' : '#059669';
                ctx.beginPath();
                ctx.ellipse((cx + clusterSway) * growthRatio, cy * growthRatio, 16 * growthRatio, 11 * growthRatio, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = '#34d399';
                ctx.lineWidth = 1.6;
                for (let s = -2; s <= 2; s++) {
                    ctx.beginPath();
                    ctx.moveTo((cx + s * 4 + clusterSway) * growthRatio, cy * growthRatio);
                    ctx.lineTo((cx + s * 4 + clusterSway * 1.3) * growthRatio, (cy + 14 + Math.abs(s) * 4) * growthRatio);
                    ctx.stroke();
                }
            });
        } else if (d.id === 'java_fern') {
            // Java Fern cluster
            const fronds = [-22, -10, 2, 14, 25];
            fronds.forEach((angle, i) => {
                const fSway = sway * (0.7 + i * 0.1);
                const fH = (95 + (i % 2) * 18) * growthRatio;
                ctx.strokeStyle = '#047857';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo((angle + fSway * 0.5) * growthRatio, -fH * 0.5, (angle * 1.5 + fSway) * growthRatio, -fH);
                ctx.stroke();

                ctx.fillStyle = i % 2 === 0 ? '#10b981' : '#059669';
                ctx.beginPath();
                ctx.ellipse((angle * 1.1 + fSway * 0.7) * growthRatio, -fH * 0.65, 9 * growthRatio, 24 * growthRatio, (angle * 0.02), 0, Math.PI * 2);
                ctx.fill();
            });
        } else if (d.id === 'dragon_stone') {
            // Realistic Ohko Dragon Stone Spire with honeycombed cavities & moss
            const rockGrad = getCachedDecorGrad('dragon_stone', () => {
                const g = ctx.createLinearGradient(-35, -125, 35, 6);
                g.addColorStop(0, '#94a3b8');
                g.addColorStop(0.3, '#64748b');
                g.addColorStop(0.7, '#475569');
                g.addColorStop(1, '#1e293b');
                return g;
            });
            ctx.fillStyle = rockGrad;

            ctx.beginPath();
            ctx.moveTo(-45, 6);
            ctx.lineTo(-38, -55);
            ctx.lineTo(-24, -85);
            ctx.lineTo(-12, -45);
            ctx.lineTo(8, -122);
            ctx.lineTo(24, -75);
            ctx.lineTo(38, -48);
            ctx.lineTo(46, 6);
            ctx.closePath();
            ctx.fill();

            // Highlight rock ridge edge
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(8, -122);
            ctx.lineTo(-2, -65);
            ctx.lineTo(14, -20);
            ctx.lineTo(12, 6);
            ctx.stroke();

            // Natural weathered honeycombed cavities
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.ellipse(-14, -68, 6, 9, 0.2, 0, Math.PI * 2);
            ctx.ellipse(12, -92, 4.5, 7, -0.2, 0, Math.PI * 2);
            ctx.ellipse(18, -40, 7, 11, 0.1, 0, Math.PI * 2);
            ctx.ellipse(-26, -32, 5, 8, -0.15, 0, Math.PI * 2);
            ctx.fill();

            // Moss patches on rock crevices
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.arc(-22, -84, 5, 0, Math.PI * 2);
            ctx.arc(6, -118, 4.5, 0, Math.PI * 2);
            ctx.arc(28, -65, 6, 0, Math.PI * 2);
            ctx.fill();

        } else if (d.id === 'air_stone') {
            // Volcano Bubble Diffuser with glowing LED ring & micro bubble plume
            ctx.fillStyle = '#334155';
            ctx.beginPath();
            ctx.moveTo(-26, 6);
            ctx.lineTo(-15, -28);
            ctx.lineTo(15, -28);
            ctx.lineTo(26, 6);
            ctx.closePath();
            ctx.fill();

            // Glowing Aqua Aerator Ring
            ctx.fillStyle = '#0284c7';
            ctx.beginPath();
            ctx.ellipse(0, -28, 14, 5, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.ellipse(0, -28, 9, 3, 0, 0, Math.PI * 2);
            ctx.fill();

            // Continuous stream of micro-bubbles
            if (Math.random() < 0.35 && bubbles.length < 42) {
                bubbles.push({
                    x: x + (Math.random() - 0.5) * 16,
                    y: baseY - 30,
                    r: 1.2 + Math.random() * 2.8,
                    speed: 1.5 + Math.random() * 1.4,
                    wobble: Math.random() * Math.PI * 2
                });
            }

        } else if (d.id === 'sunken_temple') {
            // Ancient Atlantis Arch with fluted marble columns, cracked pediment & glowing runes
            const marbleGrad = getCachedDecorGrad('sunken_temple', () => {
                const g = ctx.createLinearGradient(-50, -110, 50, 0);
                g.addColorStop(0, '#e2e8f0');
                g.addColorStop(0.5, '#94a3b8');
                g.addColorStop(1, '#475569');
                return g;
            });

            // Twin weathered columns
            ctx.fillStyle = marbleGrad;
            ctx.fillRect(-48, -96, 18, 102);
            ctx.fillRect(30, -96, 18, 102);

            // Column capital & base pedestals
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(-54, -98, 30, 8);
            ctx.fillRect(24, -98, 30, 8);
            ctx.fillRect(-52, 0, 26, 6);
            ctx.fillRect(26, 0, 26, 6);

            // Chiseled Pediment / Arch Header
            ctx.beginPath();
            ctx.moveTo(-60, -98);
            ctx.lineTo(60, -98);
            ctx.lineTo(54, -114);
            ctx.lineTo(-54, -114);
            ctx.closePath();
            ctx.fill();

            // Glowing Atlantean mystical runes
            ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';
            ctx.fillRect(-42, -60, 6, 22);
            ctx.fillRect(36, -50, 6, 22);

            // Creeping aquatic moss & ivy vines
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.arc(-39, -98, 8, 0, Math.PI * 2);
            ctx.arc(39, -98, 9, 0, Math.PI * 2);
            ctx.arc(-42, -35, 6, 0, Math.PI * 2);
            ctx.arc(42, -28, 7, 0, Math.PI * 2);
            ctx.fill();

        } else if (d.id === 'spiderwood_driftwood') {
            // Takashi Spider Wood Root - Gnarled arching branches with weeping riccia moss
            ctx.save();
            ctx.strokeStyle = '#451a03';
            ctx.fillStyle = '#5c2406';
            ctx.lineWidth = 14;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Main twisted arch
            ctx.beginPath();
            ctx.moveTo(-52, 6);
            ctx.quadraticCurveTo(-25, -95, 12, -88);
            ctx.quadraticCurveTo(48, -82, 54, 6);
            ctx.stroke();

            // Secondary root branches
            ctx.lineWidth = 7;
            ctx.beginPath();
            ctx.moveTo(-18, -85);
            ctx.quadraticCurveTo(-38, -50, -28, 6);
            ctx.moveTo(22, -85);
            ctx.quadraticCurveTo(36, -45, 18, 6);
            ctx.moveTo(12, -88);
            ctx.quadraticCurveTo(18, -120, 2, -125);
            ctx.stroke();

            // Weeping Riccia moss patches on branch elbows
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.ellipse(-12, -92, 16, 10, -0.2, 0, Math.PI * 2);
            ctx.ellipse(24, -86, 14, 9, 0.25, 0, Math.PI * 2);
            ctx.ellipse(4, -122, 10, 7, 0, 0, Math.PI * 2);
            ctx.fill();

            // Hanging moss tendrils
            ctx.strokeStyle = '#16a34a';
            ctx.lineWidth = 2.2;
            for (let m = -20; m <= 30; m += 10) {
                ctx.beginPath();
                ctx.moveTo(m, -82);
                ctx.lineTo(m + Math.sin(now * 0.003 + m) * 4, -62);
                ctx.stroke();
            }
            ctx.restore();

        } else if (d.id === 'seiryu_rock_ridge') {
            // Seiryu Aquascaping Ridge - Jagged blue-grey limestone with authentic white calcite veins
            const seiryuGrad = getCachedDecorGrad('seiryu_rock_ridge', () => {
                const g = ctx.createLinearGradient(-45, -115, 45, 6);
                g.addColorStop(0, '#64748b');
                g.addColorStop(0.4, '#475569');
                g.addColorStop(0.8, '#334155');
                g.addColorStop(1, '#1e293b');
                return g;
            });
            ctx.fillStyle = seiryuGrad;

            ctx.beginPath();
            ctx.moveTo(-58, 6);
            ctx.lineTo(-46, -42);
            ctx.lineTo(-32, -82);
            ctx.lineTo(-14, -60);
            ctx.lineTo(0, -112);
            ctx.lineTo(22, -72);
            ctx.lineTo(38, -98);
            ctx.lineTo(52, -45);
            ctx.lineTo(60, 6);
            ctx.closePath();
            ctx.fill();

            // Striated White Calcite Veins
            ctx.strokeStyle = 'rgba(241, 245, 249, 0.82)';
            ctx.lineWidth = 1.7;
            ctx.beginPath();
            ctx.moveTo(-32, -82);
            ctx.lineTo(-18, -35);
            ctx.lineTo(-12, 6);
            ctx.moveTo(0, -112);
            ctx.lineTo(8, -55);
            ctx.lineTo(4, 6);
            ctx.moveTo(38, -98);
            ctx.lineTo(44, -40);
            ctx.stroke();

            // Highlight rock facet edges
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(0, -112);
            ctx.lineTo(-14, -60);
            ctx.lineTo(-32, -82);
            ctx.stroke();

            // Crevice moss
            ctx.fillStyle = '#059669';
            ctx.beginPath();
            ctx.arc(-26, -55, 4.5, 0, Math.PI * 2);
            ctx.arc(16, -62, 5, 0, Math.PI * 2);
            ctx.fill();

        } else if (d.id === 'glowing_crystal_cavern') {
            // Bioluminescent Geode Cavern with glowing amethyst/celestite crystal facets
            ctx.save();

            // Basalt outer shell
            ctx.fillStyle = '#1e1b4b';
            ctx.beginPath();
            ctx.ellipse(0, -25, 48, 38, 0, 0, Math.PI * 2);
            ctx.fill();

            // Hollow inner cavern
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.ellipse(0, -25, 36, 26, 0, 0, Math.PI * 2);
            ctx.fill();

            // Pulsing violet/cyan volumetric glow aura
            const pulse = 0.7 + Math.sin(now * 0.0035 + x) * 0.3;
            const crystalGlow = ctx.createRadialGradient(0, -25, 4, 0, -25, 55);
            crystalGlow.addColorStop(0, `rgba(192, 132, 252, ${0.45 * pulse})`);
            crystalGlow.addColorStop(0.6, `rgba(56, 189, 248, ${0.25 * pulse})`);
            crystalGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = crystalGlow;
            ctx.beginPath();
            ctx.arc(0, -25, 55, 0, Math.PI * 2);
            ctx.fill();

            // Sharp faceted crystal spikes pointing inward
            const crystalCols = ['#c084fc', '#e879f9', '#38bdf8', '#a855f7', '#67e8f9'];
            for (let c = 0; c < 9; c++) {
                const ang = (Math.PI * 2 * c) / 9;
                const rx1 = Math.cos(ang) * 32;
                const ry1 = -25 + Math.sin(ang) * 22;
                const rxTip = Math.cos(ang) * 14;
                const ryTip = -25 + Math.sin(ang) * 10;
                ctx.fillStyle = crystalCols[c % crystalCols.length];
                ctx.beginPath();
                ctx.moveTo(rx1 - 4, ry1);
                ctx.lineTo(rx1 + 4, ry1);
                ctx.lineTo(rxTip, ryTip);
                ctx.closePath();
                ctx.fill();
            }

            // Rising mystical crystal energy motes
            if (Math.random() < 0.25 && fxSparks.length < 50) {
                fxSparks.push({
                    x: x + (Math.random() - 0.5) * 35,
                    y: baseY - 35,
                    vx: (Math.random() - 0.5) * 0.6,
                    vy: -1.0 - Math.random() * 0.8,
                    r: 2 + Math.random() * 2,
                    color: '#c084fc',
                    alpha: 0.9,
                    style: 'sparkle'
                });
            }
            ctx.restore();

        } else if (d.id === 'sunken_galleon_shipwreck') {
            // Sunken Corsair Galleon Shipwreck with broken oak timbers, cannons, and barnacles
            ctx.save();
            const woodGrad = getCachedDecorGrad('shipwreck_wood', () => {
                const g = ctx.createLinearGradient(-65, -85, 65, 6);
                g.addColorStop(0, '#78350f');
                g.addColorStop(0.5, '#451a03');
                g.addColorStop(1, '#1c1917');
                return g;
            });
            ctx.fillStyle = woodGrad;

            // Weathered Galleon Hull
            ctx.beginPath();
            ctx.moveTo(-68, 6);
            ctx.lineTo(-62, -45);
            ctx.lineTo(-25, -55);
            ctx.lineTo(45, -50);
            ctx.lineTo(72, -18);
            ctx.lineTo(65, 6);
            ctx.closePath();
            ctx.fill();

            // Broken Mast with rigging remnant
            ctx.strokeStyle = '#451a03';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(-5, -55);
            ctx.lineTo(12, -115);
            ctx.stroke();

            // Cracked timber ribs
            ctx.strokeStyle = '#292524';
            ctx.lineWidth = 2.5;
            for (let r = -50; r <= 50; r += 20) {
                ctx.beginPath();
                ctx.moveTo(r, -52);
                ctx.lineTo(r - 4, 6);
                ctx.stroke();
            }

            // Brass Cannon Portholes
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(-35, -28, 5, 0, Math.PI * 2);
            ctx.arc(0, -28, 5, 0, Math.PI * 2);
            ctx.arc(35, -28, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#eab308';
            ctx.lineWidth = 1.8;
            ctx.stroke();

            // Barnacle clusters
            ctx.fillStyle = '#cbd5e1';
            ctx.beginPath();
            ctx.arc(-55, -12, 3, 0, Math.PI * 2);
            ctx.arc(-51, -15, 2.5, 0, Math.PI * 2);
            ctx.arc(52, -14, 3.2, 0, Math.PI * 2);
            ctx.fill();

            // Golden Treasure Chest with occasional bubble release
            ctx.fillStyle = '#b45309';
            ctx.fillRect(18, -16, 22, 16);
            ctx.fillStyle = '#fde047';
            ctx.fillRect(18, -10, 22, 2.5);
            if (Math.random() < 0.12 && bubbles.length < 38) {
                bubbles.push({
                    x: x + 28,
                    y: baseY - 18,
                    r: 2.2,
                    speed: 1.2,
                    wobble: Math.random() * Math.PI * 2
                });
            }
            ctx.restore();

        } else if (d.id === 'volcano_aerator_deluxe') {
            // Basalt Magma Volcano Aerator with glowing magma fissures & micro-aeration
            ctx.save();
            const basaltGrad = getCachedDecorGrad('volcano_basalt', () => {
                const g = ctx.createLinearGradient(-35, -65, 35, 6);
                g.addColorStop(0, '#334155');
                g.addColorStop(0.6, '#1e293b');
                g.addColorStop(1, '#020617');
                return g;
            });
            ctx.fillStyle = basaltGrad;

            // Volcano Cone
            ctx.beginPath();
            ctx.moveTo(-42, 6);
            ctx.lineTo(-20, -58);
            ctx.lineTo(20, -58);
            ctx.lineTo(42, 6);
            ctx.closePath();
            ctx.fill();

            // Glowing Magma Fissures
            const magmaPulse = 0.7 + Math.sin(now * 0.005) * 0.3;
            ctx.strokeStyle = `rgba(249, 115, 22, ${magmaPulse})`;
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(-10, -58);
            ctx.lineTo(-14, -30);
            ctx.lineTo(-24, 6);
            ctx.moveTo(8, -58);
            ctx.lineTo(12, -25);
            ctx.lineTo(18, 6);
            ctx.stroke();

            // Caldera Rim with incandescent glow
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.ellipse(0, -58, 16, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.ellipse(0, -58, 9, 3.5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Erupting aerated micro-bubble stream & volcanic embers
            if (Math.random() < 0.45 && bubbles.length < 45) {
                bubbles.push({
                    x: x + (Math.random() - 0.5) * 14,
                    y: baseY - 62,
                    r: 1.4 + Math.random() * 2.5,
                    speed: 1.8 + Math.random() * 1.5,
                    wobble: Math.random() * Math.PI * 2
                });
            }
            if (Math.random() < 0.15 && fxSparks.length < 50) {
                fxSparks.push({
                    x: x + (Math.random() - 0.5) * 12,
                    y: baseY - 62,
                    vx: (Math.random() - 0.5) * 0.8,
                    vy: -1.5 - Math.random() * 1.0,
                    r: 1.8,
                    color: '#f97316',
                    alpha: 1.0,
                    style: 'sparkle'
                });
            }
            ctx.restore();

        } else if (d.id === 'crimson_sea_fan') {
            // Crimson Gorgonian Sea Fan with swaying lace branches & glowing polyps
            ctx.save();
            const fanSway = Math.sin(now * 0.0025 + d.xRatio * 8) * 9 * growthRatio;

            // Thick base stem
            ctx.strokeStyle = '#881337';
            ctx.lineWidth = 5 * growthRatio;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(fanSway * 0.3, -35 * growthRatio);
            ctx.stroke();

            // Branching lace-like crimson fan arms
            const fanBranches = [
                { startX: 0, startY: -35, endX: -38 + fanSway, endY: -115 },
                { startX: 0, startY: -35, endX: -18 + fanSway * 1.1, endY: -138 },
                { startX: 0, startY: -35, endX: 16 + fanSway * 1.1, endY: -140 },
                { startX: 0, startY: -35, endX: 38 + fanSway, endY: -118 }
            ];

            ctx.strokeStyle = '#e11d48';
            ctx.lineWidth = 2.4 * growthRatio;
            fanBranches.forEach(b => {
                ctx.beginPath();
                ctx.moveTo(b.startX * growthRatio, b.startY * growthRatio);
                ctx.quadraticCurveTo((b.startX + b.endX) * 0.5 * growthRatio, (b.startY + b.endY) * 0.5 * growthRatio, b.endX * growthRatio, b.endY * growthRatio);
                ctx.stroke();
            });

            // Glowing bioluminescent polyps
            ctx.fillStyle = '#fecdd3';
            fanBranches.forEach(b => {
                for (let p = 0.3; p <= 1.0; p += 0.22) {
                    const px = (b.startX + (b.endX - b.startX) * p) * growthRatio;
                    const py = (b.startY + (b.endY - b.startY) * p) * growthRatio;
                    ctx.beginPath();
                    ctx.arc(px, py, 2.5 * growthRatio, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
            ctx.restore();
        } else if (d.id === 'bucephalandra_deep_purple') {
            // Royal Blue Bucephalandra - Metallic indigo-purple leaves with glistening pearl spots
            ctx.save();
            const buceSway = Math.sin(now * 0.002 + d.xRatio * 7) * 4 * growthRatio;

            // Rhizome base
            ctx.strokeStyle = '#292524';
            ctx.lineWidth = 4 * growthRatio;
            ctx.beginPath();
            ctx.moveTo(-16 * growthRatio, 2);
            ctx.quadraticCurveTo(0, -6 * growthRatio, 18 * growthRatio, 0);
            ctx.stroke();

            // Metallic ruffle leaves
            const leafAngles = [-55, -35, -15, 8, 28, 50];
            leafAngles.forEach((ang, i) => {
                ctx.save();
                ctx.translate(buceSway * 0.2, -6 * growthRatio);
                ctx.rotate((ang * Math.PI) / 180 + (Math.sin(now * 0.003 + i) * 0.08));

                const grad = ctx.createLinearGradient(0, 0, 0, -42 * growthRatio);
                grad.addColorStop(0, '#1e1b4b');
                grad.addColorStop(0.5, '#4338ca');
                grad.addColorStop(1, '#0284c7');

                ctx.fillStyle = grad;
                ctx.strokeStyle = '#38bdf8';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.ellipse(0, -22 * growthRatio, 7.5 * growthRatio, 22 * growthRatio, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Glistening pearl starlight spots on leaf blade
                ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
                ctx.beginPath();
                ctx.arc(-2 * growthRatio, -15 * growthRatio, 1.1 * growthRatio, 0, Math.PI * 2);
                ctx.arc(2.5 * growthRatio, -26 * growthRatio, 0.9 * growthRatio, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            // White spathe flower bud if mature
            if (isFlowering) {
                ctx.save();
                ctx.translate(buceSway, -38 * growthRatio);
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.ellipse(0, -12 * growthRatio, 3.5 * growthRatio, 10 * growthRatio, 0.15, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            ctx.restore();

        } else if (d.id === 'vallisneria_spiralis') {
            // Jungle Ribbon Vallisneria - Tall twisting emerald ribbons swaying to surface
            ctx.save();
            const ribbonBlades = [
                { startX: -14, len: 170, phase: 0 },
                { startX: -6, len: 215, phase: 1.2 },
                { startX: 2, len: 235, phase: 2.1 },
                { startX: 10, len: 195, phase: 3.0 },
                { startX: 18, len: 165, phase: 4.1 }
            ];

            ribbonBlades.forEach(b => {
                const effectiveLen = b.len * growthRatio;
                ctx.beginPath();
                ctx.moveTo(b.startX * growthRatio, 0);

                const segments = 6;
                const segH = effectiveLen / segments;
                for (let s = 1; s <= segments; s++) {
                    const progress = s / segments;
                    const sway = Math.sin(now * 0.0022 + b.phase + progress * 2.2) * (18 * progress + 4);
                    const curY = -s * segH;
                    const curX = (b.startX + sway) * growthRatio;
                    if (s === 1) ctx.lineTo(curX, curY);
                    else ctx.quadraticCurveTo(curX - 4, curY + segH * 0.5, curX, curY);
                }

                ctx.strokeStyle = 'rgba(34, 197, 94, 0.78)';
                ctx.lineWidth = 4.5 * growthRatio;
                ctx.lineCap = 'round';
                ctx.stroke();

                // Inner emerald rib
                ctx.strokeStyle = 'rgba(21, 128, 61, 0.9)';
                ctx.lineWidth = 1.4 * growthRatio;
                ctx.stroke();
            });
            ctx.restore();

        } else if (d.id === 'bonsai_moss_tree') {
            // Zen Bonsai Aquascape Tree - Gnarled trunk with weeping fissidens moss canopy
            ctx.save();
            const treeSway = Math.sin(now * 0.0018 + d.xRatio * 5) * 4 * growthRatio;

            // Trunk & Gnarled Branches
            const trunkGrad = ctx.createLinearGradient(-25, 0, 25, -95 * growthRatio);
            trunkGrad.addColorStop(0, '#291404');
            trunkGrad.addColorStop(0.5, '#451a03');
            trunkGrad.addColorStop(1, '#78350f');

            ctx.strokeStyle = trunkGrad;
            ctx.lineWidth = 14 * growthRatio;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(-14 * growthRatio, -45 * growthRatio, -6 * growthRatio, -85 * growthRatio);
            ctx.stroke();

            // Branch left & right
            ctx.lineWidth = 7 * growthRatio;
            ctx.beginPath();
            ctx.moveTo(-8 * growthRatio, -70 * growthRatio);
            ctx.quadraticCurveTo(-26 * growthRatio, -80 * growthRatio, -38 * growthRatio + treeSway, -100 * growthRatio);
            ctx.moveTo(-6 * growthRatio, -80 * growthRatio);
            ctx.quadraticCurveTo(18 * growthRatio, -90 * growthRatio, 34 * growthRatio + treeSway, -108 * growthRatio);
            ctx.stroke();

            // Lush Fissidens Moss Canopy Clouds
            const mossClouds = [
                { x: -38 + treeSway, y: -102, r: 24 },
                { x: -8 + treeSway * 0.8, y: -125, r: 28 },
                { x: 34 + treeSway, y: -110, r: 25 },
                { x: 12 + treeSway * 0.9, y: -100, r: 20 }
            ];

            mossClouds.forEach(m => {
                ctx.save();
                const mGrad = ctx.createRadialGradient(m.x * growthRatio, (m.y + 4) * growthRatio, 4, m.x * growthRatio, m.y * growthRatio, m.r * growthRatio);
                mGrad.addColorStop(0, '#86efac');
                mGrad.addColorStop(0.45, '#22c55e');
                mGrad.addColorStop(1, '#15803d');
                ctx.fillStyle = mGrad;

                ctx.beginPath();
                ctx.arc(m.x * growthRatio, m.y * growthRatio, m.r * growthRatio, 0, Math.PI * 2);
                ctx.arc((m.x - 10) * growthRatio, (m.y + 3) * growthRatio, (m.r * 0.75) * growthRatio, 0, Math.PI * 2);
                ctx.arc((m.x + 10) * growthRatio, (m.y + 2) * growthRatio, (m.r * 0.75) * growthRatio, 0, Math.PI * 2);
                ctx.fill();

                // Hanging moss tendrils
                ctx.strokeStyle = '#16a34a';
                ctx.lineWidth = 1.6;
                for (let t = -12; t <= 12; t += 6) {
                    ctx.beginPath();
                    ctx.moveTo((m.x + t) * growthRatio, (m.y + m.r * 0.6) * growthRatio);
                    ctx.lineTo((m.x + t + Math.sin(now * 0.003 + t) * 3) * growthRatio, (m.y + m.r * 0.6 + 10) * growthRatio);
                    ctx.stroke();
                }
                ctx.restore();
            });
            ctx.restore();

        } else if (d.id === 'atlantis_portal') {
            // Sunken Atlantis Runestone Portal - Carved monolith archway with pulsing vortex
            ctx.save();
            const portalPulse = 0.5 + Math.sin(now * 0.004) * 0.5;

            // Swirling Cyan Energy Vortex Field
            const vortexGrad = ctx.createRadialGradient(0, -75, 4, 0, -75, 48);
            vortexGrad.addColorStop(0, `rgba(165, 243, 252, ${0.45 + portalPulse * 0.25})`);
            vortexGrad.addColorStop(0.55, `rgba(6, 182, 212, ${0.28 + portalPulse * 0.15})`);
            vortexGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
            ctx.fillStyle = vortexGrad;
            ctx.beginPath();
            ctx.ellipse(0, -75, 34, 52, 0, 0, Math.PI * 2);
            ctx.fill();

            // Runestone Archway
            ctx.fillStyle = '#0f172a';
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2.4;

            // Left Pillar
            ctx.beginPath();
            ctx.rect(-42, -135, 14, 135);
            ctx.fill();
            ctx.stroke();

            // Right Pillar
            ctx.beginPath();
            ctx.rect(28, -135, 14, 135);
            ctx.fill();
            ctx.stroke();

            // Top Monolith Lintel
            ctx.beginPath();
            ctx.rect(-50, -152, 100, 18);
            ctx.fill();
            ctx.stroke();

            // Glowing Rune glyphs
            ctx.fillStyle = `rgba(56, 189, 248, ${0.7 + portalPulse * 0.3})`;
            ctx.shadowColor = '#06b6d4';
            ctx.shadowBlur = 8;
            for (let ry = -120; ry <= -25; ry += 30) {
                ctx.fillRect(-37, ry, 4, 14);
                ctx.fillRect(33, ry, 4, 14);
            }
            ctx.fillRect(-8, -145, 16, 5);
            ctx.shadowBlur = 0;

            // Ambient rising energy spark
            if (Math.random() < 0.06 && typeof fxSparks !== 'undefined') {
                fxSparks.push({
                    x: x + (Math.random() - 0.5) * 35,
                    y: baseY - 75 + (Math.random() - 0.5) * 40,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: -1.2 - Math.random() * 0.8,
                    size: 2.2,
                    color: '#67e8f9',
                    life: 50,
                    maxLife: 50,
                    alpha: 0.9,
                    style: 'sparkle'
                });
            }
            ctx.restore();
        }

        ctx.restore();
    });
}

function drawTankSnail(now) {
    tankSnail.x += tankSnail.dir * 0.16;
    if (tankSnail.x > cw - 80) tankSnail.dir = -1;
    if (tankSnail.x < 80) tankSnail.dir = 1;
    const sy = getSubstrateHeightAt(tankSnail.x) - 3;

    ctx.save();
    ctx.translate(tankSnail.x, sy);
    ctx.scale(tankSnail.dir, 1);

    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.ellipse(2, 2, 11, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(15, -6 + Math.sin(now * 0.005) * 1.5);
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(-2, -5, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(-2, -5, 4, 0, Math.PI * 1.5);
    ctx.stroke();
    ctx.restore();
}

function drawSnailClutches(now) {
    if (!state.snailClutches || !state.snailClutches.length) return;
    ctx.save();
    state.snailClutches.forEach(cl => {
        const pulse = 1 + Math.sin(now * 0.006) * 0.08;
        ctx.save();
        ctx.translate(cl.x, cl.y);
        ctx.scale(pulse, pulse);

        // Lightweight radial pink-gold aura
        const aura = ctx.createRadialGradient(0, 2, 2, 0, 2, 18);
        aura.addColorStop(0, 'rgba(244, 114, 182, 0.45)');
        aura.addColorStop(1, 'rgba(244, 114, 182, 0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(0, 2, 18, 0, Math.PI * 2);
        ctx.fill();

        const offsets = [
            [-8, 0], [0, -3], [8, 0], [-4, 5], [4, 5], [0, 2], [-10, 4], [10, 4]
        ];
        offsets.forEach(([ox, oy], i) => {
            ctx.fillStyle = i % 2 === 0 ? '#fbcfe8' : '#f472b6';
            ctx.beginPath();
            ctx.arc(ox, oy, 4.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 0.8;
            ctx.stroke();
        });

        ctx.fillStyle = '#fef08a';
        ctx.font = '700 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✨ Click Pearl Clutch!', 0, 20);
        ctx.restore();
    });
    ctx.restore();
}

function drawWasteSpots(now) {
    ctx.save();
    state.waste.forEach(w => {
        w.y = getSubstrateHeightAt(w.x) - 4;
        ctx.fillStyle = 'rgba(63, 98, 18, 0.85)';
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.size, 0, Math.PI * 2);
        ctx.arc(w.x + 4, w.y + 1, w.size * 0.75, 0, Math.PI * 2);
        ctx.fill();

        if (currentMode === 'clean') {
            const pulse = 10 + Math.sin(now * 0.008) * 3;
            ctx.strokeStyle = '#34d399';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(w.x + 1, w.y, pulse, 0, Math.PI * 2);
            ctx.stroke();
        }
    });
    ctx.restore();
}