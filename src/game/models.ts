import * as THREE from 'three';
import type { ItemStage, LineId, ToyType } from '../types/game';
import type { ProceduralTextures } from './textures';

export interface SharedGiftMaterials {
  regularWrapMat: THREE.MeshStandardMaterial;
  goldWrapMat: THREE.MeshStandardMaterial;
  ribbonMat: THREE.MeshStandardMaterial;
  goldRibbonMat: THREE.MeshStandardMaterial;
  ledOnMat: THREE.MeshStandardMaterial;
  ledOffMat: THREE.MeshStandardMaterial;
}

export function createSharedGiftMaterials(): SharedGiftMaterials {
  return {
    regularWrapMat: new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.36,
      metalness: 0.16,
    }),
    goldWrapMat: new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.18,
      metalness: 0.85,
      emissive: 0xd97706,
      emissiveIntensity: 0.5,
    }),
    ribbonMat: new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.72,
      roughness: 0.22,
    }),
    goldRibbonMat: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.78,
      roughness: 0.2,
      emissive: 0xfef08a,
      emissiveIntensity: 0.4,
    }),
    ledOnMat: new THREE.MeshStandardMaterial({
      color: 0x4ade80,
      emissive: 0x22c55e,
      emissiveIntensity: 1.35,
    }),
    ledOffMat: new THREE.MeshStandardMaterial({
      color: 0x334155,
      emissive: 0x22c55e,
      emissiveIntensity: 0,
    }),
  };
}

export interface ElfWorkerRig {
  group: THREE.Group;
  bodyGroup: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  headGroup: THREE.Group;
  propBox: THREE.Group;
  minX: number;
  maxX: number;
  laneZ: number;
  phase: number;
  speed: number;
  carriesGift: boolean;
}

export interface SharedElfAssets {
  torsoGeo: THREE.CylinderGeometry;
  beltGeo: THREE.CylinderGeometry;
  buckleGeo: THREE.BoxGeometry;
  collarGeo: THREE.TorusGeometry;
  legGeo: THREE.BoxGeometry;
  bootGeo: THREE.BoxGeometry;
  armGeo: THREE.BoxGeometry;
  headGeo: THREE.SphereGeometry;
  earGeo: THREE.ConeGeometry;
  eyeGeo: THREE.SphereGeometry;
  hatBrimGeo: THREE.TorusGeometry;
  hatConeGeo: THREE.ConeGeometry;
  pomGeo: THREE.SphereGeometry;
  propBoxGeo: THREE.BoxGeometry;
  propRibGeoA: THREE.BoxGeometry;
  propRibGeoB: THREE.BoxGeometry;
  tunicMats: THREE.MeshStandardMaterial[];
  hatMats: THREE.MeshStandardMaterial[];
  skinMat: THREE.MeshStandardMaterial;
  bootMat: THREE.MeshStandardMaterial;
  trimMat: THREE.MeshStandardMaterial;
  goldMat: THREE.MeshStandardMaterial;
  eyeMat: THREE.MeshStandardMaterial;
}

export interface MachineRigRefs {
  lineId: LineId;
  root: THREE.Group;
  beltMat: THREE.MeshStandardMaterial;
  rollers: THREE.Mesh[];
  speedLeds: THREE.Mesh[];
  toyMaker: {
    group: THREE.Group;
    piston: THREE.Mesh;
    gears: THREE.Mesh[];
    beacon: THREE.Mesh;
    upgradeCrown: THREE.Group;
    turboStack: THREE.Group;
  };
  wrapper: {
    group: THREE.Group;
    leftArm: THREE.Mesh;
    rightArm: THREE.Mesh;
    pressHead: THREE.Mesh;
    paperRoll: THREE.Mesh;
    beacon: THREE.Mesh;
  };
  ribboner: {
    group: THREE.Group;
    spool: THREE.Mesh;
    stamper: THREE.Group;
    beacon: THREE.Mesh;
    goldenBeacon: THREE.Group;
  };
  workers: ElfWorkerRig[];
  lockedOverlay: THREE.Group;
}

export interface StorageBayRefs {
  group: THREE.Group;
  slots: THREE.Group[];
  slotBoxes: THREE.Mesh[];
  extraRack: THREE.Group;
  megaRack: THREE.Group;
}

export interface TruckRigRefs {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  cargoVisuals: THREE.Group[];
  headlights: THREE.Mesh[];
  fleetUpgradeKit: THREE.Group;
}

export interface TrainRigRefs {
  trackGroup: THREE.Group;
  trainGroup: THREE.Group;
  wheels: THREE.Mesh[];
  cargoVisuals: THREE.Group[];
  stationGroup: THREE.Group;
  secondWagon: THREE.Group;
  signalBulbMat: THREE.MeshStandardMaterial;
}

export interface GeneratorRigRefs {
  group: THREE.Group;
  rotor: THREE.Group;
  statusCore: THREE.Mesh;
  upgradeCoil: THREE.Group;
  tier3Stack: THREE.Group;
}

export interface TreeRigRefs {
  group: THREE.Group;
  star: THREE.Mesh;
  ornaments: THREE.Mesh[];
  magicTier2: THREE.Group;
  magicTier3: THREE.Group;
}

const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

function addContactShadow(
  parent: THREE.Object3D,
  texture: THREE.CanvasTexture,
  w: number,
  d: number,
  y = 0.015,
) {
  const geo = new THREE.PlaneGeometry(w, d);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    opacity: 0.52,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = y;
  parent.add(mesh);
}

function tagInteractive(
  group: THREE.Object3D,
  kind:
    | 'toy_maker'
    | 'wrapper'
    | 'ribboner'
    | 'storage'
    | 'truck'
    | 'tree'
    | 'generator'
    | 'train_station',
  title: string,
  lineId?: LineId,
  size: [number, number, number] = [2.1, 2.2, 2.1],
  offsetY = 1.1,
) {
  const proxy = new THREE.Mesh(
    new THREE.BoxGeometry(size[0], size[1], size[2]),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  proxy.position.y = offsetY;
  proxy.layers.set(1);
  proxy.userData = { interactiveKind: kind, lineId, title };
  group.add(proxy);
}

export function createSnowyTownEnvironment(textures: ProceduralTextures): {
  group: THREE.Group;
  windowGlowMats: THREE.MeshStandardMaterial[];
} {
  const group = new THREE.Group();
  const windowGlowMats: THREE.MeshStandardMaterial[] = [];

  // Extended snowy ground plane
  const groundGeo = new THREE.PlaneGeometry(160, 160);
  groundGeo.rotateX(-Math.PI / 2);
  const groundMat = new THREE.MeshStandardMaterial({
    map: textures.snowGround,
    color: 0xeaf4ff,
    roughness: 0.92,
    metalness: 0.02,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.position.y = 0;
  ground.receiveShadow = true;
  group.add(ground);

  // Paved Snowy Delivery Road outside dock (X = 12.6)
  const roadGeo = new THREE.PlaneGeometry(4.4, 140);
  roadGeo.rotateX(-Math.PI / 2);
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x2a3648,
    roughness: 0.82,
    metalness: 0.06,
  });
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.position.set(12.6, 0.02, 0);
  road.receiveShadow = true;
  group.add(road);

  // Curbs along road
  const curbMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.78 });
  const curbGeo = new THREE.BoxGeometry(0.24, 0.1, 140);
  const curbL = new THREE.Mesh(curbGeo, curbMat);
  curbL.position.set(10.35, 0.05, 0);
  const curbR = new THREE.Mesh(curbGeo, curbMat);
  curbR.position.set(14.85, 0.05, 0);
  group.add(curbL, curbR);

  const dashGeo = new THREE.PlaneGeometry(0.22, 2.0);
  dashGeo.rotateX(-Math.PI / 2);
  const dashMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    roughness: 0.6,
    emissive: 0xca8a04,
    emissiveIntensity: 0.25,
  });
  for (let z = -38; z <= 38; z += 5) {
    const dash = new THREE.Mesh(dashGeo, dashMat);
    dash.position.set(12.6, 0.035, z);
    group.add(dash);
  }

  // Rolling snowy hill mounds around perimeter
  const hillMat = new THREE.MeshStandardMaterial({
    color: 0xdcebf9,
    roughness: 0.9,
    metalness: 0.0,
  });
  const hillPositions: Array<[number, number, number, number]> = [
    [-24, -22, 10, 4.8],
    [-8, -28, 12, 5.5],
    [10, -26, 9, 4.2],
    [-27, 0, 11, 5.0],
    [-25, 20, 10, 4.4],
    [-5, 27, 13, 4.8],
    [30, -20, 11, 4.8],
    [31, 11, 12, 5.2],
    [28, 26, 10, 4.2],
  ];
  hillPositions.forEach(([x, z, r, h]) => {
    const hillGeo = new THREE.SphereGeometry(r, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5);
    hillGeo.scale(1, h / r, 1);
    const hill = new THREE.Mesh(hillGeo, hillMat);
    hill.position.set(x, -0.2, z);
    hill.receiveShadow = true;
    group.add(hill);
  });

  // Instanced Pine Forest
  const treeCoords: Array<[number, number]> = [];
  for (let i = 0; i < 48; i++) {
    const angle = (i / 48) * Math.PI * 2 + (i % 3) * 0.12;
    const radius = 21 + (i % 4) * 3.8;
    const tx = Math.cos(angle) * radius;
    const tz = Math.sin(angle) * radius;
    if (Math.abs(tx - 12.6) < 4.5 || Math.abs(tx - 17.6) < 4.2) continue;
    treeCoords.push([tx, tz]);
  }

  const count = treeCoords.length;
  const trunkInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.24, 0.34, 1.5, 7),
    new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.9 }),
    count,
  );
  const foliageLowInst = new THREE.InstancedMesh(
    new THREE.ConeGeometry(1.5, 2.6, 7),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }),
    count,
  );
  const foliageTopInst = new THREE.InstancedMesh(
    new THREE.ConeGeometry(1.1, 2.2, 7),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.78 }),
    count,
  );
  const snowCapInst = new THREE.InstancedMesh(
    new THREE.ConeGeometry(0.75, 1.15, 7),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.88 }),
    count,
  );

  trunkInst.castShadow = true;
  foliageLowInst.castShadow = true;
  foliageTopInst.castShadow = true;

  treeCoords.forEach(([tx, tz], idx) => {
    const s = 0.85 + ((idx * 37) % 100) / 280;
    const rot = (idx * 1.7) % (Math.PI * 2);

    _dummy.position.set(tx, 0.75 * s, tz);
    _dummy.rotation.set(0, rot, 0);
    _dummy.scale.setScalar(s);
    _dummy.updateMatrix();
    trunkInst.setMatrixAt(idx, _dummy.matrix);

    _dummy.position.set(tx, 2.2 * s, tz);
    _dummy.updateMatrix();
    foliageLowInst.setMatrixAt(idx, _dummy.matrix);

    _dummy.position.set(tx, 3.5 * s, tz);
    _dummy.updateMatrix();
    foliageTopInst.setMatrixAt(idx, _dummy.matrix);

    _dummy.position.set(tx, 4.35 * s, tz);
    _dummy.updateMatrix();
    snowCapInst.setMatrixAt(idx, _dummy.matrix);

    const gShade = 0.32 + ((idx * 13) % 10) * 0.015;
    _color.setRGB(0.08, gShade, 0.16);
    foliageLowInst.setColorAt(idx, _color);
    _color.setRGB(0.11, gShade + 0.05, 0.19);
    foliageTopInst.setColorAt(idx, _color);
  });

  [trunkInst, foliageLowInst, foliageTopInst, snowCapInst].forEach((inst) => {
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    inst.computeBoundingSphere();
    group.add(inst);
  });

  // Festive Street Lamps
  const postMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.65, roughness: 0.3 });
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.8,
    roughness: 0.2,
  });
  const lampCoords: Array<[number, number]> = [
    [10.1, -6.5],
    [10.1, 7.5],
    [15.0, -7.8],
    [15.0, 6.5],
    [-11.5, 9.2],
  ];
  const lampBulbGeo = new THREE.SphereGeometry(0.22, 8, 8);
  const lampPoleGeo = new THREE.CylinderGeometry(0.1, 0.14, 3.4, 7);
  const lampBaseGeo = new THREE.CylinderGeometry(0.24, 0.3, 0.3, 7);
  const lampCapGeo = new THREE.ConeGeometry(0.38, 0.35, 6);
  const lampBowGeo = new THREE.TorusGeometry(0.15, 0.04, 6, 10);
  const lampBowMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
  windowGlowMats.push(bulbMat);

  lampCoords.forEach(([lx, lz]) => {
    const lamp = new THREE.Group();
    const pole = new THREE.Mesh(lampPoleGeo, postMat);
    pole.position.y = 1.7;
    const base = new THREE.Mesh(lampBaseGeo, postMat);
    base.position.y = 0.15;
    const cap = new THREE.Mesh(lampCapGeo, postMat);
    cap.position.y = 3.6;
    const bulb = new THREE.Mesh(lampBulbGeo, bulbMat);
    bulb.position.y = 3.32;
    const bow = new THREE.Mesh(lampBowGeo, lampBowMat);
    bow.position.y = 2.6;
    bow.rotation.x = Math.PI / 2;

    lamp.add(pole, base, cap, bulb, bow);
    lamp.position.set(lx, 0, lz);
    addContactShadow(lamp, textures.contactShadow, 1.2, 1.2);
    group.add(lamp);
  });

  // Cute Snowmen (shared geometries & contact shadows)
  const snowManPositions: Array<[number, number, number]> = [
    [-11.4, 5.4, 0.6],
    [8.8, 10.6, -0.4],
  ];
  const snowBodyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.85 });
  const carrotMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 });
  const scarfMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.7 });
  const coalMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
  const smB1Geo = new THREE.SphereGeometry(0.65, 10, 8);
  const smB2Geo = new THREE.SphereGeometry(0.46, 10, 8);
  const smHeadGeo = new THREE.SphereGeometry(0.33, 10, 8);
  const smNoseGeo = new THREE.ConeGeometry(0.06, 0.28, 7);
  const smScarfGeo = new THREE.TorusGeometry(0.32, 0.08, 6, 12);
  const smBrimGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.06, 10);
  const smTopGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.36, 10);

  snowManPositions.forEach(([sx, sz, rotY]) => {
    const sm = new THREE.Group();
    const b1 = new THREE.Mesh(smB1Geo, snowBodyMat);
    b1.position.y = 0.55;
    const b2 = new THREE.Mesh(smB2Geo, snowBodyMat);
    b2.position.y = 1.4;
    const head = new THREE.Mesh(smHeadGeo, snowBodyMat);
    head.position.y = 2.02;
    const nose = new THREE.Mesh(smNoseGeo, carrotMat);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 2.02, 0.38);
    const scarf = new THREE.Mesh(smScarfGeo, scarfMat);
    scarf.rotation.x = Math.PI / 2;
    scarf.position.y = 1.75;
    const hatBrim = new THREE.Mesh(smBrimGeo, coalMat);
    hatBrim.position.y = 2.3;
    const hatTop = new THREE.Mesh(smTopGeo, coalMat);
    hatTop.position.y = 2.48;

    sm.add(b1, b2, head, nose, scarf, hatBrim, hatTop);
    sm.position.set(sx, 0, sz);
    sm.rotation.y = rotY;
    addContactShadow(sm, textures.contactShadow, 1.5, 1.5);
    group.add(sm);
  });

  return { group, windowGlowMats };
}

