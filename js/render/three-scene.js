import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// =========================================================================
// AquaVerse Three.js WebGL 3D Engine
// Complete Dual-Engine System: High-Fidelity Living 3D Aquarium
// =========================================================================

// Three.js Core Ecosystem State
let threeRenderer = null;
let threeScene = null;
let threeCamera = null;
let threeControls = null;
let last3DFrameTime = performance.now();

// 3D Scene Entity Groups
let envGroup = null;
let tankGroup = null;
let sandMesh = null;
let causticMesh = null;
let fishGroup = null;
let decorGroup = null;
let bubbleGroup = null;
let foodGroup = null;
let planktonPoints = null;
let backdropMesh = null;

// Lighting References
let lightSun = null;
let lightAmbient = null;
let lightBounce = null;
let lightFront = null;

// Interaction State
let raycaster = null;
let mouseVec = new THREE.Vector2();
let is360CamActive = false;
let cameraLerpTarget = null;

// Entity Tracking Maps & Pools
const fishMeshMap = new Map();   // fish.id -> THREE.Group
const decorMeshMap = new Map();  // decor.uid -> THREE.Group
const bubblePool = [];
const MAX_BUBBLES_3D = 75;

// Tank Dimensions in 3D Space (Calibrated to 16:9 - 21:9 viewports)
const TANK_WIDTH = 1360;
const TANK_HEIGHT = 720;
const TANK_DEPTH = 520;

// Safe CSS Color Parser for Three.js (handles hex, rgb, rgba, hsl, named colors)
function safeColor(str, fallback = 0x38bdf8) {
    if (!str) return new THREE.Color(fallback);
    try {
        const c = new THREE.Color();
        if (typeof str === 'string') {
            if (str.startsWith('rgba')) {
                // Extract rgb from rgba(r, g, b, a)
                const match = str.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
                if (match) {
                    c.setRGB(parseInt(match[1]) / 255, parseInt(match[2]) / 255, parseInt(match[3]) / 255);
                    return c;
                }
            } else if (str.startsWith('#') || str.startsWith('rgb') || str.startsWith('hsl')) {
                c.setStyle(str);
                return c;
            }
        }
        return new THREE.Color(str);
    } catch (e) {
        return new THREE.Color(fallback);
    }
}

// Coordinate Mapping: 2D Tank Physics (cw, ch) -> 3D World Coordinates
function to3DCoord(x2d, y2d, zNorm = 0) {
    const curW = (typeof cw !== 'undefined' && cw > 100) ? cw : window.innerWidth;
    const curH = (typeof ch !== 'undefined' && ch > 100) ? ch : window.innerHeight;
    const x3d = ((x2d / curW) - 0.5) * TANK_WIDTH;
    const y3d = -((y2d / curH) - 0.5) * TANK_HEIGHT;
    const z3d = (zNorm || 0) * (TANK_DEPTH * 0.42);
    return { x: x3d, y: y3d, z: z3d };
}

// =========================================================================
// 1. INITIALIZATION & SCENE SETUP
// =========================================================================

export function initThreeScene() {
    const canvas = document.getElementById('threeCanvas');
    if (!canvas) return;

    // 1. WebGL Renderer with ACES Filmic Tone Mapping & Soft Shadows
    threeRenderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
    });
    threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    threeRenderer.setSize(window.innerWidth, window.innerHeight);
    threeRenderer.shadowMap.enabled = true;
    threeRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    threeRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    threeRenderer.toneMappingExposure = 1.35;

    // 2. Scene with Atmospheric Underwater Depth Fog
    threeScene = new THREE.Scene();
    threeScene.background = new THREE.Color(0x02161e);
    threeScene.fog = new THREE.FogExp2(0x02161e, 0.00038);

    // 3. Perspective Camera (Pristine Front-Facing View)
    threeCamera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 10, 5200);
    resetCameraView(false);

    // 4. Orbit Controls (Configured to avoid stealing Left-Click gameplay interactions)
    threeControls = new OrbitControls(threeCamera, canvas);
    threeControls.enableDamping = true;
    threeControls.dampingFactor = 0.06;
    threeControls.maxPolarAngle = Math.PI * 0.51; // Prevent going underneath sand
    threeControls.minPolarAngle = Math.PI * 0.28; // Prevent flipping straight down
    threeControls.minAzimuthAngle = -Math.PI * 0.42; // Orbit clamped to front ~75 deg
    threeControls.maxAzimuthAngle = Math.PI * 0.42;
    threeControls.minDistance = 550;
    threeControls.maxDistance = 1350;
    threeControls.target.set(0, -10, 0);

    // Default: Right Mouse Button rotates, Left Click is reserved for feeding/tapping!
    threeControls.mouseButtons = {
        LEFT: null,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE
    };

    raycaster = new THREE.Raycaster();

    // 5. Build 3D Scene Components
    buildLighting();
    buildUnderwaterPanorama();
    buildWaterTankEnclosure();
    buildSandSubstrate();
    buildCausticsPlane();
    buildSuspendedPlankton();

    // 6. Entity Groups
    fishGroup = new THREE.Group();
    decorGroup = new THREE.Group();
    bubbleGroup = new THREE.Group();
    foodGroup = new THREE.Group();

    threeScene.add(fishGroup);
    threeScene.add(decorGroup);
    threeScene.add(bubbleGroup);
    threeScene.add(foodGroup);

    initBubblePool();
    syncDecorations3D();
    updateThreeEnvironment();

    // 7. Interactive Click & Raycasting for 3D Fish Inspection
    canvas.addEventListener('click', onCanvas3DClick);
    window.addEventListener('resize', onThreeResize);

    console.log('✓ AquaVerse Three.js WebGL 3D Engine Initialized (r' + THREE.REVISION + ')');
}

