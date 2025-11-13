import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export function createRug(opts = {}) {
  const {
    size = { w: 1.6, d: 1.6 },
    thickness = 0.01,
    texPath = 'texture/Carpet002_2K-JPG/',
    tile = { x: 1.5, y: 1.5 },
    rotation = 0,
    elevation = 0.003,
  } = opts;

  const group = new THREE.Group();
  group.name = 'Rug';

  const loader = new THREE.TextureLoader();

  const setRepeat = (t) => {
    if (!t) return;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(tile.x, tile.y);
    t.center.set(0.5, 0.5);
    t.rotation = rotation;
  };

  const loadTex = (file, { sRGB = false } = {}) => {
    const tex = loader.load(
      texPath + file,
      () => console.log(`[rug] loaded: ${file}`),
      undefined,
      (err) => console.warn(`[rug] failed: ${file}`, err)
    );
    if (sRGB) tex.colorSpace = THREE.SRGBColorSpace;
    setRepeat(tex);
    return tex;
  };

  const color  = loadTex('Carpet002_2K-JPG_Color.jpg', { sRGB: true });
  const normal = loadTex('Carpet002_2K-JPG_NormalGL.jpg');
  const rough  = loadTex('Carpet002_2K-JPG_Roughness.jpg');

  let ao = null;
  try {
    ao = loadTex('Carpet002_2K-JPG_AmbientOcclusion.jpg');
  } catch (_) {}

  const geo = new RoundedBoxGeometry(
    size.w, thickness, size.d,
    1, Math.min(size.w, size.d) * 0.02
  );
  if (ao) {
    geo.setAttribute('uv2', new THREE.BufferAttribute(geo.attributes.uv.array, 2));
  }

  const mat = new THREE.MeshStandardMaterial({
    map: color,
    normalMap: normal,
    roughnessMap: rough,
    aoMap: ao || null,
    aoMapIntensity: ao ? 0.25 : 0.0,
    roughness: 0.95,
    metalness: 0.0,
    normalScale: new THREE.Vector2(0.6, 0.6),
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = elevation + thickness / 2;
  mesh.castShadow = false;
  mesh.receiveShadow = true;

  const aniso = 8;
  [mat.map, mat.normalMap, mat.roughnessMap, mat.aoMap].forEach((t) => {
    if (t) t.anisotropy = aniso;
  });

  group.add(mesh);
  return group;
}
