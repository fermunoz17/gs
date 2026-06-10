// ── Audio ──────────────────────────────────────────────────────
let audioCtx = null;
function getAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
}

function playCluck() {
    try {
        const ac = getAudio();
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain); gain.connect(ac.destination);
        osc.type = 'square';
        const t = ac.currentTime;
        osc.frequency.setValueAtTime(700, t);
        osc.frequency.setValueAtTime(1000, t + 0.03);
        osc.frequency.setValueAtTime(550, t + 0.07);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
        osc.start(t); osc.stop(t + 0.13);
    } catch (e) { }
}

function playBark(isPoodle) {
    try {
        const ac = getAudio();
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain); gain.connect(ac.destination);
        osc.type = 'sawtooth';
        const t = ac.currentTime;
        const f = isPoodle ? 420 : 200;
        osc.frequency.setValueAtTime(f, t);
        osc.frequency.exponentialRampToValueAtTime(f * 0.55, t + 0.14);
        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.start(t); osc.stop(t + 0.18);
    } catch (e) { }
}

// ── Screen management ──────────────────────────────────────────
const introScreen = document.getElementById("intro-screen");
const gameScreen = document.getElementById("game-screen");
const winScreen = document.getElementById("win-screen");

document.getElementById("start-button").addEventListener("click", startGame);
document.getElementById("play-again-button").addEventListener("click", startGame);

// Reward buttons — highlight selection, no backend needed
['reward-match', 'reward-coffee', 'reward-other'].forEach(id => {
    document.getElementById(id).addEventListener('click', function () {
        document.querySelectorAll('.reward-btn').forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');
    });
});

function showScreen(s) {
    [introScreen, gameScreen, winScreen].forEach(x => x.classList.remove("active"));
    s.classList.add("active");
}


// ── Canvas ─────────────────────────────────────────────────────
const canvas = document.createElement("canvas");
canvas.style.position = "absolute";
canvas.style.top = "0";
canvas.style.left = "0";
document.getElementById("game-area").appendChild(canvas);

const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// ── Pixel scale ────────────────────────────────────────────────
const PX = 6;        // environment scale
const CHAR_PX = 8;   // character scale (player, dogs, chickens)
const TABLE_PX = 10; // table scale (bigger surface)

// ── Palette ────────────────────────────────────────────────────
const T = null;

// Player
const DK = '#3d2000';
const SK = '#f5c18a';
const EY = '#2a1000';
const BT = '#111111';
const NS = '#d4956a';
// Player — dark hair / hoodie / jeans
const HR = '#3a1a05';  // dark brown hair
const HA = '#4d2a0a';  // hair highlight (medium dark brown)
const GD = '#ffd700';  // gold jewelry
const HZ = '#1a1a1a';  // hoodie dark
const HM = '#252525';  // hoodie mid
const HK = '#363636';  // hoodie lighter/inner
const ZP = '#aaaaaa';  // zipper
const JN = '#2255aa';  // jeans blue
const JD = '#1a4088';  // jeans shadow

// Chicken
const CW = '#f8f5e0';
const CR = '#dd2222';
const CY = '#ffcc22';
const CO = '#e88822';
const CB = '#1a1000';
const CG = '#d4c088';

// Poodle (black)
const PDA = '#111111'; // black fur
const PDG = '#383838'; // dark gray (curl depth)
const PDN = '#cc6666'; // pink nose

// Beagle (tri-color)
const BGA = '#1a1010'; // black saddle / ears
const BGB = '#c87028'; // tan/golden brown
const BGW = '#f0e8d0'; // off-white chest/muzzle
const BGE = '#1a0a00'; // eye

// Wood (fence / table)
const WD = '#5c3a1e';
const WM = '#8b5e3c';
const WL = '#c8864a';

// Watermelon
const MLG = '#33aa22';
const MLR = '#ee4444';
const MLS = '#221100';

// Bowl / dog food
const BWD = '#555555';
const BWL = '#999999';
const DFB = '#8b5e3c';

// Water bowl
const WBB = '#3377cc'; // water blue
const WBH = '#55aaee'; // water highlight

// Dog food bag
const BGB2 = '#7a4010'; // dark brown bag
const BGM2 = '#aa6028'; // mid brown
const BGL2 = '#cc8840'; // light/highlight
const BGR2 = '#dd3311'; // red label stripe

// ── Player sprites: 10×16 ──────────────────────────────────────
const CHAR_FRAMES = [
    // Frame 0 — neutral
    [
        [T, T, HR, HR, HR, HR, HR, HR, T, T],  // hair crown
        [T, T, HR, HR, HR, HR, HR, HR, T, T],  // even straight bangs — full fringe
        [T, T, HR, SK, EY, SK, EY, HR, T, T],  // face below bang; symmetric sides; earring
        [T, T, HR, SK, SK, NS, SK, HR, T, T],  // nose; hair framing both sides
        [T, T, HR, HR, SK, SK, HR, HR, T, T],  // chin; hair wider = slightly longer
        [T, HR, HZ, HK, GD, SK, HK, HZ, HR, T],  // hair flows to shoulder; hoodie + thin chain
        [T, HZ, HM, HK, HK, HK, HM, HM, HZ, T],  // hoodie chest (no pendant)
        [T, HZ, HM, HM, ZP, HM, HM, HM, HZ, T],  // zipper bottom half visible
        [T, T, HZ, HM, ZP, HM, HZ, T, T, T],  // hoodie hem + zipper tab
        [T, T, T, JD, JN, JN, JD, T, T, T],  // jeans waist
        [T, T, JN, JD, T, T, JD, JN, T, T],  // legs
        [T, T, JN, JD, T, T, JD, JN, T, T],
        [T, T, JN, JD, T, T, JD, JN, T, T],
        [T, T, BT, BT, T, T, BT, BT, T, T],  // boots
        [T, BT, BT, BT, T, T, BT, BT, BT, T],
        [T, T, T, T, T, T, T, T, T, T],
    ],
    // Frame 1 — stride
    [
        [T, T, HR, HR, HR, HR, HR, HR, T, T],
        [T, HR, HR, HR, HR, HR, HR, HR, HR, T],  // even bangs
        [T, T, HR, SK, EY, SK, EY, HR, T, T],  // symmetric; earring
        [T, T, HR, SK, SK, NS, SK, HR, T, T],  // hair framing both sides
        [T, T, HR, HR, SK, SK, HR, HR, T, T],  // slightly longer hair
        [T, HR, HZ, HK, GD, SK, HK, HZ, HR, T],  // hair at shoulder; thin chain
        [HZ, HK, HM, HM, HM, HM, HK, T, T, T],  // hoodie chest, no pendant; left arm swings out
        [T, HZ, HM, HM, ZP, HM, HM, HM, HZ, T],
        [T, T, HZ, HM, ZP, HM, HZ, T, T, T],
        [T, T, T, JD, JN, JN, JD, T, T, T],
        [T, JN, JN, T, T, T, T, JN, T, T],  // legs stride apart
        [T, JN, JN, T, T, T, T, JN, T, T],
        [T, JN, JD, T, T, JN, JN, T, T, T],
        [T, BT, BT, T, T, JN, JN, T, T, T],
        [BT, BT, T, T, T, BT, BT, T, T, T],
        [T, T, T, T, T, T, T, T, T, T],
    ],
];