export function resetCameraView(smooth = true) {
    if (!threeCamera) return;
    const targetPos = new THREE.Vector3(0, 10, 890);
    const targetLook = new THREE.Vector3(0, -10, 0);

    if (smooth) {
        cameraLerpTarget = { pos: targetPos, look: targetLook };
    } else {
        threeCamera.position.copy(targetPos);
        if (threeControls) {
            threeControls.target.copy(targetLook);
            threeControls.update();
        }
    }
}

function onThreeResize() {
    if (!threeCamera || !threeRenderer) return;
    threeCamera.aspect = window.innerWidth / window.innerHeight;
    threeCamera.updateProjectionMatrix();
    threeRenderer.setSize(window.innerWidth, window.innerHeight);
    threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
}

// =========================================================================
// 2. LIGHTING & ENVIRONMENT
// =========================================================================

function buildLighting() {
    // 1. Crystal Aqua Ambient Light for vibrant fish illumination
    lightAmbient = new THREE.AmbientLight(0x0f4d50, 1.8);
    threeScene.add(lightAmbient);

    // 2. Overhead Sunlight / LED Key Light (Casts Dynamic Soft Shadows)
    lightSun = new THREE.DirectionalLight(0xfffaed, 2.8);
    lightSun.position.set(90, 580, 240);
    lightSun.castShadow = true;
    lightSun.shadow.mapSize.width = 1024;
    lightSun.shadow.mapSize.height = 1024;
    lightSun.shadow.camera.near = 100;
    lightSun.shadow.camera.far = 1300;
    const shadowR = TANK_WIDTH * 0.58;
    lightSun.shadow.camera.left = -shadowR;
    lightSun.shadow.camera.right = shadowR;
    lightSun.shadow.camera.top = shadowR * 0.75;
    lightSun.shadow.camera.bottom = -shadowR * 0.75;
    lightSun.shadow.bias = -0.0004;
    threeScene.add(lightSun);

    // 3. Substrate Sand Bounce Light (Soft warm upward fill)
    lightBounce = new THREE.DirectionalLight(0xd97706, 0.55);
    lightBounce.position.set(0, -500, 80);
    threeScene.add(lightBounce);

    // 4. Front Fill Light (Ensures fish facing front are brightly illuminated)
    lightFront = new THREE.DirectionalLight(0x7dd3fc, 1.1);
    lightFront.position.set(0, 100, 800);
    threeScene.add(lightFront);
}