export function createFactoryBuilding(textures: ProceduralTextures): {
  group: THREE.Group;
  stringLightMats: THREE.MeshStandardMaterial[];
  windowGlowMats: THREE.MeshStandardMaterial[];
  powerConduitMat: THREE.MeshStandardMaterial;
  floor2Structure: THREE.Group;
  floor2SouthWing: THREE.Group;
  floor3Structure: THREE.Group;
  rebirthStage1: THREE.Group;
  rebirthStage2: THREE.Group;
  rebirthStage3: THREE.Group;
  rebirthStar: THREE.Mesh;
} {
  const group = new THREE.Group();
  const stringLightMats: THREE.MeshStandardMaterial[] = [];
  const windowGlowMats: THREE.MeshStandardMaterial[] = [];

  // Stone architectural foundation curb
  const slabMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.82,
    metalness: 0.08,
  });
  const slab = new THREE.Mesh(new THREE.BoxGeometry(20.8, 0.34, 18.8), slabMat);
  slab.position.set(0, 0.17, 0);
  slab.receiveShadow = true;
  group.add(slab);

  // Polished Workshop Wood Floor
  const floorMat = new THREE.MeshStandardMaterial({
    map: textures.floorWood,
    roughness: 0.52,
    metalness: 0.06,
  });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(19.7, 0.08, 17.7), floorMat);
  floor.position.set(0, 0.35, 0);
  floor.receiveShadow = true;
  group.add(floor);

  // Loading Bay Industrial Hazard Zone Strip on Floor
  const hazMat = new THREE.MeshStandardMaterial({
    map: textures.hazardStripe,
    roughness: 0.65,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const hazStrip = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 8.6), hazMat);
  hazStrip.rotation.x = -Math.PI / 2;
  hazStrip.rotation.z = Math.PI / 2;
  hazStrip.position.set(9.1, 0.395, 0.4);
  group.add(hazStrip);

  const brickMat = new THREE.MeshStandardMaterial({
    map: textures.brickWall,
    roughness: 0.82,
    metalness: 0.02,
  });
  const stoneTrimMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.78,
  });
  const timberMat = new THREE.MeshStandardMaterial({
    color: 0x451a03,
    roughness: 0.68,
  });
  const snowRoofMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.88,
  });
  const trimGoldMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    metalness: 0.8,
    roughness: 0.24,
  });

  // Back & Left Brick Walls + Stone Wainscoting
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(20.2, 6.4, 0.48), brickMat);
  backWall.position.set(0, 3.55, -9.0);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  const backStone = new THREE.Mesh(new THREE.BoxGeometry(20.4, 1.0, 0.58), stoneTrimMat);
  backStone.position.set(0, 0.84, -9.0);
  group.add(backWall, backStone);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.48, 6.4, 18.2), brickMat);
  leftWall.position.set(-10.0, 3.55, 0);
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  const leftStone = new THREE.Mesh(new THREE.BoxGeometry(0.58, 1.0, 18.4), stoneTrimMat);
  leftStone.position.set(-10.0, 0.84, 0);
  group.add(leftWall, leftStone);

  // Structural Timber Pillars & Cutaway Roof Trusses
  const pillarPositions: Array<[number, number]> = [
    [-10.0, -9.0],
    [-3.5, -9.0],
    [3.5, -9.0],
    [9.9, -9.0],
    [-10.0, -3.0],
    [-10.0, 3.0],
    [-10.0, 8.9],
  ];
  pillarPositions.forEach(([px, pz]) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.64, 6.7, 0.64), timberMat);
    p.position.set(px, 3.65, pz);
    p.castShadow = true;
    group.add(p);
  });

  // Architectural Snowy Roof Overhangs + Timber Rafters
  const backEave = new THREE.Mesh(new THREE.BoxGeometry(21.4, 0.45, 2.2), snowRoofMat);
  backEave.position.set(0, 6.9, -8.6);
  backEave.castShadow = true;
  const backTrim = new THREE.Mesh(new THREE.BoxGeometry(21.4, 0.25, 0.16), timberMat);
  backTrim.position.set(0, 6.6, -7.55);
  group.add(backEave, backTrim);

  const leftEave = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.45, 19.4), snowRoofMat);
  leftEave.position.set(-9.6, 6.9, 0);
  leftEave.castShadow = true;
  const leftTrim = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.25, 19.4), timberMat);
  leftTrim.position.set(-8.55, 6.6, 0);
  group.add(leftEave, leftTrim);

  // Rooftop Illuminated Signboard ("CHRISTMAS FACTORY")
  const signGroup = new THREE.Group();
  const signFrame = new THREE.Mesh(new THREE.BoxGeometry(6.8, 1.75, 0.24), trimGoldMat);
  const signFace = new THREE.Mesh(
    new THREE.PlaneGeometry(6.4, 1.48),
    new THREE.MeshStandardMaterial({
      map: textures.factorySign,
      roughness: 0.3,
      emissive: 0xffffff,
      emissiveMap: textures.factorySign,
      emissiveIntensity: 0.35,
    }),
  );
  signFace.position.z = 0.13;
  signGroup.add(signFrame, signFace);
  signGroup.position.set(0, 7.9, -8.3);
  group.add(signGroup);

  // Brick Chimney
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.8, 1.5), brickMat);
  chimney.position.set(-7.5, 7.9, -8.5);
  chimney.castShadow = true;
  const chimneyRim = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.32, 1.85), snowRoofMat);
  chimneyRim.position.set(-7.5, 9.3, -8.5);
  group.add(chimney, chimneyRim);

  // Mullioned Glowing Windows
  const winGlowMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.9,
    roughness: 0.25,
  });
  windowGlowMats.push(winGlowMat);

  [-6.6, 0, 6.6].forEach((wx) => {
    const winGroup = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.9, 0.56), timberMat);
    const pane = new THREE.Mesh(new THREE.BoxGeometry(1.96, 1.48, 0.58), winGlowMat);
    const mullionV = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 0.62), timberMat);
    const mullionH = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 0.62), timberMat);
    const sill = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.18, 0.72), snowRoofMat);
    sill.position.y = -0.96;
    winGroup.add(frame, pane, mullionV, mullionH, sill);
    winGroup.position.set(wx, 2.9, -9.0);
    group.add(winGroup);
  });

  [-6.0, 0, 6.0].forEach((wz) => {
    const winGroup = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.56, 1.9, 2.4), timberMat);
    const pane = new THREE.Mesh(new THREE.BoxGeometry(0.58, 1.48, 1.96), winGlowMat);
    const mullionV = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.5, 0.1), timberMat);
    const mullionH = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.1, 2.0), timberMat);
    const sill = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.18, 2.6), snowRoofMat);
    sill.position.y = -0.96;
    winGroup.add(frame, pane, mullionV, mullionH, sill);
    winGroup.position.set(-10.0, 2.9, wz);
    group.add(winGroup);
  });

  // Overhead Power Conduit Bus connecting Generator (7.5, -7.0) to Factory Lines
  const powerConduitMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0ea5e9,
    emissiveIntensity: 1.1,
    metalness: 0.4,
    roughness: 0.25,
  });
  const copperPipeMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.8,
    roughness: 0.26,
  });
  const mainBus = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 15.5, 8), copperPipeMat);
  mainBus.rotation.z = Math.PI / 2;
  mainBus.position.set(-0.2, 5.4, -8.5);
  const glowStrip = new THREE.Mesh(new THREE.BoxGeometry(15.2, 0.06, 0.06), powerConduitMat);
  glowStrip.position.set(-0.2, 5.26, -8.46);
  group.add(mainBus, glowStrip);

  // Drop conduits along back wall
  [-6.5, -1.0, 3.5].forEach((px) => {
    const drop = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8), powerConduitMat);
    drop.position.set(px, 3.8, -8.55);
    group.add(drop);
  });

  // Festive String Lights along upper eaves (4 shared emissive materials instead of 32!)
  const lightColors = [0xef4444, 0x22c55e, 0xfacc15, 0x38bdf8];
  for (let c = 0; c < lightColors.length; c++) {
    stringLightMats.push(
      new THREE.MeshStandardMaterial({
        color: lightColors[c],
        emissive: lightColors[c],
        emissiveIntensity: 1.4,
        roughness: 0.2,
      }),
    );
  }
  const bulbGeo = new THREE.SphereGeometry(0.13, 7, 7);
  for (let x = -9.5; x <= 9.5; x += 1.2) {
    const mat = stringLightMats[Math.abs(Math.round(x)) % stringLightMats.length];
    const bulb = new THREE.Mesh(bulbGeo, mat);
    bulb.position.set(x, 6.5 - Math.abs(Math.sin(x * 0.8)) * 0.12, -7.6);
    group.add(bulb);
  }
  for (let z = -8.5; z <= 8.5; z += 1.2) {
    const mat = stringLightMats[Math.abs(Math.round(z)) % stringLightMats.length];
    const bulb = new THREE.Mesh(bulbGeo, mat);
    bulb.position.set(-8.6, 6.5 - Math.abs(Math.sin(z * 0.8)) * 0.12, z);
    group.add(bulb);
  }

  // Festive Wreath on Back Wall
  const wreathMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
  const wreath = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.22, 8, 18), wreathMat);
  wreath.position.set(0, 5.2, -8.68);
  const bow = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.3, 0.25),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 }),
  );
  bow.position.set(0, 4.4, -8.58);
  const goldBell = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.34, 8), trimGoldMat);
  goldBell.position.set(0, 5.2, -8.6);
  group.add(wreath, bow, goldBell);

  // Loading Bay Threshold (Right side X = 9.9, Z = 1.5)
  const dockPlatform = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.38, 4.8),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.72 }),
  );
  dockPlatform.position.set(10.0, 0.2, 1.5);
  dockPlatform.receiveShadow = true;
  group.add(dockPlatform);

  const dockArchLeft = new THREE.Mesh(new THREE.BoxGeometry(0.48, 3.6, 0.48), timberMat);
  dockArchLeft.position.set(9.8, 2.05, -0.8);
  const dockArchRight = new THREE.Mesh(new THREE.BoxGeometry(0.48, 3.6, 0.48), timberMat);
  dockArchRight.position.set(9.8, 2.05, 3.8);
  const dockArchTop = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.58, 5.2), timberMat);
  dockArchTop.position.set(9.8, 3.9, 1.5);
  group.add(dockArchLeft, dockArchRight, dockArchTop);

  // 2nd Floor Mezzanine Deck (Architectural Steel + Oak + Balustrade + Chute)
  const floor2Structure = new THREE.Group();
  const mezzDeck = new THREE.Mesh(
    new THREE.BoxGeometry(16.6, 0.28, 4.6),
    new THREE.MeshStandardMaterial({ map: textures.floorWood, roughness: 0.58 }),
  );
  mezzDeck.position.set(-0.4, 4.03, -3.2);
  mezzDeck.castShadow = true;
  mezzDeck.receiveShadow = true;
  floor2Structure.add(mezzDeck);

  // Steel edge girder + warm under-deck LED strip
  const girderMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.72, roughness: 0.32 });
  const frontGirder = new THREE.Mesh(new THREE.BoxGeometry(16.65, 0.22, 0.16), girderMat);
  frontGirder.position.set(-0.4, 3.96, -0.92);
  const underLed = new THREE.Mesh(
    new THREE.BoxGeometry(16.2, 0.05, 0.06),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 1.3 }),
  );
  underLed.position.set(-0.4, 3.84, -0.95);
  floor2Structure.add(frontGirder, underLed);

  [-8.2, -2.5, 2.5, 7.2].forEach((cx) => {
    const colA = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 3.7, 8), girderMat);
    colA.position.set(cx, 2.15, -5.3);
    const colB = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 3.7, 8), girderMat);
    colB.position.set(cx, 2.15, -1.1);
    floor2Structure.add(colA, colB);
  });

  // Balustrade rail + vertical posts
  const frontRail = new THREE.Mesh(new THREE.BoxGeometry(16.6, 0.08, 0.08), trimGoldMat);
  frontRail.position.set(-0.4, 4.78, -0.95);
  floor2Structure.add(frontRail);
  for (let px = -8.2; px <= 7.4; px += 1.55) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.65, 6), girderMat);
    post.position.set(px, 4.46, -0.95);
    floor2Structure.add(post);
  }

  // Staircase with handrail
  for (let s = 0; s < 8; s++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.16, 0.45), timberMat);
    step.position.set(-8.9, 0.65 + s * 0.44, 0.2 - s * 0.44);
    floor2Structure.add(step);
  }

  // Delivery Chute from Floor 2 down to Storage Bay
  const chute = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.14, 0.92), trimGoldMat);
  chute.position.set(7.4, 3.45, -2.2);
  chute.rotation.z = -0.68;
  floor2Structure.add(chute);

  floor2Structure.visible = false;
  group.add(floor2Structure);

  // 2nd Floor South Mezzanine Wing (Line 5 at Z = +1.5)
  const floor2SouthWing = new THREE.Group();
  const wingDeck = new THREE.Mesh(
    new THREE.BoxGeometry(16.6, 0.28, 4.7),
    new THREE.MeshStandardMaterial({ map: textures.floorWood, roughness: 0.58 }),
  );
  wingDeck.position.set(-0.4, 4.03, 1.5);
  wingDeck.castShadow = true;
  wingDeck.receiveShadow = true;
  const wingGirder = new THREE.Mesh(new THREE.BoxGeometry(16.65, 0.22, 0.16), girderMat);
  wingGirder.position.set(-0.4, 3.96, 3.85);
  const wingRail = new THREE.Mesh(new THREE.BoxGeometry(16.6, 0.08, 0.08), trimGoldMat);
  wingRail.position.set(-0.4, 4.78, 3.82);
  floor2SouthWing.add(wingDeck, wingGirder, wingRail);
  [-8.2, -2.5, 2.5, 7.2].forEach((cx) => {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 3.7, 8), girderMat);
    col.position.set(cx, 2.15, 3.7);
    floor2SouthWing.add(col);
  });
  for (let px = -8.2; px <= 7.4; px += 1.55) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.65, 6), girderMat);
    post.position.set(px, 4.46, 3.82);
    floor2SouthWing.add(post);
  }
  const chute5 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.14, 0.92), trimGoldMat);
  chute5.position.set(7.4, 3.45, 1.5);
  chute5.rotation.z = -0.68;
  floor2SouthWing.add(chute5);
  floor2SouthWing.visible = false;
  group.add(floor2SouthWing);

  // 3rd Floor Sky Mezzanine (Line 6 at Y = 7.96, Z = -3.2)
  const floor3Structure = new THREE.Group();
  const f3Deck = new THREE.Mesh(
    new THREE.BoxGeometry(16.6, 0.28, 4.6),
    new THREE.MeshStandardMaterial({ map: textures.floorWood, roughness: 0.55 }),
  );
  f3Deck.position.set(-0.4, 7.83, -3.2);
  f3Deck.castShadow = true;
  f3Deck.receiveShadow = true;
  const f3Girder = new THREE.Mesh(new THREE.BoxGeometry(16.65, 0.22, 0.16), trimGoldMat);
  f3Girder.position.set(-0.4, 7.76, -0.92);
  const f3Rail = new THREE.Mesh(new THREE.BoxGeometry(16.6, 0.08, 0.08), trimGoldMat);
  f3Rail.position.set(-0.4, 8.58, -0.95);
  const f3BackGable = new THREE.Mesh(new THREE.BoxGeometry(20.2, 3.6, 0.44), brickMat);
  f3BackGable.position.set(0, 8.5, -9.0);
  const f3BackEave = new THREE.Mesh(new THREE.BoxGeometry(21.4, 0.45, 2.2), snowRoofMat);
  f3BackEave.position.set(0, 10.4, -8.6);
  floor3Structure.add(f3Deck, f3Girder, f3Rail, f3BackGable, f3BackEave);
  [-8.2, -2.5, 2.5, 7.2].forEach((cx) => {
    const colA = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 3.7, 8), trimGoldMat);
    colA.position.set(cx, 5.95, -5.3);
    const colB = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 3.7, 8), trimGoldMat);
    colB.position.set(cx, 5.95, -1.1);
    floor3Structure.add(colA, colB);
  });
  const f3Chute = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.16, 0.96), trimGoldMat);
  f3Chute.position.set(7.6, 5.9, -1.9);
  f3Chute.rotation.z = -1.08;
  floor3Structure.add(f3Chute);
  floor3Structure.visible = false;
  group.add(floor3Structure);

  // REBIRTH EXPANSION STAGE 1 (Rebirth >= 1): South Courtyard Terrace + Grand Clock Tower + Golden Dock Arch
  const rebirthStage1 = new THREE.Group();
  const southSlab = new THREE.Mesh(new THREE.BoxGeometry(20.8, 0.34, 4.4), slabMat);
  southSlab.position.set(0, 0.17, 11.4);
  southSlab.receiveShadow = true;
  const southDeck = new THREE.Mesh(new THREE.BoxGeometry(19.6, 0.08, 4.0), floorMat);
  southDeck.position.set(0, 0.35, 11.3);
  southDeck.receiveShadow = true;
  const southRail = new THREE.Mesh(new THREE.BoxGeometry(19.6, 0.1, 0.1), trimGoldMat);
  southRail.position.set(0, 1.05, 13.3);
  rebirthStage1.add(southSlab, southDeck, southRail);
  for (let rx = -9.2; rx <= 9.2; rx += 2.3) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.72, 6), timberMat);
    post.position.set(rx, 0.72, 13.3);
    rebirthStage1.add(post);
  }

  // Grand Clock Tower on Northwest Corner (-9.8, -8.8)
  const towerBody = new THREE.Mesh(new THREE.BoxGeometry(2.4, 5.2, 2.4), brickMat);
  towerBody.position.set(-9.8, 9.2, -8.8);
  towerBody.castShadow = true;
  const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(2.1, 2.6, 4), snowRoofMat);
  towerRoof.rotation.y = Math.PI / 4;
  towerRoof.position.set(-9.8, 13.0, -8.8);
  const towerSpire = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.18, 1.4, 8), trimGoldMat);
  towerSpire.position.set(-9.8, 14.5, -8.8);
  const clockDialMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.1,
  });
  const clockDialZ = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.14, 16), clockDialMat);
  clockDialZ.rotation.x = Math.PI / 2;
  clockDialZ.position.set(-9.8, 10.2, -7.56);
  const clockDialX = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.14, 16), clockDialMat);
  clockDialX.rotation.z = Math.PI / 2;
  clockDialX.position.set(-8.56, 10.2, -8.8);
  // Golden Triumphal Loading Arch Accent
  const archCrown = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 5.6), trimGoldMat);
  archCrown.position.set(9.8, 4.35, 1.5);
  rebirthStage1.add(towerBody, towerRoof, towerSpire, clockDialZ, clockDialX, archCrown);
  rebirthStage1.visible = false;
  group.add(rebirthStage1);

  // REBIRTH EXPANSION STAGE 2 (Rebirth >= 2): West Twin Annex Wing + Rotating Sky Beacon Star
  const rebirthStage2 = new THREE.Group();
  const westSlab = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.34, 18.8), slabMat);
  westSlab.position.set(-12.9, 0.17, 0);
  westSlab.receiveShadow = true;
  const westFloor = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.08, 17.8), floorMat);
  westFloor.position.set(-12.7, 0.35, 0);
  westFloor.receiveShadow = true;
  const westBackWall = new THREE.Mesh(new THREE.BoxGeometry(5.2, 6.4, 0.48), brickMat);
  westBackWall.position.set(-12.9, 3.55, -9.0);
  const westSideWall = new THREE.Mesh(new THREE.BoxGeometry(0.48, 6.4, 18.2), brickMat);
  westSideWall.position.set(-15.3, 3.55, 0);
  const westRoof = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.45, 19.4), snowRoofMat);
  westRoof.position.set(-12.9, 6.9, 0);
  const westChimney = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.8, 1.3), brickMat);
  westChimney.position.set(-13.8, 8.2, -7.8);
  const rebirthStar = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.95, 0),
    new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.5,
      metalness: 0.85,
      roughness: 0.15,
    }),
  );
  rebirthStar.position.set(0, 10.6, -8.3);
  rebirthStage2.add(
    westSlab,
    westFloor,
    westBackWall,
    westSideWall,
    westRoof,
    westChimney,
    rebirthStar,
  );
  rebirthStage2.visible = false;
  group.add(rebirthStage2);

  // REBIRTH EXPANSION STAGE 3 (Rebirth >= 3): North Pole Imperial Crystal Dome & East Pillar Colonnade
  const rebirthStage3 = new THREE.Group();
  const domeBase = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.9, 1.1, 16), trimGoldMat);
  domeBase.position.set(5.4, 11.1, -8.3);
  const crystalDome = new THREE.Mesh(
    new THREE.SphereGeometry(2.3, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
    new THREE.MeshStandardMaterial({
      color: 0x67e8f9,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.65,
      metalness: 0.35,
      roughness: 0.12,
      transparent: true,
      opacity: 0.82,
    }),
  );
  crystalDome.position.set(5.4, 11.6, -8.3);
  rebirthStage3.add(domeBase, crystalDome);
  [-8.0, -3.5, 1.0, 5.5, 9.2].forEach((px) => {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 4.2, 10), trimGoldMat);
    col.position.set(px, 2.4, 13.2);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 10), clockDialMat);
    orb.position.set(px, 4.75, 13.2);
    rebirthStage3.add(col, orb);
  });
  rebirthStage3.visible = false;
  group.add(rebirthStage3);

  return {
    group,
    stringLightMats,
    windowGlowMats,
    powerConduitMat,
    floor2Structure,
    floor2SouthWing,
    floor3Structure,
    rebirthStage1,
    rebirthStage2,
    rebirthStage3,
    rebirthStar,
  };
}

