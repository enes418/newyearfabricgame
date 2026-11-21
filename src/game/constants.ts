import type {
  AchievementDef,
  GameState,
  LineId,
  OrderRequirementType,
  SantaOrder,
  ToyType,
} from '../types/game';

export const STORAGE_KEY = 'christmas_factory_tycoon_v2';

export const LINE_IDS: readonly LineId[] = ['line1', 'line2', 'line3', 'line4', 'line5', 'line6'];

export const LINE_Z_POSITIONS: Record<LineId, number> = {
  line1: -4.2,
  line2: -0.2,
  line3: 3.8,
  line4: -3.2,
  line5: 1.5,
  line6: -3.2,
};

export const LINE_Y_BASE: Record<LineId, number> = {
  line1: 0.36,
  line2: 0.36,
  line3: 0.36,
  line4: 4.16,
  line5: 4.16,
  line6: 7.96,
};

export const MACHINE_X_POSITIONS = {
  toy_maker: -6.5,
  belt1_start: -5.4,
  belt1_end: -1.8,
  wrapper: -1.0,
  belt2_start: -0.1,
  belt2_end: 2.7,
  ribboner: 3.5,
  belt3_start: 4.4,
  belt3_end: 6.7,
  storage: 7.9,
};

export const MAX_MACHINE_LEVEL = 15;
export const MAX_GENERATOR_LEVEL = 20;
export const MAX_TRAIN_LEVEL = 10;

export function calcExponentialCost(
  baseCost: number,
  growthRate: number,
  level: number,
  tierFactor = 1,
): number {
  const safeLevel = Math.max(1, level);
  const baseExp = Math.pow(growthRate, safeLevel - 1);
  const lateBoost = safeLevel > 6 ? Math.pow(1.18, safeLevel - 6) : 1;
  return Math.round(baseCost * tierFactor * baseExp * lateBoost);
}

export const TOY_BASE_VALUES: Record<ToyType, number> = {
  train: 10,
  car: 14,
  teddy_bear: 24,
  doll: 34,
  snow_globe: 52,
  nutcracker: 76,
  robot: 105,
  rocket: 155,
  sleigh: 230,
};

export const TOY_LABELS: Record<ToyType, string> = {
  train: 'Tren',
  car: 'Araba',
  teddy_bear: 'Ayı',
  robot: 'Robot',
  doll: 'Bebek',
  snow_globe: 'Kar Küresi',
  nutcracker: 'Fındıkkıran',
  rocket: 'Roket',
  sleigh: 'Altın Kızak',
};

export function getXpForLevel(level: number): number {
  return Math.round(180 * Math.pow(1.48, level - 1));
}

export function getRebirthMultiplier(rebirthCount: number): number {
  return Math.pow(1.5, Math.max(0, rebirthCount));
}

export function getRebirthCost(rebirthCount: number): number {
  return Math.round(1500000 * Math.pow(4.5, Math.max(0, rebirthCount)));
}

export function getStorageCapacity(upgradeLevel: number): number {
  return 16 + (upgradeLevel - 1) * 12;
}

export function getTruckCapacity(upgradeLevel: number): number {
  return 6 + (upgradeLevel - 1) * 4;
}

export function getTrainCapacity(trainLevel: number): number {
  return 14 + (trainLevel - 1) * 8;
}

export function getConveyorSpeed(upgradeLevel: number): number {
  return 1 + (upgradeLevel - 1) * 0.16;
}

export function getProductionMultiplier(upgradeLevel: number): number {
  return 1 + (upgradeLevel - 1) * 0.12;
}

export interface GiftTierMeta {
  tier: number;
  name: string;
  colorName: string;
  hex: number;
  cssColor: string;
  ribbonHex: number;
  upgradeCost: number;
  multiplier: number;
}

