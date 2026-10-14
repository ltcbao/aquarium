function resizeCanvas() {
    cw = window.innerWidth;
    ch = window.innerHeight;
    canvas.width = cw;
    canvas.height = ch;
    substrateY = ch - 124;

    // Generate smooth gravel/sand contour points
    sandMounds = [];
    const steps = 24;
    for (let i = 0; i <= steps; i++) {
        const x = (cw / steps) * i;
        const offset = Math.sin(i * 0.65) * 12 + Math.cos(i * 1.3) * 6;
        sandMounds.push({ x, y: substrateY + offset });
    }

    // Clamp existing entities inside new bounds
    if (state && state.fish) {
        state.fish.forEach(f => {
            f.x = Math.max(40, Math.min(cw - 40, f.x));
            if (f.stage === 'egg') {
                f.y = getSubstrateHeightAt(f.x) - 8;
            } else {
                f.y = Math.max(100, Math.min(substrateY - 35, f.y));
            }
        });
    }
}

function getSubstrateHeightAt(x) {
    if (!sandMounds.length) return substrateY;
    const ratio = Math.max(0, Math.min(1, x / cw));
    const idx = ratio * (sandMounds.length - 1);
    const low = Math.floor(idx);
    const high = Math.ceil(idx);
    const t = idx - low;
    if (!sandMounds[low] || !sandMounds[high]) return substrateY;
    return sandMounds[low].y * (1 - t) + sandMounds[high].y * t;
}

function initAmbientParticles() {
    bubbles = [];
    for (let i = 0; i < 20; i++) {
        bubbles.push({
            x: Math.random() * cw,
            y: Math.random() * ch,
            r: 1.5 + Math.random() * 4.2,
            speed: 0.5 + Math.random() * 1.3,
            wobble: Math.random() * Math.PI * 2
        });
    }
    snowMotes = [];
    for (let i = 0; i < 28; i++) {
        snowMotes.push({
            x: Math.random() * cw,
            y: 90 + Math.random() * (ch - 180),
            r: 0.8 + Math.random() * 1.4,
            vx: (Math.random() - 0.5) * 0.22,
            vy: (Math.random() - 0.5) * 0.16,
            alpha: 0.15 + Math.random() * 0.35
        });
    }
}

let lastSimTick = performance.now();
let autoFeederTimer = 0;
let passiveIncomeTimer = 0;
let autoSaveTimer = 0;
let snailEventTimer = 0;

function triggerRandomTankEvent() {
    const pool = [
        {
            id: 'golden_hour',
            title: 'Golden Hour Feeding Frenzy',
            desc: 'Warm sunset rays fill the aquarium! All fish gain 2x Growth & 2x Coins!',
            duration: 35,
            remaining: 35,
            icon: 'ph-sun-dim',
            color: 'text-amber-300 border-amber-400/50 bg-amber-500/20'
        },
        {
            id: 'bioluminescent_night',
            title: 'Bioluminescent Neon Night',
            desc: 'Deep oceanic twilight settles in. Bioluminescent creatures glow radiantly!',
            duration: 38,
            remaining: 38,
            icon: 'ph-sparkle',
            color: 'text-purple-300 border-purple-400/50 bg-purple-500/20'
        },
        {
            id: 'algae_bloom',
            title: 'Wild Biofilm Bloom',
            desc: 'A lush micro-algae bloom covers the substrate! Cleaner shrimp & snails work at 2x speed!',
            duration: 32,
            remaining: 32,
            icon: 'ph-plant',
            color: 'text-emerald-300 border-emerald-400/50 bg-emerald-500/20'
        },
        {
            id: 'oxygen_rush',
            title: 'Oxygen Supercharge',
            desc: 'Diffuser aeration surges! Fish swim +30% faster with joyful bubble wakes!',
            duration: 30,
            remaining: 30,
            icon: 'ph-wind',
            color: 'text-cyan-300 border-cyan-400/50 bg-cyan-500/20'
        }
    ];
    const ev = pool[Math.floor(Math.random() * pool.length)];
    activeTankEvent = Object.assign({}, ev);
    if (typeof invalidateBgGradients === 'function') invalidateBgGradients();
    playSound('event');
    showToast(`🌟 Tank Event: ${ev.title}! ${ev.desc}`, 'amber');
    const evBanner = document.getElementById('hud-event-banner');
    const evText = document.getElementById('hud-event-text');
    const evTimer = document.getElementById('hud-event-timer');
    const evIcon = document.getElementById('hud-event-icon');
    if (evBanner && evText && evTimer && evIcon) {
        evText.textContent = ev.title;
        evTimer.textContent = `${ev.duration}s`;
        evIcon.className = `ph-fill ${ev.icon} text-sm`;
        evBanner.className = `glass-panel rounded-2xl px-3 py-1 pointer-events-auto flex items-center gap-2 border animate-pulse ${ev.color}`;
        evBanner.classList.remove('hidden');
    }
}