// ── Chicken color palettes ────────────────────────────────────
const CHICK_COLORS = {
    orange: { fw: '#e87820', wd: '#b85508', ft: '#c06010' },
    black: { fw: '#222222', wd: '#444444', ft: '#333333' },
    grey: { fw: '#aaaaaa', wd: '#777777', ft: '#888888' },
};

// Builds chicken frames from a palette; CR/CY/CB stay constant
function buildChickFrames({ fw, wd, ft }) {
    return [
        [
            [T, T, CR, T, T, T, T, T],
            [T, fw, fw, fw, T, T, T, T],
            [T, fw, CB, fw, CY, T, T, T],
            [T, CR, fw, fw, T, T, T, T],
            [fw, fw, wd, fw, fw, fw, T, T],
            [fw, fw, fw, fw, fw, fw, T, T],
            [T, T, ft, T, T, ft, T, T],
            [T, T, ft, ft, T, ft, ft, T],
        ],
        [
            [T, T, CR, T, T, T, T, T],
            [T, fw, fw, fw, T, T, T, T],
            [T, fw, CB, fw, CY, T, T, T],
            [T, CR, fw, fw, T, T, T, T],
            [fw, fw, wd, fw, fw, fw, T, T],
            [fw, fw, fw, fw, fw, fw, T, T],
            [T, ft, T, T, ft, T, T, T],
            [ft, ft, T, T, ft, ft, T, T],
        ],
    ];
}

// ── Chicken sprites: 8×8 ──────────────────────────────────────

// ── Poodle sprites: 10×7 (black, curly, pompom tail) ─────────
// Faces right; pompom tail on the left, head on the right.
const POODLE_FRAMES = [
    // Frame 0
    [
        [T, T, T, T, T, T, PDA, PDA, T, T],  // pompom head
        [T, T, T, T, T, PDA, PDG, PDA, PDA, T],  // round head
        [T, T, T, T, PDA, PDG, PDN, PDG, PDA, T],  // face + nose
        [PDA, PDG, T, PDA, PDA, PDG, PDA, T, T, T],  // pompom tail + body
        [T, PDA, PDG, PDG, PDG, PDA, T, T, T, T],  // body
        [T, T, PDA, PDG, T, PDA, PDG, T, T, T],  // legs
        [T, T, PDA, T, T, PDA, T, T, T, T],  // paws
    ],
    // Frame 1 (legs alternate, tail raises)
    [
        [T, T, T, T, T, T, PDA, PDA, T, T],
        [T, T, T, T, T, PDA, PDG, PDA, PDA, T],
        [T, T, T, T, PDA, PDG, PDN, PDG, PDA, T],
        [T, PDA, PDG, PDA, PDA, PDG, PDA, T, T, T],  // tail raised
        [PDA, PDA, PDG, PDG, PDG, PDA, T, T, T, T],
        [T, PDA, PDG, T, PDA, PDG, T, T, T, T],  // legs alternated
        [T, PDA, T, T, PDA, T, T, T, T, T],
    ],
];

// ── Beagle sprites: 10×7 (tri-color: black/tan/white) ────────
// Faces right; tail on the left, head on the right.
const BEAGLE_FRAMES = [
    // Frame 0
    [
        [T, T, T, T, T, T, BGA, T, T, T],  // droopy ear
        [T, T, T, T, T, BGA, BGW, BGA, T, T],  // head
        [T, T, T, T, BGA, BGW, BGE, BGW, BGB, T],  // face + eye + muzzle
        [BGW, BGB, BGB, BGB, BGA, BGA, BGA, BGB, T, T],  // white tail + tan body + black saddle
        [T, BGB, BGB, BGB, BGB, BGB, BGB, T, T, T],  // tan body
        [T, T, BGA, BGB, T, T, BGA, BGB, T, T],  // legs
        [T, T, BGA, T, T, T, BGA, T, T, T],  // paws
    ],
    // Frame 1 (legs alternate, tail up)
    [
        [T, T, T, T, T, T, BGA, T, T, T],
        [T, T, T, T, T, BGA, BGW, BGA, T, T],
        [T, T, T, T, BGA, BGW, BGE, BGW, BGB, T],
        [T, BGA, BGB, BGB, BGA, BGA, BGA, BGB, T, T],  // tail raised
        [BGW, BGB, BGB, BGB, BGB, BGB, BGB, T, T, T],
        [T, BGA, BGB, T, T, BGA, BGB, T, T, T],  // legs alternated
        [T, BGA, T, T, T, BGA, T, T, T, T],
    ],
];

// ── Table sprite: 14×6 ────────────────────────────────────────
const TABLE_SPRITE = [
    [WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL],
    [WL, WM, WM, WM, WM, WM, WM, WM, WM, WM, WM, WM, WM, WD],
    [WM, WM, WM, WM, WM, WM, WM, WM, WM, WM, WM, WM, WD, WD],
    [T, T, WD, WD, T, T, T, T, T, T, WD, WD, T, T],
    [T, T, WD, WD, T, T, T, T, T, T, WD, WD, T, T],
    [T, T, WD, WD, T, T, T, T, T, T, WD, WD, T, T],
];

// ── Watermelon sprite: 6×5 ────────────────────────────────────
const WATERMELON_SPRITE = [
    [T, MLG, MLG, MLG, MLG, T],
    [MLG, MLR, MLR, MLR, MLR, MLG],
    [MLG, MLR, MLS, MLR, MLS, MLG],
    [MLG, MLR, MLR, MLR, MLR, MLG],
    [T, MLG, MLG, MLG, MLG, T],
];

// ── Dog food bowl sprite: 6×4 ─────────────────────────────────
const DOGFOOD_SPRITE = [
    [T, BWD, BWD, BWD, BWD, T],
    [BWD, DFB, DFB, DFB, DFB, BWD],
    [BWD, BWL, BWL, BWL, BWL, BWD],
    [T, BWD, BWD, BWD, BWD, T],
];

// ── Water bowl sprite: 6×4 ────────────────────────────────────
const WATER_BOWL_SPRITE = [
    [T, BWD, BWD, BWD, BWD, T],
    [BWD, WBH, WBB, WBH, WBB, BWD],
    [BWD, WBB, WBB, WBB, WBB, BWD],
    [T, BWD, BWD, BWD, BWD, T],
];

