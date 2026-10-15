// High-performance pooled spatial grid (zero allocations per frame)
const SPATIAL_CELL_SIZE = 160;
const spatialHashGrid = new Map();
const pooledCells = [];
const reusableNeighbors = [];

function buildSpatialGrid() {
    for (const cell of spatialHashGrid.values()) {
        cell.length = 0;
        pooledCells.push(cell);
    }
    spatialHashGrid.clear();

    for (let i = 0; i < state.fish.length; i++) {
        const fish = state.fish[i];
        if (fish.stage === 'egg') continue;
        const cx = Math.floor(fish.x / SPATIAL_CELL_SIZE);
        const cy = Math.floor(fish.y / SPATIAL_CELL_SIZE);
        const key = (cx << 16) | (cy & 0xffff);
        let cell = spatialHashGrid.get(key);
        if (!cell) {
            cell = pooledCells.length > 0 ? pooledCells.pop() : [];
            spatialHashGrid.set(key, cell);
        }
        cell.push(fish);
    }
}

function queryNearbyFish(fish) {
    const cx = Math.floor(fish.x / SPATIAL_CELL_SIZE);
    const cy = Math.floor(fish.y / SPATIAL_CELL_SIZE);
    reusableNeighbors.length = 0;
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            const key = ((cx + dx) << 16) | ((cy + dy) & 0xffff);
            const cell = spatialHashGrid.get(key);
            if (cell) {
                for (let k = 0; k < cell.length; k++) {
                    const other = cell[k];
                    if (other.id !== fish.id) reusableNeighbors.push(other);
                }
            }
        }
    }
    return reusableNeighbors;
}

