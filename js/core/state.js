const STORAGE_KEY = 'aquaverse_save_v1';


// Main Game State (Saved to localStorage)
let state = {
    version: 2,
    coins: 260,
    xp: 0,
    level: 1,
    waterQuality: 98,
    temperature: 25.5,
    lightThemeIndex: 0,
    vacationMode: false,
    soundEnabled: true,
    upgrades: {
        filter: 0,
        autofeeder: 0,
        tankSize: 0
    },
    fish: [],
    decorations: [],
    waste: [],
    discoveredDex: {},
    snailClutches: [],
    quests: {},
    achievements: {},
    currentBiome: 'amazon_freshwater',
    fertilizerStock: 8,
    lastSavedAt: Date.now()
};

// Runtime-only interactive variables
let simSpeed = 1;
let currentMode = 'feed'; // 'feed', 'clean', 'inspect', 'decorate', 'laser', 'garden'
let currentFoodType = 'flakes'; // 'flakes', 'pellets', 'medicated'
let selectedFishId = null;
let selectedPlantUid = null;
let activeDrawer = null;
let labTab = 'breed'; // 'breed' | 'fishdex'
let breedParentA = null;
let breedParentB = null;
let draggingDecor = null;
let dragOffsetX = 0;

// Environmental Events
let activeTankEvent = null; // null or { id, title, banner, duration, remaining, color, icon }
let eventCheckTimer = 0;

// Interactive Laser Toy
let laserToy = { x: 0, y: 0, active: false, pulse: 0, hue: 0 };
let laserPlayTimer = 0;

// Performance Profiler State
let showFpsProfiler = false;
let profilerMetrics = {
    fps: 60,
    frameTimeMs: 0,
    entitiesCount: 0,
    schoolingChecks: 0,
    lastFrameTime: performance.now(),
    frameCount: 0,
    fpsTimer: performance.now()
};

// Canvas & Visual Particles
const canvas = document.getElementById('aquariumCanvas');
const ctx = canvas.getContext('2d');
let cw = window.innerWidth;
let ch = window.innerHeight;
let substrateY = ch - 124;

let foodParticles = [];
let bubbles = [];
let floatingTexts = [];
let waterRipples = [];
let snowMotes = [];
let sandMounds = [];
let fxSparks = [];
let wakeRings = [];
let growthShockwaves = [];
let mousePos = { x: cw * 0.5, y: ch * 0.5, active: false };
let photoMode = false;
let tankSnail = { x: 180, dir: 1, shellRot: 0 };
let hudUpdateTimer = 0;


