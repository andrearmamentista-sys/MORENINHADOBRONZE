import React, { useState } from 'react';
import { X, MapPin, ExternalLink, Navigation, Copy, Check, Compass } from 'lucide-react';
import { SalonConfig } from '../types';
import { formatGoogleMapsUrl, formatGoogleMapsDirectionsUrl } from '../utils/helpers';

interface MapModalProps {
  isOpen: boolean;
  config: SalonConfig;
  onClose: () => void;
}

export const MapModal: React.FC<MapModalProps> = ({ isOpen, config, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [mapError, setMapError] = useState(false);

  if (!isOpen) return null;

  const addressText = config.fullAddress || config.address || 'Rua Aurélia, Mesquita – RJ, 26553-000';
  const salonTitle = config.salonName || config.name || 'Moreninha do Bronze';

  const mapsHref = formatGoogleMapsUrl(addressText, config.mapsUrl);
  const directionsHref = formatGoogleMapsDirectionsUrl(addressText);
  const encodedQuery = encodeURIComponent(addressText);
  const embedUrl = `https://maps.google.com/maps?q=${encodedQuery}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

  const handleCopy = () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(addressText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = addressText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback silent
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-slate-100 border border-slate-200 rounded-3xl w-full max-w-md p-5 sm:p-6 space-y-4 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="map-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 id="map-modal-title" className="font-serif font-bold text-base sm:text-lg text-slate-900 leading-tight">
                Nossa Localização
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">
                Mesquita – RJ
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition hover:bg-slate-300 cursor-pointer"
            aria-label="Fechar janela"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Real Interactive Map or Stylized Card */}
        <div className="rounded-2xl overflow-hidden border border-slate-300 relative bg-slate-200/90 h-52 sm:h-56 shadow-inner flex flex-col">
          {!mapError ? (
            <iframe
              title="Localização do Salão no Google Maps"
              src={embedUrl}
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              onError={() => setMapError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-5 space-y-3">
              <div className="w-12 h-12 rounded-full bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-600/30 animate-bounce">
                <Navigation className="w-6 h-6 fill-white" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif font-bold text-base text-slate-900">
                  {salonTitle}
                </h4>
                <p className="text-xs text-slate-600 font-medium">
                  {addressText}
                </p>
              </div>
            </div>
          )}

          {/* Overlay Badge to indicate location pin */}
          <div className="absolute top-2.5 left-2.5 bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 shadow-md pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>{salonTitle}</span>
          </div>
        </div>

        {/* Address Card with Copy Action */}
        <div className="bg-slate-200/70 p-3.5 rounded-2xl border border-slate-300 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              <div className="text-[11px] font-bold text-sky-800 uppercase tracking-wide flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                Endereço
              </div>
              <p className="text-xs font-semibold text-slate-800 leading-snug">
                {addressText}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Fácil acesso • Próximo ao centro de Mesquita
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className={`shrink-0 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-100 hover:bg-slate-300/80 text-slate-700 border-slate-300'
              }`}
              title="Copiar endereço"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-2 border-t border-slate-300 text-[11px] text-slate-600">
            <span className="font-bold text-slate-700">Espaço Climatizado & Exclusivo: </span>
            ambiente higienizado, preparado para seu bronze perfeito com total discrição e conforto.
          </div>
        </div>

        {/* Main Action Buttons */}
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-2">
            {/* Direct Google Maps View Button */}
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-[0.98] text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-sky-600/25 cursor-pointer text-center"
            >
              <span>{config.btnMapOpenText || 'Abrir no Google Maps'}</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>

            {/* Traçar Rota Button */}
            <a
              href={directionsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-slate-900/20 cursor-pointer text-center"
            >
              <Compass className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
              <span>Traçar Rota</span>
            </a>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-300 transition cursor-pointer"
          >
            {config.btnMapCloseText || 'Fechar'}
          </button>
        </div>
      </div>
    </div>
  );
};
