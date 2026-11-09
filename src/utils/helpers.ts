import { Appointment, Service, SalonConfig, Specialist, AppointmentStatus } from '../types';

export const APP_CACHE_VERSION = 'v20261109_02';

export function resolveAssetUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  let clean = trimmed;
  while (clean.startsWith('./') || clean.startsWith('/')) {
    if (clean.startsWith('./')) clean = clean.slice(2);
    else if (clean.startsWith('/')) clean = clean.slice(1);
  }
  const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL)
    ? import.meta.env.BASE_URL
    : './';
  const prefix = base.endsWith('/') ? base : `${base}/`;
  const full = `${prefix}${clean}`;
  if (clean.startsWith('images/') && !full.includes('?')) {
    return `${full}?v=${APP_CACHE_VERSION}`;
  }
  return full;
}

export const DEFAULT_SERVICES: Service[] = [
  {
    id: 'bronze-1h',
    name: '1 Hora de Bronze',
    duration: '1h 00m',
    durationMinutes: 60,
    price: 25.0,
    description: 'Bronzeamento natural ou iluminado com biquíni de fita e hidratação profunda.',
    imageUrl: './images/service-hero.png',
    image: './images/service-hero.png',
    popular: true,
  },
  {
    id: 'bronze-2h',
    name: '2 Horas de Bronze',
    duration: '2h 00m',
    durationMinutes: 120,
    price: 40.0,
    description: 'Sessão completa de bronzeamento duplo com marquinha perfeita e ativador dourado.',
    imageUrl: './images/bronze-2h.png',
    image: './images/bronze-2h.png',
    popular: true,
  },
  {
    id: 'banho-lua',
    name: 'Banho de Lua',
    duration: '45m',
    durationMinutes: 45,
    price: 15.0,
    description: 'Descoloração dos pelos com banho de óleos protetores e esfoliação corporal.',
    imageUrl: './images/banho-lua.png',
    image: './images/banho-lua.png',
  },
];

export const DEFAULT_CONFIG: SalonConfig = {
  salonName: 'Moreninha do Bronze',
  name: 'Moreninha do Bronze',
  address: 'Rua Aurélia, Mesquita – RJ',
  fullAddress: 'Rua Aurélia, Mesquita – RJ, 26553-000',
  shortAddress: 'Rua Aurélia, Mesquita – RJ',
  phone: '21976333205',
  whatsappNumber: '21976333205',
  whatsappDisplay: '(21) 97633-3205',
  instagramHandle: '@moreninhadobronze01',
  instagramUrl: 'https://www.instagram.com/moreninhadobronze01',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Rua+Aur%C3%A9lia%2C+Mesquita+-+RJ',
  coverImageUrl: './images/banner.png',
  heroCoverImage: './images/banner.png',
  avatarUrl: './images/avatar.png',
  avatarImage: './images/avatar.png',
  avatarInitials: 'MB',
  statusPillText: 'Aberto • Atendimento até 21h',
  servicesSectionTitle: 'Serviços & Procedimentos',
  openingHour: '09:00',
  closingHour: '21:00',
  openingHoursText: '09:00 às 21:00',
  timeSlots: [
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
    '19:00',
    '20:00',
    '21:00',
  ],
  maxSlotsPerTime: 3,
  slotsCapacity: 3,
  pixKey: '21976333205',
  pixMerchantName: 'Moreninha Bronze',
  pixMerchantCity: 'Mesquita',
  // Default button texts
  btnScheduleText: 'Agendar Procedimento',
  btnWhatsAppText: 'WhatsApp',
  btnInstagramText: 'Instagram',
  btnMapText: 'Ver no mapa',
  btnMyAppointmentsText: 'Meus Horários',
  btnFloatingWhatsAppText: 'Falar no WhatsApp',
  btnServiceCardText: 'Agendar',
  btnStep1NextText: 'Avançar para Dados',
  btnStep2NextText: 'Avançar para Pagamento',
  btnConfirmBookingText: 'Confirmar Agendamento',
  btnPixSubmitText: 'Enviar Comprovante & Agendar',
  btnPixConfirmWithReceiptText: 'Confirmar com Comprovante',
  btnBackText: 'Voltar',
  btnCancelText: 'Cancelar',
  btnCopyPixText: 'Copiar Chave PIX',
  btnSuccessWhatsAppText: 'Enviar Comprovante no WhatsApp',
  btnSuccessMyAppointmentsText: 'Ver Meus Agendamentos',
  btnSuccessCloseText: 'Concluir e Voltar ao Início',
  btnNewBookingText: 'Agendar Agora',
  btnMyAppointmentsCloseText: 'Fechar',
  btnTipsCloseText: 'Entendido, obrigado!',
  btnMapOpenText: 'Abrir no Google Maps',
  btnMapCloseText: 'Fechar',
  btnAddServiceToCartText: '+ Adicionar Outro Procedimento ao Carrinho',
};

