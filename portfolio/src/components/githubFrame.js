import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

export function createGitHubFrame(opts = {}) {
  const {
    outer = { w: 0.7, h: 0.7, d: 0.04 },
    frameWidth = 0.06,
    frameColor = 0x4a3b2e,
    matColor = 0xffffff,
    matInset = 0.06,
    matDepth = 0.01,
    printInset = 0.16,

    bgColor = 0x0d1117,
    circleColor = 0xe6edf3,

    svgPath = new URL('../texture/logos/GitHub_Invertocat_Dark.svg', import.meta.url).href,

    url = 'https://github.com/your-handle',
  } = opts;

  const g = new THREE.Group();
  g.name = 'GitHubFrame';
  g.userData.url = url;

  //board
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(outer.w, outer.h, outer.d),
    new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.9, metalness: 0 })
  );
  back.castShadow = back.receiveShadow = true;
  g.add(back);

  //frame
  const railDepth = outer.d * 0.5;
  const railMat = new THREE.MeshStandardMaterial({ color: frameColor, roughness: 0.6, metalness: 0.05 });
  const mkRail = (w, h) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, railDepth), railMat);
    m.castShadow = m.receiveShadow = true;
    return m;
  };
  const top = mkRail(outer.w, frameWidth);    top.position.set(0,  outer.h/2 - frameWidth/2, railDepth/2);
  const bot = mkRail(outer.w, frameWidth);    bot.position.set(0, -outer.h/2 + frameWidth/2, railDepth/2);
  const left = mkRail(frameWidth, outer.h - frameWidth*2);  left.position.set(-outer.w/2 + frameWidth/2, 0, railDepth/2);
  const right = mkRail(frameWidth, outer.h - frameWidth*2); right.position.set( outer.w/2 - frameWidth/2, 0, railDepth/2);
  g.add(top, bot, left, right);

  //mat
  const matW = outer.w - matInset * 2;
  const matH = outer.h - matInset * 2;
  const mat = new THREE.Mesh(
    new THREE.BoxGeometry(matW, matH, matDepth),
    new THREE.MeshStandardMaterial({ color: matColor, roughness: 0.95, metalness: 0 })
  );
  mat.position.z = railDepth + matDepth / 2;
  mat.castShadow = mat.receiveShadow = true;
  g.add(mat);

  const printW = outer.w - printInset * 2;
  const printH = outer.h - printInset * 2;
  const baseZ = mat.position.z + matDepth/2 + 0.0005;

  const bgRect = new THREE.Mesh(
    new THREE.PlaneGeometry(printW, printH),
    new THREE.MeshBasicMaterial({ color: bgColor, toneMapped: false })
  );
  bgRect.position.z = baseZ;
  bgRect.renderOrder = 1;
  bgRect.material.depthWrite = false;
  bgRect.userData.openUrl = url;
  g.add(bgRect);

  const r = Math.min(printW, printH) * 0.48;
  const circle = new THREE.Mesh(
    new THREE.CircleGeometry(r, 96),
    new THREE.MeshBasicMaterial({ color: circleColor, toneMapped: false })
  );
  circle.position.z = bgRect.position.z + 0.0006;
  circle.renderOrder = 2;
  circle.material.depthWrite = false;
  circle.userData.openUrl = url;
  g.add(circle);

  const loader = new SVGLoader();
  loader.load(
    svgPath,
    (data) => {
      const svgGroup = new THREE.Group();
      const fillMat = new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false, side: THREE.DoubleSide });

      data.paths.forEach((p) => {
        const shapes = SVGLoader.createShapes(p);
        shapes.forEach((s) => {
          const geo = new THREE.ShapeGeometry(s);
          const mesh = new THREE.Mesh(geo, fillMat);
          svgGroup.add(mesh);
        });
      });

      svgGroup.scale.y *= -1;

      const box = new THREE.Box3().setFromObject(svgGroup);
      const size = new THREE.Vector3(); box.getSize(size);
      const maxDim = Math.max(size.x, size.y);
      const target = r * 2 * 0.85;
      const s = target / maxDim;
      svgGroup.scale.multiplyScalar(s);

      const box2 = new THREE.Box3().setFromObject(svgGroup);
      const center = new THREE.Vector3(); box2.getCenter(center);
      svgGroup.position.sub(center);       // move center to (0,0,0)
      svgGroup.position.z = circle.position.z + 0.0006;
      svgGroup.renderOrder = 3;

      // Clean layering + click-through
      svgGroup.traverse((o) => {
        if (o.isMesh) {
          o.material.depthWrite = false;
          o.castShadow = false;
          o.receiveShadow = false;
          o.userData.openUrl = url;
        }
      });

      g.add(svgGroup);
    },
    undefined,
    (err) => {
      console.error('SVG load failed:', err, svgPath);
    }
  );

  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(matW, matH),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.06,
      roughness: 0.1,
      metalness: 0,
      transmission: 0.0,
      thickness: 0.01
    })
  );
  glass.position.z = circle.position.z + 0.003;
  glass.renderOrder = 4;
  glass.userData.openUrl = url;
  g.add(glass);

  return g;
}
