function getActiveStorageKey() {
    if (typeof ProfileManager !== 'undefined' && ProfileManager.getSaveKey) {
        return ProfileManager.getSaveKey();
    }
    return typeof STORAGE_KEY !== 'undefined' ? STORAGE_KEY : 'aquaverse_save_v1';
}

function saveGame(silent = true) {
    try {
        state.lastSavedAt = Date.now();
        const key = getActiveStorageKey();
        localStorage.setItem(key, JSON.stringify(state));
        const ind = document.getElementById('autosave-indicator');
        if (ind) {
            ind.innerHTML = `<i class="ph-fill ph-check-circle"></i> Saved`;
            ind.classList.remove('text-amber-300');
            ind.classList.add('text-emerald-400');
        }
        if (!silent) {
            const user = (typeof ProfileManager !== 'undefined') ? ProfileManager.getCurrentUser() : null;
            const uname = user ? user.displayName || user.username : 'bộ nhớ';
            showToast(`Đã lưu bể cá cho [${uname}]!`, 'emerald');
        }
    } catch (err) {
        console.error('Save failed:', err);
    }
}

function loadGame() {
    try {
        const key = getActiveStorageKey();
        let raw = localStorage.getItem(key);

        // Backward compatibility migration from legacy single save
        if (!raw && key.includes('player1')) {
            raw = localStorage.getItem('aquaverse_save_v1');
        }

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

        // Only auto-scan all species into active tank if user has ADMIN role
        const isAdmin = typeof ProfileManager !== 'undefined' && ProfileManager.isAdmin();
        if (isAdmin && typeof scanAndSyncEcosystem === 'function') {
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

        // Calculate gentle offline progress (capped at 4 hours = 14,400s)
        const elapsedSec = Math.min(14400, Math.max(0, (Date.now() - (state.lastSavedAt || Date.now())) / 1000));
        if (elapsedSec > 45 && state.fish.length > 0) {
            const healthyWater = (state.waterQuality || 80) >= 50;
            if (healthyWater) {
                // Gentle offline growth at realistic pace
                const offlineGrowthRate = 0.012; // points per sec (~43 pts in 1 hr)
                const growthPoints = Math.min(50, elapsedSec * offlineGrowthRate);
                let maturedCount = 0;

                state.fish.forEach(f => {
                    if (f.stage === 'egg') {
                        f.maturity = Math.min(15, (f.maturity || 0) + elapsedSec * 0.04);
                        if (f.maturity >= 15) {
                            f.stage = 'fry';
                            f.maturity = 16;
                            maturedCount++;
                        }
                    } else if (f.stage === 'fry') {
                        f.maturity = Math.min(45, (f.maturity || 16) + growthPoints);
                        if (f.maturity >= 45) {
                            f.stage = 'juvenile';
                            maturedCount++;
                        }
                    } else if (f.stage === 'juvenile') {
                        f.maturity = Math.min(100, (f.maturity || 45) + growthPoints * 0.85);
                        if (f.maturity >= 100) {
                            f.stage = 'adult';
                            maturedCount++;
                        }
                    }
                });

                if (maturedCount > 0) {
                    setTimeout(() => {
                        showToast(`✨ ${maturedCount} sinh vật đã lớn thêm trong thời gian bạn vắng mặt!`, 'emerald');
                    }, 1200);
                }
            }

            // Passive coin earnings from adult fish
            const adultCount = state.fish.filter(f => f.stage === 'adult' && f.health > 0).length;
            const offlineCoins = Math.floor(adultCount * (elapsedSec / 60) * 1.5);
            if (offlineCoins > 0) {
                state.coins += offlineCoins;
                setTimeout(() => {
                    showToast(`Chào mừng trở lại! Bể cá đã thu hoạch +${offlineCoins}🪙 khi bạn vắng mặt.`, 'amber');
                }, 600);
            }
        }
    } catch (e) {
        console.warn('Could not parse saved aquarium, starting fresh:', e);
        initStarterAquarium();
    }
}
