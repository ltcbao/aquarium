function switchLabTab(tab) {
    labTab = tab;
    renderDrawerContent();
}

function executeSelectiveBreeding() {
    const maxPop = EQUIPMENT_UPGRADES.tankSize.levels[state.upgrades.tankSize || 0].maxPop;
    if (state.fish.length >= maxPop) {
        showToast(`Tank capacity full (${maxPop} max)! Upgrade Aquarium Size first.`, 'rose');
        return;
    }
    if (!breedParentA || !breedParentB || breedParentA === breedParentB) {
        showToast('Please select two distinct Adult fish as Parent A and Parent B!', 'amber');
        return;
    }
    const pA = state.fish.find(f => f.id === breedParentA);
    const pB = state.fish.find(f => f.id === breedParentB);
    if (!pA || !pB) return;

    if (state.coins < 60) {
        showToast('Need 60 AquaCoins for Selective Gene Splicing.', 'rose');
        return;
    }
    state.coins -= 60;

    const isCrossSpecies = pA.speciesId !== pB.speciesId;
    const chosenSpecies = Math.random() < 0.5 ? pA.speciesId : pB.speciesId;
    const hybridTraits = isCrossSpecies ? generateHybridTraits(pA, pB) : null;

    const roll = Math.random();
    let babyMorph = 'lustre';
    if (roll < 0.25 || pA.morph === 'cosmic' || pB.morph === 'cosmic') {
        babyMorph = 'cosmic';
    } else if (roll < 0.68 || pA.morph === 'prism' || pB.morph === 'prism') {
        babyMorph = 'prism';
    }

    const spawnX = (pA.x + pB.x) * 0.5;
    const newEgg = createFishEntity(chosenSpecies, 'egg', spawnX, getSubstrateHeightAt(spawnX) - 10, babyMorph, hybridTraits);
    state.fish.push(newEgg);

    const mObj = MORPH_VARIANTS[babyMorph];
    playSound('levelup');
    spawnParticleBurst(spawnX, getSubstrateHeightAt(spawnX) - 20, '#e879f9', 36, 'heart');
    if (isCrossSpecies) {
        addFloatingText(spawnX, getSubstrateHeightAt(spawnX) - 30, `🧬 Mystery Chimera Egg!`, '#34d399');
        showToast(`🧬 Crossbred ${hybridTraits.parentNames}! When this egg hatches, it will have a randomized Chimera appearance!`, 'emerald');
    } else {
        addFloatingText(spawnX, getSubstrateHeightAt(spawnX) - 30, `🧬 ${mObj.name} Egg!`, '#e879f9');
        showToast(`🧬 Success! Spawned a ${SPECIES_CATALOG[chosenSpecies].name} (${mObj.name}) Egg!`, 'pink');
    }
    addXP(35);
    updateHUD();
    renderDrawerContent();
    saveGame(true);
}