export function createGeneratorStation(textures: ProceduralTextures): GeneratorRigRefs {
  const group = new THREE.Group();
  group.position.set(7.5, 0.36, -7.0);
  addContactShadow(group, textures.contactShadow, 3.1, 2.7, 0.01);

  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.72, roughness: 0.32 });
  const copperMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.22 });
  const greenBody = new THREE.MeshStandardMaterial({ color: 0x065f46, metalness: 0.25, roughness: 0.45 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.45, 2.2), darkMetal);
  base.position.y = 0.22;
  base.castShadow = true;

  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 1.65, 14), greenBody);
  tank.rotation.z = Math.PI / 2;
  tank.position.set(-0.2, 1.0, 0);
  tank.castShadow = true;

  const capL = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.18, 14), copperMat);
  capL.rotation.z = Math.PI / 2;
  capL.position.set(-1.05, 1.0, 0);

  // Spinning Electric Turbine Rotor
  const rotor = new THREE.Group();
  rotor.position.set(0.78, 1.0, 0);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.3, 12), copperMat);
  hub.rotation.z = Math.PI / 2;
  rotor.add(hub);
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.28, 0.18), copperMat);
    blade.rotation.x = (i * Math.PI) / 4;
    rotor.add(blade);
  }

  const statusCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.88, 12),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 1.5,
      roughness: 0.15,
    }),
  );
  statusCore.position.set(-0.2, 1.88, 0);

  // Level 2 visual upgrade: Copper inductive ring
  const upgradeCoil = new THREE.Group();
  const extraCoil = new THREE.Mesh(new THREE.TorusGeometry(0.74, 0.08, 8, 18), copperMat);
  extraCoil.rotation.y = Math.PI / 2;
  extraCoil.position.set(-0.2, 1.0, 0);
  upgradeCoil.add(extraCoil);
  upgradeCoil.visible = false;

  // Level 3+ visual upgrade: Twin overhead plasma capacitor stack
  const tier3Stack = new THREE.Group();
  [-0.65, 0.25].forEach((xOff) => {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.85, 10), copperMat);
    cap.position.set(xOff, 2.0, -0.55);
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0x7dd3fc, emissive: 0x0ea5e9, emissiveIntensity: 1.6 }),
    );
    orb.position.set(xOff, 2.52, -0.55);
    tier3Stack.add(cap, orb);
  });
  tier3Stack.visible = false;

  group.add(base, tank, capL, rotor, statusCore, upgradeCoil, tier3Stack);
  tagInteractive(group, 'generator', 'Elektrik Jeneratörü', undefined, [2.7, 2.7, 2.4], 1.3);

  return { group, rotor, statusCore, upgradeCoil, tier3Stack };
}