export const GIFT_TIERS: GiftTierMeta[] = [
  {
    tier: 1,
    name: 'Klasik Kırmızı Hediye',
    colorName: 'Kırmızı',
    hex: 0xdc2626,
    cssColor: '#dc2626',
    ribbonHex: 0xfacc15,
    upgradeCost: 0,
    multiplier: 1.0,
  },
  {
    tier: 2,
    name: 'Buzul Mavi Hediye',
    colorName: 'Mavi',
    hex: 0x2563eb,
    cssColor: '#2563eb',
    ribbonHex: 0xfef08a,
    upgradeCost: 450,
    multiplier: 1.25,
  },
  {
    tier: 3,
    name: 'Çam Yeşili Hediye',
    colorName: 'Yeşil',
    hex: 0x16a34a,
    cssColor: '#16a34a',
    ribbonHex: 0xfacc15,
    upgradeCost: 1800,
    multiplier: 1.55,
  },
  {
    tier: 4,
    name: 'Kraliyet Moru Hediye',
    colorName: 'Mor',
    hex: 0x9333ea,
    cssColor: '#9333ea',
    ribbonHex: 0xfde047,
    upgradeCost: 7200,
    multiplier: 1.95,
  },
  {
    tier: 5,
    name: 'Elmas Turkuaz Hediye',
    colorName: 'Turkuaz',
    hex: 0x06b6d4,
    cssColor: '#06b6d4',
    ribbonHex: 0xffffff,
    upgradeCost: 28000,
    multiplier: 2.45,
  },
  {
    tier: 6,
    name: 'Yakut Pembe Hediye',
    colorName: 'Yakut',
    hex: 0xe11d48,
    cssColor: '#e11d48',
    ribbonHex: 0xfef08a,
    upgradeCost: 110000,
    multiplier: 3.1,
  },
  {
    tier: 7,
    name: 'Saf Altın Varak Hediye',
    colorName: 'Altın',
    hex: 0xeab308,
    cssColor: '#eab308',
    ribbonHex: 0xffffff,
    upgradeCost: 420000,
    multiplier: 3.9,
  },
  {
    tier: 8,
    name: 'Kuzey Işığı Prizma Hediye',
    colorName: 'Prizma',
    hex: 0x8b5cf6,
    cssColor: '#8b5cf6',
    ribbonHex: 0x67e8f9,
    upgradeCost: 1600000,
    multiplier: 5.0,
  },
];

export function getGiftTierMeta(tier: number): GiftTierMeta {
  const idx = Math.max(0, Math.min(GIFT_TIERS.length - 1, Math.floor(tier) - 1));
  return GIFT_TIERS[idx];
}

export function getGiftValueMultiplier(
  upgradeLevel: number,
  giftTier = 1,
  rebirthCount = 0,
): number {
  const tierMeta = getGiftTierMeta(giftTier);
  return (
    tierMeta.multiplier *
    (1 + (upgradeLevel - 1) * 0.12) *
    getRebirthMultiplier(rebirthCount)
  );
}

export function getGoldenChance(upgradeLevel: number): number {
  return Math.min(0.28, 0.04 + (upgradeLevel - 1) * 0.025);
}

export function getGeneratorCapacityKw(generatorLevel: number): number {
  return 28 + (generatorLevel - 1) * 22;
}

export function getGeneratorUpgradeCost(currentLevel: number): number {
  return calcExponentialCost(450, 2.1, currentLevel);
}

const LINE_COST_FACTORS: Record<LineId, number> = {
  line1: 1,
  line2: 2.8,
  line3: 7.5,
  line4: 20,
  line5: 55,
  line6: 150,
};

export function getWorkerHireCost(lineId: LineId, currentWorkers: number): number {
  return Math.round(350 * LINE_COST_FACTORS[lineId] * Math.pow(2.6, currentWorkers));
}

export function getTrainUnlockCost(): number {
  return 12000;
}

export function getTrainUpgradeCost(currentLevel: number): number {
  return calcExponentialCost(7500, 2.2, currentLevel);
}

export function getMachineUpgradeCost(
  kind: 'toy_maker' | 'wrapper' | 'ribboner',
  lineId: LineId,
  currentLevel: number,
): number {
  const base = kind === 'toy_maker' ? 220 : kind === 'wrapper' ? 260 : 300;
  return calcExponentialCost(base, 1.95, currentLevel, LINE_COST_FACTORS[lineId]);
}

