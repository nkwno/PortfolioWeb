import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/**
 * createRug({
 *   size: { w: 1.6, d: 1.6 },
 *   thickness: 0.01,
 *   texPath: '../texture/Carpet002_2K-JPG/',
 *   tile: { x: 1.5, y: 1.5 },
 *   rotation: 0,
 *   elevation: 0.003
 * })
 *
 * Returns a THREE.Group containing a realistic rug mesh.
 */
export function createRug(opts = {}) {
  const {
    size = { w: 1.6, d: 1.6 },
    thickness = 0.01,
    texPath = '../texture/Carpet002_2K-JPG/',
    tile = { x: 1.5, y: 1.5 },
    rotation = 0,
    elevation = 0.003,
  } = opts;

  const group = new THREE.Group();
  group.name = 'Rug';

  // Resolve texture URLs relative to THIS FILE (src/components)
  const base = new URL(texPath, import.meta.url);
  const url = (file) => new URL(file, base).href;

  // --- Load all texture maps ---
  const loader = new THREE.TextureLoader();

  // helper to apply tiling and rotation
  const setRepeat = (t) => {
    if (!t) return;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(tile.x, tile.y);
    t.center.set(0.5, 0.5);
    t.rotation = rotation;
  };

  // log + load helper
  const loadTex = (file, { sRGB = false } = {}) => {
    const tex = loader.load(
      url(file),
      () => console.log(`[rug] loaded: ${file}`),
      undefined,
      (err) => console.warn(`[rug] failed: ${file}`, err)
    );
    if (sRGB) tex.colorSpace = THREE.SRGBColorSpace;
    setRepeat(tex);
    return tex;
  };

  const color = loadTex('Carpet002_2K-JPG_Color.jpg', { sRGB: true });
  const normal = loadTex('Carpet002_2K-JPG_NormalGL.jpg');
  const rough = loadTex('Carpet002_2K-JPG_Roughness.jpg');

  // AO is optional
  let ao = null;
  try { ao = loadTex('Carpet002_2K-JPG_AmbientOcclusion.jpg'); } catch (_) {}

  // --- Geometry (thin rounded box, not perfectly flat) ---
  const geo = new RoundedBoxGeometry(
    size.w, thickness, size.d,
    1, Math.min(size.w, size.d) * 0.02
  );
  if (ao) geo.setAttribute('uv2', new THREE.BufferAttribute(geo.attributes.uv.array, 2));

  // --- Material (soft matte fabric) ---
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

  // --- Mesh ---
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = elevation + thickness / 2;
  mesh.castShadow = false;
  mesh.receiveShadow = true;

  // --- Improve sharpness at grazing angles ---
  const aniso = 8;
  [mat.map, mat.normalMap, mat.roughnessMap, mat.aoMap].forEach(t => {
    if (t) t.anisotropy = aniso;
  });

  group.add(mesh);
  return group;
}
