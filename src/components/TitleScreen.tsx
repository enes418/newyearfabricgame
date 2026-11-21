import React from 'react';
import { Play, RotateCcw } from 'lucide-react';

interface TitleScreenProps {
  hasSavedProgress: boolean;
  savedLevel: number;
  savedCoins: number;
  onStart: () => void;
  onNewGame: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  hasSavedProgress,
  savedLevel,
  savedCoins,
  onStart,
  onNewGame,
}) => {
  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-between p-6 md:p-10 pointer-events-none">
      {/* Subtle left-side vignette gradient for crisp title legibility without obscuring the 3D factory */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 22% 45%, rgba(9, 17, 30, 0.82) 0%, rgba(9, 17, 30, 0.35) 48%, rgba(9, 17, 30, 0.12) 100%)',
        }}
      />

      {/* Top Badge */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 rounded-lg border border-amber-400/35 bg-[#0d192b]/90 px-3 py-1.5 text-xs font-semibold tracking-wider text-amber-300 uppercase">
          <span>Kuzey Kutbu Atölyesi</span>
          <span className="text-slate-500">•</span>
          <span>3D Tycoon</span>
        </div>
      </div>

      {/* Main Left-Aligned Lockup & CTA */}
      <div className="relative z-10 max-w-md my-auto pointer-events-auto">
        {/* Bespoke Inline SVG Title Lockup */}
        <svg
          viewBox="0 0 420 148"
          className="w-full max-w-[400px] h-auto mb-3 drop-shadow-[0_6px_20px_rgba(0,0,0,0.65)]"
          aria-label="Christmas Factory 3D"
        >
          <defs>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="redRibbon" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#991b1b" />
              <stop offset="50%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>
          </defs>

          {/* Decorative Ribbon Banner */}
          <path
            d="M14 22 L386 22 L374 42 L386 62 L14 62 L26 42 Z"
            fill="url(#redRibbon)"
            stroke="#fbbf24"
            strokeWidth="2"
          />
          {/* North Star Emblem */}
          <polygon
            points="210,2 215,15 228,15 218,23 221,36 210,28 199,36 202,23 192,15 205,15"
            fill="url(#goldGrad)"
          />
          <text
            x="210"
            y="49"
            textAnchor="middle"
            fill="#fffbeb"
            fontFamily="Fredoka, sans-serif"
            fontWeight="700"
            fontSize="24"
            letterSpacing="2.5"
          >
            CHRISTMAS
          </text>
          <text
            x="210"
            y="108"
            textAnchor="middle"
            fill="url(#goldGrad)"
            fontFamily="Fredoka, sans-serif"
            fontWeight="700"
            fontSize="52"
            letterSpacing="3"
          >
            FACTORY
          </text>
          <path
            d="M55 124 Q210 134 365 124"
            fill="none"
            stroke="#22c55e"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="55" cy="124" r="4" fill="#ef4444" />
          <circle cx="210" cy="129" r="5" fill="#fbbf24" />
          <circle cx="365" cy="124" r="4" fill="#ef4444" />
        </svg>

        <p className="text-sm md:text-base text-slate-200/95 leading-relaxed mb-6">
          Kendi yılbaşı oyuncak atölyeni kur, otomatik üretim bantlarını hızlandır,
          Noel Baba’nın siparişlerini kamyonla teslim et ve devasa bir hediye fabrikası yönet.
        </p>

        {hasSavedProgress && (
          <div className="mb-4 inline-flex items-center gap-3 rounded-lg border border-emerald-400/30 bg-[#0d1d2b]/90 px-3.5 py-2 text-xs text-emerald-200 tabular-nums">
            <span>Kayıtlı Fabrika: Seviye {savedLevel}</span>
            <span className="text-slate-500">•</span>
            <span className="text-amber-300 font-semibold">{savedCoins.toLocaleString('tr-TR')} Altın</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onStart}
            className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 active:translate-y-0.5 border border-amber-300/60 px-6 py-3.5 text-base font-display font-bold text-white shadow-lg shadow-red-950/50 cursor-pointer transition-colors"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{hasSavedProgress ? 'FABRİKAYA DÖN' : 'FABRİKAYI AÇ'}</span>
          </button>

          {hasSavedProgress && (
            <button
              type="button"
              onClick={onNewGame}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-500/60 bg-[#0f1c30]/90 hover:bg-[#172945] px-4 py-3.5 text-sm font-semibold text-slate-200 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Yeni Oyun</span>
            </button>
          )}
        </div>
      </div>

      {/* Single Flat Control-Hint Line */}
      <div className="relative z-10 text-xs text-slate-300/90 tracking-wide">
        Sürükle: Kamerayı Döndür · Tekerlek: Yakınlaş/Uzaklaş · Tıkla: Makine Seç · Space / Enter: Başlat
      </div>
    </div>
  );
};