// ── Dog food bag sprite: 5×7 ──────────────────────────────────
const DOGBAG_SPRITE = [
    [T, BGM2, BGL2, BGM2, T],  // tied top knot
    [BGB2, BGL2, BGL2, BGL2, BGB2],  // upper bag
    [BGB2, BGM2, BGR2, BGM2, BGB2],  // red label stripe
    [BGB2, BGR2, BGR2, BGR2, BGB2],  // label body
    [BGB2, BGM2, BGR2, BGM2, BGB2],  // lower bag
    [BGB2, BGL2, BGL2, BGL2, BGB2],  // bag bottom
    [T, BGB2, BGB2, BGB2, T],  // base
];

// ── Renderer ──────────────────────────────────────────────────
function drawSprite(pixels, sx, sy, scale, flipX = false) {
    const rows = pixels.length;
    const cols = pixels[0].length;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const color = pixels[r][flipX ? cols - 1 - c : c];
            if (!color) continue;
            ctx.fillStyle = color;
            ctx.fillRect(sx + c * scale, sy + r * scale, scale, scale);
        }
    }
}

// ── Background data ───────────────────────────────────────────
const DIRT = [
    [0.22, 0.50, 58, 28],
    [0.70, 0.24, 48, 22],
    [0.50, 0.74, 68, 30],
    [0.82, 0.58, 42, 20],
    [0.35, 0.85, 52, 24],
];

// ── Game constants ────────────────────────────────────────────
const CHAR_W = 10 * CHAR_PX;
const CHAR_H = 16 * CHAR_PX;
const CHICK_W = 8 * CHAR_PX;
const CHICK_H = 8 * CHAR_PX;
const DOG_W = 10 * CHAR_PX;
const DOG_H = 7 * CHAR_PX;
const TABLE_W = 14 * TABLE_PX;
const TABLE_H = 6 * TABLE_PX;
const WM_W = 6 * PX;
const WM_H = 5 * PX;
const DF_W = 6 * PX;
const DF_H = 4 * PX;

const SPEED = 150;
const WALK_RATE = 0.13;
const TOTAL_CHICKENS = 7;
const MAX_CARRY = 2;
const FLEE_DIST = 90;
const HEADER_H = 55;

// Coop pen
const PEN_W = 200;
const PEN_H = 170;
const FENCE_T = 10;
const GATE_W = 58;

// Item offsets on table (from tableX)
const WM_TABLE_OX = TABLE_PX * 1;   // watermelon left edge

// Dog eating area dimensions
const DOG_AREA_W = 152;
const DOG_AREA_H = 56;

// Dog food bag size
const BAG_W = 5 * PX;
const BAG_H = 7 * PX;
const BAG_TABLE_OX = TABLE_PX * 8;  // offset from tableX

// Chicken names and per-name colors
const CHICKEN_NAMES = ['Esther', 'Carmela', 'Merlina', 'Patricia', 'Diana', 'Matilde', 'Margarita'];
const CHICKEN_COLOR_MAP = {
    Esther: 'grey',
    Carmela: 'black',
    Merlina: 'black',
    Patricia: 'black',
    Diana: 'orange',
    Matilde: 'grey',
    Margarita: 'orange',
};

// Pre-built frame sets for each color
const CHICK_FRAMES_BY_COLOR = {
    orange: buildChickFrames(CHICK_COLORS.orange),
    black: buildChickFrames(CHICK_COLORS.black),
    grey: buildChickFrames(CHICK_COLORS.grey),
};

// ── State ─────────────────────────────────────────────────────
const player = { x: 0, y: 0, frame: 0, frameTick: 0, facing: 1 };
let penX = 0, penY = 0;
let tableX = 0, tableY = 0;
let dogAreaX = 0, dogAreaY = 0;
let chickens = [];
let coopChickens = [];
let dogs = [];
let carrying = [];   // array of {name, color} for chickens being held
let holding = null;           // null | 'watermelon' | 'dogbag'
let watermelonAvail = true;
let dogBagOnTable = true;
let bowlFilled = [false, false]; // [poodle bowl, beagle bowl]
let chickensFed = false;
let gameOver = false;
let chickenNameIdx = 0;
let raf = null, keys = {}, lastTs = 0, gameTime = 0;
let particles = [];

// ── Input ─────────────────────────────────────────────────────
window.addEventListener("keydown", e => {
    keys[e.key] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
});
window.addEventListener("keyup", e => { keys[e.key] = false; });

['up', 'down', 'left', 'right'].forEach(dir => {
    const btn = document.getElementById(`dpad-${dir}`);
    if (!btn) return;
    btn.addEventListener("pointerdown", e => { e.preventDefault(); keys[`dpad-${dir}`] = true; });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => {
        btn.addEventListener(ev, () => { keys[`dpad-${dir}`] = false; });
    });
});

// ── Helpers ───────────────────────────────────────────────────
function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function gateY() {
    return penY + (PEN_H - GATE_W) / 2;
}

function makeChicken(inCoop) {
    const margin = 40;
    let x, y;
    if (inCoop) {
        const innerX = penX + FENCE_T + 5;
        const innerY = penY + FENCE_T + 5;
        const innerW = PEN_W - FENCE_T * 2 - CHICK_W - 10;
        const innerH = PEN_H - FENCE_T * 2 - CHICK_H - 10;
        x = innerX + Math.random() * innerW;
        y = innerY + Math.random() * innerH;
    } else {
        let tries = 0;
        do {
            x = margin + Math.random() * (canvas.width - CHICK_W - margin * 2);
            y = HEADER_H + margin + Math.random() * (canvas.height - CHICK_H - HEADER_H - margin * 2);
            tries++;
        } while (tries < 30 && (
            rectsOverlap(x, y, CHICK_W, CHICK_H, penX - 20, penY - 20, PEN_W + 40, PEN_H + 40) ||
            rectsOverlap(x, y, CHICK_W, CHICK_H, player.x - 120, player.y - 120, CHAR_W + 240, CHAR_H + 240)
        ));
    }
    const angle = Math.random() * Math.PI * 2;
    const name = CHICKEN_NAMES[chickenNameIdx++ % CHICKEN_NAMES.length];
    return {
        x, y,
        vx: Math.cos(angle), vy: Math.sin(angle),
        speed: 30 + Math.random() * 20,
        frame: 0, frameTick: 0,
        dirTimer: Math.random() * 2,
        facing: 1,
        name,
        color: CHICKEN_COLOR_MAP[name] || 'orange',
        dropTimer: 0,
        soundTimer: 2 + Math.random() * 4,
    };
}

function spawnChickenWithColor(x, y, angle, name, color, dropped = false) {
    return {
        x, y,
        vx: Math.cos(angle), vy: Math.sin(angle),
        speed: dropped ? 180 : 100,
        frame: 0, frameTick: 0,
        dirTimer: dropped ? 1.5 : 0.4,
        facing: 1,
        name, color,
        dropTimer: dropped ? 2.0 : 0,
        soundTimer: 1 + Math.random() * 3,
    };
}