export function createTrainLogistics(
  textures: ProceduralTextures,
  sharedGifts: SharedGiftMaterials,
): TrainRigRefs {
  const trackGroup = new THREE.Group();
  const railX = 17.6;

  const bed = new THREE.Mesh(
    new THREE.BoxGeometry(2.9, 0.08, 130),
    new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 }),
  );
  bed.position.set(railX, 0.04, 0);
  trackGroup.add(bed);

  // Instanced railway sleepers (69 draw calls -> 1 draw call!)
  const sleeperGeo = new THREE.BoxGeometry(2.3, 0.08, 0.28);
  const sleeperMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.88 });
  const sleeperZs: number[] = [];
  for (let z = -48; z <= 48; z += 1.4) sleeperZs.push(z);
  const sleeperInst = new THREE.InstancedMesh(sleeperGeo, sleeperMat, sleeperZs.length);
  for (let i = 0; i < sleeperZs.length; i++) {
    _dummy.position.set(railX, 0.1, sleeperZs[i]);
    _dummy.rotation.set(0, 0, 0);
    _dummy.scale.setScalar(1);
    _dummy.updateMatrix();
    sleeperInst.setMatrixAt(i, _dummy.matrix);
  }
  sleeperInst.instanceMatrix.needsUpdate = true;
  sleeperInst.computeBoundingSphere();
  trackGroup.add(sleeperInst);

  const railGeo = new THREE.BoxGeometry(0.12, 0.12, 130);
  const railMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.82, roughness: 0.22 });
  const railL = new THREE.Mesh(railGeo, railMat);
  railL.position.set(railX - 0.72, 0.16, 0);
  const railR = new THREE.Mesh(railGeo, railMat);
  railR.position.set(railX + 0.72, 0.16, 0);
  trackGroup.add(railL, railR);

  // North Pole Train Station Platform + Signal Post
  const stationGroup = new THREE.Group();
  stationGroup.position.set(15.2, 0, -4.2);
  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.42, 7.2),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.76 }),
  );
  platform.position.y = 0.21;
  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.22, 7.0),
    new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.48 }),
  );
  canopy.position.y = 2.65;
  const snowTop = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.14, 7.1),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.88 }),
  );
  snowTop.position.y = 2.82;
  [-2.8, 2.8].forEach((pz) => {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 2.4, 8),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.75, roughness: 0.28 }),
    );
    post.position.set(0, 1.4, pz);
    stationGroup.add(post);
  });

  // Railway Signal Semaphore
  const sigPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.09, 3.2, 8),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6 }),
  );
  sigPole.position.set(1.0, 1.6, 3.6);
  const signalBulbMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    emissive: 0x22c55e,
    emissiveIntensity: 1.6,
  });
  const sigBulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), signalBulbMat);
  sigBulb.position.set(1.0, 3.15, 3.6);
  stationGroup.add(platform, canopy, snowTop, sigPole, sigBulb);
  tagInteractive(stationGroup, 'train_station', 'Yılbaşı Kargo Treni İstasyonu', undefined, [3.0, 3.0, 7.2], 1.5);
  trackGroup.add(stationGroup);

  // Santa Express Steam Locomotive + Cargo Wagons
  const trainGroup = new THREE.Group();
  trainGroup.position.set(railX, 0.22, -4.2);

  const redMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.36, metalness: 0.22 });
  const greenMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.45 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85, roughness: 0.2 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.65, roughness: 0.4 });

  // Locomotive
  const locoBase = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.32, 3.6), darkMat);
  locoBase.position.set(0, 0.42, 2.1);
  const boiler = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 2.1, 14), redMat);
  boiler.rotation.x = Math.PI / 2;
  boiler.position.set(0, 1.15, 2.55);
  boiler.castShadow = true;
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.65, 1.45, 1.35), greenMat);
  cab.position.set(0, 1.32, 0.95);
  cab.castShadow = true;
  const cabRoof = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.16, 1.55), goldMat);
  cabRoof.position.set(0, 2.12, 0.95);
  const funnel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.16, 0.72, 10), goldMat);
  funnel.position.set(0, 1.9, 3.25);
  const headlight = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfacc15, emissiveIntensity: 1.8 }),
  );
  headlight.position.set(0, 1.2, 3.65);
  trainGroup.add(locoBase, boiler, cab, cabRoof, funnel, headlight);

  // Cargo Wagon 1
  const carBase = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.25, 3.6), darkMat);
  carBase.position.set(0, 0.42, -2.1);
  const carWallL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.75, 3.5), redMat);
  carWallL.position.set(-0.82, 0.9, -2.1);
  const carWallR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.75, 3.5), redMat);
  carWallR.position.set(0.82, 0.9, -2.1);
  const carFront = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.75, 0.12), redMat);
  carFront.position.set(0, 0.9, -0.35);
  const carBack = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.75, 0.12), redMat);
  carBack.position.set(0, 0.9, -3.85);
  trainGroup.add(carBase, carWallL, carWallR, carFront, carBack);

  // Cargo Wagon 2 (unlocked at Train Level >= 2!)
  const secondWagon = new THREE.Group();
  const w2Base = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.25, 3.4), darkMat);
  w2Base.position.set(0, 0.42, -5.9);
  const w2WallL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.75, 3.3), greenMat);
  w2WallL.position.set(-0.82, 0.9, -5.9);
  const w2WallR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.75, 3.3), greenMat);
  w2WallR.position.set(0.82, 0.9, -5.9);
  const w2Front = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.75, 0.12), greenMat);
  w2Front.position.set(0, 0.9, -4.25);
  const w2Back = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.75, 0.12), greenMat);
  w2Back.position.set(0, 0.9, -7.55);
  secondWagon.add(w2Base, w2WallL, w2WallR, w2Front, w2Back);
  secondWagon.visible = false;
  trainGroup.add(secondWagon);

  const wheels: THREE.Mesh[] = [];
  const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.14, 10);
  wheelGeo.rotateZ(Math.PI / 2);
  [3.1, 2.0, 0.9, -1.0, -2.1, -3.2].forEach((wz) => {
    [-0.86, 0.86].forEach((wx) => {
      const w = new THREE.Mesh(wheelGeo, goldMat);
      w.position.set(wx, 0.32, wz);
      wheels.push(w);
      trainGroup.add(w);
    });
  });

  // Cargo gift slots inside train wagons (24 slots across Wagon 1 & Wagon 2, shared geometries + giftTier material!)
  const cargoVisuals: THREE.Group[] = [];
  const trainBoxGeo = new THREE.BoxGeometry(0.54, 0.42, 0.54);
  const trainRibGeo = new THREE.BoxGeometry(0.56, 0.44, 0.1);
  for (let i = 0; i < 24; i++) {
    const g = new THREE.Group();
    const box = new THREE.Mesh(trainBoxGeo, sharedGifts.regularWrapMat);
    const rib = new THREE.Mesh(trainRibGeo, sharedGifts.ribbonMat);
    g.add(box, rib);
    if (i < 16) {
      const col = i % 2;
      const row = Math.floor((i % 8) / 2);
      const layer = Math.floor(i / 8);
      g.position.set(col === 0 ? -0.38 : 0.38, 0.78 + layer * 0.45, -0.85 - row * 0.75);
      trainGroup.add(g);
    } else {
      const idx2 = i - 16;
      const col = idx2 % 2;
      const row = Math.floor(idx2 / 2);
      g.position.set(col === 0 ? -0.38 : 0.38, 0.78, -4.8 - row * 0.74);
      secondWagon.add(g);
    }
    g.visible = false;
    cargoVisuals.push(g);
  }

  addContactShadow(trainGroup, textures.contactShadow, 2.5, 8.6, 0.01);
  tagInteractive(trainGroup, 'train_station', 'Yılbaşı Kargo Treni', undefined, [2.2, 2.4, 8.2], 1.2);
  trackGroup.add(trainGroup);

  return {
    trackGroup,
    trainGroup,
    wheels,
    cargoVisuals,
    stationGroup,
    secondWagon,
    signalBulbMat,
  };
}

