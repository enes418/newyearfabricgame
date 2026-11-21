import React from 'react';
import {
  Factory,
  ShoppingBag,
  Sparkles,
  ScrollText,
  Trophy,
  Lock,
  ArrowUpCircle,
  Focus,
  X,
  Check,
  Users,
  Zap,
  TrainFront,
  Gift,
  Crown,
} from 'lucide-react';
import type { GameState, LeftTab, LineId, ToyType } from '../types/game';
import {
  ACHIEVEMENTS,
  GIFT_TIERS,
  GLOBAL_UPGRADES,
  LINE_IDS,
  MAX_GENERATOR_LEVEL,
  MAX_MACHINE_LEVEL,
  MAX_TRAIN_LEVEL,
  getGeneratorCapacityKw,
  getGeneratorUpgradeCost,
  getGiftTierMeta,
  getGiftValueMultiplier,
  getGlobalUpgradeCost,
  getMachineUpgradeCost,
  getRebirthCost,
  getRebirthMultiplier,
  getTrainCapacity,
  getTrainUnlockCost,
  getTrainUpgradeCost,
  getWorkerHireCost,
  TOY_BASE_VALUES,
  TOY_LABELS,
} from '../game/constants';
import { getAchievementProgress } from '../game/simulation';

interface LeftPanelProps {
  state: GameState;
  activeTab: LeftTab;
  isOpen: boolean;
  onSelectTab: (tab: LeftTab) => void;
  onToggleOpen: () => void;
  onUnlockLine: (lineId: LineId) => void;
  onChangeLineToy: (lineId: LineId, toy: ToyType) => void;
  onHireWorker: (lineId: LineId) => void;
  onUpgradeMachine: (lineId: LineId, kind: 'toy_maker' | 'wrapper' | 'ribboner') => void;
  onUpgradeGenerator: () => void;
  onUnlockOrUpgradeTrain: () => void;
  onBuyGlobalUpgrade: (upgradeId: keyof GameState['upgrades']) => void;
  onUpgradeGiftTier: () => void;
  onClaimOrder: (orderId: string) => void;
  onClaimAchievement: (achId: string) => void;
  onClaimAllAchievements: () => void;
  onPerformRebirth: () => void;
  onFocusLine: (lineId: LineId) => void;
}

const TABS: Array<{ id: LeftTab; label: string; icon: React.ReactNode }> = [
  { id: 'factory', label: 'Fabrika', icon: <Factory className="w-4 h-4" /> },
  { id: 'shop', label: 'Mağaza', icon: <ShoppingBag className="w-4 h-4" /> },
  { id: 'upgrades', label: 'Geliştir', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'orders', label: 'Sipariş', icon: <ScrollText className="w-4 h-4" /> },
  { id: 'achievements', label: 'Başarımlar', icon: <Trophy className="w-4 h-4" /> },
  { id: 'rebirth', label: 'Rebirth', icon: <Crown className="w-4 h-4" /> },
];

