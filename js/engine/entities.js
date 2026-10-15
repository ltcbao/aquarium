function generateHybridTraits(parentA, parentB) {
    const specA = SPECIES_CATALOG[parentA.speciesId] || SPECIES_CATALOG.neon_tetra;
    const specB = SPECIES_CATALOG[parentB.speciesId] || SPECIES_CATALOG.neon_tetra;
    const allSpecs = Object.values(SPECIES_CATALOG);
    const randomSpec = allSpecs[Math.floor(Math.random() * allSpecs.length)];

    const shapesPool = [specA.bodyShape, specB.bodyShape, randomSpec.bodyShape];
    const chosenShape = shapesPool[Math.floor(Math.random() * shapesPool.length)];

    const patternPool = [specA.id, specB.id, randomSpec.id];
    const chosenPattern = patternPool[Math.floor(Math.random() * patternPool.length)];

    const randHex = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    const colorPoolA = [specA.primaryColor, specB.primaryColor, randomSpec.primaryColor, randHex()];
    const colorPoolB = [specB.secondaryColor, specA.secondaryColor, randomSpec.secondaryColor, randHex()];
    const finPool = [specA.finColor, specB.finColor, randomSpec.finColor, 'rgba(244, 114, 182, 0.82)', 'rgba(56, 189, 248, 0.82)'];

    return {
        isHybrid: true,
        parentNames: `${specA.name.split(' ').pop()} × ${specB.name.split(' ').pop()}`,
        bodyShape: chosenShape,
        patternId: chosenPattern,
        primaryColor: colorPoolA[Math.floor(Math.random() * colorPoolA.length)],
        secondaryColor: colorPoolB[Math.floor(Math.random() * colorPoolB.length)],
        finColor: finPool[Math.floor(Math.random() * finPool.length)],
        swimZone: chosenShape === 'crab' || chosenShape === 'shrimp' ? 'bottom' : (Math.random() < 0.5 ? specA.swimZone : specB.swimZone)
    };
}

function getEffectiveSpec(fish) {
    const base = SPECIES_CATALOG[fish.speciesId] || SPECIES_CATALOG.neon_tetra;
    if (!fish.hybridTraits) return base;
    return Object.assign({}, base, {
        bodyShape: fish.hybridTraits.bodyShape || base.bodyShape,
        primaryColor: fish.hybridTraits.primaryColor || base.primaryColor,
        secondaryColor: fish.hybridTraits.secondaryColor || base.secondaryColor,
        finColor: fish.hybridTraits.finColor || base.finColor,
        swimZone: fish.hybridTraits.swimZone || base.swimZone,
        patternId: fish.hybridTraits.patternId || base.id
    });
}

function initStarterAquarium() {
    state = {
        version: 2,
        coins: 380,
        xp: 0,
        level: 1,
        waterQuality: 98,
        temperature: 25.5,
        lightThemeIndex: 0,
        vacationMode: false,
        soundEnabled: true,
        upgrades: {
            filter: 0,
            autofeeder: 0,
            tankSize: 0
        },
        fish: [],
        decorations: [
            { uid: generateId(), id: 'spiderwood_driftwood', xRatio: 0.16, growth: 100, stage: 'mature', health: 100 },
            { uid: generateId(), id: 'anubias_log', xRatio: 0.28, growth: 100, stage: 'flowering', health: 100 },
            { uid: generateId(), id: 'seiryu_rock_ridge', xRatio: 0.42 },
            { uid: generateId(), id: 'pearl_shell_castle', xRatio: 0.56 },
            { uid: generateId(), id: 'weeping_moss', xRatio: 0.70, growth: 95, stage: 'mature', health: 100 },
            { uid: generateId(), id: 'fortune_bottle', xRatio: 0.84 },
            { uid: generateId(), id: 'marimo_moss', xRatio: 0.92, growth: 100, stage: 'mature', health: 100 }
        ],
        waste: [],
        discoveredDex: {},
        snailClutches: [],
        currentBiome: 'amazon_freshwater',
        fertilizerStock: 8,
        lastSavedAt: Date.now()
    };

    // Starter showcase featuring classics & newly added species:
    state.fish.push(createFishEntity('pink_axolotl', 'adult', cw * 0.48, substrateY - 16));
    state.fish.push(createFishEntity('dumbo_octopus', 'juvenile', cw * 0.62, ch * 0.40));
    state.fish.push(createFishEntity('cardinal_tetra', 'adult', cw * 0.32, ch * 0.42));
    state.fish.push(createFishEntity('cardinal_tetra', 'adult', cw * 0.38, ch * 0.46));
    state.fish.push(createFishEntity('mandarin_fish', 'adult', cw * 0.52, ch * 0.38));
    state.fish.push(createFishEntity('dragon_seahorse', 'juvenile', cw * 0.78, ch * 0.52));
    state.fish.push(createFishEntity('cherry_shrimp', 'adult', cw * 0.22, substrateY - 14));
}

