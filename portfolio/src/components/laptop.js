import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export function createLaptop(opts = {}) {
  const {
    // Size (MacBook-ish)
    width = 0.38,
    depth = 0.25,
    baseThickness = 0.016,
    lidHeight = 0.21,
    lidThicknessZ = 0.010,
    cornerRadius = 0.012,

    // Materials
    aluminum = 0xb8bcc2,
    keyColor = 0x222428,
    screenColor = 0x111315,
    screenEmissive = 0x6ec1ff,
    screenEmissiveIntensity = 0.9,

    // Lid pose (now: positive opens toward keyboard)
    openAngleDeg = 105,     // try 80–125
  } = opts;

  const laptop = new THREE.Group();
  laptop.name = 'Laptop';

  // ---------- Materials ----------
  const matAlu = new THREE.MeshStandardMaterial({
    color: aluminum, metalness: 0.8, roughness: 0.25
  });
  const matKey = new THREE.MeshStandardMaterial({
    color: keyColor, metalness: 0.2, roughness: 0.7
  });
  const matTrack = new THREE.MeshStandardMaterial({
    color: 0x9aa1aa, metalness: 0.4, roughness: 0.4
  });
  const matScreen = new THREE.MeshStandardMaterial({
    color: screenColor,
    emissive: screenEmissive,
    emissiveIntensity: screenEmissiveIntensity,
    metalness: 0.05,
    roughness: 0.6,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: 1,
    side: THREE.FrontSide,
  });

  // base
  const base = new THREE.Mesh(
    new RoundedBoxGeometry(width, baseThickness, depth, 3, cornerRadius),
    matAlu
  );
  base.position.y = baseThickness / 2;
  base.castShadow = base.receiveShadow = true;
  laptop.add(base);

  // keyboard keys
  const keyGeo = new THREE.BoxGeometry(0.016, 0.003, 0.016);
  const rows = [15, 15, 14, 13];
  const colSpacing = 0.019;
  const rowSpacing = 0.019;
  const maxCols = Math.max(...rows);
  const totalKeys = rows.reduce((a, b) => a + b, 0);
  const keys = new THREE.InstancedMesh(keyGeo, matKey, totalKeys);
  keys.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  keys.castShadow = true;

  {
    let i = 0;
    const m = new THREE.Matrix4();
    const startZ = 0.026;
    for (let r = 0; r < rows.length; r++) {
      const cols = rows[r];
      const rowOffsetX = -((maxCols - 1) * colSpacing) / 2 - ((cols - maxCols) * colSpacing) / 2;
      for (let c = 0; c < cols; c++) {
        const x = rowOffsetX + c * colSpacing;
        const y = baseThickness + 0.0018;
        const z = startZ + r * rowSpacing;
        m.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1));
        keys.setMatrixAt(i++, m);
      }
    }
  }
  laptop.add(keys);

  // trackpad
  const trackpad = new THREE.Mesh(
    new THREE.BoxGeometry(0.105, 0.002, 0.072),
    matTrack
  );
  trackpad.position.set(0, baseThickness + 0.001, -0.07); // toward keyboard side (−Z)
  trackpad.castShadow = trackpad.receiveShadow = true;
  laptop.add(trackpad);

  // hinge and lid
  const hinge = new THREE.Group();
  hinge.position.set(0, baseThickness, depth / 2 - 0.0005);
  laptop.add(hinge);

  const lidGroup = new THREE.Group();
  lidGroup.rotation.y = Math.PI;
  hinge.add(lidGroup);

  const lid = new THREE.Mesh(
    new RoundedBoxGeometry(width, lidHeight, lidThicknessZ, 3, cornerRadius * 0.6),
    matAlu
  );
  lid.position.set(0, lidHeight / 2, 0);
  lid.castShadow = lid.receiveShadow = true;
  lidGroup.add(lid);

  const bezel = 0.014;
  const screenW = width - bezel * 2;
  const screenH = lidHeight - bezel * 2;

  const screen = new THREE.Mesh(new THREE.PlaneGeometry(screenW, screenH), matScreen);
  screen.position.set(0, lidHeight / 2, (lidThicknessZ / 2) + 0.0012);
  screen.castShadow = false;
  screen.receiveShadow = false;
  lidGroup.add(screen);

  // lids angle
  function setOpenAngle(rad) {
    hinge.rotation.x = rad;
  }
  setOpenAngle(THREE.MathUtils.degToRad(openAngleDeg));

  return laptop;
}
