import * as THREE from 'three';

export function createTable(options = {}) {
  const {
    topSize = { x: 3.0, y: 0.12, z: 1.6 },
    legHeight = 1.0,
    legThickness = 0.12,
    colorTop = 0x8b6b4c,
    colorLeg = 0x5d4632,
    rounded = false
  } = options;

  const table = new THREE.Group();
  table.name = 'Table';

  //material
  const matTop = new THREE.MeshStandardMaterial({ color: colorTop, roughness: 0.6, metalness: 0.05 });
  const matLeg = new THREE.MeshStandardMaterial({ color: colorLeg, roughness: 0.7, metalness: 0.05 });

  // top
  const topGeo = new THREE.BoxGeometry(topSize.x, topSize.y, topSize.z);
  const top = new THREE.Mesh(topGeo, matTop);
  top.position.y = legHeight + topSize.y / 2;
  top.castShadow = true; top.receiveShadow = true;
  table.add(top);

  // leg positions (x,z corners)
  const dx = (topSize.x / 2) - legThickness / 1.5;
  const dz = (topSize.z / 2) - legThickness / 1.5;

  function makeLeg(x, z) {
    const legGeo = new THREE.BoxGeometry(legThickness, legHeight, legThickness);
    const leg = new THREE.Mesh(legGeo, matLeg);
    leg.position.set(x, legHeight / 2, z);
    leg.castShadow = true; leg.receiveShadow = true;
    return leg;
  }

  table.add(makeLeg(-dx, -dz));
  table.add(makeLeg( dx, -dz));
  table.add(makeLeg(-dx,  dz));
  table.add(makeLeg( dx,  dz));

  return table;
}