// 360-Degree Panoramic Cylindrical Underwater Backdrop (Eliminates the Black Void!)
function buildUnderwaterPanorama() {
    envGroup = new THREE.Group();

    // Giant curved cylinder enclosing the entire scene
    const panoGeo = new THREE.CylinderGeometry(2200, 2200, 1700, 36, 1, true);
    const panoMat = new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
            topColor: { value: new THREE.Color(0x0a3b38) },
            midColor: { value: new THREE.Color(0x041f24) },
            botColor: { value: new THREE.Color(0x021217) }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 topColor;
            uniform vec3 midColor;
            uniform vec3 botColor;
            varying vec2 vUv;
            void main() {
                vec3 col;
                if (vUv.y > 0.5) {
                    col = mix(midColor, topColor, pow((vUv.y - 0.5) * 2.0, 0.85));
                } else {
                    col = mix(botColor, midColor, pow(vUv.y * 2.0, 0.9));
                }
                gl_FragColor = vec4(col, 1.0);
            }
        `
    });

    backdropMesh = new THREE.Mesh(panoGeo, panoMat);
    backdropMesh.position.set(0, 100, 0);
    envGroup.add(backdropMesh);
    threeScene.add(envGroup);
}

// Starphire Glass Tank Enclosure with Dark Minimal Architectural Base
function buildWaterTankEnclosure() {
    tankGroup = new THREE.Group();

    // 1. Crystal Starphire Glass Enclosure (Clean, minimal, no distracting wireframe lines)
    const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xecfeff,
        transparent: true,
        opacity: 0.1,
        roughness: 0.04,
        transmission: 0.95,
        ior: 1.333,
        thickness: 10,
        side: THREE.DoubleSide
    });

    const boxGeo = new THREE.BoxGeometry(TANK_WIDTH, TANK_HEIGHT, TANK_DEPTH);
    const tankMesh = new THREE.Mesh(boxGeo, glassMat);
    tankGroup.add(tankMesh);

    // 2. Sleek Architectural Base Stand (Grounds the aquarium, prevents feeling floating in void)
    const baseGeo = new THREE.BoxGeometry(TANK_WIDTH + 14, 22, TANK_DEPTH + 14);
    const baseMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a, // Deep slate matte aluminum
        roughness: 0.45,
        metalness: 0.55
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.set(0, -TANK_HEIGHT * 0.5 - 11, 0);
    baseMesh.receiveShadow = true;
    tankGroup.add(baseMesh);

    threeScene.add(tankGroup);
}

// Expansive Sand Bed with Procedural River Dunes and Smooth Pebbles
function buildSandSubstrate() {
    const sandGeo = new THREE.PlaneGeometry(TANK_WIDTH * 1.5, TANK_DEPTH * 1.6, 48, 32);
    sandGeo.rotateX(-Math.PI * 0.5);

    const pos = sandGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vz = pos.getZ(i);
        const dune = Math.sin(vx * 0.007) * 14 + Math.cos(vz * 0.011) * 10 + Math.sin(vx * 0.018 + vz * 0.015) * 5;
        pos.setY(i, dune);
    }
    sandGeo.computeVertexNormals();

    const sandMat = new THREE.MeshStandardMaterial({
        color: 0xc29b61, // Warm natural aquatic river sand
        roughness: 0.88,
        metalness: 0.02,
        flatShading: false
    });

    sandMesh = new THREE.Mesh(sandGeo, sandMat);
    sandMesh.position.set(0, -TANK_HEIGHT * 0.5 + 16, 0);
    sandMesh.receiveShadow = true;
    threeScene.add(sandMesh);

    // Procedural Smooth River Pebbles scattered across the substrate
    const pebbleGroup = new THREE.Group();
    const pebbleColors = [0x475569, 0x64748b, 0x334155, 0x78716c, 0x57534e];
    for (let p = 0; p < 24; p++) {
        const rad = 7 + Math.random() * 14;
        const pGeo = new THREE.DodecahedronGeometry(rad, 1);
        pGeo.scale(1.2, 0.55, 0.9);
        const pMat = new THREE.MeshStandardMaterial({
            color: pebbleColors[p % pebbleColors.length],
            roughness: 0.85
        });
        const pebble = new THREE.Mesh(pGeo, pMat);
        pebble.position.set(
            (Math.random() - 0.5) * TANK_WIDTH * 0.88,
            -TANK_HEIGHT * 0.5 + 20,
            (Math.random() - 0.5) * TANK_DEPTH * 0.78
        );
        pebble.rotation.set(Math.random() * 0.3, Math.random() * Math.PI, Math.random() * 0.3);
        pebble.castShadow = true;
        pebble.receiveShadow = true;
        pebbleGroup.add(pebble);
    }
    threeScene.add(pebbleGroup);
}

// Volumetric Animated Caustics Water Surface Projection
function buildCausticsPlane() {
    const causticGeo = new THREE.PlaneGeometry(TANK_WIDTH * 1.35, TANK_DEPTH * 1.45);
    causticGeo.rotateX(-Math.PI * 0.5);

    const causticMat = new THREE.ShaderMaterial({
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        uniforms: {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(0xa5f3fc) },
            uIntensity: { value: 0.42 }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float uTime;
            uniform vec3 uColor;
            uniform float uIntensity;
            varying vec2 vUv;

            void main() {
                vec2 p = vUv * 6.5;
                float t = uTime * 0.75;
                float c1 = sin(p.x * 2.2 + t + sin(p.y * 2.6 - t * 0.7));
                float c2 = cos(p.y * 2.4 - t * 0.8 + cos(p.x * 3.0 + t * 0.5));
                float caustic = pow(clamp(c1 * c2 + 0.62, 0.0, 1.0), 3.0);
                gl_FragColor = vec4(uColor, caustic * uIntensity);
            }
        `
    });

    causticMesh = new THREE.Mesh(causticGeo, causticMat);
    causticMesh.position.set(0, -TANK_HEIGHT * 0.5 + 20, 0);
    threeScene.add(causticMesh);
}

// Suspended Water Plankton & Micro Dust Motes (Adds rich 3D underwater depth)
function buildSuspendedPlankton() {
    const count = 90;
    const geo = new THREE.BufferGeometry();
    const pos = [];
    for (let i = 0; i < count; i++) {
        pos.push(
            (Math.random() - 0.5) * TANK_WIDTH * 0.95,
            (Math.random() - 0.5) * TANK_HEIGHT * 0.85,
            (Math.random() - 0.5) * TANK_DEPTH * 0.85
        );
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
        color: 0x99f6e4,
        size: 3.5,
        transparent: true,
        opacity: 0.38,
        blending: THREE.AdditiveBlending
    });
    planktonPoints = new THREE.Points(geo, mat);
    threeScene.add(planktonPoints);
}

