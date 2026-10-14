function getFishPreviewSVG(speciesId, hybridTraits = null) {
    const filterTag = (hybridTraits && hybridTraits.isHybrid)
        ? `style="filter: hue-rotate(${Math.abs(hybridTraits.primaryColor.charCodeAt(1) * 19) % 360}deg) saturate(1.35);"`
        : '';
    const backdrop = `
        <rect width="120" height="80" rx="10" fill="#061326"/>
        <circle cx="95" cy="14" r="32" fill="#0ea5e9" opacity="0.14"/>
        <polygon points="15,0 38,0 22,80 2,80" fill="#38bdf8" opacity="0.07"/>
        <polygon points="62,0 88,0 68,80 44,80" fill="#38bdf8" opacity="0.06"/>
        <circle cx="20" cy="62" r="2" fill="#7dd3fc" opacity="0.45"/>
        <circle cx="24" cy="48" r="1.4" fill="#7dd3fc" opacity="0.35"/>
        <circle cx="102" cy="58" r="2.2" fill="#7dd3fc" opacity="0.4"/>
    `;
    const svgs = {
        neon_tetra: `
            <svg viewBox="0 0 120 80" class="w-full h-full drop-shadow">
                ${backdrop}
                <defs>
                    <linearGradient id="nt-body" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#0284c7"/>
                        <stop offset="55%" stop-color="#e2e8f0"/>
                        <stop offset="100%" stop-color="#94a3b8"/>
                    </linearGradient>
                    <filter id="glow-nt"><feDropShadow dx="0" dy="0" stdDeviation="2.5" flood-color="#38bdf8"/></filter>
                </defs>
                <polygon points="30,40 8,21 17,40 8,59" fill="#ef4444" opacity="0.92"/>
                <polygon points="52,25 65,10 74,26" fill="#bae6fd" opacity="0.75"/>
                <polygon points="50,53 58,68 70,53" fill="#ef4444" opacity="0.85"/>
                <ellipse cx="64" cy="40" rx="36" ry="15.5" fill="url(#nt-body)"/>
                <path d="M28,41 Q46,40 66,41 L64,54.5 Q45,55.5 30,45 Z" fill="#ef4444"/>
                <path d="M31,38 Q65,33 94,38" stroke="#38bdf8" stroke-width="5.5" stroke-linecap="round" fill="none" filter="url(#glow-nt)"/>
                <circle cx="88" cy="37" r="4.8" fill="#ffffff"/>
                <circle cx="89.5" cy="37" r="2.4" fill="#0f172a"/>
                <circle cx="90.5" cy="35.8" r="1" fill="#ffffff"/>
            </svg>`,
        fancy_guppy: `
            <svg viewBox="0 0 120 80" class="w-full h-full drop-shadow">
                ${backdrop}
                <defs>
                    <linearGradient id="fg-tail" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="#f43f5e"/>
                        <stop offset="50%" stop-color="#f59e0b"/>
                        <stop offset="100%" stop-color="#ec4899"/>
                    </linearGradient>
                </defs>
                <path d="M46,40 Q10,6 5,20 Q-2,40 5,60 Q10,74 46,40 Z" fill="url(#fg-tail)"/>
                <path d="M56,28 Q40,8 30,16 Q42,28 50,30 Z" fill="#fb923c"/>
                <ellipse cx="69" cy="40" rx="28" ry="13.5" fill="url(#fg-tail)"/>
                <circle cx="22" cy="30" r="3" fill="#fef08a" opacity="0.85"/>
                <circle cx="17" cy="44" r="3.5" fill="#fef08a" opacity="0.85"/>
                <circle cx="26" cy="52" r="2.5" fill="#fef08a" opacity="0.8"/>
                <circle cx="87" cy="37" r="4.2" fill="#ffffff"/>
                <circle cx="88.5" cy="37" r="2.1" fill="#0f172a"/>
                <circle cx="89.5" cy="35.8" r="0.9" fill="#ffffff"/>
            </svg>`,
        cherry_shrimp: `
            <svg viewBox="0 0 120 80" class="w-full h-full drop-shadow">
                ${backdrop}
                <path d="M82,36 Q104,16 116,24 M82,40 Q104,48 115,54" stroke="#fca5a5" stroke-width="1.6" fill="none"/>
                <line x1="45" y1="48" x2="42" y2="62" stroke="#fca5a5" stroke-width="2"/>
                <line x1="55" y1="47" x2="53" y2="62" stroke="#fca5a5" stroke-width="2"/>
                <line x1="65" y1="46" x2="65" y2="62" stroke="#fca5a5" stroke-width="2"/>
                <line x1="75" y1="46" x2="77" y2="62" stroke="#fca5a5" stroke-width="2"/>
                <path d="M88,38 Q56,16 26,44 L14,54 L28,55 Q56,42 88,38 Z" fill="#ef4444" stroke="#fca5a5" stroke-width="1.2"/>
                <circle cx="80" cy="34" r="3" fill="#020617"/>
            </svg>`,
        panda_cory: `
            <svg viewBox="0 0 120 80" class="w-full h-full drop-shadow">
                ${backdrop}
                <polygon points="28,44 12,30 16,44 12,56" fill="#fde68a"/>
                <polygon points="55,26 48,10 68,26" fill="#0f172a"/>
                <path d="M92,48 C82,22 44,24 26,44 L92,48 Z" fill="#fef3c7" stroke="#d97706" stroke-width="1.2"/>
                <rect x="72" y="25" width="11" height="23" rx="3" fill="#0f172a"/>
                <rect x="28" y="34" width="11" height="14" rx="2" fill="#0f172a"/>
                <path d="M92,48 L102,54 M90,48 L98,56" stroke="#fef3c7" stroke-width="2" stroke-linecap="round"/>
                <circle cx="78" cy="36" r="3.5" fill="#ffffff"/>
                <circle cx="79" cy="36" r="1.8" fill="#020617"/>
            </svg>`,
        pom_pom_crab: `
            <svg viewBox="0 0 120 80" class="w-full h-full drop-shadow">
                ${backdrop}
                <path d="M42,46 L24,62 M46,50 L30,66 M78,46 L96,62 M74,50 L90,66" stroke="#fb923c" stroke-width="3" stroke-linecap="round"/>
                <ellipse cx="60" cy="46" rx="22" ry="15" fill="#fb923c" stroke="#9a3412" stroke-width="2"/>
                <circle cx="28" cy="26" r="11" fill="#f472b6" opacity="0.85"/>
                <circle cx="28" cy="26" r="5" fill="#ffffff"/>
                <circle cx="92" cy="26" r="11" fill="#f472b6" opacity="0.85"/>
                <circle cx="92" cy="26" r="5" fill="#ffffff"/>
                <circle cx="52" cy="31" r="3" fill="#020617"/>
                <circle cx="68" cy="31" r="3" fill="#020617"/>
            </svg>`,
        pleco: `
            <svg viewBox="0 0 120 80" class="w-full h-full drop-shadow">
                ${backdrop}
                <polygon points="28,45 10,26 16,45 10,58" fill="#eab308" stroke="#0f172a" stroke-width="1.5"/>
                <polygon points="62,28 45,8 74,28" fill="#eab308" stroke="#0f172a" stroke-width="1.5"/>
                <path d="M96,50 C84,22 44,24 24,46 L96,50 Z" fill="#facc15" stroke="#0f172a" stroke-width="1.5"/>
                <circle cx="45" cy="40" r="4" fill="#0f172a"/>
                <circle cx="58" cy="38" r="4.5" fill="#0f172a"/>
                <circle cx="71" cy="40" r="4" fill="#0f172a"/>
                <circle cx="82" cy="39" r="3.5" fill="#ffffff"/>
                <circle cx="83" cy="39" r="1.8" fill="#020617"/>
            </svg>`,
        clownfish: `
            <svg viewBox="0 0 120 80" class="w-full h-full drop-shadow">
                ${backdrop}
                <path d="M32,40 L10,23 Q4,40 10,57 Z" fill="#f97316" stroke="#0f172a" stroke-width="2"/>
                <path d="M48,24 Q55,9 68,23 Z" fill="#f97316" stroke="#0f172a" stroke-width="2"/>
                <path d="M70,24 Q78,12 85,26 Z" fill="#f97316" stroke="#0f172a" stroke-width="2"/>
                <ellipse cx="64" cy="40" rx="34" ry="18.5" fill="#f97316" stroke="#0f172a" stroke-width="1.5"/>
                <path d="M40,23 Q44,40 40,57 L47,57 Q51,40 47,23 Z" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
                <path d="M60,21.5 Q65,40 60,58.5 L69,58.5 Q74,40 69,21.5 Z" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
                <path d="M81,25 Q85,40 81,55 L87,53 Q91,40 87,27 Z" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
                <ellipse cx="73" cy="44" rx="7.5" ry="4.8" fill="#fb923c" stroke="#0f172a" stroke-width="1.5"/>
                <circle cx="91" cy="36" r="4.2" fill="#ffffff"/>
                <circle cx="92" cy="36" r="2.2" fill="#0f172a"/>
                <circle cx="93" cy="34.8" r="0.9" fill="#ffffff"/>
            </svg>`,
        betta: `
            <svg viewBox="0 0 120 80" class="w-full h-full drop-shadow">
                ${backdrop}
                <defs>
                    <linearGradient id="bt-fin" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="#f472b6"/>
                        <stop offset="50%" stop-color="#8b5cf6"/>
                        <stop offset="100%" stop-color="#38bdf8"/>
                    </linearGradient>
                </defs>
                <path d="M50,40 Q16,2 5,18 Q-3,40 5,62 Q16,78 50,40 Z" fill="url(#bt-fin)" opacity="0.95"/>
                <path d="M68,28 Q44,2 24,13 Q36,28 52,32 Z" fill="url(#bt-fin)"/>
                <path d="M68,50 Q44,78 22,67 Q36,52 55,48 Z" fill="url(#bt-fin)"/>
                <ellipse cx="69" cy="40" rx="26" ry="11.5" fill="#5b21b6" stroke="#c084fc" stroke-width="1"/>
                <circle cx="87" cy="38" r="3.8" fill="#ffffff"/>
                <circle cx="88" cy="38" r="1.9" fill="#0f172a"/>
            </svg>`,
        angelfish: `
            <svg viewBox="0 0 120 80" class="w-full h-full drop-shadow">
                ${backdrop}
                <polygon points="34,40 12,25 19,40 12,55" fill="#cbd5e1" opacity="0.88"/>
                <path d="M64,21 Q46,1 31,3 L50,28 Z" fill="#94a3b8"/>
                <path d="M64,59 Q46,79 31,77 L50,52 Z" fill="#94a3b8"/>
                <ellipse cx="64" cy="40" rx="26" ry="22.5" fill="#f1f5f9" stroke="#64748b" stroke-width="1.2"/>
                <path d="M50,19 L48,61" stroke="#0f172a" stroke-width="4" opacity="0.85"/>
                <path d="M64,17 L62,63" stroke="#0f172a" stroke-width="5" opacity="0.9"/>
                <path d="M77,21 L76,59" stroke="#0f172a" stroke-width="3.5" opacity="0.85"/>
                <circle cx="81" cy="36" r="4.2" fill="#ef4444"/>
                <circle cx="82" cy="36" r="2.1" fill="#0f172a"/>
            </svg>`,
        discus: `
            <svg viewBox="0 0 120 80" class="w-full h-full drop-shadow">
                ${backdrop}
                <defs>
                    <radialGradient id="dc-grad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stop-color="#fb7185"/>
                        <stop offset="62%" stop-color="#06b6d4"/>
                        <stop offset="100%" stop-color="#0e7490"/>
                    </radialGradient>
                </defs>
                <polygon points="32,40 15,27 18,40 15,53" fill="#22d3ee" opacity="0.85"/>
                <circle cx="62" cy="40" r="29.5" fill="url(#dc-grad)" stroke="#67e8f9" stroke-width="1.5"/>
                <path d="M46,15 Q50,40 46,65" stroke="#67e8f9" stroke-width="2.6" fill="none"/>
                <path d="M56,11 Q60,40 56,69" stroke="#67e8f9" stroke-width="2.6" fill="none"/>
                <path d="M66,11 Q70,40 66,69" stroke="#67e8f9" stroke-width="2.6" fill="none"/>
                <path d="M76,15 Q80,40 76,65" stroke="#67e8f9" stroke-width="2.6" fill="none"/>
                <circle cx="82" cy="36" r="4.2" fill="#fbbf24"/>
                <circle cx="83" cy="36" r="2.1" fill="#0f172a"/>
            </svg>`,
        moon_jelly: `
            <svg viewBox="0 0 120 80" class="w-full h-full drop-shadow">
                ${backdrop}
                <path d="M46,38 Q40,56 48,74 M55,38 Q62,56 54,75 M65,38 Q58,56 66,75 M74,38 Q80,56 72,74" stroke="#e879f9" stroke-width="2" fill="none"/>
                <path d="M34,38 A26,24 0 0,1 86,38 Q60,45 34,38 Z" fill="#f0abfc" opacity="0.85" stroke="#38bdf8" stroke-width="1.5"/>
                <circle cx="53" cy="28" r="4" stroke="#ffffff" stroke-width="1.5" fill="none"/>
                <circle cx="67" cy="28" r="4" stroke="#ffffff" stroke-width="1.5" fill="none"/>
            </svg>`,
        blue_tang: `
            <svg viewBox="0 0 120 80" class="w-full h-full drop-shadow">
                ${backdrop}
                <polygon points="32,40 11,22 15,40 11,58" fill="#facc15" stroke="#0f172a" stroke-width="2"/>
                <ellipse cx="64" cy="40" rx="34.5" ry="20.5" fill="#2563eb" stroke="#0f172a" stroke-width="2"/>
                <path d="M32,40 Q52,24 82,30 Q65,24 44,34 Q38,40 44,46 Q62,54 74,48" stroke="#0f172a" stroke-width="5" fill="none" stroke-linecap="round"/>
                <ellipse cx="68" cy="45" rx="6.5" ry="3.8" fill="#facc15"/>
                <circle cx="86" cy="35" r="4.2" fill="#ffffff"/>
                <circle cx="87.5" cy="35" r="2.1" fill="#0f172a"/>
            </svg>`,
        flowerhorn: `
            <svg viewBox="0 0 120 80" class="w-full h-full drop-shadow">
                ${backdrop}
                <polygon points="28,40 8,22 12,40 8,58" fill="#f43f5e"/>
                <ellipse cx="60" cy="42" rx="33" ry="19" fill="#f43f5e" stroke="#38bdf8" stroke-width="1.5"/>
                <circle cx="82" cy="26" r="13" fill="#e11d48" stroke="#fda4af" stroke-width="1"/>
                <circle cx="45" cy="42" r="4.5" fill="#090d16"/>
                <circle cx="58" cy="42" r="4.5" fill="#090d16"/>
                <circle cx="71" cy="42" r="4.5" fill="#090d16"/>
                <circle cx="84" cy="38" r="4" fill="#fef08a"/>
                <circle cx="85" cy="38" r="2" fill="#020617"/>
            </svg>`,
        koi_kohaku: `
            <svg viewBox="0 0 120 80" class="w-full h-full drop-shadow">
                ${backdrop}
                <path d="M28,40 L6,20 Q14,40 6,60 Z" fill="#ffffff"/>
                <ellipse cx="62" cy="40" rx="36" ry="15" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2"/>
                <circle cx="84" cy="36" r="7" fill="#dc2626"/>
                <circle cx="58" cy="36" r="11" fill="#dc2626"/>
                <circle cx="38" cy="43" r="8" fill="#dc2626"/>
                <circle cx="89" cy="36" r="3.5" fill="#0f172a"/>
            </svg>`,
        motoro_ray: `
            <svg viewBox="0 0 120 80" class="w-full h-full drop-shadow">
                ${backdrop}
                <path d="M32,42 Q14,45 4,38" stroke="#451a03" stroke-width="3.5" fill="none" stroke-linecap="round"/>
                <ellipse cx="64" cy="42" rx="34" ry="22" fill="#78350f" stroke="#f59e0b" stroke-width="1.8"/>
                <circle cx="50" cy="35" r="4" fill="#fbbf24" stroke="#1e293b" stroke-width="1.5"/>
                <circle cx="68" cy="33" r="4" fill="#fbbf24" stroke="#1e293b" stroke-width="1.5"/>
                <circle cx="58" cy="48" r="4" fill="#fbbf24" stroke="#1e293b" stroke-width="1.5"/>
                <circle cx="76" cy="46" r="4" fill="#fbbf24" stroke="#1e293b" stroke-width="1.5"/>
            </svg>`,
        arowana: `
            <svg viewBox="0 0 120 80" class="w-full h-full drop-shadow">
                ${backdrop}
                <defs>
                    <linearGradient id="aro-gold" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="#fef08a"/>
                        <stop offset="50%" stop-color="#f59e0b"/>
                        <stop offset="100%" stop-color="#b45309"/>
                    </linearGradient>
                </defs>
                <path d="M24,40 L5,25 Q1,40 5,55 Z" fill="#f59e0b"/>
                <path d="M52,28 L23,17 L28,32 Z" fill="#d97706"/>
                <path d="M52,52 L23,63 L28,48 Z" fill="#d97706"/>
                <ellipse cx="62" cy="40" rx="42" ry="13.5" fill="url(#aro-gold)" stroke="#fef08a" stroke-width="1.4"/>
                <path d="M35,36 Q42,40 35,44 M48,35 Q55,40 48,45 M61,35 Q68,40 61,45 M74,36 Q81,40 74,44" stroke="#fef3c7" stroke-width="1.6" fill="none"/>
                <path d="M102,41 L113,36 M102,43 L112,47" stroke="#fde047" stroke-width="2.2" stroke-linecap="round"/>
                <circle cx="92" cy="37" r="4" fill="#ffffff"/>
                <circle cx="93" cy="37" r="2.1" fill="#0f172a"/>
            </svg>`,
        cardinal_tetra: `
            <svg viewBox="0 0 120 80" class="w-full h-full drop-shadow">
                ${backdrop}
                <defs>
                    <linearGradient id="ct-body" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#1d4ed8"/>
                        <stop offset="50%" stop-color="#dc2626"/>
                        <stop offset="100%" stop-color="#991b1b"/>
                    </linearGradient>
                </defs>
                <polygon points="30,40 8,21 17,40 8,59" fill="#dc2626" opacity="0.95"/>
                <polygon points="52,25 65,10 74,26" fill="#93c5fd" opacity="0.75"/>
                <polygon points="50,53 58,68 70,53" fill="#dc2626" opacity="0.85"/>
                <ellipse cx="64" cy="40" rx="36" ry="15.5" fill="url(#ct-body)"/>
                <path d="M28,41 Q64,36 100,41 L98,54.5 Q60,56 28,45 Z" fill="#dc2626"/>
                <path d="M31,37 Q65,32 94,37" stroke="#38bdf8" stroke-width="5" stroke-linecap="round" fill="none"/>
                <circle cx="88" cy="36" r="4.8" fill="#ffffff"/>
                <circle cx="89.5" cy="36" r="2.4" fill="#0f172a"/>
                <circle cx="90.5" cy="34.8" r="1" fill="#ffffff"/>
            </svg>`,
        kuhli_loach: `
            <svg viewBox="0 0 120 80" class="w-full h-full drop-shadow">
                ${backdrop}
                <path d="M20,44 Q10,40 6,34 Q10,48 18,48 Z" fill="#d97706"/>
                <path d="M22,46 Q58,34 98,42" stroke="#ea580c" stroke-width="12" stroke-linecap="round" fill="none"/>
                <path d="M34,38 L36,48 M50,37 L52,47 M66,38 L68,48 M82,39 L84,47" stroke="#451a03" stroke-width="4.5" stroke-linecap="round"/>
                <circle cx="98" cy="40" r="3.2" fill="#ffffff"/>
                <circle cx="99" cy="40" r="1.6" fill="#0f172a"/>
                <line x1="102" y1="43" x2="108" y2="46" stroke="#fbbf24" stroke-width="1.8"/>
            </svg>`,
        mandarin_fish: `
            <svg viewBox="0 0 120 80" class="w-full h-full drop-shadow">
                ${backdrop}
                <ellipse cx="60" cy="42" rx="32" ry="17" fill="#ea580c"/>
                <path d="M28,42 L10,26 Q14,42 10,58 Z" fill="#06b6d4"/>
                <path d="M46,36 Q38,42 48,50 M62,32 Q72,42 60,52 M76,34 Q82,42 74,48" stroke="#22d3ee" stroke-width="3.5" fill="none"/>
                <path d="M52,30 Q58,36 50,44" stroke="#10b981" stroke-width="2.5" fill="none"/>
                <circle cx="82" cy="38" r="4.2" fill="#ffffff"/>
                <circle cx="83.5" cy="38" r="2.2" fill="#0f172a"/>
            </svg>`,
        dragon_seahorse: `
            <svg viewBox="0 0 120 80" class="w-full h-full drop-shadow">
                ${backdrop}
                <path d="M60,18 Q72,20 74,32 Q76,46 64,54 Q54,62 58,72 Q64,74 68,68" stroke="#eab308" stroke-width="6.5" fill="none" stroke-linecap="round"/>
                <ellipse cx="52" cy="36" rx="9" ry="5" transform="rotate(-30 52 36)" fill="#10b981"/>
                <ellipse cx="72" cy="48" rx="8" ry="4" transform="rotate(30 72 48)" fill="#10b981"/>
                <ellipse cx="50" cy="56" rx="8" ry="4" transform="rotate(-20 50 56)" fill="#10b981"/>
                <circle cx="70" cy="26" r="3.2" fill="#ffffff"/>
                <circle cx="71" cy="26" r="1.6" fill="#0f172a"/>
                <line x1="75" y1="28" x2="86" y2="28" stroke="#facc15" stroke-width="2.5" stroke-linecap="round"/>
            </svg>`
    };
    if (!svgs[speciesId] && typeof SPECIES_CATALOG !== 'undefined' && SPECIES_CATALOG[speciesId]) {
        const sp = SPECIES_CATALOG[speciesId];
        const rawSvg = `
            <svg viewBox="0 0 120 80" class="w-full h-full drop-shadow">
                ${backdrop}
                <polygon points="36,40 10,20 18,40 10,60" fill="${sp.finColor || '#38bdf8'}" opacity="0.9"/>
                <ellipse cx="64" cy="40" rx="34" ry="16" fill="${sp.primaryColor || '#0ea5e9'}"/>
                <path d="M30,41 Q64,36 94,40" stroke="${sp.secondaryColor || '#ffffff'}" stroke-width="4.5" stroke-linecap="round" fill="none"/>
                <circle cx="86" cy="37" r="4.5" fill="#ffffff"/>
                <circle cx="87.5" cy="37" r="2.2" fill="#0f172a"/>
                <circle cx="88.5" cy="35.8" r="0.9" fill="#ffffff"/>
            </svg>`;
        return filterTag ? rawSvg.replace('<svg ', `<svg ${filterTag} `) : rawSvg;
    }
    const rawSvg = svgs[speciesId] || svgs.neon_tetra;
    return filterTag ? rawSvg.replace('<svg ', `<svg ${filterTag} `) : rawSvg;
}

