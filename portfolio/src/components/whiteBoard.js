// src/components/Whiteboard.js
import * as THREE from 'three';

/**
 * Big whiteboard with clickable project cards (title + 3 bullets).
 *
 * Options:
 * - width, height: board size in world units
 * - columns: number of card columns
 * - gap: space between cards
 * - cardW, cardH: override auto-computed card size
 * - camera, domElement: enable built-in raycast + click
 * - projects: [{ title, bullets: [b1,b2,b3], link }]
 */
export function createWhiteboard(opts = {}) {
  const {
    width = 5.6,
    height = 3.4,
    depth = 0.04,
    frameThickness = 0.06,
    columns = 3,
    gap = 0.16,
    cardW = null, // auto if null
    cardH = null, // auto if null
    camera = null,
    domElement = null,
    projects = defaultProjects(),
  } = opts;

  const group = new THREE.Group();
  group.name = 'Whiteboard';

  // ---- Board ----
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({ color: 0xf9ecec, roughness: 0.85, metalness: 0 })
  );
  panel.receiveShadow = true;
  group.add(panel);

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(width + frameThickness, height + frameThickness, 0.02),
    new THREE.MeshStandardMaterial({ color: 0xf0d9da, roughness: 0.5, metalness: 0.2 })
  );
  frame.position.z = -depth * 0.5 - 0.012;
  group.add(frame);

  // title
  const titleSprite = makeLabelSprite('Projects', {
    fontSize: 90, paddingX: 32, paddingY: 16,
    bg: '#0b1229', stroke: '#2a3769', color: '#e7ecf4'
  });
  titleSprite.position.set(0, height * 0.8, depth * 0.51);
  group.add(titleSprite);

  //layout
  const rows = Math.ceil(projects.length / columns);
  const autoCardW = (width * 0.9 ? 0.9 : 0.9);
  const computedCardW = (width * 0.88 - gap * (columns - 1)) / columns;
  const computedCardH = (height * 0.68 - gap * (rows - 1)) / rows;

  const CW = cardW ?? computedCardW;
  const CH = cardH ?? computedCardH;

  const totalW = columns * CW + (columns - 1) * gap;
  const totalH = rows * CH + (rows - 1) * gap;
  const startX = -totalW / 2 + CW / 2;
  const startY =  totalH / 2 - CH / 2 - 0.06;

  const cards = [];
  projects.forEach((p, i) => {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const x = startX + col * (CW + gap);
    const y = startY - row * (CH + gap);

    const tex = makeProjectCardTextureBullets({
      title: p.title,
      bullets: p.bullets,
      width: 1280,
      height: 800,
    });

    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
    const geo = new THREE.PlaneGeometry(CW, CH);
    const plane = new THREE.Mesh(geo, mat);
    plane.position.set(x, y, depth * 0.51);
    plane.renderOrder = 2;
    plane.userData.link = p.link || 'https://github.com/nkwno';
    group.add(plane);
    cards.push(plane);
  });

  // hover mouse
  if (camera && domElement) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hovered = null;

    function onPointerMove(e) {
      const rect = domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(cards, false);
      const now = hits.length ? hits[0].object : null;
      if (hovered !== now) {
        hovered = now;
        domElement.style.cursor = hovered ? 'pointer' : 'default';
      }
    }

    function onClick() {
      if (!hovered) return;
      const url = hovered.userData.link;
      if (url) window.open(url, '_blank', 'noopener');
    }

    domElement.addEventListener('mousemove', onPointerMove);
    domElement.addEventListener('click', onClick);

    group.userData.disposeInteractions = () => {
      domElement.removeEventListener('mousemove', onPointerMove);
      domElement.removeEventListener('click', onClick);
      domElement.style.cursor = 'default';
    };
  }

  return group;
}

/* helper functions */

