// src/components/pictureFrame.js
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/**
 * createLinkedInFrame({
 *   outer = { w: 0.7, h: 0.7, d: 0.04 },   // overall frame size
 *   frameWidth = 0.06,                      // wood border thickness
 *   frameColor = 0x4a3b2e,                  // dark walnut-ish
 *   matColor = 0xffffff,                    // white matboard
 *   matInset = 0.06,                        // mat margin inside frame
 *   matDepth = 0.01,
 *   printInset = 0.16,                      // how far in from the frame edge the print sits
 *   logoBlue = 0x0a66c2,                    // LinkedIn blue
 *   url = 'https://www.linkedin.com/in/nao-kawano/'
 * })
 *
 * Returns a THREE.Group with userData.url set.
 */
export function createLinkedInFrame(opts = {}) {
  const {
    outer = { w: 0.7, h: 0.7, d: 0.04 },
    frameWidth = 0.06,
    frameColor = 0x4a3b2e,
    matColor = 0xffffff,
    matInset = 0.06,
    matDepth = 0.01,
    printInset = 0.16,
    logoBlue = 0x0a66c2,
    url = 'www.linkedin.com/in/nao-kawano/',
  } = opts;

  const g = new THREE.Group();
  g.name = 'LinkedInFrame';
  g.userData.url = url;

  // --- Backing board (for rigidity)
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(outer.w, outer.h, outer.d),
    new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.9, metalness: 0 })
  );
  back.castShadow = back.receiveShadow = true;
  g.add(back);

  // --- Wood frame: 4 rails (front view)
  const railDepth = outer.d * 0.5;
  const railMat = new THREE.MeshStandardMaterial({ color: frameColor, roughness: 0.6, metalness: 0.05 });

  const longW = outer.w;
  const longH = frameWidth;
  const shortW = frameWidth;
  const shortH = outer.h - frameWidth * 2;

  const mkRail = (w, h) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, railDepth), railMat);
    m.castShadow = m.receiveShadow = true;
    return m;
  };

  // Top & bottom rails
  const top = mkRail(longW, longH); top.position.set(0,  (outer.h/2 - frameWidth/2), railDepth/2);
  const bot = mkRail(longW, longH); bot.position.set(0, -(outer.h/2 - frameWidth/2), railDepth/2);

  // Left & right rails
  const left  = mkRail(shortW, shortH); left.position.set(-(outer.w/2 - frameWidth/2), 0, railDepth/2);
  const right = mkRail(shortW, shortH); right.position.set( (outer.w/2 - frameWidth/2), 0, railDepth/2);

  g.add(top, bot, left, right);

  // --- Mat board (slightly inset)
  const matW = outer.w - matInset * 2;
  const matH = outer.h - matInset * 2;
  const mat = new THREE.Mesh(
    new THREE.BoxGeometry(matW, matH, matDepth),
    new THREE.MeshStandardMaterial({ color: matColor, roughness: 0.95, metalness: 0 })
  );
  mat.position.z = railDepth + matDepth/2;
  mat.castShadow = mat.receiveShadow = true;
  g.add(mat);

  // --- “Print” area for the LinkedIn logo
  const printW = outer.w - printInset * 2;
  const printH = outer.h - printInset * 2;
  const printD = 0.002;

  // Create logo texture via canvas (rounded blue square + “in”)
  const size = 1024;
  const cnv = document.createElement('canvas');
  cnv.width = cnv.height = size;
  const ctx = cnv.getContext('2d');

  // background = transparent (shows mat around it)
  ctx.clearRect(0,0,size,size);

  // rounded blue square
  const r = size * 0.12;
  const pad = size * 0.10;
  const bx = pad, by = pad, bw = size - pad*2, bh = size - pad*2;
  ctx.fillStyle = `#${logoBlue.toString(16).padStart(6,'0')}`;
  roundRect(ctx, bx, by, bw, bh, r);
  ctx.fill();

  // "in" letters
  ctx.fillStyle = '#ffffff';
  ctx.font = `${Math.floor(size*0.56)}px Arial Black, Helvetica, Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  // draw “in” roughly centered
  const text = 'in';
  // crude centering tweak:
  const metrics = ctx.measureText(text);
  const tx = bx + bw*0.33 - metrics.actualBoundingBoxLeft;
  const ty = by + bh*0.72;
  ctx.fillText(text, tx, ty);

  const logoTex = new THREE.CanvasTexture(cnv);
  logoTex.colorSpace = THREE.SRGBColorSpace;
  logoTex.anisotropy = 8;

  const print = new THREE.Mesh(
    new THREE.PlaneGeometry(printW, printH),
    new THREE.MeshStandardMaterial({ map: logoTex, roughness: 0.9, metalness: 0, side: THREE.FrontSide })
  );
  print.position.z = mat.position.z + matDepth/2 + 0.001; // a hair above the mat
  print.castShadow = print.receiveShadow = false;
  g.add(print);

  // --- Subtle front acrylic (optional glow edge look)
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(matW, matH),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.06,
      roughness: 0.1,
      metalness: 0,
      transmission: 0.0, // leave 0 to avoid refractive cost
      thickness: 0.01
    })
  );
  glass.position.z = print.position.z + 0.002;
  g.add(glass);

  // utility: draw rounded rect on canvas
  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x+rr, y);
    ctx.arcTo(x+w, y,   x+w, y+h, rr);
    ctx.arcTo(x+w, y+h, x,   y+h, rr);
    ctx.arcTo(x,   y+h, x,   y,   rr);
    ctx.arcTo(x,   y,   x+w, y,   rr);
    ctx.closePath();
  }

  // Make the *front* plane the thing we click
  print.userData.openUrl = url;
  glass.userData.openUrl = url; // either works

  return g;
}
