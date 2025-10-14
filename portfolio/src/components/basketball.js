// src/components/Basketball.js
import * as THREE from 'three';

export function createBasketball(opts = {}) {
  const {
    radius = 0.16,
    widthSegments = 48,
    heightSegments = 48,

    leatherColor = 0xD0672B,
    seamColor = '#111111',
    roughness = 0.9,
    metalness = 0.05,
    bumpScale = 0.0025,
    texSize = 1024,

    uvOffsetX = 0.08,
    useMipmaps = false,
  } = opts;

  // canvas
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = texSize;
  const ctx = canvas.getContext('2d');

  // base fill
  ctx.fillStyle = `#${new THREE.Color(leatherColor).getHexString()}`;
  ctx.fillRect(0, 0, texSize, texSize);

  // Subtle pebbled noise
  const img = ctx.getImageData(0, 0, texSize, texSize);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 6; // slight jitter
    img.data[i]     = clamp255(img.data[i]     + n);
    img.data[i + 1] = clamp255(img.data[i + 1] + n);
    img.data[i + 2] = clamp255(img.data[i + 2] + n);
  }
  ctx.putImageData(img, 0, 0);

  // sems
  const strokeW = Math.max(6, texSize * 0.018);
  ctx.strokeStyle = seamColor;
  ctx.lineWidth = strokeW;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const v = (x) => { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, texSize); ctx.stroke(); };
  const h = (y) => { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(texSize, y); ctx.stroke(); };

  v(Math.floor(texSize * 0.5) + 0.5);
  h(Math.floor(texSize * 0.5) + 0.5);

  ctx.beginPath();
  ctx.moveTo(0, texSize * 0.25 + 0.5);
  ctx.quadraticCurveTo(texSize * 0.5, texSize * 0.28, texSize, texSize * 0.25 + 0.5);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, texSize * 0.75 + 0.5);
  ctx.quadraticCurveTo(texSize * 0.5, texSize * 0.72, texSize, texSize * 0.75 + 0.5);
  ctx.stroke();

  v(0.5);
  v(texSize - 0.5);

  const colorMap = new THREE.CanvasTexture(canvas);
  colorMap.wrapS = colorMap.wrapT = THREE.RepeatWrapping;
  colorMap.anisotropy = 8;
  colorMap.offset.x = uvOffsetX;

  if (useMipmaps) {
    colorMap.minFilter = THREE.LinearMipmapLinearFilter;
    colorMap.generateMipmaps = true;
  } else {
    colorMap.minFilter = THREE.LinearFilter;
    colorMap.generateMipmaps = false;
  }

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = bumpCanvas.height = texSize;
  const bctx = bumpCanvas.getContext('2d');
  bctx.drawImage(canvas, 0, 0);
  const bImg = bctx.getImageData(0, 0, texSize, texSize);
  for (let i = 0; i < bImg.data.length; i += 4) {
    const g = 0.3 * bImg.data[i] + 0.59 * bImg.data[i + 1] + 0.11 * bImg.data[i + 2];
    const vGray = clamp255((g - 120) * 2 + 128); // boost contrast
    bImg.data[i] = bImg.data[i + 1] = bImg.data[i + 2] = vGray;
  }
  bctx.putImageData(bImg, 0, 0);

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.anisotropy = 8;
  bumpMap.offset.x = uvOffsetX;
  if (useMipmaps) {
    bumpMap.minFilter = THREE.LinearMipmapLinearFilter;
    bumpMap.generateMipmaps = true;
  } else {
    bumpMap.minFilter = THREE.LinearFilter;
    bumpMap.generateMipmaps = false;
  }

  //mesh
  const geo = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
  const mat = new THREE.MeshStandardMaterial({
    map: colorMap,
    bumpMap,
    bumpScale,
    roughness,
    metalness,
  });

  const ball = new THREE.Mesh(geo, mat);
  ball.castShadow = true;
  ball.rotation.y = Math.PI * 0.2;

  return ball;
}

// helper
function clamp255(v) { return Math.max(0, Math.min(255, v | 0)); }