export function createIndoorChristmasTree(textures: ProceduralTextures): TreeRigRefs {
  const group = new THREE.Group();
  group.position.set(-7.6, 0.36, 6.4);

  addContactShadow(group, textures.contactShadow, 3.8, 3.8, 0.02);

  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.42, 0.65, 12),
    new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.45, metalness: 0.12 }),
  );
  pot.position.y = 0.32;
  pot.castShadow = true;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.25, 0.8, 8),
    new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.9 }),
  );
  trunk.position.y = 0.85;
  group.add(pot, trunk);

  const pineMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.78 });
  const tiers: Array<[number, number, number]> = [
    [1.6, 1.6, 1.6],
    [1.3, 1.4, 2.45],
    [1.0, 1.25, 3.25],
    [0.68, 1.05, 3.95],
  ];
  tiers.forEach(([r, h, y]) => {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h, 10), pineMat);
    cone.position.y = y;
    cone.castShadow = true;
    cone.receiveShadow = true;
    group.add(cone);
  });

  const star = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.36, 0),
    new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.3,
      metalness: 0.82,
      roughness: 0.2,
    }),
  );
  star.position.y = 4.68;
  group.add(star);

  const ornaments: THREE.Mesh[] = [];
  const ornamentColors = [0xef4444, 0xfacc15, 0x38bdf8, 0xf472b6];
  const orbGeo = new THREE.SphereGeometry(0.13, 10, 10);
  for (let i = 0; i < 16; i++) {
    const layer = Math.floor(i / 4);
    const angle = i * 2.1 + layer * 0.6;
    const radius = 1.25 - layer * 0.24;
    const y = 1.35 + layer * 0.72;
    const col = ornamentColors[i % ornamentColors.length];
    const orb = new THREE.Mesh(
      orbGeo,
      new THREE.MeshStandardMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: 0.7,
        metalness: 0.6,
        roughness: 0.25,
      }),
    );
    orb.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    ornaments.push(orb);
    group.add(orb);
  }

  const decorGiftColors = [0xdc2626, 0x16a34a, 0xeab308];
  [
    [1.1, 0.22, 0.7],
    [-1.0, 0.2, 0.85],
    [0.5, 0.25, -1.05],
  ].forEach(([gx, gy, gz], idx) => {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.42, 0.45),
      new THREE.MeshStandardMaterial({ color: decorGiftColors[idx], roughness: 0.45 }),
    );
    box.position.set(gx, gy, gz);
    box.rotation.y = idx * 0.6;
    box.castShadow = true;
    group.add(box);
  });

  // Tree Magic Tier 2 Visual: Golden Tinsel Garland Rings
  const magicTier2 = new THREE.Group();
  const tinselMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xd97706,
    emissiveIntensity: 0.4,
    metalness: 0.85,
    roughness: 0.2,
  });
  [
    [1.36, 1.3],
    [1.06, 2.25],
    [0.78, 3.1],
  ].forEach(([rad, ty]) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.045, 6, 20), tinselMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = ty;
    magicTier2.add(ring);
  });
  magicTier2.visible = false;
  group.add(magicTier2);

  // Tree Magic Tier 3 Visual: Extra Golden Gift Stack beneath tree
  const magicTier3 = new THREE.Group();
  [
    [-0.95, 0.28, -0.75],
    [1.25, 0.24, -0.5],
  ].forEach(([gx, gy, gz]) => {
    const gBox = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.48, 0.52), tinselMat);
    gBox.position.set(gx, gy, gz);
    gBox.castShadow = true;
    magicTier3.add(gBox);
  });
  magicTier3.visible = false;
  group.add(magicTier3);

  tagInteractive(group, 'tree', 'Atölye Noel Ağacı', undefined, [2.6, 4.8, 2.6], 2.4);

  return { group, star, ornaments, magicTier2, magicTier3 };
}

export function createSharedElfAssets(): SharedElfAssets {
  return {
    torsoGeo: new THREE.CylinderGeometry(0.17, 0.23, 0.52, 8),
    beltGeo: new THREE.CylinderGeometry(0.21, 0.21, 0.08, 8),
    buckleGeo: new THREE.BoxGeometry(0.1, 0.1, 0.06),
    collarGeo: new THREE.TorusGeometry(0.17, 0.045, 6, 10),
    legGeo: new THREE.BoxGeometry(0.1, 0.22, 0.1),
    bootGeo: new THREE.BoxGeometry(0.12, 0.12, 0.19),
    armGeo: new THREE.BoxGeometry(0.095, 0.34, 0.095),
    headGeo: new THREE.SphereGeometry(0.19, 10, 10),
    earGeo: new THREE.ConeGeometry(0.045, 0.14, 5),
    eyeGeo: new THREE.SphereGeometry(0.025, 6, 6),
    hatBrimGeo: new THREE.TorusGeometry(0.185, 0.048, 6, 12),
    hatConeGeo: new THREE.ConeGeometry(0.175, 0.42, 8),
    pomGeo: new THREE.SphereGeometry(0.055, 7, 7),
    propBoxGeo: new THREE.BoxGeometry(0.24, 0.2, 0.24),
    propRibGeoA: new THREE.BoxGeometry(0.26, 0.21, 0.055),
    propRibGeoB: new THREE.BoxGeometry(0.055, 0.21, 0.26),
    tunicMats: [
      new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.65 }),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.62 }),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.62 }),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.65 }),
    ],
    hatMats: [
      new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.55 }),
      new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.55 }),
    ],
    skinMat: new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.6 }),
    bootMat: new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.78 }),
    trimMat: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.72 }),
    goldMat: new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.75, roughness: 0.25 }),
    eyeMat: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35 }),
  };
}

export interface ElfWorkerOptions {
  minX: number;
  maxX: number;
  laneZ: number;
  phase: number;
  speed: number;
  variant: number;
  carriesGift: boolean;
}