function spawnSparks(x, y) {
    const colors = ['#ffee44', '#ff8822', '#ffffff', '#ff4400'];
    for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 90 + Math.random() * 140;
        const life = 0.35 + Math.random() * 0.25;
        particles.push({
            x, y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd - 40,
            life, maxLife: life,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 3 + Math.random() * 3,
        });
    }
}

function makeDog(type) {
    const margin = 60;
    let x, y, tries = 0;
    do {
        x = margin + Math.random() * (canvas.width - DOG_W - margin * 2);
        y = HEADER_H + margin + Math.random() * (canvas.height - DOG_H - HEADER_H - margin * 2);
        tries++;
    } while (tries < 20 && (
        rectsOverlap(x, y, DOG_W, DOG_H, penX - 40, penY - 40, PEN_W + 80, PEN_H + 80) ||
        rectsOverlap(x, y, DOG_W, DOG_H, player.x - 60, player.y - 60, CHAR_W + 120, CHAR_H + 120)
    ));
    const angle = Math.random() * Math.PI * 2;
    const isPoodle = type === 'poodle';
    return {
        x, y,
        vx: Math.cos(angle), vy: Math.sin(angle),
        speed: isPoodle ? 55 + Math.random() * 20 : 72 + Math.random() * 22,
        frame: 0, frameTick: 0,
        dirTimer: 1 + Math.random() * 2,
        facing: 1,
        eating: false,
        eatTimer: 0,
        hasEaten: false,
        bowlIdx: isPoodle ? 0 : 1,
        type,
        name: isPoodle ? 'Don Bruno el Poodle' : 'Nikki',
        barkTimer: 3 + Math.random() * 4,
    };
}

function pushOutOfPen(obj, ow, oh) {
    if (!rectsOverlap(obj.x, obj.y, ow, oh, penX, penY, PEN_W, PEN_H)) return;
    const cx2 = obj.x + ow / 2;
    const cy2 = obj.y + oh / 2;
    const dLeft = Math.abs(cx2 - penX);
    const dRight = Math.abs(cx2 - (penX + PEN_W));
    const dTop = Math.abs(cy2 - penY);
    const dBottom = Math.abs(cy2 - (penY + PEN_H));
    const minD = Math.min(dLeft, dRight, dTop, dBottom);
    if (minD === dLeft) { obj.x = penX - ow; obj.vx = -Math.abs(obj.vx); }
    else if (minD === dRight) { obj.x = penX + PEN_W; obj.vx = Math.abs(obj.vx); }
    else if (minD === dTop) { obj.y = penY - oh; obj.vy = -Math.abs(obj.vy); }
    else { obj.y = penY + PEN_H; obj.vy = Math.abs(obj.vy); }
}

function getBowlPos(idx) {
    // Water bowl at offset 8; poodle bowl at 54; beagle bowl at 100
    const offsets = [54, 100];
    return {
        x: dogAreaX + offsets[idx],
        y: dogAreaY + Math.floor((DOG_AREA_H - DF_H) / 2),
    };
}

// ── HUD ───────────────────────────────────────────────────────
function updateHUD() {
    const inCoop = coopChickens.length;
    document.getElementById("hud-left").textContent = `Coop: ${inCoop}/${TOTAL_CHICKENS}`;

    let msg;
    if (inCoop < TOTAL_CHICKENS) {
        msg = carrying.length > 0 ? `Carrying: ${carrying.length}` : "Herd the chickens!";
    } else if (!chickensFed) {
        if (holding === 'watermelon') msg = "Bring to the coop!";
        else msg = "Get the watermelon!";
    } else {
        const fedCount = dogs.filter(d => d.hasEaten).length;
        if (fedCount >= 2) {
            msg = "Everyone's happy!";
        } else if (holding === 'dogbag') {
            msg = "Fill a bowl!";
        } else {
            const eating = dogs.filter(d => d.eating).length;
            msg = eating > 0 ? `Eating… ${fedCount}/2` : `Feed the dogs! ${fedCount}/2`;
        }
    }
    document.getElementById("hud-right").textContent = msg;
}