export const DEFAULT_SPECIALISTS: Specialist[] = [
  {
    id: 'spec-1',
    name: 'Camila Santos',
    role: 'Especialista em Bronzeamento & Marquinha',
    imageUrl: './images/banner.png',
    bio: 'Profissional certificada com mais de 6 anos de experiência em marquinhas perfeitas e banho de lua.',
  },
];

const STORAGE_KEYS = {
  CONFIG: `moreninha_salon_config_${APP_CACHE_VERSION}`,
  SERVICES: `moreninha_services_${APP_CACHE_VERSION}`,
  APPOINTMENTS: 'moreninha_appointments_v3',
  SPECIALISTS: `moreninha_specialists_${APP_CACHE_VERSION}`,
  USER_DATA: 'moreninha_user_saved_v3',
  CACHE_VERSION: 'moreninha_last_cache_version',
};

/**
 * Automatically purges stale cached data from previous builds
 * so refreshing the browser immediately reflects new products, images, and config.
 */
export function ensureFreshCache(): void {
  try {
    const lastVersion = localStorage.getItem(STORAGE_KEYS.CACHE_VERSION);
    if (lastVersion !== APP_CACHE_VERSION) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (
          k &&
          k.startsWith('moreninha_') &&
          !k.includes('appointment') &&
          !k.includes('user_saved') &&
          !k.endsWith(APP_CACHE_VERSION)
        ) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem(STORAGE_KEYS.CACHE_VERSION, APP_CACHE_VERSION);
    }
  } catch {
    // Safe fail in private browsing mode
  }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function getLocalTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateString;
}

export const formatDateBR = formatDate;

export function formatPixKey(rawKey: string): string {
  if (!rawKey) return '+5521976333205';
  const trimmed = rawKey.trim();

  // If email key
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }

  // If random key / UUID
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  // Clean all non-digits
  const digits = trimmed.replace(/\D/g, '');

  // Brazilian Phone: 10 or 11 digits (e.g. 21976333205) -> must be +5521976333205 in BCB standard
  if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`;
  }

  // If already prefixed with 55 (12 or 13 digits)
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    return `+${digits}`;
  }

  // CNPJ (14 digits) or CPF (11 digits not phone)
  return digits || '+5521976333205';
}

export function generatePixPayload(
  pixKey: string,
  merchantName: string,
  merchantCity: string,
  amount: number,
  txId: string = '***'
): string {
  // Always format the key according to Banco Central do Brasil (BCB) E.164 specification (+5521976333205)
  const cleanKey = formatPixKey(pixKey || '21976333205');

  // Format merchant name: uppercase, no accents, max 25 chars
  const cleanName = (merchantName || 'MORENINHA DO BRONZE')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .slice(0, 25)
    .trim() || 'MORENINHA DO BRONZE';

  // Format merchant city: uppercase, no accents, max 15 chars
  const cleanCity = (merchantCity || 'MESQUITA')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .slice(0, 15)
    .trim() || 'MESQUITA';

  const formattedAmount = amount > 0 ? amount.toFixed(2) : '0.00';

  const formatField = (id: string, value: string): string => {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  };

  const gui = formatField('00', 'BR.GOV.BCB.PIX');
  const keyField = formatField('01', cleanKey);
  const mai = formatField('26', `${gui}${keyField}`);

  const mcc = formatField('52', '0000');
  const currency = formatField('53', '986');
  const amountField = amount > 0 ? formatField('54', formattedAmount) : '';
  const country = formatField('58', 'BR');
  const nameField = formatField('59', cleanName);
  const cityField = formatField('60', cleanCity);

  // BCB static QR Code requires '***' when no specific reference label is used
  const cleanTxId = (txId || '***').replace(/[^a-zA-Z0-9*]/g, '').slice(0, 25) || '***';
  const txField = formatField('05', cleanTxId);
  const addData = formatField('62', txField);

  const rawPayload = `000201${mai}${mcc}${currency}${amountField}${country}${nameField}${cityField}${addData}6304`;

  let crc = 0xffff;
  for (let i = 0; i < rawPayload.length; i++) {
    crc ^= rawPayload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  const crcHex = crc.toString(16).toUpperCase().padStart(4, '0');
  return `${rawPayload}${crcHex}`;
}

export function formatWhatsAppUrl(rawPhone: string, message: string): string {
  let digits = (rawPhone || '21976333205').replace(/\D/g, '');
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`;
  }
  if (!digits || digits.length < 10) {
    digits = '5521976333205';
  }
  return `https://api.whatsapp.com/send?phone=${digits}&text=${encodeURIComponent(message)}`;
}

export function formatInstagramUrl(raw: string): string {
  if (!raw) return 'https://www.instagram.com/moreninhadobronze01';
  const trimmed = raw.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (trimmed.includes('instagram.com/https://')) {
      return trimmed.replace('instagram.com/https://', '');
    }
    return trimmed;
  }
  const clean = trimmed.replace(/^@+/, '').replace(/^instagram\.com\//, '');
  return `https://www.instagram.com/${clean || 'moreninhadobronze01'}`;
}