function getDecorPreviewSVG(decorId) {
    const svgs = {
        amazon_sword: `
            <svg viewBox="0 0 80 80" class="w-full h-full">
                <path d="M40,72 Q22,42 18,14 Q34,36 40,72" fill="#10b981"/>
                <path d="M40,72 Q34,36 40,8 Q46,36 40,72" fill="#34d399"/>
                <path d="M40,72 Q58,42 62,14 Q46,36 40,72" fill="#059669"/>
                <path d="M40,72 Q14,52 10,30 Q28,48 40,72" fill="#047857"/>
                <path d="M40,72 Q66,52 70,30 Q52,48 40,72" fill="#10b981"/>
                <ellipse cx="40" cy="72" rx="18" ry="4" fill="#96713c"/>
            </svg>`,
        anubias_log: `
            <svg viewBox="0 0 80 80" class="w-full h-full">
                <path d="M10,64 Q35,34 70,44 L66,56 Q38,48 22,64 Z" fill="#78350f" stroke="#451a03" stroke-width="2"/>
                <ellipse cx="28" cy="42" rx="10" ry="6" transform="rotate(-20 28 42)" fill="#10b981"/>
                <ellipse cx="42" cy="38" rx="11" ry="6.5" fill="#34d399"/>
                <ellipse cx="55" cy="42" rx="10" ry="6" transform="rotate(20 55 42)" fill="#059669"/>
                <ellipse cx="40" cy="66" rx="28" ry="4" fill="#96713c"/>
            </svg>`,
        red_ludwigia: `
            <svg viewBox="0 0 80 80" class="w-full h-full">
                <path d="M26,70 Q22,40 28,14 M40,70 Q44,38 38,10 M54,70 Q58,42 52,16" stroke="#9f1239" stroke-width="2.5" fill="none"/>
                <ellipse cx="20" cy="26" rx="7" ry="3.5" fill="#fb7185"/>
                <ellipse cx="32" cy="26" rx="7" ry="3.5" fill="#e11d48"/>
                <ellipse cx="34" cy="40" rx="8" ry="4" fill="#f43f5e"/>
                <ellipse cx="46" cy="40" rx="8" ry="4" fill="#be123c"/>
                <ellipse cx="46" cy="24" rx="7" ry="3.5" fill="#fb7185"/>
                <ellipse cx="58" cy="24" rx="7" ry="3.5" fill="#e11d48"/>
                <ellipse cx="40" cy="70" rx="22" ry="4" fill="#96713c"/>
            </svg>`,
        dragon_stone: `
            <svg viewBox="0 0 80 80" class="w-full h-full">
                <polygon points="14,68 22,28 34,38 44,10 58,34 68,68" fill="#64748b" stroke="#334155" stroke-width="2"/>
                <circle cx="34" cy="50" r="4" fill="#1e293b"/>
                <circle cx="46" cy="36" r="3" fill="#1e293b"/>
                <circle cx="52" cy="54" r="4.5" fill="#1e293b"/>
                <ellipse cx="40" cy="68" rx="28" ry="4" fill="#96713c"/>
            </svg>`,
        air_stone: `
            <svg viewBox="0 0 80 80" class="w-full h-full">
                <circle cx="36" cy="16" r="4" fill="#bae6fd" opacity="0.8"/>
                <circle cx="45" cy="26" r="5" fill="#7dd3fc" opacity="0.85"/>
                <circle cx="38" cy="36" r="3.5" fill="#38bdf8" opacity="0.9"/>
                <polygon points="20,68 32,44 48,44 60,68" fill="#475569" stroke="#1e293b" stroke-width="2"/>
                <ellipse cx="40" cy="44" rx="8" ry="3" fill="#38bdf8"/>
            </svg>`,
        sunken_temple: `
            <svg viewBox="0 0 80 80" class="w-full h-full">
                <rect x="18" y="26" width="11" height="42" fill="#94a3b8"/>
                <rect x="51" y="26" width="11" height="42" fill="#94a3b8"/>
                <rect x="12" y="16" width="56" height="11" rx="2" fill="#cbd5e1"/>
                <circle cx="22" cy="26" r="6" fill="#10b981"/>
                <circle cx="56" cy="46" r="5" fill="#059669"/>
                <ellipse cx="40" cy="68" rx="30" ry="4" fill="#96713c"/>
            </svg>`,
        giant_kelp: `
            <svg viewBox="0 0 80 80" class="w-full h-full">
                <path d="M40,74 Q32,45 42,10" stroke="#854d0e" stroke-width="3" fill="none"/>
                <circle cx="37" cy="52" r="3.5" fill="#eab308"/>
                <path d="M37,52 Q22,46 16,36 Q26,38 37,52" fill="#ca8a04"/>
                <circle cx="41" cy="34" r="3.5" fill="#eab308"/>
                <path d="M41,34 Q56,28 62,18 Q52,20 41,34" fill="#a16207"/>
                <circle cx="39" cy="18" r="3.5" fill="#eab308"/>
                <path d="M39,18 Q25,12 20,4 Q30,6 39,18" fill="#ca8a04"/>
                <ellipse cx="40" cy="74" rx="20" ry="3.5" fill="#96713c"/>
            </svg>`,
        lotus_lily: `
            <svg viewBox="0 0 80 80" class="w-full h-full">
                <path d="M40,72 Q36,46 44,28" stroke="#15803d" stroke-width="2.2" fill="none"/>
                <ellipse cx="44" cy="28" rx="24" ry="7" fill="#16a34a"/>
                <circle cx="44" cy="22" r="7" fill="#f472b6"/>
                <circle cx="44" cy="22" r="4.5" fill="#fdf2f8"/>
                <circle cx="44" cy="22" r="2.5" fill="#facc15"/>
                <ellipse cx="40" cy="72" rx="18" ry="3.5" fill="#96713c"/>
            </svg>`,
        neon_coral: `
            <svg viewBox="0 0 80 80" class="w-full h-full">
                <ellipse cx="40" cy="62" rx="18" ry="7" fill="#4c1d95"/>
                <path d="M30,60 Q20,38 18,22" stroke="#22d3ee" stroke-width="2.5" fill="none"/>
                <circle cx="18" cy="22" r="3" fill="#67e8f9"/>
                <path d="M36,58 Q32,32 30,16" stroke="#e879f9" stroke-width="2.5" fill="none"/>
                <circle cx="30" cy="16" r="3" fill="#f5d0fe"/>
                <path d="M44,58 Q48,32 50,16" stroke="#22d3ee" stroke-width="2.5" fill="none"/>
                <circle cx="50" cy="16" r="3" fill="#67e8f9"/>
                <path d="M50,60 Q60,38 62,22" stroke="#e879f9" stroke-width="2.5" fill="none"/>
                <circle cx="62" cy="22" r="3" fill="#f5d0fe"/>
                <ellipse cx="40" cy="68" rx="22" ry="4" fill="#96713c"/>
            </svg>`,
        marimo_moss: `
            <svg viewBox="0 0 80 80" class="w-full h-full">
                <circle cx="40" cy="46" r="22" fill="#059669"/>
                <circle cx="34" cy="40" r="15" fill="#10b981" opacity="0.65"/>
                <circle cx="40" cy="46" r="22" stroke="#34d399" stroke-width="2" stroke-dasharray="3,3" fill="none"/>
                <ellipse cx="40" cy="68" rx="20" ry="3.5" fill="#96713c"/>
            </svg>`,
        weeping_moss: `
            <svg viewBox="0 0 80 80" class="w-full h-full">
                <path d="M34,68 Q38,44 44,30 Q48,46 50,68" fill="#451a03"/>
                <ellipse cx="32" cy="30" rx="14" ry="10" fill="#059669"/>
                <ellipse cx="48" cy="28" rx="15" ry="10" fill="#10b981"/>
                <ellipse cx="40" cy="22" rx="16" ry="11" fill="#34d399"/>
                <path d="M26,35 L26,48 M34,37 L34,52 M46,35 L46,50 M54,34 L54,46" stroke="#34d399" stroke-width="2" stroke-linecap="round"/>
                <ellipse cx="40" cy="68" rx="24" ry="4" fill="#96713c"/>
            </svg>`,
        java_fern: `
            <svg viewBox="0 0 80 80" class="w-full h-full">
                <path d="M40,68 Q32,40 24,14 Q34,36 40,68" fill="#059669"/>
                <path d="M40,68 Q40,36 42,10 Q46,36 40,68" fill="#10b981"/>
                <path d="M40,68 Q50,42 58,16 Q48,36 40,68" fill="#047857"/>
                <line x1="32" y1="68" x2="48" y2="68" stroke="#334155" stroke-width="3"/>
                <ellipse cx="40" cy="68" rx="20" ry="3.5" fill="#96713c"/>
            </svg>`,
        spiderwood_driftwood: `
            <svg viewBox="0 0 80 80" class="w-full h-full">
                <path d="M16,68 Q32,24 52,28 Q64,30 68,68" stroke="#451a03" stroke-width="6" fill="none" stroke-linecap="round"/>
                <path d="M36,36 Q22,50 26,68 M48,32 Q58,46 54,68 M52,28 Q56,12 48,10" stroke="#78350f" stroke-width="3.5" fill="none" stroke-linecap="round"/>
                <ellipse cx="38" cy="30" rx="9" ry="5.5" fill="#22c55e"/>
                <ellipse cx="54" cy="26" rx="8" ry="5" fill="#16a34a"/>
                <ellipse cx="40" cy="68" rx="28" ry="4" fill="#96713c"/>
            </svg>`,
        seiryu_rock_ridge: `
            <svg viewBox="0 0 80 80" class="w-full h-full">
                <polygon points="12,68 20,42 30,22 42,40 52,14 64,34 72,68" fill="#475569" stroke="#1e293b" stroke-width="1.5"/>
                <line x1="30" y1="22" x2="36" y2="68" stroke="#f1f5f9" stroke-width="2"/>
                <line x1="52" y1="14" x2="58" y2="68" stroke="#f1f5f9" stroke-width="1.8"/>
                <ellipse cx="26" cy="50" rx="3.5" ry="2" fill="#059669"/>
                <ellipse cx="48" cy="52" rx="4" ry="2.2" fill="#10b981"/>
                <ellipse cx="40" cy="68" rx="30" ry="4" fill="#96713c"/>
            </svg>`,
        glowing_crystal_cavern: `
            <svg viewBox="0 0 80 80" class="w-full h-full">
                <circle cx="40" cy="42" r="28" fill="#1e1b4b" stroke="#312e81" stroke-width="2"/>
                <circle cx="40" cy="42" r="20" fill="#0f172a"/>
                <circle cx="40" cy="42" r="16" fill="#c084fc" opacity="0.35"/>
                <polygon points="40,24 36,36 44,36" fill="#e879f9"/>
                <polygon points="30,34 38,40 32,46" fill="#38bdf8"/>
                <polygon points="50,34 42,40 48,46" fill="#c084fc"/>
                <polygon points="40,60 36,48 44,48" fill="#a855f7"/>
                <circle cx="40" cy="42" r="4" fill="#ffffff"/>
                <ellipse cx="40" cy="68" rx="24" ry="4" fill="#96713c"/>
            </svg>`,
        sunken_galleon_shipwreck: `
            <svg viewBox="0 0 80 80" class="w-full h-full">
                <path d="M12,66 L16,42 L42,34 L66,38 L72,55 L68,66 Z" fill="#451a03" stroke="#1c1917" stroke-width="2"/>
                <line x1="38" y1="34" x2="44" y2="10" stroke="#78350f" stroke-width="3" stroke-linecap="round"/>
                <line x1="24" y1="42" x2="22" y2="66" stroke="#292524" stroke-width="2"/>
                <line x1="38" y1="36" x2="36" y2="66" stroke="#292524" stroke-width="2"/>
                <line x1="52" y1="38" x2="50" y2="66" stroke="#292524" stroke-width="2"/>
                <circle cx="28" cy="52" r="3.2" fill="#eab308"/>
                <circle cx="44" cy="52" r="3.2" fill="#eab308"/>
                <circle cx="60" cy="52" r="3.2" fill="#eab308"/>
                <rect x="52" y="58" width="12" height="8" rx="1" fill="#b45309"/>
                <ellipse cx="40" cy="68" rx="32" ry="4" fill="#96713c"/>
            </svg>`,
        volcano_aerator_deluxe: `
            <svg viewBox="0 0 80 80" class="w-full h-full">
                <circle cx="40" cy="20" r="3.5" fill="#bae6fd" opacity="0.8"/>
                <circle cx="36" cy="12" r="4.5" fill="#7dd3fc" opacity="0.9"/>
                <circle cx="44" cy="6" r="3" fill="#ffffff"/>
                <polygon points="18,68 30,34 50,34 62,68" fill="#1e293b" stroke="#0f172a" stroke-width="2"/>
                <ellipse cx="40" cy="34" rx="10" ry="4" fill="#ef4444"/>
                <ellipse cx="40" cy="34" rx="6" ry="2.2" fill="#fef08a"/>
                <line x1="34" y1="36" x2="28" y2="68" stroke="#f97316" stroke-width="2"/>
                <line x1="46" y1="36" x2="52" y2="68" stroke="#f97316" stroke-width="2"/>
                <ellipse cx="40" cy="68" rx="26" ry="4" fill="#96713c"/>
            </svg>`,
        crimson_sea_fan: `
            <svg viewBox="0 0 80 80" class="w-full h-full">
                <path d="M40,68 Q40,48 40,36" stroke="#881337" stroke-width="3" fill="none"/>
                <path d="M40,36 Q22,22 16,10 M40,36 Q32,18 28,6 M40,36 Q48,18 52,6 M40,36 Q58,22 64,10" stroke="#e11d48" stroke-width="2.2" fill="none"/>
                <circle cx="16" cy="10" r="2.5" fill="#fecdd3"/>
                <circle cx="28" cy="6" r="2.5" fill="#fecdd3"/>
                <circle cx="52" cy="6" r="2.5" fill="#fecdd3"/>
                <circle cx="64" cy="10" r="2.5" fill="#fecdd3"/>
                <circle cx="26" cy="22" r="2" fill="#fecdd3"/>
                <circle cx="54" cy="22" r="2" fill="#fecdd3"/>
                <ellipse cx="40" cy="68" rx="18" ry="3.5" fill="#96713c"/>
            </svg>`,
        bucephalandra_deep_purple: `
            <svg viewBox="0 0 80 80" class="w-full h-full">
                <ellipse cx="28" cy="40" rx="12" ry="6" transform="rotate(-30 28 40)" fill="#1e1b4b" stroke="#38bdf8" stroke-width="1.2"/>
                <ellipse cx="44" cy="35" rx="14" ry="7" transform="rotate(10 44 35)" fill="#4338ca" stroke="#38bdf8" stroke-width="1.2"/>
                <ellipse cx="56" cy="45" rx="12" ry="6" transform="rotate(35 56 45)" fill="#0284c7" stroke="#38bdf8" stroke-width="1.2"/>
                <circle cx="42" cy="34" r="1.5" fill="#ffffff"/>
                <circle cx="30" cy="38" r="1.2" fill="#ffffff"/>
                <ellipse cx="40" cy="68" rx="22" ry="4" fill="#96713c"/>
            </svg>`,
        vallisneria_spiralis: `
            <svg viewBox="0 0 80 80" class="w-full h-full">
                <path d="M28,72 Q20,44 32,10 M40,72 Q48,42 38,6 M52,72 Q60,46 48,12" stroke="#22c55e" stroke-width="3" fill="none" stroke-linecap="round"/>
                <path d="M28,72 Q20,44 32,10 M40,72 Q48,42 38,6 M52,72 Q60,46 48,12" stroke="#15803d" stroke-width="1.2" fill="none"/>
                <ellipse cx="40" cy="72" rx="24" ry="4" fill="#96713c"/>
            </svg>`,
        bonsai_moss_tree: `
            <svg viewBox="0 0 80 80" class="w-full h-full">
                <path d="M40,70 Q30,48 36,36 Q42,28 46,26" stroke="#5c2602" stroke-width="7" fill="none" stroke-linecap="round"/>
                <circle cx="28" cy="28" r="12" fill="#22c55e"/>
                <circle cx="48" cy="22" r="14" fill="#16a34a"/>
                <circle cx="36" cy="18" r="13" fill="#4ade80"/>
                <ellipse cx="40" cy="70" rx="26" ry="4" fill="#96713c"/>
            </svg>`,
        atlantis_portal: `
            <svg viewBox="0 0 80 80" class="w-full h-full">
                <ellipse cx="40" cy="44" rx="16" ry="24" fill="#06b6d4" opacity="0.35"/>
                <circle cx="40" cy="44" r="10" fill="#a5f3fc" opacity="0.5"/>
                <rect x="18" y="20" width="8" height="50" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5"/>
                <rect x="54" y="20" width="8" height="50" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5"/>
                <rect x="14" y="12" width="52" height="10" rx="2" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
                <circle cx="40" cy="17" r="3" fill="#38bdf8"/>
                <ellipse cx="40" cy="70" rx="28" ry="4" fill="#96713c"/>
            </svg>`
    };
    return svgs[decorId] || svgs.amazon_sword;
}