export function createElfWorker(
  assets: SharedElfAssets,
  sharedGifts: SharedGiftMaterials,
  options: ElfWorkerOptions,
): ElfWorkerRig {
  const group = new THREE.Group();
  group.position.set((options.minX + options.maxX) * 0.5, 0, options.laneZ);

  const tunicMat = assets.tunicMats[options.variant % assets.tunicMats.length];
  const hatMat = assets.hatMats[options.variant % assets.hatMats.length];

  // Articulated Hip-Pivoted Legs (boot soles grounded at y = 0.00)
  const legL = new THREE.Group();
  legL.position.set(-0.085, 0.3, 0);
  const legMeshL = new THREE.Mesh(assets.legGeo, assets.bootMat);
  legMeshL.position.set(0, -0.1, 0);
  const bootL = new THREE.Mesh(assets.bootGeo, assets.bootMat);
  bootL.position.set(0, -0.24, 0.03);
  legL.add(legMeshL, bootL);

  const legR = new THREE.Group();
  legR.position.set(0.085, 0.3, 0);
  const legMeshR = new THREE.Mesh(assets.legGeo, assets.bootMat);
  legMeshR.position.set(0, -0.1, 0);
  const bootR = new THREE.Mesh(assets.bootGeo, assets.bootMat);
  bootR.position.set(0, -0.24, 0.03);
  legR.add(legMeshR, bootR);

  // Upper body group for vertical stride bounce
  const bodyGroup = new THREE.Group();

  const torso = new THREE.Mesh(assets.torsoGeo, tunicMat);
  torso.position.y = 0.55;
  torso.castShadow = true;

  const collar = new THREE.Mesh(assets.collarGeo, assets.trimMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.8;

  const belt = new THREE.Mesh(assets.beltGeo, assets.bootMat);
  belt.position.y = 0.42;
  const buckle = new THREE.Mesh(assets.buckleGeo, assets.goldMat);
  buckle.position.set(0, 0.42, 0.2);

  // Shoulder-Pivoted Arms (+Z forward)
  const armL = new THREE.Group();
  armL.position.set(-0.22, 0.72, 0.02);
  const armMeshL = new THREE.Mesh(assets.armGeo, tunicMat);
  armMeshL.position.set(0, -0.15, 0.02);
  armL.add(armMeshL);

  const armR = new THREE.Group();
  armR.position.set(0.22, 0.72, 0.02);
  const armMeshR = new THREE.Mesh(assets.armGeo, tunicMat);
  armMeshR.position.set(0, -0.15, 0.02);
  armR.add(armMeshR);

  // Head + Pointed Elf Ears + Festive Hat (+Z forward)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.96, 0);

  const head = new THREE.Mesh(assets.headGeo, assets.skinMat);
  head.castShadow = true;

  const earL = new THREE.Mesh(assets.earGeo, assets.skinMat);
  earL.position.set(-0.2, 0.01, -0.02);
  earL.rotation.z = Math.PI / 2.6;
  const earR = new THREE.Mesh(assets.earGeo, assets.skinMat);
  earR.position.set(0.2, 0.01, -0.02);
  earR.rotation.z = -Math.PI / 2.6;

  const eyeL = new THREE.Mesh(assets.eyeGeo, assets.eyeMat);
  eyeL.position.set(-0.065, 0.02, 0.175);
  const eyeR = new THREE.Mesh(assets.eyeGeo, assets.eyeMat);
  eyeR.position.set(0.065, 0.02, 0.175);

  const hatBrim = new THREE.Mesh(assets.hatBrimGeo, assets.trimMat);
  hatBrim.rotation.x = Math.PI / 2;
  hatBrim.position.y = 0.14;

  const hatCone = new THREE.Mesh(assets.hatConeGeo, hatMat);
  hatCone.position.set(0, 0.35, -0.02);
  hatCone.rotation.x = -0.12;

  const pom = new THREE.Mesh(assets.pomGeo, assets.trimMat);
  pom.position.set(0, 0.56, -0.05);

  headGroup.add(head, earL, earR, eyeL, eyeR, hatBrim, hatCone, pom);

  // Optional carried gift parcel held in front
  const propBox = new THREE.Group();
  propBox.position.set(0, 0.56, 0.28);
  const pBox = new THREE.Mesh(assets.propBoxGeo, sharedGifts.regularWrapMat);
  const pRibA = new THREE.Mesh(assets.propRibGeoA, sharedGifts.ribbonMat);
  const pRibB = new THREE.Mesh(assets.propRibGeoB, sharedGifts.ribbonMat);
  propBox.add(pBox, pRibA, pRibB);
  propBox.visible = options.carriesGift;

  bodyGroup.add(torso, collar, belt, buckle, armL, armR, headGroup, propBox);
  group.add(legL, legR, bodyGroup);
  group.visible = false;

  return {
    group,
    bodyGroup,
    armL,
    armR,
    legL,
    legR,
    headGroup,
    propBox,
    minX: options.minX,
    maxX: options.maxX,
    laneZ: options.laneZ,
    phase: options.phase,
    speed: options.speed,
    carriesGift: options.carriesGift,
  };
}

export function createProductionLineRig(
  lineId: LineId,
  yBase: number,
  zPos: number,
  themeColor: number,
  textures: ProceduralTextures,
  sharedGifts: SharedGiftMaterials,
  elfAssets: SharedElfAssets,
): MachineRigRefs {
  const root = new THREE.Group();
  root.position.set(0, yBase, zPos);

  const accentGoldMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.85,
    roughness: 0.2,
  });
  const darkSteelMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.68,
    roughness: 0.36,
  });
  const bodyPaintMat = new THREE.MeshStandardMaterial({
    color: themeColor,
    metalness: 0.24,
    roughness: 0.42,
  });
  const creamTrimMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.45,
    metalness: 0.12,
  });

  // Conveyor Belt Track + Side Speed LEDs
  const beltMat = new THREE.MeshStandardMaterial({
    map: textures.belt.clone(),
    roughness: 0.78,
    metalness: 0.08,
  });
  beltMat.map!.needsUpdate = true;

  const beltFrame = new THREE.Mesh(new THREE.BoxGeometry(12.6, 0.22, 1.22), darkSteelMat);
  beltFrame.position.set(0.7, 0.68, 0);
  beltFrame.castShadow = true;
  beltFrame.receiveShadow = true;
  root.add(beltFrame);

  const beltSurface = new THREE.Mesh(new THREE.BoxGeometry(12.4, 0.06, 0.96), beltMat);
  beltSurface.position.set(0.7, 0.81, 0);
  beltSurface.receiveShadow = true;
  root.add(beltSurface);

  const railGeo = new THREE.BoxGeometry(12.4, 0.14, 0.07);
  const railN = new THREE.Mesh(railGeo, accentGoldMat);
  railN.position.set(0.7, 0.88, -0.54);
  const railS = new THREE.Mesh(railGeo, accentGoldMat);
  railS.position.set(0.7, 0.88, 0.54);
  root.add(railN, railS);

  // Speed LED Indicators along front belt rail (shared ledOffMat/ledOnMat)
  const speedLeds: THREE.Mesh[] = [];
  const ledGeo = new THREE.BoxGeometry(0.28, 0.08, 0.06);
  [-4.0, -2.5, 0.5, 2.0, 5.2].forEach((lx) => {
    const led = new THREE.Mesh(ledGeo, sharedGifts.ledOffMat);
    led.position.set(lx, 0.72, 0.62);
    speedLeds.push(led);
    root.add(led);
  });

  const legGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.65, 8);
  [-5.0, -2.5, 0.5, 3.0, 6.2].forEach((lx) => {
    const legA = new THREE.Mesh(legGeo, darkSteelMat);
    legA.position.set(lx, 0.32, -0.45);
    const legB = new THREE.Mesh(legGeo, darkSteelMat);
    legB.position.set(lx, 0.32, 0.45);
    root.add(legA, legB);
  });

  const rollers: THREE.Mesh[] = [];
  const rollerGeo = new THREE.CylinderGeometry(0.14, 0.14, 1.04, 10);
  rollerGeo.rotateX(Math.PI / 2);
  [-5.55, 6.95].forEach((rx) => {
    const r = new THREE.Mesh(rollerGeo, accentGoldMat);
    r.position.set(rx, 0.72, 0);
    rollers.push(r);
    root.add(r);
  });

  // TOY MAKER MACHINE (X = -6.5)
  const tmGroup = new THREE.Group();
  tmGroup.position.set(-6.5, 0, 0);
  addContactShadow(tmGroup, textures.contactShadow, 2.8, 2.5, 0.01);

  const tmBase = new THREE.Mesh(new THREE.BoxGeometry(2.15, 1.1, 1.95), darkSteelMat);
  tmBase.position.y = 0.55;
  tmBase.castShadow = true;
  tmBase.receiveShadow = true;

  const tmBody = new THREE.Mesh(new THREE.BoxGeometry(1.85, 1.35, 1.68), bodyPaintMat);
  tmBody.position.y = 1.65;
  tmBody.castShadow = true;

  // Brass pressure gauge on front
  const gaugeRing = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 12), accentGoldMat);
  gaugeRing.rotation.x = Math.PI / 2;
  gaugeRing.position.set(-0.45, 1.95, 0.86);
  const gaugeFace = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 0.09, 12),
    creamTrimMat,
  );
  gaugeFace.rotation.x = Math.PI / 2;
  gaugeFace.position.set(-0.45, 1.95, 0.87);

  const tmHopper = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.36, 0.7, 8), accentGoldMat);
  tmHopper.position.set(-0.25, 2.65, 0);
  tmHopper.castShadow = true;

  const tmChimney = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.95, 8), darkSteelMat);
  tmChimney.position.set(0.5, 2.75, -0.45);
  tmChimney.castShadow = true;

  const tmChimneyRim = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 6, 12), accentGoldMat);
  tmChimneyRim.rotation.x = Math.PI / 2;
  tmChimneyRim.position.set(0.5, 3.22, -0.45);

  const tmPiston = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.85, 10), creamTrimMat);
  tmPiston.position.set(0.65, 1.55, 0);

  const gears: THREE.Mesh[] = [];
  const gearGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.14, 10);
  gearGeo.rotateX(Math.PI / 2);
  [
    [-0.35, 1.5, 0.88],
    [0.28, 1.18, 0.88],
  ].forEach(([gx, gy, gz]) => {
    const gear = new THREE.Mesh(gearGeo, accentGoldMat);
    gear.position.set(gx, gy, gz);
    gears.push(gear);
    tmGroup.add(gear);
  });

  const tmBeacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 10, 10),
    new THREE.MeshStandardMaterial({
      color: 0x4ade80,
      emissive: 0x22c55e,
      emissiveIntensity: 1.5,
      roughness: 0.2,
    }),
  );
  tmBeacon.position.set(-0.65, 2.45, 0.65);

  // Level >= 2 upgrade crown
  const upgradeCrown = new THREE.Group();
  const crownRing = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.06, 6, 16), accentGoldMat);
  crownRing.rotation.x = Math.PI / 2;
  crownRing.position.set(-0.25, 2.98, 0);
  upgradeCrown.add(crownRing);
  upgradeCrown.visible = false;

  // Level >= 3 dual turbo copper exhaust
  const turboStack = new THREE.Group();
  const pipe2 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 1.1, 8), accentGoldMat);
  pipe2.position.set(0.5, 2.85, 0.45);
  turboStack.add(pipe2);
  turboStack.visible = false;

  tmGroup.add(
    tmBase,
    tmBody,
    gaugeRing,
    gaugeFace,
    tmHopper,
    tmChimney,
    tmChimneyRim,
    tmPiston,
    tmBeacon,
    upgradeCrown,
    turboStack,
  );
  tagInteractive(tmGroup, 'toy_maker', 'Oyuncak Üretim Makinesi', lineId, [2.3, 3.2, 2.1], 1.6);
  root.add(tmGroup);

  // GIFT WRAPPER MACHINE (X = -1.0)
  const wrGroup = new THREE.Group();
  wrGroup.position.set(-1.0, 0, 0);
  addContactShadow(wrGroup, textures.contactShadow, 2.2, 2.4, 0.01);

  const wrPillarN = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.1, 0.34), bodyPaintMat);
  wrPillarN.position.set(0, 1.05, -0.78);
  wrPillarN.castShadow = true;

  const wrPillarS = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.1, 0.34), bodyPaintMat);
  wrPillarS.position.set(0, 1.05, 0.78);
  wrPillarS.castShadow = true;

  const wrRoof = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.45, 2.0), darkSteelMat);
  wrRoof.position.set(0, 2.28, 0);
  wrRoof.castShadow = true;

  const wrChute = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.5, 0.75), creamTrimMat);
  wrChute.position.set(0, 2.7, 0);

  // Spinning Wrapping Paper Roll on top (reflects active Gift Tier color!)
  const paperRoll = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.24, 1.1, 10),
    sharedGifts.regularWrapMat,
  );
  paperRoll.rotation.x = Math.PI / 2;
  paperRoll.position.set(-0.55, 2.68, 0);

  const wrPressHead = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.24, 0.72), accentGoldMat);
  wrPressHead.position.set(0, 1.85, 0);

  const wrArmN = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 0.42), accentGoldMat);
  wrArmN.position.set(0, 1.05, -0.48);

  const wrArmS = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 0.42), accentGoldMat);
  wrArmS.position.set(0, 1.05, 0.48);

  const wrBeacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 10, 10),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 1.4,
      roughness: 0.2,
    }),
  );
  wrBeacon.position.set(0.55, 2.58, 0.75);

  wrGroup.add(
    wrPillarN,
    wrPillarS,
    wrRoof,
    wrChute,
    paperRoll,
    wrPressHead,
    wrArmN,
    wrArmS,
    wrBeacon,
  );
  tagInteractive(wrGroup, 'wrapper', 'Hediye Paketleme Makinesi', lineId, [1.8, 2.8, 2.1], 1.4);
  root.add(wrGroup);

  // RIBBON & ORNAMENT STATION (X = +3.5)
  const rbGroup = new THREE.Group();
  rbGroup.position.set(3.5, 0, 0);
  addContactShadow(rbGroup, textures.contactShadow, 2.1, 2.3, 0.01);

  const rbPillarN = new THREE.Mesh(new THREE.BoxGeometry(1.15, 2.0, 0.32), darkSteelMat);
  rbPillarN.position.set(0, 1.0, -0.76);
  rbPillarN.castShadow = true;

  const rbPillarS = new THREE.Mesh(new THREE.BoxGeometry(1.15, 2.0, 0.32), darkSteelMat);
  rbPillarS.position.set(0, 1.0, 0.76);
  rbPillarS.castShadow = true;

  const rbTop = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.38, 1.9), bodyPaintMat);
  rbTop.position.set(0, 2.18, 0);
  rbTop.castShadow = true;

  const spool = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.68, 12), accentGoldMat);
  spool.rotation.x = Math.PI / 2;
  spool.position.set(0, 2.75, 0);
  spool.castShadow = true;

  const stamper = new THREE.Group();
  stamper.position.set(0, 1.75, 0);
  const stampRod = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.55, 8), creamTrimMat);
  stampRod.position.y = 0.22;
  const stampPad = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.12, 10), accentGoldMat);
  stamper.add(stampRod, stampPad);

  const rbBeacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 10, 10),
    new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xeab308,
      emissiveIntensity: 1.5,
      roughness: 0.2,
    }),
  );
  rbBeacon.position.set(0.5, 2.44, 0.75);

  // Golden Chance Alchemist Star mounted on top when goldenChance >= 2
  const goldenBeacon = new THREE.Group();
  const gStar = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.28, 0),
    new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.5,
      metalness: 0.85,
      roughness: 0.15,
    }),
  );
  gStar.position.set(0, 3.45, 0);
  goldenBeacon.add(gStar);
  goldenBeacon.visible = false;

  rbGroup.add(rbPillarN, rbPillarS, rbTop, spool, stamper, rbBeacon, goldenBeacon);
  tagInteractive(rbGroup, 'ribboner', 'Kurdele & Süs Makinesi', lineId, [1.7, 2.9, 2.0], 1.45);
  root.add(rbGroup);

  // 6 Conveyor-Patrolling Elf Workers (2 visible per hired worker tier for rich density!)
  const workers: ElfWorkerRig[] = [
    createElfWorker(elfAssets, sharedGifts, {
      minX: -5.1,
      maxX: 6.2,
      laneZ: 1.16,
      phase: 0.06,
      speed: 0.082,
      variant: 0,
      carriesGift: false,
    }),
    createElfWorker(elfAssets, sharedGifts, {
      minX: -5.1,
      maxX: 6.2,
      laneZ: -1.16,
      phase: 0.54,
      speed: 0.088,
      variant: 1,
      carriesGift: true,
    }),
    createElfWorker(elfAssets, sharedGifts, {
      minX: -4.8,
      maxX: 2.5,
      laneZ: 1.32,
      phase: 0.32,
      speed: 0.102,
      variant: 2,
      carriesGift: true,
    }),
    createElfWorker(elfAssets, sharedGifts, {
      minX: -2.0,
      maxX: 6.3,
      laneZ: -1.32,
      phase: 0.78,
      speed: 0.098,
      variant: 3,
      carriesGift: false,
    }),
    createElfWorker(elfAssets, sharedGifts, {
      minX: 0.1,
      maxX: 6.4,
      laneZ: 1.1,
      phase: 0.18,
      speed: 0.114,
      variant: 1,
      carriesGift: false,
    }),
    createElfWorker(elfAssets, sharedGifts, {
      minX: -5.2,
      maxX: 1.8,
      laneZ: -1.1,
      phase: 0.68,
      speed: 0.108,
      variant: 0,
      carriesGift: true,
    }),
  ];
  workers.forEach((w) => root.add(w.group));

  // Locked overlay
  const lockedOverlay = new THREE.Group();
  const coneMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.45 });
  const coneBaseMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });
  [-4.5, 0, 4.5].forEach((cx) => {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.7, 8), coneMat);
    cone.position.set(cx, 1.25, 0);
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.08, 0.56), coneBaseMat);
    base.position.set(cx, 0.9, 0);
    lockedOverlay.add(cone, base);
  });
  const barrierTape = new THREE.Mesh(
    new THREE.BoxGeometry(12.2, 0.14, 0.08),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 }),
  );
  barrierTape.position.set(0.5, 1.4, 0);
  lockedOverlay.add(barrierTape);
  root.add(lockedOverlay);

  return {
    lineId,
    root,
    beltMat,
    rollers,
    speedLeds,
    toyMaker: {
      group: tmGroup,
      piston: tmPiston,
      gears,
      beacon: tmBeacon,
      upgradeCrown,
      turboStack,
    },
    wrapper: {
      group: wrGroup,
      leftArm: wrArmN,
      rightArm: wrArmS,
      pressHead: wrPressHead,
      paperRoll,
      beacon: wrBeacon,
    },
    ribboner: {
      group: rbGroup,
      spool,
      stamper,
      beacon: rbBeacon,
      goldenBeacon,
    },
    workers,
    lockedOverlay,
  };
}