// Synchronize Environment Colors with Active Biome & LED Lighting Theme
export function updateThreeEnvironment() {
    if (!threeScene) return;

    const biome = (typeof BIOMES_CATALOG !== 'undefined')
        ? (BIOMES_CATALOG.find(b => b.id === state.currentBiome) || BIOMES_CATALOG[0])
        : null;
    const baseTheme = (typeof LIGHT_THEMES !== 'undefined')
        ? (LIGHT_THEMES[state.lightThemeIndex || 0] || LIGHT_THEMES[0])
        : null;

    let topC = safeColor(biome ? biome.topGrad : '#062820', 0x064e3b);
    let midC = safeColor(biome ? biome.midGrad : '#041c19', 0x032d30);
    let botC = safeColor(biome ? biome.botGrad : '#020e0d', 0x02161e);

    // Apply lighting theme tints
    if (baseTheme) {
        if (baseTheme.id === 'plant_rgb') {
            topC.lerp(new THREE.Color(0x10b981), 0.25);
        } else if (baseTheme.id === 'moonlight') {
            topC = safeColor('#091538', 0x091538);
            midC = safeColor('#050c24', 0x050c24);
            botC = safeColor('#020510', 0x020510);
            if (lightAmbient) lightAmbient.color.set(0x38bdf8);
            if (lightSun) lightSun.color.set(0x818cf8);
        } else if (baseTheme.id === 'sunset') {
            topC = safeColor('#2e1a29', 0x2e1a29);
            midC = safeColor('#171326', 0x171326);
            if (lightSun) lightSun.color.set(0xfbbf24);
            if (lightAmbient) lightAmbient.color.set(0xf59e0b);
        } else if (baseTheme.id === 'bioluminescent') {
            topC = safeColor('#1e1b4b', 0x1e1b4b);
            midC = safeColor('#0f172a', 0x0f172a);
            botC = safeColor('#020617', 0x020617);
            if (lightSun) lightSun.color.set(0xd946ef);
            if (lightAmbient) lightAmbient.color.set(0x06b6d4);
        } else {
            // Daylight
            if (lightAmbient) lightAmbient.color.set(0x0f4d50);
            if (lightSun) lightSun.color.set(0xfffaed);
        }
    }

    threeScene.background.copy(botC);
    if (threeScene.fog) threeScene.fog.color.copy(botC);

    if (backdropMesh && backdropMesh.material && backdropMesh.material.uniforms) {
        backdropMesh.material.uniforms.topColor.value.copy(topC);
        backdropMesh.material.uniforms.midColor.value.copy(midC);
        backdropMesh.material.uniforms.botColor.value.copy(botC);
    }

    // Sand color tone per biome
    if (sandMesh && sandMesh.material) {
        if (biome && biome.id === 'cyber_trench') {
            sandMesh.material.color.set(0x1e293b);
        } else if (biome && biome.id === 'coral_reef') {
            sandMesh.material.color.set(0xf5ebe0); // White coral sand
        } else if (biome && biome.id === 'atlantis_ruins') {
            sandMesh.material.color.set(0x94a3b8);
        } else {
            sandMesh.material.color.set(0xc29b61); // Warm golden river sand
        }
    }
}

// =========================================================================
// 3. ANATOMICAL PROCEDURAL 3D FISH MESH ENGINE
// =========================================================================

// Creates a streamlined anatomical fish body with species-accurate cross-sections
function createSculptedFishBody(len, h, w, shape = 'fusiform') {
    const geo = new THREE.BufferGeometry();
    const positions = [];
    const uvs = [];
    const indices = [];
    const rings = 14;
    const segs = 12;

    for (let i = 0; i <= rings; i++) {
        const t = i / rings; // 0 (tail peduncle) to 1 (snout tip)
        const x = -len * 0.5 + t * len;

        // Realistic Hydrodynamic Cross-Section Profile
        let rY = Math.sin(t * Math.PI) * h;
        let rZ = Math.sin(t * Math.PI) * w;

        if (shape === 'cory') {
            // High arched brow, flattened bottom
            if (t > 0.6) rY *= (1.0 + (t - 0.6) * 0.4);
            rZ *= 1.15;
        } else if (shape === 'ribbon') {
            // Knife-edge ventral tapering
            rZ *= (0.4 + t * 0.6);
        }

        if (t > 0.65) {
            // Taper towards snout
            rY *= (1.0 - (t - 0.65) * 0.45);
            rZ *= (1.0 - (t - 0.65) * 0.55);
        } else if (t < 0.35) {
            // Taper towards tail peduncle
            rY *= (0.4 + t * 1.7);
            rZ *= (0.3 + t * 2.0);
        }

        // Slightly arched dorsal line and rounded belly
        const yOffset = (shape === 'cory') ? -h * 0.15 : (1.0 - t) * (h * 0.08);

        for (let j = 0; j <= segs; j++) {
            const ang = (j / segs) * Math.PI * 2;
            const py = Math.cos(ang) * rY + yOffset;
            const pz = Math.sin(ang) * rZ;
            positions.push(x, py, pz);
            uvs.push(t, j / segs);
        }
    }

    for (let i = 0; i < rings; i++) {
        for (let j = 0; j < segs; j++) {
            const a = i * (segs + 1) + j;
            const b = (i + 1) * (segs + 1) + j;
            const c = (i + 1) * (segs + 1) + (j + 1);
            const d = i * (segs + 1) + (j + 1);
            indices.push(a, b, d);
            indices.push(b, c, d);
        }
    }

    geo.setIndex(indices);
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.computeVertexNormals();
    return geo;
}

