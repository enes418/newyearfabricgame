import type {
  AchievementDef,
  FloatingEvent,
  GameState,
  LineId,
  OrderRequirementType,
  ProductionItem,
  ToyType,
} from '../types/game';
import {
  ACHIEVEMENTS,
  computePowerUsage,
  createEmptyInventory,
  createInitialGameState,
  generateSantaOrder,
  getConveyorSpeed,
  getGeneratorCapacityKw,
  getGiftValueMultiplier,
  getGoldenChance,
  getProductionMultiplier,
  getRebirthCost,
  getRebirthMultiplier,
  getStorageCapacity,
  getTrainCapacity,
  getTruckCapacity,
  getXpForLevel,
  LINE_IDS,
  LINE_Y_BASE,
  LINE_Z_POSITIONS,
  MACHINE_X_POSITIONS,
  MAX_MACHINE_LEVEL,
  TOY_BASE_VALUES,
} from './constants';

const _lineCounts: Record<LineId, number> = {
  line1: 0,
  line2: 0,
  line3: 0,
  line4: 0,
  line5: 0,
  line6: 0,
};

const PRIORITY_TOYS: readonly ToyType[] = [
  'sleigh',
  'rocket',
  'nutcracker',
  'snow_globe',
  'doll',
  'robot',
  'teddy_bear',
  'car',
  'train',
];

export type SimCallbackEvent =
  | {
      kind: 'sound';
      sfx: 'machine' | 'wrap' | 'ribbon' | 'coin' | 'truck' | 'train' | 'golden' | 'order';
    }
  | { kind: 'sparkle'; x: number; y: number; z: number; color: number }
  | { kind: 'toast'; event: Omit<FloatingEvent, 'id'> }
  | {
      kind: 'celebrate';
      badge: string;
      title: string;
      subtitle: string;
      accent: 'gold' | 'emerald' | 'fuchsia' | 'sky';
    }
  | {
      kind: 'achievement';
      achievementId: string;
      title: string;
      description: string;
      rewardCoins: number;
      rewardXp: number;
    };

export function getTotalStored(state: GameState): number {
  const s = state.stored;
  return (
    s.train +
    s.car +
    s.teddy_bear +
    s.robot +
    s.doll +
    s.snow_globe +
    s.nutcracker +
    s.rocket +
    s.sleigh
  );
}

export function getTotalWorkers(state: GameState): number {
  let total = 0;
  for (let i = 0; i < LINE_IDS.length; i++) {
    total += state.lines[LINE_IDS[i]].workers;
  }
  return total;
}

function getMaxedLineMachineCounts(state: GameState): {
  bestLineMaxCount: number;
  totalAllMaxCount: number;
} {
  let bestLineMaxCount = 0;
  let totalAllMaxCount = 0;
  for (let i = 0; i < LINE_IDS.length; i++) {
    const line = state.lines[LINE_IDS[i]];
    if (!line.unlocked) continue;
    let count = 0;
    if (line.toyMakerLevel >= MAX_MACHINE_LEVEL) count += 1;
    if (line.wrapperLevel >= MAX_MACHINE_LEVEL) count += 1;
    if (line.ribbonerLevel >= MAX_MACHINE_LEVEL) count += 1;
    if (count > bestLineMaxCount) bestLineMaxCount = count;
    totalAllMaxCount += count;
  }
  return { bestLineMaxCount, totalAllMaxCount };
}

export function getAchievementProgress(state: GameState, ach: AchievementDef): number {
  if (
    state.unlockedAchievements.includes(ach.id) ||
    state.claimedAchievements.includes(ach.id)
  ) {
    return ach.target;
  }
  switch (ach.metric) {
    case 'produced':
      return state.totalProduced;
    case 'coins':
      return Math.floor(state.coins);
    case 'earned':
      return state.totalEarned;
    case 'orders':
      return state.completedOrders;
    case 'golden':
      return state.totalGoldenProduced;
    case 'workers':
      return getTotalWorkers(state);
    case 'floor2':
      return state.floor2Unlocked ? 1 : 0;
    case 'floor3':
      return state.floor3Unlocked ? 1 : 0;
    case 'rebirth':
      return state.rebirthCount;
    case 'line_machines_max':
      return getMaxedLineMachineCounts(state).bestLineMaxCount;
    case 'all_machines_max':
      return getMaxedLineMachineCounts(state).totalAllMaxCount;
  }
}