function getEquipPreviewSVG(key) {
    const svgs = {
        filter: `
            <svg viewBox="0 0 64 64" class="w-full h-full">
                <rect x="18" y="14" width="28" height="38" rx="6" fill="#0284c7" stroke="#38bdf8" stroke-width="2"/>
                <line x1="23" y1="24" x2="41" y2="24" stroke="#bae6fd" stroke-width="2.5"/>
                <line x1="23" y1="32" x2="41" y2="32" stroke="#bae6fd" stroke-width="2.5"/>
                <line x1="23" y1="40" x2="41" y2="40" stroke="#bae6fd" stroke-width="2.5"/>
                <path d="M32,14 L32,6 L48,6" stroke="#38bdf8" stroke-width="3" fill="none" stroke-linecap="round"/>
            </svg>`,
        autofeeder: `
            <svg viewBox="0 0 64 64" class="w-full h-full">
                <rect x="14" y="12" width="36" height="28" rx="8" fill="#4f46e5" stroke="#818cf8" stroke-width="2"/>
                <circle cx="32" cy="26" r="8" fill="#1e1b4b" stroke="#a5b4fc" stroke-width="2"/>
                <circle cx="26" cy="48" r="2.5" fill="#fbbf24"/>
                <circle cx="34" cy="53" r="2.5" fill="#34d399"/>
                <circle cx="39" cy="46" r="2.5" fill="#fb7185"/>
            </svg>`,
        tankSize: `
            <svg viewBox="0 0 64 64" class="w-full h-full">
                <rect x="8" y="14" width="48" height="36" rx="4" fill="#0c4a6e" stroke="#38bdf8" stroke-width="2.5"/>
                <path d="M10,22 Q24,19 34,22 Q46,25 54,22" stroke="#7dd3fc" stroke-width="2" fill="none"/>
                <ellipse cx="32" cy="35" rx="9" ry="4.5" fill="#f97316"/>
                <polygon points="22,35 16,30 16,40" fill="#f97316"/>
            </svg>`
    };
    return svgs[key] || svgs.tankSize;
}

