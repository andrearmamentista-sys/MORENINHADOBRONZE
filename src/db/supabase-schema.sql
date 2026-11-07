-- =====================================================================
-- SCHEMA SUPABASE - MORENINHA DO BRONZE
-- Execute este script no SQL Editor do seu projeto Supabase
-- Acesse: https://supabase.com/dashboard -> Selecione seu projeto -> SQL Editor -> New Query -> Run
-- =====================================================================

-- 1. Habilitar extensão de UUID (caso queira gerar IDs uuid opcionais)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- 2. TABELA: salon_config (Configurações Gerais do Salão)
-- =====================================================================
CREATE TABLE IF NOT EXISTS salon_config (
  id TEXT PRIMARY KEY DEFAULT 'default_salon',
  salon_name TEXT NOT NULL DEFAULT 'Moreninha do Bronze',
  address TEXT DEFAULT 'Rua Aurélia, Mesquita – RJ',
  full_address TEXT DEFAULT 'Rua Aurélia, Mesquita – RJ, 26553-000',
  short_address TEXT DEFAULT 'Rua Aurélia, Mesquita – RJ',
  phone TEXT DEFAULT '21976333205',
  whatsapp_number TEXT DEFAULT '21976333205',
  whatsapp_display TEXT DEFAULT '(21) 97633-3205',
  instagram_handle TEXT DEFAULT '@moreninhadobronze',
  instagram_url TEXT DEFAULT 'https://instagram.com/moreninhadobronze',
  maps_url TEXT DEFAULT 'https://www.google.com/maps/search/?api=1&query=Rua+Aur%C3%A9lia%2C+Mesquita+-+RJ',
  cover_image_url TEXT DEFAULT './images/banner.png',
  avatar_url TEXT DEFAULT './images/avatar.png',
  avatar_initials TEXT DEFAULT 'MB',
  status_pill_text TEXT DEFAULT 'Aberto • Atendimento até 21h',
  services_section_title TEXT DEFAULT 'Serviços & Procedimentos',
  services_section_subtitle TEXT DEFAULT 'Escolha seu procedimento preferido e agende seu horário com marquinha de fita.',
  opening_hour TEXT DEFAULT '09:00',
  closing_hour TEXT DEFAULT '21:00',
  opening_hours_text TEXT DEFAULT '09:00 às 21:00',
  time_slots JSONB DEFAULT '["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00"]'::jsonb,
  max_slots_per_time INTEGER DEFAULT 3,
  pix_key TEXT DEFAULT '21976333205',
  pix_merchant_name TEXT DEFAULT 'Moreninha Bronze',
  pix_merchant_city TEXT DEFAULT 'Mesquita',
  enable_pix_advance BOOLEAN DEFAULT true,
  enable_local_payment BOOLEAN DEFAULT true,
  btn_texts JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================================
-- 3. TABELA: services (Catálogo de Procedimentos e Valores)
-- =====================================================================
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  description TEXT DEFAULT '',
  duration TEXT DEFAULT '1h',
  duration_minutes INTEGER DEFAULT 60,
  image_url TEXT DEFAULT '',
  category TEXT DEFAULT 'Bronze',
  popular BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================================
-- 4. TABELA: specialists (Profissionais / Especialistas)
-- =====================================================================
CREATE TABLE IF NOT EXISTS specialists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Especialista em Bronzeamento',
  bio TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================================
-- 5. TABELA: appointments (Agendamentos dos Clientes)
-- =====================================================================
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  service_id TEXT REFERENCES services(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  service_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total_price NUMERIC(10, 2) DEFAULT 0.00,
  services_list JSONB DEFAULT '[]'::jsonb,
  specialist_id TEXT,
  specialist_name TEXT,
  specialist TEXT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'pix',
  payment_status TEXT DEFAULT 'pendente',
  status TEXT NOT NULL DEFAULT 'pendente',
  receipt_image TEXT,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para buscas rápidas por data, telefone e status
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_client_phone ON appointments(client_phone);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON appointments(created_at DESC);

-- =====================================================================
-- 6. HABILITAR ROW LEVEL SECURITY (RLS)
-- =====================================================================
ALTER TABLE salon_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialists ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir leitura e escrita pública com a chave Anon
-- (Ideal para Web Apps com agendamento online aberto ao público)
DROP POLICY IF EXISTS "Public access to salon_config" ON salon_config;
CREATE POLICY "Public access to salon_config" ON salon_config
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to services" ON services;
CREATE POLICY "Public access to services" ON services
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to specialists" ON specialists;
CREATE POLICY "Public access to specialists" ON specialists
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to appointments" ON appointments;
CREATE POLICY "Public access to appointments" ON appointments
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================================
-- 7. STORAGE BUCKET: salon-images (Hospedagem de Fotos no Supabase)
-- =====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('salon-images', 'salon-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public access to salon-images" ON storage.objects;
CREATE POLICY "Public access to salon-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'salon-images');

DROP POLICY IF EXISTS "Public upload to salon-images" ON storage.objects;
CREATE POLICY "Public upload to salon-images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'salon-images');

DROP POLICY IF EXISTS "Public update to salon-images" ON storage.objects;
CREATE POLICY "Public update to salon-images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'salon-images') WITH CHECK (bucket_id = 'salon-images');

-- =====================================================================
-- 8. REALTIME (Atualização instantânea no painel ao entrar agendamento)
-- =====================================================================
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE appointments, services, specialists, salon_config;
COMMIT;

-- =====================================================================
-- 9. CARGA INICIAL (SEEDS)
-- =====================================================================

-- Inserir Configuração Padrão do Moreninha do Bronze
INSERT INTO salon_config (
  id, salon_name, address, full_address, short_address,
  phone, whatsapp_number, whatsapp_display,
  instagram_handle, instagram_url, maps_url,
  cover_image_url, avatar_url, avatar_initials,
  status_pill_text, services_section_title, services_section_subtitle,
  opening_hour, closing_hour, opening_hours_text,
  time_slots, max_slots_per_time,
  pix_key, pix_merchant_name, pix_merchant_city,
  enable_pix_advance, enable_local_payment
) VALUES (
  'default_salon',
  'Moreninha do Bronze',
  'Rua Aurélia, Mesquita – RJ',
  'Rua Aurélia, Mesquita – RJ, 26553-000',
  'Rua Aurélia, Mesquita – RJ',
  '21976333205',
  '21976333205',
  '(21) 97633-3205',
  '@moreninhadobronze',
  'https://instagram.com/moreninhadobronze',
  'https://www.google.com/maps/search/?api=1&query=Rua+Aur%C3%A9lia%2C+Mesquita+-+RJ',
  './images/banner.png',
  './images/avatar.png',
  'MB',
  'Aberto • Atendimento até 21h',
  'Serviços & Procedimentos',
  'Escolha seu procedimento preferido e agende seu horário com marquinha de fita.',
  '09:00',
  '21:00',
  '09:00 às 21:00',
  '["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00"]'::jsonb,
  3,
  '21976333205',
  'Moreninha Bronze',
  'Mesquita',
  true,
  true
) ON CONFLICT (id) DO NOTHING;

-- Inserir Serviços Iniciais
INSERT INTO services (id, name, price, description, duration, duration_minutes, image_url, category, popular, display_order)
VALUES
  ('bronze_1h', '1 Hora de Bronze', 25.00, 'Bronzeamento natural ou iluminado com biquíni de fita e hidratação profunda.', '1h 00m', 60, './images/service-hero.png', 'Bronze', false, 1),
  ('bronze_2h', '2 Horas de Bronze', 40.00, 'Sessão completa de bronzeamento duplo com marquinha perfeita e ativador dourado.', '2h 00m', 120, './images/banner.png', 'Bronze', true, 2),
  ('banho_lua', 'Banho de Lua', 15.00, 'Descoloração dos pelos com banho de óleos protetores e esfoliação corporal.', '45m', 45, './images/banner-thumb.png', 'Estética Corporal', false, 3)
ON CONFLICT (id) DO NOTHING;

-- Inserir Especialistas Iniciais
INSERT INTO specialists (id, name, role, bio, image_url)
VALUES
  ('taiane', 'Taiane', 'Especialista Principal em Bronze', 'Especialista com marquinhas de fita sob medida e pele dourada radiante.', './images/avatar.png'),
  ('camila', 'Camila Santos', 'Especialista em Bronzeamento & Marquinha', 'Profissional certificada com mais de 6 anos de experiência em marquinhas perfeitas.', './images/avatar.png'),
  ('amanda', 'Amanda', 'Terapeuta Corporal SPA', 'Especialista em hidratação pós-sol e banho de lua relaxante.', './images/avatar.png')
ON CONFLICT (id) DO NOTHING;