function createProceduralFishMesh(spec, fish) {
    const group = new THREE.Group();
    const isFry = fish.stage === 'fry';
    const isJuv = fish.stage === 'juvenile';
    const stageMult = isFry ? 0.45 : (isJuv ? 0.74 : 1.0);

    // Natural proportioned dimensions (in 3D world units)
    const baseL = (spec.baseSize || 22) * 1.45 * stageMult;
    const shape = spec.bodyShape || 'fusiform';
    const isDisk = shape === 'discus' || shape === 'angel';
    const isEel = shape === 'eel' || shape === 'bichir';
    const isBetta = shape === 'betta' || shape === 'guppy';
    const isRibbon = shape === 'ribbon';
    const isCory = shape === 'cory';

    // Dimension scaling
    let len = baseL;
    let h = baseL * 0.38;
    let w = baseL * 0.22;

    if (isDisk) {
        len = baseL * 0.92;
        h = baseL * 0.82;
        w = baseL * 0.16;
    } else if (isEel) {
        len = baseL * 1.7;
        h = baseL * 0.22;
        w = baseL * 0.18;
    } else if (isRibbon) {
        len = baseL * 1.55;
        h = baseL * 0.28;
        w = baseL * 0.14;
    } else if (isCory) {
        len = baseL * 0.85;
        h = baseL * 0.46;
        w = baseL * 0.32;
    }

    // Morph handling
    const isPrism = fish.morph === 'prism';
    const isCosmic = fish.morph === 'cosmic';
    const isAlbino = fish.morph === 'albino';
    const isGold = fish.morph === 'gold';

    let primaryColor = isCosmic ? new THREE.Color(0xa855f7) : (isAlbino ? new THREE.Color(0xfef08a) : (isGold ? new THREE.Color(0xf59e0b) : safeColor(spec.primaryColor, 0x0ea5e9)));
    let finColor = isCosmic ? new THREE.Color(0x38bdf8) : (isAlbino ? new THREE.Color(0xffffff) : safeColor(spec.finColor || spec.secondaryColor, 0xbae6fd));

    // Prevent Pitch-Black Hole Bug for dark species (like Velvet Black Ghost Knife)
    const luminance = 0.299 * primaryColor.r + 0.587 * primaryColor.g + 0.114 * primaryColor.b;
    const isDarkSpecies = luminance < 0.1;
    if (isDarkSpecies) {
        primaryColor = new THREE.Color(0x181820); // Velvet obsidian with blue sheen
    }

    // 1. Sculpted Anatomical Fish Body
    const bodyGeo = createSculptedFishBody(len, h, w, shape);
    const bodyMat = new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: isDarkSpecies ? 0.28 : (isGold ? 0.25 : 0.42),
        metalness: isDarkSpecies ? 0.25 : (isGold ? 0.85 : (isPrism ? 0.65 : 0.15)),
        emissive: isCosmic ? new THREE.Color(0x7e22ce) : (isDarkSpecies ? new THREE.Color(0x0f172a) : new THREE.Color(0x000000)),
        emissiveIntensity: isCosmic ? 0.8 : (isDarkSpecies ? 0.2 : 0.0)
    });

    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    // 2. Caudal Fin (Tail) with Flowing Silhouette
    const finMat = new THREE.MeshStandardMaterial({
        color: finColor,
        transparent: true,
        opacity: 0.82,
        roughness: 0.35,
        side: THREE.DoubleSide
    });

    const tailLen = isBetta ? len * 0.95 : (isRibbon ? len * 0.35 : len * 0.52);
    const tailH = isBetta ? h * 1.8 : (isDisk ? h * 1.2 : (isRibbon ? h * 0.65 : h * 0.95));
    const tailGeo = new THREE.PlaneGeometry(tailLen, tailH, 4, 3);
    tailGeo.translate(-tailLen * 0.5, 0, 0);

    const tailMesh = new THREE.Mesh(tailGeo, finMat);
    tailMesh.position.set(-len * 0.5, 0, 0);
    tailMesh.name = 'tail';
    group.add(tailMesh);

    // Special: Ivory white tail rings for Black Ghost Knifefish
    if (isRibbon) {
        const ringGeo = new THREE.CylinderGeometry(w * 0.7, w * 0.6, len * 0.12, 10, 1, true);
        ringGeo.rotateZ(Math.PI * 0.5);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(-len * 0.42, 0, 0);
        group.add(ring);
    }

    // 3. Dorsal Sail Fin (Top Crest)
    const dorsalLen = isRibbon ? len * 0.2 : (isDisk ? len * 0.65 : len * 0.5);
    const dorsalH = isDisk ? h * 1.25 : (isBetta ? h * 0.9 : h * 0.5);
    const dorsalGeo = new THREE.PlaneGeometry(dorsalLen, dorsalH, 3, 2);
    dorsalGeo.translate(-dorsalLen * 0.15, dorsalH * 0.45, 0);
    const dorsalMesh = new THREE.Mesh(dorsalGeo, finMat);
    dorsalMesh.position.set(0, h * 0.65, 0);
    group.add(dorsalMesh);

    // 4. Paired Pectoral Fins (Flapping on flanks)
    const pecGeo = new THREE.PlaneGeometry(len * 0.28, h * 0.32);
    pecGeo.translate(-len * 0.12, 0, 0);

    const leftPec = new THREE.Mesh(pecGeo, finMat);
    leftPec.position.set(len * 0.18, -h * 0.18, w * 0.95);
    leftPec.rotation.y = 0.5;
    leftPec.name = 'leftPec';
    group.add(leftPec);

    const rightPec = new THREE.Mesh(pecGeo, finMat);
    rightPec.position.set(len * 0.18, -h * 0.18, -w * 0.95);
    rightPec.rotation.y = -0.5;
    rightPec.name = 'rightPec';
    group.add(rightPec);

    // 5. Long Ventral Thread Streamers (For Discus and Angelfish)
    if (isDisk) {
        const streamerGeo = new THREE.CylinderGeometry(0.8, 0.4, h * 1.8, 6);
        streamerGeo.translate(0, -h * 0.9, 0);
        const streamerMat = new THREE.MeshStandardMaterial({ color: finColor, roughness: 0.3 });
        const leftStreamer = new THREE.Mesh(streamerGeo, streamerMat);
        leftStreamer.position.set(len * 0.1, -h * 0.6, w * 0.4);
        leftStreamer.rotation.z = -0.3;
        group.add(leftStreamer);

        const rightStreamer = new THREE.Mesh(streamerGeo, streamerMat);
        rightStreamer.position.set(len * 0.1, -h * 0.6, -w * 0.4);
        rightStreamer.rotation.z = -0.3;
        group.add(rightStreamer);
    }

    // 6. Snout Whisker Barbels (For Corydoras & Catfish)
    if (isCory) {
        const barbelGeo = new THREE.CylinderGeometry(0.7, 0.3, len * 0.22, 5);
        barbelGeo.rotateZ(-Math.PI * 0.35);
        const barbelMat = new THREE.MeshStandardMaterial({ color: primaryColor, roughness: 0.4 });
        const lBarbel = new THREE.Mesh(barbelGeo, barbelMat);
        lBarbel.position.set(len * 0.46, -h * 0.45, w * 0.5);
        group.add(lBarbel);

        const rBarbel = new THREE.Mesh(barbelGeo, barbelMat);
        rBarbel.position.set(len * 0.46, -h * 0.45, -w * 0.5);
        group.add(rBarbel);
    }

    // 7. Expressive Jewel Eyes (Golden Sclera Ring + Glossy Obsidian Pupil)
    const eyeR = Math.max(1.4, h * 0.14);
    const pupilGeo = new THREE.SphereGeometry(eyeR, 8, 8);
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.1, metalness: 0.9 });

    const scleraGeo = new THREE.SphereGeometry(eyeR * 1.25, 8, 8);
    const scleraMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.3 });

    const leftEye = new THREE.Group();
    const lSclera = new THREE.Mesh(scleraGeo, scleraMat);
    const lPupil = new THREE.Mesh(pupilGeo, pupilMat);
    lPupil.position.z = eyeR * 0.45;
    leftEye.add(lSclera);
    leftEye.add(lPupil);
    leftEye.position.set(len * 0.34, h * 0.16, w * 0.78);
    group.add(leftEye);

    const rightEye = new THREE.Group();
    const rSclera = new THREE.Mesh(scleraGeo, scleraMat);
    const rPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rPupil.position.z = -eyeR * 0.45;
    rightEye.add(rSclera);
    rightEye.add(rPupil);
    rightEye.position.set(len * 0.34, h * 0.16, -w * 0.78);
    group.add(rightEye);

    // Store metadata for real-time animations
    group.userData = {
        fishId: fish.id,
        spec: spec,
        bodyMesh: bodyMesh,
        tailMesh: tailMesh,
        leftPec: leftPec,
        rightPec: rightPec,
        swimPhase: Math.random() * Math.PI * 2
    };

    return group;
}