export function checkAchievements(state: GameState): SimCallbackEvent[] {
  const events: SimCallbackEvent[] = [];
  const mult = getRebirthMultiplier(state.rebirthCount);

  for (let i = 0; i < ACHIEVEMENTS.length; i++) {
    const ach = ACHIEVEMENTS[i];
    if (
      state.unlockedAchievements.includes(ach.id) ||
      state.claimedAchievements.includes(ach.id)
    ) {
      continue;
    }
    if (getAchievementProgress(state, ach) >= ach.target) {
      state.unlockedAchievements.push(ach.id);
      events.push({ kind: 'sound', sfx: 'order' });
      events.push({
        kind: 'achievement',
        achievementId: ach.id,
        title: ach.title,
        description: ach.description,
        rewardCoins: Math.round(ach.rewardCoins * mult),
        rewardXp: ach.rewardXp,
      });
    }
  }
  return events;
}

export function claimAchievement(state: GameState, achId: string): SimCallbackEvent[] {
  const events: SimCallbackEvent[] = [];
  if (state.claimedAchievements.includes(achId)) return events;
  const ach = ACHIEVEMENTS.find((a) => a.id === achId);
  if (!ach) return events;
  const isReady =
    state.unlockedAchievements.includes(achId) ||
    getAchievementProgress(state, ach) >= ach.target;
  if (!isReady) return events;

  if (!state.unlockedAchievements.includes(achId)) {
    state.unlockedAchievements.push(achId);
  }
  state.claimedAchievements.push(achId);
  const rewardCoins = Math.round(ach.rewardCoins * getRebirthMultiplier(state.rebirthCount));
  state.coins += rewardCoins;
  state.totalEarned += rewardCoins;
  events.push({ kind: 'sound', sfx: 'order' });
  events.push({
    kind: 'toast',
    event: {
      text: `Başarım Ödülü: ${ach.title} (+${rewardCoins.toLocaleString('tr-TR')} 🪙)`,
      color: 'gold',
    },
  });
  awardXp(state, ach.rewardXp, events);
  events.push(...checkAchievements(state));
  return events;
}

export function claimAllAchievements(state: GameState): SimCallbackEvent[] {
  const events: SimCallbackEvent[] = [];
  for (let i = 0; i < ACHIEVEMENTS.length; i++) {
    const ach = ACHIEVEMENTS[i];
    if (state.claimedAchievements.includes(ach.id)) continue;
    const isReady =
      state.unlockedAchievements.includes(ach.id) ||
      getAchievementProgress(state, ach) >= ach.target;
    if (isReady) {
      events.push(...claimAchievement(state, ach.id));
    }
  }
  return events;
}

export function awardXp(state: GameState, rawXp: number, events: SimCallbackEvent[]) {
  const treeBonus = 1 + (state.upgrades.treeMagic - 1) * 0.1;
  state.xp += Math.round(rawXp * treeBonus);
  while (state.xp >= state.xpToNext) {
    state.xp -= state.xpToNext;
    state.level += 1;
    state.xpToNext = getXpForLevel(state.level);
    const levelBonusCoins = Math.round(
      state.level * 75 * getRebirthMultiplier(state.rebirthCount),
    );
    state.coins += levelBonusCoins;
    state.totalEarned += levelBonusCoins;
    events.push({ kind: 'sound', sfx: 'order' });
    events.push({
      kind: 'toast',
      event: {
        text: `Fabrika Seviye ${state.level}! +${levelBonusCoins.toLocaleString('tr-TR')} 🪙`,
        color: 'gold',
      },
    });
    events.push({
      kind: 'celebrate',
      badge: `SEVİYE ${state.level}`,
      title: `Fabrika Seviye ${state.level}'e Ulaştı!`,
      subtitle: `Seviye Bonusu: +${levelBonusCoins.toLocaleString('tr-TR')} 🪙`,
      accent: 'gold',
    });
  }
}

