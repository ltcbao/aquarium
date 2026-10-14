// LED Lighting Themes
const LIGHT_THEMES = [
    {
        id: 'daylight',
        name: 'Daylight LED',
        topGrad: '#0c2d48',
        midGrad: '#07192b',
        botGrad: '#030b14',
        rayColor: 'rgba(125, 211, 252, 0.08)',
        surfaceGlow: 'rgba(56, 189, 248, 0.35)'
    },
    {
        id: 'plant_rgb',
        name: 'Aquascape RGB',
        topGrad: '#132a3e',
        midGrad: '#0b1e2d',
        botGrad: '#050e17',
        rayColor: 'rgba(167, 243, 208, 0.09)',
        surfaceGlow: 'rgba(52, 211, 153, 0.35)'
    },
    {
        id: 'moonlight',
        name: 'Deep Moonlight',
        topGrad: '#091538',
        midGrad: '#050c24',
        botGrad: '#020510',
        rayColor: 'rgba(99, 102, 241, 0.08)',
        surfaceGlow: 'rgba(129, 140, 248, 0.3)'
    },
    {
        id: 'sunset',
        name: 'Golden Sunset',
        topGrad: '#2e1a29',
        midGrad: '#171326',
        botGrad: '#080711',
        rayColor: 'rgba(251, 191, 36, 0.08)',
        surfaceGlow: 'rgba(251, 146, 60, 0.35)'
    },
    {
        id: 'bioluminescent',
        name: 'Cyberpunk Neon Reef',
        topGrad: '#090d26',
        midGrad: '#050718',
        botGrad: '#02020a',
        rayColor: 'rgba(217, 70, 239, 0.11)',
        surfaceGlow: 'rgba(34, 211, 238, 0.48)'
    }
];

// Comprehensive Underwater Biomes Catalog
const BIOMES_CATALOG = [
    {
        id: 'amazon_freshwater',
        name: 'Amazon Riverbed',
        shortName: 'Amazon',
        icon: 'ph-tree',
        desc: 'Flooded rainforest with amber peat waters, tree roots & golden river sand.',
        topGrad: '#062820',
        midGrad: '#041c19',
        botGrad: '#020e0d',
        sandColors: ['#c29b61', '#96713c', '#422c15'],
        sandRim: 'rgba(254, 240, 138, 0.35)',
        causticColor: 'rgba(217, 249, 157, 0.12)',
        silhouetteStyle: 'roots',
        particleType: 'peat',
        lightBonus: 1.0,
        waterPurityBonus: 1.05
    },
    {
        id: 'coral_reef',
        name: 'Coral Atoll Reef',
        shortName: 'Coral Reef',
        icon: 'ph-waves',
        desc: 'Vibrant oceanic azure waters, dancing sunlight caustics & pristine white sand.',
        topGrad: '#0369a1',
        midGrad: '#075985',
        botGrad: '#0c2e59',
        sandColors: ['#f8fafc', '#e2e8f0', '#94a3b8'],
        sandRim: 'rgba(255, 255, 255, 0.55)',
        causticColor: 'rgba(186, 230, 253, 0.22)',
        silhouetteStyle: 'coral_mountains',
        particleType: 'plankton',
        lightBonus: 1.15,
        waterPurityBonus: 1.0
    },
    {
        id: 'atlantis_abyss',
        name: 'Sunken Atlantis',
        shortName: 'Atlantis',
        icon: 'ph-columns',
        desc: 'Mystical submerged citadel with ancient columns & dark basalt volcanic sand.',
        topGrad: '#1e1b4b',
        midGrad: '#0f172a',
        botGrad: '#020617',
        sandColors: ['#475569', '#334155', '#0f172a'],
        sandRim: 'rgba(192, 132, 252, 0.45)',
        causticColor: 'rgba(167, 139, 250, 0.15)',
        silhouetteStyle: 'atlantis_pillars',
        particleType: 'runes',
        lightBonus: 0.95,
        waterPurityBonus: 1.1
    },
    {
        id: 'cyber_trench',
        name: 'Cyber Bioluminescent',
        shortName: 'Cyber Trench',
        icon: 'ph-sparkle',
        desc: 'Deep marine trench radiating with neon cyan, magenta glows & abyssal glitter.',
        topGrad: '#090d26',
        midGrad: '#050718',
        botGrad: '#02020a',
        sandColors: ['#312e81', '#1e1b4b', '#030712'],
        sandRim: 'rgba(34, 211, 238, 0.55)',
        causticColor: 'rgba(232, 121, 249, 0.18)',
        silhouetteStyle: 'spires',
        particleType: 'neon_sparks',
        lightBonus: 1.1,
        waterPurityBonus: 1.0
    }
];

const FISH_NAMES_POOL = [
    'Finley', 'Coral', 'Bubbles', 'Zephyr', 'Nori', 'Splash', 'Kai', 'Saffron',
    'Neptune', 'Miso', 'Azure', 'Echo', 'Sunny', 'cosmo', 'Pearl', 'Marlin',
    'biscuit', 'Yuzu', 'sushi', 'pippin', 'Luna', 'Atlas', 'Mango', 'Kobe'
];
