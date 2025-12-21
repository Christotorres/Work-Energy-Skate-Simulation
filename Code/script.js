// ======================================
// ASSETS
// ======================================
const ASSET_BG = "assets/rail.png";
const ASSET_SKATER = "assets/skater.png";

// ======================================
// PATH POINTS (RAIL SLOPE FIXED)
// ======================================
const APPROACH_START = { x: 1,   y: 200 };
const APPROACH_END   = { x: 90,  y: 200 };

// Jump (already good)
const JUMP_CTRL  = { x: 260, y: 95 };
const LAND_POINT = { x: 330, y: 260 }; // rail start

// 🔧 RAIL FIX: less drop, more distance
const SLIDE_END  = { x: 565, y: 240 }; // was (470, 410)

// Exit stays aligned with rail
const EXIT_POINT = { x: 680, y: 305 };

// Wrong-answer fall
const FALL_POINT = { x: 260, y: 720 };

// ======================================
// GLOBALS
// ======================================
let skater;
let follower;
let activeTween = null;
let sceneRef = null;
let simulationReady = false;

// ======================================
// PHASER CONFIG
// ======================================
const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: 960,
  height: 540,
  backgroundColor: "#0b1220",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: { preload, create }
};

new Phaser.Game(config);

// ======================================
// PRELOAD
// ======================================
function preload() {
  this.load.image("bg", ASSET_BG);
  this.load.image("skater", ASSET_SKATER);
}

// ======================================
// CREATE
// ======================================
function create() {
  sceneRef = this;

  const bg = this.add.image(0, 0, "bg").setOrigin(0, 0);
  const scale = Math.max(
    this.scale.width / bg.width,
    this.scale.height / bg.height
  );
  bg.setScale(scale);
  bg.x = (this.scale.width - bg.displayWidth) / 2;
  bg.y = (this.scale.height - bg.displayHeight) / 2;

  skater = this.add.image(APPROACH_START.x, APPROACH_START.y, "skater");
  skater.setScale(0.45);
  skater.setDepth(10);

  simulationReady = true;
}

// ======================================
// CORRECT ANSWER → RUN SIMULATION
// ======================================
window.startSimulation = function () {
  if (!simulationReady || !sceneRef || !skater) return;

  if (activeTween) activeTween.stop();

  skater.setPosition(APPROACH_START.x, APPROACH_START.y);
  skater.setRotation(0);

  const path = new Phaser.Curves.Path(
    APPROACH_START.x,
    APPROACH_START.y
  );

  // Roll in
  path.lineTo(APPROACH_END.x, APPROACH_END.y);

  // Big jump
  path.quadraticBezierTo(
    JUMP_CTRL.x,
    JUMP_CTRL.y,
    LAND_POINT.x,
    LAND_POINT.y
  );

  // 🔧 Shallow rail slide (fixed)
  path.lineTo(SLIDE_END.x, SLIDE_END.y);

  // Exit along rail
  path.lineTo(EXIT_POINT.x, EXIT_POINT.y);

  follower = { t: 0 };

  activeTween = sceneRef.tweens.add({
    targets: follower,
    t: 1,
    duration: 3200,
    ease: "Sine.easeInOut",
    onUpdate: () => {
      const p = path.getPoint(follower.t);
      skater.setPosition(p.x, p.y);
      skater.setRotation(0);
    },
    onComplete: () => {
      activeTween = null;
    }
  });
};

// ======================================
// WRONG ANSWER → FAIL ANIMATION
// ======================================
window.failSimulation = function () {
  if (!simulationReady || !sceneRef || !skater) return;

  if (activeTween) activeTween.stop();

  sceneRef.tweens.add({
    targets: skater,
    x: skater.x + 40,
    duration: 250,
    ease: "Sine.easeOut",
    onComplete: () => {
      sceneRef.tweens.add({
        targets: skater,
        x: FALL_POINT.x,
        y: FALL_POINT.y,
        rotation: -Math.PI * 2,
        duration: 900,
        ease: "Cubic.easeIn"
      });
    }
  });
};

// ======================================
// RESET (TRY AGAIN)
// ======================================
window.resetSimulation = function () {
  if (!skater) return;

  if (activeTween) activeTween.stop();

  skater.setPosition(APPROACH_START.x, APPROACH_START.y);
  skater.setRotation(0);
};