function syncFishMeshes3D(dt) {
    if (!state || !state.fish) return;

    const currentFishIds = new Set();

    for (let i = 0; i < state.fish.length; i++) {
        const fish = state.fish[i];
        if (fish.stage === 'egg') continue;

        currentFishIds.add(fish.id);
        let meshGroup = fishMeshMap.get(fish.id);

        if (!meshGroup) {
            const spec = getEffectiveSpec(fish);
            meshGroup = createProceduralFishMesh(spec, fish);
            fishMeshMap.set(fish.id, meshGroup);
            fishGroup.add(meshGroup);
        }

        // Map Position from 2D physics coordinates to 3D Space
        const target3D = to3DCoord(fish.x, fish.y, fish.z || 0);
        meshGroup.position.lerp(new THREE.Vector3(target3D.x, target3D.y, target3D.z), 0.32);

        // Natural Swimming Orientation (Facing Yaw + Velocity Pitch)
        const facing = fish.facing || 1;
        const targetYaw = facing > 0 ? 0 : Math.PI;
        const targetPitch = Math.max(-0.45, Math.min(0.45, (fish.vy || 0) * -0.16)) * facing;
        meshGroup.rotation.y = THREE.MathUtils.lerp(meshGroup.rotation.y, targetYaw, 0.2);
        meshGroup.rotation.z = THREE.MathUtils.lerp(meshGroup.rotation.z, targetPitch, 0.2);

        // Fluid Tail & Pectoral Fin Undulation
        meshGroup.userData.swimPhase += dt * (3.0 + Math.hypot(fish.vx || 0, fish.vy || 0) * 1.8);
        const tail = meshGroup.userData.tailMesh;
        if (tail) {
            tail.rotation.y = Math.sin(meshGroup.userData.swimPhase) * 0.38;
        }

        const lPec = meshGroup.userData.leftPec;
        const rPec = meshGroup.userData.rightPec;
        if (lPec && rPec) {
            const pecFlap = Math.sin(meshGroup.userData.swimPhase * 1.6) * 0.32;
            lPec.rotation.z = pecFlap;
            rPec.rotation.z = -pecFlap;
        }
    }

    // Clean up sold/removed fish meshes
    for (const [id, mesh] of fishMeshMap.entries()) {
        if (!currentFishIds.has(id)) {
            fishGroup.remove(mesh);
            mesh.traverse(obj => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) obj.material.dispose();
            });
            fishMeshMap.delete(id);
        }
    }
}

// =========================================================================
// 4. 3D AQUASCAPE DECORATIONS & HARDSCAPE
// =========================================================================