// ── Update ────────────────────────────────────────────────────
function update(dt) {
    // Player movement
    let dx = 0, dy = 0;
    if (keys['ArrowLeft'] || keys['a'] || keys['A'] || keys['dpad-left']) dx -= 1;
    if (keys['ArrowRight'] || keys['d'] || keys['D'] || keys['dpad-right']) dx += 1;
    if (keys['ArrowUp'] || keys['w'] || keys['W'] || keys['dpad-up']) dy -= 1;
    if (keys['ArrowDown'] || keys['s'] || keys['S'] || keys['dpad-down']) dy += 1;

    const moving = dx !== 0 || dy !== 0;
    if (moving) {
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const step = SPEED * dt;
        player.x = Math.max(0, Math.min(canvas.width - CHAR_W, player.x + (dx / len) * step));
        player.y = Math.max(HEADER_H, Math.min(canvas.height - CHAR_H, player.y + (dy / len) * step));
        if (dx > 0) player.facing = 1;
        if (dx < 0) player.facing = -1;
        player.frameTick += dt;
        if (player.frameTick >= WALK_RATE) {
            player.frameTick -= WALK_RATE;
            player.frame = 1 - player.frame;
        }
    } else {
        player.frame = 0;
        player.frameTick = 0;
    }

    // Player hitbox (lower half)
    const hx = player.x + PX * 2;
    const hy = player.y + CHAR_H * 0.45;
    const hw = CHAR_W - PX * 4;
    const hh = CHAR_H * 0.55;

    // Pick up chickens (only when not holding an item, and not within drop immunity window)
    if (holding === null) {
        chickens = chickens.filter(c => {
            if (carrying.length < MAX_CARRY && c.dropTimer <= 0 && rectsOverlap(hx, hy, hw, hh, c.x, c.y, CHICK_W, CHICK_H)) {
                carrying.push({ name: c.name, color: c.color });
                return false;
            }
            return true;
        });
    }

    // Deposit chickens at coop gate (right side of pen)
    const gy = gateY();
    const gateRightX = penX + PEN_W - FENCE_T;
    if (carrying.length > 0 && rectsOverlap(hx, hy, hw, hh, gateRightX - 22, gy, 32, GATE_W)) {
        for (const c of carrying) {
            const cc = makeChicken(true);
            cc.name = c.name;
            cc.color = c.color;
            coopChickens.push(cc);
        }
        carrying = [];
    }

    // Item positions
    const wmX = tableX + WM_TABLE_OX;
    const wmY = tableY - WM_H;
    const bagX = tableX + BAG_TABLE_OX;
    const bagY = tableY - BAG_H;

    // Pick up watermelon (only when all chickens in coop)
    if (holding === null && carrying.length === 0 && watermelonAvail && coopChickens.length >= TOTAL_CHICKENS) {
        if (rectsOverlap(hx, hy, hw, hh, wmX, wmY, WM_W, WM_H)) {
            holding = 'watermelon';
            watermelonAvail = false;
        }
    }

    // Feed watermelon to chickens (approach coop gate)
    if (holding === 'watermelon') {
        if (rectsOverlap(hx, hy, hw, hh, gateRightX - 26, gy, 36, GATE_W)) {
            chickensFed = true;
            holding = null;
        }
    }

    // Pick up dog food bag from table
    if (holding === null && carrying.length === 0 && dogBagOnTable) {
        if (rectsOverlap(hx, hy, hw, hh, bagX, bagY, BAG_W, BAG_H)) {
            holding = 'dogbag';
            dogBagOnTable = false;
        }
    }

    // Drop bag into a dog's bowl (player walks to either bowl)
    if (holding === 'dogbag') {
        for (let bi = 0; bi < 2; bi++) {
            if (bowlFilled[bi]) continue;
            const bp = getBowlPos(bi);
            if (rectsOverlap(hx, hy, hw, hh, bp.x - 12, bp.y - 12, DF_W + 24, DF_H + 24)) {
                bowlFilled[bi] = true;
                holding = null;
                break;
            }
        }
    }

    // Auto-respawn bag when a bowl still needs filling
    if (!dogBagOnTable && holding !== 'dogbag') {
        const needFill = dogs.some(d => !d.eating && !d.hasEaten && !bowlFilled[d.bowlIdx]);
        if (needFill) dogBagOnTable = true;
    }

    // Outside chicken AI
    for (const c of chickens) {
        if (c.dropTimer > 0) c.dropTimer -= dt;
        let fled = false;
        for (const d of dogs) {
            const ddx = (c.x + CHICK_W / 2) - (d.x + DOG_W / 2);
            const ddy = (c.y + CHICK_H / 2) - (d.y + DOG_H / 2);
            const dogDist = Math.sqrt(ddx * ddx + ddy * ddy);
            if (dogDist < FLEE_DIST * 1.6) {
                const len = dogDist || 1;
                c.vx = ddx / len; c.vy = ddy / len;
                c.speed = 110; c.dirTimer = 0.3;
                fled = true; break;
            }
        }

        const cdx = (c.x + CHICK_W / 2) - (player.x + CHAR_W / 2);
        const cdy = (c.y + CHICK_H / 2) - (player.y + CHAR_H / 2);
        const dist = Math.sqrt(cdx * cdx + cdy * cdy);

        if (!fled && dist < FLEE_DIST) {
            const len = dist || 1;
            c.vx = cdx / len; c.vy = cdy / len;
            c.speed = 95; c.dirTimer = 0.25;
        } else if (!fled) {
            c.dirTimer -= dt;
            if (c.dirTimer <= 0) {
                const angle = Math.random() * Math.PI * 2;
                c.vx = Math.cos(angle); c.vy = Math.sin(angle);
                c.speed = 35 + Math.random() * 25;
                c.dirTimer = 1.5 + Math.random() * 2;
            }
        }

        c.x += c.vx * c.speed * dt;
        c.y += c.vy * c.speed * dt;

        if (c.x < 0) { c.x = 0; c.vx = Math.abs(c.vx); }
        if (c.x > canvas.width - CHICK_W) { c.x = canvas.width - CHICK_W; c.vx = -Math.abs(c.vx); }
        if (c.y < HEADER_H) { c.y = HEADER_H; c.vy = Math.abs(c.vy); }
        if (c.y > canvas.height - CHICK_H) { c.y = canvas.height - CHICK_H; c.vy = -Math.abs(c.vy); }

        pushOutOfPen(c, CHICK_W, CHICK_H);

        if (c.vx > 0.05) c.facing = 1;
        if (c.vx < -0.05) c.facing = -1;
        c.frameTick += dt;
        if (c.frameTick >= 0.18) { c.frameTick = 0; c.frame = 1 - c.frame; }

        c.soundTimer -= dt;
        if (c.soundTimer <= 0) { playCluck(); c.soundTimer = 3 + Math.random() * 5; }
    }

    // Coop chicken AI (wander inside pen)
    const innerX = penX + FENCE_T;
    const innerY = penY + FENCE_T;
    const innerW = PEN_W - FENCE_T * 2;
    const innerH = PEN_H - FENCE_T * 2;
    for (const c of coopChickens) {
        c.dirTimer -= dt;
        if (c.dirTimer <= 0) {
            const angle = Math.random() * Math.PI * 2;
            c.vx = Math.cos(angle); c.vy = Math.sin(angle);
            c.speed = 22 + Math.random() * 15;
            c.dirTimer = 1 + Math.random() * 2.5;
        }
        c.x += c.vx * c.speed * dt;
        c.y += c.vy * c.speed * dt;
        if (c.x < innerX) { c.x = innerX; c.vx = Math.abs(c.vx); }
        if (c.x + CHICK_W > innerX + innerW) { c.x = innerX + innerW - CHICK_W; c.vx = -Math.abs(c.vx); }
        if (c.y < innerY) { c.y = innerY; c.vy = Math.abs(c.vy); }
        if (c.y + CHICK_H > innerY + innerH) { c.y = innerY + innerH - CHICK_H; c.vy = -Math.abs(c.vy); }
        if (c.vx > 0.05) c.facing = 1;
        if (c.vx < -0.05) c.facing = -1;
        c.frameTick += dt;
        if (c.frameTick >= 0.22) { c.frameTick = 0; c.frame = 1 - c.frame; }
    }

    // Dog AI
    for (const d of dogs) {
        const isBeagle = d.type === 'beagle';

        // Currently eating — count down timer, stay in place
        if (d.eating) {
            d.eatTimer -= dt;
            if (d.eatTimer <= 0) {
                // Done eating — resume normal behavior
                d.eating = false;
                bowlFilled[d.bowlIdx] = false;
            }
            d.frameTick += dt;
            if (d.frameTick >= 0.18) { d.frameTick = 0; d.frame = 1 - d.frame; }
            continue;
        }

        // Vector to player
        const pdx = (player.x + CHAR_W / 2) - (d.x + DOG_W / 2);
        const pdy = (player.y + CHAR_H / 2) - (d.y + DOG_H / 2);
        const playerDist = Math.sqrt(pdx * pdx + pdy * pdy);

        let chasing = false;

        if (bowlFilled[d.bowlIdx]) {
            // This dog's bowl has food — run to it
            const bp = getBowlPos(d.bowlIdx);
            const bcx = bp.x + DF_W / 2;
            const bcy = bp.y + DF_H / 2;
            const bdx = bcx - (d.x + DOG_W / 2);
            const bdy = bcy - (d.y + DOG_H / 2);
            const bowlDist = Math.sqrt(bdx * bdx + bdy * bdy);
            if (bowlDist < 26) {
                // Snap to bowl and start eating
                d.eating = true;
                d.eatTimer = 60;          // 1 minute
                d.hasEaten = true;
                d.vx = 0; d.vy = 0;
            } else {
                const len = bowlDist || 1;
                d.vx = bdx / len; d.vy = bdy / len;
                d.speed = isBeagle ? 110 : 88;
            }
            chasing = true;
        } else {
            // No food in bowl — chase Glenda
            const chaseDist = isBeagle ? 210 : 165;
            if (playerDist < chaseDist) {
                const len = playerDist || 1;
                d.vx = pdx / len; d.vy = pdy / len;
                d.speed = isBeagle ? 105 : 82;
                chasing = true;
            } else if (isBeagle && chickens.length > 0) {
                // Beagle also hunts nearby free chickens
                let closest = null, closestDist = 185;
                for (const c of chickens) {
                    const cdx = (c.x + CHICK_W / 2) - (d.x + DOG_W / 2);
                    const cdy = (c.y + CHICK_H / 2) - (d.y + DOG_H / 2);
                    const dist = Math.sqrt(cdx * cdx + cdy * cdy);
                    if (dist < closestDist) { closest = c; closestDist = dist; }
                }
                if (closest) {
                    const cdx = (closest.x + CHICK_W / 2) - (d.x + DOG_W / 2);
                    const cdy = (closest.y + CHICK_H / 2) - (d.y + DOG_H / 2);
                    const len = closestDist || 1;
                    d.vx = cdx / len; d.vy = cdy / len;
                    d.speed = 95;
                    chasing = true;
                }
            }
        }

        if (!chasing) {
            d.dirTimer -= dt;
            if (d.dirTimer <= 0) {
                const angle = Math.random() * Math.PI * 2;
                d.vx = Math.cos(angle); d.vy = Math.sin(angle);
                d.speed = isBeagle ? 70 + Math.random() * 22 : 52 + Math.random() * 20;
                d.dirTimer = 1 + Math.random() * 2;
            }
        }

        d.x += d.vx * d.speed * dt;
        d.y += d.vy * d.speed * dt;

        if (d.x < 0) { d.x = 0; d.vx = Math.abs(d.vx); }
        if (d.x > canvas.width - DOG_W) { d.x = canvas.width - DOG_W; d.vx = -Math.abs(d.vx); }
        if (d.y < HEADER_H) { d.y = HEADER_H; d.vy = Math.abs(d.vy); }
        if (d.y > canvas.height - DOG_H) { d.y = canvas.height - DOG_H; d.vy = -Math.abs(d.vy); }

        pushOutOfPen(d, DOG_W, DOG_H);

        if (d.vx > 0.05) d.facing = 1;
        if (d.vx < -0.05) d.facing = -1;
        d.frameTick += dt;
        if (d.frameTick >= 0.14) { d.frameTick = 0; d.frame = 1 - d.frame; }

        d.barkTimer -= dt;
        if (d.barkTimer <= 0) { playBark(d.type === 'poodle'); d.barkTimer = 3 + Math.random() * 5; }

        // Dog bumps player → drop carried chickens + bark
        if (carrying.length > 0 && rectsOverlap(player.x, player.y, CHAR_W, CHAR_H, d.x, d.y, DOG_W, DOG_H)) {
            const bumpX = player.x + CHAR_W / 2;
            const bumpY = player.y + CHAR_H / 2;
            playBark(d.type === 'poodle');
            spawnSparks(bumpX, bumpY);
            for (const c of carrying) {
                const angle = Math.random() * Math.PI * 2;
                chickens.push(spawnChickenWithColor(
                    Math.max(0, Math.min(canvas.width - CHICK_W, player.x + Math.cos(angle) * 60)),
                    Math.max(HEADER_H, Math.min(canvas.height - CHICK_H, player.y + CHAR_H * 0.5 + Math.sin(angle) * 40)),
                    angle, c.name, c.color, true
                ));
            }
            carrying = [];
        }
    }

    // Particles
    particles = particles.filter(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 250 * dt; // gravity
        p.life -= dt;
        return p.life > 0;
    });

    updateHUD();

    // Win condition
    if (!gameOver && chickensFed && dogs.every(d => d.hasEaten)) {
        gameOver = true;
        setTimeout(winGame, 400);
    }
}

