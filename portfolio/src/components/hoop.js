// BasketballHoop.js
import * as THREE from 'three';

export function createBasketballHoop(options = {}) {
    const {
        rimRadius = 0.23,
        rimTube = 0.02,
        backboardWidth = 1.2,
        backboardHeight = 0.8,
        backboardDepth = 0.05,
        poleHeight = 3.0,
        poleRadius = 0.05,
        position = new THREE.Vector3(0, 0, 0),
        scale = 1,
        colors = {
            rim: 0xff6a00,
            backboard: 0xffffff,
            backboardBorder: 0x000000,
            backboardBox: 0xff0000,
            pole: 0x444444,
            net: 0xffffff
        }
    } = options;

    const group = new THREE.Group();

    // --- MATERIALS ---
    const rimMat = new THREE.MeshStandardMaterial({ color: colors.rim, metalness: 0.2, roughness: 0.4 });
    const backboardMat = new THREE.MeshStandardMaterial({ color: colors.backboard, roughness: 0.7 });
    const borderMat = new THREE.LineBasicMaterial({ color: colors.backboardBorder });
    const boxMat = new THREE.LineBasicMaterial({ color: colors.backboardBox });
    const poleMat = new THREE.MeshStandardMaterial({ color: colors.pole, metalness: 0.1, roughness: 0.6 });
    const netMat = new THREE.MeshStandardMaterial({ color: colors.net, wireframe: true });

    // --- POLE ---
    const poleGeom = new THREE.CylinderGeometry(poleRadius, poleRadius, poleHeight, 16);
    const poleMesh = new THREE.Mesh(poleGeom, poleMat);
    poleMesh.position.y = poleHeight / 2;
    group.add(poleMesh);

    // --- BACKBOARD ---
    const backboardGeom = new THREE.BoxGeometry(backboardWidth, backboardHeight, backboardDepth);
    const backboardMesh = new THREE.Mesh(backboardGeom, backboardMat);
    const backboardOffsetY = poleHeight - backboardHeight * 0.4;
    const backboardOffsetZ = -0.15;
    backboardMesh.position.set(0, backboardOffsetY, backboardOffsetZ);
    group.add(backboardMesh);

    // Backboard border
    const backboardEdges = new THREE.EdgesGeometry(backboardGeom);
    const borderLines = new THREE.LineSegments(backboardEdges, borderMat);
    backboardMesh.add(borderLines);

    // --- SHOOTING BOX (correct side + nicer size) ---
    // Roughly realistic proportions: about 1/3 board width, ~0.4 board height
    const boxWidth = backboardWidth * 0.33;
    const boxHeight = backboardHeight * 0.4;

    const boxShape = new THREE.Shape();
    boxShape.moveTo(-boxWidth / 2, -boxHeight / 2);
    boxShape.lineTo(boxWidth / 2, -boxHeight / 2);
    boxShape.lineTo(boxWidth / 2, boxHeight / 2);
    boxShape.lineTo(-boxWidth / 2, boxHeight / 2);
    boxShape.lineTo(-boxWidth / 2, -boxHeight / 2);

    const boxGeom = new THREE.BufferGeometry().setFromPoints(boxShape.getPoints());
    const boxLine = new THREE.LineLoop(boxGeom, boxMat);

    // Put the box on the *front* face (same side as rim)
    // Front face is the negative z side in backboard local space
    const boxOffsetZ = -backboardDepth / 2 - 0.001;

    // Position vertically: a bit above the rim
    // Compute rim offset from backboard center in Y and place box above it
    const rimOffsetYApprox = -0.3; // same offset we use later for rim height relative to backboardOffsetY
    const rimOffsetFromBoardCenterY = rimOffsetYApprox; // negative means rim is slightly below board center
    const boxBottomY = rimOffsetFromBoardCenterY + 0.05; // bottom of box slightly above rim
    const boxCenterY = boxBottomY + boxHeight / 2;

    boxLine.position.set(0, boxCenterY, boxOffsetZ);
    backboardMesh.add(boxLine);

    // --- RIM ---
    const rimGeom = new THREE.TorusGeometry(rimRadius, rimTube, 16, 32);
    const rimMesh = new THREE.Mesh(rimGeom, rimMat);
    rimMesh.rotation.x = -Math.PI / 2;

    const rimHeight = backboardOffsetY - 0.3;

    // Move rim further forward so it clearly hangs in front of the board
    const rimDistanceFromBackboard = backboardDepth / 2 + rimRadius + rimTube; // more clearance
    rimMesh.position.set(0, rimHeight, backboardOffsetZ - rimDistanceFromBackboard);
    group.add(rimMesh);

    // --- NET ---
    const netTopRadius = rimRadius * 0.95;
    const netBottomRadius = rimRadius * 0.4;
    const netHeight = 0.4;

    const netGeom = new THREE.CylinderGeometry(
        netTopRadius,
        netBottomRadius,
        netHeight,
        16,
        5,
        true
    );
    const netMesh = new THREE.Mesh(netGeom, netMat);
    netMesh.position.set(0, rimHeight - netHeight / 2, rimMesh.position.z);
    group.add(netMesh);

    // --- FINAL TRANSFORM ---
    group.position.copy(position);
    group.scale.setScalar(scale);
    group.name = 'BasketballHoop';

    return group;
}
