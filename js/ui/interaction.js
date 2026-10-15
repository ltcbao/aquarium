function handleCanvasPointerDown(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // 0. Check if user clicked on a Golden Snail Pearl Clutch Mini-Event!
    if (state.snailClutches && state.snailClutches.length > 0) {
        for (let i = state.snailClutches.length - 1; i >= 0; i--) {
            const cl = state.snailClutches[i];
            if (Math.hypot(x - cl.x, y - cl.y) < 34) {
                state.snailClutches.splice(i, 1);
                state.coins += cl.rewardCoins;
                addXP(20);
                playSound('levelup');
                spawnParticleBurst(cl.x, cl.y, '#f472b6', 28, 'heart');
                addFloatingText(cl.x, cl.y + 10, `🦪 Pearl Clutch! +${cl.rewardCoins}🪙`, '#f472b6');
                // 25% chance a bonus baby cleaner shrimp hatches from the clutch!
                const maxPop = EQUIPMENT_UPGRADES.tankSize.levels[state.upgrades.tankSize || 0].maxPop;
                if (Math.random() < 0.30 && state.fish.length < maxPop) {
                    const bonusBaby = createFishEntity('cherry_shrimp', 'fry', cl.x, cl.y + 20);
                    state.fish.push(bonusBaby);
                    showToast(`🎉 Pearl Clutch hatched a bonus Baby Red Cherry Shrimp (+${cl.rewardCoins}🪙)!`, 'emerald');
                } else {
                    showToast(`Harvested Snail Pearl Clutch for +${cl.rewardCoins}🪙 & +20 XP!`, 'amber');
                }
                if (typeof updateQuestProgress === 'function') {
                    updateQuestProgress('harvest_clutch', 1);
                }
                updateHUD();
                saveGame(true);
                return;
            }
        }
    }

    // 0.5. Check if player clicked on the Daily Fortune Bottle!
    if (state.decorations && currentMode !== 'decorate') {
        const bottleDecor = state.decorations.find(d => d.id === 'fortune_bottle');
        if (bottleDecor) {
            const bx = bottleDecor.xRatio * cw;
            const floorY = getSubstrateHeightAt(bx) + 6;
            const by = bottleDecor.yRatio !== undefined ? (bottleDecor.yRatio * ch) : floorY;
            if (Math.hypot(x - bx, y - (by - 35)) < 45) {
                if (typeof openDailyFortuneModal === 'function') {
                    openDailyFortuneModal();
                    waterRipples.push({ x, y, r: 8, alpha: 0.9 });
                    return;
                }
            }
        }
    }

    // Always allow clicking directly on a fish if close enough, or prioritize active mode
    const clickedFish = findFishAt(x, y);

    if (clickedFish) {
        // Petting Interaction: Fish nuzzles up toward touch, shoots heart bubbles, plays music box chime!
        clickedFish.vx += (x - clickedFish.x) * 0.04;
        clickedFish.vy = -1.2;
        clickedFish.hunger = Math.min(100, (clickedFish.hunger || 50) + 2); // petting comforts fish
        spawnParticleBurst(clickedFish.x, clickedFish.y - 14, '#f472b6', 12, 'heart');
        addFloatingText(clickedFish.x, clickedFish.y - 25, '❤️ (｡♥‿♥｡)', '#f472b6');
        playSound('affection');

        if (currentMode === 'inspect' || (currentMode !== 'feed' && currentMode !== 'clean' && currentMode !== 'decorate')) {
            openInspectorForFish(clickedFish.id);
            waterRipples.push({ x, y, r: 6, alpha: 0.8 });
            return;
        }
    }

    if (currentMode === 'decorate') {
        // Find nearest decoration anywhere in tank (including background/midground depths)
        let bestDecor = null;
        let bestDist = 110;
        state.decorations.forEach(d => {
            const dx = d.xRatio * cw;
            const floorY = getSubstrateHeightAt(dx) + 6;
            const dy = d.yRatio !== undefined ? (d.yRatio * ch) : floorY;
            const dist = Math.hypot(x - dx, y - (dy - 50));
            if (dist < bestDist) {
                bestDist = dist;
                bestDecor = d;
            }
        });
        if (bestDecor) {
            draggingDecor = bestDecor;
            dragOffsetX = x - bestDecor.xRatio * cw;
            const curDecorY = bestDecor.yRatio !== undefined ? (bestDecor.yRatio * ch) : (getSubstrateHeightAt(bestDecor.xRatio * cw) + 6);
            dragOffsetY = y - curDecorY;
        }
        return;
    }

    if (currentMode === 'laser') {
        waterRipples.push({ x, y, r: 8, alpha: 0.95 });
        spawnParticleBurst(x, y, '#f43f5e', 12, 'sparkle');
        playSound('laser');
        if (typeof updateQuestProgress === 'function') {
            updateQuestProgress('laser_play', 1);
        }
        return;
    }

    if (currentMode === 'garden') {
        let bestPlant = null;
        let bestDist = 75;
        if (state.decorations) {
            state.decorations.forEach(d => {
                const cat = DECOR_CATALOG.find(c => c.id === d.id);
                if (!cat || !cat.isPlant) return;
                const px = d.xRatio * cw;
                const py = getSubstrateHeightAt(px) - 50;
                const dist = Math.hypot(x - px, y - py);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestPlant = d;
                }
            });
        }
        if (bestPlant) {
            selectedPlantUid = bestPlant.uid;
            if ((bestPlant.growth || 0) >= 85) {
                prunePlant(bestPlant.uid);
            } else {
                fertilizePlant(bestPlant.uid);
            }
            updateHUD();
            saveGame(true);
        } else {
            showToast('Click directly on an aquatic plant to fertilize or prune it!', 'slate');
        }
        waterRipples.push({ x, y, r: 7, alpha: 0.85 });
        return;
    }

    if (currentMode === 'clean') {
        let cleaned = 0;
        for (let i = state.waste.length - 1; i >= 0; i--) {
            const w = state.waste[i];
            if (Math.hypot(x - w.x, y - w.y) < 55) {
                state.waste.splice(i, 1);
                cleaned++;
            }
        }
        waterRipples.push({ x, y, r: 5, alpha: 0.8 });
        if (cleaned > 0) {
            state.waterQuality = Math.min(100, state.waterQuality + cleaned * 3.5);
            state.coins += cleaned * 2;
            addXP(cleaned * 5);
            playSound('clean');
            addFloatingText(x, y - 15, `Cleaned! +${cleaned * 2}🪙`, '#34d399');
            if (typeof updateQuestProgress === 'function') {
                updateQuestProgress('siphon_waste', cleaned);
            }
            updateHUD();
        } else {
            state.waterQuality = Math.min(100, state.waterQuality + 0.5);
            playSound('bubble');
            addFloatingText(x, y - 12, `✨ Polished Glass`, '#7dd3fc');
            updateHUD();
        }
        return;
    }

    // Default: Feed Mode (or clicking open water)
    if (clickedFish && currentMode !== 'feed') {
        openInspectorForFish(clickedFish.id);
        return;
    }
    spawnFoodPellet(x, y, currentFoodType, false);
    if (typeof updateQuestProgress === 'function') {
        updateQuestProgress('feed_fish', 1);
    }
}

