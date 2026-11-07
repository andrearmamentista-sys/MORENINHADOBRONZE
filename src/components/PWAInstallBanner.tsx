import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, X, Share2, PlusSquare, Sparkles } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Suppress banner if already installed or dismissed by user
  if (isInstalled || isDismissed) {
    return null;
  }

  // Only render if browser supports prompt or is iOS
  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      {/* Floating Install Prompt Banner */}
      <div className="fixed bottom-20 sm:bottom-6 inset-x-4 max-w-md mx-auto z-40 animate-in fade-in slide-in-from-bottom-3 duration-300">
        <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-sky-400/30 text-white shadow-2xl flex items-center justify-between gap-3 ring-1 ring-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center shrink-0 shadow-md shadow-sky-600/30">
              <Sparkles className="w-5 h-5 text-amber-200 fill-amber-200" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                Instale o App Moreninha
              </h4>
              <p className="text-[11px] text-sky-200/90 truncate">
                Acesse horários e agende com 1 toque
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isInstallable && (
              <button
                type="button"
                onClick={install}
                className="py-1.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-sky-600/30 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instalar</span>
              </button>
            )}

            {isIOS && (
              <button
                type="button"
                onClick={() => setShowIOSModal(true)}
                className="py-1.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-sky-600/30 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Como Instalar</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Dispensar aviso de instalação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Guided Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-sky-400/40 p-5 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-600/30 text-sky-400 flex items-center justify-center">
                  <Download className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-white">Instalar no iPhone / iPad</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Para instalar este aplicativo no seu iPhone e abrir direto da sua tela inicial:
            </p>

            <div className="space-y-3 bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                  1
                </div>
                <p className="text-slate-200">
                  Toque no ícone de <strong>Compartilhar</strong> <Share2 className="w-3.5 h-3.5 inline mx-1 text-sky-400" /> na barra inferior do Safari.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                  2
                </div>
                <p className="text-slate-200">
                  Role para baixo e selecione <strong>Adicionar à Tela de Início</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-sky-400" />.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Entendi, obrigado!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
