function buyFish(speciesId, stage) {
    const spec = SPECIES_CATALOG[speciesId];
    if (!spec) return;
    const maxPop = EQUIPMENT_UPGRADES.tankSize.levels[state.upgrades.tankSize || 0].maxPop;
    if (state.fish.length >= maxPop) {
        showToast(`Tank capacity reached (${maxPop} max)! Upgrade your Aquarium Size in Plants & Gear.`, 'rose');
        return;
    }
    const cost = stage === 'egg' ? spec.eggCost : spec.juvenileCost;
    if (state.coins < cost) {
        showToast(`Not enough AquaCoins! Need ${cost}🪙.`, 'rose');
        return;
    }

    state.coins -= cost;
    const newFish = createFishEntity(speciesId, stage);
    state.fish.push(newFish);
    playSound('buy');
    spawnParticleBurst(newFish.x, newFish.y, spec.primaryColor, 26, 'sparkle');
    addFloatingText(newFish.x, newFish.y - 20, `✨ Welcome ${newFish.name}!`, '#34d399');
    addXP(stage === 'egg' ? 5 : 10);
    showToast(`Adopted ${spec.name} (${stage === 'egg' ? 'Roe Egg' : 'Juvenile'})!`, 'emerald');
    updateHUD();
    saveGame(true);
}

function buyUpgrade(key) {
    const eq = EQUIPMENT_UPGRADES[key];
    const currentLvl = state.upgrades[key] || 0;
    const nextObj = eq.levels[currentLvl + 1];
    if (!nextObj) return;
    if (state.coins < nextObj.cost) {
        showToast(`Need ${nextObj.cost}🪙 to unlock ${nextObj.name}.`, 'rose');
        return;
    }
    state.coins -= nextObj.cost;
    state.upgrades[key] = currentLvl + 1;
    playSound('levelup');
    addXP(25);
    showToast(`Upgraded to ${nextObj.name}!`, 'cyan');
    updateHUD();
    renderDrawerContent();
    saveGame(true);
}

function buyDecoration(decorId) {
    const item = DECOR_CATALOG.find(d => d.id === decorId);
    if (!item) return;
    if (state.coins < item.cost) {
        showToast(`Need ${item.cost}🪙 for ${item.name}.`, 'rose');
        return;
    }
    state.coins -= item.cost;
    const isPlant = !!item.isPlant;
    const newXRatio = 0.15 + Math.random() * 0.7;
    state.decorations.push({
        uid: generateId(),
        id: decorId,
        xRatio: newXRatio,
        growth: isPlant ? 50 : 100,
        stage: isPlant ? 'sprout' : 'mature',
        health: 100
    });
    playSound('buy');
    spawnParticleBurst(newXRatio * cw, substrateY - 35, '#34d399', 22, 'sparkle');
    addXP(12);
    showToast(`Planted ${item.name}! Watch it grow or care for it in "Garden" mode.`, 'emerald');
    updateHUD();
    renderDrawerContent();
    saveGame(true);
}

function removeDecoration(decorId) {
    const idx = state.decorations.findIndex(d => d.id === decorId);
    if (idx !== -1) {
        state.decorations.splice(idx, 1);
        renderDrawerContent();
        saveGame(true);
    }
}