function advanceOrderProgress(
  state: GameState,
  type: OrderRequirementType,
  amount: number,
  events: SimCallbackEvent[],
) {
  for (const order of state.orders) {
    if (order.completed || order.type !== type) continue;
    order.progress = Math.min(order.target, order.progress + amount);
    if (order.progress >= order.target) {
      order.completed = true;
      events.push({ kind: 'sound', sfx: 'order' });
      events.push({
        kind: 'toast',
        event: {
          text: `Sipariş Hazır: ${order.title}!`,
          color: 'green',
        },
      });
    }
  }
}

function takeOneFromStorage(
  state: GameState,
  valueMult: number,
): { value: number; isGolden: boolean; toy: ToyType } | null {
  for (let i = 0; i < PRIORITY_TOYS.length; i++) {
    const t = PRIORITY_TOYS[i];
    if (state.stored[t] > 0) {
      state.stored[t] -= 1;
      let isGolden = false;
      if (state.goldenStored > 0) {
        state.goldenStored -= 1;
        isGolden = true;
      }
      const baseVal = Math.round(TOY_BASE_VALUES[t] * valueMult);
      const finalVal = isGolden ? baseVal * 3 : baseVal;
      return { value: finalVal, isGolden, toy: t };
    }
  }
  return null;
}

