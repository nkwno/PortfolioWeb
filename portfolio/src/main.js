import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createTable } from './components/table.js';
import { createLamp } from './components/lamp.js';
import { createLaptop } from './components/laptop.js';
import { createBasketball } from './components/basketball.js';
import { createChair } from './components/officeChair.js';
import { createLinkedInFrame } from './components/linkedinFrame.js';
import { createGitHubFrame } from './components/githubFrame.js';
import { createRug } from './components/rug.js';
import { createBasketballHoop } from './components/hoop.js';

//scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0C1B47);

//camera
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(-15, 10, 0);
scene.add(camera);

//renderer
const canvas = document.querySelector('.webgl') || undefined;
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
if (!canvas) document.body.appendChild(renderer.domElement);

// sRGB output (good colors)
if ('outputColorSpace' in renderer) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
} else {
  renderer.outputEncoding = THREE.sRGBEncoding;
}

// nav bar and camera fly
// ---------- NAV BAR + CAMERA FLY-TO (locks controls off except on Home) ----------
function injectNav() {
  // Styles
  const style = document.createElement('style');
  style.textContent = `
    .topnav {
      position: fixed; top: 0; left: 0; right: 0; height: 56px;
      display: flex; align-items: center; gap: 16px;
      padding: 0 20px; z-index: 10;
      background: rgba(13,17,23,0.85);
      backdrop-filter: blur(6px);
      border-bottom: 1px solid rgba(255,255,255,0.08);
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
    }
    .topnav button {
      appearance: none; border: 0; border-radius: 10px; padding: 8px 14px;
      background: #e6edf3; color: #0d1117; font-weight: 600; cursor: pointer;
      transition: transform .06s ease, opacity .2s ease;
    }
    .topnav button:hover { transform: translateY(-1px); }
    .topnav .spacer { flex: 1; }
    .topnav .brand { color: #e6edf3; font-weight: 700; letter-spacing: .3px; opacity: .9; }
  `;
  document.head.appendChild(style);

  // DOM
  const nav = document.createElement('div');
  nav.className = 'topnav';
  nav.innerHTML = `
    <div class="brand">Portfolio</div>
    <div class="spacer"></div>
    <button data-goto="home">Home</button>
    <button data-goto="social">Social</button>
    <button data-goto="projects">Projects</button>
  `;
  document.body.appendChild(nav);

  // Camera anchors
  const ANCHORS = {
    home: {
      target: new THREE.Vector3(0, 0, 0),
      position: new THREE.Vector3(-15, 10, 0),
      duration: 1.5,
    },
    social: {
      target: new THREE.Vector3(5.0, 1.0, 2.0),
      position: new THREE.Vector3(2.8, 1.6, 2.0),
      duration: 1.2,
    },
    projects: {
      target: new THREE.Vector3(5.0, 1.1, -2.0),
      position: new THREE.Vector3(2.0, 1.1, -2.6), // level, face-on
      duration: 1.2,
    },
  };

  // Clamp helper
  function clampVec3(v) {
    v.x = Math.min(ROOM.maxX, Math.max(ROOM.minX, v.x));
    v.y = Math.min(ROOM.maxY, Math.max(ROOM.minY, v.y));
    v.z = Math.min(ROOM.maxZ, Math.max(ROOM.minZ, v.z));
    return v;
  }

  const easeInOutQuad = (t) => (t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2)/2);

  function setUserControl(enabled) {
    controls.enabled = enabled;
    controls.enableRotate = enabled;
    controls.enablePan = enabled;
    controls.enableZoom = enabled;
    renderer.domElement.style.cursor = enabled ? '' : 'default';
  }

  let tweenId = 0;
  function flyTo(key, { position, target, duration = 1.2 }) {
    tweenId++;
    const thisTween = tweenId;

    const startPos = camera.position.clone();
    const startTgt = controls.target.clone();
    const endPos = clampVec3(position.clone());
    const endTgt = clampVec3(target.clone());

    const start = performance.now();
    setUserControl(false);

    function step(now) {
      if (thisTween !== tweenId) return;
      const t = Math.min(1, (now - start) / (duration * 1000));
      const k = easeInOutQuad(t);

      camera.position.lerpVectors(startPos, endPos, k);
      controls.target.lerpVectors(startTgt, endTgt, k);

      clampCameraToRoom();
      camera.lookAt(controls.target);

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        setUserControl(key === 'home');
      }
    }
    requestAnimationFrame(step);
  }

  nav.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-goto]');
    if (!btn) return;
    const key = btn.getAttribute('data-goto');
    const anchor = ANCHORS[key];
    if (anchor) flyTo(key, anchor);
  });

  window.addEventListener('keydown', (e) => {
    if (['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;
    if (e.key.toLowerCase() === 'h') flyTo('home', ANCHORS.home);
    if (e.key === '1') flyTo('social', ANCHORS.social);
    if (e.key === '2') flyTo('projects', ANCHORS.projects);
  });

  setUserControl(true);
}

//make it so that you can control the camera
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 10.0;
controls.maxDistance = 15.0;
controls.minPolarAngle = 0.15;
controls.maxPolarAngle = Math.PI * 0.49;
controls.enablePan = true;
injectNav();

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hovered = null;

function onPointerMove(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(scene.children, true);
  const hit = hits.find(h => h.object.userData.openUrl);
  const newHovered = hit?.object ?? null;

  if (hovered && hovered.userData.hoverBorder) {
    hovered.userData.hoverBorder.visible = false;
  }

  hovered = newHovered;

  if (hovered && hovered.userData.hoverBorder) {
    hovered.userData.hoverBorder.visible = true;
  }

  renderer.domElement.style.cursor = hit ? 'pointer' : '';
}


function onPointerDown() {
  if (hovered?.userData.openUrl) {
    window.open(hovered.userData.openUrl, '_blank', 'noopener,noreferrer');
  }
}

renderer.domElement.addEventListener('pointermove', onPointerMove);
renderer.domElement.addEventListener('pointerdown', onPointerDown);


// room bounds
const ROOM = {
  minX: -16, maxX:  4.5,
  minZ: -3.0, maxZ:  15.0,
  minY: -0.47091984852376617, maxY:  15.0
};

// keep target and camera inside the room
function clampCameraToRoom() {
  // clamp target first
  const t = controls.target;
  t.x = Math.min(ROOM.maxX, Math.max(ROOM.minX, t.x));
  t.y = Math.min(ROOM.maxY, Math.max(ROOM.minY, t.y));
  t.z = Math.min(ROOM.maxZ, Math.max(ROOM.minZ, t.z));

  // preserve camera-target offset while clamping camera into the box too
  const offset = camera.position.clone().sub(t);
  camera.position.copy(t).add(offset);

  // clamp camera position into the box (prevents flying outside with big drags)
  camera.position.x = Math.min(ROOM.maxX, Math.max(ROOM.minX, camera.position.x));
  camera.position.y = Math.min(ROOM.maxY, Math.max(ROOM.minY, camera.position.y));
  camera.position.z = Math.min(ROOM.maxZ, Math.max(ROOM.minZ, camera.position.z));

  camera.updateProjectionMatrix();
}

controls.addEventListener('change', clampCameraToRoom);

controls.enableDamping = true;

//lights
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const key = new THREE.DirectionalLight(0xffffff, 1);
key.position.set(2, 3, 2);
scene.add(key);

//room wall material
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xDBD272 });