export function computePowerUsage(state: GameState): number {
  let kw = 2;
  const powerSaving = Math.max(0.55, 1 - (state.upgrades.nightShift - 1) * 0.06);
  for (let i = 0; i < LINE_IDS.length; i++) {
    const line = state.lines[LINE_IDS[i]];
    if (!line.unlocked) continue;
    kw += 6 + line.toyMakerLevel * 2 + line.wrapperLevel * 2 + line.ribbonerLevel * 2;
  }
  if (state.train.unlocked) kw += 6;
  return Math.max(2, Math.round(kw * powerSaving));
}

export interface GlobalUpgradeMeta {
  id: keyof GameState['upgrades'];
  name: string;
  description: string;
  baseCost: number;
  growth: number;
  maxLevel: number;
  effectText: (level: number) => string;
}

export const GLOBAL_UPGRADES: GlobalUpgradeMeta[] = [
  {
    id: 'conveyorSpeed',
    name: 'Konveyör Bandı Hızı',
    description: 'Tüm üretim bantlarının akış hızını artırır.',
    baseCost: 240,
    growth: 2.05,
    maxLevel: 12,
    effectText: (lvl) => `%${Math.round(getConveyorSpeed(lvl) * 100)} Bant Hızı`,
  },
  {
    id: 'productionBoost',
    name: 'Turbo Makine Dişlileri',
    description: 'Tüm makinelerin işleme ve paketleme hızını yükseltir.',
    baseCost: 340,
    growth: 2.15,
    maxLevel: 12,
    effectText: (lvl) => `%${Math.round(getProductionMultiplier(lvl) * 100)} Üretim`,
  },
  {
    id: 'storageCapacity',
    name: 'Genişletilmiş Depo',
    description: 'Hediye raf kapasitesini artırarak duraksamayı önler.',
    baseCost: 260,
    growth: 1.98,
    maxLevel: 12,
    effectText: (lvl) => `${getStorageCapacity(lvl)} Hediye Kapasitesi`,
  },
  {
    id: 'giftValue',
    name: 'Altın Kurdele Kalitesi',
    description: 'Teslim edilen her hediyeden kazanılan parayı artırır.',
    baseCost: 380,
    growth: 2.25,
    maxLevel: 12,
    effectText: (lvl) => `x${(1 + (lvl - 1) * 0.12).toFixed(2)} Değer`,
  },
  {
    id: 'goldenChance',
    name: 'Altın Hediye Şansı',
    description: '3x değerinde nadir Altın Hediye üretme ihtimalini artırır.',
    baseCost: 480,
    growth: 2.2,
    maxLevel: 10,
    effectText: (lvl) => `%${(getGoldenChance(lvl) * 100).toFixed(1)} Nadir Şans`,
  },
  {
    id: 'truckFleet',
    name: 'Noel Kamyonu Güçlendirme',
    description: 'Kamyon kapasitesini ve teslimat sefer hızını artırır.',
    baseCost: 320,
    growth: 2.08,
    maxLevel: 12,
    effectText: (lvl) => `${getTruckCapacity(lvl)} Kutu / Sefer`,
  },
  {
    id: 'treeMagic',
    name: 'Noel Ağacı Büyüsü',
    description: 'Atölyeye ekstra süsler ve siparişlerden bonus XP kazandırır.',
    baseCost: 280,
    growth: 2.02,
    maxLevel: 12,
    effectText: (lvl) => `+%${(lvl - 1) * 10} Bonus XP`,
  },
  {
    id: 'elfAcademy',
    name: 'Elf İşçi Akademisi',
    description: 'Fabrikadaki tüm Elf işçilerin üretim hızını kalıcı artırır.',
    baseCost: 520,
    growth: 2.18,
    maxLevel: 10,
    effectText: (lvl) => `+%${Math.round((0.18 + (lvl - 1) * 0.06) * 100)} / Elf`,
  },
  {
    id: 'orderBonus',
    name: 'Noel Baba VIP Anlaşması',
    description: 'Tamamlanan Noel Baba siparişlerinden daha fazla altın kazandırır.',
    baseCost: 560,
    growth: 2.16,
    maxLevel: 10,
    effectText: (lvl) => `+%${(lvl - 1) * 12} Sipariş Ödülü`,
  },
  {
    id: 'nightShift',
    name: 'Akıllı Enerji Otomasyonu',
    description: 'Makinelerin kW tüketimini düşürerek aşırı yükü önler.',
    baseCost: 420,
    growth: 2.08,
    maxLevel: 8,
    effectText: (lvl) => `-%${Math.min(45, (lvl - 1) * 6)} Güç Tüketimi`,
  },
];