export function stepSimulation(state: GameState, rawDt: number): SimCallbackEvent[] {
  const events: SimCallbackEvent[] = [];
  const clampedRaw = Math.min(rawDt, 0.05);

  // 0. Dynamic Day-Night & Weather Cycle
  if (state.environment.autoCycle) {
    state.environment.timeOfDay = (state.environment.timeOfDay + clampedRaw * 0.011) % 1;
    state.environment.weatherTimer -= clampedRaw;
    if (state.environment.weatherTimer <= 0) {
      const order: Array<'snow' | 'blizzard' | 'clear'> = ['snow', 'blizzard', 'clear'];
      const nextIdx = (order.indexOf(state.environment.weather) + 1) % order.length;
      state.environment.weather = order[nextIdx];
      state.environment.weatherTimer = nextIdx === 1 ? 18 : 26;
    }
  }

  // Recompute Electricity Grid
  state.power.capacityKw = getGeneratorCapacityKw(state.power.generatorLevel);
  state.power.usedKw = computePowerUsage(state);
  state.power.efficiency =
    state.power.usedKw <= state.power.capacityKw
      ? 1
      : Math.max(0.4, state.power.capacityKw / state.power.usedKw);

  if (!state.isRunning) return events;

  const dt = clampedRaw * state.gameSpeed;
  const eff = state.power.efficiency;
  const prodDt = dt * eff;
  const nowSec = performance.now() / 1000;

  const timestamps = state.recentProducedTimestamps;
  while (timestamps.length > 0 && nowSec - timestamps[0] > 60) {
    timestamps.shift();
  }

  const beltSpeed = getConveyorSpeed(state.upgrades.conveyorSpeed) * eff;
  const globalProdMult = getProductionMultiplier(state.upgrades.productionBoost) * eff;
  const valueMult = getGiftValueMultiplier(
    state.upgrades.giftValue,
    state.upgrades.giftTier,
    state.rebirthCount,
  );
  const workerPerElfBonus = 0.18 + (state.upgrades.elfAcademy - 1) * 0.06;
  const goldenOdds = getGoldenChance(state.upgrades.goldenChance);
  const storageCap = getStorageCapacity(state.upgrades.storageCapacity);
  const truckCap = getTruckCapacity(state.upgrades.truckFleet);
  const trainCap = getTrainCapacity(state.train.level);

  // Count active items per line in a single pass
  for (let l = 0; l < LINE_IDS.length; l++) {
    _lineCounts[LINE_IDS[l]] = 0;
  }
  for (let i = 0; i < state.items.length; i++) {
    _lineCounts[state.items[i].lineId] += 1;
  }

  // 1. Spawn toys on unlocked lines
  for (let l = 0; l < LINE_IDS.length; l++) {
    const lineId = LINE_IDS[l];
    const line = state.lines[lineId];
    if (!line.unlocked) continue;

    const lineItemsCount = _lineCounts[lineId];
    const workerBonus = line.workers * workerPerElfBonus;
    const makerSpeed = (1 + (line.toyMakerLevel - 1) * 0.15 + workerBonus) * globalProdMult;

    line.spawnTimer -= dt * makerSpeed;
    if (line.spawnTimer <= 0) {
      if (lineItemsCount < 7 && getTotalStored(state) < storageCap + 4) {
        const z = LINE_Z_POSITIONS[lineId];
        const yBase = LINE_Y_BASE[lineId];
        const isGolden = Math.random() < goldenOdds;
        const baseVal = Math.round(TOY_BASE_VALUES[line.toyType] * valueMult);
        const item: ProductionItem = {
          id: state.nextItemId++,
          lineId,
          toyType: line.toyType,
          isGolden,
          stage: 'producing',
          progress: 0,
          value: isGolden ? baseVal * 3 : baseVal,
          x: MACHINE_X_POSITIONS.toy_maker,
          y: yBase + 0.89,
          z,
        };
        state.items.push(item);
        events.push({ kind: 'sound', sfx: 'machine' });
        line.spawnTimer = 4.0;
      } else {
        line.spawnTimer = 0.5;
      }
    }
  }

  // 2. Advance active items through all stages (in-place compaction)
  let writeIdx = 0;
  for (let i = 0; i < state.items.length; i++) {
    const item = state.items[i];
    const line = state.lines[item.lineId];
    const workerBonus = line.workers * workerPerElfBonus;
    const yBelt = LINE_Y_BASE[item.lineId] + 0.85;

    const makerRate = (1 + (line.toyMakerLevel - 1) * 0.15 + workerBonus) * globalProdMult;
    const wrapperRate = (1 + (line.wrapperLevel - 1) * 0.16 + workerBonus) * globalProdMult;
    const ribbonRate = (1 + (line.ribbonerLevel - 1) * 0.16 + workerBonus) * globalProdMult;

    let keep = true;

    if (item.stage === 'producing') {
      item.progress += prodDt * 1.15 * makerRate;
      item.x = MACHINE_X_POSITIONS.toy_maker + item.progress * 0.9;
      item.y = yBelt + 0.04;
      if (item.progress >= 1) {
        item.stage = 'belt_to_wrap';
        item.progress = 0;
        item.x = MACHINE_X_POSITIONS.belt1_start;
      }
    } else if (item.stage === 'belt_to_wrap') {
      item.progress += prodDt * 0.44 * beltSpeed;
      const t = Math.min(1, item.progress);
      item.x =
        MACHINE_X_POSITIONS.belt1_start +
        (MACHINE_X_POSITIONS.belt1_end - MACHINE_X_POSITIONS.belt1_start) * t;
      item.y = yBelt;
      if (item.progress >= 1) {
        item.stage = 'wrapping';
        item.progress = 0;
        item.x = MACHINE_X_POSITIONS.wrapper;
      }
    } else if (item.stage === 'wrapping') {
      item.progress += prodDt * 1.12 * wrapperRate;
      item.x = MACHINE_X_POSITIONS.wrapper;
      item.y = yBelt;
      if (item.progress >= 1) {
        item.stage = 'belt_to_ribbon';
        item.progress = 0;
        item.x = MACHINE_X_POSITIONS.belt2_start;
        events.push({ kind: 'sound', sfx: 'wrap' });
        if (item.toyType === 'teddy_bear') {
          advanceOrderProgress(state, 'pack_bear', 1, events);
        }
      }
    } else if (item.stage === 'belt_to_ribbon') {
      item.progress += prodDt * 0.47 * beltSpeed;
      const t = Math.min(1, item.progress);
      item.x =
        MACHINE_X_POSITIONS.belt2_start +
        (MACHINE_X_POSITIONS.belt2_end - MACHINE_X_POSITIONS.belt2_start) * t;
      item.y = yBelt;
      if (item.progress >= 1) {
        item.stage = 'ribboning';
        item.progress = 0;
        item.x = MACHINE_X_POSITIONS.ribboner;
      }
    } else if (item.stage === 'ribboning') {
      item.progress += prodDt * 1.22 * ribbonRate;
      item.x = MACHINE_X_POSITIONS.ribboner;
      item.y = yBelt;
      if (item.progress >= 1) {
        item.stage = 'belt_to_storage';
        item.progress = 0;
        item.x = MACHINE_X_POSITIONS.belt3_start;
        state.totalProduced += 1;
        if (item.isGolden) {
          state.totalGoldenProduced += 1;
          events.push({ kind: 'sound', sfx: 'golden' });
          events.push({
            kind: 'toast',
            event: { text: 'Nadir Altın Hediye Üretildi! (3x Değer)', color: 'gold' },
          });
        } else {
          events.push({ kind: 'sound', sfx: 'ribbon' });
        }
        state.recentProducedTimestamps.push(nowSec);

        if (item.toyType === 'train') advanceOrderProgress(state, 'produce_train', 1, events);
        else if (item.toyType === 'car') advanceOrderProgress(state, 'produce_car', 1, events);
        else if (item.toyType === 'robot') advanceOrderProgress(state, 'produce_robot', 1, events);
        else if (item.toyType === 'doll') advanceOrderProgress(state, 'produce_doll', 1, events);
        else if (item.toyType === 'snow_globe')
          advanceOrderProgress(state, 'produce_snow_globe', 1, events);
        else if (item.toyType === 'nutcracker')
          advanceOrderProgress(state, 'produce_nutcracker', 1, events);
        else if (item.toyType === 'rocket')
          advanceOrderProgress(state, 'produce_rocket', 1, events);
        else if (item.toyType === 'sleigh')
          advanceOrderProgress(state, 'produce_sleigh', 1, events);
      }
    } else if (item.stage === 'belt_to_storage') {
      item.progress = Math.min(1, item.progress + prodDt * 0.54 * beltSpeed);
      item.x =
        MACHINE_X_POSITIONS.belt3_start +
        (MACHINE_X_POSITIONS.belt3_end - MACHINE_X_POSITIONS.belt3_start) * item.progress;
      item.y = yBelt;
      if (item.progress >= 1) {
        if (getTotalStored(state) < storageCap) {
          state.stored[item.toyType] += 1;
          if (item.isGolden) state.goldenStored += 1;
          keep = false;
        }
      }
    }

    if (keep) {
      state.items[writeIdx++] = item;
    }
  }
  state.items.length = writeIdx;

  // 3. Delivery Truck Loop
  const truck = state.truck;
  const truckSpeedMult = 1 + (state.upgrades.truckFleet - 1) * 0.16;

  if (truck.phase === 'docked') {
    if (getTotalStored(state) > 0) {
      truck.phase = 'loading';
      truck.phaseProgress = 0;
      truck.loadCooldown = 0.2;
    }
  } else if (truck.phase === 'loading') {
    truck.loadCooldown -= dt;
    if (truck.loadCooldown <= 0) {
      if (truck.cargoCount < truckCap && getTotalStored(state) > 0) {
        const taken = takeOneFromStorage(state, valueMult);
        if (taken) {
          truck.cargo[taken.toy] += 1;
          truck.cargoCount += 1;
          truck.cargoValue += taken.value;
          if (taken.isGolden) truck.goldenCargoCount += 1;
        }
        truck.loadCooldown = 0.26 / truckSpeedMult;
      } else if (truck.cargoCount > 0) {
        truck.phase = 'delivering';
        truck.phaseProgress = 0;
        events.push({ kind: 'sound', sfx: 'truck' });
      } else {
        truck.phase = 'docked';
      }
    }
  } else if (truck.phase === 'delivering') {
    truck.phaseProgress += (dt * truckSpeedMult) / 3.1;
    if (truck.phaseProgress >= 1) {
      const earned = truck.cargoValue;
      const delivered = truck.cargoCount;
      const goldenDelivered = truck.goldenCargoCount;

      state.coins += earned;
      state.totalEarned += earned;
      awardXp(state, delivered * 6 + goldenDelivered * 12, events);
      advanceOrderProgress(state, 'deliver_any', delivered, events);
      if (goldenDelivered > 0) {
        advanceOrderProgress(state, 'deliver_golden', goldenDelivered, events);
      }

      events.push({ kind: 'sound', sfx: 'coin' });
      events.push({
        kind: 'toast',
        event: {
          text: `Kamyon: ${delivered} Hediye Teslim Edildi! +${earned.toLocaleString('tr-TR')} 🪙`,
          color: 'gold',
        },
      });

      truck.cargo = createEmptyInventory();
      truck.cargoCount = 0;
      truck.cargoValue = 0;
      truck.goldenCargoCount = 0;
      truck.phase = 'returning';
      truck.phaseProgress = 0;
    }
  } else if (truck.phase === 'returning') {
    truck.phaseProgress += (dt * truckSpeedMult) / 2.4;
    if (truck.phaseProgress >= 1) {
      truck.phase = 'docked';
      truck.phaseProgress = 0;
    }
  }

  // 4. Santa Express Cargo Train Logistics Loop
  const train = state.train;
  if (train.unlocked) {
    const trainSpeedMult = 1 + (train.level - 1) * 0.15;

    if (train.phase === 'locked') {
      train.phase = 'arriving';
      train.phaseProgress = 0;
    } else if (train.phase === 'arriving') {
      train.phaseProgress += (dt * trainSpeedMult) / 2.8;
      if (train.phaseProgress >= 1) {
        train.phase = 'loading';
        train.phaseProgress = 0;
        train.loadCooldown = 0.25;
      }
    } else if (train.phase === 'loading') {
      train.loadCooldown -= dt;
      if (train.loadCooldown <= 0) {
        if (train.cargoCount < trainCap && getTotalStored(state) > 0) {
          const taken = takeOneFromStorage(state, valueMult * 1.15);
          if (taken) {
            train.cargoCount += 1;
            train.cargoValue += taken.value;
            if (taken.isGolden) train.goldenCargoCount += 1;
          }
          train.loadCooldown = 0.2 / trainSpeedMult;
        } else if (
          train.cargoCount >= Math.min(4, trainCap) ||
          (train.cargoCount > 0 && getTotalStored(state) === 0)
        ) {
          train.phase = 'departing';
          train.phaseProgress = 0;
          events.push({ kind: 'sound', sfx: 'train' });
        } else {
          train.loadCooldown = 0.5;
        }
      }
    } else if (train.phase === 'departing') {
      train.phaseProgress += (dt * trainSpeedMult) / 3.2;
      if (train.phaseProgress >= 1) {
        const earned = train.cargoValue;
        const delivered = train.cargoCount;
        const goldenDelivered = train.goldenCargoCount;

        state.coins += earned;
        state.totalEarned += earned;
        awardXp(state, delivered * 7 + goldenDelivered * 14, events);
        advanceOrderProgress(state, 'deliver_any', delivered, events);
        if (goldenDelivered > 0) {
          advanceOrderProgress(state, 'deliver_golden', goldenDelivered, events);
        }

        events.push({ kind: 'sound', sfx: 'coin' });
        events.push({
          kind: 'toast',
          event: {
            text: `Kargo Treni: ${delivered} Hediye Sevk Edildi! +${earned.toLocaleString('tr-TR')} 🪙`,
            color: 'gold',
          },
        });

        train.cargoCount = 0;
        train.cargoValue = 0;
        train.goldenCargoCount = 0;
        train.phase = 'away';
        train.phaseProgress = 0;
      }
    } else if (train.phase === 'away') {
      train.phaseProgress += (dt * trainSpeedMult) / 3.0;
      if (train.phaseProgress >= 1) {
        train.phase = 'arriving';
        train.phaseProgress = 0;
      }
    }
  }

  const achEvents = checkAchievements(state);
  if (achEvents.length > 0) events.push(...achEvents);

  return events;
}

