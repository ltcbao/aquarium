function addFloatingText(x, y, text, color = '#38bdf8') {
    if (floatingTexts.length > 20) floatingTexts.shift();
    floatingTexts.push({ x, y, text, color, alpha: 1.0 });
}

function spawnFoodPellet(x, y, type = 'flakes', free = false) {
    let cost = 0, nutrition = 24, growthBoost = 0.08, healBoost = 0, xpBoost = 2, color = '#fbbf24', radius = 3.5;
    if (type === 'pellets') {
        cost = 2; nutrition = 45; growthBoost = 0.18; xpBoost = 5; color = '#34d399'; radius = 4.5;
    } else if (type === 'medicated') {
        cost = 4; nutrition = 30; growthBoost = 0.12; healBoost = 25; xpBoost = 4; color = '#fb7185'; radius = 4.5;
    }

    if (!free && state.coins < cost) {
        showToast('Not enough AquaCoins for specialty food! Switched to free Flakes.', 'rose');
        selectFoodType('flakes');
        return;
    }
    if (!free && cost > 0) state.coins -= cost;

    // Golden Hour 2x Growth & XP Event Multiplier
    if (activeTankEvent && activeTankEvent.id === 'golden_hour') {
        growthBoost *= 2;
        xpBoost *= 2;
    }

    if (typeof updateQuestProgress === 'function') {
        updateQuestProgress('feed_fish', 1);
    }

    // Spawn 2-3 morsels per click
    const count = type === 'flakes' ? 3 : 2;
    for (let i = 0; i < count; i++) {
        foodParticles.push({
            x: x + (Math.random() - 0.5) * 26,
            y: Math.max(85, y + (Math.random() - 0.5) * 14),
            vy: 0.75 + Math.random() * 0.45,
            phase: Math.random() * Math.PI * 2,
            nutrition,
            growthBoost,
            healBoost,
            xpBoost,
            color,
            radius
        });
    }
    waterRipples.push({ x, y, r: 4, alpha: 0.75 });
    playSound('feed');
    updateHUD();
}