export function getGlobalUpgradeCost(meta: GlobalUpgradeMeta, currentLevel: number): number {
  return calcExponentialCost(meta.baseCost, meta.growth, currentLevel);
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'ach_prod_15',
    category: 'production',
    title: 'İlk Seri Üretim',
    description: 'Toplam 15 hediye üret.',
    metric: 'produced',
    target: 15,
    rewardCoins: 120,
    rewardXp: 60,
  },
  {
    id: 'ach_prod_100',
    category: 'production',
    title: 'Atölye Ustası',
    description: 'Toplam 100 hediye üret.',
    metric: 'produced',
    target: 100,
    rewardCoins: 420,
    rewardXp: 160,
  },
  {
    id: 'ach_prod_500',
    category: 'production',
    title: 'Oyuncak İmparatoru',
    description: 'Toplam 500 hediye üret.',
    metric: 'produced',
    target: 500,
    rewardCoins: 2400,
    rewardXp: 480,
  },
  {
    id: 'ach_prod_2000',
    category: 'production',
    title: 'Kuzey Kutbu Devi',
    description: 'Toplam 2.000 hediye üret.',
    metric: 'produced',
    target: 2000,
    rewardCoins: 12000,
    rewardXp: 950,
  },
  {
    id: 'ach_coins_2500',
    category: 'wealth',
    title: 'İlk Birikim',
    description: 'Kasanda 2.500 Altın biriktir.',
    metric: 'coins',
    target: 2500,
    rewardCoins: 350,
    rewardXp: 120,
  },
  {
    id: 'ach_coins_25000',
    category: 'wealth',
    title: 'Altın Kasa',
    description: 'Kasanda 25.000 Altın biriktir.',
    metric: 'coins',
    target: 25000,
    rewardCoins: 2500,
    rewardXp: 380,
  },
  {
    id: 'ach_coins_250000',
    category: 'wealth',
    title: 'Yılbaşı Hazinedarı',
    description: 'Kasanda 250.000 Altın biriktir.',
    metric: 'coins',
    target: 250000,
    rewardCoins: 22000,
    rewardXp: 900,
  },
  {
    id: 'ach_earn_25000',
    category: 'wealth',
    title: 'Yılbaşı Milyoneri',
    description: 'Toplam 25.000 Altın kazan.',
    metric: 'earned',
    target: 25000,
    rewardCoins: 2800,
    rewardXp: 420,
  },
  {
    id: 'ach_line_max',
    category: 'machines',
    title: 'Tam Kapasite Hat',
    description: 'Bir üretim hattındaki 3 makineyi de Sv.15 (MAX) yap.',
    metric: 'line_machines_max',
    target: 3,
    rewardCoins: 4500,
    rewardXp: 450,
  },
  {
    id: 'ach_all_machines_max',
    category: 'machines',
    title: 'Kusursuz Fabrika',
    description: 'Tüm 6 hattı aç ve 18 makinenin tamamını Sv.15 (MAX) yap.',
    metric: 'all_machines_max',
    target: 18,
    rewardCoins: 120000,
    rewardXp: 2500,
  },
  {
    id: 'ach_golden_5',
    category: 'factory',
    title: 'Altın Dokunuş',
    description: '5 nadir Altın Hediye üret.',
    metric: 'golden',
    target: 5,
    rewardCoins: 450,
    rewardXp: 150,
  },
  {
    id: 'ach_workers_4',
    category: 'factory',
    title: 'Elf Ekibi',
    description: 'Fabrikada 4 Elf işçi çalıştır.',
    metric: 'workers',
    target: 4,
    rewardCoins: 600,
    rewardXp: 130,
  },
  {
    id: 'ach_orders_8',
    category: 'factory',
    title: 'Noel Baba’nın Gözdesi',
    description: '8 Noel Baba siparişi tamamla.',
    metric: 'orders',
    target: 8,
    rewardCoins: 950,
    rewardXp: 240,
  },
  {
    id: 'ach_floor2',
    category: 'factory',
    title: 'Çok Katlı Fabrika',
    description: '2. Kat Üretim Alanını aç.',
    metric: 'floor2',
    target: 1,
    rewardCoins: 3500,
    rewardXp: 380,
  },
  {
    id: 'ach_floor3',
    category: 'factory',
    title: 'Gök Atölyesi',
    description: '3. Kat Efsanevi Atölyeyi aç.',
    metric: 'floor3',
    target: 1,
    rewardCoins: 35000,
    rewardXp: 900,
  },
  {
    id: 'ach_rebirth_1',
    category: 'factory',
    title: 'Yeni Başlangıç (Rebirth)',
    description: 'İlk Rebirth işlemini gerçekleştir.',
    metric: 'rebirth',
    target: 1,
    rewardCoins: 5000,
    rewardXp: 500,
  },
  {
    id: 'ach_rebirth_3',
    category: 'factory',
    title: 'Kuzey Kutbu Efsanesi',
    description: '3. Rebirth seviyesine ulaş.',
    metric: 'rebirth',
    target: 3,
    rewardCoins: 25000,
    rewardXp: 1200,
  },
];

