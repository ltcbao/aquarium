function generateId() {
    return 'id_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
}

function randomFishName() {
    const base = FISH_NAMES_POOL[Math.floor(Math.random() * FISH_NAMES_POOL.length)];
    return base.charAt(0).toUpperCase() + base.slice(1);
}

function recordDexDiscovery(speciesId, morph) {
    if (!state.discoveredDex) state.discoveredDex = {};
    if (!state.discoveredDex[speciesId]) state.discoveredDex[speciesId] = [];
    if (!state.discoveredDex[speciesId].includes(morph)) {
        state.discoveredDex[speciesId].push(morph);
    }
}

/**
 * Creates a new fish or egg object
 * stage: 'egg' | 'fry' | 'juvenile' | 'adult'
 */
function createFishEntity(speciesId, stage = 'juvenile', customX = null, customY = null, forcedMorph = null, hybridTraits = null) {
    const spec = SPECIES_CATALOG[speciesId] || SPECIES_CATALOG.neon_tetra;
    const startX = customX !== null ? customX : 120 + Math.random() * (cw - 240);
    const isBottom = (hybridTraits && hybridTraits.swimZone ? hybridTraits.swimZone : spec.swimZone) === 'bottom';
    const startY = stage === 'egg'
        ? getSubstrateHeightAt(startX) - 10
        : (customY !== null ? customY : (isBottom ? getSubstrateHeightAt(startX) - 18 : 140 + Math.random() * (substrateY - 220)));

    let initialMaturity = 0;
    if (stage === 'fry') initialMaturity = 18;
    if (stage === 'juvenile') initialMaturity = 48;
    if (stage === 'adult') initialMaturity = 100;

    // Chance for rare visual genetic morph (Starlight Metallic, Rainbow Pearl, or Cosmic Nebula)
    const roll = Math.random();
    const morph = forcedMorph || (roll < 0.03 ? 'cosmic' : (roll < 0.12 ? 'prism' : (roll < 0.32 ? 'lustre' : 'normal')));
    recordDexDiscovery(spec.id, morph);

    return {
        id: generateId(),
        name: randomFishName(),
        speciesId: spec.id,
        morph: morph,
        hybridTraits: hybridTraits || null,
        stage: stage, // 'egg', 'fry', 'juvenile', 'adult'
        maturity: initialMaturity,
        hunger: 85 + Math.random() * 15,
        health: 100,
        ageSeconds: stage === 'adult' ? 180 : (stage === 'juvenile' ? 60 : 0),
        breedCooldown: 35 + Math.random() * 25,
        x: startX,
        y: startY,
        z: (Math.random() - 0.5) * 0.8,
        vz: (Math.random() - 0.5) * 0.008,
        growthTimer: 0,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 0.8,
        targetX: null,
        targetY: null,
        facing: Math.random() > 0.5 ? 1 : -1,
        tailPhase: Math.random() * Math.PI * 2,
        finPhase: Math.random() * Math.PI * 2,
        spineHistory: []
    };
}