export function claimSantaOrder(state: GameState, orderId: string): SimCallbackEvent[] {
  const events: SimCallbackEvent[] = [];
  const idx = state.orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return events;
  const order = state.orders[idx];
  if (!order.completed || order.claimed) return events;

  const orderBonusMult = 1 + (state.upgrades.orderBonus - 1) * 0.12;
  const rewardCoins = Math.round(order.rewardCoins * orderBonusMult);

  order.claimed = true;
  state.coins += rewardCoins;
  state.totalEarned += rewardCoins;
  state.completedOrders += 1;

  events.push({ kind: 'sound', sfx: 'order' });
  events.push({
    kind: 'toast',
    event: {
      text: `Sipariş Ödülü: +${rewardCoins.toLocaleString('tr-TR')} 🪙 · +${order.rewardXp} XP`,
      color: 'gold',
    },
  });

  awardXp(state, order.rewardXp, events);

  const newOrder = generateSantaOrder(
    state.nextOrderSeq++,
    state.level,
    state.lines.line2.unlocked,
    state.lines.line3.unlocked,
    state.lines.line4.unlocked,
    state.lines.line5.unlocked,
    state.lines.line6.unlocked,
    state.rebirthCount,
  );
  state.orders.splice(idx, 1, newOrder);
  events.push(...checkAchievements(state));

  return events;
}