function updateSimulationLogic(dtSeconds) {
    const dt = dtSeconds * simSpeed;
    autoFeederTimer += dt;
    passiveIncomeTimer += dt;
    snailEventTimer += dt;
    autoSaveTimer += dtSeconds; // Real time for autosaving

    if (autoSaveTimer >= 6) {
        autoSaveTimer = 0;
        saveGame(true);
    }

    // 0. Dynamic Environmental Events (Golden Hour, Bioluminescent Night, Algae Bloom, Oxygen Rush)
    if (activeTankEvent) {
        activeTankEvent.remaining -= dt;
        const evTimer = document.getElementById('hud-event-timer');
        if (evTimer) evTimer.textContent = `${Math.max(1, Math.ceil(activeTankEvent.remaining))}s`;

        if (activeTankEvent.remaining <= 0) {
            showToast(`The ${activeTankEvent.title} has settled. Tank conditions normalized.`, 'slate');
            activeTankEvent = null;
            if (typeof invalidateBgGradients === 'function') invalidateBgGradients();
            const evBanner = document.getElementById('hud-event-banner');
            if (evBanner) evBanner.classList.add('hidden');
        }
    } else {
        eventCheckTimer += dt;
        if (eventCheckTimer >= 48) {
            eventCheckTimer = 0;
            if (Math.random() < 0.5) {
                triggerRandomTankEvent();
            }
        }
    }

    // MINI-GAME EVENT: Golden Mystery Snail Spawns Pearl Egg Clutches at Waterline
    if (!state.snailClutches) state.snailClutches = [];
    if (snailEventTimer >= 42 && state.snailClutches.length < 3) {
        snailEventTimer = 0;
        if (Math.random() < 0.65) {
            const clutchX = 110 + Math.random() * (cw - 220);
            state.snailClutches.push({
                id: generateId(),
                x: clutchX,
                y: 82,
                rewardCoins: 25 + Math.floor(Math.random() * 30),
                createdAt: Date.now()
            });
            playSound('hatch');
            showToast('🐌 Golden Snail laid a Pink Pearl Clutch near the waterline! Click it to harvest!', 'pink');
        }
    }

    // 1. Water Quality & Plant Photosynthesis Dynamics
    const filterReduction = EQUIPMENT_UPGRADES.filter.levels[state.upgrades.filter || 0].reduction;
    const biome = (typeof BIOMES_CATALOG !== 'undefined' && BIOMES_CATALOG.find(b => b.id === state.currentBiome)) || (typeof BIOMES_CATALOG !== 'undefined' ? BIOMES_CATALOG[0] : null);
    const lightTheme = (typeof LIGHT_THEMES !== 'undefined' && LIGHT_THEMES[state.lightThemeIndex || 0]) || null;
    const lightBonus = (lightTheme && lightTheme.id === 'plant_rgb' ? 1.4 : 1.0) * (biome && biome.lightBonus ? biome.lightBonus : 1.0);
    const waterFactor = state.waterQuality / 100;

    let plantPurify = 0;
    if (Array.isArray(state.decorations)) {
        state.decorations.forEach(d => {
            const cat = DECOR_CATALOG.find(item => item.id === d.id);
            if (!cat) return;

            if (cat.isPlant) {
                if (typeof d.growth !== 'number') d.growth = 100;
                if (!d.stage) d.stage = 'flowering';
                if (typeof d.health !== 'number') d.health = 100;

                // Plant growth speed affected by lighting and water purity
                const growthSpeed = (cat.growthSpeed || 0.07) * lightBonus * (0.5 + waterFactor * 0.7);
                if (d.growth < 100) {
                    d.growth = Math.min(100, d.growth + growthSpeed * dt);
                    if (d.growth >= 100) {
                        d.stage = 'flowering';
                        addFloatingText(d.xRatio * cw, getSubstrateHeightAt(d.xRatio * cw) - 120, '🌸 Blooming!', '#f472b6');
                    } else if (d.growth >= 70) {
                        d.stage = 'mature';
                    } else if (d.growth >= 25) {
                        d.stage = 'sprout';
                    } else {
                        d.stage = 'seedling';
                    }
                }

                // Photosynthesis: mature & flowering plants absorb waste & generate oxygen bubbles
                const maturityRatio = d.growth / 100;
                const purityBonus = (biome && biome.waterPurityBonus) ? biome.waterPurityBonus : 1.0;
                plantPurify += (cat.waterBonus || 0.3) * maturityRatio * 0.05 * purityBonus;

                // Periodically spawn tiny oxygen micro-bubble from healthy plants
                if (d.growth >= 65 && Math.random() < 0.04 * dt && bubbles.length < 40) {
                    const px = d.xRatio * cw + (Math.random() - 0.5) * 30;
                    const py = getSubstrateHeightAt(px) - 35 - Math.random() * (cat.height * maturityRatio * 0.5);
                    bubbles.push({
                        x: px,
                        y: py,
                        r: 1.2 + Math.random() * 2.2,
                        speed: 0.9 + Math.random() * 1.0,
                        wobble: Math.random() * Math.PI * 2
                    });
                }

                // Organic waste absorption by plant roots
                if (state.waste && state.waste.length > 0 && Math.random() < 0.02 * dt) {
                    const plantX = d.xRatio * cw;
                    const nearestWasteIdx = state.waste.findIndex(w => Math.abs(w.x - plantX) < 70);
                    if (nearestWasteIdx !== -1) {
                        state.waste.splice(nearestWasteIdx, 1);
                        d.growth = Math.min(100, d.growth + 2.5);
                        spawnParticleBurst(plantX, getSubstrateHeightAt(plantX) - 12, '#34d399', 8, 'sparkle');
                    }
                }
            } else {
                plantPurify += (cat.waterBonus || 0.1) * 0.03;
            }
        });
    }

    const pollutionRate = (state.fish.length * 0.015 + state.waste.length * 0.06) * (1 - filterReduction);
    const netWaterDelta = (plantPurify - pollutionRate) * dt;
    state.waterQuality = Math.max(10, Math.min(100, state.waterQuality + netWaterDelta));

    if (state.waterQuality >= 95 && typeof updateQuestProgress === 'function') {
        updateQuestProgress('clean_water', state.waterQuality);
    }

    // 2. Smart Auto-Feeder & Vacation Mode
    const feederInterval = EQUIPMENT_UPGRADES.autofeeder.levels[state.upgrades.autofeeder || 0].interval;
    const effectiveInterval = state.vacationMode ? 14 : feederInterval;
    if (effectiveInterval > 0 && autoFeederTimer >= effectiveInterval) {
        autoFeederTimer = 0;
        if (state.fish.some(f => f.stage !== 'egg' && f.hunger < 82) && foodParticles.length < 8) {
            spawnFoodPellet(120 + Math.random() * (cw - 240), 86, 'flakes', true);
        }
    }

    // 3. Process Each Fish Lifecycle
    const newEggs = [];
    state.fish.forEach(fish => {
        const spec = SPECIES_CATALOG[fish.speciesId] || SPECIES_CATALOG.neon_tetra;
        fish.ageSeconds += dt;

        // STAGE 1: EGG / ROE HATCHING
        if (fish.stage === 'egg') {
            fish.maturity += dt * 1.15; // Hatches in ~13 seconds at 1x, or ~2.5s at 5x
            fish.y = getSubstrateHeightAt(fish.x) - 7;
            if (fish.maturity >= 15) {
                fish.stage = 'fry';
                fish.maturity = 16;
                fish.y -= 18;
                fish.vy = -1.2;
                fish.growthTimer = 1.0;
                playSound('hatch');
                if (typeof checkAchievement === 'function') {
                    checkAchievement('first_hatch', true);
                    if (fish.morph && fish.morph !== 'normal') checkAchievement('cosmic_discoverer', true);
                }
                if (fish.hybridTraits && fish.hybridTraits.isHybrid) {
                    if (typeof checkAchievement === 'function') checkAchievement('chimera_master', true);
                    spawnGrowthShockwave(fish.x, fish.y, '#e879f9', 'fry');
                    addFloatingText(fish.x, fish.y - 20, `🧬 Chimera Hatched (${fish.hybridTraits.parentNames})!`, '#e879f9');
                    showToast(`🧬 Crossbreed Egg hatched into a unique random-appearance Chimera (${fish.hybridTraits.parentNames})!`, 'pink');
                } else {
                    spawnGrowthShockwave(fish.x, fish.y, '#38bdf8', 'fry');
                    addFloatingText(fish.x, fish.y - 20, `🐣 ${fish.name} Hatched!`, '#38bdf8');
                }
                addXP(8);
            }
            return;
        }

        // Hunger decay (Fry get hungry slightly faster)
        const hungerRate = fish.stage === 'fry' ? 0.58 : (fish.stage === 'juvenile' ? 0.42 : 0.32);
        const effectiveHungerRate = state.vacationMode ? hungerRate * 0.25 : hungerRate;
        fish.hunger = Math.max(0, fish.hunger - effectiveHungerRate * dt);

        // Passive Growth when well-fed (hunger > 45)
        if (fish.hunger > 45 && fish.health > 50) {
            const growthRate = fish.stage === 'fry' ? 0.55 : (fish.stage === 'juvenile' ? 0.38 : 0.08);
            const eventGrowth = (activeTankEvent && activeTankEvent.id === 'golden_hour') ? 1.8 : 1.0;
            fish.maturity += growthRate * dt * eventGrowth;
        }

        // Check Lifecycle Stage Promotions with Dynamic Growth Effects
        if (fish.stage === 'fry' && fish.maturity >= 45) {
            fish.stage = 'juvenile';
            fish.growthTimer = 1.0;
            playSound('levelup');
            spawnGrowthShockwave(fish.x, fish.y, '#34d399', 'juvenile');
            addFloatingText(fish.x, fish.y - 28, `🌟 LEVEL UP! ${fish.name} → JUVENILE`, '#34d399');
            addXP(15);
        } else if (fish.stage === 'juvenile' && fish.maturity >= 100) {
            fish.stage = 'adult';
            fish.maturity = 100;
            fish.growthTimer = 1.0;
            playSound('levelup');
            spawnGrowthShockwave(fish.x, fish.y, '#fbbf24', 'adult');
            addFloatingText(fish.x, fish.y - 32, `👑 ADULT MATURITY! ${fish.name} (Breeding Ready)`, '#fbbf24');
            addXP(30);
            if (typeof updateQuestProgress === 'function') {
                updateQuestProgress('reach_adult', 1);
            }
            if (typeof checkAchievement === 'function') {
                checkAchievement('thriving_pop', state.fish.length >= 10);
            }
            showToast(`👑 ${fish.name} (${spec.name}) reached Adult stage and can now breed!`, 'amber');
        }

        // Health adjustments from Hunger & Water Quality
        if (fish.hunger <= 5) {
            fish.health = Math.max(5, fish.health - 0.8 * dt);
        } else if (state.waterQuality < 40) {
            fish.health = Math.max(10, fish.health - 0.5 * dt);
        } else if (fish.hunger > 60 && state.waterQuality > 75 && fish.health < 100) {
            fish.health = Math.min(100, fish.health + 0.6 * dt);
        }

        // Occasional organic waste drop
        if (Math.random() < 0.004 * dt && state.waste.length < 18) {
            state.waste.push({
                id: generateId(),
                x: Math.max(50, Math.min(cw - 50, fish.x + (Math.random() - 0.5) * 20)),
                y: getSubstrateHeightAt(fish.x) - 4,
                size: 4 + Math.random() * 3
            });
        }

        // Adult Breeding Logic
        if (fish.stage === 'adult') {
            fish.breedCooldown = Math.max(0, (fish.breedCooldown || 0) - dt);
            const maxPop = EQUIPMENT_UPGRADES.tankSize.levels[state.upgrades.tankSize || 0].maxPop;

            if (
                fish.breedCooldown <= 0 &&
                fish.hunger >= 75 &&
                fish.health >= 85 &&
                state.waterQuality >= 75 &&
                state.fish.length + newEggs.length < maxPop
            ) {
                // Look for a healthy well-fed adult partner of the same species
                const partner = state.fish.find(other =>
                    other.id !== fish.id &&
                    other.speciesId === fish.speciesId &&
                    other.stage === 'adult' &&
                    other.hunger >= 72 &&
                    other.health >= 80 &&
                    (other.breedCooldown || 0) <= 5
                );

                if (partner) {
                    fish.breedCooldown = 65 + Math.random() * 25;
                    partner.breedCooldown = 65 + Math.random() * 25;
                    const eggX = (fish.x + partner.x) / 2 + (Math.random() - 0.5) * 30;
                    const babyEgg = createFishEntity(fish.speciesId, 'egg', eggX, getSubstrateHeightAt(eggX) - 8);
                    newEggs.push(babyEgg);
                    playSound('hatch');
                    spawnParticleBurst((fish.x + partner.x) / 2, (fish.y + partner.y) / 2, '#f472b6', 28, 'heart');
                    addFloatingText(fish.x, fish.y - 25, `💕 Spawned ${spec.name} Egg!`, '#f472b6');
                    showToast(`💕 ${fish.name} & ${partner.name} spawned a new ${spec.name} Egg!`, 'pink');
                    addXP(25);
                }
            }
        }
    });

    if (newEggs.length > 0) {
        state.fish.push(...newEggs);
    }

    // 4. Passive AquaCoins & XP generation from happy fish every 10 sim seconds
    if (passiveIncomeTimer >= 10) {
        passiveIncomeTimer = 0;
        let earnedCoins = 0;
        let earnedXP = 0;
        const goldenMult = (activeTankEvent && activeTankEvent.id === 'golden_hour') ? 2 : 1;

        state.fish.forEach(f => {
            if (f.stage === 'egg' || f.health < 40) return;
            const spec = SPECIES_CATALOG[f.speciesId] || SPECIES_CATALOG.neon_tetra;
            const stageMult = f.stage === 'adult' ? 1.0 : (f.stage === 'juvenile' ? 0.5 : 0.25);
            const happyMult = f.hunger > 50 && state.waterQuality > 65 ? 1.2 : 0.6;
            const c = Math.max(1, Math.round(spec.coinRate * stageMult * happyMult * goldenMult));
            earnedCoins += c;
            earnedXP += Math.max(1, Math.round(spec.xpRate * stageMult * 0.4 * goldenMult));

            // Occasional coin bubble above adult fish
            if (f.stage === 'adult' && Math.random() < 0.45) {
                addFloatingText(f.x, f.y - 18, `+${c}🪙`, '#fbbf24');
            }
        });

        if (earnedCoins > 0) {
            state.coins += earnedCoins;
            addXP(earnedXP);
        }
    }

    // Throttle DOM HUD updates to 4 times per second to eliminate layout thrashing lag
    hudUpdateTimer += dtSeconds;
    if (hudUpdateTimer >= 0.25) {
        hudUpdateTimer = 0;
        updateHUD();
        if (selectedFishId) updateInspectorLive();
    }
}