// wall thickness (depth into the room)
const wallThickness = 0.3;

// --- Create the walls first ---
const backWall = new THREE.Mesh(
  new THREE.BoxGeometry(10, 6.6, wallThickness),
  new THREE.MeshStandardMaterial({ color: 0xDBD272 }) // temporary material
);
backWall.position.set(0, 0, -5 - wallThickness / 2);
scene.add(backWall);

const rightWall = new THREE.Mesh(
  new THREE.BoxGeometry(10, 6.6, wallThickness),
  new THREE.MeshStandardMaterial({ color: 0xDBD272 })
);
rightWall.rotation.y = -Math.PI / 2;
rightWall.position.set(5 + wallThickness / 2, 0, 0);
scene.add(rightWall);

// --- Now load and apply the plaster textures ---
const wallLoader = new THREE.TextureLoader();

const plasterColor = wallLoader.load('texture/Plaster001_2K-JPG/Plaster001_2K-JPG_Color.jpg');
const plasterNormal = wallLoader.load('texture/Plaster001_2K-JPG/Plaster001_2K-JPG_NormalGL.jpg');
const plasterRough  = wallLoader.load('texture/Plaster001_2K-JPG/Plaster001_2K-JPG_Roughness.jpg');

[plasterColor, plasterNormal, plasterRough].forEach(t => {
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 2.5);
});

plasterColor.colorSpace = THREE.SRGBColorSpace;

const plasterMat = new THREE.MeshStandardMaterial({
  map: plasterColor,
  normalMap: plasterNormal,
  roughnessMap: plasterRough,
  roughness: 0.9,
  metalness: 0.0,
  normalScale: new THREE.Vector2(0.6, 0.6),
});

// apply to walls now that they exist
backWall.material = plasterMat.clone();
rightWall.material = plasterMat.clone();

// sharpen textures
const wallAniso = renderer.capabilities.getMaxAnisotropy?.() ?? 8;
[plasterColor, plasterNormal, plasterRough].forEach(t => t.anisotropy = Math.min(8, wallAniso));

//floor
const texLoader = new THREE.TextureLoader();

const woodColor = texLoader.load('texture/WoodFloor043_2K-JPG/WoodFloor043_2K-JPG_Color.jpg');
const woodNormal = texLoader.load('texture/WoodFloor043_2K-JPG/WoodFloor043_2K-JPG_NormalGL.jpg');
const woodRough  = texLoader.load('texture/WoodFloor043_2K-JPG/WoodFloor043_2K-JPG_Roughness.jpg');