export function performRebirth(state: GameState): {
  nextState: GameState | null;
  events: SimCallbackEvent[];
} {
  const cost = getRebirthCost(state.rebirthCount);
  if (state.coins < cost) {
    return { nextState: null, events: [] };
  }

  const nextRebirth = state.rebirthCount + 1;
  const nextState = createInitialGameState(nextRebirth);

  // Preserve lifetime stats, achievements, audio/environment preferences
  nextState.totalEarned = state.totalEarned;
  nextState.totalProduced = state.totalProduced;
  nextState.totalGoldenProduced = state.totalGoldenProduced;
  nextState.completedOrders = state.completedOrders;
  nextState.unlockedAchievements = state.unlockedAchievements.slice();
  nextState.claimedAchievements = state.claimedAchievements.slice();
  nextState.muted = state.muted;
  nextState.musicEnabled = state.musicEnabled;
  nextState.tutorialSeen = state.tutorialSeen;
  nextState.environment = { ...state.environment };

  const mult = getRebirthMultiplier(nextRebirth);
  const events: SimCallbackEvent[] = [
    { kind: 'sound', sfx: 'order' },
    {
      kind: 'celebrate',
      badge: `REBIRTH #${nextRebirth}`,
      title: `Rebirth #${nextRebirth} Tamamlandı!`,
      subtitle: `Fabrika fiziksel olarak büyüdü! Tüm kazançlar kalıcı olarak ×${mult.toFixed(2)} oldu.`,
      accent: 'fuchsia',
    },
  ];
  events.push(...checkAchievements(nextState));

  return { nextState, events };
}