// ── Name tag ──────────────────────────────────────────────────
function drawNameTag(text, cx, topY, color) {
    ctx.font = '11px monospace';
    const tw = ctx.measureText(text).width;
    const padX = 4, padY = 2;
    const rx = Math.round(cx - tw / 2 - padX);
    const ry = Math.round(topY - 18);
    ctx.fillStyle = 'rgba(0,0,0,0.62)';
    ctx.fillRect(rx, ry, tw + padX * 2, 15);
    ctx.fillStyle = color || '#ffffff';
    ctx.fillText(text, Math.round(cx - tw / 2), ry + 11);
}

// ── Background ────────────────────────────────────────────────
function drawBackground() {
    const W = canvas.width;
    const H = canvas.height;

    ctx.fillStyle = '#4a9e3f';
    ctx.fillRect(0, 0, W, H);

    for (let x = 0; x < W; x += 16) {
        for (let y = 0; y < H; y += 16) {
            const n = (x * 7331 + y * 1999) % 11;
            if (n < 2) { ctx.fillStyle = '#3d8a34'; ctx.fillRect(x, y, 16, 16); }
            else if (n < 4) { ctx.fillStyle = '#55b347'; ctx.fillRect(x, y, 16, 16); }
        }
    }

    for (const [rx, ry, radX, radY] of DIRT) {
        const cx = rx * W;
        const cy = HEADER_H + ry * (H - HEADER_H);
        ctx.fillStyle = '#7a5010';
        ctx.beginPath(); ctx.ellipse(cx, cy, radX, radY, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#9a6818';
        ctx.beginPath(); ctx.ellipse(cx - radX * 0.1, cy - radY * 0.2, radX * 0.55, radY * 0.55, 0, 0, Math.PI * 2); ctx.fill();
    }

    ctx.fillStyle = 'rgba(0,0,0,0.52)';
    ctx.fillRect(0, 0, W, HEADER_H);

    drawFence();
}

function drawFence() {
    const W = canvas.width;
    const H = canvas.height;
    const CD = '#5c3a1e';
    const CM = '#8b5e3c';
    const CL = '#c8864a';
    const FH = 32;
    const PW = 14;
    const SP = 68;

    function hFence(fy) {
        ctx.fillStyle = CD; ctx.fillRect(0, fy + 9, W, 8);
        ctx.fillStyle = CL; ctx.fillRect(0, fy + 10, W, 5);
        ctx.fillStyle = CD; ctx.fillRect(0, fy + 20, W, 8);
        ctx.fillStyle = CL; ctx.fillRect(0, fy + 21, W, 5);
        for (let x = 0; x < W + SP; x += SP) {
            const px = Math.min(Math.round(x), W - PW);
            ctx.fillStyle = CD; ctx.fillRect(px, fy, PW, FH);
            ctx.fillStyle = CM; ctx.fillRect(px + 2, fy + 1, PW - 4, FH - 3);
            ctx.fillStyle = CL; ctx.fillRect(px + 2, fy + 1, PW - 4, 3);
        }
    }

    function vFence(fx) {
        const y0 = HEADER_H + FH;
        const y1 = H - FH;
        ctx.fillStyle = CD; ctx.fillRect(fx + 9, y0, 8, y1 - y0);
        ctx.fillStyle = CL; ctx.fillRect(fx + 10, y0, 5, y1 - y0);
        ctx.fillStyle = CD; ctx.fillRect(fx + 20, y0, 8, y1 - y0);
        ctx.fillStyle = CL; ctx.fillRect(fx + 21, y0, 5, y1 - y0);
        for (let y = y0; y < y1 + SP; y += SP) {
            const py = Math.min(Math.round(y), y1 - PW);
            ctx.fillStyle = CD; ctx.fillRect(fx, py, FH, PW);
            ctx.fillStyle = CM; ctx.fillRect(fx + 1, py + 2, FH - 3, PW - 4);
            ctx.fillStyle = CL; ctx.fillRect(fx + 1, py + 2, 3, PW - 4);
        }
    }

    hFence(HEADER_H);
    hFence(H - FH);
    vFence(0);
    vFence(W - FH);
}

// ── Coop pen ──────────────────────────────────────────────────
function drawCoopArea() {
    const innerX = penX + FENCE_T;
    const innerY = penY + FENCE_T;
    const innerW = PEN_W - FENCE_T * 2;
    const innerH = PEN_H - FENCE_T * 2;

    // Straw floor
    ctx.fillStyle = '#d4aa44';
    ctx.fillRect(innerX, innerY, innerW, innerH);
    ctx.fillStyle = '#c8962a';
    for (let i = 0; i < 22; i++) {
        const sx = innerX + (i * 37 + 11) % innerW;
        const sy = innerY + (i * 53 + 7) % innerH;
        ctx.fillRect(sx, sy, 10, 2);
    }
    ctx.fillStyle = '#e8c055';
    for (let i = 0; i < 16; i++) {
        const sx = innerX + (i * 61 + 23) % innerW;
        const sy = innerY + (i * 41 + 19) % innerH;
        ctx.fillRect(sx, sy, 7, 2);
    }

    // Pen fence walls
    const CD = '#5c3a1e';
    const CM = '#8b5e3c';
    const CL = '#c8864a';
    const FT = FENCE_T;
    const gy = gateY();

    function penHBar(bx, by, bw) {
        ctx.fillStyle = CD; ctx.fillRect(bx, by, bw, FT);
        ctx.fillStyle = CM; ctx.fillRect(bx + 2, by + 2, bw - 4, FT - 4);
        ctx.fillStyle = CL; ctx.fillRect(bx + 2, by + 2, bw - 4, 3);
    }
    function penVBar(bx, by, bh) {
        ctx.fillStyle = CD; ctx.fillRect(bx, by, FT, bh);
        ctx.fillStyle = CM; ctx.fillRect(bx + 2, by + 2, FT - 4, bh - 4);
        ctx.fillStyle = CL; ctx.fillRect(bx + 2, by + 2, 3, bh - 4);
    }

    penHBar(penX, penY, PEN_W);                        // top
    penHBar(penX, penY + PEN_H - FT, PEN_W);           // bottom
    penVBar(penX, penY, PEN_H);                        // left
    // right side: two segments with gate gap
    const topH = gy - penY;
    const botH = penY + PEN_H - (gy + GATE_W);
    if (topH > 0) penVBar(penX + PEN_W - FT, penY, topH);
    if (botH > 0) penVBar(penX + PEN_W - FT, gy + GATE_W, botH);

    // Gate post markers
    ctx.fillStyle = CL;
    ctx.fillRect(penX + PEN_W - FT - 3, gy - 4, FT + 3, 5);
    ctx.fillRect(penX + PEN_W - FT - 3, gy + GATE_W, FT + 3, 5);
}

// ── Table ─────────────────────────────────────────────────────
function drawItemLabel(text, cx, y) {
    ctx.font = 'bold 9px monospace';
    const tw = ctx.measureText(text).width;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(Math.round(cx - tw / 2 - 4), y, tw + 8, 13);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, Math.round(cx - tw / 2), y + 10);
}