function updateFishPhysics(dtSeconds) {
    const topBound = 92;
    const botBound = substrateY - 22;

    profilerMetrics.schoolingChecks = 0;
    buildSpatialGrid();

    // Laser toy play timer tracking for quest
    if (currentMode === 'laser' && mousePos.active) {
        laserPlayTimer += dtSeconds * simSpeed;
        if (typeof updateQuestProgress === 'function') {
            updateQuestProgress('laser_play', dtSeconds * simSpeed);
        }
    }

    // Update falling food pellets
    for (let i = foodParticles.length - 1; i >= 0; i--) {
        const p = foodParticles[i];
        const floorY = getSubstrateHeightAt(p.x) - 6;
        if (p.y < floorY) {
            p.y += p.vy * (0.8 + simSpeed * 0.2);
            p.x += Math.sin(performance.now() * 0.004 + p.phase) * 0.35;
        } else {
            p.y = floorY;
            p.ageOnFloor = (p.ageOnFloor || 0) + dtSeconds * simSpeed;
            // Uneaten food eventually dissolves into waste if ignored for 25s
            if (p.ageOnFloor > 25) {
                if (state.waste.length < 18) {
                    state.waste.push({ id: generateId(), x: p.x, y: floorY, size: 5 });
                }
                foodParticles.splice(i, 1);
            }
        }
    }

    // Update each fish's swimming vector
    state.fish.forEach(fish => {
        if (fish.stage === 'egg') {
            fish.y = getSubstrateHeightAt(fish.x) - 7;
            return;
        }

        const spec = getEffectiveSpec(fish);
        const stageScale = fish.stage === 'fry' ? 0.45 : (fish.stage === 'juvenile' ? 0.74 : 1.0);
        const eventSpeedMult = (activeTankEvent && activeTankEvent.id === 'oxygen_rush') ? 1.3 : 1.0;
        const maxSpeed = spec.speed * (0.85 + Math.min(simSpeed, 2.5) * 0.15) * (fish.hunger < 15 ? 0.6 : 1.0) * eventSpeedMult;
        const isBottomDweller = spec.swimZone === 'bottom';

        // 0. CLEANER CREW ROLE: Fast squared-distance bio-cleaning
        if (spec.cleanerRole && state.waste.length > 0) {
            let targetWaste = null;
            let bestWDistSq = 360 * 360;
            for (let wi = 0; wi < state.waste.length; wi++) {
                const w = state.waste[wi];
                const dx = w.x - fish.x;
                const dy = w.y - fish.y;
                const dSq = dx * dx + dy * dy;
                if (dSq < bestWDistSq) {
                    bestWDistSq = dSq;
                    targetWaste = w;
                }
            }
            if (targetWaste) {
                const angle = Math.atan2(targetWaste.y - fish.y, targetWaste.x - fish.x);
                fish.vx += Math.cos(angle) * 0.2;
                fish.vy += Math.sin(angle) * 0.2;
                if (bestWDistSq < 676) { // 26^2
                    const wIdx = state.waste.indexOf(targetWaste);
                    if (wIdx !== -1) {
                        state.waste.splice(wIdx, 1);
                        state.waterQuality = Math.min(100, state.waterQuality + 2.5);
                        fish.hunger = Math.min(100, fish.hunger + 22);
                        fish.maturity += 0.08;
                        state.coins += 2;
                        addXP(4);
                        spawnParticleBurst(fish.x, fish.y, '#34d399', 8, 'sparkle');
                        addFloatingText(fish.x, fish.y - 16, `🧹 Bio-Cleaned +2🪙`, '#34d399');
                    }
                }
            }
        }

        // 1. Seek nearest food particle if hungry (< 95%) via squared distance
        let nearestFood = null;
        let bestFoodDistSq = 420 * 420;
        if (fish.hunger < 95 && foodParticles.length > 0) {
            for (let fi = 0; fi < foodParticles.length; fi++) {
                const fp = foodParticles[fi];
                const dx = fp.x - fish.x;
                const dy = fp.y - fish.y;
                const dSq = dx * dx + dy * dy;
                if (dSq < bestFoodDistSq) {
                    bestFoodDistSq = dSq;
                    nearestFood = fp;
                }
            }
        }

        if (nearestFood) {
            const angle = Math.atan2(nearestFood.y - fish.y, nearestFood.x - fish.x);
            fish.vx += Math.cos(angle) * 0.22;
            fish.vy += Math.sin(angle) * 0.22;

            // Eat food on contact (with generous reach for floor food)
            const isFloorFood = nearestFood.y >= getSubstrateHeightAt(nearestFood.x) - 10;
            const eatRad = (22 * stageScale + 12) + (isFloorFood ? 22 : 0);
            if (bestFoodDistSq < eatRad * eatRad) {
                const idx = foodParticles.indexOf(nearestFood);
                if (idx !== -1) {
                    foodParticles.splice(idx, 1);
                    fish.hunger = Math.min(100, fish.hunger + nearestFood.nutrition);
                    fish.maturity += nearestFood.growthBoost;
                    spawnParticleBurst(fish.x + fish.facing * 10, fish.y, nearestFood.color, 8, 'sparkle');
                    if (nearestFood.healBoost > 0) {
                        fish.health = Math.min(100, fish.health + nearestFood.healBoost);
                        addFloatingText(fish.x, fish.y - 16, `+Health 💚`, '#fb7185');
                    } else {
                        addFloatingText(fish.x, fish.y - 14, `+XP`, '#38bdf8');
                    }
                    addXP(nearestFood.xpBoost);
                    playSound('bubble');
                }
            }
        } else {
            // Laser Toy Interaction (Playful Swarm & Dart)
            let chasingLaser = false;
            if (currentMode === 'laser' && mousePos.active) {
                const lx = mousePos.x;
                const ly = Math.max(topBound + 10, Math.min(botBound - 10, mousePos.y));
                const dxL = lx - fish.x;
                const dyL = ly - fish.y;
                const dLaserSq = dxL * dxL + dyL * dyL;
                if (dLaserSq < 144400) { // 380^2
                    chasingLaser = true;
                    const dLaser = Math.sqrt(dLaserSq);
                    const angle = Math.atan2(dyL, dxL);
                    const attract = dLaser < 36 ? -0.35 : (0.28 + Math.random() * 0.12);
                    fish.vx += Math.cos(angle) * attract;
                    fish.vy += Math.sin(angle) * attract;
                    if (dLaser < 42 && Math.random() < 0.08) {
                        spawnParticleBurst(fish.x, fish.y, '#f43f5e', 4, 'sparkle');
                        if (Math.random() < 0.2) playSound('laser');
                    }
                }
            }

            // 2. Autonomous Cruising & Boids Schooling via O(N) Spatial Grid (Squared Distance)
            if (!chasingLaser && spec.schooling) {
                let avgX = 0, avgY = 0, avgVx = 0, avgVy = 0, count = 0;
                const candidates = queryNearbyFish(fish);
                profilerMetrics.schoolingChecks += candidates.length;
                for (let k = 0; k < candidates.length; k++) {
                    const other = candidates[k];
                    if (other.speciesId === fish.speciesId && other.stage !== 'egg') {
                        const dx = other.x - fish.x;
                        const dy = other.y - fish.y;
                        const dSq = dx * dx + dy * dy;
                        if (dSq < 36100 && dSq > 1156) { // 190^2 and 34^2
                            avgX += other.x;
                            avgY += other.y;
                            avgVx += other.vx;
                            avgVy += other.vy;
                            count++;
                        } else if (dSq <= 1156 && dSq > 0) {
                            // Gentle lateral repulsion to prevent dense overlapping singularity
                            fish.vx -= dx * 0.016;
                            fish.vy -= dy * 0.016;
                        }
                    }
                }
                if (count > 0) {
                    avgX /= count;
                    avgY /= count;
                    avgVx /= count;
                    avgVy /= count;
                    fish.vx += (avgX - fish.x) * 0.0007 + (avgVx - fish.vx) * 0.016;
                    fish.vy += (avgY - fish.y) * 0.0007 + (avgVy - fish.vy) * 0.016;
                }
            }

            // Random wander target by swimZone
            const tdx = (fish.targetX || 0) - fish.x;
            const tdy = (fish.targetY || 0) - fish.y;
            if (!fish.targetX || (tdx * tdx + tdy * tdy) < 2025 || Math.random() < 0.014) {
                fish.targetX = 80 + Math.random() * (cw - 160);
                let minY = topBound + 20;
                let maxY = botBound - 20;
                if (spec.swimZone === 'top') maxY = topBound + (botBound - topBound) * 0.45;
                if (spec.swimZone === 'mid') {
                    minY = topBound + (botBound - topBound) * 0.2;
                    maxY = topBound + (botBound - topBound) * 0.82;
                }
                if (isBottomDweller) {
                    const sandY = getSubstrateHeightAt(fish.targetX);
                    minY = sandY - (spec.bodyShape === 'crab' ? 14 : 42);
                    maxY = sandY - 8;
                }
                fish.targetY = minY + Math.random() * Math.max(8, maxY - minY);
            }

            const angle = Math.atan2(fish.targetY - fish.y, fish.targetX - fish.x);
            fish.vx += Math.cos(angle) * 0.045;
            fish.vy += Math.sin(angle) * 0.035;

            // Jellyfish rhythmic vertical bell pulsation
            if (spec.bodyShape === 'jellyfish') {
                fish.vy += Math.sin(fish.tailPhase * 0.7) * 0.055;
                fish.vx *= 0.96;
            }
        }

        // Soft wall & surface avoidance with smooth U-turn steering
        const margin = 85;
        if (fish.x < margin) {
            fish.vx += 0.22;
            const steerY = fish.y > (ch * 0.5) ? -0.16 : 0.16;
            fish.vy += steerY;
        } else if (fish.x > cw - margin) {
            fish.vx -= 0.22;
            const steerY = fish.y > (ch * 0.5) ? -0.16 : 0.16;
            fish.vy += steerY;
        }
        if (fish.y < topBound) fish.vy += 0.18;

        const localFloor = getSubstrateHeightAt(fish.x) - (isBottomDweller ? 10 : 26);
        if (fish.y > localFloor) {
            if (spec.bodyShape === 'crab' || spec.bodyShape === 'shrimp') {
                fish.y = localFloor;
                fish.vy = 0;
            } else {
                fish.vy -= 0.22;
            }
        }

        // Speed limit & damping
        const currentSpeed = Math.hypot(fish.vx, fish.vy);
        if (currentSpeed > maxSpeed) {
            fish.vx = (fish.vx / currentSpeed) * maxSpeed;
            fish.vy = (fish.vy / currentSpeed) * maxSpeed;
        } else if (currentSpeed < 0.35 && spec.bodyShape !== 'jellyfish') {
            fish.vx *= 1.05;
        }

        // Natural biological cruising undulation (Bơi uốn lượn dập dờn trong làn nước)
        if (spec.bodyShape !== 'crab' && spec.bodyShape !== 'shrimp') {
            const swimWave = Math.sin(fish.tailPhase * 0.9) * (0.24 + currentSpeed * 0.15);
            fish.y += swimWave * Math.min(1.0, dtSeconds * 28);
        }

        fish.x += fish.vx;
        fish.y += fish.vy;

        if (Math.abs(fish.vx) > 0.08) {
            fish.facing = fish.vx > 0 ? 1 : -1;
        }

        // Smooth 3D turning interpolation (rate-limited turning arc through depth)
        if (fish.renderFacing === undefined) fish.renderFacing = fish.facing || 1;
        const targetFacing = fish.facing || 1;
        fish.renderFacing += (targetFacing - fish.renderFacing) * Math.min(1, dtSeconds * 5.2);

        // Dynamic turning spine curvature: bends body into a C-curve during turns
        const turnDelta = targetFacing - fish.renderFacing;
        if (fish.turnCurve === undefined) fish.turnCurve = 0;
        const targetCurve = Math.abs(turnDelta) > 0.15 ? Math.sign(turnDelta) * Math.sin(Math.min(1, Math.abs(turnDelta) * 0.5) * Math.PI) * 0.75 : 0;
        fish.turnCurve += (targetCurve - fish.turnCurve) * Math.min(1, dtSeconds * 7.5);

        // Smooth pitch angle interpolation (prevent jerky angle tilting)
        if (fish.pitchAngle === undefined) fish.pitchAngle = 0;
        const targetPitch = Math.max(-0.35, Math.min(0.35, (fish.vy || 0) * 0.14)) * (fish.facing || 1);
        fish.pitchAngle += (targetPitch - fish.pitchAngle) * Math.min(1, dtSeconds * 6.5);

        // Natural burst-and-glide propulsion: subtle thrust at peak tail swing
        const thrustPulse = Math.max(0, Math.sin(fish.tailPhase * 2)) * 0.018;
        fish.vx += (fish.facing || 1) * thrustPulse;

        // Fin & Tail Oscillation proportional to velocity
        fish.tailPhase += (0.13 + currentSpeed * 0.11);
        fish.finPhase += 0.095 + currentSpeed * 0.04;

        // Smooth decay of growth level-up effect
        if (fish.growthTimer > 0) {
            fish.growthTimer = Math.max(0, fish.growthTimer - dtSeconds * 0.7);
        }

        // 3D Depth Z-Drift (Wandering between foreground and background layers)
        if (fish.z === undefined) {
            fish.z = (Math.random() - 0.5) * 0.8;
            fish.vz = (Math.random() - 0.5) * 0.008;
        }
        fish.z += fish.vz;
        if (fish.z > 0.6) {
            fish.z = 0.6;
            fish.vz = -Math.abs(fish.vz);
        } else if (fish.z < -0.6) {
            fish.z = -0.6;
            fish.vz = Math.abs(fish.vz);
        } else if (Math.random() < 0.008) {
            fish.vz = (Math.random() - 0.5) * 0.007;
        }

        // Spawn subtle hydrodynamic wake vortex rings when darting
        if (currentSpeed > 1.85 && Math.random() < 0.08) {
            const tailTipX = fish.x - fish.facing * (spec.baseSize * stageScale * 1.35);
            spawnWakeRing(tailTipX, fish.y, fish.vx, fish.vy, spec.baseSize * stageScale, spec.primaryColor);
        }

        // Record smooth swimming trail for Adult, Prismatic or Cosmic morph fish
        if (!fish.trail) fish.trail = [];
        const isSpecialTrail = fish.morph === 'prism' || fish.morph === 'cosmic' || (spec.rarity && spec.rarity.includes('VIP'));
        if (isSpecialTrail && currentSpeed > 0.8) {
            fish.trail.unshift({
                x: fish.x - fish.facing * 10,
                y: fish.y + Math.sin(fish.tailPhase) * 2.5
            });
            if (fish.trail.length > 6) fish.trail.pop();
        } else if (fish.trail.length > 0) {
            fish.trail.pop();
        }
    });

    // Update 3D suspended marine snow particulates
    if (snowMotes && snowMotes.length) {
        for (let i = 0; i < snowMotes.length; i++) {
            const m = snowMotes[i];
            if (m.z === undefined) m.z = (Math.random() - 0.5) * 1.4;
            m.x += m.vx * (1 + m.z * 0.3) + Math.sin(performance.now() * 0.001 + i) * 0.15;
            m.y += m.vy * (1 + m.z * 0.3);
            if (m.x < -10) m.x = cw + 10;
            if (m.x > cw + 10) m.x = -10;
            if (m.y < 85) m.y = substrateY - 20;
            if (m.y > substrateY - 10) m.y = 90;
        }
    }
}

