import React from 'react';
import {
  Truck,
  TrainFront,
  Package,
  ScrollText,
  Wrench,
  Check,
  Send,
  ChevronRight,
  ChevronLeft,
  ArrowUpCircle,
  Sparkles,
} from 'lucide-react';
import type { GameState, LineId, SelectedMachineInfo } from '../types/game';
import {
  MAX_GENERATOR_LEVEL,
  MAX_MACHINE_LEVEL,
  MAX_TRAIN_LEVEL,
  getGeneratorUpgradeCost,
  getMachineUpgradeCost,
  getStorageCapacity,
  getTrainCapacity,
  getTrainUnlockCost,
  getTrainUpgradeCost,
  getTruckCapacity,
} from '../game/constants';
import { getTotalStored } from '../game/simulation';

interface RightPanelProps {
  state: GameState;
  selectedMachine: SelectedMachineInfo | null;
  isOpen: boolean;
  onToggleOpen: () => void;
  onClaimOrder: (orderId: string) => void;
  onDispatchTruck: () => void;
  onUpgradeMachine: (lineId: LineId, kind: 'toy_maker' | 'wrapper' | 'ribboner') => void;
  onUpgradeGenerator: () => void;
  onUnlockOrUpgradeTrain: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  state,
  selectedMachine,
  isOpen,
  onToggleOpen,
  onClaimOrder,
  onDispatchTruck,
  onUpgradeMachine,
  onUpgradeGenerator,
  onUnlockOrUpgradeTrain,
}) => {
  const totalStored = getTotalStored(state);
  const storageCap = getStorageCapacity(state.upgrades.storageCapacity);
  const truckCap = getTruckCapacity(state.upgrades.truckFleet);
  const trainCap = getTrainCapacity(state.train.level);
  const itemsPerMin = state.recentProducedTimestamps.length;

  const truckPhaseLabel: Record<GameState['truck']['phase'], string> = {
    docked: 'Rampada',
    loading: 'Yükleniyor',
    delivering: 'Yolda',
    returning: 'Dönüyor',
  };

  const trainPhaseLabel: Record<GameState['train']['phase'], string> = {
    locked: 'Kilitli',
    arriving: 'Geliyor',
    loading: 'Yükleniyor',
    departing: 'Sevkiyatta',
    away: 'Dönüyor',
  };

  let machineLevel: number | null = null;
  let machineUpgradeCost: number | null = null;
  if (
    selectedMachine &&
    selectedMachine.lineId &&
    (selectedMachine.kind === 'toy_maker' ||
      selectedMachine.kind === 'wrapper' ||
      selectedMachine.kind === 'ribboner')
  ) {
    const line = state.lines[selectedMachine.lineId];
    machineLevel =
      selectedMachine.kind === 'toy_maker'
        ? line.toyMakerLevel
        : selectedMachine.kind === 'wrapper'
        ? line.wrapperLevel
        : line.ribbonerLevel;
    machineUpgradeCost = getMachineUpgradeCost(
      selectedMachine.kind,
      selectedMachine.lineId,
      machineLevel,
    );
  }

  return (
    <aside className="pointer-events-none fixed top-16 bottom-18 right-3 z-20 flex items-start gap-1.5">
      <button
        type="button"
        onClick={onToggleOpen}
        title={isOpen ? 'Sağ Paneli Gizle' : 'Sağ Paneli Göster'}
        className="pointer-events-auto flex items-center justify-center rounded-xl border border-amber-400/30 bg-[#0c1626]/92 p-1.5 text-slate-300 hover:text-white shadow-lg cursor-pointer transition-colors"
      >
        {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="pointer-events-auto factory-scroll flex max-h-full w-56 flex-col gap-2 overflow-y-auto">
          {/* Unified Compact Orders + Logistics Card */}
          <section className="rounded-xl border border-amber-400/30 bg-[#0c1626]/92 p-2.5 shadow-xl space-y-2">
            {/* Active Orders */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-display font-bold text-amber-200">
                <ScrollText className="w-3.5 h-3.5 text-red-400" />
                <span>Aktif Siparişler</span>
              </div>

              {state.orders.map((order) => {
                const pct = Math.min(100, Math.round((order.progress / order.target) * 100));
                return (
                  <div
                    key={order.id}
                    className="rounded-lg border border-slate-800 bg-slate-900/80 p-1.5 space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] font-semibold">
                      <span className="text-slate-100 truncate pr-1">{order.description}</span>
                      <span className="text-amber-300 tabular-nums shrink-0">
                        {order.progress}/{order.target}
                      </span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full transition-all duration-300 ${
                          order.completed ? 'bg-emerald-400' : 'bg-red-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {order.completed && (
                      <button
                        type="button"
                        onClick={() => onClaimOrder(order.id)}
                        className="flex w-full items-center justify-center gap-1 rounded bg-emerald-500 hover:bg-emerald-400 py-1 text-[10px] font-bold text-slate-950 cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>Ödülü Al (+{order.rewardCoins} 🪙)</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="h-px bg-slate-800" />

            {/* Compact Production & Logistics Summary */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-display font-bold text-amber-200">
                <Package className="w-3.5 h-3.5 text-emerald-400" />
                <span>Üretim & Lojistik</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-center">
                <div className="rounded-md bg-slate-900/85 py-1.5 px-1 border border-slate-800">
                  <div className="text-[9px] text-slate-400 uppercase">Hız / Dk</div>
                  <div className="text-xs font-bold text-emerald-300 tabular-nums">
                    {itemsPerMin}
                  </div>
                </div>
                <div className="rounded-md bg-slate-900/85 py-1.5 px-1 border border-slate-800">
                  <div className="text-[9px] text-slate-400 uppercase">Depo</div>
                  <div className="text-xs font-bold text-amber-300 tabular-nums">
                    {totalStored}/{storageCap}
                  </div>
                </div>
              </div>

              {state.goldenStored > 0 && (
                <div className="flex items-center justify-between rounded bg-amber-950/40 border border-amber-400/35 px-2 py-1 text-[10px] text-amber-200">
                  <span className="inline-flex items-center gap-1 font-semibold">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    Altın Hediye
                  </span>
                  <span className="font-bold tabular-nums">{state.goldenStored}</span>
                </div>
              )}

              <div className="flex items-center justify-between rounded-md bg-slate-900/85 px-2 py-1.5 border border-slate-800 text-[10px]">
                <span className="inline-flex items-center gap-1 font-semibold text-slate-200">
                  <Truck className="w-3 h-3 text-red-400" />
                  {truckPhaseLabel[state.truck.phase]}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-300 font-bold tabular-nums">
                    {state.truck.cargoCount}/{truckCap}
                  </span>
                  {state.truck.phase === 'loading' && state.truck.cargoCount > 0 && (
                    <button
                      type="button"
                      onClick={onDispatchTruck}
                      title="Kamyonu Hemen Gönder"
                      className="rounded bg-amber-500 hover:bg-amber-400 p-1 text-slate-950 cursor-pointer"
                    >
                      <Send className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>

              {state.train.unlocked && (
                <div className="flex items-center justify-between rounded-md bg-slate-900/85 px-2 py-1.5 border border-slate-800 text-[10px]">
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-200">
                    <TrainFront className="w-3 h-3 text-amber-400" />
                    {trainPhaseLabel[state.train.phase]}
                  </span>
                  <span className="text-emerald-300 font-bold tabular-nums">
                    {state.train.cargoCount}/{trainCap}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Selected 3D Machine Card (ONLY visible when a 3D machine/object is clicked!) */}
          {selectedMachine && (
            <section className="rounded-xl border border-sky-400/45 bg-[#0c1626]/94 p-2.5 shadow-xl space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-display font-bold text-sky-200">
                <Wrench className="w-3.5 h-3.5 text-sky-400" />
                <span className="truncate">{selectedMachine.title}</span>
              </div>

              {selectedMachine.lineId && (
                <div className="text-[10px] text-amber-300">
                  {state.lines[selectedMachine.lineId].name}
                </div>
              )}

              {machineLevel !== null &&
              machineUpgradeCost !== null &&
              selectedMachine.lineId &&
              (selectedMachine.kind === 'toy_maker' ||
                selectedMachine.kind === 'wrapper' ||
                selectedMachine.kind === 'ribboner') ? (
                <button
                  type="button"
                  onClick={() =>
                    onUpgradeMachine(
                      selectedMachine.lineId!,
                      selectedMachine.kind as 'toy_maker' | 'wrapper' | 'ribboner',
                    )
                  }
                  disabled={machineLevel >= MAX_MACHINE_LEVEL || state.coins < machineUpgradeCost}
                  className={`flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-bold tabular-nums cursor-pointer ${
                    machineLevel >= MAX_MACHINE_LEVEL
                      ? 'bg-emerald-900/40 text-emerald-300 cursor-default'
                      : state.coins >= machineUpgradeCost
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {machineLevel < MAX_MACHINE_LEVEL && <ArrowUpCircle className="w-3.5 h-3.5" />}
                  <span>
                    {machineLevel >= MAX_MACHINE_LEVEL
                      ? `MAX (Sv.${machineLevel})`
                      : `Sv.${machineLevel} → ${machineLevel + 1} (${machineUpgradeCost.toLocaleString('tr-TR')} 🪙)`}
                  </span>
                </button>
              ) : selectedMachine.kind === 'generator' ? (
                <button
                  type="button"
                  onClick={onUpgradeGenerator}
                  disabled={
                    state.power.generatorLevel >= MAX_GENERATOR_LEVEL ||
                    state.coins < getGeneratorUpgradeCost(state.power.generatorLevel)
                  }
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-500 py-1.5 text-[11px] font-bold text-slate-950 cursor-pointer"
                >
                  {state.power.generatorLevel < MAX_GENERATOR_LEVEL && (
                    <ArrowUpCircle className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {state.power.generatorLevel >= MAX_GENERATOR_LEVEL
                      ? `MAX (Sv.${state.power.generatorLevel})`
                      : `Güçlendir (${getGeneratorUpgradeCost(state.power.generatorLevel).toLocaleString('tr-TR')} 🪙)`}
                  </span>
                </button>
              ) : selectedMachine.kind === 'train_station' ? (
                <button
                  type="button"
                  onClick={onUnlockOrUpgradeTrain}
                  disabled={
                    (state.train.unlocked && state.train.level >= MAX_TRAIN_LEVEL) ||
                    state.coins <
                      (state.train.unlocked
                        ? getTrainUpgradeCost(state.train.level)
                        : getTrainUnlockCost())
                  }
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 py-1.5 text-[11px] font-bold text-slate-950 cursor-pointer"
                >
                  {!(state.train.unlocked && state.train.level >= MAX_TRAIN_LEVEL) && (
                    <ArrowUpCircle className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {state.train.unlocked && state.train.level >= MAX_TRAIN_LEVEL
                      ? `MAX (Sv.${state.train.level})`
                      : `${state.train.unlocked ? 'Geliştir' : 'Treni Aç'} (${(state.train.unlocked
                          ? getTrainUpgradeCost(state.train.level)
                          : getTrainUnlockCost()
                        ).toLocaleString('tr-TR')} 🪙)`}
                  </span>
                </button>
              ) : (
                <div className="text-[10px] text-slate-300 leading-snug">
                  {selectedMachine.kind === 'storage' &&
                    `Raflarda ${totalStored}/${storageCap} hazır hediye var.`}
                  {selectedMachine.kind === 'truck' &&
                    `Teslimat kamyonu kapasitesi: ${truckCap} kutu.`}
                  {selectedMachine.kind === 'tree' &&
                    `Noel Ağacı Büyüsü Sv.${state.upgrades.treeMagic}`}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </aside>
  );
};
