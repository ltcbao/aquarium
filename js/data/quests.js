// AquaVerse Quests & Achievements Catalog
const QUEST_DEFS = [
    {
        id: 'feed_fish',
        title: 'Nutritious Feast',
        desc: 'Feed fish 8 times with flakes or pellets',
        target: 8,
        icon: 'ph-bowl-food',
        color: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
        rewardCoins: 45,
        rewardXP: 30
    },
    {
        id: 'clean_water',
        title: 'Pristine Waters',
        desc: 'Maintain water quality at 95% or higher',
        target: 95,
        type: 'threshold',
        icon: 'ph-drop',
        color: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30',
        rewardCoins: 50,
        rewardXP: 35
    },
    {
        id: 'siphon_waste',
        title: 'Tank Janitor',
        desc: 'Clean 4 biological waste spots from substrate',
        target: 4,
        icon: 'ph-broom',
        color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
        rewardCoins: 40,
        rewardXP: 25
    },
    {
        id: 'laser_play',
        title: 'Playful Aquatic Laser',
        desc: 'Play with fish using the Laser Toy for 12 seconds',
        target: 12,
        icon: 'ph-crosshair',
        color: 'text-rose-400 bg-rose-500/15 border-rose-500/30',
        rewardCoins: 55,
        rewardXP: 40
    },
    {
        id: 'harvest_clutch',
        title: 'Snail Bounty',
        desc: 'Harvest a Golden Snail Pearl Clutch',
        target: 1,
        icon: 'ph-sparkle',
        color: 'text-fuchsia-400 bg-fuchsia-500/15 border-fuchsia-500/30',
        rewardCoins: 60,
        rewardXP: 45
    },
    {
        id: 'reach_adult',
        title: 'Caring Breeder',
        desc: 'Nurture a fish to reach the Adult stage',
        target: 1,
        icon: 'ph-crown',
        color: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30',
        rewardCoins: 75,
        rewardXP: 60
    }
];

const ACHIEVEMENT_DEFS = [
    {
        id: 'first_hatch',
        title: 'First Life',
        desc: 'Hatch your very first Roe Egg into a Fry',
        icon: 'ph-egg',
        color: 'text-cyan-300 border-cyan-500/40 bg-cyan-500/20',
        rewardCoins: 100,
        rewardXP: 80
    },
    {
        id: 'chimera_master',
        title: 'Master Geneticist',
        desc: 'Successfully breed a hybrid Chimera crossbreed in the Lab',
        icon: 'ph-dna',
        color: 'text-fuchsia-300 border-fuchsia-500/40 bg-fuchsia-500/20',
        rewardCoins: 250,
        rewardXP: 200
    },
    {
        id: 'thriving_pop',
        title: 'Bustling Aquarium',
        desc: 'Have 10 or more swimming fish and creatures in your tank',
        icon: 'ph-fish-simple',
        color: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/20',
        rewardCoins: 180,
        rewardXP: 150
    },
    {
        id: 'cosmic_discoverer',
        title: 'Starlight Collector',
        desc: 'Discover or hatch a Rare Morph (Metallic, Prismatic, or Cosmic)',
        icon: 'ph-star',
        color: 'text-purple-300 border-purple-500/40 bg-purple-500/20',
        rewardCoins: 300,
        rewardXP: 250
    },
    {
        id: 'speed_demon',
        title: 'Turbo Aquarist',
        desc: 'Run simulation at 5x speed for rapid lifecycle generation',
        icon: 'ph-lightning',
        color: 'text-amber-300 border-amber-500/40 bg-amber-500/20',
        rewardCoins: 80,
        rewardXP: 50
    }
];

function initQuestsState() {
    if (!state.quests) state.quests = {};
    if (!state.achievements) state.achievements = {};

    QUEST_DEFS.forEach(q => {
        if (!state.quests[q.id]) {
            state.quests[q.id] = { progress: 0, claimed: false };
        }
    });

    ACHIEVEMENT_DEFS.forEach(a => {
        if (!state.achievements[a.id]) {
            state.achievements[a.id] = { unlocked: false, claimed: false };
        }
    });
}

function updateQuestProgress(questId, amount = 1) {
    if (!state.quests) initQuestsState();
    const q = state.quests[questId];
    const def = QUEST_DEFS.find(item => item.id === questId);
    if (!q || !def || q.claimed) return;

    if (def.type === 'threshold') {
        q.progress = amount;
    } else {
        q.progress = Math.min(def.target, (q.progress || 0) + amount);
    }

    if (q.progress >= def.target && !q.notified) {
        q.notified = true;
        playSound('levelup');
        showToast(`🏆 Quest Complete: ${def.title}! Claim your reward in Quests tab!`, 'emerald');
        const qBadge = document.getElementById('hud-quest-badge');
        if (qBadge) qBadge.classList.remove('hidden');
    }
}

function checkAchievement(achId, conditionMet = true) {
    if (!state.achievements) initQuestsState();
    const ach = state.achievements[achId];
    const def = ACHIEVEMENT_DEFS.find(item => item.id === achId);
    if (!ach || !def || ach.unlocked) return;

    if (conditionMet) {
        ach.unlocked = true;
        ach.unlockedAt = Date.now();
        playSound('levelup');
        spawnParticleBurst(cw * 0.5, ch * 0.35, '#f59e0b', 36, 'sparkle');
        addFloatingText(cw * 0.5, ch * 0.35, `🌟 Achievement Unlocked: ${def.title}!`, '#f59e0b');
        showToast(`🌟 Achievement Unlocked: ${def.title} (+${def.rewardCoins}🪙)!`, 'amber');
        state.coins += def.rewardCoins;
        addXP(def.rewardXP);
        ach.claimed = true;
        updateHUD();
        saveGame(true);
    }
}
