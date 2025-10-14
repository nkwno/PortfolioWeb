import * as THREE from 'three';

export function createLamp(opts = {}) {
  const {
    poleHeight = 3.0,
    baseRadius = 0.35,
    colorMetal = 0x666a73,
    lightColor = 0xfff2d0,
    intensity = 2.0,
    floorY = -4,
  } = opts;

  const stand = new THREE.Group();
  stand.name = 'Lamp';

  // metal and pole
  const matMetal = new THREE.MeshStandardMaterial({
    color: colorMetal,
    metalness: 0.8,
    roughness: 0.35,
  });

  // base
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(baseRadius, baseRadius, 0.02, 24),
    matMetal
  );
  base.position.y = floorY + 0.01;
  base.castShadow = base.receiveShadow = true;
  stand.add(base);

  // Pole
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, poleHeight, 16),
    matMetal
  );
  pole.position.y = floorY + poleHeight / 2 + 0.02;
  pole.castShadow = true;
  stand.add(pole);

  // Hinge at top
  const hinge = new THREE.Group();
  hinge.position.set(0, floorY + poleHeight + 0.03, 0);
  stand.add(hinge);

  // light bulb
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 16, 8),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffcc,
      emissiveIntensity: 1.5,
    })
  );
  bulb.position.set(0, -0.02, 0);
  hinge.add(bulb);

  // spotlight
  const spot = new THREE.SpotLight(lightColor, intensity, 6, Math.PI / 6, 0.4, 1.0);
  spot.position.set(0, -0.02, 0);
  spot.castShadow = true;
  hinge.add(spot);

  const target = new THREE.Object3D();
  target.position.set(0.15, floorY + 0.01, -0.1);
  stand.add(target);
  spot.target = target;

  return stand;
}