function findFishAt(x, y) {
    for (let i = state.fish.length - 1; i >= 0; i--) {
        const f = state.fish[i];
        const spec = SPECIES_CATALOG[f.speciesId] || SPECIES_CATALOG.neon_tetra;
        const hitRadius = f.stage === 'egg' ? 22 : spec.baseSize * 1.35 + 12;
        if (Math.hypot(x - f.x, y - f.y) <= hitRadius) {
            return f;
        }
    }
    return null;
}

// Unified Container & Pointer / Touch Event Bindings
const containerEl = document.getElementById('canvas-container') || canvas;

function updatePointerCoords(clientX, clientY) {
    const rect = containerEl.getBoundingClientRect();
    mousePos.x = clientX - rect.left;
    mousePos.y = clientY - rect.top;
    mousePos.active = true;

    if (draggingDecor && currentMode === 'decorate') {
        const x = mousePos.x - dragOffsetX;
        const y = mousePos.y - (dragOffsetY || 0);
        draggingDecor.xRatio = Math.max(0.04, Math.min(0.96, x / cw));

        const floorY = getSubstrateHeightAt(x) + 6;
        // Allow dragging anywhere from upper water (y >= 135) down to substrate floor
        const clampedY = Math.max(135, Math.min(floorY, y));
        draggingDecor.yRatio = clampedY / ch;

        // Auto-infer depth layer based on height:
        const distFromFloor = floorY - clampedY;
        if (distFromFloor < 35) {
            draggingDecor.zDepth = 0.15; // Foreground on substrate
        } else {
            const depthRatio = Math.min(1.0, distFromFloor / Math.max(50, floorY - 135));
            draggingDecor.zDepth = -0.15 - depthRatio * 0.55; // Ranges from -0.15 down to -0.70
        }
    }
}

// 1. Mouse & Stylus Pointer Events
containerEl.addEventListener('pointerdown', (e) => {
    updatePointerCoords(e.clientX, e.clientY);
    handleCanvasPointerDown(e.clientX, e.clientY);
});

