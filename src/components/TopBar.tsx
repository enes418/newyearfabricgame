import React from 'react';
import {
  Coins,
  Gift,
  CheckCircle2,
  Star,
  Zap,
  CloudSnow,
  Sun,
  Moon,
  Wind,
  Volume2,
  VolumeX,
  Music,
  HelpCircle,
  RotateCcw,
  Crown,
  Trophy,
} from 'lucide-react';
import type { GameState } from '../types/game';
import { ACHIEVEMENTS, getRebirthMultiplier } from '../game/constants';
import { getAchievementProgress } from '../game/simulation';

interface TopBarProps {
  state: GameState;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onCycleWeather: () => void;
  onCycleTime: () => void;
  onOpenPowerShop: () => void;
  onOpenRebirth: () => void;
  onOpenAchievements: () => void;
  onOpenTutorial: () => void;
  onRequestReset: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  state,
  onToggleMute,
  onToggleMusic,
  onCycleWeather,
  onCycleTime,
  onOpenPowerShop,
  onOpenRebirth,
  onOpenAchievements,
  onOpenTutorial,
  onRequestReset,
}) => {
  const xpPct = Math.min(100, Math.round((state.xp / Math.max(1, state.xpToNext)) * 100));
  const powerOverloaded = state.power.usedKw > state.power.capacityKw;
  const unlockedAchCount = ACHIEVEMENTS.filter(
    (a) =>
      state.unlockedAchievements.includes(a.id) ||
      state.claimedAchievements.includes(a.id) ||
      getAchievementProgress(state, a) >= a.target,
  ).length;
  const readyAchCount = ACHIEVEMENTS.filter(
    (a) =>
      !state.claimedAchievements.includes(a.id) &&
      (state.unlockedAchievements.includes(a.id) || getAchievementProgress(state, a) >= a.target),
  ).length;

  const isDay = state.environment.timeOfDay > 0.08 && state.environment.timeOfDay < 0.52;
  const weatherLabel =
    state.environment.weather === 'blizzard'
      ? 'Tipi'
      : state.environment.weather === 'snow'
      ? 'Karlı'
      : 'Açık';

  return (
    <header className="pointer-events-none fixed top-2.5 left-3 right-3 z-20 flex items-center justify-between gap-2">
      {/* Compact Brand + Metrics Unified Bar */}
      <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-amber-400/35 bg-[#0c1626]/92 px-3 py-1.5 shadow-lg">
        <div className="flex items-center gap-2 pr-2 border-r border-slate-700/80">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-red-600 to-red-800 border border-amber-300/50 text-amber-200 font-display font-bold text-xs">
            CF
          </div>
          <span className="font-display text-xs font-bold text-amber-100 tracking-wide hidden lg:inline">
            CHRISTMAS FACTORY
          </span>
        </div>

        {/* Coins */}
        <div className="flex items-center gap-1.5">
          <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-xs font-bold text-amber-300 tabular-nums">
            {state.coins.toLocaleString('tr-TR')}
          </span>
        </div>

        <div className="h-3.5 w-px bg-slate-700/80" />

        {/* Produced */}
        <div className="flex items-center gap-1.5" title="Üretilen Hediye">
          <Gift className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span className="text-xs font-bold text-slate-100 tabular-nums">
            {state.totalProduced.toLocaleString('tr-TR')}
          </span>
        </div>

        <div className="h-3.5 w-px bg-slate-700/80" />

        {/* Completed Orders */}
        <div className="flex items-center gap-1.5" title="Tamamlanan Sipariş">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold text-emerald-300 tabular-nums">
            {state.completedOrders}
          </span>
        </div>

        <div className="h-3.5 w-px bg-slate-700/80" />

        {/* Electricity */}
        <button
          type="button"
          onClick={onOpenPowerShop}
          title="Elektrik Durumu (Jeneratör için tıkla)"
          className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums cursor-pointer transition-colors ${
            powerOverloaded
              ? 'bg-orange-500/20 text-orange-300'
              : 'text-sky-300 hover:bg-slate-800'
          }`}
        >
          <Zap className="w-3.5 h-3.5 shrink-0" />
          <span>
            {state.power.usedKw}/{state.power.capacityKw}kW
          </span>
        </button>

        <div className="h-3.5 w-px bg-slate-700/80 hidden sm:block" />

        {/* Level + Slim XP */}
        <div className="hidden sm:flex items-center gap-2 min-w-[96px]">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
          <div className="flex-1 leading-none">
            <div className="flex items-center justify-between text-[10px] font-bold">
              <span className="text-amber-100">Sv.{state.level}</span>
              <span className="text-slate-400 tabular-nums">{xpPct}%</span>
            </div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-300"
                style={{ width: `${xpPct}%` }}
              />
            </div>
          </div>
        </div>

        {state.rebirthCount > 0 && (
          <>
            <div className="h-3.5 w-px bg-slate-700/80 hidden sm:block" />
            <button
              type="button"
              onClick={onOpenRebirth}
              title="Rebirth Bonusu"
              className="hidden sm:inline-flex items-center gap-1 rounded-md bg-fuchsia-500/20 border border-fuchsia-400/40 px-1.5 py-0.5 text-[10px] font-bold text-fuchsia-200 hover:bg-fuchsia-500/30 tabular-nums cursor-pointer"
            >
              <Crown className="w-3 h-3 text-amber-300" />
              <span>R{state.rebirthCount} · x{getRebirthMultiplier(state.rebirthCount).toFixed(2)}</span>
            </button>
          </>
        )}
        <div className="h-3.5 w-px bg-slate-700/80 hidden md:block" />

        {/* Achievements quick trigger */}
        <button
          type="button"
          onClick={onOpenAchievements}
          title="Başarımlar Panelini Aç"
          className={`relative hidden md:inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums cursor-pointer transition-colors ${
            readyAchCount > 0
              ? 'bg-amber-500/25 border border-amber-400/60 text-amber-200 hover:bg-amber-500/35'
              : 'text-amber-300/90 hover:bg-slate-800'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{unlockedAchCount}/{ACHIEVEMENTS.length}</span>
          {readyAchCount > 0 && (
            <span className="ml-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-400 px-1 text-[9px] font-bold text-slate-950 animate-pulse">
              {readyAchCount}
            </span>
          )}
        </button>
      </div>

      {/* Compact Utility Cluster */}
      <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-slate-700/80 bg-[#0c1626]/92 p-1 shadow-lg">
        <button
          type="button"
          onClick={onCycleTime}
          title="Gündüz / Gece Geçişi"
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-amber-200 hover:bg-slate-800 cursor-pointer"
        >
          {isDay ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-sky-300" />}
          <span className="hidden md:inline">{isDay ? 'Gündüz' : 'Gece'}</span>
        </button>

        <button
          type="button"
          onClick={onCycleWeather}
          title="Hava Durumu (Karlı / Tipi / Açık)"
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-sky-200 hover:bg-slate-800 cursor-pointer"
        >
          {state.environment.weather === 'blizzard' ? (
            <Wind className="w-3.5 h-3.5 text-sky-300" />
          ) : (
            <CloudSnow className="w-3.5 h-3.5 text-sky-200" />
          )}
          <span className="hidden md:inline">{weatherLabel}</span>
        </button>

        <div className="h-4 w-px bg-slate-700 mx-0.5" />

        <button
          type="button"
          onClick={onToggleMusic}
          title={state.musicEnabled ? 'Müziği Kapat' : 'Müziği Aç'}
          className={`rounded-lg p-1.5 cursor-pointer transition-colors ${
            state.musicEnabled && !state.muted
              ? 'bg-emerald-600/30 text-emerald-200'
              : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Music className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onToggleMute}
          title={state.muted ? 'Sesi Aç' : 'Sesi Kapat'}
          className={`rounded-lg p-1.5 cursor-pointer transition-colors ${
            !state.muted
              ? 'bg-amber-500/20 text-amber-200'
              : 'bg-red-500/25 text-red-300'
          }`}
        >
          {state.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        <button
          type="button"
          onClick={onOpenTutorial}
          title="Nasıl Oynanır?"
          className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onRequestReset}
          title="Oyunu Sıfırla"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-900/40 hover:text-red-300 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