/**
 * Scans SPECIES_CATALOG and DECOR_CATALOG, automatically introducing
 * any missing new fish species and flora/hardscape into the user's active tank!
 */
function scanAndSyncEcosystem(notify = true) {
    if (!Array.isArray(state.fish)) state.fish = [];
    if (!Array.isArray(state.decorations)) state.decorations = [];

    const existingSpecies = new Set(state.fish.map(f => f.speciesId));
    const allSpecies = Object.keys(SPECIES_CATALOG);
    let newFishSpawned = 0;

    // Scan species catalog and spawn missing ones
    allSpecies.forEach(spId => {
        if (!existingSpecies.has(spId)) {
            const spec = SPECIES_CATALOG[spId];
            if (spec) {
                const stage = spec.swimZone === 'bottom' ? 'adult' : (Math.random() > 0.4 ? 'adult' : 'juvenile');
                const fish = createFishEntity(spId, stage);
                state.fish.push(fish);
                recordDexDiscovery(spId, fish.morph || 'normal');
                newFishSpawned++;
            }
        }
    });

    // Scan decorations catalog and plant missing ones along the substrate
    const existingDecorIds = new Set(state.decorations.map(d => d.id));
    let newDecorPlanted = 0;
    
    DECOR_CATALOG.forEach((cat, idx) => {
        if (!existingDecorIds.has(cat.id)) {
            const spreadRatio = 0.06 + (idx / Math.max(1, DECOR_CATALOG.length)) * 0.88;
            state.decorations.push({
                uid: generateId(),
                id: cat.id,
                xRatio: Math.min(0.94, Math.max(0.06, spreadRatio + (Math.random() - 0.5) * 0.05)),
                growth: 100,
                stage: 'flowering',
                health: 100,
                swayOffset: Math.random() * Math.PI * 2
            });
            newDecorPlanted++;
        }
    });

    if (newFishSpawned > 0 || newDecorPlanted > 0) {
        if (typeof spawnParticleBurst === 'function') {
            spawnParticleBurst(cw * 0.5, ch * 0.4, '#38bdf8', 36, 'sparkle');
        }
        if (typeof playSound === 'function') {
            playSound('levelup');
        }
        if (notify) {
            showToast(`🌿 Đã quét & render thành công ${newFishSpawned} loài cá mới và ${newDecorPlanted} thực vật / cảnh quan mới! (Tổng: ${allSpecies.length} loài & ${DECOR_CATALOG.length} cảnh quan)`, 'emerald');
        }
        if (typeof updateHUD === 'function') updateHUD();
        if (typeof saveGame === 'function') saveGame(true);
    } else if (notify) {
        showToast(`✨ Toàn bộ ${allSpecies.length} loài sinh vật và ${DECOR_CATALOG.length} thực vật / cảnh quan đã có mặt đầy đủ trong bể!`, 'cyan');
    }

    return { newFishSpawned, newDecorPlanted };
}
