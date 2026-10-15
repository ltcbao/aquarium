function updateHUD() {
    document.getElementById('hud-coins').textContent = Math.floor(state.coins).toLocaleString();
    document.getElementById('hud-level').textContent = `LVL ${state.level}`;

    const neededXP = state.level * 100;
    const xpPct = Math.min(100, Math.round((state.xp / neededXP) * 100));
    document.getElementById('hud-xp-bar').style.width = `${xpPct}%`;
    document.getElementById('hud-xp-text').textContent = `${Math.floor(state.xp)} / ${neededXP} XP`;

    const wq = Math.round(state.waterQuality);
    document.getElementById('hud-water-text').textContent = `${wq}%`;
    const wBar = document.getElementById('hud-water-bar');
    wBar.style.width = `${wq}%`;
    if (wq >= 75) {
        wBar.className = 'h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-300';
    } else if (wq >= 45) {
        wBar.className = 'h-full bg-gradient-to-r from-amber-400 to-yellow-400 transition-all duration-300';
    } else {
        wBar.className = 'h-full bg-gradient-to-r from-rose-500 to-orange-500 transition-all duration-300';
    }

    const maxPop = EQUIPMENT_UPGRADES.tankSize.levels[state.upgrades.tankSize || 0].maxPop;
    const eggCount = state.fish.filter(f => f.stage === 'egg').length;
    document.getElementById('hud-pop').textContent = state.fish.length;
    document.getElementById('hud-max-pop').textContent = maxPop;

    const eggBadge = document.getElementById('hud-eggs-badge');
    if (eggCount > 0) {
        eggBadge.classList.remove('hidden');
        eggBadge.textContent = `${eggCount} Egg${eggCount > 1 ? 's' : ''}`;
    } else {
        eggBadge.classList.add('hidden');
    }

    // Sync Biome and Fertilizer HUD counters
    const biomeLabel = document.getElementById('hud-biome-name');
    if (biomeLabel && typeof BIOMES_CATALOG !== 'undefined') {
        const b = BIOMES_CATALOG.find(item => item.id === state.currentBiome) || BIOMES_CATALOG[0];
        biomeLabel.textContent = b.shortName;
    }

    const fertCounter = document.getElementById('hud-fertilizer-count');
    if (fertCounter) {
        fertCounter.textContent = `🌱 ${state.fertilizerStock || 0} Fert.`;
    }

    // Synchronize User Profile & Admin Badge
    if (typeof updateUserProfileHUD === 'function') {
        updateUserProfileHUD();
    }
}