function drawTable() {
    drawSprite(TABLE_SPRITE, tableX, tableY, TABLE_PX);

    // flash = hard on/off 3 times per second; bounce = 0–1 sine for arrow bob
    const flash = Math.floor(gameTime * 3) % 2 === 0;
    const bounce = Math.abs(Math.sin(gameTime * Math.PI * 3)) * 6;

    // Watermelon (left side)
    const wmX = tableX + WM_TABLE_OX;
    const wmY = tableY - WM_H;
    const wmCX = wmX + WM_W / 2;
    const allIn = coopChickens.length >= TOTAL_CHICKENS;
    if (watermelonAvail) {
        const isObjective = allIn && holding === null;
        if (isObjective) {
            if (flash) {
                ctx.fillStyle = 'rgba(80,255,80,0.55)';
                ctx.fillRect(wmX - 7, wmY - 7, WM_W + 14, WM_H + 14);
            }
            // bouncing arrow above
            ctx.fillStyle = '#00ff80';
            ctx.font = 'bold 14px monospace';
            ctx.fillText('▼', wmCX - 7, wmY - 20 + bounce);
        } else {
            ctx.globalAlpha = 0.38;
        }
        drawSprite(WATERMELON_SPRITE, wmX, wmY, PX);
        ctx.globalAlpha = 1.0;
    }
    drawItemLabel('WATERMELON', wmCX, wmY - 16);

    // Dog food bag (right side)
    if (dogBagOnTable) {
        const bagX = tableX + BAG_TABLE_OX;
        const bagY = tableY - BAG_H;
        const bagCX = bagX + BAG_W / 2;
        const isObjective = chickensFed && holding === null;
        if (isObjective) {
            if (flash) {
                ctx.fillStyle = 'rgba(255,180,50,0.55)';
                ctx.fillRect(bagX - 7, bagY - 7, BAG_W + 14, BAG_H + 14);
            }
            // bouncing arrow above
            ctx.fillStyle = '#ffcc00';
            ctx.font = 'bold 14px monospace';
            ctx.fillText('▼', bagCX - 7, bagY - 20 + bounce);
        }
        drawSprite(DOGBAG_SPRITE, bagX, bagY, PX);
        drawItemLabel('DOG FOOD', bagCX, bagY - 16);
    }
}

