import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createTable } from './components/table.js';
import { createLamp } from './components/lamp.js';
import { createLaptop } from './components/laptop.js';
import { createBasketball } from './components/basketball.js';
import { createWhiteboard } from './components/whiteBoard.js';

//scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1022);

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

//lights
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const key = new THREE.DirectionalLight(0xffffff, 1);
key.position.set(2, 3, 2);
scene.add(key);

//room wall material
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xDBD372 });

//back wall
const backWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), wallMaterial);
backWall.position.z = -5;
backWall.position.y = 0;
scene.add(backWall);

//right wall
const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), wallMaterial);
rightWall.rotation.y = -Math.PI / 2;
rightWall.position.set(5, 0, 0);
scene.add(rightWall);

//floor
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshStandardMaterial({ color: 0x7BBAB3 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -3;
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
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

//resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