export function createStorageBay(
  textures: ProceduralTextures,
  sharedGifts: SharedGiftMaterials,
): StorageBayRefs {
  const group = new THREE.Group();
  group.position.set(7.9, 0.36, -0.2);

  addContactShadow(group, textures.contactShadow, 2.6, 9.6, 0.01);

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.22 });
  const postGeo = new THREE.BoxGeometry(0.16, 3.4, 0.16);

  [-4.4, -1.5, 1.5, 4.4].forEach((pz) => {
    [-0.8, 0.8].forEach((px) => {
      const post = new THREE.Mesh(postGeo, woodMat);
      post.position.set(px, 1.7, pz);
      post.castShadow = true;
      group.add(post);
    });
  });

  const shelfGeo = new THREE.BoxGeometry(1.75, 0.1, 9.0);
  const trimGeo = new THREE.BoxGeometry(0.06, 0.12, 9.02);

  [0.55, 1.45].forEach((sy) => {
    const shelf = new THREE.Mesh(shelfGeo, woodMat);
    shelf.position.set(0, sy, 0);
    shelf.receiveShadow = true;
    const trim = new THREE.Mesh(trimGeo, brassMat);
    trim.position.set(-0.88, sy, 0);
    group.add(shelf, trim);
  });

  // Tier 3 shelf (upgrades.storageCapacity >= 2)
  const extraRack = new THREE.Group();
  const topShelf = new THREE.Mesh(shelfGeo, woodMat);
  topShelf.position.set(0, 2.35, 0);
  const topTrim = new THREE.Mesh(trimGeo, brassMat);
  topTrim.position.set(-0.88, 2.35, 0);
  extraRack.add(topShelf, topTrim);
  extraRack.visible = false;
  group.add(extraRack);

  // Tier 4 Mega Rack (upgrades.storageCapacity >= 3)
  const megaRack = new THREE.Group();
  const megaShelf = new THREE.Mesh(shelfGeo, brassMat);
  megaShelf.position.set(0, 3.25, 0);
  megaRack.add(megaShelf);
  megaRack.visible = false;
  group.add(megaRack);

  // 48 Physical Gift Box Slots across 4 tiers (shared regular/gold materials!)
  const slots: THREE.Group[] = [];
  const slotBoxes: THREE.Mesh[] = [];
  const boxGeo = new THREE.BoxGeometry(0.56, 0.48, 0.56);
  const ribGeoA = new THREE.BoxGeometry(0.59, 0.5, 0.1);
  const ribGeoB = new THREE.BoxGeometry(0.1, 0.5, 0.59);

  const shelfHeights = [0.84, 1.74, 2.64, 3.54];
  for (let sh = 0; sh < 4; sh++) {
    for (let row = 0; row < 12; row++) {
      const slot = new THREE.Group();
      const box = new THREE.Mesh(boxGeo, sharedGifts.regularWrapMat);
      const ribA = new THREE.Mesh(ribGeoA, sharedGifts.ribbonMat);
      const ribB = new THREE.Mesh(ribGeoB, sharedGifts.ribbonMat);
      slot.add(box, ribA, ribB);

      const zPos = -3.9 + row * 0.71;
      const xOff = row % 2 === 0 ? -0.25 : 0.25;
      slot.position.set(xOff, shelfHeights[sh], zPos);
      slot.visible = false;
      slots.push(slot);
      slotBoxes.push(box);
      group.add(slot);
    }
  }

  tagInteractive(group, 'storage', 'Hediye Depolama Alanı', undefined, [2.2, 3.6, 9.2], 1.8);

  return { group, slots, slotBoxes, extraRack, megaRack };
}

export function createDeliveryTruck(
  textures: ProceduralTextures,
  sharedGifts: SharedGiftMaterials,
): TruckRigRefs {
  const group = new THREE.Group();
  group.position.set(12.6, 0.04, 1.5);

  addContactShadow(group, textures.contactShadow, 3.2, 6.2, 0.02);

  const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35, metalness: 0.18 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.82, roughness: 0.22 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.12, metalness: 0.2 });
  const woodBedMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.78 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.35, 4.9), tireMat);
  chassis.position.set(0, 0.55, 0);
  chassis.castShadow = true;
  group.add(chassis);

  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.05, 1.5, 1.65), redMat);
  cab.position.set(0, 1.4, 1.45);
  cab.castShadow = true;
  const cabRoof = new THREE.Mesh(
    new THREE.BoxGeometry(2.15, 0.18, 1.75),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.85 }),
  );
  cabRoof.position.set(0, 2.22, 1.45);
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.72, 0.12), glassMat);
  windshield.position.set(0, 1.62, 2.25);
  const grille = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.12), goldMat);
  grille.position.set(0, 1.0, 2.26);
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.24, 0.25), goldMat);
  bumper.position.set(0, 0.6, 2.42);
  group.add(cab, cabRoof, windshield, grille, bumper);

  // Fleet Upgrade Visual Kit (truckFleet >= 2): Golden roof lightbar + snow plow!
  const fleetUpgradeKit = new THREE.Group();
  const lightBar = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.16, 0.32), goldMat);
  lightBar.position.set(0, 2.38, 1.5);
  const plow = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.45, 0.22), goldMat);
  plow.position.set(0, 0.42, 2.58);
  plow.rotation.x = -0.25;
  fleetUpgradeKit.add(lightBar, plow);
  fleetUpgradeKit.visible = false;
  group.add(fleetUpgradeKit);

  const headlights: THREE.Mesh[] = [];
  const hlMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfacc15,
    emissiveIntensity: 1.6,
    roughness: 0.2,
  });
  const hlGeo = new THREE.SphereGeometry(0.14, 8, 8);
  [-0.72, 0.72].forEach((hx) => {
    const hl = new THREE.Mesh(hlGeo, hlMat);
    hl.position.set(hx, 1.0, 2.28);
    headlights.push(hl);
    group.add(hl);
  });

  const bedFloor = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.16, 2.9), woodBedMat);
  bedFloor.position.set(0, 0.8, -0.9);
  const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.85, 2.9), redMat);
  sideL.position.set(-0.98, 1.25, -0.9);
  const sideR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.85, 2.9), redMat);
  sideR.position.set(0.98, 1.25, -0.9);
  const tailgate = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.85, 0.14), redMat);
  tailgate.position.set(0, 1.25, -2.32);
  const frontWall = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.85, 0.14), redMat);
  frontWall.position.set(0, 1.25, 0.5);
  group.add(bedFloor, sideL, sideR, tailgate, frontWall);

  const wheels: THREE.Mesh[] = [];
  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  const hubGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.34, 8);
  hubGeo.rotateZ(Math.PI / 2);

  [
    [-1.08, 0.42, 1.5],
    [1.08, 0.42, 1.5],
    [-1.08, 0.42, -1.45],
    [1.08, 0.42, -1.45],
  ].forEach(([wx, wy, wz]) => {
    const w = new THREE.Mesh(wheelGeo, tireMat);
    w.position.set(wx, wy, wz);
    w.castShadow = true;
    const hub = new THREE.Mesh(hubGeo, goldMat);
    w.add(hub);
    wheels.push(w);
    group.add(w);
  });

  const cargoVisuals: THREE.Group[] = [];
  const truckBoxGeo = new THREE.BoxGeometry(0.54, 0.44, 0.54);
  const truckRibGeo = new THREE.BoxGeometry(0.56, 0.46, 0.1);
  for (let i = 0; i < 12; i++) {
    const g = new THREE.Group();
    const box = new THREE.Mesh(truckBoxGeo, sharedGifts.regularWrapMat);
    const rib = new THREE.Mesh(truckRibGeo, sharedGifts.ribbonMat);
    g.add(box, rib);
    const col = i % 2;
    const row = Math.floor((i % 6) / 2);
    const layer = Math.floor(i / 6);
    g.position.set(col === 0 ? -0.4 : 0.4, 1.12 + layer * 0.48, -0.1 - row * 0.72);
    g.visible = false;
    cargoVisuals.push(g);
    group.add(g);
  }

  tagInteractive(group, 'truck', 'Noel Baba Teslimat Kamyonu', undefined, [2.6, 2.5, 5.4], 1.3);

  return { group, wheels, cargoVisuals, headlights, fleetUpgradeKit };
}

export interface ItemVisualGroup extends THREE.Group {
  toyMesh: THREE.Group;
  boxMesh: THREE.Group;
  ribbonMesh: THREE.Group;
  goldenHalo: THREE.Mesh | null;
  glowShell: THREE.Mesh;
  glowRing: THREE.Mesh;
  glowMat: THREE.MeshBasicMaterial;
  lastStage: ItemStage | null;
  glowTimer: number;
  glowDuration: number;
  glowColor: number;
  popTimer: number;
  poolKey: string;
}

export interface SharedItemAssets {
  sharedGifts: SharedGiftMaterials;
  trainBodyGeo: THREE.BoxGeometry;
  trainCabGeo: THREE.BoxGeometry;
  trainFunnelGeo: THREE.CylinderGeometry;
  trainRedMat: THREE.MeshStandardMaterial;
  trainGreenMat: THREE.MeshStandardMaterial;
  goldMetalMat: THREE.MeshStandardMaterial;
  carChassisGeo: THREE.BoxGeometry;
  carRoofGeo: THREE.BoxGeometry;
  carWheelGeo: THREE.CylinderGeometry;
  carBlueMat: THREE.MeshStandardMaterial;
  carGlassMat: THREE.MeshStandardMaterial;
  darkTireMat: THREE.MeshStandardMaterial;
  bearBodyGeo: THREE.SphereGeometry;
  bearHeadGeo: THREE.SphereGeometry;
  bearEarGeo: THREE.SphereGeometry;
  bearMat: THREE.MeshStandardMaterial;
  bearSnoutMat: THREE.MeshStandardMaterial;
  botTorsoGeo: THREE.BoxGeometry;
  botHeadGeo: THREE.BoxGeometry;
  botVisorGeo: THREE.BoxGeometry;
  botAntGeo: THREE.CylinderGeometry;
  botMat: THREE.MeshStandardMaterial;
  botVisorMat: THREE.MeshStandardMaterial;
  dollDressGeo: THREE.ConeGeometry;
  dollHeadGeo: THREE.SphereGeometry;
  dollHairGeo: THREE.SphereGeometry;
  dollDressMat: THREE.MeshStandardMaterial;
  dollSkinMat: THREE.MeshStandardMaterial;
  dollHairMat: THREE.MeshStandardMaterial;
  globeBaseGeo: THREE.CylinderGeometry;
  globeGlassGeo: THREE.SphereGeometry;
  globeTreeGeo: THREE.ConeGeometry;
  globeSnowGeo: THREE.CylinderGeometry;
  globeWoodMat: THREE.MeshStandardMaterial;
  globeGlassMat: THREE.MeshStandardMaterial;
  snowWhiteMat: THREE.MeshStandardMaterial;
  nutTorsoGeo: THREE.BoxGeometry;
  nutHatGeo: THREE.CylinderGeometry;
  nutBeardGeo: THREE.ConeGeometry;
  nutTrimGeo: THREE.BoxGeometry;
  rocketBodyGeo: THREE.CylinderGeometry;
  rocketNoseGeo: THREE.ConeGeometry;
  rocketFinGeo: THREE.BoxGeometry;
  rocketFlameGeo: THREE.ConeGeometry;
  rocketFlameMat: THREE.MeshStandardMaterial;
  sleighHullGeo: THREE.BoxGeometry;
  sleighBackGeo: THREE.BoxGeometry;
  sleighRunnerGeo: THREE.BoxGeometry;
  boxGeo: THREE.BoxGeometry;
  lidGeo: THREE.BoxGeometry;
  strapAGeo: THREE.BoxGeometry;
  strapBGeo: THREE.BoxGeometry;
  bowGeo: THREE.TorusGeometry;
  haloGeo: THREE.TorusGeometry;
  haloMat: THREE.MeshBasicMaterial;
  glowShellGeo: THREE.BoxGeometry;
  glowRingGeo: THREE.RingGeometry;
}