export const LeftPanel: React.FC<LeftPanelProps> = ({
  state,
  activeTab,
  isOpen,
  onSelectTab,
  onToggleOpen,
  onUnlockLine,
  onChangeLineToy,
  onHireWorker,
  onUpgradeMachine,
  onUpgradeGenerator,
  onUnlockOrUpgradeTrain,
  onBuyGlobalUpgrade,
  onUpgradeGiftTier,
  onClaimOrder,
  onClaimAchievement,
  onClaimAllAchievements,
  onPerformRebirth,
  onFocusLine,
}) => {
  const readyOrdersCount = state.orders.filter((o) => o.completed && !o.claimed).length;
  const readyAchCount = ACHIEVEMENTS.filter(
    (a) =>
      !state.claimedAchievements.includes(a.id) &&
      (state.unlockedAchievements.includes(a.id) || getAchievementProgress(state, a) >= a.target),
  ).length;
  const unlockedAchCount = ACHIEVEMENTS.filter(
    (a) =>
      state.unlockedAchievements.includes(a.id) ||
      state.claimedAchievements.includes(a.id) ||
      getAchievementProgress(state, a) >= a.target,
  ).length;
  const rebirthCost = getRebirthCost(state.rebirthCount);
  const canRebirth = state.coins >= rebirthCost;
  const rebirthMult = getRebirthMultiplier(state.rebirthCount);
  const nextRebirthMult = getRebirthMultiplier(state.rebirthCount + 1);

  const valMult = getGiftValueMultiplier(
    state.upgrades.giftValue,
    state.upgrades.giftTier,
    state.rebirthCount,
  );
  const currentGiftTier = getGiftTierMeta(state.upgrades.giftTier);
  const isMaxGiftTier = state.upgrades.giftTier >= GIFT_TIERS.length;
  const nextGiftTier = isMaxGiftTier ? null : getGiftTierMeta(state.upgrades.giftTier + 1);

  const genCost = getGeneratorUpgradeCost(state.power.generatorLevel);
  const isMaxGen = state.power.generatorLevel >= MAX_GENERATOR_LEVEL;
  const trainCost = state.train.unlocked
    ? getTrainUpgradeCost(state.train.level)
    : getTrainUnlockCost();
  const isMaxTrain = state.train.unlocked && state.train.level >= MAX_TRAIN_LEVEL;

  return (
    <aside className="pointer-events-none fixed top-16 bottom-18 left-3 z-20 flex items-start gap-1.5">
      {/* Slim Vertical Navigation Rail */}
      <div className="pointer-events-auto flex flex-col gap-1 rounded-xl border border-amber-400/30 bg-[#0c1626]/92 p-1 shadow-xl">
        {TABS.map((tab) => {
          const isActive = isOpen && activeTab === tab.id;
          const badge =
            tab.id === 'orders'
              ? readyOrdersCount
              : tab.id === 'achievements'
              ? readyAchCount
              : tab.id === 'rebirth' && canRebirth
              ? 1
              : 0;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (isOpen && activeTab === tab.id) {
                  onToggleOpen();
                } else {
                  onSelectTab(tab.id);
                  if (!isOpen) onToggleOpen();
                }
              }}
              className={`relative flex flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-2 text-[10px] font-bold tracking-wide cursor-pointer transition-colors ${
                isActive
                  ? 'bg-gradient-to-b from-red-600 to-red-700 text-white border border-amber-300/60'
                  : 'text-slate-300 hover:bg-slate-800/90 hover:text-white border border-transparent'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {badge > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-slate-950">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Neat Compact Drawer */}
      {isOpen && (
        <div
          className={`pointer-events-auto flex max-h-full flex-col rounded-xl border border-amber-400/30 bg-[#0c1626]/94 shadow-2xl overflow-hidden ${
            activeTab === 'achievements' ? 'w-64' : 'w-60'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-700/80 px-3 py-2 bg-[#111f35]">
            <h2 className="font-display text-xs font-bold text-amber-200 tracking-wide">
              {TABS.find((t) => t.id === activeTab)?.label}
            </h2>
            <button
              type="button"
              onClick={onToggleOpen}
              title="Menüyü Kapat"
              className="rounded p-0.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="factory-scroll flex-1 overflow-y-auto p-2 space-y-2">
            {activeTab === 'factory' && (
              <>
                {LINE_IDS.map((lineId) => {
                  const line = state.lines[lineId];
                  const giftVal = Math.round(TOY_BASE_VALUES[line.toyType] * valMult);
                  const canUnlock = state.coins >= line.unlockCost;
                  const workerCost = getWorkerHireCost(lineId, line.workers);
                  const canHire = line.workers < 3 && state.coins >= workerCost;

                  return (
                    <div
                      key={lineId}
                      className={`rounded-lg border p-2 transition-colors ${
                        line.unlocked
                          ? 'border-emerald-500/30 bg-slate-900/80'
                          : 'border-slate-700/80 bg-slate-950/75'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] font-bold text-slate-100 truncate">
                              {line.name}
                            </span>
                            {line.floor === 2 && (
                              <span className="rounded bg-purple-600/40 px-1 py-0.5 text-[9px] font-bold text-purple-200 shrink-0">
                                2.KAT
                              </span>
                            )}
                            {line.floor === 3 && (
                              <span className="rounded bg-cyan-600/40 px-1 py-0.5 text-[9px] font-bold text-cyan-200 shrink-0">
                                3.KAT
                              </span>
                            )}
                          </div>
                        </div>
                        {line.unlocked ? (
                          <button
                            type="button"
                            onClick={() => onFocusLine(lineId)}
                            title="Hatta Odaklan"
                            className="rounded border border-slate-700 bg-slate-800 p-1 text-amber-300 hover:bg-slate-700 cursor-pointer shrink-0"
                          >
                            <Focus className="w-3 h-3" />
                          </button>
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        )}
                      </div>

                      {line.unlocked ? (
                        <div className="mt-1.5 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-1">
                            {line.availableToys.map((toy) => (
                              <button
                                key={toy}
                                type="button"
                                onClick={() => onChangeLineToy(lineId, toy)}
                                className={`rounded px-1.5 py-0.5 text-[10px] font-bold cursor-pointer ${
                                  line.toyType === toy
                                    ? 'bg-red-600 text-white'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                              >
                                {TOY_LABELS[toy]}
                              </button>
                            ))}
                            <span className="ml-auto text-[10px] font-bold text-amber-300 tabular-nums">
                              +{giftVal}🪙
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-1 rounded bg-slate-950/75 px-2 py-1 border border-slate-800">
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 font-semibold tabular-nums">
                              <Users className="w-3 h-3" />
                              Elf {line.workers}/3
                            </span>
                            <button
                              type="button"
                              onClick={() => onHireWorker(lineId)}
                              disabled={!canHire}
                              className={`rounded px-2 py-0.5 text-[10px] font-bold tabular-nums cursor-pointer ${
                                line.workers >= 3
                                  ? 'bg-emerald-900/40 text-emerald-300 cursor-default'
                                  : canHire
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              }`}
                            >
                              {line.workers >= 3 ? 'TAM' : `+1 (${workerCost.toLocaleString('tr-TR')})`}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onUnlockLine(lineId)}
                          disabled={!canUnlock}
                          className={`mt-2 flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[11px] font-bold cursor-pointer ${
                            canUnlock
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <span>
                            {line.floor === 3
                              ? '3. Katı Aç'
                              : line.floor === 2
                              ? '2. Katı Aç'
                              : 'Hattı Aç'}
                          </span>
                          <span className="tabular-nums">
                            {line.unlockCost.toLocaleString('tr-TR')} 🪙
                          </span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </>
            )}

            {activeTab === 'shop' && (
              <>
                <div className="rounded-lg border border-sky-500/35 bg-slate-900/85 p-2 space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-sky-300">
                    Enerji & Lojistik
                  </div>

                  <div className="flex items-center justify-between gap-1.5 rounded bg-slate-950/80 px-2 py-1.5 border border-slate-800">
                    <div className="leading-tight">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-100">
                        <Zap className="w-3 h-3 text-sky-400" />
                        <span>Jeneratör Sv.{state.power.generatorLevel}</span>
                      </div>
                      <div className="text-[10px] text-sky-300 tabular-nums">
                        {isMaxGen
                          ? `${state.power.capacityKw} kW (MAX)`
                          : `${state.power.capacityKw} → ${getGeneratorCapacityKw(state.power.generatorLevel + 1)} kW`}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onUpgradeGenerator}
                      disabled={isMaxGen || state.coins < genCost}
                      className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-bold tabular-nums cursor-pointer ${
                        isMaxGen
                          ? 'bg-emerald-900/40 text-emerald-300 cursor-default'
                          : state.coins >= genCost
                          ? 'bg-sky-500 hover:bg-sky-400 text-slate-950'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {!isMaxGen && <ArrowUpCircle className="w-3 h-3" />}
                      <span>{isMaxGen ? 'MAX' : genCost.toLocaleString('tr-TR')}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-1.5 rounded bg-slate-950/80 px-2 py-1.5 border border-slate-800">
                    <div className="leading-tight">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-100">
                        <TrainFront className="w-3 h-3 text-amber-400" />
                        <span>
                          {state.train.unlocked ? `Tren Sv.${state.train.level}` : 'Kargo Treni'}
                        </span>
                      </div>
                      <div className="text-[10px] text-emerald-300 tabular-nums">
                        {state.train.unlocked
                          ? `${getTrainCapacity(state.train.level)} Kutu (+%15)`
                          : 'Raylı dev teslimat'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onUnlockOrUpgradeTrain}
                      disabled={isMaxTrain || state.coins < trainCost}
                      className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-bold tabular-nums cursor-pointer ${
                        isMaxTrain
                          ? 'bg-emerald-900/40 text-emerald-300 cursor-default'
                          : state.coins >= trainCost
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {!isMaxTrain && <ArrowUpCircle className="w-3 h-3" />}
                      <span>{isMaxTrain ? 'MAX' : trainCost.toLocaleString('tr-TR')}</span>
                    </button>
                  </div>
                </div>

                {LINE_IDS.map((lineId) => {
                  const line = state.lines[lineId];
                  if (!line.unlocked) return null;

                  const machines: Array<{
                    kind: 'toy_maker' | 'wrapper' | 'ribboner';
                    label: string;
                    level: number;
                  }> = [
                    { kind: 'toy_maker', label: 'Oyuncak Makinesi', level: line.toyMakerLevel },
                    { kind: 'wrapper', label: 'Paketleme Makinesi', level: line.wrapperLevel },
                    { kind: 'ribboner', label: 'Kurdele Makinesi', level: line.ribbonerLevel },
                  ];

                  return (
                    <div
                      key={lineId}
                      className="rounded-lg border border-slate-700/80 bg-slate-900/75 p-2 space-y-1.5"
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                        {line.name}
                      </div>
                      {machines.map((m) => {
                        const isMaxMachine = m.level >= MAX_MACHINE_LEVEL;
                        const cost = getMachineUpgradeCost(m.kind, lineId, m.level);
                        const canAfford = !isMaxMachine && state.coins >= cost;
                        return (
                          <div
                            key={m.kind}
                            className="flex items-center justify-between gap-1.5 rounded bg-slate-950/75 px-2 py-1.5 border border-slate-800"
                          >
                            <div className="leading-tight">
                              <div className="text-[11px] font-semibold text-slate-100">{m.label}</div>
                              <div className="text-[10px] text-emerald-300 tabular-nums">
                                Sv.{m.level}/{MAX_MACHINE_LEVEL}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => onUpgradeMachine(lineId, m.kind)}
                              disabled={!canAfford}
                              className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-bold tabular-nums cursor-pointer ${
                                isMaxMachine
                                  ? 'bg-emerald-900/40 text-emerald-300 cursor-default'
                                  : canAfford
                                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              }`}
                            >
                              {!isMaxMachine && <ArrowUpCircle className="w-3 h-3" />}
                              <span>{isMaxMachine ? 'MAX' : cost.toLocaleString('tr-TR')}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </>
            )}

            {activeTab === 'upgrades' && (
              <>
                {/* Gift Tier Color & Value Upgrade Featured Card */}
                <div className="rounded-lg border border-amber-400/50 bg-gradient-to-b from-slate-900 to-slate-950 p-2.5 space-y-2">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded border border-white/30 shadow-inner"
                        style={{ backgroundColor: currentGiftTier.cssColor }}
                      >
                        <Gift className="w-3 h-3 text-white" />
                      </span>
                      <div className="leading-tight">
                        <div className="text-[11px] font-bold text-amber-200">
                          Hediye Paketi Geliştir
                        </div>
                        <div className="text-[10px] text-slate-300">
                          {currentGiftTier.name}
                        </div>
                      </div>
                    </div>
                    <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 tabular-nums">
                      x{currentGiftTier.multiplier}
                    </span>
                  </div>

                  {/* 8 Color Progression Swatches (4x2 Grid) */}
                  <div className="grid grid-cols-4 gap-1.5 rounded bg-slate-900/90 p-2 border border-slate-800">
                    {GIFT_TIERS.map((tier) => {
                      const unlocked = state.upgrades.giftTier >= tier.tier;
                      const current = state.upgrades.giftTier === tier.tier;
                      return (
                        <div
                          key={tier.tier}
                          title={`${tier.colorName} (x${tier.multiplier})`}
                          className="flex flex-col items-center gap-0.5"
                        >
                          <span
                            className={`h-4 w-4 rounded-sm border transition-transform ${
                              current
                                ? 'scale-110 border-white ring-1 ring-amber-300'
                                : unlocked
                                ? 'border-white/50 opacity-90'
                                : 'border-slate-700 opacity-30'
                            }`}
                            style={{ backgroundColor: tier.cssColor }}
                          />
                          <span className="text-[8px] font-semibold text-slate-400">
                            {tier.colorName}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={onUpgradeGiftTier}
                    disabled={!nextGiftTier || state.coins < nextGiftTier.upgradeCost}
                    className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[11px] font-bold tabular-nums cursor-pointer ${
                      isMaxGiftTier
                        ? 'bg-emerald-900/40 text-emerald-300 cursor-default'
                        : nextGiftTier && state.coins >= nextGiftTier.upgradeCost
                        ? 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span>
                      {nextGiftTier
                        ? `${nextGiftTier.colorName} Yap (x${nextGiftTier.multiplier})`
                        : 'SON SEVİYE'}
                    </span>
                    {nextGiftTier && <span>{nextGiftTier.upgradeCost.toLocaleString('tr-TR')} 🪙</span>}
                  </button>
                </div>

                {GLOBAL_UPGRADES.map((meta) => {
                  const lvl = state.upgrades[meta.id];
                  const isMax = lvl >= meta.maxLevel;
                  const cost = getGlobalUpgradeCost(meta, lvl);
                  const canAfford = !isMax && state.coins >= cost;

                  return (
                    <div
                      key={meta.id}
                      className="rounded-lg border border-slate-700/80 bg-slate-900/80 p-2 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-bold text-slate-100">{meta.name}</span>
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold text-amber-300 tabular-nums">
                          {lvl}/{meta.maxLevel}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 leading-snug">
                        {meta.description}
                      </div>
                      <div className="flex items-center justify-between gap-1 pt-0.5">
                        <span className="text-[10px] font-semibold text-emerald-300 tabular-nums">
                          {meta.effectText(lvl)}
                        </span>
                        <button
                          type="button"
                          onClick={() => onBuyGlobalUpgrade(meta.id)}
                          disabled={!canAfford}
                          className={`rounded px-2.5 py-1 text-[10px] font-bold tabular-nums cursor-pointer ${
                            isMax
                              ? 'bg-emerald-900/40 text-emerald-300 cursor-default'
                              : canAfford
                              ? 'bg-red-600 hover:bg-red-500 text-white'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {isMax ? 'MAX' : `${cost.toLocaleString('tr-TR')} 🪙`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {activeTab === 'orders' && (
              <>
                {state.orders.map((order) => {
                  const pct = Math.min(100, Math.round((order.progress / order.target) * 100));
                  return (
                    <div
                      key={order.id}
                      className={`rounded-lg border p-2.5 space-y-1.5 ${
                        order.completed
                          ? 'border-emerald-400/60 bg-emerald-950/35'
                          : 'border-slate-700/80 bg-slate-900/80'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-bold text-amber-200">{order.title}</span>
                        <span className="text-[10px] font-bold text-slate-300 tabular-nums">
                          {order.progress}/{order.target}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300">{order.description}</div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full transition-all duration-300 ${
                            order.completed ? 'bg-emerald-400' : 'bg-amber-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] pt-0.5">
                        <span className="text-amber-300 font-semibold tabular-nums">
                          +{order.rewardCoins.toLocaleString('tr-TR')} 🪙 · +{order.rewardXp} XP
                        </span>
                        {order.completed && (
                          <button
                            type="button"
                            onClick={() => onClaimOrder(order.id)}
                            className="inline-flex items-center gap-1 rounded bg-emerald-500 hover:bg-emerald-400 px-2 py-0.5 text-[10px] font-bold text-slate-950 cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            <span>Al</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {activeTab === 'achievements' && (
              <>
                <div className="rounded-lg border border-amber-400/40 bg-gradient-to-b from-amber-950/35 to-slate-950 p-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="inline-flex items-center gap-1 font-bold text-amber-200">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Açılan Başarımlar</span>
                    </span>
                    <span className="font-bold text-amber-300 tabular-nums">
                      {unlockedAchCount}/{ACHIEVEMENTS.length}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-300"
                      style={{
                        width: `${Math.round((unlockedAchCount / ACHIEVEMENTS.length) * 100)}%`,
                      }}
                    />
                  </div>
                  {readyAchCount > 0 && (
                    <button
                      type="button"
                      onClick={onClaimAllAchievements}
                      className="flex w-full items-center justify-center gap-1 rounded-md bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 py-1 text-[10px] font-bold text-slate-950 cursor-pointer shadow"
                    >
                      <Check className="w-3 h-3" />
                      <span>Tüm Ödülleri Al ({readyAchCount})</span>
                    </button>
                  )}
                </div>

                {[...ACHIEVEMENTS]
                  .sort((a, b) => {
                    const aClaimed = state.claimedAchievements.includes(a.id);
                    const bClaimed = state.claimedAchievements.includes(b.id);
                    const aReady =
                      !aClaimed &&
                      (state.unlockedAchievements.includes(a.id) ||
                        getAchievementProgress(state, a) >= a.target);
                    const bReady =
                      !bClaimed &&
                      (state.unlockedAchievements.includes(b.id) ||
                        getAchievementProgress(state, b) >= b.target);
                    if (aReady !== bReady) return aReady ? -1 : 1;
                    if (aClaimed !== bClaimed) return aClaimed ? 1 : -1;
                    return 0;
                  })
                  .map((ach) => {
                    const claimed = state.claimedAchievements.includes(ach.id);
                    const val = Math.min(ach.target, getAchievementProgress(state, ach));
                    const done =
                      claimed ||
                      state.unlockedAchievements.includes(ach.id) ||
                      val >= ach.target;
                    const pct = Math.round((val / ach.target) * 100);
                    const rewardCoins = Math.round(ach.rewardCoins * rebirthMult);
                    const catLabel =
                      ach.category === 'production'
                        ? 'Üretim'
                        : ach.category === 'machines'
                        ? 'Makine'
                        : ach.category === 'wealth'
                        ? 'Servet'
                        : 'Atölye';

                    return (
                      <div
                        key={ach.id}
                        className={`rounded-lg border p-2 space-y-1 transition-colors ${
                          claimed
                            ? 'border-emerald-500/25 bg-slate-950/65 opacity-80'
                            : done
                            ? 'border-amber-400/80 bg-gradient-to-b from-amber-950/45 to-slate-900 shadow-[0_0_12px_rgba(251,191,36,0.18)]'
                            : 'border-slate-700/80 bg-slate-900/80'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="rounded bg-slate-800 px-1 py-0.5 text-[8px] font-bold uppercase text-slate-300 shrink-0">
                              {catLabel}
                            </span>
                            <span className="text-[11px] font-bold text-amber-200 truncate">
                              {ach.title}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-300 tabular-nums shrink-0">
                            {val.toLocaleString('tr-TR')}/{ach.target.toLocaleString('tr-TR')}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-300/90 leading-snug">
                          {ach.description}
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                          <div
                            className={`h-full transition-all duration-300 ${
                              claimed
                                ? 'bg-emerald-400'
                                : done
                                ? 'bg-amber-400'
                                : 'bg-sky-400'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] pt-0.5">
                          <span className="text-amber-300 font-semibold tabular-nums">
                            +{rewardCoins.toLocaleString('tr-TR')} 🪙 · +{ach.rewardXp} XP
                          </span>
                          {claimed ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-400">
                              <Check className="w-3 h-3" />
                              ALINDI
                            </span>
                          ) : done ? (
                            <button
                              type="button"
                              onClick={() => onClaimAchievement(ach.id)}
                              className="inline-flex items-center gap-1 rounded bg-amber-400 hover:bg-amber-300 px-2 py-0.5 text-[10px] font-bold text-slate-950 cursor-pointer"
                            >
                              <Trophy className="w-3 h-3" />
                              <span>Ödülü Al</span>
                            </button>
                          ) : (
                            <span className="text-[9px] font-semibold text-slate-500">
                              %{pct}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </>
            )}

            {activeTab === 'rebirth' && (
              <div className="space-y-2.5">
                <div className="rounded-lg border border-fuchsia-400/50 bg-gradient-to-b from-fuchsia-950/40 to-slate-950 p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-300" />
                      <span className="text-xs font-bold text-fuchsia-200">
                        Rebirth Seviyesi {state.rebirthCount}
                      </span>
                    </div>
                    <span className="rounded bg-fuchsia-500/25 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 tabular-nums">
                      x{rebirthMult.toFixed(2)} Kazanç
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-300 leading-relaxed">
                    Rebirth attığında fabrikan 3D olarak kalıcı büyür ve tüm hediye & sipariş kazançların{' '}
                    <span className="text-amber-300 font-bold">1.5 kat</span> artar!
                  </p>

                  <div className="rounded bg-slate-900/90 border border-slate-800 p-2 space-y-1 text-[10px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Yeni Kazanç Çarpanı:</span>
                      <span className="font-bold text-emerald-300 tabular-nums">
                        x{rebirthMult.toFixed(2)} → x{nextRebirthMult.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">3D Fabrika Büyümesi:</span>
                      <span className="font-bold text-amber-200">
                        {state.rebirthCount === 0
                          ? 'Saat Kulesi & Teras'
                          : state.rebirthCount === 1
                          ? 'İkiz Kanat & Yıldız'
                          : state.rebirthCount === 2
                          ? 'Kristal Saray Kubbesi'
                          : 'Kuzey Kutbu Efsanesi'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Gereken Altın</span>
                      <span className="font-bold text-amber-300 tabular-nums">
                        {Math.min(state.coins, rebirthCost).toLocaleString('tr-TR')} /{' '}
                        {rebirthCost.toLocaleString('tr-TR')} 🪙
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-fuchsia-500 to-amber-400 transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.round((state.coins / rebirthCost) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="text-[9px] text-slate-400 leading-snug">
                    Not: Hatlar, makineler, geçici geliştirmeler ve altın sıfırlanır; Başarımların, toplam istatistiklerin, Rebirth çarpanın ve büyümüş fabrikan kalır!
                  </div>

                  <button
                    type="button"
                    onClick={onPerformRebirth}
                    disabled={!canRebirth}
                    className={`flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold tabular-nums cursor-pointer ${
                      canRebirth
                        ? 'bg-gradient-to-r from-fuchsia-600 to-amber-500 hover:from-fuchsia-500 hover:to-amber-400 text-white shadow-lg'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>REBIRTH AT ({rebirthCost.toLocaleString('tr-TR')} 🪙)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
