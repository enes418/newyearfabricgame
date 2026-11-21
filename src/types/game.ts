export type ToyType =
  | 'train'
  | 'car'
  | 'teddy_bear'
  | 'robot'
  | 'doll'
  | 'snow_globe'
  | 'nutcracker'
  | 'rocket'
  | 'sleigh';

export type LineId = 'line1' | 'line2' | 'line3' | 'line4' | 'line5' | 'line6';

export type MachineKind =
  | 'toy_maker'
  | 'wrapper'
  | 'ribboner'
  | 'generator'
  | 'train_station';

export type ItemStage =
  | 'producing'
  | 'belt_to_wrap'
  | 'wrapping'
  | 'belt_to_ribbon'
  | 'ribboning'
  | 'belt_to_storage';

export interface ProductionItem {
  id: number;
  lineId: LineId;
  toyType: ToyType;
  isGolden: boolean;
  stage: ItemStage;
  progress: number; // 0..1 within current stage
  value: number;
  x: number;
  y: number;
  z: number;
}

export interface LineState {
  id: LineId;
  name: string;
  subtitle: string;
  floor: 1 | 2 | 3;
  toyType: ToyType;
  availableToys: ToyType[];
  unlocked: boolean;
  unlockCost: number;
  toyMakerLevel: number;
  wrapperLevel: number;
  ribbonerLevel: number;
  workers: number; // Elf workers assigned to this line (0..4)
  spawnTimer: number;
}

export interface UpgradeLevels {
  conveyorSpeed: number;
  productionBoost: number;
  storageCapacity: number;
  giftValue: number;
  giftTier: number;
  truckFleet: number;
  treeMagic: number;
  goldenChance: number;
  elfAcademy: number;
  orderBonus: number;
  nightShift: number;
}

export interface PowerState {
  generatorLevel: number;
  capacityKw: number;
  usedKw: number;
  efficiency: number; // 0.35 .. 1.0
}

export type WeatherKind = 'snow' | 'blizzard' | 'clear';

export interface EnvironmentState {
  timeOfDay: number; // 0..1 (0.25=noon, 0.75=midnight)
  autoCycle: boolean;
  weather: WeatherKind;
  weatherTimer: number;
}

export type OrderRequirementType =
  | 'produce_train'
  | 'produce_car'
  | 'pack_bear'
  | 'produce_robot'
  | 'produce_doll'
  | 'produce_snow_globe'
  | 'produce_nutcracker'
  | 'produce_rocket'
  | 'produce_sleigh'
  | 'deliver_golden'
  | 'deliver_any';

export interface SantaOrder {
  id: string;
  title: string;
  description: string;
  type: OrderRequirementType;
  target: number;
  progress: number;
  rewardCoins: number;
  rewardXp: number;
  completed: boolean;
  claimed: boolean;
}

export type TruckPhase = 'docked' | 'loading' | 'delivering' | 'returning';

export interface TruckState {
  phase: TruckPhase;
  phaseProgress: number; // 0..1
  cargo: Record<ToyType, number>;
  cargoCount: number;
  cargoValue: number;
  goldenCargoCount: number;
  loadCooldown: number;
}

export type TrainPhase = 'locked' | 'arriving' | 'loading' | 'departing' | 'away';

export interface TrainState {
  unlocked: boolean;
  level: number;
  phase: TrainPhase;
  phaseProgress: number; // 0..1
  cargoCount: number;
  cargoValue: number;
  goldenCargoCount: number;
  loadCooldown: number;
}

export type StoredInventory = Record<ToyType, number>;

export type AchievementCategory = 'production' | 'machines' | 'wealth' | 'factory';

export interface AchievementDef {
  id: string;
  category: AchievementCategory;
  title: string;
  description: string;
  metric:
    | 'produced'
    | 'coins'
    | 'earned'
    | 'orders'
    | 'golden'
    | 'workers'
    | 'floor2'
    | 'floor3'
    | 'rebirth'
    | 'line_machines_max'
    | 'all_machines_max';
  target: number;
  rewardCoins: number;
  rewardXp: number;
}

export interface SelectedMachineInfo {
  kind: MachineKind | 'storage' | 'truck' | 'tree';
  lineId?: LineId;
  title: string;
}

export interface GameState {
  coins: number;
  totalEarned: number;
  totalProduced: number;
  totalGoldenProduced: number;
  completedOrders: number;
  rebirthCount: number;
  level: number;
  xp: number;
  xpToNext: number;
  isRunning: boolean;
  gameSpeed: 1 | 2 | 3;
  muted: boolean;
  musicEnabled: boolean;
  tutorialSeen: boolean;
  floor2Unlocked: boolean;
  floor3Unlocked: boolean;
  lines: Record<LineId, LineState>;
  upgrades: UpgradeLevels;
  power: PowerState;
  environment: EnvironmentState;
  stored: StoredInventory;
  goldenStored: number;
  truck: TruckState;
  train: TrainState;
  orders: SantaOrder[];
  nextOrderSeq: number;
  unlockedAchievements: string[];
  claimedAchievements: string[];
  items: ProductionItem[];
  nextItemId: number;
  recentProducedTimestamps: number[];
}

export type LeftTab = 'factory' | 'shop' | 'upgrades' | 'orders' | 'achievements' | 'rebirth';

export type CameraAction =
  | { type: 'zoom_in' }
  | { type: 'zoom_out' }
  | { type: 'rotate_left' }
  | { type: 'rotate_right' }
  | { type: 'reset' }
  | { type: 'focus_line'; lineId: LineId };

export interface FloatingEvent {
  id: number;
  text: string;
  color: 'gold' | 'green' | 'red';
}

export interface MajorUnlockBanner {
  id: number;
  badge: string;
  title: string;
  subtitle: string;
  accent: 'gold' | 'emerald' | 'fuchsia' | 'sky';
}

export interface AchievementUnlockNotification {
  id: number;
  achievementId: string;
  title: string;
  description: string;
  rewardCoins: number;
  rewardXp: number;
}
