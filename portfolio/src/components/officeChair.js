// src/components/chair.js
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export function createChair(opts = {}) {
  const {
    seatW = 0.56,
    seatD = 0.52,
    seatT = 0.08,
    backH = 0.68,
    backT = 0.06,
    armPadW = 0.26,
    armPadD = 0.08,
    armPadT = 0.04,
    gasLiftH = 0.36,
    baseR = 0.42,
    legR = 0.035,
    casterR = 0.05,
    casterT = 0.03,
    colors = {
      fabric: 0x2a2d35,
      plastic: 0x1a1c20,
      metal: 0x9aa1aa,
      accent: 0x3b82f6,
    },
    spinSpeed: initialSpinSpeed = 0.2,
  } = opts;

  const chair = new THREE.Group();
  chair.name = 'Chair';

  const matFabric  = new THREE.MeshStandardMaterial({ color: colors.fabric,  roughness: 0.9,  metalness: 0.05 });
  const matPlastic = new THREE.MeshStandardMaterial({ color: colors.plastic, roughness: 0.6,  metalness: 0.1  });
  const matMetal   = new THREE.MeshStandardMaterial({ color: colors.metal,   roughness: 0.35, metalness: 0.7  });
  const matAccent  = new THREE.MeshStandardMaterial({ color: colors.accent,  roughness: 0.6,  metalness: 0.2  });

  // ---------- Base ----------
  const base = new THREE.Group();
  chair.add(base);

  const gasOuter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.06, gasLiftH, 24),
    matMetal
  );
  gasOuter.position.y = gasLiftH / 2;
  gasOuter.castShadow = gasOuter.receiveShadow = true;
  base.add(gasOuter);

  const hubH = 0.09;
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.11, hubH, 24),
    matMetal
  );
  hub.position.y = hubH / 2;
  hub.castShadow = hub.receiveShadow = true;
  base.add(hub);

  const innerOffset = 0.11;
const legLength = Math.max(0.1, baseR - casterR - innerOffset);
const forkH = 0.10; // a little longer so the wheel clearly hangs below the leg

for (let i = 0; i < 5; i++) {
  const legGroup = new THREE.Group();
  legGroup.position.y = hub.position.y;          // leg pivot at hub height
  legGroup.rotation.y = (i * 2 * Math.PI) / 5;   // 72° steps
  base.add(legGroup);

  // Leg tube: local +X is radial
  const leg = new THREE.Mesh(
    new THREE.CylinderGeometry(legR, legR, legLength, 16),
    matMetal
  );
  leg.rotation.z = Math.PI / 2;
  leg.position.x = innerOffset + legLength / 2;
  leg.castShadow = leg.receiveShadow = true;
  legGroup.add(leg);

  // --- NEW: fork is centered *below* the leg end ---
  const legEndX = innerOffset + legLength;
const legEndY = legGroup.position.y;

// Drop the fork lower so the wheel hangs beneath it
const forkH = 0.10;
const forkCenterY = legEndY - forkH * 0.6;  // slightly lower than before
const wheelY = forkCenterY - forkH * 0.55;  // wheel fully below fork

const fork = new THREE.Mesh(
  new THREE.CylinderGeometry(0.015, 0.02, forkH, 16),
  matPlastic
);
fork.position.set(legEndX, forkCenterY, 0);
fork.castShadow = fork.receiveShadow = true;
legGroup.add(fork);

// Wheel (upright plane)
const wheel = new THREE.Mesh(
  new THREE.TorusGeometry(casterR, casterT * 0.5, 12, 24),
  matPlastic
);
wheel.position.set(legEndX, wheelY, 0);
wheel.castShadow = wheel.receiveShadow = true;
legGroup.add(wheel);

const cap = new THREE.Mesh(
  new THREE.CylinderGeometry(casterR * 0.45, casterR * 0.45, casterT, 24),
  matMetal
);
cap.position.set(legEndX, wheelY, 0);
cap.castShadow = cap.receiveShadow = true;
legGroup.add(cap);
}

  // ---------- Swivel ----------
  const swivel = new THREE.Group();
  swivel.position.y = gasLiftH + 0.02;
  chair.add(swivel);

  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.08, 0.04, 24),
    matMetal
  );
  collar.castShadow = collar.receiveShadow = true;
  swivel.add(collar);

  // ---------- Seat ----------
  const seat = new THREE.Mesh(
    new RoundedBoxGeometry(seatW, seatT, seatD, 3, 0.06),
    matFabric
  );
  seat.position.y = seatT / 2 + 0.03;
  seat.castShadow = seat.receiveShadow = true;
  swivel.add(seat);

  const seatEdge = new THREE.Mesh(
    new THREE.TorusGeometry(Math.max(seatW, seatD) * 0.48, 0.004, 12, 48),
    matAccent
  );
  seatEdge.rotation.x = Math.PI / 2;
  seatEdge.position.y = seat.position.y + seatT * 0.45;
  seatEdge.visible = false;
  swivel.add(seatEdge);

  // ---------- Backrest (no spine/brace) ----------
  const back = new THREE.Mesh(
    new RoundedBoxGeometry(seatW * 0.9, backH, backT, 3, 0.07),
    matFabric
  );
  back.position.set(0, seat.position.y + backH / 2 + 0.06, -seatD * 0.45);
  back.rotation.x = -Math.PI * 0.03;
  back.castShadow = back.receiveShadow = true;
  swivel.add(back);

  // (REMOVED the metal brace/spine entirely)

  // ---------- Armrests ----------
    const armH = seat.position.y + 0.20;
    const armInsetX = 0.06;
    const armOffsetX = seatW * 0.5 - armInsetX;
    const armBackwardZ = seatD * 0.05;  // moved back a little from before

    const supportH = 0.18;
    const armSupportL = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, supportH, 16),
    matMetal
    );
    armSupportL.position.set(-armOffsetX, armH - supportH / 2, -armBackwardZ);
    armSupportL.castShadow = armSupportL.receiveShadow = true;

    const armSupportR = armSupportL.clone();
    armSupportR.position.x = armOffsetX;

    // Pads: rotated forward-facing, but now slightly further back
    const armPadL = new THREE.Mesh(
    new RoundedBoxGeometry(armPadW, armPadT, armPadD, 3, 0.02),
    matPlastic
    );
    armPadL.position.set(-armOffsetX, armH, -armBackwardZ);
    armPadL.rotation.y = Math.PI / 2;
    armPadL.castShadow = armPadL.receiveShadow = true;

    const armPadR = armPadL.clone();
    armPadR.position.x = armOffsetX;

    swivel.add(armSupportL, armSupportR, armPadL, armPadR);

  // ---------- Auto-spin ----------
  let spinOn = true;
  let spinSpeed = initialSpinSpeed;

  chair.userData.update = (dt = 1 / 60) => {
    if (!spinOn) return;
    swivel.rotation.y += spinSpeed * dt;
  };
  chair.userData.setSpin = (enabled) => (spinOn = !!enabled);
  chair.userData.setSpinSpeed = (radPerSec) => (spinSpeed = radPerSec);

  // ---------- Shadows ----------
  chair.traverse((obj) => {
    if (obj.isMesh) obj.castShadow = obj.receiveShadow = true;
  });

  return chair;
}