interface OrderTemplate {
  type: OrderRequirementType;
  title: string;
  baseTarget: number;
  baseCoins: number;
  baseXp: number;
  requiresLine2?: boolean;
  requiresLine3?: boolean;
  requiresLine4?: boolean;
  requiresLine5?: boolean;
  requiresLine6?: boolean;
}

const ORDER_TEMPLATES: OrderTemplate[] = [
  {
    type: 'produce_train',
    title: 'Klasik Tren Siparişi',
    baseTarget: 8,
    baseCoins: 100,
    baseXp: 70,
  },
  {
    type: 'produce_car',
    title: 'Yarış Arabası Sezonu',
    baseTarget: 8,
    baseCoins: 140,
    baseXp: 85,
  },
  {
    type: 'deliver_any',
    title: 'Kargo Acelesi',
    baseTarget: 14,
    baseCoins: 180,
    baseXp: 100,
  },
  {
    type: 'pack_bear',
    title: 'Peluş Ayı Paketi',
    baseTarget: 10,
    baseCoins: 340,
    baseXp: 145,
    requiresLine2: true,
  },
  {
    type: 'produce_doll',
    title: 'Koleksiyon Bebekler',
    baseTarget: 9,
    baseCoins: 440,
    baseXp: 180,
    requiresLine2: true,
  },
  {
    type: 'produce_snow_globe',
    title: 'Sihirli Kar Küresi',
    baseTarget: 8,
    baseCoins: 750,
    baseXp: 210,
    requiresLine3: true,
  },
  {
    type: 'produce_robot',
    title: 'Oyuncak Robot Serisi',
    baseTarget: 8,
    baseCoins: 1100,
    baseXp: 250,
    requiresLine3: true,
  },
  {
    type: 'produce_nutcracker',
    title: 'Fındıkkıran Alayı',
    baseTarget: 8,
    baseCoins: 1900,
    baseXp: 310,
    requiresLine4: true,
  },
  {
    type: 'produce_rocket',
    title: 'Yılbaşı Uzay Roketleri',
    baseTarget: 7,
    baseCoins: 3600,
    baseXp: 410,
    requiresLine5: true,
  },
  {
    type: 'produce_sleigh',
    title: 'Noel Baba Altın Kızakları',
    baseTarget: 6,
    baseCoins: 7500,
    baseXp: 580,
    requiresLine6: true,
  },
  {
    type: 'deliver_golden',
    title: 'Altın Hediye Talebi',
    baseTarget: 2,
    baseCoins: 320,
    baseXp: 160,
  },
];