export function formatInstagramHandle(raw: string): string {
  if (!raw) return '@moreninhadobronze01';
  const trimmed = raw.trim();
  if (trimmed.includes('instagram.com/')) {
    const parts = trimmed.split('instagram.com/');
    const handle = parts[1]?.split('/')[0]?.split('?')[0] || 'moreninhadobronze01';
    return `@${handle.replace(/^@+/, '')}`;
  }
  return `@${trimmed.replace(/^@+/, '') || 'moreninhadobronze01'}`;
}

export function generateWhatsAppBookingUrl(
  phone: string,
  appointment: Appointment
): string {
  const paymentText =
    appointment.paymentMethod === 'pix'
      ? '⚡ *PIX Antecipado* (Comprovante em anexo)'
      : '💵 *Pagamento no Local*';

  const receiptNotice =
    appointment.paymentMethod === 'pix'
      ? `\n\n📌 *COMPROVANTE DO PIX:* Segue em anexo a foto/print do meu comprovante para validação e confirmação da vaga!`
      : '';

  const message = `✨ *Novo Agendamento - Moreninha do Bronze* ✨

Olá! Acabei de realizar meu agendamento pelo aplicativo:

👤 *Cliente:* ${appointment.clientName}
📱 *Telefone:* ${appointment.clientPhone}
💆‍♀️ *Serviço:* ${appointment.serviceName}
💰 *Valor:* ${formatCurrency(appointment.servicePrice)}
📅 *Data:* ${formatDate(appointment.date)}
⏰ *Horário:* ${appointment.time}
💳 *Forma de Pagamento:* ${paymentText}${receiptNotice}

Aguardando a confirmação da minha vaga! Muito obrigada(o)! 💕`;

  return formatWhatsAppUrl(phone || '21976333205', message);
}

export function formatGoogleMapsUrl(address?: string, customUrl?: string): string {
  if (customUrl && customUrl.trim() !== '') {
    return customUrl.trim();
  }
  const cleanAddress = (address || 'Rua Aurélia, Mesquita – RJ, 26553-000').trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanAddress)}`;
}

export function formatGoogleMapsDirectionsUrl(address?: string): string {
  const cleanAddress = (address || 'Rua Aurélia, Mesquita – RJ, 26553-000').trim();
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(cleanAddress)}`;
}

export function getStoredSalonConfig(): SalonConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    const cover = parsed.coverImageUrl || parsed.heroCoverImage;
    const avatar = parsed.avatarUrl || parsed.avatarImage;
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      coverImageUrl: cover ? resolveAssetUrl(cover) : DEFAULT_CONFIG.coverImageUrl,
      heroCoverImage: cover ? resolveAssetUrl(cover) : DEFAULT_CONFIG.heroCoverImage,
      avatarUrl: avatar ? resolveAssetUrl(avatar) : DEFAULT_CONFIG.avatarUrl,
      avatarImage: avatar ? resolveAssetUrl(avatar) : DEFAULT_CONFIG.avatarImage,
      mapsUrl:
        parsed.mapsUrl && String(parsed.mapsUrl).trim() !== ''
          ? parsed.mapsUrl
          : DEFAULT_CONFIG.mapsUrl,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveStoredSalonConfig(config: SalonConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch {
    // Debug desligado - falha silenciosa segura
  }
}

export function getStoredServices(): Service[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SERVICES);
    if (!raw) return DEFAULT_SERVICES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((s) => ({
        ...s,
        imageUrl: resolveAssetUrl(s.imageUrl || s.image),
        image: resolveAssetUrl(s.imageUrl || s.image),
      }));
    }
    return DEFAULT_SERVICES;
  } catch {
    return DEFAULT_SERVICES;
  }
}

export function saveStoredServices(services: Service[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  } catch {
    // Debug desligado
  }
}

export function getStoredSpecialists(): Specialist[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SPECIALISTS);
    if (!raw) return DEFAULT_SPECIALISTS;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SPECIALISTS;
  }
}

export function saveStoredSpecialists(specialists: Specialist[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SPECIALISTS, JSON.stringify(specialists));
  } catch {
    // Debug desligado
  }
}

export function getStoredAppointments(): Appointment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveAppointment(appointment: Appointment): Appointment[] {
  try {
    const list = getStoredAppointments();
    list.unshift(appointment);
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(list));
    return list;
  } catch {
    return [appointment];
  }
}

export function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus
): Appointment[] {
  try {
    const list = getStoredAppointments();
    const updated = list.map((item) =>
      item.id === id ? { ...item, status } : item
    );
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function deleteAppointment(id: string): Appointment[] {
  try {
    const list = getStoredAppointments();
    const updated = list.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function getSavedUserData(): { name: string; phone: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveUserData(data: { name: string; phone: string }): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data));
  } catch {
    // Debug desligado
  }
}