containerEl.addEventListener('dblclick', (e) => {
    const rect = containerEl.getBoundingClientRect();
    triggerGlassTap(e.clientX - rect.left, e.clientY - rect.top);
});

containerEl.addEventListener('pointermove', (e) => {
    updatePointerCoords(e.clientX, e.clientY);
});

containerEl.addEventListener('pointerleave', () => {
    mousePos.active = false;
});

window.addEventListener('pointerup', () => {
    if (draggingDecor) {
        draggingDecor = null;
        if (typeof syncDecorations3D === 'function') {
            syncDecorations3D();
        }
        saveGame(true);
    }
});

// 2. Mobile Touch Event Bindings (Prevents Mobile Pull-to-Refresh & Pinch Glitches)
containerEl.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches.length > 0) {
        e.preventDefault(); // Stop mobile browser swipe-down refresh
        const t = e.touches[0];
        updatePointerCoords(t.clientX, t.clientY);
        handleCanvasPointerDown(t.clientX, t.clientY);
    }
}, { passive: false });

containerEl.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches.length > 0) {
        e.preventDefault();
        const t = e.touches[0];
        updatePointerCoords(t.clientX, t.clientY);
    }
}, { passive: false });

containerEl.addEventListener('touchend', (e) => {
    if (draggingDecor) {
        draggingDecor = null;
        if (typeof syncDecorations3D === 'function') {
            syncDecorations3D();
        }
        saveGame(true);
    }
});

function setInteractionMode(mode) {
    currentMode = mode;
    ['feed', 'clean', 'inspect', 'decorate', 'laser', 'garden'].forEach(m => {
        const btn = document.getElementById(`mode-btn-${m}`);
        const sub = document.getElementById(`sub-${m}`);
        if (m === mode) {
            if (btn) {
                btn.classList.add('active', 'text-white');
                btn.classList.remove('text-slate-300');
            }
            if (sub) sub.classList.remove('hidden');
        } else {
            if (btn) {
                btn.classList.remove('active', 'text-white');
                btn.classList.add('text-slate-300');
            }
            if (sub) sub.classList.add('hidden');
        }
    });
}

function cycleBiome() {
    if (typeof BIOMES_CATALOG === 'undefined') return;
    const biomes = BIOMES_CATALOG;
    const currentIdx = biomes.findIndex(b => b.id === state.currentBiome);
    const nextIdx = (currentIdx + 1) % biomes.length;
    setBiome(biomes[nextIdx].id);
    saveGame(true);
}

function buyMoreFertilizer() {
    if (state.coins < 15) {
        showToast('Need 15 AquaCoins to buy Plant Fertilizer (+5 Fert.)!', 'rose');
        return;
    }
    state.coins -= 15;
    state.fertilizerStock = (state.fertilizerStock || 0) + 5;
    playSound('coin');
    showToast('Purchased +5 Plant Fertilizer packets!', 'emerald');
    updateHUD();
    saveGame(true);
}

function selectFoodType(type) {
    currentFoodType = type;
    ['flakes', 'pellets', 'medicated'].forEach(t => {
        const btn = document.getElementById(`food-btn-${t}`);
        if (t === type) {
            btn.className = 'px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-cyan-400 bg-cyan-500/25 text-white flex items-center gap-1.5 transition';
        } else {
            btn.className = 'px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white flex items-center gap-1.5 transition';
        }
    });
}

function setSimSpeed(spd) {
    simSpeed = spd;
    [1, 2, 5].forEach(s => {
        const btn = document.getElementById(`speed-${s}`);
        if (s === spd) {
            btn.className = 'px-2 py-1 rounded-lg text-xs font-bold transition bg-cyan-500 text-slate-950';
        } else {
            btn.className = 'px-2 py-1 rounded-lg text-xs font-bold transition text-slate-300 hover:text-white';
        }
    });
    showToast(`Lifecycle speed set to ${spd}x`, 'cyan');
    if (spd === 5 && typeof checkAchievement === 'function') {
        checkAchievement('speed_demon', true);
    }
}

function cycleLightTheme() {
    state.lightThemeIndex = ((state.lightThemeIndex || 0) + 1) % LIGHT_THEMES.length;
    const theme = LIGHT_THEMES[state.lightThemeIndex];
    document.getElementById('light-theme-label').textContent = theme.name;
    if (typeof invalidateBgGradients === 'function') {
        invalidateBgGradients();
    }
    showToast(`Aquarium LED Spectrum: ${theme.name}`, 'cyan');
    saveGame(true);
}