function syncDecorations3D() {
    if (!state || !Array.isArray(state.decorations)) return;

    while (decorGroup.children.length > 0) {
        const obj = decorGroup.children[0];
        decorGroup.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
    }
    decorMeshMap.clear();

    state.decorations.forEach(d => {
        const cat = (typeof DECOR_CATALOG !== 'undefined') ? DECOR_CATALOG.find(c => c.id === d.id) : null;
        const x3d = (d.xRatio - 0.5) * TANK_WIDTH;
        const y3d = -TANK_HEIGHT * 0.5 + 16;
        const z3d = ((d.zRatio || 0.5) - 0.5) * (TANK_DEPTH * 0.7);

        const dMesh = createSingleDecor3D(d.id, cat);
        if (dMesh) {
            dMesh.position.set(x3d, y3d, z3d);
            decorGroup.add(dMesh);
            decorMeshMap.set(d.uid, dMesh);
        }
    });
}

function createSingleDecor3D(decorId, cat) {
    const group = new THREE.Group();

    if (decorId === 'dragon_stone' || decorId === 'seiryu_rock_ridge') {
        // Jagged Stratified Mountain Spire
        const rockGeo = new THREE.ConeGeometry(46, 175, 7);
        rockGeo.translate(0, 85, 0);
        const rockMat = new THREE.MeshStandardMaterial({
            color: decorId === 'dragon_stone' ? 0x64748b : 0x475569,
            roughness: 0.92,
            flatShading: true
        });
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.castShadow = true;
        rock.receiveShadow = true;
        group.add(rock);
    } else if (decorId === 'volcano_aerator_deluxe') {
        // Magma Basalt Volcano
        const coneGeo = new THREE.CylinderGeometry(24, 68, 125, 12, 1, true);
        coneGeo.translate(0, 60, 0);
        const coneMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.95 });
        const cone = new THREE.Mesh(coneGeo, coneMat);
        cone.castShadow = true;
        group.add(cone);

        // Glowing Magma Core
        const coreGeo = new THREE.SphereGeometry(18, 8, 8);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.set(0, 105, 0);
        group.add(core);
    } else if (decorId === 'sunken_temple') {
        // Ancient Marble Column
        const colGeo = new THREE.CylinderGeometry(15, 18, 145, 10);
        colGeo.translate(0, 72, 0);
        const colMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.75 });
        const col = new THREE.Mesh(colGeo, colMat);
        col.castShadow = true;
        group.add(col);
    } else {
        // Lush Live Aquascape Plant with Layered Radiating Stems
        const stemMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.55, side: THREE.DoubleSide });
        for (let l = -3; l <= 3; l++) {
            const leafGeo = new THREE.PlaneGeometry(24, 140);
            leafGeo.translate(0, 70, 0);
            const leaf = new THREE.Mesh(leafGeo, stemMat);
            leaf.rotation.z = l * 0.16;
            leaf.rotation.y = l * 0.45;
            leaf.castShadow = true;
            group.add(leaf);
        }
    }

    return group;
}

// =========================================================================
// 5. FOOD PARTICLES & RISING OXYGEN BUBBLE POOL
// =========================================================================

function initBubblePool() {
    const bubbleGeo = new THREE.SphereGeometry(3.2, 8, 8);
    const bubbleMat = new THREE.MeshPhysicalMaterial({
        color: 0xe0f2fe,
        transparent: true,
        opacity: 0.45,
        transmission: 0.92,
        roughness: 0.05,
        ior: 1.1
    });

    for (let i = 0; i < MAX_BUBBLES_3D; i++) {
        const b = new THREE.Mesh(bubbleGeo, bubbleMat);
        b.position.set(
            (Math.random() - 0.5) * TANK_WIDTH * 0.9,
            -TANK_HEIGHT * 0.5 + Math.random() * TANK_HEIGHT,
            (Math.random() - 0.5) * TANK_DEPTH * 0.85
        );
        b.userData = {
            speed: 1.2 + Math.random() * 1.8,
            wobble: Math.random() * Math.PI * 2
        };
        bubbleGroup.add(b);
        bubblePool.push(b);
    }
}

function updateBubbles3D(dt, now) {
    const topY = TANK_HEIGHT * 0.5 - 20;
    const botY = -TANK_HEIGHT * 0.5 + 20;

    for (let i = 0; i < bubblePool.length; i++) {
        const b = bubblePool[i];
        b.position.y += b.userData.speed * (0.8 + (typeof simSpeed !== 'undefined' ? simSpeed : 1) * 0.2);
        b.position.x += Math.sin(now * 0.003 + b.userData.wobble) * 0.4;

        if (b.position.y > topY) {
            b.position.y = botY;
            b.position.x = (Math.random() - 0.5) * TANK_WIDTH * 0.9;
            b.position.z = (Math.random() - 0.5) * TANK_DEPTH * 0.85;
        }
    }
}

function syncFoodParticles3D() {
    if (typeof foodParticles === 'undefined') return;

    while (foodGroup.children.length > 0) {
        const p = foodGroup.children[0];
        foodGroup.remove(p);
        if (p.geometry) p.geometry.dispose();
        if (p.material) p.material.dispose();
    }

    const foodGeo = new THREE.DodecahedronGeometry(3.8, 0);

    for (let i = 0; i < foodParticles.length; i++) {
        const fp = foodParticles[i];
        const p3d = to3DCoord(fp.x, fp.y, 0);
        const foodMat = new THREE.MeshStandardMaterial({
            color: safeColor(fp.color, 0xf59e0b),
            roughness: 0.65
        });
        const fMesh = new THREE.Mesh(foodGeo, foodMat);
        fMesh.position.set(p3d.x, p3d.y, p3d.z);
        fMesh.castShadow = true;
        foodGroup.add(fMesh);
    }
}

