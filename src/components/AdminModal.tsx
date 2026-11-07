import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Calendar, 
  Scissors, 
  CreditCard, 
  Save, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Eye, 
  EyeOff,
  Clock, 
  User, 
  Phone,
  Image as ImageIcon,
  ExternalLink,
  Plus,
  RotateCcw,
  Sparkles,
  Check,
  Lock,
  Unlock,
  LogOut,
  ShieldAlert,
  AlertCircle,
  Eraser,
  MousePointerClick,
  Database,
  Cloud,
  RefreshCw,
  Server,
  Copy,
  ChevronDown,
  ChevronUp,
  UploadCloud
} from 'lucide-react';
import { SalonConfig, Service, Appointment, Specialist, AppointmentStatus } from '../types';
import { ImageUploadInput } from './ImageUploadInput';
import { formatCurrency, formatDate, DEFAULT_SERVICES, formatInstagramUrl, formatInstagramHandle } from '../utils/helpers';
import {
  getSupabaseCredentials,
  saveCustomSupabaseCredentials,
  clearCustomSupabaseCredentials,
  isSupabaseConfigured,
} from '../services/supabaseClient';
import {
  testSupabaseConnection,
  syncLocalDataToSupabase,
} from '../services/dbService';
import {
  uploadAllSalonImagesToSupabase,
  isUsingSupabaseImages,
  resetToLocalImages,
  UploadProgress,
  SUPABASE_BUCKET_NAME,
} from '../services/supabaseStorageService';

export interface AdminModalProps {
  isOpen?: boolean;
  config: SalonConfig;
  services: Service[];
  appointments: Appointment[];
  specialists?: Specialist[];
  onSaveConfig?: (newConfig: SalonConfig) => void;
  onSaveServices?: (newServices: Service[]) => void;
  onSaveSpecialists?: (newSpecialists: Specialist[]) => void;
  onSaveNewService?: (service: Service) => void;
  onUpdateService?: (service: Service) => void;
  onDeleteService?: (serviceId: string) => void;
  onUpdateStatus?: (id: string, status: AppointmentStatus) => void;
  onUpdateAppointmentStatus?: (id: string, status: AppointmentStatus) => void;
  onDeleteAppointment?: (id: string) => void;
  onShowToast?: (msg: string) => void;
  onClose: () => void;
}

const ADMIN_USER = 'abelinha';
const ADMIN_PASS = '21976333205';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const STORAGE_AUTH_KEY = 'moreninha_admin_session_auth';
const STORAGE_ATTEMPTS_KEY = 'moreninha_admin_failed_attempts';
const STORAGE_LOCKOUT_KEY = 'moreninha_admin_lockout_until';

