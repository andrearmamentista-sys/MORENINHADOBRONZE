import React from 'react';
import { 
  CalendarPlus, 
  MessageCircle, 
  Instagram, 
  Clock, 
  MapPin, 
  Sparkles,
  ExternalLink 
} from 'lucide-react';
import { SalonConfig } from '../types';
import { formatWhatsAppUrl, formatInstagramUrl } from '../utils/helpers';

export interface HeroProps {
  config: SalonConfig;
  onOpenMap?: () => void;
  onOpenAdmin?: () => void;
  onScheduleClick?: () => void;
  onOpenTips?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ 
  config, 
  onOpenMap, 
  onOpenAdmin,
  onScheduleClick,
  onOpenTips,
}) => {
  const phone = config.whatsappNumber || config.phone || '21976333205';
  const salonTitle = config.salonName || config.name || 'Moreninha do Bronze';
  const waUrl = formatWhatsAppUrl(
    phone,
    `Olá! Vim pelo site da ${salonTitle} e gostaria de agendar um horário.`
  );
  const instagramUrl = formatInstagramUrl(config.instagramUrl || config.instagramHandle || 'moreninhadobronze');
  
  const coverImage = config.heroCoverImage || config.coverImageUrl || '/images/banner.png';
  const avatarImage = config.avatarImage || config.avatarUrl || '/images/avatar.png';
  const addressText = config.shortAddress || config.address || config.fullAddress || 'Rua Aurélia, Mesquita – RJ';
  const hoursText = config.openingHoursText || 'Segunda a Sábado: 09:00 às 21:00';

  return (
    <div className="w-full">
      {/* PROFILE HERO HEADER - Brightened to clearly show background with minimal shadow */}
      <div className="relative w-full h-[320px] sm:h-[350px] bg-slate-900 overflow-hidden shadow-lg">
        {/* Cover Background */}
        <img
          src={coverImage}
          alt={salonTitle}
          className="absolute inset-0 w-full h-full object-cover object-center opacity-90"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.includes('/images/banner.png') && !target.src.includes('Image_1_e88f8927.png')) {
              target.src = '/images/banner.png';
            } else if (!target.src.includes('Image_1_e88f8927.png')) {
              target.src = '/assets/aistudio/Image_1_e88f8927.png';
            }
          }}
        />
        {/* Subtle overall ambient tint */}
        <div className="absolute inset-0 bg-slate-950/25 pointer-events-none" />

        {/* Progressive shadow at the bottom for balanced contrast and depth */}
        <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-slate-950/85 via-slate-950/45 to-transparent pointer-events-none" />

        {/* Avatar & Title Centered Inside Hero */}
        <div className="absolute inset-0 px-5 text-center flex flex-col items-center justify-end pb-8">
          {/* Avatar / Logo with soft gradient aura that dissolves smoothly */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-1 bg-gradient-to-b from-sky-400 via-sky-600/70 to-slate-900/60 border-2 border-sky-300 shadow-2xl mb-3 overflow-hidden ring-4 ring-sky-400/30 backdrop-blur-md flex items-center justify-center relative">
            {avatarImage ? (
              <img
                src={avatarImage}
                alt={salonTitle}
                className="w-full h-full object-contain rounded-2xl drop-shadow-sm"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('/images/avatar.png') && !target.src.includes('Captura_de_tela_2026-10-27_134951_b73b2e4c.png')) {
                    target.src = '/images/avatar.png';
                  } else if (!target.src.includes('Captura_de_tela_2026-10-27_134951_b73b2e4c.png')) {
                    target.src = '/assets/aistudio/Captura_de_tela_2026-10-27_134951_b73b2e4c.png';
                  } else {
                    target.style.display = 'none';
                  }
                }}
              />
            ) : (
              <div className="w-full h-full rounded-2xl bg-sky-600 flex items-center justify-center text-white font-serif font-black text-2xl tracking-wider">
                MB
              </div>
            )}
          </div>

          {/* Title in Serif Font (Playfair Display / Cormorant) */}
          <h1 className="text-2xl sm:text-3xl font-serif font-extrabold text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
            {salonTitle}
          </h1>

          {/* Subtitle in Uppercase Sky Blue */}
          <p className="text-xs sm:text-sm text-sky-200 font-bold tracking-widest uppercase mt-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
            {addressText}
          </p>

          {/* Status Badge */}
          <div className="mt-3 inline-flex items-center gap-2 py-1 px-3.5 rounded-full text-[11px] font-bold bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 backdrop-blur-md shadow-xs tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{config.statusPillText || 'Aberto • Atendimento até 21h'}</span>
          </div>
        </div>
      </div>

      {/* QUICK ACTION BUTTONS (Floating cleanly over the bottom of the hero) */}
      <div className="px-4 -mt-5 relative z-20 space-y-3">
        {/* Main CTA: Agendar Procedimento */}
        {onScheduleClick && (
          <button
            type="button"
            onClick={onScheduleClick}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-sky-700 hover:from-sky-500 hover:to-sky-600 active:scale-[0.99] text-white font-bold text-sm shadow-xl shadow-sky-900/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer ring-1 ring-sky-300/30"
          >
            <CalendarPlus className="w-5 h-5 text-sky-100" />
            <span>{config.btnScheduleText || 'Agendar Procedimento'}</span>
          </button>
        )}

        {/* 2 Equal Buttons: WhatsApp & Instagram */}
        <div className="grid grid-cols-2 gap-3">
          {/* WhatsApp Button */}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-xs group cursor-pointer active:scale-98"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-xs group-hover:scale-110 transition-transform">
              <MessageCircle className="w-3.5 h-3.5 fill-white" />
            </div>
            <span className="text-slate-800 font-extrabold">{config.btnWhatsAppText || 'WhatsApp'}</span>
          </a>

          {/* Instagram Button with Official Gradient Badge */}
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-xs group cursor-pointer active:scale-98"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-xs group-hover:scale-110 transition-transform">
              <Instagram className="w-3.5 h-3.5" />
            </div>
            <span className="text-slate-800 font-extrabold">{config.btnInstagramText || 'Instagram'}</span>
          </a>
        </div>

        {/* INFO CARD (Light gray per 'aonde for branco coloque um cinza claro') */}
        <div className="bg-slate-100 border border-slate-300 rounded-2xl p-4 space-y-3 shadow-xs">
          {/* Working hours */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700 shrink-0 mt-0.5">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Horário de Funcionamento</h4>
              <p className="text-xs text-slate-600 font-medium">{hoursText}</p>
            </div>
          </div>

          {/* Address with Map Trigger */}
          <div className="border-t border-slate-200 pt-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700 shrink-0 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-slate-800">Endereço</h4>
              <p className="text-xs text-slate-600 font-medium">{config.fullAddress || config.address || addressText}</p>
              {onOpenMap && (
                <button
                  type="button"
                  onClick={onOpenMap}
                  className="text-[11px] text-sky-700 hover:text-sky-800 hover:underline font-bold mt-1 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>{config.btnMapText || 'Ver no mapa'}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
