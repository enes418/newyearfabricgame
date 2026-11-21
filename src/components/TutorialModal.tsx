import React from 'react';
import { Gift, Wrench, Truck, Zap, X, AlertTriangle } from 'lucide-react';

interface TutorialModalProps {
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#060d18]/78 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-amber-400/50 bg-[#0e1b2f] p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-amber-200">
              Hoş Geldin, Fabrika Şefi!
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Kısa Christmas Factory yönetim rehberi
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-start gap-3 rounded-xl border border-slate-700/80 bg-slate-900/75 p-3">
            <div className="rounded-lg bg-red-600/25 p-2 text-red-400 shrink-0">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-100">
                1. 9 Farklı Oyuncak & Hediye Paketleri
              </div>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Tren, Araba, Ayı, Robot, Bebek, Kar Küresi, Fındıkkıran, Uzay Roketi ve Altın Kızak üret! Hediye paketlerini geliştirerek değerini katla.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-slate-700/80 bg-slate-900/75 p-3">
            <div className="rounded-lg bg-emerald-600/25 p-2 text-emerald-400 shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-100">
                2. Kamyon & Kargo Treni Lojistiği
              </div>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Depodaki hediyeleri Noel Kamyonu taşır; Mağaza’dan Yılbaşı Kargo Trenini açarak dev partilerle +%15 kazanç sağlayabilirsin.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-slate-700/80 bg-slate-900/75 p-3">
            <div className="rounded-lg bg-sky-500/25 p-2 text-sky-300 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-100">
                3. 3 Katlı Atölye, Elektrik & Elf İşçiler
              </div>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Yeni hatlar kurdukça jeneratörünü güçlendir. Hatlara Elf İşçi alarak makineleri hızlandır ve 2. ile 3. Kat üretim alanlarını aç!
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-slate-700/80 bg-slate-900/75 p-3">
            <div className="rounded-lg bg-amber-500/25 p-2 text-amber-300 shrink-0">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-100">
                4. Siparişler, Başarımlar & Rebirth
              </div>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Yeterli altına ulaştığında Rebirth atarak fabrikanı fiziksel olarak büyüt ve tüm kazançlarını kalıcı olarak 1.5 katına çıkar!
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 py-3 font-display text-sm font-bold text-white cursor-pointer transition-colors shadow-lg"
        >
          Anladım, Üretime Başla!
        </button>
      </div>
    </div>
  );
};

interface ResetConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#060d18]/80 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-red-400/50 bg-[#0e1b2f] p-5 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-red-600/25 p-2.5 text-red-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-white">Fabrikayı Sıfırla?</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Tüm kayıtlı ilerlemen, makinelerin ve paran başlangıç seviyesine dönecek.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-600 bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 cursor-pointer"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            Evet, Sıfırla
          </button>
        </div>
      </div>
    </div>
  );
};
