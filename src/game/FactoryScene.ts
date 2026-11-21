import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type {
  CameraAction,
  GameState,
  LineId,
  SelectedMachineInfo,
} from '../types/game';
import {
  getConveyorSpeed,
  getGiftTierMeta,
  getProductionMultiplier,
  LINE_IDS,
  LINE_Y_BASE,
  LINE_Z_POSITIONS,
} from './constants';
import {
  createDeliveryTruck,
  createElfWorker,
  createFactoryBuilding,
  createGeneratorStation,
  createIndoorChristmasTree,
  createItemVisual,
  createProductionLineRig,
  createSharedElfAssets,
  createSharedGiftMaterials,
  createSharedItemAssets,
  createSnowyTownEnvironment,
  createStorageBay,
  createTrainLogistics,
  type ElfWorkerRig,
  type GeneratorRigRefs,
  type ItemVisualGroup,
  type MachineRigRefs,
  type SharedElfAssets,
  type SharedGiftMaterials,
  type SharedItemAssets,
  type StorageBayRefs,
  type TrainRigRefs,
  type TreeRigRefs,
  type TruckRigRefs,
} from './models';
import { getTotalStored } from './simulation';
import { createProceduralTextures, type ProceduralTextures } from './textures';

const _raycaster = new THREE.Raycaster();
const _pointer = new THREE.Vector2();
const _targetOffset = new THREE.Vector3();
const _camGoalPos = new THREE.Vector3();
const _camGoalTarget = new THREE.Vector3();
const _dayColor = new THREE.Color(0x6fa8dc);
const _duskColor = new THREE.Color(0x2d234a);
const _nightColor = new THREE.Color(0x091322);
const _blizzardColor = new THREE.Color(0x3a4d68);
const _skyWorkColor = new THREE.Color();
const _producePalette = [0x4ade80, 0x86efac, 0xfef08a];
const _wrapPalette = [0x38bdf8, 0x7dd3fc, 0xe0f2fe];
const _ribbonPalette = [0xfacc15, 0xfef08a, 0xfb7185, 0xffffff];
const _goldenRibbonPalette = [0xfef08a, 0xffffff, 0xf59e0b];

interface SparkleParticle {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  active: boolean;
  vx: number;
  vy: number;
  vz: number;
  gravity: number;
  baseScale: number;
  life: number;
  maxLife: number;
}

interface SmokePuff {
  mesh: THREE.Mesh;
  mat: THREE.MeshStandardMaterial;
  active: boolean;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  startScale: number;
}

export class FactoryScene {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private isSoftwareGl: boolean;
  private textures: ProceduralTextures;
  private sharedGifts: SharedGiftMaterials;
  private itemAssets: SharedItemAssets;
  private elfAssets: SharedElfAssets;

  private hemiLight: THREE.HemisphereLight;
  private keyLight: THREE.DirectionalLight;
  private workshopWarmLight: THREE.PointLight;
  private treeLight: THREE.PointLight;

  private lineRigs: Record<LineId, MachineRigRefs>;
  private floorElves: ElfWorkerRig[] = [];
  private workerClock = 0;
  private floor2Structure: THREE.Group;
  private floor2SouthWing: THREE.Group;
  private floor3Structure: THREE.Group;
  private rebirthStage1: THREE.Group;
  private rebirthStage2: THREE.Group;
  private rebirthStage3: THREE.Group;
  private rebirthStar: THREE.Mesh;
  private powerConduitMat: THREE.MeshStandardMaterial;
  private generatorRig: GeneratorRigRefs;
  private storageBay: StorageBayRefs;
  private truckRig: TruckRigRefs;
  private trainRig: TrainRigRefs;
  private treeRig: TreeRigRefs;
  private stringLightMats: THREE.MeshStandardMaterial[] = [];
  private windowGlowMats: THREE.MeshStandardMaterial[] = [];

  private snowPoints: THREE.Points;
  private snowMat: THREE.PointsMaterial;
  private snowPositions: Float32Array;
  private snowSpeeds: Float32Array;

  private itemMeshes = new Map<number, ItemVisualGroup>();
  private itemPool = new Map<string, ItemVisualGroup[]>();
  private activeItemIds = new Set<number>();
  private lineWrapping: Record<LineId, number> = {
    line1: -1,
    line2: -1,
    line3: -1,
    line4: -1,
    line5: -1,
    line6: -1,
  };
  private lineRibboning: Record<LineId, number> = {
    line1: -1,
    line2: -1,
    line3: -1,
    line4: -1,
    line5: -1,
    line6: -1,
  };

  private lastGiftTier = -1;
  private lastStoredCount = -1;
  private lastGoldenStored = -1;

  private sparklePool: SparkleParticle[] = [];
  private sparkleGeo = new THREE.OctahedronGeometry(0.11, 0);

  private smokePool: SmokePuff[] = [];
  private smokeGeo = new THREE.SphereGeometry(0.28, 7, 7);
  private chimneySmokeTimer = 0;
  private trainSmokeTimer = 0;

  private frameId = 0;
  private disposed = false;
  private lastTime = performance.now();
  private elapsed = 0;
  private titleMode = true;

  private camTransitionActive = false;
  private defaultCamPos = new THREE.Vector3(27, 23.5, 27);
  private defaultTarget = new THREE.Vector3(1.2, 1.4, 0.2);

  private getState: () => GameState;
  private onTick: (dt: number) => void;
  private onSelectMachine: (info: SelectedMachineInfo | null) => void;

  private pointerDownPos = { x: 0, y: 0 };

