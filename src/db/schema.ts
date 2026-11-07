import { pgTable, serial, text, numeric, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';

// Users table linked to Firebase Auth UID
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  name: text('name'),
  phone: text('phone'),
  role: text('role').default('client').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Salon Configuration
export const salonConfig = pgTable('salon_config', {
  id: text('id').primaryKey().default('default_salon'),
  salonName: text('salon_name').default('Moreninha do Bronze').notNull(),
  address: text('address').default('Rua Aurélia, Mesquita – RJ'),
  fullAddress: text('full_address').default('Rua Aurélia, Mesquita – RJ, 26553-000'),
  shortAddress: text('short_address').default('Rua Aurélia, Mesquita – RJ'),
  phone: text('phone').default('21976333205'),
  whatsappNumber: text('whatsapp_number').default('21976333205'),
  whatsappDisplay: text('whatsapp_display').default('(21) 97633-3205'),
  instagramHandle: text('instagram_handle').default('@moreninhadobronze'),
  instagramUrl: text('instagram_url').default('https://instagram.com/moreninhadobronze'),
  mapsUrl: text('maps_url').default('https://www.google.com/maps/search/?api=1&query=Rua+Aur%C3%A9lia%2C+Mesquita+-+RJ'),
  coverImageUrl: text('cover_image_url').default('./images/banner.png'),
  avatarUrl: text('avatar_url').default('./images/avatar.png'),
  avatarInitials: text('avatar_initials').default('MB'),
  statusPillText: text('status_pill_text').default('Aberto • Atendimento até 21h'),
  servicesSectionTitle: text('services_section_title').default('Serviços & Procedimentos'),
  servicesSectionSubtitle: text('services_section_subtitle').default('Escolha seu procedimento preferido e agende seu horário com marquinha de fita.'),
  openingHour: text('opening_hour').default('09:00'),
  closingHour: text('closing_hour').default('21:00'),
  openingHoursText: text('opening_hours_text').default('09:00 às 21:00'),
  timeSlots: jsonb('time_slots').$type<string[]>().default([
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
  ]),
  maxSlotsPerTime: integer('max_slots_per_time').default(3),
  pixKey: text('pix_key').default('21976333205'),
  pixMerchantName: text('pix_merchant_name').default('Moreninha Bronze'),
  pixMerchantCity: text('pix_merchant_city').default('Mesquita'),
  enablePixAdvance: boolean('enable_pix_advance').default(true),
  enableLocalPayment: boolean('enable_local_payment').default(true),
  btnTexts: jsonb('btn_texts').$type<Record<string, string>>().default({}),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Services / Procedures Catalog
export const services = pgTable('services', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).default('0.00').notNull(),
  description: text('description').default(''),
  duration: text('duration').default('1h'),
  durationMinutes: integer('duration_minutes').default(60),
  imageUrl: text('image_url').default(''),
  category: text('category').default('Bronze'),
  popular: boolean('popular').default(false),
  displayOrder: integer('display_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Specialists / Professionals
export const specialists = pgTable('specialists', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role').default('Especialista em Bronzeamento').notNull(),
  bio: text('bio').default(''),
  imageUrl: text('image_url').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

// Appointments Booked by Customers
export const appointments = pgTable('appointments', {
  id: text('id').primaryKey(),
  clientName: text('client_name').notNull(),
  clientPhone: text('client_phone').notNull(),
  serviceId: text('service_id'),
  serviceName: text('service_name').notNull(),
  servicePrice: numeric('service_price', { precision: 10, scale: 2 }).default('0.00').notNull(),
  totalPrice: numeric('total_price', { precision: 10, scale: 2 }).default('0.00'),
  servicesList: jsonb('services_list').$type<any[]>().default([]),
  specialistId: text('specialist_id'),
  specialistName: text('specialist_name'),
  specialist: text('specialist'),
  date: text('date').notNull(),
  time: text('time').notNull(),
  paymentMethod: text('payment_method').default('pix').notNull(),
  paymentStatus: text('payment_status').default('pendente'),
  status: text('status').default('pendente').notNull(),
  receiptImage: text('receipt_image'),
  notes: text('notes').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});