function getMorphAuraClass(morph) {
    if (morph === 'cosmic') return 'morph-aura-cosmic';
    if (morph === 'prism') return 'morph-aura-prism';
    if (morph === 'lustre') return 'morph-aura-lustre';
    return '';
}

function getLabEggPreviewSVG(pA, pB) {
    if (!pA || !pB) {
        return `
            <svg viewBox="0 0 90 90" class="w-full h-full">
                <circle cx="45" cy="45" r="32" fill="none" stroke="#475569" stroke-width="1.5" stroke-dasharray="4 4"/>
                <circle cx="45" cy="45" r="18" fill="#0f172a" stroke="#64748b" stroke-width="1.5"/>
                <text x="45" y="50" text-anchor="middle" fill="#64748b" font-size="16" font-weight="bold">?</text>
            </svg>
        `;
    }
    const specA = SPECIES_CATALOG[pA.speciesId] || SPECIES_CATALOG.neon_tetra;
    const specB = SPECIES_CATALOG[pB.speciesId] || SPECIES_CATALOG.neon_tetra;
    const hasCosmic = pA.morph === 'cosmic' || pB.morph === 'cosmic';
    const hasPrism = pA.morph === 'prism' || pB.morph === 'prism';
    const glowCol = hasCosmic ? '#c084fc' : (hasPrism ? '#f472b6' : '#38bdf8');

    return `
        <svg viewBox="0 0 90 90" class="w-full h-full drop-shadow">
            <defs>
                <radialGradient id="egg- chamber-grad" cx="50%" cy="45%" r="50%">
                    <stop offset="0%" stop-color="#ffffff"/>
                    <stop offset="40%" stop-color="${specA.primaryColor}"/>
                    <stop offset="80%" stop-color="${specB.primaryColor}"/>
                    <stop offset="100%" stop-color="${glowCol}"/>
                </radialGradient>
            </defs>
            <!-- Outer Energy Rings -->
            <circle cx="45" cy="45" r="38" fill="${glowCol}" opacity="0.12"/>
            <circle cx="45" cy="45" r="32" fill="none" stroke="${glowCol}" stroke-width="1.5" stroke-dasharray="5 3" opacity="0.75"/>
            <!-- DNA Double Helix Strands around Egg -->
            <path d="M18,28 Q45,14 72,28 M18,62 Q45,76 72,62" stroke="#e879f9" stroke-width="1.5" fill="none" opacity="0.6"/>
            <!-- Fertilized Hybrid Roe Egg -->
            <circle cx="45" cy="45" r="21" fill="url(#egg- chamber-grad)" stroke="#ffffff" stroke-width="1.8"/>
            <!-- Visible Developing Embryo Silhouette -->
            <path d="M36,46 C38,35 53,36 53,46 C53,51 46,54 41,50" fill="none" stroke="#020617" stroke-width="3" stroke-linecap="round" opacity="0.75"/>
            <circle cx="51" cy="42" r="3" fill="#020617"/>
            <circle cx="52" cy="41" r="1.1" fill="#ffffff"/>
            <!-- Sparkle Accents -->
            <circle cx="37" cy="34" r="3" fill="#ffffff" opacity="0.8"/>
            <circle cx="66" cy="24" r="2" fill="#fef08a"/>
            <circle cx="24" cy="60" r="2.2" fill="#7dd3fc"/>
        </svg>
    `;
}