import React from 'react';
import {
  Play,
  Pause,
  Gauge,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Compass,
  EyeOff,
  Eye,
} from 'lucide-react';
import type { CameraAction } from '../types/game';

interface BottomDockProps {
  isRunning: boolean;
  gameSpeed: 1 | 2 | 3;
  hudHidden: boolean;
  onToggleRun: () => void;
  onSetSpeed: (speed: 1 | 2 | 3) => void;
  onCameraAction: (action: CameraAction) => void;
  onToggleHud: () => void;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  isRunning,
  gameSpeed,
  hudHidden,
  onToggleRun,
  onSetSpeed,
  onCameraAction,
  onToggleHud,
}) => {
  return (
    <div className="pointer-events-none fixed bottom-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 max-w-[96vw]">
      {hudHidden ? (
        <button
          type="button"
          onClick={onToggleHud}
          className="pointer-events-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-600/70 bg-[#0c1626]/92 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white shadow cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Paneli Göster</span>
        </button>
      ) : (
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl border border-amber-400/35 bg-[#0c1626]/94 px-2.5 py-1.5 shadow-2xl">
          {/* Play / Pause */}
          <button
            type="button"
            onClick={onToggleRun}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer transition-colors border ${
              isRunning
                ? 'bg-amber-500/20 border-amber-400/50 text-amber-200 hover:bg-amber-500/30'
                : 'bg-emerald-600 border-emerald-400 text-white hover:bg-emerald-500'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Durdur</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Başlat</span>
              </>
            )}
          </button>

          <div className="h-5 w-px bg-slate-700/80" />

          {/* Speed Multipliers */}
          <div className="flex items-center gap-0.5 rounded-lg bg-slate-900/90 p-0.5 border border-slate-700/70">
            <Gauge className="w-3.5 h-3.5 text-slate-400 mx-1" />
            {([1, 2, 3] as const).map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => onSetSpeed(spd)}
                className={`rounded-md px-2 py-1 text-[11px] font-bold tabular-nums cursor-pointer transition-colors ${
                  gameSpeed === spd
                    ? 'bg-red-600 text-white'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-slate-700/80 hidden sm:block" />

          {/* Camera Controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onCameraAction({ type: 'rotate_left' })}
              title="Sola Döndür"
              className="rounded-lg border border-slate-700 bg-slate-900/90 p-1.5 text-slate-300 hover:text-white cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onCameraAction({ type: 'rotate_right' })}
              title="Sağa Döndür"
              className="rounded-lg border border-slate-700 bg-slate-900/90 p-1.5 text-slate-300 hover:text-white cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onCameraAction({ type: 'zoom_in' })}
              title="Yakınlaş"
              className="rounded-lg border border-slate-700 bg-slate-900/90 p-1.5 text-slate-300 hover:text-white cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onCameraAction({ type: 'zoom_out' })}
              title="Uzaklaş"
              className="rounded-lg border border-slate-700 bg-slate-900/90 p-1.5 text-slate-300 hover:text-white cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onCameraAction({ type: 'reset' })}
              title="Açıyı Sıfırla"
              className="rounded-lg border border-slate-700 bg-slate-900/90 p-1.5 text-amber-300 hover:text-white cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-5 w-px bg-slate-700/80" />

          <button
            type="button"
            onClick={onToggleHud}
            title="Panelleri Gizle (H)"
            className="rounded-lg border border-slate-700 bg-slate-900/90 p-1.5 text-slate-300 hover:text-white cursor-pointer"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