// ── Dog eating area ────────────────────────────────────────────
function drawDogArea() {
    const ax = dogAreaX, ay = dogAreaY;
    const aw = DOG_AREA_W, ah = DOG_AREA_H;

    // Worn dirt mat
    ctx.fillStyle = '#6b4820';
    ctx.fillRect(ax, ay, aw, ah);
    ctx.fillStyle = '#7d5528';
    ctx.fillRect(ax + 3, ay + 3, aw - 6, ah - 6);
    // Dirt texture lines
    ctx.fillStyle = '#5a3a14';
    for (let i = 0; i < 5; i++) {
        ctx.fillRect(ax + 6 + i * 20, ay + 5, 12, 2);
        ctx.fillRect(ax + 10 + i * 20, ay + ah - 9, 10, 2);
    }

    // Water bowl (left side)
    const wbX = ax + 8;
    const wbY = ay + Math.floor((ah - DF_H) / 2);
    drawSprite(WATER_BOWL_SPRITE, wbX, wbY, PX);

    // Food bowls — one for poodle (idx 0), one for beagle (idx 1)
    for (let bi = 0; bi < 2; bi++) {
        const bp = getBowlPos(bi);
        if (bowlFilled[bi]) {
            ctx.fillStyle = 'rgba(255,200,80,0.35)';
            ctx.fillRect(bp.x - 5, bp.y - 5, DF_W + 10, DF_H + 10);
        }
        drawSprite(DOGFOOD_SPRITE, bp.x, bp.y, PX);
    }
}

// ── Draw ──────────────────────────────────────────────────────
function draw() {
    drawBackground();
    drawCoopArea();

    // Coop chickens (inside pen, drawn before wall overlay)
    for (const c of coopChickens) {
        drawSprite(CHICK_FRAMES_BY_COLOR[c.color][c.frame], Math.round(c.x), Math.round(c.y), CHAR_PX, c.facing === -1);
        drawNameTag(c.name, Math.round(c.x) + CHICK_W / 2, Math.round(c.y), '#e8f8e8');
    }

    drawTable();
    drawDogArea();

    // Y-sorted draw: player, outside chickens, and dogs are sorted by bottom edge
    // so anything at Glenda's feet appears in front of her
    const entities = [];

    for (const c of chickens) {
        entities.push({
            bottomY: c.y + CHICK_H,
            draw() {
                drawSprite(CHICK_FRAMES_BY_COLOR[c.color][c.frame], Math.round(c.x), Math.round(c.y), CHAR_PX, c.facing === -1);
                drawNameTag(c.name, Math.round(c.x) + CHICK_W / 2, Math.round(c.y), '#e8f8e8');
            }
        });
    }

    for (const d of dogs) {
        const dSprite = d.type === 'poodle' ? POODLE_FRAMES : BEAGLE_FRAMES;
        entities.push({
            bottomY: d.y + DOG_H,
            draw() {
                drawSprite(dSprite[d.frame], Math.round(d.x), Math.round(d.y), CHAR_PX, d.facing === -1);
                drawNameTag(d.name, Math.round(d.x) + DOG_W / 2, Math.round(d.y), '#ffdd88');
                if (d.eating) {
                    ctx.fillStyle = '#ffe066';
                    ctx.font = 'bold 11px monospace';
                    const secs = Math.ceil(d.eatTimer);
                    ctx.fillText(`nom nom (${secs}s)`, Math.round(d.x) + DOG_W / 2 - 34, Math.round(d.y) - 14);
                }
            }
        });
    }

    entities.push({
        bottomY: player.y + CHAR_H,
        draw() {
            // Carried chickens floating above player
            if (carrying.length > 0) {
                const sc = 3;
                const cW = 8 * sc;
                const gap = 3;
                const totalW = carrying.length * cW + (carrying.length - 1) * gap;
                const startX = player.x + CHAR_W / 2 - totalW / 2;
                for (let i = 0; i < carrying.length; i++) {
                    const frames = CHICK_FRAMES_BY_COLOR[carrying[i].color];
                    drawSprite(frames[0], Math.round(startX + i * (cW + gap)), Math.round(player.y - 28), sc);
                }
            }
            // Held item above player's head
            if (holding === 'watermelon') {
                drawSprite(WATERMELON_SPRITE, Math.round(player.x + CHAR_W / 2 - WM_W / 2), Math.round(player.y - WM_H - 4), PX);
            } else if (holding === 'dogbag') {
                drawSprite(DOGBAG_SPRITE, Math.round(player.x + CHAR_W / 2 - BAG_W / 2), Math.round(player.y - BAG_H - 4), PX);
            }
            drawSprite(CHAR_FRAMES[player.frame], Math.round(player.x), Math.round(player.y), CHAR_PX, player.facing === -1);
            drawNameTag('Glenda', Math.round(player.x) + CHAR_W / 2, Math.round(player.y), '#ffe066');
        }
    });

    entities.sort((a, b) => a.bottomY - b.bottomY);
    for (const e of entities) e.draw();

    // Spark particles (always on top)
    for (const p of particles) {
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        const s = Math.round(p.size);
        ctx.fillRect(Math.round(p.x) - s, Math.round(p.y) - s, s * 2, s * 2);
    }
    ctx.globalAlpha = 1.0;
}

function loop(ts) {
    const dt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;
    gameTime += dt;
    update(dt);
    draw();
    raf = requestAnimationFrame(loop);
}

// ── Game lifecycle ────────────────────────────────────────────
function startGame() {
    carrying = [];
    holding = null;
    watermelonAvail = true;
    dogBagOnTable = true;
    bowlFilled = [false, false];
    chickensFed = false;
    gameOver = false;
    chickenNameIdx = 0;
    gameTime = 0;
    particles = [];
    keys = {};
    chickens = [];
    coopChickens = [];

    const OUTER_FENCE = 32;
    penX = OUTER_FENCE + 18;
    penY = HEADER_H + OUTER_FENCE + 18;

    tableX = canvas.width * 0.72 - TABLE_W / 2;
    tableY = canvas.height * 0.60;

    // Dog eating area — lower-left corner of yard
    dogAreaX = 50;
    dogAreaY = canvas.height * 0.76;

    player.x = canvas.width * 0.55 - CHAR_W / 2;
    player.y = canvas.height * 0.5 - CHAR_H / 2;
    player.frame = 0;
    player.frameTick = 0;
    player.facing = 1;

    chickens = Array.from({ length: TOTAL_CHICKENS }, () => makeChicken(false));
    dogs = [makeDog('poodle'), makeDog('beagle')];

    updateHUD();
    showScreen(gameScreen);
    if (raf) cancelAnimationFrame(raf);
    lastTs = performance.now();
    raf = requestAnimationFrame(loop);
}

function winGame() {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    showScreen(winScreen);
}
