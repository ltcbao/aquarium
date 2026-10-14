function openInspectorForFish(fishId) {
    selectedFishId = fishId;
    const card = document.getElementById('fish-inspector');
    card.classList.remove('hidden');
    updateInspectorLive();
}

function closeInspector() {
    selectedFishId = null;
    document.getElementById('fish-inspector').classList.add('hidden');
}

function updateInspectorLive() {
    const fish = state.fish.find(f => f.id === selectedFishId);
    if (!fish) {
        closeInspector();
        return;
    }
    const spec = SPECIES_CATALOG[fish.speciesId] || SPECIES_CATALOG.neon_tetra;
    const morphInfo = MORPH_VARIANTS[fish.morph || 'normal'] || MORPH_VARIANTS.normal;
    const nameInput = document.getElementById('insp-name-input');
    if (document.activeElement !== nameInput) {
        nameInput.value = fish.name;
    }
    const hybridLabel = (fish.hybridTraits && fish.hybridTraits.isHybrid)
        ? `🧬 Chimera (${fish.hybridTraits.parentNames})`
        : spec.name;
    document.getElementById('insp-species').textContent = `${hybridLabel} • ${morphInfo.badge || spec.rarity}`;
    const badgeEl = document.getElementById('insp-badge-color');
    if (badgeEl) {
        badgeEl.innerHTML = getFishPreviewSVG(spec.id, fish.hybridTraits);
    }

    const stageLabels = {
        egg: '🥚 Roe Egg (Incubating)',
        fry: '🐣 Fry (Baby)',
        juvenile: '🐠 Juvenile',
        adult: '👑 Mature Adult'
    };
    document.getElementById('insp-stage').textContent = stageLabels[fish.stage] || fish.stage;

    const ageMins = Math.max(1, Math.floor(fish.ageSeconds / 60));
    const currentYield = fish.stage === 'adult' ? spec.coinRate : Math.max(1, Math.round(spec.coinRate * 0.4));
    document.getElementById('insp-age-income').textContent = `${ageMins}m • +${currentYield}🪙/cycle`;

    // Lifecycle progress bar
    let growthPct = 100;
    let growthLabel = 'Max Stage (Breeding Ready)';
    if (fish.stage === 'egg') {
        growthPct = Math.min(100, Math.round((fish.maturity / 15) * 100));
        growthLabel = `${growthPct}% to Hatch`;
    } else if (fish.stage === 'fry') {
        growthPct = Math.min(100, Math.round(((fish.maturity - 15) / 30) * 100));
        growthLabel = `${growthPct}% to Juvenile`;
    } else if (fish.stage === 'juvenile') {
        growthPct = Math.min(100, Math.round(((fish.maturity - 45) / 55) * 100));
        growthLabel = `${growthPct}% to Adult`;
    }
    document.getElementById('insp-growth-text').textContent = growthLabel;
    document.getElementById('insp-growth-bar').style.width = `${growthPct}%`;

    const hPct = Math.round(fish.hunger);
    document.getElementById('insp-hunger-text').textContent = `${hPct}%`;
    document.getElementById('insp-hunger-bar').style.width = `${hPct}%`;

    const hpPct = Math.round(fish.health);
    document.getElementById('insp-health-text').textContent = `${hpPct}%`;
    document.getElementById('insp-health-bar').style.width = `${hpPct}%`;

    // Breeding readiness info
    const breedEl = document.getElementById('insp-breed-status');
    if (fish.stage !== 'adult') {
        breedEl.textContent = '🌱 Grow to Adult stage to unlock breeding & egg spawning.';
    } else {
        const partnerCount = state.fish.filter(other => other.id !== fish.id && other.speciesId === fish.speciesId && other.stage === 'adult').length;
        if (partnerCount === 0) {
            breedEl.textContent = `💡 Needs 1 more Adult ${spec.name} in tank to spawn eggs.`;
        } else if (fish.breedCooldown > 0) {
            breedEl.textContent = `💕 Breeding Partner Ready! Next spawn check in ~${Math.ceil(fish.breedCooldown)}s`;
        } else {
            breedEl.textContent = `💕 Ready to spawn! Keep Nutrition >75% and Water >75%.`;
        }
    }

    // Sell value calculation
    const sellVal = calculateFishSellValue(fish);
    document.getElementById('insp-sell-btn').innerHTML = `<i class="ph-fill ph-coins"></i> Sell (${sellVal}🪙)`;
}

function calculateFishSellValue(fish) {
    const spec = SPECIES_CATALOG[fish.speciesId] || SPECIES_CATALOG.neon_tetra;
    const morphMult = (MORPH_VARIANTS[fish.morph || 'normal'] || MORPH_VARIANTS.normal).mult;
    const hybridMult = (fish.hybridTraits && fish.hybridTraits.isHybrid) ? 1.35 : 1.0;
    if (fish.stage === 'egg') return Math.round(spec.eggCost * 0.7 * morphMult * hybridMult);
    if (fish.stage === 'fry') return Math.round(spec.eggCost * 1.1 * morphMult * hybridMult);
    if (fish.stage === 'juvenile') return Math.round(spec.sellBase * 0.75 * morphMult * hybridMult);
    return Math.round(spec.sellBase * morphMult * hybridMult);
}

function renameSelectedFish(newName) {
    const fish = state.fish.find(f => f.id === selectedFishId);
    if (fish && newName.trim()) {
        fish.name = newName.trim();
        showToast(`Renamed fish to "${fish.name}"`, 'cyan');
        saveGame(true);
        if (activeDrawer === 'roster') renderDrawerContent();
    }
}

function healSelectedFish() {
    const fish = state.fish.find(f => f.id === selectedFishId);
    if (!fish) return;
    if (state.coins < 5) {
        showToast('Need 5 AquaCoins for direct vitamin treatment.', 'rose');
        return;
    }
    state.coins -= 5;
    fish.health = 100;
    fish.hunger = Math.min(100, fish.hunger + 35);
    playSound('coin');
    addFloatingText(fish.x, fish.y - 20, `Full Vitality! 💚`, '#34d399');
    updateHUD();
    updateInspectorLive();
}

function sellSelectedFish() {
    const idx = state.fish.findIndex(f => f.id === selectedFishId);
    if (idx === -1) return;
    const fish = state.fish[idx];
    const val = calculateFishSellValue(fish);
    state.coins += val;
    state.fish.splice(idx, 1);
    playSound('coin');
    showToast(`Rehomed ${fish.name} to a collector for +${val}🪙`, 'amber');
    closeInspector();
    updateHUD();
    if (activeDrawer === 'roster') renderDrawerContent();
    saveGame(true);
}