export function generateSantaOrder(
  seq: number,
  factoryLevel: number,
  line2Unlocked: boolean,
  line3Unlocked: boolean,
  line4Unlocked = false,
  line5Unlocked = false,
  line6Unlocked = false,
  rebirthCount = 0,
): SantaOrder {
  const available = ORDER_TEMPLATES.filter((t) => {
    if (t.requiresLine2 && !line2Unlocked) return false;
    if (t.requiresLine3 && !line3Unlocked) return false;
    if (t.requiresLine4 && !line4Unlocked) return false;
    if (t.requiresLine5 && !line5Unlocked) return false;
    if (t.requiresLine6 && !line6Unlocked) return false;
    return true;
  });

  let template: OrderTemplate;
  let target: number;
  if (seq === 1) {
    template = ORDER_TEMPLATES[0];
    target = 8;
  } else if (seq === 2) {
    template = ORDER_TEMPLATES[2];
    target = 14;
  } else {
    template = available[(seq - 1) % available.length];
    const scale = 1 + (factoryLevel - 1) * 0.22;
    target = Math.max(
      template.type === 'deliver_golden' ? 2 : 6,
      Math.round(template.baseTarget * scale),
    );
  }

  const rewardScale = (1 + (factoryLevel - 1) * 0.16) * getRebirthMultiplier(rebirthCount);
  const rewardCoins = Math.round(template.baseCoins * rewardScale);
  const rewardXp = Math.round(template.baseXp * (1 + (factoryLevel - 1) * 0.18));

  const verbMap: Record<OrderRequirementType, string> = {
    produce_train: `${target} Oyuncak Tren Üret`,
    produce_car: `${target} Oyuncak Araba Üret`,
    pack_bear: `${target} Oyuncak Ayı Paketle`,
    produce_robot: `${target} Oyuncak Robot Üret`,
    produce_doll: `${target} Oyuncak Bebek Üret`,
    produce_snow_globe: `${target} Kar Küresi Üret`,
    produce_nutcracker: `${target} Fındıkkıran Üret`,
    produce_rocket: `${target} Uzay Roketi Üret`,
    produce_sleigh: `${target} Altın Kızak Üret`,
    deliver_golden: `${target} Altın Hediye Teslim Et`,
    deliver_any: `${target} Hediye Teslim Et`,
  };

  return {
    id: `order_${seq}`,
    title: template.title,
    description: verbMap[template.type],
    type: template.type,
    target,
    progress: 0,
    rewardCoins,
    rewardXp,
    completed: false,
    claimed: false,
  };
}

export function createEmptyInventory(): Record<ToyType, number> {
  return {
    train: 0,
    car: 0,
    teddy_bear: 0,
    robot: 0,
    doll: 0,
    snow_globe: 0,
    nutcracker: 0,
    rocket: 0,
    sleigh: 0,
  };
}