function makeLabelSprite(text, {
  fontSize = 64,
  paddingX = 16,
  paddingY = 8,
  color = '#ffffff',
  bg = '#000000aa',
  stroke = '#222',
} = {}) {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');

  ctx.font = `700 ${fontSize}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto`;
  const w = Math.ceil(ctx.measureText(text).width) + paddingX * 2;
  const h = fontSize + paddingY * 2;
  c.width = w; c.height = h;

  roundedRect(ctx, 1.5, 1.5, w - 3, h - 3, 14, bg, stroke);
  ctx.font = `700 ${fontSize}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, paddingX, h / 2 + 1);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;

  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const spr = new THREE.Sprite(mat);
  const scale = 0.007;
  spr.scale.set(w * scale, h * scale, 1);
  return spr;
}

function roundedRect(ctx, x, y, w, h, r, fill, stroke) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 3; ctx.stroke(); }
}

// === Card with title + 3 bullets (auto-fits fonts to avoid overflow) ===
function makeProjectCardTextureBullets({ title, bullets = [], width = 1024, height = 640 }) {
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');

  // Layout constants
  const pad = 36;
  const titlePadX = pad + 6;
  const titlePadY = pad - 2;

  // Start large; shrink if needed
  let titleSize = Math.floor(height * 0.16);
  let bulletSize = Math.floor(height * 0.12);
  const maxLinesPerBullet = 2;  // keep each bullet compact
  const minTitle = Math.max(28, Math.floor(height * 0.11));
  const minBullet = Math.max(22, Math.floor(height * 0.085));

  function render(measureOnly = false) {
    // bg + border
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0d1330';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#2a3769';
    ctx.lineWidth = Math.max(4, width * 0.004);
    ctx.strokeRect(2, 2, width - 4, height - 4);

    // title
    ctx.fillStyle = '#e7ecf4';
    ctx.textBaseline = 'top';
    ctx.font = `700 ${titleSize}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto`;
    ctx.fillText(title, titlePadX, titlePadY);
    const titleBlockBottom = titlePadY + titleSize + pad * 0.35;

    // bullets
    const bulletPadX = pad + 12;
    let y = Math.floor(Math.max(titleBlockBottom, height * 0.34));
    const bulletLH = Math.floor(bulletSize * 1.25);
    const bulletWidth = width - bulletPadX * 2;

    ctx.fillStyle = '#cfe6ff';
    ctx.font = `500 ${bulletSize}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto`;

    const items = bullets?.length
      ? bullets.slice(0, 3)
      : [
          'Placeholder point one describing the project clearly.',
          'Placeholder point two with a key feature.',
          'Placeholder point three with impact/tech.'
        ];

    for (const raw of items) {
      const text = raw.startsWith('•') ? raw : `• ${raw}`;
      const before = y;
      y = wrapTextReturnY(ctx, text, bulletPadX, y, bulletWidth, bulletLH, maxLinesPerBullet);
      y += Math.floor(bulletLH * 0.15);
      if (measureOnly && y > height - pad) return { overflow: true, usedY: y };
    }
    return { overflow: false, usedY: y };
  }

  // shrink loop
  let result = render(true);
  let guard = 24;
  while (result.overflow && guard-- > 0) {
    if (titleSize > minTitle) titleSize -= 2;
    if (bulletSize > minBullet) bulletSize -= 2;
    result = render(true);
  }

  // final paint
  render(false);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  tex.minFilter = THREE.LinearFilter;   // crisp text
  tex.generateMipmaps = false;
  return tex;
}

// Draw wrapped text and return the next baseline Y after drawing.
function wrapTextReturnY(ctx, text, x, y, maxWidth, lineHeight, maxLines = 2) {
  const words = text.split(/\s+/);
  let line = '';
  let linesDrawn = 0;

  for (let n = 0; n < words.length; n++) {
    const test = line ? line + ' ' + words[n] : words[n];
    const w = ctx.measureText(test).width;

    if (w > maxWidth && line) {
      ctx.fillText(line, x, y);
      y += lineHeight;
      linesDrawn++;
      if (linesDrawn >= maxLines) {
        const remaining = words.slice(n).join(' ');
        const ellipsis = '…';
        let clipped = '';
        for (let i = 0; i < remaining.length; i++) {
          const next = clipped + remaining[i];
          if (ctx.measureText(next + ellipsis).width > maxWidth) break;
          clipped = next;
        }
        ctx.fillText(clipped + ellipsis, x, y);
        y += lineHeight;
        return y;
      }
      line = words[n];
    } else {
      line = test;
    }
  }

  if (line) {
    ctx.fillText(line, x, y);
    y += lineHeight;
  }
  return y;
}

function defaultProjects() {
  const link = 'https://github.com/nkwno';
  const bullets = [
    'High-level summary of the project.',
    'Key tech or approach used.',
    'Impact or outcome in plain words.'
  ];
  return [
    { title: 'Hit It – iOS Fitness App', bullets, link },
    { title: 'FastAPI Video Backend', bullets, link },
    { title: 'Cardio Trends Dashboard', bullets, link },
    { title: 'Robot Car – Object Seeking', bullets, link },
    { title: 'Q-Learning Simulator', bullets, link },
    { title: 'Three.js Globe – Data Pins', bullets, link },
  ];
}
