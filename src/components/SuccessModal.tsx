import React from 'react';
import { CheckCircle2, MessageCircle, Calendar, Clock, MapPin, Sparkles, X, ShieldAlert, FileText, CalendarDays } from 'lucide-react';
import { Appointment, SalonConfig } from '../types';
import { formatCurrency, formatDate, generateWhatsAppBookingUrl } from '../utils/helpers';

export interface SuccessModalProps {
  isOpen?: boolean;
  appointment: Appointment | null;
  config: SalonConfig;
  onViewMyAppointments?: () => void;
  onClose: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen = true,
  appointment,
  config,
  onViewMyAppointments,
  onClose,
}) => {
  if (!isOpen || !appointment) return null;

  const phone = config.phone || config.whatsappNumber || '21976333205';
  const whatsappUrl = generateWhatsAppBookingUrl(phone, appointment);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-md rounded-3xl bg-slate-100 border border-sky-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-sky-700 px-6 py-5 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-full bg-white/20 mx-auto flex items-center justify-center mb-3 shadow-inner">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Agendamento Realizado!</h2>
          <p className="text-xs text-sky-100 mt-1 font-medium">
            Seu horário foi pré-reservado com sucesso na Moreninha do Bronze.
          </p>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* PIX RECEIPT ALERT - "na parte pix antercipado colocar enviar comprovante para agendar" */}
          {appointment.paymentMethod === 'pix' ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-2">
              <div className="flex items-center gap-2 font-extrabold text-amber-900 text-xs uppercase tracking-wide">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                Atenção: Enviar Comprovante do PIX
              </div>
              <p className="text-xs leading-relaxed text-amber-900 font-medium">
                Para confirmação definitiva da sua vaga, por favor <strong>envie o comprovante do PIX</strong> no WhatsApp clicando no botão verde abaixo.
              </p>
              {appointment.receiptImage && (
                <div className="pt-1.5 border-t border-amber-200 flex items-center gap-2 text-[11px] text-emerald-800 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Comprovante anexado no agendamento! Envie também pelo WhatsApp.
                </div>
              )}
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 text-xs">
              <strong className="block font-bold mb-0.5">Pagamento no Local</strong>
              Seu agendamento foi registrado. Você poderá pagar diretamente na recepção.
            </div>
          )}

          {/* Details Card */}
          <div className="p-4 rounded-2xl bg-slate-200/90 border border-slate-300 space-y-3 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-800 pb-2 border-b border-slate-300">
              <span className="text-sky-700">{appointment.serviceName}</span>
              <span className="text-slate-900 font-extrabold">{formatCurrency(appointment.servicePrice)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-700">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-600 shrink-0" />
                <span>{formatDate(appointment.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-600 shrink-0" />
                <span>{appointment.time}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-300 flex items-start gap-2 text-slate-600 text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
              <span>{config.address || config.fullAddress}</span>
            </div>
          </div>

          {/* WhatsApp Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <MessageCircle className="w-5 h-5 fill-white/20" />
            {config.btnSuccessWhatsAppText || (appointment.paymentMethod === 'pix'
              ? 'Enviar Comprovante no WhatsApp'
              : 'Confirmar Vaga no WhatsApp'
            )}
          </a>

          {onViewMyAppointments && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onViewMyAppointments();
              }}
              className="w-full py-2.5 rounded-2xl bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border border-sky-300"
            >
              <CalendarDays className="w-4 h-4 text-sky-600" />
              {config.btnSuccessMyAppointmentsText || 'Ver Meus Agendamentos'}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-slate-300 hover:bg-slate-400/60 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            {config.btnSuccessCloseText || 'Concluir e Voltar ao Início'}
          </button>
        </div>
      </div>
    </div>
  );
};
