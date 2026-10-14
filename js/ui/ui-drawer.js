function openDrawer(drawerType) {
    activeDrawer = drawerType;
    const drawer = document.getElementById('side-drawer');
    drawer.classList.remove('translate-x-[120%]');
    renderDrawerContent();
}

function closeDrawer() {
    activeDrawer = null;
    const drawer = document.getElementById('side-drawer');
    if (drawer) drawer.classList.add('translate-x-[120%]');
}

function selectBreedingParent(slot, fishId) {
    if (slot === 'A') {
        if (breedParentB === fishId) breedParentB = breedParentA;
        breedParentA = fishId;
    } else {
        if (breedParentA === fishId) breedParentA = breedParentB;
        breedParentB = fishId;
    }
    playSound('bubble');
    renderDrawerContent();
}

function autoAssignBreedingSlot(fishId) {
    if (breedParentA === fishId) {
        breedParentA = null;
    } else if (breedParentB === fishId) {
        breedParentB = null;
    } else if (!breedParentA) {
        breedParentA = fishId;
    } else if (!breedParentB) {
        breedParentB = fishId;
    } else {
        breedParentA = breedParentB;
        breedParentB = fishId;
    }
    playSound('bubble');
    renderDrawerContent();
}

function renderDrawerContent() {
    const container = document.getElementById('drawer-content');
    const title = document.getElementById('drawer-title');
    const subtitle = document.getElementById('drawer-subtitle');
    const icon = document.getElementById('drawer-icon');

    if (activeDrawer === 'shop') {
        title.textContent = 'Fish Hatchery & Species Catalog';
        subtitle.textContent = 'Visual Species Guide • Buy Roe Eggs or Juveniles';
        icon.className = 'ph-fill ph-storefront text-2xl text-cyan-400';

        container.innerHTML = Object.values(SPECIES_CATALOG).map(spec => {
            const locked = state.level < spec.unlockLevel;
            return `
                <div class="shop-card p-3.5 rounded-2xl bg-slate-900/85 border ${locked ? 'border-slate-800 opacity-65' : 'border-slate-700/80 hover:border-cyan-400/60'} transition space-y-3">
                    <div class="flex items-center gap-3.5">
                        <!-- Visual Fish Illustration Thumbnail -->
                        <div class="shop-preview-box w-28 h-20 shrink-0 rounded-xl border border-cyan-500/35 flex items-center justify-center p-1 relative shadow-inner">
                            ${getFishPreviewSVG(spec.id)}
                            <span class="absolute bottom-1 right-1.5 text-[9px] font-mono-num px-1 rounded bg-slate-950/80 text-cyan-300 border border-cyan-500/20">${spec.swimZone.toUpperCase()}</span>
                        </div>

                        <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between gap-1">
                                <h4 class="font-bold text-sm text-white truncate">${spec.name}</h4>
                                <span class="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${spec.rarityColor}">${spec.rarity}</span>
                            </div>
                            <div class="text-[11px] italic text-slate-400 truncate">${spec.scientific}</div>
                            <div class="flex items-center gap-3 mt-1 text-xs font-mono-num">
                                <span class="text-amber-300 font-bold">+${spec.coinRate}🪙/cycle</span>
                                <span class="text-slate-400 text-[11px]">Sell: ${spec.sellBase}🪙</span>
                            </div>
                        </div>
                    </div>

                    <p class="text-xs text-slate-300 leading-relaxed">${spec.description}</p>
                    ${locked ? `
                        <div class="py-1.5 px-3 rounded-xl bg-slate-800/90 text-slate-400 text-xs font-semibold flex items-center justify-center gap-1.5">
                            <i class="ph-fill ph-lock-key"></i> Unlocks at Aquarium Level ${spec.unlockLevel}
                        </div>
                    ` : `
                        <div class="grid grid-cols-2 gap-2 pt-0.5">
                            <button onclick="buyFish('${spec.id}', 'egg')" class="py-2 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition">
                                <span>🥚 Roe Egg</span>
                                <span class="font-mono-num font-bold text-amber-300">${spec.eggCost}🪙</span>
                            </button>
                            <button onclick="buyFish('${spec.id}', 'juvenile')" class="py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition">
                                <span>🐠 Juvenile</span>
                                <span class="font-mono-num font-bold text-amber-300">${spec.juvenileCost}🪙</span>
                            </button>
                        </div>
                    `}
                </div>
            `;
        }).join('');
    } else if (activeDrawer === 'decor') {
        title.textContent = 'Aquascape Plants & Equipment';
        subtitle.textContent = 'Visual Catalog • Filtration, Capacity & Live Flora';
        icon.className = 'ph-fill ph-plant text-2xl text-emerald-400';

        // Equipment Upgrades Section with Visual Thumbnails
        const equipHTML = Object.entries(EQUIPMENT_UPGRADES).map(([key, eq]) => {
            const currentLvl = state.upgrades[key] || 0;
            const currObj = eq.levels[currentLvl];
            const nextObj = eq.levels[currentLvl + 1];
            return `
                <div class="p-3 rounded-2xl bg-slate-900/90 border border-indigo-500/30 flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                        <div class="w-14 h-14 shrink-0 rounded-xl bg-indigo-950/70 border border-indigo-400/30 p-1.5 flex items-center justify-center shadow-inner">
                            ${getEquipPreviewSVG(key)}
                        </div>
                        <div>
                            <div class="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                                <i class="ph-fill ${eq.icon}"></i> ${eq.name}
                            </div>
                            <div class="text-sm font-bold text-white mt-0.5">${currObj.name}</div>
                            <div class="text-[11px] text-slate-400">Tier ${currentLvl + 1} / ${eq.levels.length}</div>
                        </div>
                    </div>
                    ${nextObj ? `
                        <button onclick="buyUpgrade('${key}')" class="shrink-0 px-3 py-2 rounded-xl bg-indigo-500/25 hover:bg-indigo-500/40 border border-indigo-400/40 text-xs font-bold text-white transition">
                            Upgrade (${nextObj.cost}🪙)
                        </button>
                    ` : `
                        <span class="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold">MAXED</span>
                    `}
                </div>
            `;
        }).join('');

        // Decorations Section with Visual Thumbnails
        const decorHTML = DECOR_CATALOG.map(d => {
            const ownedCount = state.decorations.filter(item => item.id === d.id).length;
            return `
                <div class="shop-card p-3 rounded-2xl bg-slate-900/80 border border-slate-700/80 hover:border-emerald-400/50 flex items-center justify-between gap-3 transition">
                    <div class="flex items-center gap-3">
                        <div class="shop-preview-box w-16 h-16 shrink-0 rounded-xl border border-emerald-500/35 p-1 flex items-center justify-center shadow-inner">
                            ${getDecorPreviewSVG(d.id)}
                        </div>
                        <div>
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="font-bold text-sm text-white">${d.name}</span>
                                <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">${d.category}</span>
                            </div>
                            <p class="text-xs text-slate-400 mt-0.5 leading-snug">${d.desc}</p>
                            <div class="text-[11px] text-cyan-300 mt-1 font-medium">In Tank: ${ownedCount} • Water Purify +${Math.round(d.waterBonus * 100)}%</div>
                        </div>
                    </div>
                    <div class="flex flex-col gap-1 shrink-0">
                        <button onclick="buyDecoration('${d.id}')" class="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/40 text-emerald-200 text-xs font-bold transition">
                            + Buy (${d.cost}🪙)
                        </button>
                        ${ownedCount > 0 ? `
                            <button onclick="removeDecoration('${d.id}')" class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 text-[11px] transition">
                                Remove 1
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">Tech & Life Support Upgrades</div>
            ${equipHTML}
            <div class="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 pt-2">Live Aquatic Plants & Hardscape</div>
            ${decorHTML}
        `;
    } else if (activeDrawer === 'roster') {
        title.textContent = `Aquarium Fish Roster (${state.fish.length})`;
        subtitle.textContent = 'Click any fish to inspect, rename, or monitor lifecycle';
        icon.className = 'ph-fill ph-list-magnifying-glass text-2xl text-indigo-400';

        if (state.fish.length === 0) {
            container.innerHTML = `<div class="p-8 text-center text-slate-400 text-sm">Your aquarium is currently empty. Visit the Fish Hatchery to adopt Eggs or Juveniles!</div>`;
            return;
        }

        container.innerHTML = state.fish.map(f => {
            const spec = SPECIES_CATALOG[f.speciesId] || SPECIES_CATALOG.neon_tetra;
            const morphBadge = (MORPH_VARIANTS[f.morph || 'normal'] || MORPH_VARIANTS.normal).badge;
            const isHyb = f.hybridTraits && f.hybridTraits.isHybrid;
            return `
                <div onclick="openInspectorForFish('${f.id}')" class="cursor-pointer p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/70 hover:border-cyan-400/50 flex items-center justify-between gap-3 transition">
                    <div class="flex items-center gap-3">
                        <div class="w-14 h-11 rounded-xl flex items-center justify-center border border-cyan-500/30 bg-slate-950/80 p-1 relative">
                            ${getFishPreviewSVG(spec.id, f.hybridTraits)}
                            <span class="absolute -top-1.5 -left-1.5 text-xs">${f.stage === 'egg' ? '🥚' : (f.stage === 'fry' ? '🐣' : '🐠')}</span>
                        </div>
                        <div>
                            <div class="font-bold text-sm text-white flex items-center gap-1.5 flex-wrap">
                                <span>${f.name}</span>
                                <span class="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">${f.stage}</span>
                                ${morphBadge ? `<span class="text-[10px] px-1.5 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/30">${morphBadge}</span>` : ''}
                                ${isHyb ? `<span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">🧬 Chimera</span>` : ''}
                            </div>
                            <div class="text-xs text-slate-400">${isHyb ? `Hybrid (${f.hybridTraits.parentNames})` : spec.name}</div>
                        </div>
                    </div>
                    <div class="text-right text-xs font-mono-num">
                        <div class="text-emerald-300">Food: ${Math.round(f.hunger)}%</div>
                        <div class="text-slate-400">HP: ${Math.round(f.health)}%</div>
                    </div>
                </div>
            `;
        }).join('');
    } else if (activeDrawer === 'lab') {
        title.textContent = 'Genetics Lab & Fishdex Museum';
        subtitle.textContent = 'Selective Morph Crossbreeding & Collection Log';
        icon.className = 'ph-fill ph-dna text-2xl text-fuchsia-400';

        const adults = state.fish.filter(f => f.stage === 'adult');
        const totalSpecies = Object.keys(SPECIES_CATALOG).length;
        const totalPossibleMorphs = totalSpecies * 4;
        let unlockedCount = 0;
        Object.values(state.discoveredDex || {}).forEach(arr => unlockedCount += arr.length);

        const tabBar = `
            <div class="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-950/90 border border-slate-800 mb-3">
                <button onclick="switchLabTab('breed')" class="py-2 rounded-xl text-xs font-bold transition ${labTab === 'breed' ? 'bg-fuchsia-500 text-slate-950 shadow-lg' : 'text-slate-300 hover:text-white'}">
                    🧬 Selective Breeder
                </button>
                <button onclick="switchLabTab('fishdex')" class="py-2 rounded-xl text-xs font-bold transition ${labTab === 'fishdex' ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'text-slate-300 hover:text-white'}">
                    📖 Fishdex (${unlockedCount}/${totalPossibleMorphs})
                </button>
            </div>
        `;

        if (labTab === 'breed') {
            // Auto-preselect 2 adults if none selected yet and at least 2 exist
            if (adults.length >= 2) {
                if (!breedParentA || !adults.some(a => a.id === breedParentA)) {
                    breedParentA = adults[0].id;
                }
                if (!breedParentB || !adults.some(a => a.id === breedParentB) || breedParentB === breedParentA) {
                    const second = adults.find(a => a.id !== breedParentA);
                    breedParentB = second ? second.id : null;
                }
            }

            const pA = adults.find(a => a.id === breedParentA) || null;
            const pB = adults.find(a => a.id === breedParentB) || null;
            const specA = pA ? SPECIES_CATALOG[pA.speciesId] : null;
            const specB = pB ? SPECIES_CATALOG[pB.speciesId] : null;
            const morphA = pA ? (MORPH_VARIANTS[pA.morph || 'normal'] || MORPH_VARIANTS.normal) : null;
            const morphB = pB ? (MORPH_VARIANTS[pB.morph || 'normal'] || MORPH_VARIANTS.normal) : null;

            // Calculate real-time offspring mutation probabilities for visual preview
            const hasCosmicParent = (pA && pA.morph === 'cosmic') || (pB && pB.morph === 'cosmic');
            const hasPrismParent = (pA && pA.morph === 'prism') || (pB && pB.morph === 'prism');
            const cosmicChance = hasCosmicParent ? 100 : 25;
            const prismChance = hasCosmicParent ? 0 : (hasPrismParent ? 75 : 43);
            const lustreChance = Math.max(0, 100 - cosmicChance - prismChance);

            const parentOptionsA = adults.map(a => {
                const sp = SPECIES_CATALOG[a.speciesId];
                const m = MORPH_VARIANTS[a.morph || 'normal'];
                return `<option value="${a.id}" ${breedParentA === a.id ? 'selected' : ''}>${a.name} — ${sp.name} (${m.name})</option>`;
            }).join('');
            const parentOptionsB = adults.map(a => {
                const sp = SPECIES_CATALOG[a.speciesId];
                const m = MORPH_VARIANTS[a.morph || 'normal'];
                return `<option value="${a.id}" ${breedParentB === a.id ? 'selected' : ''}>${a.name} — ${sp.name} (${m.name})</option>`;
            }).join('');

            const visualAdultRoster = adults.map(a => {
                const sp = SPECIES_CATALOG[a.speciesId];
                const m = MORPH_VARIANTS[a.morph || 'normal'];
                const isA = breedParentA === a.id;
                const isB = breedParentB === a.id;
                return `
                    <div onclick="autoAssignBreedingSlot('${a.id}')" class="cursor-pointer p-2 rounded-2xl bg-slate-950/90 border ${isA ? 'border-fuchsia-400 bg-fuchsia-950/30' : (isB ? 'border-cyan-400 bg-cyan-950/30' : 'border-slate-800 hover:border-slate-600')} transition flex flex-col items-center text-center relative group">
                        ${isA ? `<span class="absolute top-1.5 left-1.5 z-10 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-fuchsia-500 text-slate-950 shadow">SIRE A</span>` : ''}
                        ${isB ? `<span class="absolute top-1.5 left-1.5 z-10 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-cyan-400 text-slate-950 shadow">DAM B</span>` : ''}
                        <div class="w-full h-14 rounded-xl shop-preview-box border border-slate-800 p-1 flex items-center justify-center ${getMorphAuraClass(a.morph)}">
                            ${getFishPreviewSVG(sp.id)}
                        </div>
                        <div class="font-bold text-[11px] text-white mt-1.5 truncate w-full">${a.name}</div>
                        <div class="text-[10px] text-slate-400 truncate w-full">${sp.name}</div>
                        <span class="mt-1 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-900 text-fuchsia-300 border border-fuchsia-500/30">${m.badge || '🐟 Wild'}</span>
                    </div>
                `;
            }).join('');

            container.innerHTML = `
                ${tabBar}
                <div class="p-3.5 rounded-2xl bg-slate-900/90 border border-fuchsia-500/40 space-y-3.5 shadow-inner">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold uppercase tracking-wider text-fuchsia-300 flex items-center gap-1.5">
                            <i class="ph-fill ph-dna text-sm"></i> Bio-Genetic Splicing Chamber
                        </span>
                        <span class="text-[11px] font-mono-num px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">60🪙 / Spawn</span>
                    </div>

                    ${adults.length < 2 ? `
                        <div class="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs text-amber-300 text-center space-y-2">
                            <div class="w-20 h-16 mx-auto rounded-xl shop-preview-box border border-amber-500/30 p-1.5">
                                ${getFishPreviewSVG('discus')}
                            </div>
                            <p class="leading-relaxed">
                                ⚠️ Need at least <strong>2 Mature Adult</strong> fish in your aquarium to activate the Gene Splicer! Use <strong>5x⚡ Turbo Speed</strong> and <strong>Growth Pellets</strong> to mature your juveniles.
                            </p>
                        </div>
                    ` : `
                        <!-- VISUAL BIO-CAPSULES FOR PARENT A + DNA FUSION + PARENT B -->
                        <div class="grid grid-cols-11 items-center gap-1.5 pt-1">
                            <!-- Parent A Pod -->
                            <div class="col-span-4 p-2 rounded-2xl bg-slate-950/95 border border-fuchsia-500/50 flex flex-col items-center text-center relative">
                                <span class="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/30 mb-1.5">Parent A</span>
                                <div class="w-full h-16 rounded-xl shop-preview-box border border-slate-800 p-1 flex items-center justify-center ${pA ? getMorphAuraClass(pA.morph) : ''}">
                                    ${pA ? getFishPreviewSVG(pA.speciesId) : `<i class="ph-duotone ph-fish text-2xl text-slate-600"></i>`}
                                </div>
                                <div class="font-bold text-xs text-white mt-1.5 truncate w-full">${pA ? pA.name : 'Select A'}</div>
                                <div class="text-[10px] text-cyan-300 truncate w-full">${specA ? specA.name : '—'}</div>
                                <div class="mt-1 text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-amber-200 border border-slate-700">${morphA ? (morphA.badge || '🐟 Wild 1.0x') : 'None'}</div>
                            </div>

                            <!-- DNA Helix Bridge & Predicted Hybrid Egg -->
                            <div class="col-span-3 flex flex-col items-center justify-center text-center">
                                <div class="w-16 h-16 rounded-2xl bg-slate-950/90 border border-fuchsia-400/40 p-1 flex items-center justify-center dna-core-anim">
                                    ${getLabEggPreviewSVG(pA, pB)}
                                </div>
                                <span class="text-[9px] font-bold text-fuchsia-300 mt-1 uppercase tracking-wider">Hybrid Roe</span>
                                <span class="text-[9px] text-emerald-300 font-semibold">${specA && specB ? (specA.id === specB.id ? 'Purebred' : '🎲 Random Chimera') : ''}</span>
                            </div>

                            <!-- Parent B Pod -->
                            <div class="col-span-4 p-2 rounded-2xl bg-slate-950/95 border border-cyan-500/50 flex flex-col items-center text-center relative">
                                <span class="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 mb-1.5">Parent B</span>
                                <div class="w-full h-16 rounded-xl shop-preview-box border border-slate-800 p-1 flex items-center justify-center ${pB ? getMorphAuraClass(pB.morph) : ''}">
                                    ${pB ? getFishPreviewSVG(pB.speciesId) : `<i class="ph-duotone ph-fish text-2xl text-slate-600"></i>`}
                                </div>
                                <div class="font-bold text-xs text-white mt-1.5 truncate w-full">${pB ? pB.name : 'Select B'}</div>
                                <div class="text-[10px] text-cyan-300 truncate w-full">${specB ? specB.name : '—'}</div>
                                <div class="mt-1 text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-amber-200 border border-slate-700">${morphB ? (morphB.badge || '🐟 Wild 1.0x') : 'None'}</div>
                            </div>
                        </div>

                        <!-- Live Predicted Offspring Morph Odds -->
                        <div class="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
                            <div class="flex justify-between text-[10px] font-semibold">
                                <span class="text-slate-300">Predicted Offspring Mutation Odds:</span>
                                <span class="text-fuchsia-300 font-mono-num">100% Rare Morph Guaranteed</span>
                            </div>
                            <div class="w-full h-2.5 rounded-full overflow-hidden flex bg-slate-900 border border-slate-800">
                                <div style="width: ${lustreChance}%" class="bg-cyan-400 transition-all" title="Starlight Metallic"></div>
                                <div style="width: ${prismChance}%" class="bg-gradient-to-r from-pink-500 to-amber-400 transition-all" title="Rainbow Pearl"></div>
                                <div style="width: ${cosmicChance}%" class="bg-gradient-to-r from-purple-600 to-fuchsia-400 transition-all" title="Cosmic Void"></div>
                            </div>
                            <div class="flex justify-between text-[10px] font-mono-num pt-0.5">
                                <span class="text-cyan-300">✨ Metallic: ${lustreChance}%</span>
                                <span class="text-pink-300">🌈 Prismatic: ${prismChance}%</span>
                                <span class="text-purple-300">🌌 Cosmic: ${cosmicChance}%</span>
                            </div>
                        </div>

                        <!-- Quick Dropdown Selectors -->
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="text-[10px] font-semibold text-fuchsia-300">Switch Parent A</label>
                                <select onchange="selectBreedingParent('A', this.value)" class="w-full mt-0.5 p-1.5 rounded-xl bg-slate-950 border border-slate-700 text-[11px] text-white">
                                    ${parentOptionsA}
                                </select>
                            </div>
                            <div>
                                <label class="text-[10px] font-semibold text-cyan-300">Switch Parent B</label>
                                <select onchange="selectBreedingParent('B', this.value)" class="w-full mt-0.5 p-1.5 rounded-xl bg-slate-950 border border-slate-700 text-[11px] text-white">
                                    ${parentOptionsB}
                                </select>
                            </div>
                        </div>

                        <!-- Action Button -->
                        <button onclick="executeSelectiveBreeding()" class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-500 hover:from-fuchsia-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-fuchsia-500/30 transition flex items-center justify-center gap-1.5">
                            <i class="ph-bold ph-dna text-sm"></i> Splice Genes & Spawn High-Morph Egg (60🪙)
                        </button>

                        <!-- Visual Click-to-Select Adult Gallery -->
                        <div class="pt-2 border-t border-slate-800/90 space-y-2">
                            <div class="flex items-center justify-between text-[11px]">
                                <span class="font-bold text-slate-300">Tap Any Adult Below to Assign Slot:</span>
                                <span class="text-slate-400 font-mono-num">${adults.length} Ready</span>
                            </div>
                            <div class="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                                ${visualAdultRoster}
                            </div>
                        </div>
                    `}
                </div>

                <div class="p-3.5 rounded-2xl bg-slate-900/75 border border-slate-800 space-y-2 text-xs">
                    <div class="font-bold text-white flex items-center gap-1.5"><i class="ph-fill ph-sparkle text-amber-300"></i> Genetic Morph Multipliers</div>
                    <div class="grid grid-cols-2 gap-2 text-[11px]">
                        <div class="p-2 rounded-xl bg-slate-950/80 border border-slate-800">🐟 <strong>Wild Type</strong>: 1.0x Value</div>
                        <div class="p-2 rounded-xl bg-slate-950/80 border border-cyan-500/30 text-cyan-200">✨ <strong>Metallic</strong>: 1.35x Value</div>
                        <div class="p-2 rounded-xl bg-slate-950/80 border border-pink-500/30 text-pink-200">🌈 <strong>Prismatic</strong>: 1.85x Value</div>
                        <div class="p-2 rounded-xl bg-slate-950/80 border border-purple-500/40 text-purple-200">🌌 <strong>Cosmic Void</strong>: 2.60x Value</div>
                    </div>
                </div>
            `;
        } else {
            const dexCards = Object.values(SPECIES_CATALOG).map(spec => {
                const unlockedMorphs = (state.discoveredDex && state.discoveredDex[spec.id]) || [];
                const isDiscovered = unlockedMorphs.length > 0;
                return `
                    <div class="p-3 rounded-2xl bg-slate-900/85 border ${isDiscovered ? 'border-cyan-500/30' : 'border-slate-800 opacity-55'} flex items-center justify-between gap-3">
                        <div class="flex items-center gap-3 w-full">
                            <div class="w-20 h-14 shrink-0 rounded-xl shop-preview-box border border-slate-800 p-1 flex items-center justify-center">
                                ${getFishPreviewSVG(spec.id)}
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center justify-between gap-1">
                                    <span class="font-bold text-xs text-white truncate">${spec.name}</span>
                                    <span class="text-[9px] px-1.5 py-0.5 rounded-full border ${spec.rarityColor}">${spec.rarity}</span>
                                </div>
                                <div class="flex flex-wrap gap-1 mt-1.5">
                                    ${['normal', 'lustre', 'prism', 'cosmic'].map(mKey => {
                    const hasM = unlockedMorphs.includes(mKey);
                    const label = mKey === 'normal' ? '🐟 Wild' : (mKey === 'lustre' ? '✨ Metal' : (mKey === 'prism' ? '🌈 Prism' : '🌌 Cosmic'));
                    return `<span class="text-[9px] px-1.5 py-0.5 rounded font-bold ${hasM ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/40' : 'bg-slate-950 text-slate-600 border border-slate-800'}">${label}</span>`;
                }).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            container.innerHTML = `${tabBar}<div class="space-y-2">${dexCards}</div>`;
        }
    } else if (activeDrawer === 'save') {
        title.textContent = 'Save State, Backup & Settings';
        subtitle.textContent = 'Persistent localStorage + JSON Export/Import';
        icon.className = 'ph-fill ph-floppy-disk text-2xl text-amber-400';

        container.innerHTML = `
            <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 space-y-3">
                <div class="flex items-center justify-between">
                    <div>
                        <h4 class="font-bold text-sm text-white">Vacation Mode (Safe Idle)</h4>
                        <p class="text-xs text-slate-400">Slows fish hunger by 75% and auto-drops flakes periodically.</p>
                    </div>
                    <button onclick="toggleVacationMode()" class="px-3.5 py-1.5 rounded-xl font-bold text-xs transition ${state.vacationMode ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300 border border-slate-600'}">
                        ${state.vacationMode ? 'ON' : 'OFF'}
                    </button>
                </div>

                <div class="pt-2 border-t border-slate-800 flex gap-2">
                    <button onclick="saveGame(false)" class="flex-1 py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition">
                        <i class="ph-bold ph-floppy-disk"></i> Save Now
                    </button>
                    <button onclick="exportSaveJSON()" class="flex-1 py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 font-bold text-xs flex items-center justify-center gap-1.5 transition">
                        <i class="ph-bold ph-download-simple"></i> Download JSON
                    </button>
                </div>
            </div>

            <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 space-y-2.5">
                <h4 class="font-bold text-sm text-white">Export / Import Save String (JSON)</h4>
                <p class="text-xs text-slate-400">Copy your aquarium state to move across devices or paste a backup below:</p>
                <textarea id="save-json-textarea" rows="4" class="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-[11px] font-mono-num text-cyan-200 focus:outline-none focus:border-cyan-400">${JSON.stringify(state)}</textarea>
                <div class="flex gap-2">
                    <button onclick="copySaveToClipboard()" class="flex-1 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold">
                        Copy JSON
                    </button>
                    <button onclick="importSaveFromTextarea()" class="flex-1 py-1.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-semibold">
                        Load JSON State
                    </button>
                </div>
            </div>

            <div class="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-between gap-3">
                <div>
                    <h4 class="font-bold text-sm text-rose-200">Reset Aquarium</h4>
                    <p class="text-xs text-rose-300/80">Restores default starter tank and 260 AquaCoins.</p>
                </div>
                <button onclick="resetAquariumConfirm()" id="btn-reset-tank" class="px-3 py-1.5 rounded-xl bg-rose-500/25 hover:bg-rose-500/40 border border-rose-400/40 text-rose-200 text-xs font-bold transition">
                    Reset Tank
                </button>
            </div>
        `;
    } else if (activeDrawer === 'quests') {
        title.textContent = 'Missions & Achievements';
        subtitle.textContent = 'Daily Goals • Milestone Trophies & Coin Rewards';
        icon.className = 'ph-fill ph-trophy text-2xl text-amber-400';

        if (!state.quests) initQuestsState();

        const questCards = QUEST_DEFS.map(q => {
            const data = state.quests[q.id] || { progress: 0, claimed: false };
            const prog = Math.min(q.target, data.progress || 0);
            const pct = Math.min(100, Math.round((prog / q.target) * 100));
            const isReady = prog >= q.target && !data.claimed;

            return `
                <div class="p-3.5 rounded-2xl bg-slate-900/85 border ${isReady ? 'border-amber-400/80 shadow-lg shadow-amber-500/20' : 'border-slate-700/80'} space-y-2.5 transition">
                    <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-xl border flex items-center justify-center ${q.color}">
                                <i class="ph-fill ${q.icon} text-base"></i>
                            </div>
                            <div>
                                <h4 class="font-bold text-xs sm:text-sm text-white">${q.title}</h4>
                                <p class="text-[11px] text-slate-400">${q.desc}</p>
                            </div>
                        </div>
                        <div>
                            ${data.claimed ? `
                                <span class="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs font-semibold flex items-center gap-1">
                                    <i class="ph-bold ph-check text-emerald-400"></i> Done
                                </span>
                            ` : isReady ? `
                                <button onclick="claimQuestReward('${q.id}')" class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/30 transition animate-pulse">
                                    Claim +${q.rewardCoins}🪙
                                </button>
                            ` : `
                                <span class="text-xs font-mono-num text-slate-300 font-semibold px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                                    ${prog}/${q.target}
                                </span>
                            `}
                        </div>
                    </div>
                    <div class="space-y-1">
                        <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div class="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-300" style="width: ${pct}%"></div>
                        </div>
                        <div class="flex justify-between text-[10px] text-slate-400 font-mono-num">
                            <span>Reward: +${q.rewardCoins}🪙 • +${q.rewardXP}XP</span>
                            <span>${pct}%</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const achCards = ACHIEVEMENT_DEFS.map(a => {
            const data = (state.achievements && state.achievements[a.id]) || { unlocked: false };
            return `
                <div class="p-3 rounded-2xl bg-slate-900/70 border ${data.unlocked ? 'border-amber-400/50 bg-amber-500/5' : 'border-slate-800/80 opacity-60'} flex items-center justify-between gap-3">
                    <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-xl border flex items-center justify-center ${a.color}">
                            <i class="ph-fill ${a.icon} text-base"></i>
                        </div>
                        <div>
                            <h4 class="font-bold text-xs text-white">${a.title}</h4>
                            <p class="text-[11px] text-slate-400">${a.desc}</p>
                        </div>
                    </div>
                    <div class="shrink-0">
                        ${data.unlocked ? `
                            <span class="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                                <i class="ph-fill ph-check-circle"></i> +${a.rewardCoins}🪙
                            </span>
                        ` : `
                            <span class="text-[10px] text-slate-500 flex items-center gap-1">
                                <i class="ph-fill ph-lock-key"></i> +${a.rewardCoins}🪙
                            </span>
                        `}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="space-y-4">
                <div>
                    <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                        <i class="ph-fill ph-check-square text-cyan-400"></i> Daily Missions
                    </h3>
                    <div class="space-y-2.5">${questCards}</div>
                </div>
                <div class="pt-2 border-t border-slate-800">
                    <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                        <i class="ph-fill ph-medal text-amber-400"></i> Lifetime Achievements
                    </h3>
                    <div class="space-y-2">${achCards}</div>
                </div>
            </div>
        `;
    }
}

function claimQuestReward(questId) {
    if (!state.quests) initQuestsState();
    const q = state.quests[questId];
    const def = QUEST_DEFS.find(item => item.id === questId);
    if (!q || !def || q.claimed || q.progress < def.target) return;

    q.claimed = true;
    state.coins += def.rewardCoins;
    addXP(def.rewardXP);
    playSound('coin');
    spawnParticleBurst(cw * 0.5, ch * 0.4, '#fbbf24', 28, 'sparkle');
    addFloatingText(cw * 0.5, ch * 0.4, `+${def.rewardCoins}🪙 +${def.rewardXP}XP`, '#fbbf24');
    showToast(`Claimed quest reward: +${def.rewardCoins}🪙 & +${def.rewardXP}XP!`, 'amber');
    updateHUD();
    renderDrawerContent();
    saveGame(true);
}