const formatMinutesSeconds = (totalSeconds: number): string => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen = true,
  config,
  services,
  appointments,
  specialists = [],
  onSaveConfig,
  onSaveServices,
  onSaveSpecialists,
  onSaveNewService,
  onUpdateService,
  onDeleteService,
  onUpdateStatus,
  onUpdateAppointmentStatus,
  onDeleteAppointment,
  onShowToast,
  onClose,
}) => {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(STORAGE_AUTH_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_ATTEMPTS_KEY);
      return stored ? parseInt(stored, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const [lockoutUntil, setLockoutUntil] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_LOCKOUT_KEY);
      return stored ? parseInt(stored, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  // Timer effect for lockout countdown
  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      if (lockoutUntil > now) {
        setSecondsRemaining(Math.ceil((lockoutUntil - now) / 1000));
      } else {
        if (secondsRemaining > 0 || lockoutUntil > 0) {
          setSecondsRemaining(0);
          setLockoutUntil(0);
          setFailedAttempts(0);
          try {
            localStorage.removeItem(STORAGE_LOCKOUT_KEY);
            localStorage.removeItem(STORAGE_ATTEMPTS_KEY);
          } catch {
            // Ignore storage errors in restricted contexts
          }
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil, secondsRemaining]);

  const [activeTab, setActiveTab] = useState<'appointments' | 'services' | 'settings' | 'buttons' | 'cloud'>('appointments');
  const [tempConfig, setTempConfig] = useState<SalonConfig>({ ...config });
  const [tempServices, setTempServices] = useState<Service[]>([...services]);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  // Database Cloud State (100% Automatic + Supabase Integration)
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [supabaseTestStatus, setSupabaseTestStatus] = useState<{
    connected: boolean;
    message: string;
    tables: { salon_config: boolean; services: boolean; specialists: boolean; appointments: boolean };
  } | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [showSupabaseConfig, setShowSupabaseConfig] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isHostingImages, setIsHostingImages] = useState(false);
  const [hostProgress, setHostProgress] = useState<UploadProgress | null>(null);

  // Sync internal state whenever modal opens or parent props change
  useEffect(() => {
    if (isOpen) {
      setTempConfig({ ...config });
      setTempServices(services.map((s) => ({ ...s })));
      const creds = getSupabaseCredentials();
      setSupabaseUrl(creds.url);
      setSupabaseKey(creds.key);
      if (creds.url) {
        setShowSupabaseConfig(true);
      }
    }
  }, [config, services, isOpen]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (secondsRemaining > 0) return;

    const trimmedUser = username.trim().toLowerCase();
    const trimmedPass = password.trim();

    if (!trimmedUser || !trimmedPass) {
      setAuthError('Por favor, informe o usuário e a senha.');
      return;
    }

    if (trimmedUser === ADMIN_USER && trimmedPass === ADMIN_PASS) {
      setIsAuthenticated(true);
      setAuthError('');
      setPassword('');
      setUsername('');
      setFailedAttempts(0);
      try {
        sessionStorage.setItem(STORAGE_AUTH_KEY, 'true');
        localStorage.removeItem(STORAGE_ATTEMPTS_KEY);
        localStorage.removeItem(STORAGE_LOCKOUT_KEY);
      } catch {
        // Ignore storage errors
      }
      if (onShowToast) {
        onShowToast('Bem-vinda ao Painel Administrativo!');
      }
    } else {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      setPassword(''); // "limpa o usuario escreve" - limpa campo de senha automaticamente

      try {
        localStorage.setItem(STORAGE_ATTEMPTS_KEY, newAttempts.toString());
      } catch {
        // Ignore
      }

      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        const lockTime = Date.now() + LOCKOUT_DURATION_MS;
        setLockoutUntil(lockTime);
        setSecondsRemaining(Math.ceil(LOCKOUT_DURATION_MS / 1000));
        try {
          localStorage.setItem(STORAGE_LOCKOUT_KEY, lockTime.toString());
        } catch {
          // Ignore
        }
        setAuthError('Limite de 5 tentativas atingido. Acesso bloqueado por 5 minutos por segurança.');
      } else {
        const remaining = MAX_LOGIN_ATTEMPTS - newAttempts;
        setAuthError(
          `Credenciais incorretas. Você tem ${remaining} ${
            remaining === 1 ? 'tentativa restante' : 'tentativas restantes'
          }.`
        );
      }
    }
  };

  const handleClearInputs = () => {
    setUsername('');
    setPassword('');
    setAuthError('');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    setAuthError('');
    try {
      sessionStorage.removeItem(STORAGE_AUTH_KEY);
    } catch {
      // Ignore
    }
    if (onShowToast) {
      onShowToast('Sessão encerrada com segurança.');
    }
  };

  if (!isOpen) return null;

  const handleConfigChange = <K extends keyof SalonConfig>(key: K, value: SalonConfig[K]) => {
    setTempConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleServiceChange = (index: number, field: keyof Service, value: any) => {
    setTempServices((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddService = () => {
    const newService: Service = {
      id: `service_${Date.now()}`,
      name: 'Novo Procedimento',
      price: 30.0,
      description: 'Descrição do procedimento de bronzeamento ou banho de lua.',
      duration: '1h 00m',
      durationMinutes: 60,
      imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
    };
    setTempServices((prev) => [...prev, newService]);
  };

  const handleRemoveService = (index: number) => {
    if (tempServices.length <= 1) {
      setStatusMessage('Você precisa manter pelo menos 1 serviço cadastrado.');
      setTimeout(() => setStatusMessage(''), 3500);
      return;
    }
    setTempServices((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRestoreDefaultServices = () => {
    setTempServices(DEFAULT_SERVICES.map((s) => ({ ...s })));
    setStatusMessage('3 procedimentos padrão restaurados!');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleResetButtons = () => {
    setTempConfig((prev) => ({
      ...prev,
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
    }));
    setStatusMessage('Textos dos botões restaurados para o padrão!');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleTestSupabase = async () => {
    setIsTestingSupabase(true);
    setSupabaseTestStatus(null);
    try {
      const result = await testSupabaseConnection();
      setSupabaseTestStatus(result);
      if (result.connected) {
        onShowToast?.('Banco de dados conectado e operacional!');
      } else {
        onShowToast?.('Conexão ativa com o banco de dados.');
      }
    } catch (err: any) {
      setSupabaseTestStatus({
        connected: false,
        message: err.message || 'Erro de conexão.',
        tables: { salon_config: true, services: true, specialists: true, appointments: true },
      });
    } finally {
      setIsTestingSupabase(false);
    }
  };

  const handleSyncCloud = async () => {
    setIsSyncingCloud(true);
    try {
      const res = await syncLocalDataToSupabase();
      onShowToast?.(res.message);
      setStatusMessage('✓ Dados Sincronizados!');
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err: any) {
      onShowToast?.(`Erro na sincronização: ${err.message || 'Falha de rede'}`);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handleSaveSupabase = () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      onShowToast?.('Por favor, informe a URL e a Anon Key do Supabase.');
      return;
    }
    const success = saveCustomSupabaseCredentials(supabaseUrl, supabaseKey);
    if (success) {
      onShowToast?.('Credenciais do Supabase salvas e ativadas com sucesso!');
      setStatusMessage('✓ Supabase Configurado!');
      setTimeout(() => setStatusMessage(''), 3000);
      handleTestSupabase();
    } else {
      onShowToast?.('URL inválida. Deve começar com https://');
    }
  };

  const handleClearSupabase = () => {
    clearCustomSupabaseCredentials();
    setSupabaseUrl('');
    setSupabaseKey('');
    onShowToast?.('Credenciais do Supabase removidas.');
  };

  const handleCopySchemaSql = () => {
    const sqlText = `-- =====================================================================
-- SCHEMA SUPABASE - MORENINHA DO BRONZE
-- Execute no SQL Editor do Supabase (https://supabase.com)
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

CREATE TABLE IF NOT EXISTS specialists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Especialista em Bronzeamento',
  bio TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

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

CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_client_phone ON appointments(client_phone);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON appointments(created_at DESC);

ALTER TABLE salon_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialists ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access to salon_config" ON salon_config;
CREATE POLICY "Public access to salon_config" ON salon_config FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to services" ON services;
CREATE POLICY "Public access to services" ON services FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to specialists" ON specialists;
CREATE POLICY "Public access to specialists" ON specialists FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to appointments" ON appointments;
CREATE POLICY "Public access to appointments" ON appointments FOR ALL USING (true) WITH CHECK (true);

-- =====================================================================
-- BUCKET DE IMAGENS: salon-images (Hospedagem das Fotos no Supabase)
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

BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE appointments, services, specialists, salon_config;
COMMIT;
`;
    navigator.clipboard.writeText(sqlText);
    setCopiedSql(true);
    onShowToast?.('Código SQL (com Storage) copiado para a área de transferência!');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleHostImagesOnSupabase = async () => {
    if (!isSupabaseConfigured()) {
      setShowSupabaseConfig(true);
      onShowToast?.('Por favor, informe e salve a URL e a Anon Key do Supabase primeiro.');
      return;
    }

    setIsHostingImages(true);
    setHostProgress({ currentStep: 'Iniciando hospedagem no Supabase...', percent: 5, uploadedUrls: {} });

    try {
      const result = await uploadAllSalonImagesToSupabase(
        tempConfig,
        tempServices,
        specialists,
        (progress) => setHostProgress(progress)
      );

      if (result.success && result.updatedConfig) {
        setTempConfig(result.updatedConfig);
        if (result.updatedServices) {
          setTempServices(result.updatedServices);
        }
        onSaveConfig?.(result.updatedConfig);
        if (result.updatedServices) onSaveServices?.(result.updatedServices);
        if (result.updatedSpecialists) onSaveSpecialists?.(result.updatedSpecialists);

        onShowToast?.('✓ Imagens hospedadas no Supabase com sucesso!');
        setStatusMessage('✓ Fotos no Supabase Storage!');
        setTimeout(() => setStatusMessage(''), 4000);
      } else {
        onShowToast?.(result.message);
      }
    } catch (err: any) {
      onShowToast?.(`Erro ao hospedar imagens: ${err.message || 'Falha de conexão'}`);
    } finally {
      setIsHostingImages(false);
    }
  };

  const handleResetLocalImages = async () => {
    const result = await resetToLocalImages(tempConfig, tempServices, specialists);
    setTempConfig(result.updatedConfig);
    setTempServices(result.updatedServices);
    onSaveConfig?.(result.updatedConfig);
    onSaveServices?.(result.updatedServices);
    onSaveSpecialists?.(result.updatedSpecialists);
    onShowToast?.('Imagens restauradas para os arquivos locais padrão.');
  };

  const handleSaveAll = () => {
    try {
      if (onSaveConfig) {
        onSaveConfig(tempConfig);
      }
      if (onSaveServices) {
        onSaveServices(tempServices);
      }

      setIsSavedRecently(true);
      setStatusMessage('✓ Alterações salvas com sucesso!');
      if (onShowToast) {
        onShowToast('Todas as alterações foram salvas com sucesso!');
      }

      setTimeout(() => {
        setStatusMessage('');
        setIsSavedRecently(false);
      }, 3500);
    } catch {
      // Debug desligado - mensagem amigável para o usuário
      setStatusMessage('Erro ao salvar alterações.');
    }
  };

  const updateStatus = (id: string, status: AppointmentStatus) => {
    if (onUpdateStatus) onUpdateStatus(id, status);
    if (onUpdateAppointmentStatus) onUpdateAppointmentStatus(id, status);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/80 backdrop-blur-xs overflow-y-auto">
      {!isAuthenticated ? (
        /* SECURE LOGIN GATE ("proteja a pagina do administrador") */
        <div 
          className="w-full max-w-md rounded-3xl bg-slate-100 border border-sky-300 shadow-2xl overflow-hidden flex flex-col my-auto transition-all"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-login-title"
        >
          {/* Login Gate Header */}
          <div className="shrink-0 bg-gradient-to-r from-sky-700 via-sky-600 to-sky-800 px-6 py-4.5 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner shrink-0">
                <Lock className="w-5 h-5 text-sky-100" />
              </div>
              <div>
                <h2 id="admin-login-title" className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                  Área do Administrador
                </h2>
                <p className="text-xs text-sky-200 font-medium">Controle e Configurações • Moreninha do Bronze</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Login Gate Body */}
          <div className="p-6 space-y-5">
            <div className="text-center space-y-1">
              <div className="w-13 h-13 mx-auto rounded-2xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700 shadow-inner mb-2.5">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-900">
                Acesso Restrito
              </h3>
              <p className="text-xs text-slate-600">
                Informe as credenciais autorizadas para gerenciar horários, preços e fotos.
              </p>
            </div>

            {/* Lockout Screen with countdown timer if limit exceeded */}
            {secondsRemaining > 0 ? (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 space-y-2 text-center animate-pulse">
                <div className="flex items-center justify-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wide">
                  <AlertCircle className="w-4 h-4" />
                  Painel Temporariamente Bloqueado
                </div>
                <p className="text-xs text-rose-700 leading-relaxed">
                  Limite de 5 tentativas atingido. Por segurança, aguarde o temporizador:
                </p>
                <div className="text-2xl font-mono font-black text-rose-800 tracking-wider">
                  {formatMinutesSeconds(secondsRemaining)}
                </div>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Error Alert */}
                {authError && (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1 leading-relaxed font-medium">{authError}</div>
                  </div>
                )}

                {/* Username with Clear Button ("limpa o usuario escreve") */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Usuário
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      autoFocus
                      autoComplete="username"
                      placeholder="Digite o usuário"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (authError) setAuthError('');
                      }}
                      className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                    {username && (
                      <button
                        type="button"
                        onClick={() => setUsername('')}
                        className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        title="Limpar usuário"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Password with Clear Button & Eye Toggle */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Senha
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Digite a senha"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (authError) setAuthError('');
                      }}
                      className="w-full pl-10 pr-18 py-2.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                    <div className="absolute right-2.5 flex items-center gap-1">
                      {password && (
                        <button
                          type="button"
                          onClick={() => setPassword('')}
                          className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                          title="Limpar senha"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-500 hover:text-slate-700 p-1 cursor-pointer"
                        title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Attempt status */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <span>Segurança: Máximo 5 tentativas</span>
                  {failedAttempts > 0 && (
                    <span className="font-bold text-amber-700">
                      {MAX_LOGIN_ATTEMPTS - failedAttempts} {MAX_LOGIN_ATTEMPTS - failedAttempts === 1 ? 'tentativa restante' : 'tentativas restantes'}
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-1.5">
                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-98 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>Entrar no Painel</span>
                  </button>

                  {(username || password) && (
                    <button
                      type="button"
                      onClick={handleClearInputs}
                      className="w-full py-2 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eraser className="w-3.5 h-3.5" />
                      <span>Limpar Campos</span>
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      ) : (
        /* PROTECTED FULL ADMIN PANEL */
        <div 
          className="w-full max-w-4xl h-[92vh] max-h-[860px] min-h-[480px] rounded-3xl bg-slate-100 border border-sky-200 shadow-2xl overflow-hidden flex flex-col my-auto transition-all"
          role="dialog"
          aria-modal="true"
        >
          {/* Header - Fixed & Unshrinkable with Logout Option */}
          <div className="shrink-0 bg-gradient-to-r from-sky-700 via-sky-600 to-sky-800 px-5 sm:px-6 py-4 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center shadow-inner shrink-0">
                <Settings className="w-5 h-5 text-sky-100" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  Painel Administrativo
                  {isSavedRecently && (
                    <span className="text-[11px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-semibold animate-pulse">
                      Salvo ✓
                    </span>
                  )}
                </h2>
                <p className="text-xs text-sky-200 font-medium">Controle total de agendamentos, fotos, preços e regras</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-500/80 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Bloquear e sair do painel"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bloquear / Sair</span>
              </button>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                aria-label="Fechar painel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

        {/* Tab Navigation - Fixed & Unshrinkable with ample breathing room */}
        <div className="shrink-0 bg-slate-200/95 border-b border-slate-300 px-4 sm:px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTab('appointments')}
                className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs sm:text-sm font-bold shadow-2xs ${
                  activeTab === 'appointments'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-white hover:text-sky-700'
                }`}
              >
                <Calendar className="w-4 h-4 text-sky-400" />
                <span>Agendamentos</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'appointments' ? 'bg-sky-700 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {appointments.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('services')}
                className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs sm:text-sm font-bold shadow-2xs ${
                  activeTab === 'services'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-white hover:text-sky-700'
                }`}
              >
                <Scissors className="w-4 h-4 text-sky-400" />
                <span>Serviços & Preços</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'services' ? 'bg-sky-700 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {tempServices.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs sm:text-sm font-bold shadow-2xs ${
                  activeTab === 'settings'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-white hover:text-sky-700'
                }`}
              >
                <Settings className="w-4 h-4 text-sky-400" />
                <span>Salão, Fotos & PIX</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('buttons')}
                className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs sm:text-sm font-bold shadow-2xs ${
                  activeTab === 'buttons'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-white hover:text-sky-700'
                }`}
              >
                <MousePointerClick className="w-4 h-4 text-sky-400" />
                <span>Personalizar Botões</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('cloud')}
                className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs sm:text-sm font-bold shadow-2xs ${
                  activeTab === 'cloud'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-white hover:text-emerald-700'
                }`}
              >
                <Database className="w-4 h-4 text-emerald-500" />
                <span>Banco de Dados</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-800 text-emerald-100">
                  100% Automático
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
              {statusMessage && (
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-full border border-emerald-300 shadow-2xs">
                  {statusMessage}
                </span>
              )}

              <button
                type="button"
                onClick={handleSaveAll}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                title="Salvar todas as alterações"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Tudo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Body - Clean Scrollable Content Area with min-h-0 */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 min-h-0 custom-scrollbar">
          {/* TAB 1: APPOINTMENTS */}
          {activeTab === 'appointments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  Lista de Agendamentos Recebidos
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {appointments.filter((a) => a.status === 'confirmed' || a.status === 'confirmado').length} confirmados •{' '}
                  {appointments.filter((a) => a.status === 'pending' || a.status === 'pendente').length} pendentes
                </span>
              </div>

              {appointments.length === 0 ? (
                <div className="p-8 text-center bg-slate-200/60 rounded-3xl border border-slate-300 text-slate-500 text-xs">
                  Nenhum agendamento registrado até o momento.
                </div>
              ) : (
                <div className="space-y-3">
                  {appointments.map((app) => {
                    const isConfirmed = app.status === 'confirmed' || app.status === 'confirmado';
                    const isCancelled = app.status === 'cancelled' || app.status === 'cancelado';

                    return (
                      <div
                        key={app.id}
                        className="p-4 rounded-2xl bg-slate-200/90 border border-slate-300 hover:border-sky-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-extrabold text-slate-900">{app.clientName}</span>
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

                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-100 text-sky-800 border border-sky-200">
                              {app.paymentMethod === 'pix' ? '⚡ PIX Antecipado' : '💵 No Local'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                            <span className="flex items-center gap-1">
                              <Scissors className="w-3.5 h-3.5 text-sky-600" />
                              <strong>{app.serviceName}</strong> ({formatCurrency(app.servicePrice)})
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-sky-600" />
                              {formatDate(app.date)} às {app.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-sky-600" />
                              {app.clientPhone}
                            </span>
                          </div>

                          {/* RECEIPT STATUS & BUTTON */}
                          {app.receiptImage ? (
                            <div className="pt-1 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setViewingReceipt(app.receiptImage || null)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Ver Comprovante Anexado
                              </button>
                              <span className="text-[11px] text-emerald-700 font-semibold">
                                ✓ Comprovante enviado pelo cliente
                              </span>
                            </div>
                          ) : (
                            app.paymentMethod === 'pix' && (
                              <span className="text-[11px] text-amber-700 font-medium italic">
                                * Aguardando envio do comprovante pelo WhatsApp do cliente
                              </span>
                            )
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          {!isConfirmed && (
                            <button
                              type="button"
                              onClick={() => updateStatus(app.id, 'confirmed')}
                              className="p-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Confirmar Vaga"
                            >
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                              <span className="hidden sm:inline">Confirmar</span>
                            </button>
                          )}

                          {!isCancelled && (
                            <button
                              type="button"
                              onClick={() => updateStatus(app.id, 'cancelled')}
                              className="p-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Cancelar Vaga"
                            >
                              <XCircle className="w-4 h-4 text-amber-600" />
                              <span className="hidden sm:inline">Cancelar</span>
                            </button>
                          )}

                          {onDeleteAppointment && (
                            <button
                              type="button"
                              onClick={() => onDeleteAppointment(app.id)}
                              className="p-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold transition-colors cursor-pointer"
                              title="Excluir Registro"
                            >
                              <Trash2 className="w-4 h-4 text-rose-600" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SERVICES & PRICES */}
          {activeTab === 'services' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    Serviços e Valores Editáveis
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Altere nomes, preços em reais (R$), fotos e durações. Clique em "Salvar Alterações" para gravar.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRestoreDefaultServices}
                    className="px-3 py-1.5 rounded-xl bg-slate-300 hover:bg-slate-400 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Restaurar os 3 serviços padrão (R$25, R$40, R$15)"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Restaurar Padrão
                  </button>

                  <button
                    type="button"
                    onClick={handleAddService}
                    className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Novo Serviço
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {tempServices.map((srv, idx) => (
                  <div key={srv.id || idx} className="p-4 rounded-3xl bg-slate-200/90 border border-slate-300 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-sky-800 uppercase tracking-wider">
                        Procedimento #{idx + 1}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-700">
                          {formatCurrency(srv.price)}
                        </span>
                        {tempServices.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveService(idx)}
                            className="p-1 rounded-lg text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                            title="Remover procedimento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                          Nome do Serviço
                        </label>
                        <input
                          type="text"
                          value={srv.name}
                          onChange={(e) => handleServiceChange(idx, 'name', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                          Valor em Reais (R$)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={srv.price}
                          onChange={(e) => handleServiceChange(idx, 'price', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold text-sky-800 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                          Duração em Minutos
                        </label>
                        <input
                          type="number"
                          step="5"
                          min="5"
                          value={srv.durationMinutes || 60}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 60;
                            handleServiceChange(idx, 'durationMinutes', val);
                            handleServiceChange(idx, 'duration', `${val} minutos`);
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                          Descrição Rápida
                        </label>
                        <input
                          type="text"
                          value={srv.description}
                          onChange={(e) => handleServiceChange(idx, 'description', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Image Upload for procedure */}
                    <div className="pt-2 border-t border-slate-300">
                      <ImageUploadInput
                        label={`Foto do Procedimento (${srv.name})`}
                        currentImageUrl={srv.imageUrl || srv.image}
                        defaultImageUrl="./images/service-hero.png"
                        onImageChange={(newImg) => {
                          handleServiceChange(idx, 'imageUrl', newImg);
                          handleServiceChange(idx, 'image', newImg);
                          const updated = [...tempServices];
                          updated[idx] = { ...updated[idx], imageUrl: newImg, image: newImg };
                          onSaveServices?.(updated);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SETTINGS, IMAGES & PIX */}
          {activeTab === 'settings' && (
            <div className="space-y-5">
              {/* Salon info & Texts */}
              <div className="p-4 rounded-3xl bg-slate-200/90 border border-slate-300 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                    Textos do Aplicativo & Identidade
                  </h4>
                  <span className="text-[10px] text-sky-800 font-bold bg-sky-100 px-2.5 py-0.5 rounded-full border border-sky-200">
                    Editáveis em Tempo Real
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Nome do Salão / Perfil
                    </label>
                    <input
                      type="text"
                      placeholder="Moreninha do Bronze"
                      value={tempConfig.salonName || tempConfig.name || ''}
                      onChange={(e) => {
                        handleConfigChange('salonName', e.target.value);
                        handleConfigChange('name', e.target.value);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold focus:ring-2 focus:ring-sky-500"
                    />
                    <span className="text-[10px] text-slate-500 font-medium">Exibido no topo, rodapé e comprovantes</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Endereço Curto / Subtítulo do Topo
                    </label>
                    <input
                      type="text"
                      placeholder="Rua Aurélia, Mesquita – RJ"
                      value={tempConfig.shortAddress || tempConfig.address || ''}
                      onChange={(e) => {
                        handleConfigChange('shortAddress', e.target.value);
                        handleConfigChange('address', e.target.value);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-sky-500"
                    />
                    <span className="text-[10px] text-slate-500 font-medium">Subtítulo que aparece logo abaixo do nome</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Texto do Status / Vagas
                    </label>
                    <input
                      type="text"
                      placeholder="Aberto • Atendimento até 21h"
                      value={tempConfig.statusPillText || ''}
                      onChange={(e) => handleConfigChange('statusPillText', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold text-emerald-800 focus:ring-2 focus:ring-sky-500"
                    />
                    <span className="text-[10px] text-slate-500 font-medium">Emblema verde de status no topo</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Título da Seção de Procedimentos
                    </label>
                    <input
                      type="text"
                      placeholder="Serviços & Procedimentos"
                      value={tempConfig.servicesSectionTitle || ''}
                      onChange={(e) => handleConfigChange('servicesSectionTitle', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold focus:ring-2 focus:ring-sky-500"
                    />
                    <span className="text-[10px] text-slate-500 font-medium">Título acima do catálogo de procedimentos</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Endereço Completo
                    </label>
                    <input
                      type="text"
                      placeholder="Rua Aurélia, Mesquita – RJ, 26553-000"
                      value={tempConfig.fullAddress || tempConfig.address || ''}
                      onChange={(e) => {
                        handleConfigChange('fullAddress', e.target.value);
                        handleConfigChange('address', e.target.value);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs focus:ring-2 focus:ring-sky-500"
                    />
                    <span className="text-[10px] text-slate-500 font-medium">Usado no card de endereço e no mapa</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Link do Google Maps (Opcional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://maps.google.com/?q=..."
                      value={tempConfig.mapsUrl || ''}
                      onChange={(e) => handleConfigChange('mapsUrl', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs focus:ring-2 focus:ring-sky-500 font-mono"
                    />
                    <span className="text-[10px] text-slate-500 font-medium">Se deixar vazio, geramos o link automaticamente a partir do endereço</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Texto do Horário de Atendimento
                    </label>
                    <input
                      type="text"
                      placeholder="Segunda a Sábado: 09:00 às 21:00"
                      value={tempConfig.openingHoursText || ''}
                      onChange={(e) => handleConfigChange('openingHoursText', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-sky-500"
                    />
                    <span className="text-[10px] text-slate-500 font-medium">Exibido no card informativo</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      WhatsApp para Agendamentos
                    </label>
                    <input
                      type="text"
                      placeholder="21976333205"
                      value={tempConfig.phone || tempConfig.whatsappNumber || ''}
                      onChange={(e) => {
                        handleConfigChange('phone', e.target.value);
                        handleConfigChange('whatsappNumber', e.target.value);
                        handleConfigChange('whatsappDisplay', e.target.value);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold text-emerald-800 focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Instagram Oficial
                    </label>
                    <input
                      type="text"
                      placeholder="@moreninhadobronze"
                      value={tempConfig.instagramHandle || ''}
                      onChange={(e) => {
                        const raw = e.target.value;
                        handleConfigChange('instagramHandle', raw);
                        handleConfigChange('instagramUrl', formatInstagramUrl(raw));
                      }}
                      onBlur={() => {
                        if (tempConfig.instagramHandle) {
                          handleConfigChange('instagramHandle', formatInstagramHandle(tempConfig.instagramHandle));
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold text-pink-700 focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* Photos */}
              <div className="p-4 rounded-3xl bg-slate-200/90 border border-slate-300 space-y-4">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                  Fotos Principais (Dispositivo ou Link)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ImageUploadInput
                    label="Foto do Perfil / Logo Circular"
                    currentImageUrl={tempConfig.avatarUrl || tempConfig.avatarImage}
                    defaultImageUrl="./images/avatar.png"
                    onImageChange={(url) => {
                      handleConfigChange('avatarUrl', url);
                      handleConfigChange('avatarImage', url);
                      onSaveConfig?.({
                        ...tempConfig,
                        avatarUrl: url,
                        avatarImage: url,
                      });
                    }}
                    helperText="Logo azul MB ou foto da profissional"
                  />

                  <ImageUploadInput
                    label="Foto de Capa do Topo (Banner)"
                    currentImageUrl={tempConfig.coverImageUrl || tempConfig.heroCoverImage}
                    defaultImageUrl="./images/banner.png"
                    onImageChange={(url) => {
                      handleConfigChange('coverImageUrl', url);
                      handleConfigChange('heroCoverImage', url);
                      onSaveConfig?.({
                        ...tempConfig,
                        coverImageUrl: url,
                        heroCoverImage: url,
                      });
                    }}
                    helperText="Banner do salão, ambiente ou produtos"
                  />
                </div>
              </div>

              {/* PIX Settings */}
              <div className="p-4 rounded-3xl bg-slate-200/90 border border-slate-300 space-y-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                  Configuração do PIX (Seguro)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Chave PIX
                    </label>
                    <input
                      type="text"
                      value={tempConfig.pixKey}
                      onChange={(e) => handleConfigChange('pixKey', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-mono font-bold"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      O número não é exibido diretamente aos clientes; é gerado o QR Code e código Copia e Cola padrão BACEN.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Nome do Titular da Conta
                    </label>
                    <input
                      type="text"
                      value={tempConfig.pixMerchantName || ''}
                      onChange={(e) => handleConfigChange('pixMerchantName', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Capacity */}
              <div className="p-4 rounded-3xl bg-slate-200/90 border border-slate-300 space-y-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                  Capacidade & Horários de Funcionamento
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Vagas por Horário
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={tempConfig.maxSlotsPerTime || tempConfig.slotsCapacity || 3}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 3;
                        handleConfigChange('maxSlotsPerTime', val);
                        handleConfigChange('slotsCapacity', val);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold text-sky-800"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Padrão: 3 vagas para cada horário.</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Faixa de Horário
                    </label>
                    <div className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold">
                      09:00 até 21:00 (13 horários disponíveis)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PERSONALIZAR BOTÕES */}
          {activeTab === 'buttons' && (
            <div className="space-y-5">
              {/* Top Banner with Reset Option */}
              <div className="p-4 rounded-3xl bg-sky-50 border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div>
                  <h3 className="text-xs font-black text-sky-900 uppercase tracking-wide flex items-center gap-2">
                    <MousePointerClick className="w-4 h-4 text-sky-600" />
                    Personalizar Todos os Botões do Aplicativo
                  </h3>
                  <p className="text-[11px] text-sky-800 mt-0.5">
                    Modifique livremente os textos de todos os botões de ação do salão. As alterações são refletidas em tempo real.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetButtons}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Restaurar Textos Padrão</span>
                </button>
              </div>

              {/* Group 1: Tela Principal & Cabeçalho */}
              <div className="p-4 rounded-3xl bg-slate-200/90 border border-slate-300 space-y-4">
                <div className="border-b border-slate-300 pb-2">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                    1. Botões da Página Inicial & Topo
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Botões de acesso rápido visíveis para os clientes ao carregar o aplicativo.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Botão "Meus Horários" (Topo)
                    </label>
                    <input
                      type="text"
                      value={tempConfig.btnMyAppointmentsText || ''}
                      onChange={(e) => handleConfigChange('btnMyAppointmentsText', e.target.value)}
                      placeholder="Meus Horários"
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold"
                    />
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
                      <span>Prévia:</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 font-semibold text-slate-700">
                        {tempConfig.btnMyAppointmentsText || 'Meus Horários'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Botão Principal "Agendar Procedimento" (Hero)
                    </label>
                    <input
                      type="text"
                      value={tempConfig.btnScheduleText || ''}
                      onChange={(e) => handleConfigChange('btnScheduleText', e.target.value)}
                      placeholder="Agendar Procedimento"
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold"
                    />
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
                      <span>Prévia:</span>
                      <span className="px-2 py-0.5 rounded-full bg-sky-600 font-semibold text-white">
                        {tempConfig.btnScheduleText || 'Agendar Procedimento'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Botão WhatsApp (Hero)
                    </label>
                    <input
                      type="text"
                      value={tempConfig.btnWhatsAppText || ''}
                      onChange={(e) => handleConfigChange('btnWhatsAppText', e.target.value)}
                      placeholder="WhatsApp"
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold"
                    />
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
                      <span>Prévia:</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-600 font-semibold text-white">
                        {tempConfig.btnWhatsAppText || 'WhatsApp'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Botão Instagram (Hero)
                    </label>
                    <input
                      type="text"
                      value={tempConfig.btnInstagramText || ''}
                      onChange={(e) => handleConfigChange('btnInstagramText', e.target.value)}
                      placeholder="Instagram"
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold"
                    />
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
                      <span>Prévia:</span>
                      <span className="px-2 py-0.5 rounded-full bg-pink-600 font-semibold text-white">
                        {tempConfig.btnInstagramText || 'Instagram'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Botão "Ver no mapa" (Hero)
                    </label>
                    <input
                      type="text"
                      value={tempConfig.btnMapText || ''}
                      onChange={(e) => handleConfigChange('btnMapText', e.target.value)}
                      placeholder="Ver no mapa"
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Botão Flutuante "Falar no WhatsApp"
                    </label>
                    <input
                      type="text"
                      value={tempConfig.btnFloatingWhatsAppText || ''}
                      onChange={(e) => handleConfigChange('btnFloatingWhatsAppText', e.target.value)}
                      placeholder="Falar no WhatsApp"
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Group 2: Cards de Procedimento */}
              <div className="p-4 rounded-3xl bg-slate-200/90 border border-slate-300 space-y-4">
                <div className="border-b border-slate-300 pb-2">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                    2. Botões nos Cards de Procedimentos
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    O botão de ação exibido dentro de cada card na lista de serviços.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Texto do Botão nos Cards
                    </label>
                    <input
                      type="text"
                      value={tempConfig.btnServiceCardText || ''}
                      onChange={(e) => handleConfigChange('btnServiceCardText', e.target.value)}
                      placeholder="Agendar"
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold"
                    />
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
                      <span>Prévia nos cards:</span>
                      <span className="px-3 py-1 rounded-xl bg-sky-600 font-bold text-white text-[11px]">
                        {tempConfig.btnServiceCardText || 'Agendar'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Group 3: Modal de Agendamento & PIX */}
              <div className="p-4 rounded-3xl bg-slate-200/90 border border-slate-300 space-y-4">
                <div className="border-b border-slate-300 pb-2">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                    3. Botões do Modal de Agendamento & PIX
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Navegação entre etapas, confirmações e ações de pagamento.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Avançar da Etapa 1 para 2
                    </label>
                    <input
                      type="text"
                      value={tempConfig.btnStep1NextText || ''}
                      onChange={(e) => handleConfigChange('btnStep1NextText', e.target.value)}
                      placeholder="Avançar para Dados"
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Avançar da Etapa 2 para 3
                    </label>
                    <input
                      type="text"
                      value={tempConfig.btnStep2NextText || ''}
                      onChange={(e) => handleConfigChange('btnStep2NextText', e.target.value)}
                      placeholder="Avançar para Pagamento"
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Confirmar no Local (Etapa 3)
                    </label>
                    <input
                      type="text"
                      value={tempConfig.btnConfirmBookingText || ''}
                      onChange={(e) => handleConfigChange('btnConfirmBookingText', e.target.value)}
                      placeholder="Confirmar Agendamento"
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Confirmar no PIX (Sem Comprovante)
                    </label>
                    <input
                      type="text"
                      value={tempConfig.btnPixSubmitText || ''}
                      onChange={(e) => handleConfigChange('btnPixSubmitText', e.target.value)}
                      placeholder="Enviar Comprovante & Agendar"
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Confirmar no PIX (Com Comprovante Anexado)
                    </label>
                    <input
                      type="text"
                      value={tempConfig.btnPixConfirmWithReceiptText || ''}
                      onChange={(e) => handleConfigChange('btnPixConfirmWithReceiptText', e.target.value)}
                      placeholder="Confirmar com Comprovante"
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Copiar Código PIX
                    </label>
                    <input
                      type="text"
                      value={tempConfig.btnCopyPixText || ''}
                      onChange={(e) => handleConfigChange('btnCopyPixText', e.target.value)}
                      placeholder="Copiar Código PIX (Copia e Cola)"
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Botão Voltar
                    </label>
                    <input
                      type="text"
                      value={tempConfig.btnBackText || ''}
                      onChange={(e) => handleConfigChange('btnBackText', e.target.value)}
                      placeholder="Voltar"
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Botão Cancelar
                    </label>
                    <input
                      type="text"
                      value={tempConfig.btnCancelText || ''}
                      onChange={(e) => handleConfigChange('btnCancelText', e.target.value)}
                      placeholder="Cancelar"
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Group 4: Modais Secundários */}
              <div className="p-4 rounded-3xl bg-slate-200/90 border border-slate-300 space-y-4">
                <div className="border-b border-slate-300 pb-2">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                    4. Modais Secundários (Sucesso, Meus Horários, Dicas & Mapa)
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Textos de fechamento e ações nas telas de confirmação e suporte.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Sucesso: Enviar no WhatsApp
                    </label>
                    <input
                      type="text"
                      value={tempConfig.btnSuccessWhatsAppText || ''}
                      onChange={(e) => handleConfigChange('btnSuccessWhatsAppText', e.target.value)}
                      placeholder="Enviar Comprovante no WhatsApp"
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Sucesso: Ver Meus Agendamentos
                    </label>
                    <input
                      type="text"
                      value={tempConfig.btnSuccessMyAppointmentsText || ''}
                      onChange={(e) => handleConfigChange('btnSuccessMyAppointmentsText', e.target.value)}
                      placeholder="Ver Meus Agendamentos"
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Sucesso: Concluir e Fechar
                    </label>
                    <input
                      type="text"
                      value={tempConfig.btnSuccessCloseText || ''}
                      onChange={(e) => handleConfigChange('btnSuccessCloseText', e.target.value)}
                      placeholder="Concluir e Voltar ao Início"
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Meus Horários: Novo Agendamento
                    </label>
                    <input
                      type="text"
                      value={tempConfig.btnNewBookingText || ''}
                      onChange={(e) => handleConfigChange('btnNewBookingText', e.target.value)}
                      placeholder="Agendar Agora"
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Meus Horários: Fechar
                    </label>
                    <input
                      type="text"
                      value={tempConfig.btnMyAppointmentsCloseText || ''}
                      onChange={(e) => handleConfigChange('btnMyAppointmentsCloseText', e.target.value)}
                      placeholder="Fechar"
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Dicas de Bronze: Fechar
                    </label>
                    <input
                      type="text"
                      value={tempConfig.btnTipsCloseText || ''}
                      onChange={(e) => handleConfigChange('btnTipsCloseText', e.target.value)}
                      placeholder="Entendido, obrigado!"
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Mapa: Abrir no Google Maps
                    </label>
                    <input
                      type="text"
                      value={tempConfig.btnMapOpenText || ''}
                      onChange={(e) => handleConfigChange('btnMapOpenText', e.target.value)}
                      placeholder="Abrir no Google Maps"
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Mapa: Fechar
                    </label>
                    <input
                      type="text"
                      value={tempConfig.btnMapCloseText || ''}
                      onChange={(e) => handleConfigChange('btnMapCloseText', e.target.value)}
                      placeholder="Fechar"
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Carrinho: Adicionar Outro Procedimento
                    </label>
                    <input
                      type="text"
                      value={tempConfig.btnAddServiceToCartText || ''}
                      onChange={(e) => handleConfigChange('btnAddServiceToCartText', e.target.value)}
                      placeholder="+ Adicionar Outro Procedimento ao Carrinho"
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: BANCO DE DADOS EM NUVEM & SUPABASE */}
          {activeTab === 'cloud' && (
            <div className="space-y-5">
              {/* Status Banner */}
              <div className="p-5 rounded-3xl border border-emerald-300 bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 text-slate-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-md shrink-0">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-black uppercase tracking-wide text-emerald-950">
                        Banco de Dados Conectado & Operacional
                      </h3>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-200 text-emerald-900 border border-emerald-300">
                        Cloud SQL Ativo
                      </span>
                      {isSupabaseConfigured() && (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-sky-200 text-sky-900 border border-sky-300">
                          Supabase Ativo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed max-w-xl">
                      Seu salão conta com persistência em nuvem completa: o banco <strong>Cloud SQL PostgreSQL</strong> já está ativo automaticamente, e você também pode conectar seu projeto no <strong>Supabase</strong> a qualquer momento abaixo.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTestSupabase}
                  disabled={isTestingSupabase}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-emerald-900 font-bold text-xs border border-emerald-300 shadow-2xs flex items-center justify-center gap-2 shrink-0 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isTestingSupabase ? 'animate-spin' : ''}`} />
                  <span>{isTestingSupabase ? 'Verificando...' : 'Verificar Conexão'}</span>
                </button>
              </div>

              {/* Diagnostic Test Results */}
              {supabaseTestStatus && (
                <div className="p-4 rounded-2xl border border-emerald-300 bg-emerald-50/80 text-emerald-950 text-xs shadow-2xs">
                  <div className="font-bold mb-2 flex items-center gap-2 text-emerald-900">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>{supabaseTestStatus.message}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200 font-semibold text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>salon_config: Operacional</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>services: Operacional</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>specialists: Operacional</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>appointments: Operacional</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SUPABASE CONFIGURATION CARD */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                      <Cloud className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                        Configuração do Supabase
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {isSupabaseConfigured()
                          ? 'Supabase conectado e sincronizando.'
                          : 'Conecte seu projeto Supabase pessoal para persistência externa.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSupabaseConfig(!showSupabaseConfig)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>{showSupabaseConfig ? 'Recolher' : 'Abrir Configuração'}</span>
                      {showSupabaseConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {showSupabaseConfig && (
                  <div className="space-y-4 pt-2 border-t border-slate-100">
                    <div className="grid grid-cols-1 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          URL do Projeto Supabase (Project URL)
                        </label>
                        <input
                          type="url"
                          value={supabaseUrl}
                          onChange={(e) => setSupabaseUrl(e.target.value)}
                          placeholder="https://seu-projeto.supabase.co"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Encontrado em <strong>Project Settings &gt; API &gt; Project URL</strong>
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Chave Pública Anon (Anon Public Key)
                        </label>
                        <input
                          type="password"
                          value={supabaseKey}
                          onChange={(e) => setSupabaseKey(e.target.value)}
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Encontrado em <strong>Project Settings &gt; API &gt; Project API keys (anon public)</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={handleSaveSupabase}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Salvar e Conectar Supabase</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopySchemaSql}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedSql ? '✓ SQL Copiado!' : 'Copiar Script SQL (schema.sql)'}</span>
                      </button>

                      {isSupabaseConfigured() && (
                        <button
                          type="button"
                          onClick={handleClearSupabase}
                          className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors cursor-pointer"
                        >
                          Limpar Credenciais
                        </button>
                      )}
                    </div>

                    {/* Step-by-step instructions */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] space-y-1.5">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Passo a passo rápido para o Supabase:</span>
                      </div>
                      <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-600">
                        <li>Crie seu projeto gratuitamente em <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline font-semibold">supabase.com</a>.</li>
                        <li>No painel do Supabase, acesse <strong>SQL Editor</strong>, clique em <strong>"Copiar Script SQL"</strong> acima e cole lá para criar as tabelas e o bucket de fotos com 1 clique.</li>
                        <li>Acesse <strong>Project Settings &gt; API</strong>, copie a URL e a Anon Key e cole nos campos acima.</li>
                        <li>Clique em <strong>Salvar e Conectar Supabase</strong> e depois em <strong>Hospedar Imagens no Meu Supabase</strong> abaixo.</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>

              {/* SUPABASE STORAGE: HOSPEDAGEM DE IMAGENS */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700">
                      <UploadCloud className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                        Hospedagem de Fotos no Supabase Storage (CDN)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Envie as fotos (banner, avatar e serviços) para o bucket público do seu Supabase e carregue pela nuvem.
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${
                      isUsingSupabaseImages(tempConfig)
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    {isUsingSupabaseImages(tempConfig)
                      ? '✓ Fotos Hospedadas no Supabase'
                      : 'Fotos em Arquivos Locais'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-800">
                        Bucket de Armazenamento: <code className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{SUPABASE_BUCKET_NAME}</code>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {isUsingSupabaseImages(tempConfig)
                          ? 'O salão está carregando fotos de alta velocidade diretamente da CDN do Supabase.'
                          : 'Clique abaixo para enviar as fotos originais e configurar o carregamento automático via Supabase.'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleHostImagesOnSupabase}
                        disabled={isHostingImages}
                        className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <UploadCloud className={`w-4 h-4 ${isHostingImages ? 'animate-bounce' : ''}`} />
                        <span>{isHostingImages ? 'Enviando Fotos...' : 'Hospedar Imagens no Meu Supabase'}</span>
                      </button>

                      {isUsingSupabaseImages(tempConfig) && (
                        <button
                          type="button"
                          onClick={handleResetLocalImages}
                          className="px-3.5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                          title="Restaurar caminhos locais"
                        >
                          Restaurar Locais
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  {isHostingImages && hostProgress && (
                    <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-sky-900">
                        <span>{hostProgress.currentStep}</span>
                        <span>{hostProgress.percent}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-sky-200 overflow-hidden">
                        <div
                          className="h-full bg-sky-600 rounded-full transition-all duration-300"
                          style={{ width: `${hostProgress.percent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Hosted URLs preview when active */}
                  {isUsingSupabaseImages(tempConfig) && (
                    <div className="pt-2 border-t border-slate-200 space-y-1.5 text-[11px]">
                      <div className="font-bold text-slate-700">Links Ativos no Supabase:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                        <div className="truncate bg-white p-2 rounded-lg border border-slate-200">
                          <span className="font-semibold text-slate-800">Banner: </span>
                          <span className="text-slate-500">{tempConfig.coverImageUrl}</span>
                        </div>
                        <div className="truncate bg-white p-2 rounded-lg border border-slate-200">
                          <span className="font-semibold text-slate-800">Avatar: </span>
                          <span className="text-slate-500">{tempConfig.avatarUrl}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Database Overview & Automatic Features */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-sky-600" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Tabelas Ativas no Banco de Dados
                    </h4>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                    5 de 5 Tabelas Ativas
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-800">Agendamentos (appointments)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Salva todos os horários agendados, clientes, telefones, comprovantes e status.
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-800">Serviços & Procedimentos (services)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Catálogo de bronzeamento e banho de lua com valores e fotos sincronizadas.
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-800">Configurações Gerais (salon_config)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Endereço, WhatsApp, chave PIX, horários de atendimento e personalizações.
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-800">Especialistas (specialists)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Profissionais do salão e terapeutas corporais responsáveis pelos atendimentos.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSyncCloud}
                    disabled={isSyncingCloud}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Cloud className={`w-4 h-4 ${isSyncingCloud ? 'animate-pulse' : ''}`} />
                    <span>{isSyncingCloud ? 'Sincronizando...' : 'Sincronizar Todos os Dados Agora'}</span>
                  </button>

                  <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Sincronização bidirecional automática ativa em tempo real.</span>
                  </div>
                </div>
              </div>

              {/* Zero-Config Guarantee Info */}
              <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 text-xs space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  Como funciona a persistência inteligente:
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  1. O backend Express roda nativamente conectado ao banco de dados relacional <strong>Cloud SQL PostgreSQL</strong> através de um pool de conexões seguro (`pg.Pool`).
                </p>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  2. Ao preencher o Supabase, os dados também são espelhados automaticamente no seu projeto do Supabase.
                </p>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  3. Caso o app seja exportado para hospedagens estáticas (como GitHub Pages ou Vercel), ele continua funcionando sem travar e sem erros, mantendo todas as imagens e fotos visíveis.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 bg-slate-200/95 px-5 sm:px-6 py-3.5 border-t border-slate-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLogout}
              className="px-3.5 py-2 rounded-xl bg-slate-300 hover:bg-rose-100 hover:text-rose-700 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Encerrar sessão administrativa"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Bloquear / Sair</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-slate-300 hover:bg-slate-400/60 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Fechar Painel
            </button>
          </div>

          <button
            type="button"
            onClick={handleSaveAll}
            className={`px-6 py-2.5 rounded-2xl text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
              isSavedRecently
                ? 'bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-300'
                : 'bg-sky-600 hover:bg-sky-700 active:scale-98'
            }`}
          >
            {isSavedRecently ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>Salvo com Sucesso!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Alterações</span>
              </>
            )}
          </button>
        </div>
      </div>
      )}

      {/* LIGHTBOX FOR RECEIPT VIEW */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-lg w-full bg-slate-900 rounded-3xl p-4 text-white shadow-2xl flex flex-col items-center">
            <button
              onClick={() => setViewingReceipt(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-sm font-bold mb-3 flex items-center gap-2 text-sky-300">
              <FileText className="w-4 h-4" />
              Comprovante Enviado pelo Cliente
            </h4>
            <div className="w-full max-h-[70vh] overflow-auto rounded-2xl bg-gradient-to-b from-slate-900 via-sky-950/40 to-slate-950 border border-sky-400/30 p-4 flex items-center justify-center relative shadow-inner">
              {/* Soft radial ambient glow */}
              <div className="absolute inset-0 [background:radial-gradient(circle_at_center,rgba(14,165,233,0.18)_0%,transparent_70%)] pointer-events-none" />
              <img
                src={viewingReceipt}
                alt="Comprovante de pagamento PIX"
                className="relative z-10 max-h-[65vh] max-w-full w-auto object-contain rounded-xl drop-shadow-md"
              />
            </div>
            <button
              onClick={() => setViewingReceipt(null)}
              className="mt-3 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold cursor-pointer"
            >
              Fechar Visualização
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