function addXP(amount) {
    state.xp += amount;
    const needed = state.level * 100;
    if (state.xp >= needed) {
        state.xp -= needed;
        state.level += 1;
        state.coins += state.level * 25;
        playSound('levelup');
        showToast(`🎉 Level Up! Aquarium Level ${state.level} reached (+${state.level * 25}🪙 bonus!)`, 'cyan');
        if (activeDrawer === 'shop') renderDrawerContent();
    }
}

function setBiome(biomeId) {
    const b = (typeof BIOMES_CATALOG !== 'undefined') ? BIOMES_CATALOG.find(item => item.id === biomeId) : null;
    if (!b) return;
    state.currentBiome = biomeId;
    if (typeof invalidateBgGradients === 'function') {
        invalidateBgGradients();
    }
    playSound('water_drop');
    showToast(`Switched Aquarium Biome to ${b.name}!`, 'cyan');
    const biomeLabel = document.getElementById('hud-biome-name');
    if (biomeLabel) biomeLabel.textContent = b.shortName;
}

function fertilizePlant(decorUid) {
    const decor = state.decorations.find(d => d.uid === decorUid);
    if (!decor) return false;
    const cat = DECOR_CATALOG.find(c => c.id === decor.id);
    if (!cat || !cat.isPlant) {
        showToast('Only living aquatic plants can be fertilized!', 'amber');
        return false;
    }
    if ((state.fertilizerStock || 0) <= 0) {
        showToast('Out of Plant Fertilizer! Purchase more in Shop or complete Daily Quests.', 'rose');
        return false;
    }
    state.fertilizerStock--;
    decor.growth = Math.min(100, (decor.growth || 0) + 32);
    if (decor.growth >= 100) decor.stage = 'flowering';
    else if (decor.growth >= 70) decor.stage = 'mature';

    const px = decor.xRatio * cw;
    const py = getSubstrateHeightAt(px) - 60;
    playSound('quest');
    spawnParticleBurst(px, py, '#34d399', 16, 'sparkle');
    addFloatingText(px, py - 30, '+32% Growth! 🌱', '#34d399');
    showToast(`Fertilized ${cat.name}! Growth boosted.`, 'emerald');
    return true;
}

function prunePlant(decorUid) {
    const decor = state.decorations.find(d => d.uid === decorUid);
    if (!decor) return false;
    const cat = DECOR_CATALOG.find(c => c.id === decor.id);
    if (!cat || !cat.isPlant) {
        showToast('Only living aquatic plants can be pruned!', 'amber');
        return false;
    }
    if ((decor.growth || 0) < 85) {
        showToast(`${cat.name} is still developing! Wait until mature or flowering to prune.`, 'amber');
        return false;
    }

    const rewardCoins = cat.pruneReward || 25;
    const rewardXp = 15;
    state.coins += rewardCoins;
    addXP(rewardXp);
    decor.growth = 72;
    decor.stage = 'mature';

    const px = decor.xRatio * cw;
    const py = getSubstrateHeightAt(px) - 70;
    playSound('coin');
    spawnParticleBurst(px, py, '#fde047', 18, 'sparkle');
    addFloatingText(px, py - 20, `+${rewardCoins}🪙 +${rewardXp}XP Pruned! ✂️`, '#fde047');
    showToast(`Harvested cuttings from ${cat.name}! Earned +${rewardCoins}🪙 and +${rewardXp}XP.`, 'amber');
    return true;
}