function toggleAudio() {
    state.soundEnabled = !state.soundEnabled;
    const icon = document.getElementById('icon-audio');
    icon.className = state.soundEnabled ? 'ph-fill ph-speaker-high text-sm text-cyan-300' : 'ph-fill ph-speaker-slash text-sm text-slate-500';
    showToast(state.soundEnabled ? 'Water & Bubble Synthesizer Enabled' : 'Sound Muted', 'slate');
}

function performWaterChange() {
    if (state.coins < 15) {
        showToast('Need 15 AquaCoins for a conditioned 30% water change.', 'rose');
        return;
    }
    state.coins -= 15;
    state.waterQuality = Math.min(100, state.waterQuality + 35);
    state.waste = [];
    playSound('clean');
    showToast('💧 30% Water Change complete! Substrate siphoned & water crystal clear.', 'emerald');
    if (typeof updateQuestProgress === 'function') {
        updateQuestProgress('clean_water', state.waterQuality);
    }
    updateHUD();
}

function toggleFpsProfiler() {
    showFpsProfiler = !showFpsProfiler;
    const btn = document.getElementById('btn-fps-profiler');
    if (btn) {
        if (showFpsProfiler) {
            btn.classList.add('bg-cyan-500/30', 'text-cyan-300', 'border-cyan-400/60');
            btn.classList.remove('text-slate-300');
        } else {
            btn.classList.remove('bg-cyan-500/30', 'text-cyan-300', 'border-cyan-400/60');
            btn.classList.add('text-slate-300');
        }
    }
    showToast(showFpsProfiler ? '⚡ Performance Profiler & Frame Budget Overlay Enabled' : 'Performance Overlay Hidden', 'cyan');
}

let isDockCollapsed = false;

function toggleDockCollapse(forceState) {
    isDockCollapsed = (forceState !== undefined) ? forceState : !isDockCollapsed;
    const dock = document.getElementById('bottom-dock-container');
    const restoreTab = document.getElementById('btn-dock-restore-tab');
    const subToolbar = document.getElementById('sub-toolbar');
    const toggleIcon = document.getElementById('icon-toggle-dock');
    const toggleText = document.getElementById('text-toggle-dock');

    if (dock) {
        if (isDockCollapsed) {
            dock.classList.add('dock-collapsed');
            if (restoreTab) restoreTab.classList.remove('hidden');
            if (subToolbar) {
                subToolbar.classList.remove('bottom-24');
                subToolbar.classList.add('bottom-5');
            }
            if (toggleIcon) toggleIcon.className = 'ph-bold ph-caret-up text-cyan-400 text-xs';
            if (toggleText) toggleText.textContent = 'Hiện dock';
            showToast('Đã thu gọn thanh điều khiển (Nhấn H hoặc Tab để mở lại)', 'cyan');
        } else {
            dock.classList.remove('dock-collapsed');
            if (restoreTab) restoreTab.classList.add('hidden');
            if (subToolbar) {
                subToolbar.classList.add('bottom-24');
                subToolbar.classList.remove('bottom-5');
            }
            if (toggleIcon) toggleIcon.className = 'ph-bold ph-caret-down text-cyan-400 text-xs';
            if (toggleText) toggleText.textContent = 'Ẩn dock';
        }
    }
    if (typeof playSound === 'function') playSound('bubble');
}

// Global Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    const key = e.key.toLowerCase();

    if (key === '1') {
        setInteractionMode('feed');
    } else if (key === '2') {
        setInteractionMode('clean');
    } else if (key === '3') {
        setInteractionMode('inspect');
    } else if (key === '4') {
        setInteractionMode('decorate');
    } else if (key === '5' || key === 'l') {
        setInteractionMode(currentMode === 'laser' ? 'feed' : 'laser');
    } else if (key === '6' || key === 'g') {
        setInteractionMode(currentMode === 'garden' ? 'feed' : 'garden');
    } else if (key === 'h' || key === 'tab') {
        e.preventDefault();
        toggleDockCollapse();
    } else if (key === 'escape') {
        if (typeof closeDrawer === 'function') closeDrawer();
        if (typeof closeInspector === 'function') closeInspector();
    } else if (key === ' ' || e.code === 'Space') {
        e.preventDefault();
        const dropX = mousePos.active ? mousePos.x : cw * 0.5;
        const dropY = mousePos.active ? mousePos.y : ch * 0.3;
        dropFoodPellet(dropX, dropY);
    } else if (key === 'c') {
        togglePhotoMode();
    } else if (key === 't') {
        triggerGlassTap(mousePos.active ? mousePos.x : cw * 0.5, mousePos.active ? mousePos.y : ch * 0.45);
    } else if (key === 'p') {
        toggleFpsProfiler();
    } else if (key === 'b') {
        cycleBiome();
    }
});

