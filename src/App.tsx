import { useCallback, useEffect, useRef, useState } from 'react';
import { Sparkles, Trophy, Check } from 'lucide-react';
import { BottomDock } from './components/BottomDock';
import { LeftPanel } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';
import { TitleScreen } from './components/TitleScreen';
import { TopBar } from './components/TopBar';
import { ResetConfirmModal, TutorialModal } from './components/TutorialModal';
import { soundEngine } from './game/audio';
import {
  ACHIEVEMENTS,
  createInitialGameState,
  generateSantaOrder,
  getGeneratorCapacityKw,
  getGeneratorUpgradeCost,
  getGiftTierMeta,
  getGlobalUpgradeCost,
  getMachineUpgradeCost,
  getTrainUnlockCost,
  getTrainUpgradeCost,
  getWorkerHireCost,
  GIFT_TIERS,
  GLOBAL_UPGRADES,
  LINE_IDS,
  LINE_Y_BASE,
  LINE_Z_POSITIONS,
  MAX_GENERATOR_LEVEL,
  MAX_MACHINE_LEVEL,
  MAX_TRAIN_LEVEL,
  STORAGE_KEY,
  TOY_LABELS,
} from './game/constants';
import { FactoryScene } from './game/FactoryScene';
import {
  checkAchievements,
  claimAchievement,
  claimAllAchievements,
  claimSantaOrder,
  getAchievementProgress,
  performRebirth,
  stepSimulation,
  type SimCallbackEvent,
} from './game/simulation';
import type {
  AchievementUnlockNotification,
  CameraAction,
  FloatingEvent,
  GameState,
  LeftTab,
  LineId,
  MajorUnlockBanner,
  SelectedMachineInfo,
  ToyType,
} from './types/game';

function loadSavedGame(): { state: GameState; hasSaved: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { state: createInitialGameState(), hasSaved: false };
    const parsed = JSON.parse(raw) as Partial<GameState>;
    const base = createInitialGameState();

    const mergeLine = (id: LineId) => {
      const baseLine = base.lines[id];
      const savedLine: Partial<typeof baseLine> = parsed.lines?.[id] ?? {};
      const mergedLine = {
        ...baseLine,
        ...savedLine,
        name: baseLine.name,
        floor: baseLine.floor,
        unlockCost: baseLine.unlockCost,
        availableToys: baseLine.availableToys,
        toyMakerLevel: Math.min(
          MAX_MACHINE_LEVEL,
          Math.max(1, savedLine.toyMakerLevel ?? baseLine.toyMakerLevel),
        ),
        wrapperLevel: Math.min(
          MAX_MACHINE_LEVEL,
          Math.max(1, savedLine.wrapperLevel ?? baseLine.wrapperLevel),
        ),
        ribbonerLevel: Math.min(
          MAX_MACHINE_LEVEL,
          Math.max(1, savedLine.ribbonerLevel ?? baseLine.ribbonerLevel),
        ),
      };
      if (!mergedLine.availableToys.includes(mergedLine.toyType)) {
        mergedLine.toyType = baseLine.toyType;
      }
      return mergedLine;
    };

    const mergedUpgrades = { ...base.upgrades, ...(parsed.upgrades || {}) };
    for (const meta of GLOBAL_UPGRADES) {
      mergedUpgrades[meta.id] = Math.min(
        meta.maxLevel,
        Math.max(1, mergedUpgrades[meta.id] ?? 1),
      );
    }

    const clampedGenLevel = Math.min(
      MAX_GENERATOR_LEVEL,
      Math.max(1, parsed.power?.generatorLevel ?? base.power.generatorLevel),
    );
    const clampedTrainLevel = Math.min(
      MAX_TRAIN_LEVEL,
      Math.max(1, parsed.train?.level ?? base.train.level),
    );

    const merged: GameState = {
      ...base,
      ...parsed,
      lines: {
        line1: mergeLine('line1'),
        line2: mergeLine('line2'),
        line3: mergeLine('line3'),
        line4: mergeLine('line4'),
        line5: mergeLine('line5'),
        line6: mergeLine('line6'),
      },
      upgrades: mergedUpgrades,
      power: {
        ...base.power,
        ...(parsed.power || {}),
        generatorLevel: clampedGenLevel,
        capacityKw: getGeneratorCapacityKw(clampedGenLevel),
      },
      environment: { ...base.environment, ...(parsed.environment || {}) },
      stored: { ...base.stored, ...(parsed.stored || {}) },
      truck: {
        ...base.truck,
        ...(parsed.truck || {}),
        cargo: { ...base.truck.cargo, ...(parsed.truck?.cargo || {}) },
      },
      train: { ...base.train, ...(parsed.train || {}), level: clampedTrainLevel },
      orders:
        Array.isArray(parsed.orders) && parsed.orders.length > 0
          ? parsed.orders
          : base.orders,
      claimedAchievements: Array.isArray(parsed.claimedAchievements)
        ? parsed.claimedAchievements
        : [],
      unlockedAchievements: Array.isArray(parsed.unlockedAchievements)
        ? parsed.unlockedAchievements
        : [],
      items: Array.isArray(parsed.items) ? parsed.items : [],
      recentProducedTimestamps: [],
    };
    for (const ach of ACHIEVEMENTS) {
      if (
        merged.claimedAchievements.includes(ach.id) ||
        getAchievementProgress(merged, ach) >= ach.target
      ) {
        if (!merged.unlockedAchievements.includes(ach.id)) {
          merged.unlockedAchievements.push(ach.id);
        }
      }
    }
    return { state: merged, hasSaved: true };
  } catch {
    return { state: createInitialGameState(), hasSaved: false };
  }
}

