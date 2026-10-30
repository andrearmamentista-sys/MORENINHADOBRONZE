import React from 'react';
import { X, Calendar, Clock, Scissors, CreditCard, MessageCircle, AlertCircle, Sparkles, Trash2 } from 'lucide-react';
import { Appointment, SalonConfig } from '../types';
import { formatCurrency, formatDateBR, generateWhatsAppBookingUrl } from '../utils/helpers';

export interface MyAppointmentsModalProps {
  isOpen?: boolean;
  appointments: Appointment[];
  config: SalonConfig;
  onCancelAppointment?: (id: string) => void;
  onNewBookingClick?: () => void;
  onClose: () => void;
}

export const MyAppointmentsModal: React.FC<MyAppointmentsModalProps> = ({
  isOpen = true,
  appointments,
  config,
  onCancelAppointment,
  onNewBookingClick,
  onClose,
}) => {
  if (!isOpen) return null;

  const phoneString: string = config.phone || config.whatsappNumber || '21976333205';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-lg rounded-3xl bg-slate-100 border border-sky-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-sky-700 px-5 py-4 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-sky-100" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">Meus Agendamentos</h2>
              <p className="text-xs text-sky-100">Histórico e status das suas reservas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-3.5 flex-1">
          {appointments.length === 0 ? (
            <div className="p-8 text-center bg-slate-200/60 rounded-3xl border border-slate-300 text-slate-500 text-xs space-y-3">
              <Sparkles className="w-8 h-8 text-sky-400 mx-auto mb-1" />
              <p className="font-bold text-slate-700">Você ainda não possui agendamentos gravados neste dispositivo.</p>
              <p className="text-[11px] text-slate-500">
                Escolha um de nossos procedimentos na tela inicial para fazer seu agendamento.
              </p>
              {onNewBookingClick && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNewBookingClick();
                  }}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  {config.btnNewBookingText || 'Agendar Agora'}
                </button>
              )}
            </div>
          ) : (
            appointments.map((app) => {
              const whatsappUrl = generateWhatsAppBookingUrl(phoneString, app);
              const isConfirmed = app.status === 'confirmed' || app.status === 'confirmado';
              const isCancelled = app.status === 'cancelled' || app.status === 'cancelado';

              return (
                <div
                  key={app.id}
                  className="p-4 rounded-2xl bg-slate-200/90 border border-slate-300 space-y-2.5 text-xs shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-900">{app.serviceName}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isConfirmed
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : isCancelled
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {isConfirmed ? 'Confirmado' : isCancelled ? 'Cancelado' : 'Pendente'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-slate-700 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-sky-600" />
                      <span>{formatDateBR(app.date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-sky-600" />
                      <span>{app.time}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-300 text-slate-600">
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-sky-600" />
                      {app.paymentMethod === 'pix' ? 'PIX Antecipado' : 'No Local'}
                    </span>
                    <span className="font-extrabold text-sky-800 text-sm">
                      {formatCurrency(app.servicePrice)}
                    </span>
                  </div>

                  {app.paymentMethod === 'pix' && !app.receiptImage && (
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Lembrete: Envie o comprovante do PIX pelo WhatsApp para validação da vaga.</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Enviar Comprovante no WhatsApp
                    </a>

                    {onCancelAppointment && !isCancelled && (
                      <button
                        type="button"
                        onClick={() => onCancelAppointment(app.id)}
                        className="p-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 transition-colors cursor-pointer"
                        title="Cancelar Agendamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-200/90 px-5 py-3 border-t border-slate-300 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-300 hover:bg-slate-400/60 text-slate-700 font-bold text-xs cursor-pointer"
          >
            {config.btnMyAppointmentsCloseText || 'Fechar'}
          </button>
        </div>
      </div>
    </div>
  );
};