export function createInitialGameState(rebirthCount = 0): GameState {
  const startCoins = 100 + rebirthCount * 300;
  const base: GameState = {
    coins: startCoins,
    totalEarned: 0,
    totalProduced: 0,
    totalGoldenProduced: 0,
    completedOrders: 0,
    rebirthCount,
    level: 1,
    xp: 0,
    xpToNext: getXpForLevel(1),
    isRunning: true,
    gameSpeed: 1,
    muted: false,
    musicEnabled: true,
    tutorialSeen: false,
    floor2Unlocked: false,
    floor3Unlocked: false,
    lines: {
      line1: {
        id: 'line1',
        name: 'Ana Oyuncak Hattı',
        subtitle: 'Tren & Yarış Arabası',
        floor: 1,
        toyType: 'train',
        availableToys: ['train', 'car'],
        unlocked: true,
        unlockCost: 0,
        toyMakerLevel: 1,
        wrapperLevel: 1,
        ribbonerLevel: 1,
        workers: 0,
        spawnTimer: 1.8,
      },
      line2: {
        id: 'line2',
        name: 'Peluş & Klasik Atölye',
        subtitle: 'Oyuncak Ayı & Bebek',
        floor: 1,
        toyType: 'teddy_bear',
        availableToys: ['teddy_bear', 'doll'],
        unlocked: false,
        unlockCost: 1800,
        toyMakerLevel: 1,
        wrapperLevel: 1,
        ribbonerLevel: 1,
        workers: 0,
        spawnTimer: 0,
      },
      line3: {
        id: 'line3',
        name: 'Kar Küresi & Tekno Hattı',
        subtitle: 'Kar Küresi & Robot',
        floor: 1,
        toyType: 'snow_globe',
        availableToys: ['snow_globe', 'robot'],
        unlocked: false,
        unlockCost: 8500,
        toyMakerLevel: 1,
        wrapperLevel: 1,
        ribbonerLevel: 1,
        workers: 0,
        spawnTimer: 0,
      },
      line4: {
        id: 'line4',
        name: '2. Kat Lüks Hat',
        subtitle: 'Fındıkkıran, Robot & Bebek',
        floor: 2,
        toyType: 'nutcracker',
        availableToys: ['nutcracker', 'robot', 'doll'],
        unlocked: false,
        unlockCost: 38000,
        toyMakerLevel: 1,
        wrapperLevel: 1,
        ribbonerLevel: 1,
        workers: 0,
        spawnTimer: 0,
      },
      line5: {
        id: 'line5',
        name: '2. Kat Kuzey Ekspres',
        subtitle: 'Uzay Roketi & Fındıkkıran',
        floor: 2,
        toyType: 'rocket',
        availableToys: ['rocket', 'nutcracker', 'snow_globe'],
        unlocked: false,
        unlockCost: 165000,
        toyMakerLevel: 1,
        wrapperLevel: 1,
        ribbonerLevel: 1,
        workers: 0,
        spawnTimer: 0,
      },
      line6: {
        id: 'line6',
        name: '3. Kat Efsanevi Atölye',
        subtitle: 'Altın Kızak & Roket',
        floor: 3,
        toyType: 'sleigh',
        availableToys: ['sleigh', 'rocket', 'robot'],
        unlocked: false,
        unlockCost: 720000,
        toyMakerLevel: 1,
        wrapperLevel: 1,
        ribbonerLevel: 1,
        workers: 0,
        spawnTimer: 0,
      },
    },
    upgrades: {
      conveyorSpeed: 1,
      productionBoost: 1,
      storageCapacity: 1,
      giftValue: 1,
      giftTier: 1,
      truckFleet: 1,
      treeMagic: 1,
      goldenChance: 1,
      elfAcademy: 1,
      orderBonus: 1,
      nightShift: 1,
    },
    power: {
      generatorLevel: 1,
      capacityKw: getGeneratorCapacityKw(1),
      usedKw: 14,
      efficiency: 1,
    },
    environment: {
      timeOfDay: 0.72,
      autoCycle: true,
      weather: 'snow',
      weatherTimer: 26,
    },
    stored: createEmptyInventory(),
    goldenStored: 0,
    truck: {
      phase: 'docked',
      phaseProgress: 0,
      cargo: createEmptyInventory(),
      cargoCount: 0,
      cargoValue: 0,
      goldenCargoCount: 0,
      loadCooldown: 0,
    },
    train: {
      unlocked: false,
      level: 1,
      phase: 'locked',
      phaseProgress: 0,
      cargoCount: 0,
      cargoValue: 0,
      goldenCargoCount: 0,
      loadCooldown: 0,
    },
    orders: [
      generateSantaOrder(1, 1, false, false, false, false, false, rebirthCount),
      generateSantaOrder(2, 1, false, false, false, false, false, rebirthCount),
    ],
    nextOrderSeq: 3,
    unlockedAchievements: [],
    claimedAchievements: [],
    items: [],
    nextItemId: 1,
    recentProducedTimestamps: [],
  };

  base.power.usedKw = computePowerUsage(base);
  return base;
}
