function saveGame(silent = true) {
    try {
        state.lastSavedAt = Date.now();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        const ind = document.getElementById('autosave-indicator');
        if (ind) {
            ind.innerHTML = `<i class="ph-fill ph-check-circle"></i> Saved`;
            ind.classList.remove('text-amber-300');
            ind.classList.add('text-emerald-400');
        }
        if (!silent) showToast('Aquarium state saved to browser storage!', 'emerald');
    } catch (err) {
        console.error('Save failed:', err);
    }
}

function loadGame() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            initStarterAquarium();
            return;
        }
        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.fish)) {
            initStarterAquarium();
            return;
        }
        state = Object.assign({}, state, parsed);
        if (!state.discoveredDex) state.discoveredDex = {};
        if (!Array.isArray(state.snailClutches)) state.snailClutches = [];
        if (!state.quests) state.quests = {};
        if (!state.achievements) state.achievements = {};
        if (!state.currentBiome) state.currentBiome = 'amazon_freshwater';
        if (typeof state.fertilizerStock !== 'number') state.fertilizerStock = 8;
        initQuestsState();

        // Migrate existing decorations to plant lifecycle if applicable
        if (Array.isArray(state.decorations)) {
            state.decorations.forEach(d => {
                const catalogItem = DECOR_CATALOG.find(cat => cat.id === d.id);
                if (catalogItem && catalogItem.isPlant) {
                    if (typeof d.growth !== 'number') d.growth = 100;
                    if (!d.stage) d.stage = 'flowering';
                    if (typeof d.health !== 'number') d.health = 100;
                    if (typeof d.swayOffset !== 'number') d.swayOffset = Math.random() * Math.PI * 2;
                }
            });
        }

        // Auto-scan and sync any newly introduced species or flora into active aquarium
        if (typeof scanAndSyncEcosystem === 'function') {
            scanAndSyncEcosystem(false);
        }

        // Sync existing fish into Fishdex
        state.fish.forEach(f => {
            recordDexDiscovery(f.speciesId, f.morph || 'normal');
            f.x = Math.min(Math.max(60, f.x || cw * 0.5), cw - 60);
            f.y = f.stage === 'egg'
                ? substrateY - 12
                : Math.min(Math.max(110, f.y || ch * 0.5), substrateY - 18);
        });

        // Calculate gentle offline progress (capped at 2 hours so fish never unfairly die while away)
        const elapsedSec = Math.min(7200, Math.max(0, (Date.now() - (state.lastSavedAt || Date.now())) / 1000));
        if (elapsedSec > 30) {
            const adultCount = state.fish.filter(f => f.stage === 'adult' && f.health > 0).length;
            const offlineCoins = Math.floor(adultCount * (elapsedSec / 45) * 2);
            if (offlineCoins > 0) {
                state.coins += offlineCoins;
                setTimeout(() => {
                    showToast(`Welcome back! Your fish earned +${offlineCoins}🪙 while you were away.`, 'amber');
                }, 600);
            }
        }
    } catch (e) {
        console.warn('Could not parse saved aquarium, starting fresh:', e);
        initStarterAquarium();
    }
}
