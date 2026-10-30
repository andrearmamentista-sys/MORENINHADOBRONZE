import { Service, Specialist, Appointment } from '../types';

export const INITIAL_SERVICES: Service[] = [
  {
    id: 'bronze_1h',
    name: '1 Hora de Bronze',
    description: 'Sessão de bronzeamento natural de 1 hora com biquíni de esparadrapo e hidratação.',
    price: 25.0,
    duration: '1h',
    category: 'Bronze',
    popular: false,
    image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'bronze_2h',
    name: '2 Horas de Bronze',
    description: 'Sessão completa de 2 horas de bronzeamento natural para marquinha perfeita e duradoura.',
    price: 40.0,
    duration: '2h',
    category: 'Bronze',
    popular: true,
    image: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'banho_lua',
    name: 'Banho de Lua',
    description: 'Clareamento de pelos com produtos hidratantes, esfoliação e toque aveludado.',
    price: 15.0,
    duration: '40min',
    category: 'Estética Corporal',
    popular: false,
    image: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&q=80&w=800',
  },
];


export const SPECIALISTS: Specialist[] = [
  { id: 'taiane', name: 'Taiane', role: 'Especialista Principal em Bronze' },
  { id: 'camila', name: 'Camila', role: 'Assistente Técnica e Estética' },
  { id: 'amanda', name: 'Amanda', role: 'Terapeuta Corporal SPA' },
];

export const DEFAULT_TIME_SLOTS: string[] = [
  '09:00',
  '10:30',
  '12:00',
  '13:30',
  '15:00',
  '16:30',
  '18:00',
  '19:30',
  '21:00',
];

export const DEFAULT_SALON_CONFIG: import('../types').SalonConfig = {
  name: 'Moreninha do Bronze',
  shortAddress: 'RUA AURÉLIA, MESQUITA – RJ',
  fullAddress: 'Rua Aurélia, Mesquita - RJ',
  statusPillText: 'AGENDAMENTO ONLINE DISPONÍVEL',
  openingHoursText: 'Segunda a Sábado: 09:00 às 21:00',
  slotsCapacity: 3, // 3 vagas para cada horário
  timeSlots: DEFAULT_TIME_SLOTS,
  heroCoverImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1200',
  avatarImage: '/assets/aistudio/Captura_de_tela_2026-10-27_134951_b73b2e4c.png',
  avatarInitials: 'MB',
  whatsappNumber: '5521976333205',
  whatsappDisplay: '(21) 97633-3205',
  instagramUrl: 'https://instagram.com/moreninhadobronze',
  mapsUrl: 'https://maps.google.com/?q=Rua+Aurelia+Mesquita+RJ',
  pixKey: '21976333205',
  pixMerchantName: 'Moreninha Bronze',
  pixCity: 'Mesquita',
  enablePixAdvance: true,
  enableLocalPayment: true,
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
};


export const SALON_INFO = DEFAULT_SALON_CONFIG;
export const TIME_SLOTS = DEFAULT_TIME_SLOTS;

export const INITIAL_SAMPLE_APPOINTMENTS: Appointment[] = [
  {
    id: 'AP-847291',
    serviceId: 'bronze_2h',
    serviceName: '2 Horas de Bronze',
    servicePrice: 40.0,
    specialist: 'Taiane',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    clientName: 'Juliana Ferreira Santos',
    clientPhone: '(21) 98765-4321',
    notes: 'Marquinha fina de esparadrapo',
    status: 'confirmado',
    paymentMethod: 'pix',
    paymentStatus: 'pago',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'AP-592104',
    serviceId: 'banho_lua',
    serviceName: 'Banho de Lua',
    servicePrice: 15.0,
    specialist: 'Camila',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    clientName: 'Carla Beatriz Mendes',
    clientPhone: '(21) 99123-4567',
    notes: 'Pele sensível',
    status: 'pendente',
    paymentMethod: 'local',
    paymentStatus: 'no_local',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
];


