import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createTable } from './components/table.js';
import { createLamp } from './components/lamp.js';
import { createLaptop } from './components/laptop.js';
import { createBasketball } from './components/basketball.js';
import { createWhiteboard } from './components/whiteBoard.js';
import { createChair } from './components/officeChair.js';

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

//make it so that you can control the camera
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 10.0;
controls.maxDistance = 15.0;
controls.minPolarAngle = 0.15;
controls.maxPolarAngle = Math.PI * 0.49;
controls.enablePan = true;

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

// Run on every control change + each frame (belt-and-suspenders)
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

// --- Back wall (behind desk) ---
const backWall = new THREE.Mesh(
  new THREE.BoxGeometry(10, 6.6, wallThickness),
  wallMaterial
);
backWall.position.set(0, 0, -5 - wallThickness / 2); // push slightly back
scene.add(backWall);

// --- Right wall ---
const rightWall = new THREE.Mesh(
  new THREE.BoxGeometry(10, 6.6, wallThickness),
  wallMaterial
);
// rotate so its thickness runs along X instead of Z
rightWall.rotation.y = -Math.PI / 2;
rightWall.position.set(5 + wallThickness / 2, 0, 0);
scene.add(rightWall);

//floor
const floor = new THREE.Mesh(
  new THREE.BoxGeometry(10, wallThickness, 10), // gives it thickness
  new THREE.MeshStandardMaterial({ color: 0xDB9E72 })
);
floor.position.y = -3 - wallThickness / 2; // move it down by half thickness
floor.receiveShadow = true;
scene.add(floor);

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
ball.position.set(3.0, -2.68, -0.8);
ball.scale.set(1.6, 1.6, 1.6)
scene.add(ball);

const chair = createChair({
  // tweak sizes/colors if you like:
  // spinSpeed: 0.25,
});
chair.position.set(2.4, -3, 2.2);  // on the floor, in front of table
chair.scale.set(2, 2, 2)
scene.add(chair);

//create whiteboard
const board = createWhiteboard({
  camera,
  domElement: renderer.domElement,
  // Optional: override default projects
  projects: [
    { title: 'iOS Fitness App', desc: 'Real-time form feedback with MediaPipe + Swift.', link: 'https://github.com/nkwno' },
    { title: 'FastAPI Backend', desc: 'Video processing pipeline on GCP.', link: 'https://github.com/nkwno' },
    { title: 'Health Trends', desc: 'CVD search trends with county-level models.', link: 'https://github.com/nkwno' },
    { title: 'Robot Seeker', desc: 'Arduino bot finds nearest object.', link: 'https://github.com/nkwno' },
  ]
});
board.position.set(2.0, 1.1, -5.0);
scene.add(board);

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