function snapshotHudState(s: GameState): GameState {
  return {
    ...s,
    lines: {
      line1: { ...s.lines.line1 },
      line2: { ...s.lines.line2 },
      line3: { ...s.lines.line3 },
      line4: { ...s.lines.line4 },
      line5: { ...s.lines.line5 },
      line6: { ...s.lines.line6 },
    },
    upgrades: { ...s.upgrades },
    power: { ...s.power },
    environment: { ...s.environment },
    stored: { ...s.stored },
    truck: { ...s.truck, cargo: { ...s.truck.cargo } },
    train: { ...s.train },
    orders: s.orders.map((o) => ({ ...o })),
    unlockedAchievements: s.unlockedAchievements.slice(),
    claimedAchievements: s.claimedAchievements.slice(),
    items: [],
    recentProducedTimestamps: s.recentProducedTimestamps.slice(),
  };
}

export default function App() {
  const initialLoad = useRef(loadSavedGame());
  const gameStateRef = useRef<GameState>(initialLoad.current.state);
  const sceneRef = useRef<FactoryScene | null>(null);
  const canvasMountRef = useRef<HTMLDivElement | null>(null);

  const [hudState, setHudState] = useState<GameState>(() =>
    snapshotHudState(initialLoad.current.state),
  );
  const [hasSavedProgress, setHasSavedProgress] = useState<boolean>(
    initialLoad.current.hasSaved,
  );
  const [screen, setScreen] = useState<'title' | 'playing'>('title');
  const [activeTab, setActiveTab] = useState<LeftTab>('factory');
  const [leftOpen, setLeftOpen] = useState<boolean>(false);
  const [rightOpen, setRightOpen] = useState<boolean>(true);
  const [hudHidden, setHudHidden] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [selectedMachine, setSelectedMachine] = useState<SelectedMachineInfo | null>(null);
  const [toasts, setToasts] = useState<FloatingEvent[]>([]);
  const [celebration, setCelebration] = useState<MajorUnlockBanner | null>(null);
  const [achievementQueue, setAchievementQueue] = useState<AchievementUnlockNotification[]>([]);
  const achievementNotice = achievementQueue[0] ?? null;

  const toastIdRef = useRef(1);
  const celebrationTimerRef = useRef<number | null>(null);
  const screenRef = useRef(screen);
  screenRef.current = screen;

  const pushToast = useCallback((ev: Omit<FloatingEvent, 'id'>) => {
    const id = toastIdRef.current++;
    setToasts((prev) => [...prev.slice(-2), { ...ev, id }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  const triggerCelebration = useCallback(
    (banner: Omit<MajorUnlockBanner, 'id'>) => {
      const id = toastIdRef.current++;
      if (celebrationTimerRef.current !== null) {
        window.clearTimeout(celebrationTimerRef.current);
      }
      setCelebration({ ...banner, id });
      celebrationTimerRef.current = window.setTimeout(() => {
        setCelebration((curr) => (curr?.id === id ? null : curr));
        celebrationTimerRef.current = null;
      }, 3600);
    },
    [],
  );

  const triggerAchievementNotice = useCallback(
    (notice: Omit<AchievementUnlockNotification, 'id'>) => {
      const id = toastIdRef.current++;
      setAchievementQueue((prev) => {
        if (prev.some((a) => a.achievementId === notice.achievementId)) return prev;
        return [...prev, { ...notice, id }];
      });
    },
    [],
  );

  useEffect(() => {
    const activeId = achievementQueue[0]?.id;
    if (activeId === undefined) return;
    const t = window.setTimeout(() => {
      setAchievementQueue((prev) => prev.filter((a) => a.id !== activeId));
    }, 4600);
    return () => window.clearTimeout(t);
  }, [achievementQueue]);

  const handleSimEvents = useCallback(
    (events: SimCallbackEvent[]) => {
      for (const ev of events) {
        if (ev.kind === 'sound') {
          if (ev.sfx === 'machine') soundEngine.playMachineTick();
          else if (ev.sfx === 'wrap') soundEngine.playWrapPop();
          else if (ev.sfx === 'ribbon') soundEngine.playRibbonChime();
          else if (ev.sfx === 'coin') soundEngine.playCoinEarned();
          else if (ev.sfx === 'truck') soundEngine.playTruckHorn();
          else if (ev.sfx === 'train') soundEngine.playTrainWhistle();
          else if (ev.sfx === 'golden') soundEngine.playGoldenSparkle();
          else if (ev.sfx === 'order') soundEngine.playOrderComplete();
        } else if (ev.kind === 'sparkle') {
          sceneRef.current?.spawnSparkleBurst(ev.x, ev.y, ev.z, ev.color);
        } else if (ev.kind === 'toast') {
          pushToast(ev.event);
        } else if (ev.kind === 'celebrate') {
          triggerCelebration({
            badge: ev.badge,
            title: ev.title,
            subtitle: ev.subtitle,
            accent: ev.accent,
          });
          sceneRef.current?.spawnCelebrationBurst(0, 5.0, 0);
        } else if (ev.kind === 'achievement') {
          triggerAchievementNotice({
            achievementId: ev.achievementId,
            title: ev.title,
            description: ev.description,
            rewardCoins: ev.rewardCoins,
            rewardXp: ev.rewardXp,
          });
          sceneRef.current?.spawnCelebrationBurst(-3, 4.5, -2, [
            0xfacc15,
            0x22c55e,
            0xfef08a,
            0xffffff,
          ]);
          sceneRef.current?.spawnCelebrationBurst(3, 4.5, 2, [
            0xfacc15,
            0xe879f9,
            0x38bdf8,
            0xffffff,
          ]);
        }
      }
    },
    [pushToast, triggerCelebration, triggerAchievementNotice],
  );

  const syncHudNow = useCallback(() => {
    setHudState(snapshotHudState(gameStateRef.current));
  }, []);

  const saveToStorage = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameStateRef.current));
    } catch {
      // Ignore quota errors
    }
  }, []);

  useEffect(() => {
    const mountEl = canvasMountRef.current;
    if (!mountEl) return;

    let lastHudSync = performance.now();

    const scene = new FactoryScene(
      mountEl,
      () => gameStateRef.current,
      (rawDt) => {
        if (screenRef.current !== 'playing') return;
        const events = stepSimulation(gameStateRef.current, rawDt);
        if (events.length > 0) handleSimEvents(events);

        const now = performance.now();
        if (now - lastHudSync >= 240) {
          lastHudSync = now;
          setHudState(snapshotHudState(gameStateRef.current));
        }
      },
      (info) => {
        if (info) {
          soundEngine.playClick();
          setRightOpen(true);
        }
        setSelectedMachine(info);
      },
    );

    sceneRef.current = scene;

    const saveInterval = window.setInterval(() => {
      if (screenRef.current === 'playing') {
        saveToStorage();
      }
    }, 3500);

    const handleBeforeUnload = () => {
      saveToStorage();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.clearInterval(saveInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      scene.dispose();
      soundEngine.dispose();
    };
  }, [handleSimEvents, saveToStorage]);

  useEffect(() => {
    soundEngine.setMuted(hudState.muted);
    soundEngine.setMusicEnabled(hudState.musicEnabled);
  }, [hudState.muted, hudState.musicEnabled]);

  const startPlaying = useCallback(() => {
    soundEngine.unlock();
    soundEngine.playClick();
    setScreen('playing');
    sceneRef.current?.setTitleMode(false);
    if (!gameStateRef.current.tutorialSeen) {
      setShowTutorial(true);
    }
  }, []);

  const startFreshGame = useCallback(() => {
    soundEngine.unlock();
    soundEngine.playClick();
    const fresh = createInitialGameState();
    fresh.tutorialSeen = false;
    gameStateRef.current = fresh;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    setHasSavedProgress(false);
    setSelectedMachine(null);
    syncHudNow();
    setScreen('playing');
    sceneRef.current?.setTitleMode(false);
    setShowTutorial(true);
  }, [syncHudNow]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (screenRef.current === 'title') {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          startPlaying();
        }
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        soundEngine.playClick();
        gameStateRef.current.isRunning = !gameStateRef.current.isRunning;
        syncHudNow();
      } else if (e.key === 'h' || e.key === 'H') {
        setHudHidden((v) => !v);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [startPlaying, syncHudNow]);

  const handleUnlockLine = (lineId: LineId) => {
    const state = gameStateRef.current;
    const line = state.lines[lineId];
    if (line.unlocked || state.coins < line.unlockCost) {
      soundEngine.playError();
      return;
    }
    state.coins -= line.unlockCost;
    line.unlocked = true;
    line.spawnTimer = 0.5;
    if (line.floor === 2) {
      state.floor2Unlocked = true;
    } else if (line.floor === 3) {
      state.floor3Unlocked = true;
    }
    soundEngine.playOrderComplete();
    sceneRef.current?.spawnCelebrationBurst(
      -3.5,
      LINE_Y_BASE[lineId] + 1.6,
      LINE_Z_POSITIONS[lineId],
      [0x22c55e, 0xfacc15, 0x38bdf8, 0xffffff],
    );
    sceneRef.current?.spawnCelebrationBurst(
      3.5,
      LINE_Y_BASE[lineId] + 1.6,
      LINE_Z_POSITIONS[lineId],
      [0x22c55e, 0xfacc15, 0xef4444, 0xffffff],
    );

    if (state.orders.length < 3) {
      state.orders.push(
        generateSantaOrder(
          state.nextOrderSeq++,
          state.level,
          state.lines.line2.unlocked,
          state.lines.line3.unlocked,
          state.lines.line4.unlocked,
          state.lines.line5.unlocked,
          state.lines.line6.unlocked,
          state.rebirthCount,
        ),
      );
    }

    triggerCelebration({
      badge: line.floor === 3 ? '3. KAT AÇILDI!' : line.floor === 2 ? '2. KAT AÇILDI!' : 'YENİ HAT AÇILDI!',
      title: `${line.name} Açıldı!`,
      subtitle: `${line.subtitle} üretimi artık otomatik çalışıyor.`,
      accent: 'emerald',
    });
    handleSimEvents(checkAchievements(state));
    saveToStorage();
    syncHudNow();
  };

  const handleChangeLineToy = (lineId: LineId, toy: ToyType) => {
    const line = gameStateRef.current.lines[lineId];
    if (!line.unlocked || !line.availableToys.includes(toy)) return;
    soundEngine.playClick();
    line.toyType = toy;
    pushToast({ text: `${line.name}: ${TOY_LABELS[toy]} üretiliyor`, color: 'gold' });
    saveToStorage();
    syncHudNow();
  };

  const handleHireWorker = (lineId: LineId) => {
    const state = gameStateRef.current;
    const line = state.lines[lineId];
    if (!line.unlocked || line.workers >= 3) return;
    const cost = getWorkerHireCost(lineId, line.workers);
    if (state.coins < cost) {
      soundEngine.playError();
      return;
    }
    state.coins -= cost;
    line.workers += 1;
    soundEngine.playOrderComplete();
    sceneRef.current?.spawnSparkleBurst(
      -4.5,
      LINE_Y_BASE[lineId] + 1.4,
      LINE_Z_POSITIONS[lineId] + 1.0,
      0x22c55e,
    );
    pushToast({ text: `${line.name}: Yeni Elf İşçi Katıldı!`, color: 'green' });
    handleSimEvents(checkAchievements(state));
    saveToStorage();
    syncHudNow();
  };

  const handleUpgradeMachine = (
    lineId: LineId,
    kind: 'toy_maker' | 'wrapper' | 'ribboner',
  ) => {
    const state = gameStateRef.current;
    const line = state.lines[lineId];
    const currentLevel =
      kind === 'toy_maker'
        ? line.toyMakerLevel
        : kind === 'wrapper'
        ? line.wrapperLevel
        : line.ribbonerLevel;
    if (currentLevel >= MAX_MACHINE_LEVEL) return;
    const cost = getMachineUpgradeCost(kind, lineId, currentLevel);

    if (state.coins < cost) {
      soundEngine.playError();
      return;
    }

    state.coins -= cost;
    if (kind === 'toy_maker') line.toyMakerLevel += 1;
    else if (kind === 'wrapper') line.wrapperLevel += 1;
    else line.ribbonerLevel += 1;

    soundEngine.playCoinEarned();
    const xPos = kind === 'toy_maker' ? -6.5 : kind === 'wrapper' ? -1.0 : 3.5;
    sceneRef.current?.spawnSparkleBurst(
      xPos,
      LINE_Y_BASE[lineId] + 1.8,
      LINE_Z_POSITIONS[lineId],
      0xfacc15,
    );
    handleSimEvents(checkAchievements(state));
    saveToStorage();
    syncHudNow();
  };

  const handleUpgradeGenerator = () => {
    const state = gameStateRef.current;
    if (state.power.generatorLevel >= MAX_GENERATOR_LEVEL) return;
    const cost = getGeneratorUpgradeCost(state.power.generatorLevel);
    if (state.coins < cost) {
      soundEngine.playError();
      return;
    }
    state.coins -= cost;
    state.power.generatorLevel += 1;
    state.power.capacityKw = getGeneratorCapacityKw(state.power.generatorLevel);
    soundEngine.playOrderComplete();
    sceneRef.current?.spawnCelebrationBurst(7.5, 2.5, -7.0, [0x38bdf8, 0xfacc15, 0xffffff]);
    triggerCelebration({
      badge: 'ENERJİ GÜÇLENDİRİLDİ',
      title: `Jeneratör Sv.${state.power.generatorLevel} Açıldı!`,
      subtitle: `Yeni fabrika elektrik kapasitesi: ${state.power.capacityKw} kW`,
      accent: 'sky',
    });
    saveToStorage();
    syncHudNow();
  };

  const handleUnlockOrUpgradeTrain = () => {
    const state = gameStateRef.current;
    if (state.train.unlocked && state.train.level >= MAX_TRAIN_LEVEL) return;
    const cost = state.train.unlocked
      ? getTrainUpgradeCost(state.train.level)
      : getTrainUnlockCost();
    if (state.coins < cost) {
      soundEngine.playError();
      return;
    }
    state.coins -= cost;
    if (!state.train.unlocked) {
      state.train.unlocked = true;
      state.train.phase = 'arriving';
      state.train.phaseProgress = 0;
      soundEngine.playTrainWhistle();
      triggerCelebration({
        badge: 'YENİ LOJİSTİK',
        title: 'Yılbaşı Kargo Treni Açıldı!',
        subtitle: 'Artık dev tren partileriyle +%15 ekstra kazançla sevkiyat yapılıyor!',
        accent: 'gold',
      });
    } else {
      state.train.level += 1;
      soundEngine.playOrderComplete();
      triggerCelebration({
        badge: 'TREN GELİŞTİRİLDİ',
        title: `Kargo Treni Sv.${state.train.level} Açıldı!`,
        subtitle: state.train.level === 2
          ? '2. Kargo Vagonu bağlandı! Kapasite ve tren hızı yükseldi.'
          : 'Tren kapasitesi ve sevkiyat hızı artırıldı!',
        accent: 'gold',
      });
    }
    sceneRef.current?.spawnCelebrationBurst(16.5, 2.4, -4.2, [0xfacc15, 0xef4444, 0x22c55e, 0xffffff]);
    saveToStorage();
    syncHudNow();
  };

  const handleBuyGlobalUpgrade = (upgradeId: keyof GameState['upgrades']) => {
    const state = gameStateRef.current;
    const meta = GLOBAL_UPGRADES.find((u) => u.id === upgradeId);
    if (!meta) return;
    const lvl = state.upgrades[upgradeId];
    if (lvl >= meta.maxLevel) return;
    const cost = getGlobalUpgradeCost(meta, lvl);

    if (state.coins < cost) {
      soundEngine.playError();
      return;
    }

    state.coins -= cost;
    state.upgrades[upgradeId] += 1;
    const newLvl = state.upgrades[upgradeId];
    soundEngine.playOrderComplete();
    sceneRef.current?.spawnCelebrationBurst(0, 3.2, 0, [0xfacc15, 0xf97316, 0x22c55e, 0x38bdf8]);
    triggerCelebration({
      badge: `GELİŞTİRME SV.${newLvl}`,
      title: `${meta.name} Açıldı!`,
      subtitle: meta.effectText(newLvl),
      accent: 'gold',
    });
    saveToStorage();
    syncHudNow();
  };

  const handleUpgradeGiftTier = () => {
    const state = gameStateRef.current;
    if (state.upgrades.giftTier >= GIFT_TIERS.length) return;
    const nextTier = getGiftTierMeta(state.upgrades.giftTier + 1);
    if (state.coins < nextTier.upgradeCost) {
      soundEngine.playError();
      return;
    }
    state.coins -= nextTier.upgradeCost;
    state.upgrades.giftTier = nextTier.tier;
    soundEngine.playOrderComplete();
    LINE_IDS.forEach((lid) => {
      if (state.lines[lid].unlocked) {
        sceneRef.current?.spawnCelebrationBurst(
          -1.0,
          LINE_Y_BASE[lid] + 1.8,
          LINE_Z_POSITIONS[lid],
          [nextTier.hex, nextTier.ribbonHex, 0xffffff, 0xfacc15],
        );
      }
    });
    triggerCelebration({
      badge: 'YENİ HEDİYE PAKETİ!',
      title: `${nextTier.name} Açıldı!`,
      subtitle: `Tüm hediyeler ${nextTier.colorName} renge geçti · Kazanç ×${nextTier.multiplier}`,
      accent: 'gold',
    });
    saveToStorage();
    syncHudNow();
  };

  const handlePerformRebirth = () => {
    const { nextState, events } = performRebirth(gameStateRef.current);
    if (!nextState) {
      soundEngine.playError();
      return;
    }
    gameStateRef.current = nextState;
    setSelectedMachine(null);
    handleSimEvents(events);
    sceneRef.current?.spawnCelebrationBurst(0, 6.5, 0, [0xe879f9, 0xfacc15, 0x38bdf8, 0xffffff]);
    sceneRef.current?.spawnCelebrationBurst(-8, 9.5, -8, [0xfacc15, 0xe879f9, 0x22c55e]);
    sceneRef.current?.spawnCelebrationBurst(4, 3.0, 10, [0x38bdf8, 0xfacc15, 0xef4444]);
    sceneRef.current?.handleCameraAction({ type: 'reset' });
    saveToStorage();
    syncHudNow();
  };

  const handleClaimOrder = (orderId: string) => {
    const events = claimSantaOrder(gameStateRef.current, orderId);
    handleSimEvents(events);
    saveToStorage();
    syncHudNow();
  };

  const handleClaimAchievement = (achId: string) => {
    const events = claimAchievement(gameStateRef.current, achId);
    handleSimEvents(events);
    setAchievementQueue((prev) => prev.filter((a) => a.achievementId !== achId));
    saveToStorage();
    syncHudNow();
  };

  const handleClaimAllAchievements = () => {
    const events = claimAllAchievements(gameStateRef.current);
    handleSimEvents(events);
    setAchievementQueue([]);
    saveToStorage();
    syncHudNow();
  };

  const handleDispatchTruck = () => {
    const truck = gameStateRef.current.truck;
    if (truck.phase === 'loading' && truck.cargoCount > 0) {
      truck.phase = 'delivering';
      truck.phaseProgress = 0;
      soundEngine.playTruckHorn();
      syncHudNow();
    }
  };

  const handleCycleWeather = () => {
    soundEngine.playClick();
    const env = gameStateRef.current.environment;
    const order: Array<'snow' | 'blizzard' | 'clear'> = ['snow', 'blizzard', 'clear'];
    env.weather = order[(order.indexOf(env.weather) + 1) % order.length];
    env.weatherTimer = 28;
    const label =
      env.weather === 'blizzard'
        ? 'Hava: Şiddetli Tipi!'
        : env.weather === 'snow'
        ? 'Hava: Yumuşak Kar Yağışı'
        : 'Hava: Açık Kış Göğü';
    pushToast({ text: label, color: 'gold' });
    syncHudNow();
  };

  const handleCycleTime = () => {
    soundEngine.playClick();
    const env = gameStateRef.current.environment;
    const isDay = env.timeOfDay > 0.08 && env.timeOfDay < 0.52;
    env.timeOfDay = isDay ? 0.78 : 0.25;
    pushToast({ text: isDay ? 'Yılbaşı Gecesi' : 'Karlı Gündüz', color: 'gold' });
    syncHudNow();
  };

  const handleToggleRun = () => {
    soundEngine.playClick();
    gameStateRef.current.isRunning = !gameStateRef.current.isRunning;
    syncHudNow();
  };

  const handleSetSpeed = (speed: 1 | 2 | 3) => {
    soundEngine.playClick();
    gameStateRef.current.gameSpeed = speed;
    syncHudNow();
  };

  const handleCameraAction = (action: CameraAction) => {
    soundEngine.playClick();
    sceneRef.current?.handleCameraAction(action);
  };

  const handleToggleMute = () => {
    soundEngine.unlock();
    gameStateRef.current.muted = !gameStateRef.current.muted;
    if (!gameStateRef.current.muted) soundEngine.playClick();
    saveToStorage();
    syncHudNow();
  };

  const handleToggleMusic = () => {
    soundEngine.unlock();
    soundEngine.playClick();
    gameStateRef.current.musicEnabled = !gameStateRef.current.musicEnabled;
    saveToStorage();
    syncHudNow();
  };

  const handleCloseTutorial = () => {
    soundEngine.playClick();
    gameStateRef.current.tutorialSeen = true;
    setShowTutorial(false);
    saveToStorage();
    syncHudNow();
  };

  const handleConfirmReset = () => {
    soundEngine.playClick();
    const fresh = createInitialGameState();
    fresh.tutorialSeen = true;
    gameStateRef.current = fresh;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    setShowResetConfirm(false);
    setSelectedMachine(null);
    syncHudNow();
    pushToast({ text: 'Fabrika sıfırlandı!', color: 'red' });
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0c1729]">
      <div ref={canvasMountRef} className="fixed inset-0 z-0" />

      {screen === 'title' && (
        <TitleScreen
          hasSavedProgress={hasSavedProgress}
          savedLevel={hudState.level}
          savedCoins={hudState.coins}
          onStart={startPlaying}
          onNewGame={startFreshGame}
        />
      )}

      {screen === 'playing' && (
        <>
          {!hudHidden && (
            <>
              <TopBar
                state={hudState}
                onToggleMute={handleToggleMute}
                onToggleMusic={handleToggleMusic}
                onCycleWeather={handleCycleWeather}
                onCycleTime={handleCycleTime}
                onOpenPowerShop={() => {
                  soundEngine.playClick();
                  setActiveTab('shop');
                  setLeftOpen(true);
                }}
                onOpenRebirth={() => {
                  soundEngine.playClick();
                  setActiveTab('rebirth');
                  setLeftOpen(true);
                }}
                onOpenAchievements={() => {
                  soundEngine.playClick();
                  setActiveTab('achievements');
                  setLeftOpen(true);
                }}
                onOpenTutorial={() => {
                  soundEngine.playClick();
                  setShowTutorial(true);
                }}
                onRequestReset={() => {
                  soundEngine.playClick();
                  setShowResetConfirm(true);
                }}
              />

              <LeftPanel
                state={hudState}
                activeTab={activeTab}
                isOpen={leftOpen}
                onSelectTab={(tab) => {
                  soundEngine.playClick();
                  setActiveTab(tab);
                }}
                onToggleOpen={() => {
                  soundEngine.playClick();
                  setLeftOpen((v) => !v);
                }}
                onUnlockLine={handleUnlockLine}
                onChangeLineToy={handleChangeLineToy}
                onHireWorker={handleHireWorker}
                onUpgradeMachine={handleUpgradeMachine}
                onUpgradeGenerator={handleUpgradeGenerator}
                onUnlockOrUpgradeTrain={handleUnlockOrUpgradeTrain}
                onBuyGlobalUpgrade={handleBuyGlobalUpgrade}
                onUpgradeGiftTier={handleUpgradeGiftTier}
                onClaimOrder={handleClaimOrder}
                onClaimAchievement={handleClaimAchievement}
                onClaimAllAchievements={handleClaimAllAchievements}
                onPerformRebirth={handlePerformRebirth}
                onFocusLine={(lineId) => handleCameraAction({ type: 'focus_line', lineId })}
              />

              <RightPanel
                state={hudState}
                selectedMachine={selectedMachine}
                isOpen={rightOpen}
                onToggleOpen={() => {
                  soundEngine.playClick();
                  setRightOpen((v) => !v);
                }}
                onClaimOrder={handleClaimOrder}
                onDispatchTruck={handleDispatchTruck}
                onUpgradeMachine={handleUpgradeMachine}
                onUpgradeGenerator={handleUpgradeGenerator}
                onUnlockOrUpgradeTrain={handleUnlockOrUpgradeTrain}
              />
            </>
          )}

          {celebration && (
            <div
              key={celebration.id}
              className="pointer-events-none fixed top-16 left-1/2 -translate-x-1/2 z-40 w-[min(92vw,420px)]"
            >
              <div
                className={`rounded-2xl border px-4 py-3 shadow-2xl text-center space-y-1 ${
                  celebration.accent === 'fuchsia'
                    ? 'border-fuchsia-400/75 bg-[#200d2e]/95 text-fuchsia-100'
                    : celebration.accent === 'emerald'
                    ? 'border-emerald-400/75 bg-[#082419]/95 text-emerald-100'
                    : celebration.accent === 'sky'
                    ? 'border-sky-400/75 bg-[#0a1e33]/95 text-sky-100'
                    : 'border-amber-300/80 bg-[#231906]/95 text-amber-100'
                }`}
              >
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase text-amber-300">
                  <Sparkles className="w-3 h-3" />
                  <span>{celebration.badge}</span>
                </div>
                <div className="font-display text-base font-bold tracking-wide text-white">
                  {celebration.title}
                </div>
                <div className="text-xs text-slate-200 leading-snug">
                  {celebration.subtitle}
                </div>
              </div>
            </div>
          )}

          {achievementNotice && (
            <div
              key={achievementNotice.id}
              className="pointer-events-auto fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-[min(94vw,430px)]"
            >
              <div className="flex items-center gap-3 rounded-2xl border-2 border-amber-300/85 bg-gradient-to-r from-[#241804]/96 via-[#1a1306]/96 to-[#0e2017]/96 px-4 py-3 shadow-[0_12px_36px_rgba(251,191,36,0.35)]">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-300/60 bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-lg">
                  <Trophy className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                    BAŞARIM AÇILDI!
                  </div>
                  <div className="font-display text-sm font-bold text-white truncate">
                    {achievementNotice.title}
                  </div>
                  <div className="text-[11px] text-slate-200 truncate">
                    {achievementNotice.description}
                  </div>
                  <div className="text-[11px] font-bold text-emerald-300 tabular-nums mt-0.5">
                    Ödül: +{achievementNotice.rewardCoins.toLocaleString('tr-TR')} 🪙 · +{achievementNotice.rewardXp} XP
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleClaimAchievement(achievementNotice.achievementId)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 hover:from-amber-200 hover:to-amber-400 px-3 py-2 text-xs font-bold text-slate-950 shadow cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Ödülü Al</span>
                </button>
              </div>
            </div>
          )}

          {toasts.length > 0 && (
            <div
              className={`pointer-events-none fixed left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1 ${
                celebration ? 'top-40' : 'top-14'
              }`}
            >
              {toasts.map((t) => (
                <div
                  key={t.id}
                  className={`rounded-xl border px-4 py-1.5 text-xs font-bold shadow-lg ${
                    t.color === 'gold'
                      ? 'border-amber-300/60 bg-[#1a1608]/95 text-amber-200'
                      : t.color === 'green'
                      ? 'border-emerald-400/60 bg-[#082016]/95 text-emerald-200'
                      : 'border-red-400/60 bg-[#250b0e]/95 text-red-200'
                  }`}
                >
                  {t.text}
                </div>
              ))}
            </div>
          )}

          <BottomDock
            isRunning={hudState.isRunning}
            gameSpeed={hudState.gameSpeed}
            hudHidden={hudHidden}
            onToggleRun={handleToggleRun}
            onSetSpeed={handleSetSpeed}
            onCameraAction={handleCameraAction}
            onToggleHud={() => {
              soundEngine.playClick();
              setHudHidden((v) => !v);
            }}
          />

          {showTutorial && <TutorialModal onClose={handleCloseTutorial} />}
          {showResetConfirm && (
            <ResetConfirmModal
              onConfirm={handleConfirmReset}
              onCancel={() => {
                soundEngine.playClick();
                setShowResetConfirm(false);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