// =========================================================================
// 6. MAIN 3D RENDER LOOP & INTERACTION
// =========================================================================

export function renderAquarium3D(now) {
    if (!threeRenderer || !threeScene || !threeCamera) return;

    const nowMs = performance.now();
    const dt = Math.min(0.1, (nowMs - last3DFrameTime) / 1000);
    last3DFrameTime = nowMs;

    // 1. Smooth Camera Transition (Lerp back to front view on reset)
    if (cameraLerpTarget) {
        threeCamera.position.lerp(cameraLerpTarget.pos, 0.08);
        if (threeControls) {
            threeControls.target.lerp(cameraLerpTarget.look, 0.08);
            threeControls.update();
        }
        if (threeCamera.position.distanceTo(cameraLerpTarget.pos) < 1.0) {
            threeCamera.position.copy(cameraLerpTarget.pos);
            if (threeControls) threeControls.target.copy(cameraLerpTarget.look);
            cameraLerpTarget = null;
        }
    } else if (threeControls) {
        threeControls.update();
    }

    // 2. Animate Caustics Shimmer Shader
    if (causticMesh && causticMesh.material.uniforms) {
        causticMesh.material.uniforms.uTime.value = now * 0.0018;
    }

    // 3. Sync Entity Systems
    syncFishMeshes3D(dt);
    syncFoodParticles3D();
    updateBubbles3D(dt, now);

    // 4. Render 3D Frame
    threeRenderer.render(threeScene, threeCamera);
}

// Toggle Camera 360° Free Rotation Mode
export function toggle360Camera() {
    is360CamActive = !is360CamActive;
    if (threeControls) {
        threeControls.mouseButtons.LEFT = is360CamActive ? THREE.MOUSE.ROTATE : null;
    }
    const btn = document.getElementById('btn-360-cam');
    if (btn) {
        if (is360CamActive) {
            btn.classList.add('bg-cyan-500', 'text-slate-950', 'border-cyan-300');
            btn.classList.remove('bg-slate-800/90', 'text-slate-300', 'border-slate-600/50');
            showToast('🎥 Xoay 360° tự do: Giữ chuột trái và kéo để ngắm bể cá!', 'cyan');
        } else {
            btn.classList.remove('bg-cyan-500', 'text-slate-950', 'border-cyan-300');
            btn.classList.add('bg-slate-800/90', 'text-slate-300', 'border-slate-600/50');
            showToast('🎯 Trở về góc nhìn chính diện bể cá.', 'slate');
            resetCameraView(true);
        }
    }
}

function onCanvas3DClick(event) {
    // If in 360 rotate mode, allow rotation without triggering clicks
    if (is360CamActive) return;
    if (!threeCamera || !fishGroup) return;

    const rect = event.target.getBoundingClientRect();
    mouseVec.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseVec.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouseVec, threeCamera);
    const intersects = raycaster.intersectObjects(fishGroup.children, true);

    if (intersects.length > 0) {
        let hitObj = intersects[0].object;
        while (hitObj.parent && hitObj.parent !== fishGroup) {
            hitObj = hitObj.parent;
        }
        if (hitObj.userData && hitObj.userData.fishId) {
            if (typeof selectFish === 'function') {
                selectFish(hitObj.userData.fishId);
            }
        }
    } else {
        // Tapped Glass
        if (typeof triggerGlassTap === 'function') {
            triggerGlassTap(event.clientX, event.clientY);
        }
    }
}

// =========================================================================
// 7. DUAL-ENGINE SWITCHER (Canvas 2D <-> Three.js 3D)
// =========================================================================

export function setRenderMode(mode) {
    state.renderMode = mode;
    const canvas2D = document.getElementById('aquariumCanvas');
    const canvas3D = document.getElementById('threeCanvas');
    const engineLabel = document.getElementById('hud-engine-label');
    const cam360Btn = document.getElementById('btn-360-cam');

    if (mode === '3d') {
        if (canvas2D) canvas2D.classList.add('hidden');
        if (canvas3D) canvas3D.classList.remove('hidden');
        if (engineLabel) engineLabel.textContent = '3D WebGL';
        if (cam360Btn) cam360Btn.classList.remove('hidden');
        if (!threeRenderer) initThreeScene();
        resetCameraView(false);
        updateThreeEnvironment();
        showToast('🚀 Đã chuyển sang Three.js WebGL 3D! 60+ FPS mượt mà!', 'cyan');
    } else {
        if (canvas3D) canvas3D.classList.add('hidden');
        if (canvas2D) canvas2D.classList.remove('hidden');
        if (engineLabel) engineLabel.textContent = '2D Canvas';
        if (cam360Btn) cam360Btn.classList.add('hidden');
        showToast('🎨 Đã chuyển sang HTML5 Canvas 2D.', 'slate');
    }

    if (typeof saveGame === 'function') saveGame(true);
}

export function toggleRenderEngine() {
    const nextMode = (state.renderMode === '3d') ? '2d' : '3d';
    setRenderMode(nextMode);
}

// Expose globally
window.__threeToggleReady = toggleRenderEngine;
window.toggleRenderEngine = toggleRenderEngine;
window.toggle360Camera = toggle360Camera;
window.resetCameraView = resetCameraView;
window.setRenderMode = setRenderMode;
window.renderAquarium3D = renderAquarium3D;
window.initThreeScene = initThreeScene;
window.updateThreeLighting = updateThreeEnvironment;
window.updateThreeEnvironment = updateThreeEnvironment;