export function createSharedItemAssets(sharedGifts: SharedGiftMaterials): SharedItemAssets {
  const carWheelGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.05, 8);
  carWheelGeo.rotateX(Math.PI / 2);

  const glowRingGeo = new THREE.RingGeometry(0.26, 0.46, 18);
  glowRingGeo.rotateX(-Math.PI / 2);

  return {
    sharedGifts,
    trainBodyGeo: new THREE.BoxGeometry(0.36, 0.2, 0.22),
    trainCabGeo: new THREE.BoxGeometry(0.16, 0.16, 0.2),
    trainFunnelGeo: new THREE.CylinderGeometry(0.05, 0.04, 0.14, 8),
    trainRedMat: new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.42 }),
    trainGreenMat: new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.45 }),
    goldMetalMat: new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.7, roughness: 0.25 }),
    carChassisGeo: new THREE.BoxGeometry(0.42, 0.14, 0.24),
    carRoofGeo: new THREE.BoxGeometry(0.22, 0.12, 0.2),
    carWheelGeo,
    carBlueMat: new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35, metalness: 0.2 }),
    carGlassMat: new THREE.MeshStandardMaterial({ color: 0xbae6fd, roughness: 0.2 }),
    darkTireMat: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 }),
    bearBodyGeo: new THREE.SphereGeometry(0.16, 8, 8),
    bearHeadGeo: new THREE.SphereGeometry(0.13, 8, 8),
    bearEarGeo: new THREE.SphereGeometry(0.05, 7, 7),
    bearMat: new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85 }),
    bearSnoutMat: new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.75 }),
    botTorsoGeo: new THREE.BoxGeometry(0.24, 0.26, 0.18),
    botHeadGeo: new THREE.BoxGeometry(0.18, 0.15, 0.16),
    botVisorGeo: new THREE.BoxGeometry(0.14, 0.05, 0.04),
    botAntGeo: new THREE.CylinderGeometry(0.015, 0.015, 0.1, 6),
    botMat: new THREE.MeshStandardMaterial({ color: 0x0ea5e9, metalness: 0.65, roughness: 0.25 }),
    botVisorMat: new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfacc15,
      emissiveIntensity: 1.2,
    }),
    dollDressGeo: new THREE.ConeGeometry(0.17, 0.3, 8),
    dollHeadGeo: new THREE.SphereGeometry(0.11, 8, 8),
    dollHairGeo: new THREE.SphereGeometry(0.115, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.6),
    dollDressMat: new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.55 }),
    dollSkinMat: new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.6 }),
    dollHairMat: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 }),
    globeBaseGeo: new THREE.CylinderGeometry(0.16, 0.19, 0.1, 10),
    globeGlassGeo: new THREE.SphereGeometry(0.18, 12, 10),
    globeTreeGeo: new THREE.ConeGeometry(0.08, 0.18, 7),
    globeSnowGeo: new THREE.CylinderGeometry(0.14, 0.14, 0.04, 10),
    globeWoodMat: new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.65 }),
    globeGlassMat: new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      roughness: 0.12,
      metalness: 0.15,
      transparent: true,
      opacity: 0.48,
    }),
    snowWhiteMat: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 }),
    nutTorsoGeo: new THREE.BoxGeometry(0.2, 0.22, 0.16),
    nutHatGeo: new THREE.CylinderGeometry(0.1, 0.11, 0.18, 10),
    nutBeardGeo: new THREE.ConeGeometry(0.06, 0.1, 6),
    nutTrimGeo: new THREE.BoxGeometry(0.22, 0.05, 0.17),
    rocketBodyGeo: new THREE.CylinderGeometry(0.09, 0.12, 0.32, 10),
    rocketNoseGeo: new THREE.ConeGeometry(0.09, 0.15, 10),
    rocketFinGeo: new THREE.BoxGeometry(0.28, 0.11, 0.04),
    rocketFlameGeo: new THREE.ConeGeometry(0.07, 0.11, 8),
    rocketFlameMat: new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xea580c,
      emissiveIntensity: 1.4,
    }),
    sleighHullGeo: new THREE.BoxGeometry(0.36, 0.14, 0.24),
    sleighBackGeo: new THREE.BoxGeometry(0.09, 0.18, 0.24),
    sleighRunnerGeo: new THREE.BoxGeometry(0.44, 0.04, 0.04),
    boxGeo: new THREE.BoxGeometry(0.5, 0.44, 0.5),
    lidGeo: new THREE.BoxGeometry(0.54, 0.1, 0.54),
    strapAGeo: new THREE.BoxGeometry(0.55, 0.48, 0.1),
    strapBGeo: new THREE.BoxGeometry(0.1, 0.48, 0.55),
    bowGeo: new THREE.TorusGeometry(0.1, 0.035, 6, 8),
    haloGeo: new THREE.TorusGeometry(0.42, 0.035, 6, 14),
    haloMat: new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.85 }),
    glowShellGeo: new THREE.BoxGeometry(0.62, 0.54, 0.62),
    glowRingGeo,
  };
}

export function createItemVisual(
  toyType: ToyType,
  isGolden: boolean,
  assets: SharedItemAssets,
): ItemVisualGroup {
  const root = new THREE.Group() as ItemVisualGroup;
  root.goldenHalo = null;
  root.poolKey = `${toyType}_${isGolden ? 1 : 0}`;

  const toyMesh = new THREE.Group();

  if (toyType === 'train') {
    const body = new THREE.Mesh(assets.trainBodyGeo, assets.trainRedMat);
    body.position.y = 0.14;
    const cabin = new THREE.Mesh(assets.trainCabGeo, assets.trainGreenMat);
    cabin.position.set(-0.09, 0.28, 0);
    const funnel = new THREE.Mesh(assets.trainFunnelGeo, assets.goldMetalMat);
    funnel.position.set(0.1, 0.28, 0);
    toyMesh.add(body, cabin, funnel);
  } else if (toyType === 'car') {
    const chassis = new THREE.Mesh(assets.carChassisGeo, assets.carBlueMat);
    chassis.position.y = 0.12;
    const roof = new THREE.Mesh(assets.carRoofGeo, assets.carGlassMat);
    roof.position.set(-0.02, 0.24, 0);
    [
      [-0.12, 0.06, 0.13],
      [0.12, 0.06, 0.13],
      [-0.12, 0.06, -0.13],
      [0.12, 0.06, -0.13],
    ].forEach(([wx, wy, wz]) => {
      const w = new THREE.Mesh(assets.carWheelGeo, assets.darkTireMat);
      w.position.set(wx, wy, wz);
      toyMesh.add(w);
    });
    toyMesh.add(chassis, roof);
  } else if (toyType === 'teddy_bear') {
    const body = new THREE.Mesh(assets.bearBodyGeo, assets.bearMat);
    body.position.y = 0.16;
    const head = new THREE.Mesh(assets.bearHeadGeo, assets.bearMat);
    head.position.y = 0.37;
    const earL = new THREE.Mesh(assets.bearEarGeo, assets.bearMat);
    earL.position.set(-0.09, 0.48, 0);
    const earR = new THREE.Mesh(assets.bearEarGeo, assets.bearMat);
    earR.position.set(0.09, 0.48, 0);
    const snout = new THREE.Mesh(assets.bearEarGeo, assets.bearSnoutMat);
    snout.position.set(0, 0.35, 0.11);
    toyMesh.add(body, head, earL, earR, snout);
  } else if (toyType === 'robot') {
    const torso = new THREE.Mesh(assets.botTorsoGeo, assets.botMat);
    torso.position.y = 0.2;
    const head = new THREE.Mesh(assets.botHeadGeo, assets.botMat);
    head.position.y = 0.41;
    const visor = new THREE.Mesh(assets.botVisorGeo, assets.botVisorMat);
    visor.position.set(0, 0.42, 0.08);
    const ant = new THREE.Mesh(assets.botAntGeo, assets.botVisorMat);
    ant.position.y = 0.53;
    toyMesh.add(torso, head, visor, ant);
  } else if (toyType === 'snow_globe') {
    const base = new THREE.Mesh(assets.globeBaseGeo, assets.globeWoodMat);
    base.position.y = 0.06;
    const snow = new THREE.Mesh(assets.globeSnowGeo, assets.snowWhiteMat);
    snow.position.y = 0.12;
    const tree = new THREE.Mesh(assets.globeTreeGeo, assets.trainGreenMat);
    tree.position.y = 0.22;
    const glass = new THREE.Mesh(assets.globeGlassGeo, assets.globeGlassMat);
    glass.position.y = 0.24;
    toyMesh.add(base, snow, tree, glass);
  } else if (toyType === 'nutcracker') {
    const torso = new THREE.Mesh(assets.nutTorsoGeo, assets.trainRedMat);
    torso.position.y = 0.16;
    const belt = new THREE.Mesh(assets.nutTrimGeo, assets.goldMetalMat);
    belt.position.y = 0.15;
    const head = new THREE.Mesh(assets.dollHeadGeo, assets.dollSkinMat);
    head.position.y = 0.34;
    const beard = new THREE.Mesh(assets.nutBeardGeo, assets.snowWhiteMat);
    beard.rotation.x = Math.PI;
    beard.position.set(0, 0.28, 0.08);
    const hat = new THREE.Mesh(assets.nutHatGeo, assets.darkTireMat);
    hat.position.y = 0.48;
    toyMesh.add(torso, belt, head, beard, hat);
  } else if (toyType === 'rocket') {
    const body = new THREE.Mesh(assets.rocketBodyGeo, assets.snowWhiteMat);
    body.position.y = 0.24;
    const nose = new THREE.Mesh(assets.rocketNoseGeo, assets.trainRedMat);
    nose.position.y = 0.47;
    const finA = new THREE.Mesh(assets.rocketFinGeo, assets.trainRedMat);
    finA.position.y = 0.14;
    const finB = new THREE.Mesh(assets.rocketFinGeo, assets.trainRedMat);
    finB.rotation.y = Math.PI / 2;
    finB.position.y = 0.14;
    const flame = new THREE.Mesh(assets.rocketFlameGeo, assets.rocketFlameMat);
    flame.rotation.x = Math.PI;
    flame.position.y = 0.05;
    toyMesh.add(body, nose, finA, finB, flame);
  } else if (toyType === 'sleigh') {
    const hull = new THREE.Mesh(assets.sleighHullGeo, assets.trainRedMat);
    hull.position.y = 0.15;
    const back = new THREE.Mesh(assets.sleighBackGeo, assets.trainRedMat);
    back.position.set(-0.15, 0.26, 0);
    const runL = new THREE.Mesh(assets.sleighRunnerGeo, assets.goldMetalMat);
    runL.position.set(0, 0.05, -0.1);
    const runR = new THREE.Mesh(assets.sleighRunnerGeo, assets.goldMetalMat);
    runR.position.set(0, 0.05, 0.1);
    const trim = new THREE.Mesh(assets.sleighHullGeo, assets.goldMetalMat);
    trim.scale.set(1.03, 0.25, 1.04);
    trim.position.y = 0.22;
    toyMesh.add(hull, back, runL, runR, trim);
  } else {
    const dress = new THREE.Mesh(assets.dollDressGeo, assets.dollDressMat);
    dress.position.y = 0.15;
    const head = new THREE.Mesh(assets.dollHeadGeo, assets.dollSkinMat);
    head.position.y = 0.36;
    const hair = new THREE.Mesh(assets.dollHairGeo, assets.dollHairMat);
    hair.position.y = 0.38;
    toyMesh.add(dress, head, hair);
  }
  root.add(toyMesh);
  root.toyMesh = toyMesh;

  const boxMesh = new THREE.Group();
  const boxMat = isGolden ? assets.sharedGifts.goldWrapMat : assets.sharedGifts.regularWrapMat;
  const box = new THREE.Mesh(assets.boxGeo, boxMat);
  box.position.y = 0.22;
  const lid = new THREE.Mesh(assets.lidGeo, boxMat);
  lid.position.y = 0.42;
  boxMesh.add(box, lid);
  boxMesh.visible = false;
  root.add(boxMesh);
  root.boxMesh = boxMesh;

  const ribbonMesh = new THREE.Group();
  const ribMat = isGolden ? assets.sharedGifts.goldRibbonMat : assets.sharedGifts.ribbonMat;
  const strapA = new THREE.Mesh(assets.strapAGeo, ribMat);
  strapA.position.y = 0.24;
  const strapB = new THREE.Mesh(assets.strapBGeo, ribMat);
  strapB.position.y = 0.24;
  const bowL = new THREE.Mesh(assets.bowGeo, ribMat);
  bowL.position.set(-0.09, 0.52, 0);
  bowL.rotation.y = Math.PI / 4;
  const bowR = new THREE.Mesh(assets.bowGeo, ribMat);
  bowR.position.set(0.09, 0.52, 0);
  bowR.rotation.y = -Math.PI / 4;
  ribbonMesh.add(strapA, strapB, bowL, bowR);
  ribbonMesh.visible = false;
  root.add(ribbonMesh);
  root.ribbonMesh = ribbonMesh;

  if (isGolden) {
    const halo = new THREE.Mesh(assets.haloGeo, assets.haloMat);
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 0.06;
    root.add(halo);
    root.goldenHalo = halo;
  }

  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const glowShell = new THREE.Mesh(assets.glowShellGeo, glowMat);
  glowShell.position.y = 0.26;
  glowShell.visible = false;

  const glowRing = new THREE.Mesh(assets.glowRingGeo, glowMat);
  glowRing.position.y = 0.045;
  glowRing.visible = false;

  root.add(glowShell, glowRing);
  root.glowShell = glowShell;
  root.glowRing = glowRing;
  root.glowMat = glowMat;
  root.lastStage = null;
  root.glowTimer = 0;
  root.glowDuration = 0.85;
  root.glowColor = 0x38bdf8;
  root.popTimer = 0;

  return root;
}