  constructor(
    container: HTMLElement,
    getState: () => GameState,
    onTick: (dt: number) => void,
    onSelectMachine: (info: SelectedMachineInfo | null) => void,
  ) {
    this.container = container;
    this.getState = getState;
    this.onTick = onTick;
    this.onSelectMachine = onSelectMachine;

    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.5),
    );
    this.renderer.setSize(container.clientWidth || 1280, container.clientHeight || 720);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    const skyColor = new THREE.Color(0x0c1729);
    this.scene.background = skyColor;
    this.scene.fog = new THREE.FogExp2(0x0c1729, 0.011);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const aspect = (container.clientWidth || 1280) / (container.clientHeight || 720);
    this.camera = new THREE.PerspectiveCamera(28, aspect, 0.2, 190);
    this.camera.position.copy(this.defaultCamPos);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.copy(this.defaultTarget);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 14;
    this.controls.maxDistance = 62;
    this.controls.minPolarAngle = 0.32;
    this.controls.maxPolarAngle = Math.PI / 2.28;
    this.controls.update();

    this.controls.addEventListener('start', () => {
      this.camTransitionActive = false;
    });

    this.hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x1e293b, 0.95);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xfff1d6, 2.15);
    this.keyLight.position.set(18, 28, 16);
    this.keyLight.castShadow = !this.isSoftwareGl;
    this.keyLight.shadow.mapSize.set(1024, 1024);
    this.keyLight.shadow.camera.left = -19;
    this.keyLight.shadow.camera.right = 19;
    this.keyLight.shadow.camera.top = 19;
    this.keyLight.shadow.camera.bottom = -19;
    this.keyLight.shadow.camera.near = 2;
    this.keyLight.shadow.camera.far = 68;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.02;
    this.scene.add(this.keyLight);

    const rimLight = new THREE.DirectionalLight(0x7dd3fc, 0.65);
    rimLight.position.set(-18, 14, -18);
    this.scene.add(rimLight);

    this.workshopWarmLight = new THREE.PointLight(0xffb74d, 16, 32, 1.4);
    this.workshopWarmLight.position.set(0, 5.8, 0);
    this.scene.add(this.workshopWarmLight);

    this.treeLight = new THREE.PointLight(0xfef08a, 9, 14, 1.5);
    this.treeLight.position.set(-7.6, 3.6, 6.4);
    this.scene.add(this.treeLight);

    this.textures = createProceduralTextures(
      this.renderer.capabilities.getMaxAnisotropy(),
    );
    this.sharedGifts = createSharedGiftMaterials();
    this.itemAssets = createSharedItemAssets(this.sharedGifts);
    this.elfAssets = createSharedElfAssets();

    const env = createSnowyTownEnvironment(this.textures);
    this.scene.add(env.group);
    this.windowGlowMats.push(...env.windowGlowMats);

    const building = createFactoryBuilding(this.textures);
    this.scene.add(building.group);
    this.floor2Structure = building.floor2Structure;
    this.floor2SouthWing = building.floor2SouthWing;
    this.floor3Structure = building.floor3Structure;
    this.rebirthStage1 = building.rebirthStage1;
    this.rebirthStage2 = building.rebirthStage2;
    this.rebirthStage3 = building.rebirthStage3;
    this.rebirthStar = building.rebirthStar;
    this.powerConduitMat = building.powerConduitMat;
    this.stringLightMats.push(...building.stringLightMats);
    this.windowGlowMats.push(...building.windowGlowMats);

    this.treeRig = createIndoorChristmasTree(this.textures);
    this.scene.add(this.treeRig.group);

    this.generatorRig = createGeneratorStation(this.textures);
    this.scene.add(this.generatorRig.group);

    this.lineRigs = {
      line1: createProductionLineRig('line1', LINE_Y_BASE.line1, LINE_Z_POSITIONS.line1, 0xb91c1c, this.textures, this.sharedGifts, this.elfAssets),
      line2: createProductionLineRig('line2', LINE_Y_BASE.line2, LINE_Z_POSITIONS.line2, 0x15803d, this.textures, this.sharedGifts, this.elfAssets),
      line3: createProductionLineRig('line3', LINE_Y_BASE.line3, LINE_Z_POSITIONS.line3, 0x0284c7, this.textures, this.sharedGifts, this.elfAssets),
      line4: createProductionLineRig('line4', LINE_Y_BASE.line4, LINE_Z_POSITIONS.line4, 0x7e22ce, this.textures, this.sharedGifts, this.elfAssets),
      line5: createProductionLineRig('line5', LINE_Y_BASE.line5, LINE_Z_POSITIONS.line5, 0xd97706, this.textures, this.sharedGifts, this.elfAssets),
      line6: createProductionLineRig('line6', LINE_Y_BASE.line6, LINE_Z_POSITIONS.line6, 0x06b6d4, this.textures, this.sharedGifts, this.elfAssets),
    };
    this.scene.add(
      this.lineRigs.line1.root,
      this.lineRigs.line2.root,
      this.lineRigs.line3.root,
      this.lineRigs.line4.root,
      this.lineRigs.line5.root,
      this.lineRigs.line6.root,
    );

    // Bonus workshop-aisle elf couriers (appear progressively as total hired workers grow)
    const aisleSpecs = [
      { minX: -4.8, maxX: 6.1, laneZ: -2.2, phase: 0.12, speed: 0.095, variant: 2, carriesGift: true },
      { minX: -4.8, maxX: 6.1, laneZ: 1.8, phase: 0.62, speed: 0.092, variant: 1, carriesGift: true },
      { minX: -4.6, maxX: 6.0, laneZ: 5.75, phase: 0.25, speed: 0.088, variant: 0, carriesGift: false },
      { minX: -5.4, maxX: 4.4, laneZ: -6.15, phase: 0.72, speed: 0.084, variant: 3, carriesGift: true },
      { minX: -4.2, maxX: 5.8, laneZ: -2.2, phase: 0.58, speed: 0.105, variant: 0, carriesGift: false },
      { minX: -4.2, maxX: 5.8, laneZ: 1.8, phase: 0.08, speed: 0.102, variant: 2, carriesGift: false },
    ];
    for (let i = 0; i < aisleSpecs.length; i++) {
      const elf = createElfWorker(this.elfAssets, this.sharedGifts, aisleSpecs[i]);
      elf.group.position.y = 0.36;
      this.floorElves.push(elf);
      this.scene.add(elf.group);
    }

    this.storageBay = createStorageBay(this.textures, this.sharedGifts);
    this.scene.add(this.storageBay.group);

    this.truckRig = createDeliveryTruck(this.textures, this.sharedGifts);
    this.scene.add(this.truckRig.group);

    this.trainRig = createTrainLogistics(this.textures, this.sharedGifts);
    this.scene.add(this.trainRig.trackGroup);

    // Falling Snow Particles (optimized count)
    const snowCount = this.isSoftwareGl ? 240 : 520;
    this.snowPositions = new Float32Array(snowCount * 3);
    this.snowSpeeds = new Float32Array(snowCount);
    for (let i = 0; i < snowCount; i++) {
      this.snowPositions[i * 3] = (Math.random() - 0.5) * 76;
      this.snowPositions[i * 3 + 1] = Math.random() * 26 + 0.4;
      this.snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 76;
      this.snowSpeeds[i] = 1.9 + Math.random() * 2.4;
    }
    const snowGeo = new THREE.BufferGeometry();
    snowGeo.setAttribute('position', new THREE.BufferAttribute(this.snowPositions, 3));
    this.snowMat = new THREE.PointsMaterial({
      size: 0.5,
      map: this.textures.snowflake,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.snowPoints = new THREE.Points(snowGeo, this.snowMat);
    this.scene.add(this.snowPoints);

    // Pooled Sparkles & Celebration Confetti (180 pooled meshes, zero runtime allocations)
    for (let i = 0; i < 180; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xfacc15,
        transparent: true,
        opacity: 0,
      });
      const mesh = new THREE.Mesh(this.sparkleGeo, mat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.sparklePool.push({
        mesh,
        mat,
        active: false,
        vx: 0,
        vy: 0,
        vz: 0,
        gravity: 4.5,
        baseScale: 1,
        life: 0,
        maxLife: 0.6,
      });
    }

    // Pooled Smoke/Steam Puffs for Brick Chimney & Locomotive Funnel (zero runtime allocations)
    for (let i = 0; i < 22; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0xf1f5f9,
        roughness: 0.95,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(this.smokeGeo, mat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.smokePool.push({
        mesh,
        mat,
        active: false,
        vx: 0,
        vy: 1,
        vz: 0,
        life: 0,
        maxLife: 2,
        startScale: 0.6,
      });
    }

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    _raycaster.layers.set(1);

    window.addEventListener('resize', this.handleResize);
    this.renderer.domElement.addEventListener('pointerdown', this.handlePointerDown);
    this.renderer.domElement.addEventListener('pointerup', this.handlePointerUp);

    this.lastTime = performance.now();
    this.scheduleNextTick();
  }

  public setTitleMode(active: boolean) {
    this.titleMode = active;
    if (!active) {
      this.handleCameraAction({ type: 'reset' });
    }
  }

  public handleCameraAction(action: CameraAction) {
    if (action.type === 'reset') {
      _camGoalPos.copy(this.defaultCamPos);
      _camGoalTarget.copy(this.defaultTarget);
      this.camTransitionActive = true;
      return;
    }

    if (action.type === 'focus_line') {
      const z = LINE_Z_POSITIONS[action.lineId];
      const y = LINE_Y_BASE[action.lineId] + 1.0;
      _camGoalTarget.set(-1.0, y, z);
      _camGoalPos.set(13.5, y + 12.5, z + 15.5);
      this.camTransitionActive = true;
      return;
    }

    _camGoalTarget.copy(this.controls.target);
    _targetOffset.copy(this.camera.position).sub(this.controls.target);

    if (action.type === 'zoom_in') {
      const nextLen = Math.max(15, _targetOffset.length() * 0.78);
      _targetOffset.setLength(nextLen);
    } else if (action.type === 'zoom_out') {
      const nextLen = Math.min(58, _targetOffset.length() * 1.25);
      _targetOffset.setLength(nextLen);
    } else if (action.type === 'rotate_left') {
      _targetOffset.applyAxisAngle(THREE.Object3D.DEFAULT_UP, Math.PI / 6);
    } else if (action.type === 'rotate_right') {
      _targetOffset.applyAxisAngle(THREE.Object3D.DEFAULT_UP, -Math.PI / 6);
    }

    _camGoalPos.copy(_camGoalTarget).add(_targetOffset);
    this.camTransitionActive = true;
  }

  public spawnSparkleBurst(x: number, y: number, z: number, colorHex = 0xfacc15) {
    const count = 10;
    let spawned = 0;
    for (let i = 0; i < this.sparklePool.length && spawned < count; i++) {
      const sp = this.sparklePool[i];
      if (!sp.active) {
        const angle = (spawned / count) * Math.PI * 2;
        sp.active = true;
        sp.life = 0;
        sp.maxLife = 0.65 + Math.random() * 0.25;
        sp.gravity = 4.5;
        sp.baseScale = 1.0;
        sp.vx = Math.cos(angle) * (1.3 + Math.random() * 1.4);
        sp.vy = 2.0 + Math.random() * 1.6;
        sp.vz = Math.sin(angle) * (1.3 + Math.random() * 1.4);
        sp.mat.color.setHex(colorHex);
        sp.mat.opacity = 1;
        sp.mesh.position.set(x, y, z);
        sp.mesh.scale.setScalar(1);
        sp.mesh.visible = true;
        spawned++;
      }
    }
  }

  private spawnStageParticles(
    x: number,
    y: number,
    z: number,
    stage: 'producing' | 'wrapping' | 'ribboning',
    isGolden: boolean,
  ) {
    let count = 5;
    let palette = _producePalette;
    let minLife = 0.36;
    let lifeSpan = 0.14;
    let gravity = 5.0;
    let baseScale = 0.58;
    let minSpeed = 0.7;
    let speedSpan = 0.6;
    let minVy = 1.25;
    let vySpan = 0.75;

    if (stage === 'wrapping') {
      count = 10;
      palette = _wrapPalette;
      minLife = 0.46;
      lifeSpan = 0.2;
      gravity = 3.8;
      baseScale = 0.78;
      minSpeed = 1.35;
      speedSpan = 0.9;
      minVy = 1.2;
      vySpan = 0.95;
    } else if (stage === 'ribboning') {
      count = 14;
      palette = isGolden ? _goldenRibbonPalette : _ribbonPalette;
      minLife = 0.58;
      lifeSpan = 0.24;
      gravity = 4.1;
      baseScale = isGolden ? 1.12 : 0.92;
      minSpeed = 0.95;
      speedSpan = 1.05;
      minVy = 2.3;
      vySpan = 1.25;
    }

    let spawned = 0;
    for (let i = 0; i < this.sparklePool.length && spawned < count; i++) {
      const sp = this.sparklePool[i];
      if (!sp.active) {
        const angle = (spawned / count) * Math.PI * 2 + Math.random() * 0.35;
        const speed = minSpeed + Math.random() * speedSpan;
        sp.active = true;
        sp.life = 0;
        sp.maxLife = minLife + Math.random() * lifeSpan;
        sp.gravity = gravity;
        sp.baseScale = baseScale * (0.85 + Math.random() * 0.3);
        sp.vx = Math.cos(angle) * speed;
        sp.vy = minVy + Math.random() * vySpan;
        sp.vz = Math.sin(angle) * speed;
        sp.mat.color.setHex(palette[spawned % palette.length]);
        sp.mat.opacity = 1;
        sp.mesh.position.set(x, y, z);
        sp.mesh.scale.setScalar(sp.baseScale);
        sp.mesh.visible = true;
        spawned++;
      }
    }
  }

  public spawnCelebrationBurst(
    x: number,
    y: number,
    z: number,
    palette: number[] = [0xfacc15, 0x22c55e, 0xef4444, 0x38bdf8, 0xe879f9],
  ) {
    const count = 38;
    let spawned = 0;
    for (let i = 0; i < this.sparklePool.length && spawned < count; i++) {
      const sp = this.sparklePool[i];
      if (!sp.active) {
        const angle = (spawned / count) * Math.PI * 2 + Math.random() * 0.4;
        const speed = 2.2 + Math.random() * 3.8;
        sp.active = true;
        sp.life = 0;
        sp.maxLife = 1.15 + Math.random() * 0.55;
        sp.gravity = 3.2;
        sp.baseScale = 1.35 + Math.random() * 0.75;
        sp.vx = Math.cos(angle) * speed;
        sp.vy = 4.2 + Math.random() * 4.4;
        sp.vz = Math.sin(angle) * speed;
        sp.mat.color.setHex(palette[spawned % palette.length]);
        sp.mat.opacity = 1;
        sp.mesh.position.set(x + (Math.random() - 0.5) * 1.2, y, z + (Math.random() - 0.5) * 1.2);
        sp.mesh.scale.setScalar(sp.baseScale);
        sp.mesh.visible = true;
        spawned++;
      }
    }
  }

  private handlePointerDown = (e: PointerEvent) => {
    this.pointerDownPos = { x: e.clientX, y: e.clientY };
  };

  private handlePointerUp = (e: PointerEvent) => {
    if (this.titleMode) return;
    const dx = e.clientX - this.pointerDownPos.x;
    const dy = e.clientY - this.pointerDownPos.y;
    if (Math.hypot(dx, dy) > 6) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    _pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    _pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    _raycaster.setFromCamera(_pointer, this.camera);
    const hits = _raycaster.intersectObjects(this.scene.children, true);
    if (hits.length > 0) {
      const data = hits[0].object.userData;
      if (data && data.interactiveKind) {
        this.onSelectMachine({
          kind: data.interactiveKind,
          lineId: data.lineId,
          title: data.title,
        });
        return;
      }
    }
    this.onSelectMachine(null);
  };

  private handleResize = () => {
    if (this.disposed) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private scheduleNextTick() {
    if (this.disposed) return;
    if (this.isSoftwareGl) {
      this.afterDraw(() => this.tick());
    } else {
      this.frameId = requestAnimationFrame(() => this.tick());
    }
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
    gl.flush();
    const poll = () => {
      if (this.disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const status = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
      if (status === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick() {
    if (this.disposed) return;

    const now = performance.now();
    const rawDt = Math.max(0.001, (now - this.lastTime) / 1000);
    this.lastTime = now;
    const dt = Math.min(rawDt, 0.05);
    this.elapsed += dt;

    this.onTick(rawDt);

    const state = this.getState();

    // Title Orbit or Smooth Camera Transition
    if (this.titleMode) {
      const orbitAngle = Math.sin(this.elapsed * 0.22) * 0.28 + 0.78;
      const dist = 38;
      this.camera.position.set(
        Math.cos(orbitAngle) * dist,
        22.5,
        Math.sin(orbitAngle) * dist,
      );
      this.controls.target.set(0.8, 1.5, 0.2);
    } else if (this.camTransitionActive) {
      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, _camGoalPos.x, 6, dt);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, _camGoalPos.y, 6, dt);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, _camGoalPos.z, 6, dt);

      this.controls.target.x = THREE.MathUtils.damp(this.controls.target.x, _camGoalTarget.x, 6, dt);
      this.controls.target.y = THREE.MathUtils.damp(this.controls.target.y, _camGoalTarget.y, 6, dt);
      this.controls.target.z = THREE.MathUtils.damp(this.controls.target.z, _camGoalTarget.z, 6, dt);

      if (
        this.camera.position.distanceTo(_camGoalPos) < 0.08 &&
        this.controls.target.distanceTo(_camGoalTarget) < 0.08
      ) {
        this.camTransitionActive = false;
      }
    }

    this.controls.update();

    // Dynamic Day-Night & Weather Atmosphere
    this.updateAtmosphere(state, dt);

    // Update Pooled Sparkle Bursts & Celebration Fountains
    for (let i = 0; i < this.sparklePool.length; i++) {
      const sp = this.sparklePool[i];
      if (!sp.active) continue;
      sp.life += dt;
      if (sp.life >= sp.maxLife) {
        sp.active = false;
        sp.mesh.visible = false;
      } else {
        sp.vy -= sp.gravity * dt;
        sp.mesh.position.x += sp.vx * dt;
        sp.mesh.position.y += sp.vy * dt;
        sp.mesh.position.z += sp.vz * dt;
        sp.mesh.rotation.y += 6 * dt;
        sp.mesh.rotation.x += 4 * dt;
        const t = sp.life / sp.maxLife;
        sp.mat.opacity = 1 - t * t;
        sp.mesh.scale.setScalar(sp.baseScale * (1 - t * 0.55));
      }
    }

    // Sync Production Lines, Floor 2, Generator, Train, Truck, Tree, Storage & Smoke
    this.syncFactoryVisuals(state, dt);
    this.updateSmokePuffs(state, dt);

    this.renderer.render(this.scene, this.camera);
    this.scheduleNextTick();
  }

  private spawnSmokePuff(
    x: number,
    y: number,
    z: number,
    startScale: number,
    vy: number,
    maxLife: number,
  ) {
    for (let i = 0; i < this.smokePool.length; i++) {
      const puff = this.smokePool[i];
      if (!puff.active) {
        puff.active = true;
        puff.life = 0;
        puff.maxLife = maxLife;
        puff.startScale = startScale;
        puff.vx = (Math.random() - 0.5) * 0.28;
        puff.vy = vy;
        puff.vz = (Math.random() - 0.5) * 0.28;
        puff.mesh.position.set(x, y, z);
        puff.mesh.scale.setScalar(startScale);
        puff.mesh.visible = true;
        puff.mat.opacity = 0.65;
        return;
      }
    }
  }

  private updateSmokePuffs(state: GameState, dt: number) {
    const isBlizzard = state.environment.weather === 'blizzard';
    const windDriftX = isBlizzard ? 1.85 : 0.25;

    // Main factory brick chimney smoke
    this.chimneySmokeTimer -= dt;
    if (this.chimneySmokeTimer <= 0) {
      this.chimneySmokeTimer = state.isRunning ? 0.36 : 0.72;
      this.spawnSmokePuff(-7.5, 9.55, -8.5, 0.65, 1.45, 2.4);
    }

    // Santa Express steam locomotive funnel puffs
    if (state.train.unlocked && state.train.phase !== 'away') {
      this.trainSmokeTimer -= dt * (state.train.phase === 'loading' ? 0.7 : 1.3);
      if (this.trainSmokeTimer <= 0) {
        this.trainSmokeTimer = 0.28;
        const funnelZ = this.trainRig.trainGroup.position.z + 3.25;
        this.spawnSmokePuff(17.6, 2.55, funnelZ, 0.45, 1.65, 1.6);
      }
    }

    for (let i = 0; i < this.smokePool.length; i++) {
      const puff = this.smokePool[i];
      if (!puff.active) continue;
      puff.life += dt;
      if (puff.life >= puff.maxLife) {
        puff.active = false;
        puff.mesh.visible = false;
        continue;
      }
      const t = puff.life / puff.maxLife;
      puff.mesh.position.x += (puff.vx + windDriftX) * dt;
      puff.mesh.position.y += puff.vy * dt;
      puff.mesh.position.z += puff.vz * dt;
      puff.mesh.scale.setScalar(puff.startScale * (1 + t * 2.2));
      puff.mat.opacity = 0.65 * (1 - t);
    }
  }

  private updateAtmosphere(state: GameState, dt: number) {
    // timeOfDay: 0.25 = bright noon, 0.5 = sunset/dusk, 0.75 = midnight, 0.0 = dawn
    const sunAngle = (state.environment.timeOfDay - 0.05) * Math.PI * 2;
    const dayFactor = THREE.MathUtils.clamp(Math.sin(sunAngle) * 0.5 + 0.5, 0, 1);

    if (dayFactor > 0.5) {
      _skyWorkColor.lerpColors(_duskColor, _dayColor, (dayFactor - 0.5) * 2);
    } else {
      _skyWorkColor.lerpColors(_nightColor, _duskColor, dayFactor * 2);
    }

    const weather = state.environment.weather;
    if (weather === 'blizzard') {
      _skyWorkColor.lerp(_blizzardColor, 0.45);
    }

    (this.scene.background as THREE.Color).copy(_skyWorkColor);
    const fog = this.scene.fog as THREE.FogExp2;
    fog.color.copy(_skyWorkColor);
    fog.density = weather === 'blizzard' ? 0.021 : 0.011;

    this.keyLight.intensity = 0.75 + dayFactor * 1.75;
    this.keyLight.position.set(
      14 + Math.cos(sunAngle) * 14,
      16 + dayFactor * 16,
      14 + Math.sin(sunAngle) * 8,
    );
    this.hemiLight.intensity = 0.62 + dayFactor * 0.55;
    this.workshopWarmLight.intensity = 10 + (1 - dayFactor) * 10;

    // Night window glow
    const nightBoost = 0.45 + (1 - dayFactor) * 1.2;
    for (let i = 0; i < this.windowGlowMats.length; i++) {
      this.windowGlowMats[i].emissiveIntensity = nightBoost;
    }

    // Truck headlights glow brighter at night or while driving
    const truckMoving =
      state.truck.phase === 'delivering' || state.truck.phase === 'returning';
    const hlIntensity = (truckMoving ? 1.8 : 0.9) + (1 - dayFactor) * 1.2;
    for (let i = 0; i < this.truckRig.headlights.length; i++) {
      (this.truckRig.headlights[i].material as THREE.MeshStandardMaterial).emissiveIntensity =
        hlIntensity;
    }

    // Snow & Blizzard particles
    const isClear = weather === 'clear';
    const isBlizzard = weather === 'blizzard';
    this.snowMat.opacity = isClear ? 0.12 : isBlizzard ? 0.96 : 0.82;
    const fallMult = isClear ? 0.45 : isBlizzard ? 2.4 : 1.0;
    const windX = isBlizzard ? 6.5 : 0.4;

    const posArr = this.snowPositions;
    for (let i = 0; i < this.snowSpeeds.length; i++) {
      const idx = i * 3;
      posArr[idx + 1] -= this.snowSpeeds[i] * fallMult * dt;
      posArr[idx] += (windX + Math.sin(this.elapsed * 1.3 + i) * 0.45) * dt;
      if (posArr[idx + 1] < 0.1 || posArr[idx] > 42) {
        posArr[idx + 1] = 25;
        posArr[idx] = (Math.random() - 0.5) * 76 - (isBlizzard ? 12 : 0);
      }
    }
    this.snowPoints.geometry.attributes.position.needsUpdate = true;

    // Twinkling String Lights (only 4 shared materials!) & Tree Ornaments & Tree Magic Tiers
    for (let i = 0; i < this.stringLightMats.length; i++) {
      this.stringLightMats[i].emissiveIntensity =
        0.9 + (1 - dayFactor) * 0.7 + Math.sin(this.elapsed * 3.2 + i * 1.1) * 0.45;
    }
    const treeMagicScale = 0.6 + state.upgrades.treeMagic * 0.25;
    this.treeRig.star.rotation.y += dt * 1.2;
    this.treeRig.magicTier2.visible = state.upgrades.treeMagic >= 2;
    this.treeRig.magicTier3.visible = state.upgrades.treeMagic >= 3;
    this.treeLight.intensity = 6 + state.upgrades.treeMagic * 1.3 + (1 - dayFactor) * 4;
    for (let i = 0; i < this.treeRig.ornaments.length; i++) {
      const mat = this.treeRig.ornaments[i].material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity =
        treeMagicScale * (0.7 + Math.sin(this.elapsed * 2.5 + i) * 0.35);
    }
  }

  private acquireItemVisual(toyType: GameState['items'][number]['toyType'], isGolden: boolean): ItemVisualGroup {
    const key = `${toyType}_${isGolden ? 1 : 0}`;
    const pool = this.itemPool.get(key);
    if (pool && pool.length > 0) {
      const vis = pool.pop()!;
      vis.toyMesh.rotation.y = 0;
      vis.toyMesh.scale.setScalar(1);
      vis.boxMesh.scale.setScalar(1);
      vis.ribbonMesh.scale.setScalar(1);
      vis.lastStage = null;
      vis.glowTimer = 0;
      vis.glowDuration = 0.85;
      vis.popTimer = 0;
      vis.glowMat.opacity = 0;
      vis.glowShell.visible = false;
      vis.glowRing.visible = false;
      vis.visible = true;
      return vis;
    }
    const vis = createItemVisual(toyType, isGolden, this.itemAssets);
    this.scene.add(vis);
    return vis;
  }

  private updateElfPatrol(
    worker: ElfWorkerRig,
    running: boolean,
    dt: number,
    yBase: number,
    isFloorElf: boolean,
  ) {
    const cycle = (this.workerClock * worker.speed + worker.phase) % 1;
    let x = worker.minX;
    let targetYaw = worker.laneZ >= 0 ? Math.PI : 0;
    let walkAmp = 0;
    let inspecting = false;

    if (cycle < 0.4) {
      const u = cycle / 0.4;
      const s = u * u * (3 - 2 * u);
      x = worker.minX + (worker.maxX - worker.minX) * s;
      targetYaw = Math.PI * 0.5;
      walkAmp = Math.sin(u * Math.PI);
    } else if (cycle < 0.5) {
      x = worker.maxX;
      targetYaw = isFloorElf
        ? Math.PI * 0.5
        : worker.laneZ >= 0
          ? Math.PI
          : 0;
      inspecting = true;
    } else if (cycle < 0.9) {
      const u = (cycle - 0.5) / 0.4;
      const s = u * u * (3 - 2 * u);
      x = worker.maxX - (worker.maxX - worker.minX) * s;
      targetYaw = -Math.PI * 0.5;
      walkAmp = Math.sin(u * Math.PI);
    } else {
      x = worker.minX;
      targetYaw = isFloorElf
        ? -Math.PI * 0.5
        : worker.laneZ >= 0
          ? Math.PI
          : 0;
      inspecting = true;
    }

    worker.group.position.set(x, yBase, worker.laneZ);

    const curYaw = worker.group.rotation.y;
    const diff = Math.atan2(Math.sin(targetYaw - curYaw), Math.cos(targetYaw - curYaw));
    worker.group.rotation.y = curYaw + diff * Math.min(1, dt * 10);

    if (!running) {
      worker.legL.rotation.x *= 0.8;
      worker.legR.rotation.x *= 0.8;
      worker.bodyGroup.position.y *= 0.8;
      worker.headGroup.rotation.x = 0;
      if (worker.carriesGift) {
        worker.armL.rotation.x = -0.78;
        worker.armR.rotation.x = -0.78;
      } else {
        worker.armL.rotation.x *= 0.8;
        worker.armR.rotation.x *= 0.8;
      }
      return;
    }

    const stridePhase = this.workerClock * 11.5 + worker.phase * 18.0;
    const swing = Math.sin(stridePhase) * walkAmp;

    worker.legL.rotation.x = swing * 0.72;
    worker.legR.rotation.x = -swing * 0.72;
    worker.bodyGroup.position.y = Math.abs(Math.sin(stridePhase)) * 0.048 * walkAmp;

    if (worker.carriesGift) {
      worker.propBox.visible = true;
      worker.armL.rotation.x = -0.8 + walkAmp * 0.06 * Math.sin(stridePhase * 2);
      worker.armR.rotation.x = -0.8 + walkAmp * 0.06 * Math.sin(stridePhase * 2);
      worker.headGroup.rotation.x = inspecting ? 0.14 : Math.sin(stridePhase * 2) * 0.04 * walkAmp;
    } else if (inspecting) {
      const workWave = Math.sin(this.workerClock * 9.5 + worker.phase * 10);
      worker.armL.rotation.x = -0.68 + workWave * 0.28;
      worker.armR.rotation.x = -0.68 - workWave * 0.28;
      worker.headGroup.rotation.x = 0.16 + Math.sin(this.workerClock * 4.5 + worker.phase) * 0.06;
    } else {
      worker.armL.rotation.x = -swing * 0.65;
      worker.armR.rotation.x = swing * 0.65;
      worker.headGroup.rotation.x = Math.sin(stridePhase * 2) * 0.04 * walkAmp;
    }
  }

  private syncFactoryVisuals(state: GameState, dt: number) {
    const running = state.isRunning;
    const eff = state.power.efficiency;
    const simDt = running ? dt * state.gameSpeed * eff : 0;
    if (running) {
      const workerRate = Math.min(2.35, Math.max(0.55, state.gameSpeed * eff));
      this.workerClock += dt * workerRate;
    }
    const beltSpeed = getConveyorSpeed(state.upgrades.conveyorSpeed);
    const prodMult = getProductionMultiplier(state.upgrades.productionBoost);

    // Sync Gift Tier Wrapping Color across belts, paper rolls, storage, truck & train!
    if (state.upgrades.giftTier !== this.lastGiftTier) {
      this.lastGiftTier = state.upgrades.giftTier;
      const tierMeta = getGiftTierMeta(state.upgrades.giftTier);
      this.sharedGifts.regularWrapMat.color.setHex(tierMeta.hex);
      this.sharedGifts.ribbonMat.color.setHex(tierMeta.ribbonHex);
      if (tierMeta.tier >= 5) {
        this.sharedGifts.regularWrapMat.metalness = 0.55;
        this.sharedGifts.regularWrapMat.roughness = 0.18;
      } else {
        this.sharedGifts.regularWrapMat.metalness = 0.16;
        this.sharedGifts.regularWrapMat.roughness = 0.36;
      }
    }

    // Floor 2, Floor 3 & Rebirth Physical Factory Growth
    this.floor2Structure.visible = state.floor2Unlocked || state.lines.line4.unlocked;
    this.lineRigs.line4.root.visible = state.lines.line4.unlocked;
    this.floor2SouthWing.visible = state.lines.line5.unlocked;
    this.lineRigs.line5.root.visible = state.lines.line5.unlocked;
    this.floor3Structure.visible = state.floor3Unlocked || state.lines.line6.unlocked;
    this.lineRigs.line6.root.visible = state.lines.line6.unlocked;

    this.rebirthStage1.visible = state.rebirthCount >= 1;
    this.rebirthStage2.visible = state.rebirthCount >= 2;
    this.rebirthStage3.visible = state.rebirthCount >= 3;
    if (this.rebirthStage2.visible) {
      this.rebirthStar.rotation.y += dt * 1.4;
    }

    // Electric Generator Kinematics & Overhead Power Conduit Bus
    const overloaded = state.power.usedKw > state.power.capacityKw;
    const genSpeed = (0.8 + state.power.generatorLevel * 0.4) * (running ? 1 : 0.2);
    this.generatorRig.rotor.rotation.x += dt * genSpeed * 4.5;
    this.generatorRig.upgradeCoil.visible = state.power.generatorLevel >= 2;
    this.generatorRig.tier3Stack.visible = state.power.generatorLevel >= 3;

    const coreMat = this.generatorRig.statusCore.material as THREE.MeshStandardMaterial;
    if (overloaded) {
      const pulse = 1.15 + Math.sin(this.elapsed * 8) * 0.6;
      coreMat.color.setHex(0xf97316);
      coreMat.emissive.setHex(0xea580c);
      coreMat.emissiveIntensity = pulse;
      this.powerConduitMat.color.setHex(0xf97316);
      this.powerConduitMat.emissive.setHex(0xea580c);
      this.powerConduitMat.emissiveIntensity = pulse;
    } else {
      coreMat.color.setHex(0x38bdf8);
      coreMat.emissive.setHex(0x0ea5e9);
      coreMat.emissiveIntensity = 1.5;
      this.powerConduitMat.color.setHex(0x38bdf8);
      this.powerConduitMat.emissive.setHex(0x0ea5e9);
      this.powerConduitMat.emissiveIntensity = 1.15;
    }

    // Single pass over active items: update visuals AND collect wrapping/ribboning state per line
    this.activeItemIds.clear();
    for (let l = 0; l < LINE_IDS.length; l++) {
      this.lineWrapping[LINE_IDS[l]] = -1;
      this.lineRibboning[LINE_IDS[l]] = -1;
    }

    for (let i = 0; i < state.items.length; i++) {
      const item = state.items[i];
      this.activeItemIds.add(item.id);
      if (item.stage === 'wrapping') {
        this.lineWrapping[item.lineId] = item.progress;
      } else if (item.stage === 'ribboning') {
        this.lineRibboning[item.lineId] = item.progress;
      }

      let vis = this.itemMeshes.get(item.id);
      if (!vis) {
        vis = this.acquireItemVisual(item.toyType, item.isGolden);
        this.itemMeshes.set(item.id, vis);
      }

      vis.position.set(item.x, item.y, item.z);
      if (vis.goldenHalo) {
        vis.goldenHalo.rotation.z += dt * 2.4;
        const pulse = 1 + Math.sin(this.elapsed * 5 + item.id) * 0.08;
        vis.goldenHalo.scale.setScalar(pulse);
      }

      // Detect production stage completions to trigger unique glow + particles
      if (vis.lastStage === null) {
        vis.lastStage = item.stage;
      } else if (vis.lastStage !== item.stage) {
        if (item.stage === 'belt_to_wrap' && vis.lastStage === 'producing') {
          vis.glowColor = 0x4ade80;
          vis.glowDuration = 0.55;
          vis.glowTimer = 0.55;
          this.spawnStageParticles(item.x, item.y + 0.28, item.z, 'producing', item.isGolden);
        } else if (
          item.stage === 'belt_to_ribbon' &&
          (vis.lastStage === 'wrapping' || vis.lastStage === 'belt_to_wrap')
        ) {
          vis.glowColor = 0x38bdf8;
          vis.glowDuration = 0.92;
          vis.glowTimer = 0.92;
          vis.popTimer = 0.28;
          this.spawnStageParticles(item.x, item.y + 0.36, item.z, 'wrapping', item.isGolden);
        } else if (
          item.stage === 'belt_to_storage' &&
          (vis.lastStage === 'ribboning' || vis.lastStage === 'belt_to_ribbon')
        ) {
          vis.glowColor = item.isGolden ? 0xfef08a : 0xfacc15;
          vis.glowDuration = 1.05;
          vis.glowTimer = 1.05;
          vis.popTimer = 0.34;
          this.spawnStageParticles(item.x, item.y + 0.44, item.z, 'ribboning', item.isGolden);
        }
        vis.lastStage = item.stage;
      }

      // Animate per-item stage glow aura & belt pulse ring
      if (vis.glowTimer > 0) {
        vis.glowTimer = Math.max(0, vis.glowTimer - dt);
        const t = 1 - vis.glowTimer / vis.glowDuration;
        const flash = Math.pow(1 - t, 1.5);
        vis.glowMat.color.setHex(vis.glowColor);
        vis.glowMat.opacity = 0.58 * flash;
        vis.glowShell.visible = true;
        vis.glowShell.scale.setScalar(1.0 + t * 0.24);
        vis.glowRing.visible = true;
        vis.glowRing.scale.setScalar(0.68 + t * 1.25);
      } else if (item.stage === 'belt_to_ribbon' || item.stage === 'ribboning') {
        vis.glowShell.visible = false;
        vis.glowRing.visible = true;
        vis.glowMat.color.setHex(0x38bdf8);
        vis.glowMat.opacity = 0.16;
        vis.glowRing.scale.setScalar(0.95 + Math.sin(this.elapsed * 4 + item.id) * 0.05);
      } else if (item.stage === 'belt_to_storage') {
        vis.glowShell.visible = false;
        vis.glowRing.visible = true;
        vis.glowMat.color.setHex(item.isGolden ? 0xfef08a : 0xfacc15);
        vis.glowMat.opacity = item.isGolden ? 0.28 : 0.2;
        vis.glowRing.scale.setScalar(1.04 + Math.sin(this.elapsed * 4.5 + item.id) * 0.06);
      } else {
        vis.glowShell.visible = false;
        vis.glowRing.visible = false;
      }

      let popBoost = 1;
      if (vis.popTimer > 0) {
        vis.popTimer = Math.max(0, vis.popTimer - dt);
        popBoost = 1 + Math.sin((vis.popTimer / 0.34) * Math.PI) * 0.22;
      }

      if (item.stage === 'producing') {
        const s = THREE.MathUtils.clamp(item.progress * 1.2, 0.1, 1);
        vis.toyMesh.visible = true;
        vis.toyMesh.scale.setScalar(s);
        vis.boxMesh.visible = false;
        vis.ribbonMesh.visible = false;
      } else if (item.stage === 'belt_to_wrap') {
        vis.toyMesh.visible = true;
        vis.toyMesh.scale.setScalar(1);
        vis.toyMesh.rotation.y += simDt * 1.2;
        vis.boxMesh.visible = false;
        vis.ribbonMesh.visible = false;
      } else if (item.stage === 'wrapping') {
        vis.toyMesh.visible = item.progress < 0.6;
        vis.boxMesh.visible = true;
        const boxScale = THREE.MathUtils.clamp(item.progress * 1.4, 0.2, 1);
        vis.boxMesh.scale.set(boxScale, boxScale, boxScale);
        vis.ribbonMesh.visible = false;
      } else if (item.stage === 'belt_to_ribbon') {
        vis.toyMesh.visible = false;
        vis.boxMesh.visible = true;
        vis.boxMesh.scale.setScalar(popBoost);
        vis.ribbonMesh.visible = false;
      } else if (item.stage === 'ribboning') {
        vis.toyMesh.visible = false;
        vis.boxMesh.visible = true;
        vis.boxMesh.scale.setScalar(1);
        vis.ribbonMesh.visible = item.progress > 0.3;
        const rScale = THREE.MathUtils.clamp((item.progress - 0.3) * 1.8, 0.1, 1);
        vis.ribbonMesh.scale.setScalar(rScale);
      } else {
        vis.toyMesh.visible = false;
        vis.boxMesh.visible = true;
        vis.boxMesh.scale.setScalar(popBoost);
        vis.ribbonMesh.visible = true;
        vis.ribbonMesh.scale.setScalar(popBoost);
      }
    }

    // Return finished items to object pool (zero GPU allocations/disposals!)
    for (const [id, vis] of this.itemMeshes.entries()) {
      if (!this.activeItemIds.has(id)) {
        vis.visible = false;
        this.itemMeshes.delete(id);
        let pool = this.itemPool.get(vis.poolKey);
        if (!pool) {
          pool = [];
          this.itemPool.set(vis.poolKey, pool);
        }
        if (pool.length < 24) {
          pool.push(vis);
        } else {
          this.scene.remove(vis);
        }
      }
    }

    // Production Lines + Speed LEDs + Machine Tiers + Elf Workers
    const litSpeedLeds = running
      ? Math.min(5, Math.ceil(state.upgrades.conveyorSpeed / 2))
      : 0;
    const goldenTierActive = state.upgrades.goldenChance >= 2;

    for (let l = 0; l < LINE_IDS.length; l++) {
      const lineId = LINE_IDS[l];
      const line = state.lines[lineId];
      const rig = this.lineRigs[lineId];

      rig.lockedOverlay.visible = !line.unlocked;
      rig.toyMaker.upgradeCrown.visible = line.toyMakerLevel >= 2;
      rig.toyMaker.turboStack.visible = line.toyMakerLevel >= 3;
      rig.ribboner.goldenBeacon.visible = line.unlocked && goldenTierActive;
      if (rig.ribboner.goldenBeacon.visible && rig.ribboner.goldenBeacon.children[0]) {
        rig.ribboner.goldenBeacon.children[0].rotation.y += dt * 2.2;
      }

      // Conveyor Speed LEDs along rail (shared ledOnMat / ledOffMat)
      for (let i = 0; i < rig.speedLeds.length; i++) {
        const targetMat =
          line.unlocked && i < litSpeedLeds
            ? this.sharedGifts.ledOnMat
            : this.sharedGifts.ledOffMat;
        if (rig.speedLeds[i].material !== targetMat) {
          rig.speedLeds[i].material = targetMat;
        }
      }

      // Machine status beacons
      const beaconIntensity = line.unlocked && running ? (overloaded ? 0.65 : 1.5) : 0.15;
      (rig.toyMaker.beacon.material as THREE.MeshStandardMaterial).emissiveIntensity =
        beaconIntensity;
      (rig.wrapper.beacon.material as THREE.MeshStandardMaterial).emissiveIntensity =
        beaconIntensity;
      (rig.ribboner.beacon.material as THREE.MeshStandardMaterial).emissiveIntensity =
        beaconIntensity;

      // Elf Workers visibility & conveyor-belt patrol animation (2 elves per hired worker tier)
      const visibleWorkerCount = line.unlocked ? Math.min(rig.workers.length, line.workers * 2) : 0;
      for (let w = 0; w < rig.workers.length; w++) {
        const worker = rig.workers[w];
        const visible = w < visibleWorkerCount;
        worker.group.visible = visible;
        if (visible) {
          this.updateElfPatrol(worker, running, dt, 0, false);
        }
      }

      if (line.unlocked && running) {
        const lineSpeed = simDt * prodMult;
        if (rig.beltMat.map) {
          rig.beltMat.map.offset.x -= simDt * beltSpeed * 0.7;
        }
        for (let r = 0; r < rig.rollers.length; r++) {
          rig.rollers[r].rotation.z -= simDt * beltSpeed * 3.2;
        }

        const makerSpeed = lineSpeed * (1 + (line.toyMakerLevel - 1) * 0.25);
        rig.toyMaker.gears[0].rotation.z += makerSpeed * 2.8;
        rig.toyMaker.gears[1].rotation.z -= makerSpeed * 2.8;
        rig.toyMaker.piston.position.y =
          1.45 + Math.sin(this.elapsed * 5.2 * state.gameSpeed * eff) * 0.22;

        const wrapProg = this.lineWrapping[lineId];
        const armAngle =
          wrapProg >= 0
            ? Math.sin(wrapProg * Math.PI) * 0.55
            : 0.08 * Math.sin(this.elapsed * 2.0);
        rig.wrapper.leftArm.rotation.x = armAngle;
        rig.wrapper.rightArm.rotation.x = -armAngle;
        rig.wrapper.pressHead.position.y =
          wrapProg >= 0 ? 1.85 - Math.sin(wrapProg * Math.PI) * 0.35 : 1.85;
        if (wrapProg >= 0) {
          rig.wrapper.paperRoll.rotation.z -= simDt * 6.0;
        }

        const ribProg = this.lineRibboning[lineId];
        rig.ribboner.spool.rotation.z += lineSpeed * 3.0;
        rig.ribboner.stamper.position.y =
          ribProg >= 0 ? 1.75 - Math.sin(ribProg * Math.PI) * 0.42 : 1.75;
      }
    }

    // Bonus Workshop Corridor Elves scaling with total hired workers across the factory
    let totalWorkers = 0;
    for (let l = 0; l < LINE_IDS.length; l++) {
      totalWorkers += state.lines[LINE_IDS[l]].workers;
    }
    const floorElfThresholds = [2, 4, 6, 9, 12, 15];
    for (let i = 0; i < this.floorElves.length; i++) {
      const elf = this.floorElves[i];
      const visible = totalWorkers >= floorElfThresholds[i];
      elf.group.visible = visible;
      if (visible) {
        this.updateElfPatrol(elf, running, dt, 0.36, true);
      }
    }

    // Storage Rack Tiers & Physical Boxes (dirty-checked; zero per-frame material churn)
    this.storageBay.extraRack.visible = state.upgrades.storageCapacity >= 2;
    this.storageBay.megaRack.visible = state.upgrades.storageCapacity >= 3;
    const storedCount = getTotalStored(state);
    if (
      storedCount !== this.lastStoredCount ||
      state.goldenStored !== this.lastGoldenStored
    ) {
      this.lastStoredCount = storedCount;
      this.lastGoldenStored = state.goldenStored;
      const goldSlots = Math.min(storedCount, state.goldenStored);
      for (let i = 0; i < this.storageBay.slots.length; i++) {
        const visible = i < storedCount;
        this.storageBay.slots[i].visible = visible;
        if (visible) {
          const targetMat =
            i < goldSlots
              ? this.sharedGifts.goldWrapMat
              : this.sharedGifts.regularWrapMat;
          if (this.storageBay.slotBoxes[i].material !== targetMat) {
            this.storageBay.slotBoxes[i].material = targetMat;
          }
        }
      }
    }

    // Delivery Truck & Fleet Upgrade Kit
    this.truckRig.fleetUpgradeKit.visible = state.upgrades.truckFleet >= 2;
    const truck = state.truck;
    const dockZ = 1.5;
    if (truck.phase === 'docked' || truck.phase === 'loading') {
      this.truckRig.group.position.z = dockZ;
    } else if (truck.phase === 'delivering') {
      const eased = truck.phaseProgress * truck.phaseProgress;
      this.truckRig.group.position.z = dockZ + eased * 34;
      this.truckRig.wheels.forEach((w) => {
        w.rotation.x += dt * state.gameSpeed * 12;
      });
    } else if (truck.phase === 'returning') {
      const inv = 1 - truck.phaseProgress;
      this.truckRig.group.position.z = dockZ - inv * inv * 34;
      this.truckRig.wheels.forEach((w) => {
        w.rotation.x += dt * state.gameSpeed * 10;
      });
    }

    const visibleCargo = Math.min(this.truckRig.cargoVisuals.length, truck.cargoCount);
    for (let i = 0; i < this.truckRig.cargoVisuals.length; i++) {
      this.truckRig.cargoVisuals[i].visible = i < visibleCargo;
    }

    // Santa Express Cargo Train (2nd Wagon + Semaphore Signal + 24 Cargo Slots)
    const train = state.train;
    this.trainRig.trainGroup.visible = train.unlocked;
    this.trainRig.secondWagon.visible = train.unlocked && train.level >= 2;

    if (!train.unlocked) {
      this.trainRig.signalBulbMat.color.setHex(0x475569);
      this.trainRig.signalBulbMat.emissive.setHex(0x000000);
      this.trainRig.signalBulbMat.emissiveIntensity = 0;
    } else if (train.phase === 'arriving' || train.phase === 'loading') {
      this.trainRig.signalBulbMat.color.setHex(0x22c55e);
      this.trainRig.signalBulbMat.emissive.setHex(0x22c55e);
      this.trainRig.signalBulbMat.emissiveIntensity = 1.6;
    } else {
      this.trainRig.signalBulbMat.color.setHex(0xef4444);
      this.trainRig.signalBulbMat.emissive.setHex(0xef4444);
      this.trainRig.signalBulbMat.emissiveIntensity = 1.4;
    }

    if (train.unlocked) {
      const stationZ = -4.2;
      if (train.phase === 'loading') {
        this.trainRig.trainGroup.position.z = stationZ;
      } else if (train.phase === 'arriving') {
        const inv = 1 - train.phaseProgress;
        this.trainRig.trainGroup.position.z = stationZ - inv * inv * 40;
        this.trainRig.wheels.forEach((w) => {
          w.rotation.x += dt * state.gameSpeed * 10;
        });
      } else if (train.phase === 'departing') {
        const eased = train.phaseProgress * train.phaseProgress;
        this.trainRig.trainGroup.position.z = stationZ + eased * 44;
        this.trainRig.wheels.forEach((w) => {
          w.rotation.x += dt * state.gameSpeed * 12;
        });
      } else if (train.phase === 'away') {
        this.trainRig.trainGroup.position.z = -50;
      }

      const visibleTrainCargo = Math.min(
        this.trainRig.cargoVisuals.length,
        train.cargoCount,
      );
      for (let i = 0; i < this.trainRig.cargoVisuals.length; i++) {
        this.trainRig.cargoVisuals[i].visible = i < visibleTrainCargo;
      }
    }
  }

  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    window.clearTimeout(this.frameId);
    window.removeEventListener('resize', this.handleResize);
    this.renderer.domElement.removeEventListener('pointerdown', this.handlePointerDown);
    this.renderer.domElement.removeEventListener('pointerup', this.handlePointerUp);

    this.controls.dispose();
    this.textures.dispose();
    this.sparkleGeo.dispose();
    this.smokeGeo.dispose();

    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material?.dispose();
        }
      }
    });

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
