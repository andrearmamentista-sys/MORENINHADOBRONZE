export type AppointmentStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'cancelled' 
  | 'pendente' 
  | 'confirmado' 
  | 'cancelado';

export type PaymentMethod = 'pix' | 'local';

export interface Service {
  id: string;
  name: string;
  price: number;
  description: string;
  duration?: string;
  durationMinutes?: number;
  image?: string;
  imageUrl?: string;
  category?: string;
  popular?: boolean;
}

export interface SalonConfig {
  salonName?: string;
  name?: string;
  address?: string;
  fullAddress?: string;
  shortAddress?: string;
  phone?: string;
  whatsappNumber?: string;
  whatsappDisplay?: string;
  instagramHandle?: string;
  instagramUrl?: string;
  mapsUrl?: string;
  coverImageUrl?: string;
  heroCoverImage?: string;
  avatarUrl?: string;
  avatarImage?: string;
  avatarInitials?: string;
  statusPillText?: string;
  servicesSectionTitle?: string;
  servicesSectionSubtitle?: string;
  openingHour?: string;
  closingHour?: string;
  openingHoursText?: string;
  timeSlots?: string[];
  maxSlotsPerTime?: number;
  slotsCapacity?: number;
  pixKey: string;
  pixMerchantName?: string;
  pixMerchantCity?: string;
  pixCity?: string;
  enablePixAdvance?: boolean;
  enableLocalPayment?: boolean;

  // Custom Button Texts
  btnScheduleText?: string;
  btnWhatsAppText?: string;
  btnInstagramText?: string;
  btnMapText?: string;
  btnMyAppointmentsText?: string;
  btnFloatingWhatsAppText?: string;
  btnServiceCardText?: string;
  btnStep1NextText?: string;
  btnStep2NextText?: string;
  btnConfirmBookingText?: string;
  btnPixSubmitText?: string;
  btnPixConfirmWithReceiptText?: string;
  btnBackText?: string;
  btnCancelText?: string;
  btnCopyPixText?: string;
  btnSuccessWhatsAppText?: string;
  btnSuccessMyAppointmentsText?: string;
  btnSuccessCloseText?: string;
  btnNewBookingText?: string;
  btnMyAppointmentsCloseText?: string;
  btnTipsCloseText?: string;
  btnMapOpenText?: string;
  btnMapCloseText?: string;
  btnAddServiceToCartText?: string;
}

export interface Specialist {
  id: string;
  name: string;
  role: string;
  bio?: string;
  imageUrl?: string;
  avatarUrl?: string;
  image?: string;
}

export interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  serviceId?: string;
  serviceName: string;
  servicePrice: number;
  date: string;
  time: string;
  paymentMethod: PaymentMethod;
  status: AppointmentStatus;
  receiptImage?: string;
  createdAt?: string;
  specialist?: string;
  specialistId?: string;
  specialistName?: string;
  notes?: string;
  paymentStatus?: string;
  servicesList?: Service[];
  totalPrice?: number;
}