[woodColor, woodNormal, woodRough].forEach(t => {
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  t.center.set(0.5, 0.5);
  t.rotation = Math.PI / 2;
});

woodColor.colorSpace = THREE.SRGBColorSpace;

const floor = new THREE.Mesh(
  new THREE.BoxGeometry(10, wallThickness, 10),
  new THREE.MeshStandardMaterial({ color: 0xDB9E72 })
);
floor.position.y = -3 - wallThickness / 2;
floor.receiveShadow = true;
scene.add(floor);

floor.material = new THREE.MeshStandardMaterial({
  map: woodColor,
  normalMap: woodNormal,
  roughnessMap: woodRough,
  roughness: 0.85,
  metalness: 0.0,
});

// sharpen
const aniso = renderer.capabilities.getMaxAnisotropy?.() ?? 8;
[woodColor, woodNormal, woodRough].forEach(t => t.anisotropy = Math.min(8, aniso));

//desk
const table = createTable({
  topSize: { x: 3.2, y: 0.12, z: 1.6 },
  legHeight: 1.5,
  legThickness: 0.12,
  colorTop: 0x8b6b4c,
  colorLeg: 0x5d4632
});
table.position.set(4.0, -3, 2.5);
table.rotation.y = Math.PI * -0.5;
scene.add(table);

//laptop
const laptop = createLaptop({
  openAngleDeg: 45,
});
laptop.scale.set(2, 2, 2);
laptop.position.set(4.0, -1.4, 3.0)
laptop.rotation.y = Math.PI * 0.25;
scene.add(laptop);

//basketball
const ball = createBasketball({ radius: 0.20 });
ball.position.set(-2.2, -2.68, -2.8);
ball.scale.set(1.6, 1.6, 1.6)
scene.add(ball);

//chair
const chair = createChair({
  // tweak sizes/colors if you like:
  // spinSpeed: 0.25,
});
chair.position.set(2.4, -3, 2.2);  // on the floor, in front of table
chair.scale.set(2, 2, 2)
scene.add(chair);

// rug
const rug = createRug({
  size: { w: 1.8, d: 1.6 },
  thickness: 0.012,
  tile: { x: 1.2, y: 1.2 },
  rotation: 0,
  elevation: 0.002
});
rug.position.set(2.6, -3, 2.3);
scene.add(rug);

//linkedin frame
const linkedin_frame = createLinkedInFrame({
  camera,
  domElement: renderer.domElement,
});

// place it on the right wall
linkedin_frame.scale.set(1.5, 1.5, 1.5)
linkedin_frame.position.set(5, 0.9, 2.6);
linkedin_frame.rotation.y = Math.PI * 1.5;
scene.add(linkedin_frame);

//github frame
const github_frame = createGitHubFrame({
  url: 'https://github.com/nkwno',
  outer: { w: 0.7, h: 0.7, d: 0.04 },
  frameWidth: 0.06,
});

// place it on the right wall
github_frame.scale.set(1.5, 1.5, 1.5)
github_frame.position.set(5, 0.9, 4);
github_frame.rotation.y = Math.PI * 1.5;
scene.add(github_frame);

//hoop
const hoop = createBasketballHoop({
  position: new THREE.Vector3(-3, -3, -4),
  scale: 1.0
});

// Add to scene
hoop.scale.set(1.5, 1.5, 1.5)
hoop.rotation.y = Math.PI
scene.add(hoop);

const loader = new GLTFLoader();
loader.load('models/sofa.glb', (gltf) => {
  const sofa = gltf.scene;
  sofa.scale.set(3, 3, 3);
  sofa.position.set(-2.5, -3, 2);
  sofa.rotation.y = Math.PI * 0.5
  scene.add(sofa);
});

const cameraLoader = new GLTFLoader();
cameraLoader.load('models/camera.glb', (gltf) => {
  const camera = gltf.scene;
  camera.scale.set(4, 4, 4);
  camera.position.set(4.0, -1.33, 2.0);
  camera.rotation.y = Math.PI * 1.6
  scene.add(camera);
});

const shelfLoader = new GLTFLoader();
shelfLoader.load('models/shelf.glb', (gltf) => {
  const shelf = gltf.scene;
  shelf.scale.set(4, 4, 4);
  shelf.position.set(4.0, -3, -3.0);
  shelf.rotation.y = Math.PI * 1.5
  scene.add(shelf);
});


//shadows
renderer.shadowMap.enabled = true;
ball.castShadow = true;
floor && (floor.receiveShadow = true);

const lamp = createLamp();
lamp.position.set(4.0, 1.0, 0);
scene.add(lamp);

//render loop
let last = performance.now();
function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = (now - last) / 1000; // seconds
  last = now;

  if (chair.userData.update) chair.userData.update(dt);
  controls.update();
  clampCameraToRoom()
  renderer.render(scene, camera);
}
animate();

//resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
