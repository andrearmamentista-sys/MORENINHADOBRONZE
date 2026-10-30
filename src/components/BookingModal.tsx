import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Phone, 
  CreditCard, 
  QrCode, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  FileText, 
  Trash2,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Loader2,
  ShoppingCart,
  Plus
} from 'lucide-react';
import { Service, SalonConfig, Appointment, Specialist } from '../types';
import { formatCurrency, formatDate, generatePixPayload, formatPixKey } from '../utils/helpers';
import { optimizeAndFitImage } from '../utils/imageOptimizer';
import QRCode from 'qrcode';

export interface BookingModalProps {
  isOpen?: boolean;
  service?: Service;
  services?: Service[];
  initialServiceId?: string;
  config: SalonConfig;
  existingAppointments?: Appointment[];
  specialists?: Specialist[];
  onClose: () => void;
  onConfirmBooking?: (newAppointment: Appointment) => void;
  onConfirm?: (appointmentData: {
    clientName: string;
    clientPhone: string;
    date: string;
    time: string;
    paymentMethod: 'pix' | 'local';
    receiptImage?: string;
  }) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen = true,
  service: propService,
  services = [],
  initialServiceId,
  config,
  existingAppointments = [],
  specialists = [],
  onClose,
  onConfirmBooking,
  onConfirm,
}) => {
  // Cart state: users can book one or multiple services/combos
  // If user clicked a specific service (propService or initialServiceId), start with it.
  // Otherwise, start with an EMPTY cart so the user chooses their procedure!
  const [cart, setCart] = useState<Service[]>(() => {
    if (propService) return [propService];
    if (initialServiceId && services.length > 0) {
      const found = services.find((s) => s.id === initialServiceId);
      if (found) return [found];
    }
    return [];
  });

  // Sync cart when propService or initialServiceId changes
  useEffect(() => {
    if (propService) {
      setCart([propService]);
    } else if (initialServiceId && services.length > 0) {
      const found = services.find((s) => s.id === initialServiceId);
      if (found) {
        setCart([found]);
      } else {
        setCart([]);
      }
    } else {
      setCart([]);
    }
  }, [propService, initialServiceId, services]);

  const handleAddToCart = (serviceToAdd: Service) => {
    setCart((prev) => [...prev, serviceToAdd]);
    setErrorMsg('');
  };

  const handleRemoveFromCart = (indexToRemove: number) => {
    setCart((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setErrorMsg('');
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  }, [cart]);

  const cartTotalDuration = useMemo(() => {
    return cart.reduce((sum, item) => sum + (Number(item.durationMinutes) || 60), 0);
  }, [cart]);

  // Real-time clock to automatically close past hours
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setClock(new Date());
    }, 20000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = useMemo(() => {
    const y = clock.getFullYear();
    const m = String(clock.getMonth() + 1).padStart(2, '0');
    const d = String(clock.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [clock]);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });

  // Ensure selectedDate cannot be before today
  useEffect(() => {
    if (selectedDate < todayStr) {
      setSelectedDate(todayStr);
    }
  }, [todayStr, selectedDate]);

  const [selectedTime, setSelectedTime] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'local'>('pix');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [isAdjustingReceipt, setIsAdjustingReceipt] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Default time slots 09:00 - 21:00
  const availableSlotsList = config.timeSlots || [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
  ];
  const maxCapacity = config.maxSlotsPerTime || config.slotsCapacity || 3;

  // Calculate available slots per hour and verify if hour has already passed
  const slotsWithAvailability = useMemo(() => {
    const currentHour = clock.getHours();
    const currentMinute = clock.getMinutes();
    const isToday = selectedDate === todayStr;
    const isPastDate = selectedDate < todayStr;

    return availableSlotsList.map((time) => {
      const [slotHStr, slotMStr] = time.split(':');
      const slotH = parseInt(slotHStr, 10);
      const slotM = parseInt(slotMStr, 10);

      // Past hour check: if today and current time >= slot time, mark as past
      const isPast = isPastDate || (isToday && (currentHour > slotH || (currentHour === slotH && currentMinute >= slotM)));

      const bookedCount = existingAppointments.filter((app) => {
        if (app.date !== selectedDate || app.time !== time) return false;
        const status = (app.status || '').toLowerCase();
        return status !== 'cancelled' && status !== 'cancelado';
      }).length;

      const remaining = Math.max(0, maxCapacity - bookedCount);
      const isAvailable = !isPast && remaining > 0;

      return {
        time,
        remaining,
        isPast,
        isAvailable,
      };
    });
  }, [availableSlotsList, maxCapacity, existingAppointments, selectedDate, todayStr, clock]);

  // Total remaining slots for the selected date
  const totalDaySlotsRemaining = useMemo(() => {
    return slotsWithAvailability.reduce(
      (acc, slot) => acc + (slot.isAvailable ? slot.remaining : 0),
      0
    );
  }, [slotsWithAvailability]);

  // Auto-clear selectedTime if the slot becomes unavailable or expired
  useEffect(() => {
    if (selectedTime) {
      const activeSlot = slotsWithAvailability.find((s) => s.time === selectedTime);
      if (!activeSlot || !activeSlot.isAvailable) {
        setSelectedTime('');
      }
    }
  }, [slotsWithAvailability, selectedTime]);

  // The official PIX key directed to phone 21976333205
  const rawPixKey = config.pixKey || '21976333205';
  const cleanPhoneDisplay = rawPixKey.replace(/\D/g, '') || '21976333205';
  const [pixQrCodeUrl, setPixQrCodeUrl] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState(false);

  // Generate standard Banco Central do Brasil PIX EMV payload targeting 21976333205 (+5521976333205) using cart total
  const pixPayload = useMemo(() => {
    return generatePixPayload(
      rawPixKey,
      config.pixMerchantName || config.salonName || 'MORENINHA DO BRONZE',
      config.pixMerchantCity || 'MESQUITA',
      cartTotal,
      `MB${Date.now().toString().slice(-6)}`
    );
  }, [config, cartTotal, rawPixKey]);

  // Generate instant client-side QR Code data URL with automatic fallback
  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(pixPayload, {
      width: 280,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((dataUri) => {
        if (isMounted) setPixQrCodeUrl(dataUri);
      })
      .catch(() => {
        // Debug desligado - fallback automático sem poluir o console
        if (isMounted) {
          setPixQrCodeUrl(
            `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
              pixPayload
            )}&margin=4`
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, [pixPayload]);

  if (!isOpen) return null;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixPayload);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleCopyPhoneKey = () => {
    navigator.clipboard.writeText(cleanPhoneDisplay);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 3000);
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('O arquivo do comprovante deve ter até 15MB.');
      return;
    }

    try {
      setIsAdjustingReceipt(true);
      setReceiptFileName(file.name);
      setErrorMsg('');

      // Auto-adjust photo dimensions, orientation, and compress smoothly
      const adjustedDataUrl = await optimizeAndFitImage(file, {
        maxWidth: 1400,
        maxHeight: 1400,
        quality: 0.88,
      });

      setReceiptImage(adjustedDataUrl);
    } catch (err) {
      console.error('Erro ao ajustar comprovante:', err);
      setErrorMsg('Não foi possível ajustar a imagem. Tente outro arquivo.');
    } finally {
      setIsAdjustingReceipt(false);
    }
  };

  const removeReceipt = () => {
    setReceiptImage(null);
    setReceiptFileName('');
  };

  const handleNextFromStep1 = () => {
    if (cart.length === 0) {
      setErrorMsg('Por favor, selecione o procedimento que deseja agendar.');
      return;
    }
    if (!selectedDate) {
      setErrorMsg('Selecione uma data para o agendamento.');
      return;
    }
    if (!selectedTime) {
      setErrorMsg('Selecione um horário disponível.');
      return;
    }
    setErrorMsg('');
    setStep(2);
  };

  const handleNextFromStep2 = () => {
    if (!clientName.trim()) {
      setErrorMsg('Por favor, informe seu nome completo.');
      return;
    }
    const cleanDigits = clientPhone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setErrorMsg('Por favor, informe um WhatsApp válido com DDD.');
      return;
    }
    setErrorMsg('');
    setStep(3);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim() || !selectedDate || !selectedTime) {
      setErrorMsg('Preencha todos os campos obrigatórios.');
      return;
    }

    const payload = {
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      date: selectedDate,
      time: selectedTime,
      paymentMethod,
      receiptImage: receiptImage || undefined,
    };

    if (onConfirm) {
      onConfirm(payload);
    }

    if (onConfirmBooking) {
      const combinedNames = cart.map((s) => s.name).join(' + ');
      const fullAppointment: Appointment = {
        id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        clientName: payload.clientName,
        clientPhone: payload.clientPhone,
        serviceId: cart.map((s) => s.id).join(','),
        serviceName: combinedNames,
        servicePrice: cartTotal,
        totalPrice: cartTotal,
        servicesList: cart,
        date: payload.date,
        time: payload.time,
        paymentMethod: payload.paymentMethod,
        status: 'pending',
        receiptImage: payload.receiptImage,
        createdAt: new Date().toISOString(),
        notes: `Carrinho (${cart.length} itens): ${combinedNames}`,
      };
      onConfirmBooking(fullAppointment);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="w-full max-w-lg rounded-3xl bg-slate-100 border border-sky-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-sky-700 px-5 py-4 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-sky-100" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>Agendar Procedimento</span>
                {cart.length > 0 && (
                  <span className="text-[11px] bg-white/20 text-white font-semibold px-2 py-0.5 rounded-full">
                    {cart.length} {cart.length === 1 ? 'item' : 'itens'}
                  </span>
                )}
              </h2>
              <p className="text-xs text-sky-100 font-medium">
                {cart.length > 0
                  ? `Total: ${formatCurrency(cartTotal)} • ~${cartTotalDuration >= 60 ? `${Math.floor(cartTotalDuration / 60)}h ${cartTotalDuration % 60 > 0 ? (cartTotalDuration % 60) + 'm' : ''}` : `${cartTotalDuration} min`}`
                  : 'Escolha seu procedimento para iniciar'
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="bg-slate-200/90 px-5 py-2.5 border-b border-sky-100 flex items-center justify-between text-xs font-semibold">
          <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-sky-700 font-bold' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step >= 1 ? 'bg-sky-600 text-white' : 'bg-slate-300 text-slate-600'}`}>1</span>
            Carrinho & Horário
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-sky-700 font-bold' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step >= 2 ? 'bg-sky-600 text-white' : 'bg-slate-300 text-slate-600'}`}>2</span>
            Seus Dados
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <div className={`flex items-center gap-1.5 ${step >= 3 ? 'text-sky-700 font-bold' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step >= 3 ? 'bg-sky-600 text-white' : 'bg-slate-300 text-slate-600'}`}>3</span>
            Pagamento
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-5 mt-4 p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* STEP 1: Carrinho + Data + Horário com bloqueio de horas passadas */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Carrinho de Agendamento */}
              <div className="p-3.5 rounded-2xl bg-white border border-sky-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        Procedimento Desejado
                      </h3>
                      <p className="text-[10px] text-slate-500">
                        {cart.length === 0
                          ? 'Escolha o procedimento para iniciar'
                          : `${cart.length} ${cart.length === 1 ? 'procedimento selecionado' : 'procedimentos selecionados'}`
                        }
                      </p>
                    </div>
                  </div>

                  {cart.length > 0 && (
                    <div className="text-right">
                      <span className="text-xs font-black text-sky-700 block">
                        {formatCurrency(cartTotal)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        ~{cartTotalDuration >= 60 ? `${Math.floor(cartTotalDuration / 60)}h ${cartTotalDuration % 60 > 0 ? (cartTotalDuration % 60) + 'm' : ''}` : `${cartTotalDuration}m`}
                      </span>
                    </div>
                  )}
                </div>

                {cart.length === 0 ? (
                  /* Quando ainda não escolheu nenhum procedimento */
                  <div className="pt-1 pb-1 space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Selecione o procedimento que você deseja realizar:
                    </label>
                    <select
                      onChange={(e) => {
                        const found = services.find((s) => s.id === e.target.value);
                        if (found) {
                          handleAddToCart(found);
                          e.target.value = '';
                        }
                      }}
                      defaultValue=""
                      className="w-full text-xs font-bold py-3 px-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 border-2 border-sky-500 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 cursor-pointer shadow-xs"
                    >
                      <option value="" disabled>
                        Clique aqui para escolher seu procedimento...
                      </option>
                      {services.map((srv) => (
                        <option key={srv.id} value={srv.id}>
                          {srv.name} — {formatCurrency(srv.price)} ({srv.duration || `${srv.durationMinutes || 60}m`})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <>
                    {/* Itens do Carrinho */}
                    <div className="space-y-1.5 divide-y divide-slate-100">
                      {cart.map((item, idx) => (
                        <div key={`${item.id}-${idx}`} className="pt-1.5 first:pt-0 flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                            <div className="truncate">
                              <span className="font-bold text-slate-800 truncate block">
                                {item.name}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {item.duration || `${item.durationMinutes || 60}m`} • {formatCurrency(item.price)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-extrabold text-slate-800 text-xs">
                              {formatCurrency(item.price)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveFromCart(idx)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Remover procedimento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Adicionar mais procedimentos ao carrinho */}
                    {services.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                        <select
                          onChange={(e) => {
                            const found = services.find((s) => s.id === e.target.value);
                            if (found) {
                              handleAddToCart(found);
                              e.target.value = '';
                            }
                          }}
                          defaultValue=""
                          className="w-full text-xs font-semibold py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-300 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-sky-500 cursor-pointer"
                        >
                          <option value="" disabled>
                            {config.btnAddServiceToCartText || '+ Adicionar outro procedimento ao carrinho...'}
                          </option>
                          {services.map((srv) => (
                            <option key={srv.id} value={srv.id}>
                              + {srv.name} ({formatCurrency(srv.price)})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Escolha da Data com bloqueio de datas passadas */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                  <CalendarIcon className="w-4 h-4 text-sky-600" />
                  Escolha a Data do Atendimento
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={selectedDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setSelectedDate(newDate >= todayStr ? newDate : todayStr);
                    setSelectedTime('');
                  }}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-200/90 border border-slate-300 text-slate-800 font-medium text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-slate-100 transition-all cursor-pointer"
                />
              </div>

              {/* Grade de Horários com contagem real de vagas e bloqueio automático de horário vencido */}
              <div>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
                    <Clock className="w-4 h-4 text-sky-600" />
                    Horários Disponíveis (09:00 às 21:00)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      totalDaySlotsRemaining > 0 
                        ? 'text-emerald-800 bg-emerald-100 border-emerald-300' 
                        : 'text-rose-800 bg-rose-100 border-rose-300'
                    }`}>
                      {totalDaySlotsRemaining > 0
                        ? `${totalDaySlotsRemaining} ${totalDaySlotsRemaining === 1 ? 'vaga restante hoje' : 'vagas restantes'}`
                        : 'Dia Esgotado'
                      }
                    </span>
                    <span className="text-[11px] text-sky-800 font-semibold bg-sky-100 px-2 py-0.5 rounded-full">
                      {maxCapacity} vagas/hora
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
                  {slotsWithAvailability.map((slot) => {
                    const isSelected = selectedTime === slot.time;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.isAvailable}
                        onClick={() => {
                          if (slot.isAvailable) {
                            setSelectedTime(slot.time);
                            setErrorMsg('');
                          }
                        }}
                        className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
                          slot.isPast
                            ? 'bg-slate-200/40 border-slate-300 text-slate-400 opacity-60 cursor-not-allowed'
                            : !slot.isAvailable
                            ? 'bg-rose-50/60 border-rose-200 text-rose-400 opacity-70 cursor-not-allowed'
                            : isSelected
                            ? 'bg-sky-600 text-white border-sky-600 shadow-md ring-2 ring-sky-300 cursor-pointer'
                            : 'bg-white hover:bg-sky-50 border-slate-300 hover:border-sky-300 text-slate-700 cursor-pointer shadow-2xs'
                        }`}
                      >
                        <span className="text-xs font-bold">{slot.time}</span>
                        <span
                          className={`text-[10px] mt-0.5 font-bold ${
                            slot.isPast
                              ? 'text-slate-400'
                              : !slot.isAvailable
                              ? 'text-rose-500'
                              : isSelected
                              ? 'text-sky-100'
                              : 'text-sky-700'
                          }`}
                        >
                          {slot.isPast
                            ? 'Encerrado'
                            : slot.remaining === 0
                            ? 'Esgotado'
                            : `${slot.remaining} ${slot.remaining === 1 ? 'vaga' : 'vagas'}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-sky-900 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[12px] text-sky-950 flex items-center gap-1.5">
                    <ShoppingCart className="w-3.5 h-3.5 text-sky-600" />
                    Procedimentos Selecionados ({cart.length}):
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-sky-600 underline font-semibold text-xs cursor-pointer hover:text-sky-800"
                  >
                    Alterar
                  </button>
                </div>
                <div className="space-y-1 font-semibold text-slate-800 pl-1">
                  {cart.map((c, i) => (
                    <div key={i} className="flex justify-between items-center text-[11px]">
                      <span>• {c.name}</span>
                      <span className="font-bold text-sky-800">{formatCurrency(c.price)}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-1.5 border-t border-sky-200/80 flex justify-between text-xs font-bold text-slate-800">
                  <span>Data & Horário: {formatDate(selectedDate)} às {selectedTime}</span>
                  <span className="text-sky-700 font-extrabold">{formatCurrency(cartTotal)}</span>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  <User className="w-4 h-4 text-sky-600" />
                  Seu Nome Completo
                </label>
                <input
                  type="text"
                  placeholder="Ex: Maria Eduarda Silva"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-200/90 border border-slate-300 text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-slate-100 transition-all"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  <Phone className="w-4 h-4 text-sky-600" />
                  WhatsApp / Celular com DDD
                </label>
                <input
                  type="tel"
                  placeholder="Ex: (21) 97633-3205"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-200/90 border border-slate-300 text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-slate-100 transition-all"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Enviaremos a confirmação e o lembrete da sua sessão via WhatsApp.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                  Forma de Pagamento
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      paymentMethod === 'pix'
                        ? 'bg-sky-50 border-sky-500 text-sky-900 ring-2 ring-sky-300 shadow-sm'
                        : 'bg-slate-200/80 border-slate-300 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      paymentMethod === 'pix' ? 'bg-sky-600 text-white' : 'bg-slate-300 text-slate-600'
                    }`}>
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">PIX Antecipado</div>
                      <div className="text-[11px] text-sky-700 font-semibold mt-0.5">Prioridade na vaga</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('local')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      paymentMethod === 'local'
                        ? 'bg-sky-50 border-sky-500 text-sky-900 ring-2 ring-sky-300 shadow-sm'
                        : 'bg-slate-200/80 border-slate-300 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      paymentMethod === 'local' ? 'bg-sky-600 text-white' : 'bg-slate-300 text-slate-600'
                    }`}>
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">Pagar no Local</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Dinheiro ou Cartão</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* PIX DETAILS & PROMPT TO SEND RECEIPT */}
              {paymentMethod === 'pix' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-sky-100/90 border border-sky-300 text-sky-950 shadow-xs">
                    <div className="flex items-start gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
                      <div className="text-xs leading-relaxed">
                        <strong className="block text-sky-900 font-extrabold text-[13px] mb-0.5">
                          Enviar comprovante para agendar
                        </strong>
                        Para garantir sua vaga com segurança no PIX antecipado, efetue a transferência de{' '}
                        <strong className="text-sky-800">{formatCurrency(cartTotal)}</strong> e anexe o comprovante abaixo (ou envie no WhatsApp após confirmar).
                      </div>
                    </div>
                  </div>

                  {/* QR Code & Direct PIX Key Card */}
                  <div className="p-4 rounded-2xl bg-slate-200/90 border border-slate-300 flex flex-col items-center text-center space-y-3 shadow-2xs">
                    <div className="p-2.5 rounded-2xl bg-white border border-sky-200 shadow-sm flex items-center justify-center min-h-[180px] min-w-[180px]">
                      {pixQrCodeUrl ? (
                        <img
                          src={pixQrCodeUrl}
                          alt="QR Code PIX para pagamento"
                          className="w-44 h-44 object-contain rounded-xl"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-4">
                          <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
                          <span className="text-xs text-slate-500 mt-2 font-medium">Gerando QR Code PIX...</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 w-full text-center">
                      <p className="text-xs font-bold text-slate-900">
                        Escaneie o QR Code no app do seu banco
                      </p>
                      
                      {/* Explicit PIX Data Badge */}
                      <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-300 text-[11px] text-slate-700 space-y-1 text-left">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-500">Chave PIX (Celular):</span>
                          <span className="font-mono font-extrabold text-sky-800 text-xs">21976333205</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-500">Beneficiário:</span>
                          <span className="font-bold text-slate-800">{config.pixMerchantName || config.salonName || 'Moreninha do Bronze'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-500">Cidade:</span>
                          <span className="font-bold text-slate-800">{config.pixMerchantCity || 'Mesquita - RJ'}</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-200 pt-1">
                          <span className="font-semibold text-slate-500">Valor Total ({cart.length} itens):</span>
                          <span className="font-extrabold text-sky-700 text-xs">{formatCurrency(cartTotal)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="w-full space-y-2">
                      <button
                        type="button"
                        onClick={handleCopyPix}
                        className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer active:scale-98"
                      >
                        {copiedPix ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                            <span>Código PIX Copiado com Sucesso!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>{config.btnCopyPixText || 'Copiar Código PIX (Copia e Cola)'}</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyPhoneKey}
                        className="w-full py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-300/80 border border-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-98"
                      >
                        {copiedKey ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="text-emerald-700">Chave 21976333205 Copiada!</span>
                          </>
                        ) : (
                          <>
                            <Phone className="w-3.5 h-3.5 text-sky-600" />
                            <span>Copiar Chave Telefone: <strong>21976333205</strong></span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Receipt Upload Input */}
                  <div className="p-4 rounded-2xl bg-slate-200/90 border border-slate-300 space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
                      <Upload className="w-4 h-4 text-sky-600" />
                      Anexar Comprovante do PIX (Print ou Foto)
                    </label>

                    {!receiptImage ? (
                      <label className="border-2 border-dashed border-sky-300 hover:border-sky-500 rounded-2xl p-4 flex flex-col items-center justify-center text-center bg-slate-100 hover:bg-sky-50/50 cursor-pointer transition-colors group">
                        {isAdjustingReceipt ? (
                          <>
                            <Loader2 className="w-7 h-7 text-sky-600 animate-spin mb-1.5" />
                            <span className="text-xs font-bold text-sky-900">
                              Ajustando e enquadrando foto do comprovante...
                            </span>
                            <span className="text-[11px] text-slate-500 mt-0.5">
                              Aguarde um momento enquanto a imagem é otimizada
                            </span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-7 h-7 text-sky-600 group-hover:scale-110 transition-transform mb-1.5" />
                            <span className="text-xs font-bold text-sky-900">
                              Clique para selecionar foto ou print do comprovante
                            </span>
                            <span className="text-[11px] text-slate-500 mt-0.5">
                              Formatos aceitos: JPG, PNG, PDF (Ajuste automático de enquadramento)
                            </span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          disabled={isAdjustingReceipt}
                          onChange={handleReceiptUpload}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <div className="p-3.5 rounded-2xl bg-slate-100 border border-sky-300 space-y-3 shadow-xs">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {receiptFileName || 'Comprovante anexado'}
                              </p>
                              <p className="text-[11px] text-emerald-700 font-semibold">
                                ✓ Foto ajustada e pronta para envio!
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={removeReceipt}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                            title="Trocar foto do comprovante"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Trocar</span>
                          </button>
                        </div>

                        {/* Visual Adjusted Preview */}
                        <div className="w-full max-h-60 rounded-2xl overflow-hidden bg-gradient-to-b from-sky-100/70 via-slate-100/60 to-slate-100 flex items-center justify-center p-2 relative">
                          <img
                            src={receiptImage}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-20 scale-125 pointer-events-none"
                          />
                          <div className="absolute inset-y-0 left-0 w-12 sm:w-16 bg-gradient-to-r from-slate-100 via-slate-100/90 to-transparent pointer-events-none z-10" />
                          <div className="absolute inset-y-0 right-0 w-12 sm:w-16 bg-gradient-to-l from-slate-100 via-slate-100/90 to-transparent pointer-events-none z-10" />
                          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-100 via-slate-100/90 to-transparent pointer-events-none z-10" />
                          <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-slate-100/80 to-transparent pointer-events-none z-10" />

                          <img
                            src={receiptImage}
                            alt="Comprovante completo sem cortes"
                            className="max-h-52 w-auto max-w-full object-contain"
                          />
                          <span className="relative z-20 absolute bottom-2.5 right-2.5 bg-sky-900/80 backdrop-blur-md text-sky-100 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-sky-400/30 shadow-xs">
                            Foto Inteira (100% Sem Cortes)
                          </span>
                        </div>
                      </div>
                    )}
                    <p className="text-[11px] text-slate-500 italic">
                      * Dica: Você também poderá enviar o comprovante diretamente no WhatsApp ao finalizar.
                    </p>
                  </div>
                </div>
              )}

              {/* Local Payment */}
              {paymentMethod === 'local' && (
                <div className="p-4 rounded-2xl bg-slate-200/80 border border-slate-300 text-xs text-slate-700 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <CreditCard className="w-4 h-4 text-sky-600" />
                    Pagamento no Momento do Atendimento
                  </div>
                  <p className="leading-relaxed">
                    Você poderá realizar o pagamento de{' '}
                    <strong className="text-slate-900">{formatCurrency(cartTotal)}</strong> no local via dinheiro, cartão de débito ou crédito ao chegar no salão.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Endereço: {config.address || config.fullAddress}
                  </p>
                </div>
              )}

              {/* Summary */}
              <div className="p-3.5 rounded-2xl bg-slate-200/90 border border-slate-300 text-xs space-y-2">
                <div className="text-slate-700 font-bold flex justify-between items-center">
                  <span>Procedimentos Selecionados ({cart.length}):</span>
                  <span className="text-slate-500 font-normal">~{cartTotalDuration} min</span>
                </div>
                <div className="space-y-1 pl-1">
                  {cart.map((item, i) => (
                    <div key={i} className="flex justify-between text-[11px] text-slate-600">
                      <span>• {item.name}</span>
                      <span className="font-semibold text-slate-800">{formatCurrency(item.price)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-slate-600 pt-1.5 border-t border-slate-300">
                  <span>Data & Horário:</span>
                  <span className="font-semibold text-slate-800">{formatDate(selectedDate)} às {selectedTime}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Cliente:</span>
                  <span className="font-semibold text-slate-800">{clientName}</span>
                </div>
                <div className="flex justify-between text-slate-800 font-bold pt-1.5 border-t border-slate-300 text-sm">
                  <span>Total a Pagar:</span>
                  <span className="text-sky-700 font-extrabold">{formatCurrency(cartTotal)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="bg-slate-200/90 px-5 py-3.5 border-t border-slate-300 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => {
                setErrorMsg('');
                setStep((prev) => (prev - 1) as 1 | 2);
              }}
              className="px-4 py-2.5 rounded-2xl bg-slate-300 hover:bg-slate-400/70 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              {config.btnBackText || 'Voltar'}
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-slate-300 hover:bg-slate-400/70 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              {config.btnCancelText || 'Cancelar'}
            </button>
          )}

          {step === 1 && (
            <button
              type="button"
              onClick={handleNextFromStep1}
              className="px-5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer ml-auto"
            >
              {config.btnStep1NextText || 'Avançar para Dados'}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {step === 2 && (
            <button
              type="button"
              onClick={handleNextFromStep2}
              className="px-5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer ml-auto"
            >
              {config.btnStep2NextText || 'Avançar para Pagamento'}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-colors cursor-pointer ml-auto"
            >
              <CheckCircle2 className="w-4 h-4 text-sky-200" />
              {paymentMethod === 'pix' 
                ? (receiptImage 
                    ? (config.btnPixConfirmWithReceiptText || 'Confirmar com Comprovante') 
                    : (config.btnPixSubmitText || 'Enviar Comprovante & Agendar'))
                : (config.btnConfirmBookingText || 'Confirmar Agendamento')
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
