/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ServicesSection } from './components/ServicesSection';
import { BookingModal } from './components/BookingModal';
import { SuccessModal } from './components/SuccessModal';
import { MyAppointmentsModal } from './components/MyAppointmentsModal';
import { AdminModal } from './components/AdminModal';
import { MapModal } from './components/MapModal';
import { BronzeTipsModal } from './components/BronzeTipsModal';
import { Toast } from './components/Toast';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { Service, Appointment, SalonConfig, Specialist, AppointmentStatus } from './types';
import {
  getStoredAppointments,
  getStoredServices,
  getStoredSalonConfig,
  getStoredSpecialists,
  getSavedUserData,
  formatWhatsAppUrl,
  formatInstagramUrl,
} from './utils/helpers';
import {
  fetchSalonConfig,
  saveSalonConfig,
  fetchServices,
  saveServices,
  fetchSpecialists,
  saveSpecialists,
  fetchAppointments,
  createAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  subscribeToAppointments,
} from './services/dbService';
import { MessageCircle, Heart, Sparkles, Instagram } from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<SalonConfig>(getStoredSalonConfig);
  const [services, setServices] = useState<Service[]>(getStoredServices);
  const [specialists, setSpecialists] = useState<Specialist[]>(getStoredSpecialists);
  const [appointments, setAppointments] = useState<Appointment[]>(getStoredAppointments);

  // Modals state
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [latestAppointment, setLatestAppointment] = useState<Appointment | null>(null);
  const [isMyAppointmentsOpen, setIsMyAppointmentsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isTipsOpen, setIsTipsOpen] = useState(false);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  // Carregar dados atualizados do Supabase no mount e escutar em tempo real
  useEffect(() => {
    let isMounted = true;

    Promise.all([
      fetchSalonConfig(),
      fetchServices(),
      fetchSpecialists(),
      fetchAppointments(),
    ])
      .then(([remoteConfig, remoteServices, remoteSpecialists, remoteAppointments]) => {
        if (!isMounted) return;
        if (remoteConfig) setConfig(remoteConfig);
        if (remoteServices && remoteServices.length > 0) setServices(remoteServices);
        if (remoteSpecialists && remoteSpecialists.length > 0) setSpecialists(remoteSpecialists);
        if (remoteAppointments && remoteAppointments.length > 0) setAppointments(remoteAppointments);
      })
      .catch((err) => {
        console.warn('Carregamento inicial Supabase:', err);
      });

    // Realtime listener para novos agendamentos via Supabase
    const unsubscribe = subscribeToAppointments((liveAppointments) => {
      if (isMounted && liveAppointments && liveAppointments.length > 0) {
        setAppointments(liveAppointments);
      }
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleOpenBooking = (serviceId?: string) => {
    setSelectedServiceId(serviceId || '');
    setIsBookingOpen(true);
  };

  const handleConfirmBooking = async (newAppointment: Appointment) => {
    // Atualização otimista imediata na UI
    setAppointments((prev) => [newAppointment, ...prev.filter((a) => a.id !== newAppointment.id)]);
    setIsBookingOpen(false);
    setLatestAppointment(newAppointment);
    setIsSuccessOpen(true);
    showToast('Horário agendado com sucesso!');

    // Persistência em nuvem (Supabase) com fallback seguro no cache local
    try {
      const updated = await createAppointment(newAppointment);
      setAppointments(updated);
    } catch (err) {
      console.warn('Erro ao salvar agendamento na nuvem:', err);
    }
  };

  const handleCancelAppointment = async (id: string) => {
    setAppointments((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'cancelado' } : item))
    );
    showToast('Agendamento cancelado.');
    try {
      const updated = await updateAppointmentStatus(id, 'cancelado');
      setAppointments(updated);
    } catch (err) {
      console.warn('Erro ao cancelar agendamento:', err);
    }
  };

  const handleUpdateStatus = async (id: string, status: AppointmentStatus) => {
    setAppointments((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
    showToast(`Status atualizado para: ${status}`);
    try {
      const updated = await updateAppointmentStatus(id, status);
      setAppointments(updated);
    } catch (err) {
      console.warn('Erro ao atualizar status:', err);
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    setAppointments((prev) => prev.filter((item) => item.id !== id));
    showToast('Agendamento excluído.');
    try {
      const updated = await deleteAppointment(id);
      setAppointments(updated);
    } catch (err) {
      console.warn('Erro ao excluir agendamento:', err);
    }
  };

  // Salvar serviços na nuvem e atualizar catálogo
  const handleSaveServices = async (newServices: Service[]) => {
    const formatted: Service[] = newServices.map((s) => ({
      ...s,
      imageUrl: s.imageUrl || s.image || '',
      image: s.imageUrl || s.image || '',
      duration: s.duration || `${s.durationMinutes || 60} minutos`,
      durationMinutes: Number(s.durationMinutes || 60),
      price: Number(s.price || 0),
    }));
    setServices(formatted);
    showToast('Serviços e preços salvos com sucesso!');
    try {
      await saveServices(formatted);
    } catch (err) {
      console.warn('Erro ao persistir serviços:', err);
    }
  };

  const handleSaveNewService = (newService: Service) => {
    const updated = [newService, ...services];
    handleSaveServices(updated);
  };

  const handleUpdateService = (updatedService: Service) => {
    const updated = services.map((s) => (s.id === updatedService.id ? updatedService : s));
    handleSaveServices(updated);
  };

  const handleDeleteService = (serviceId: string) => {
    const updated = services.filter((s) => s.id !== serviceId);
    handleSaveServices(updated);
  };

  // Salvar configurações gerais do salão no Supabase
  const handleSaveConfig = async (newConfig: SalonConfig) => {
    const synced: SalonConfig = {
      ...newConfig,
      salonName: newConfig.salonName || newConfig.name || 'Moreninha do Bronze',
      name: newConfig.salonName || newConfig.name || 'Moreninha do Bronze',
      address: newConfig.address || newConfig.fullAddress || newConfig.shortAddress || 'Rua Aurélia, Mesquita – RJ',
      fullAddress: newConfig.fullAddress || newConfig.address || 'Rua Aurélia, Mesquita – RJ',
      shortAddress: newConfig.shortAddress || newConfig.address || 'Rua Aurélia, Mesquita – RJ',
      phone: newConfig.phone || newConfig.whatsappNumber || '21976333205',
      whatsappNumber: newConfig.whatsappNumber || newConfig.phone || '21976333205',
      whatsappDisplay: newConfig.whatsappDisplay || newConfig.phone || '(21) 97633-3205',
      instagramHandle: newConfig.instagramHandle || '@moreninhadobronze01',
      instagramUrl:
        newConfig.instagramUrl ||
        (newConfig.instagramHandle
          ? `https://www.instagram.com/${newConfig.instagramHandle.replace('@', '')}`
          : 'https://www.instagram.com/moreninhadobronze01'),
      mapsUrl:
        newConfig.mapsUrl && newConfig.mapsUrl.trim() !== ''
          ? newConfig.mapsUrl.trim()
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              newConfig.fullAddress || newConfig.address || 'Rua Aurélia, Mesquita – RJ'
            )}`,
      coverImageUrl: newConfig.coverImageUrl || newConfig.heroCoverImage || './images/banner.png',
      heroCoverImage: newConfig.coverImageUrl || newConfig.heroCoverImage || './images/banner.png',
      avatarUrl: newConfig.avatarUrl || newConfig.avatarImage || './images/avatar.png',
      avatarImage: newConfig.avatarUrl || newConfig.avatarImage || './images/avatar.png',
      statusPillText: newConfig.statusPillText || 'Aberto • Atendimento até 21h',
      servicesSectionTitle: newConfig.servicesSectionTitle || 'Serviços & Procedimentos',
      servicesSectionSubtitle: newConfig.servicesSectionSubtitle || '',
      maxSlotsPerTime: Number(newConfig.maxSlotsPerTime || newConfig.slotsCapacity || 3),
      slotsCapacity: Number(newConfig.maxSlotsPerTime || newConfig.slotsCapacity || 3),
      openingHoursText: newConfig.openingHoursText || 'Segunda a Sábado: 09:00 às 21:00',
      pixKey: newConfig.pixKey || '21976333205',
      pixMerchantName: newConfig.pixMerchantName || 'Moreninha Bronze',
      pixMerchantCity: newConfig.pixMerchantCity || newConfig.pixCity || 'Mesquita',
      pixCity: newConfig.pixMerchantCity || newConfig.pixCity || 'Mesquita',
    };
    setConfig(synced);
    showToast('Configurações salvas com sucesso!');
    try {
      await saveSalonConfig(synced);
    } catch (err) {
      console.warn('Erro ao salvar config no Supabase:', err);
    }
  };

  const handleSaveSpecialists = async (newSpecialists: Specialist[]) => {
    setSpecialists(newSpecialists);
    try {
      await saveSpecialists(newSpecialists);
      showToast('Especialistas atualizados com sucesso!');
    } catch (err) {
      console.warn('Erro ao salvar especialistas no Supabase:', err);
    }
  };

  // Find user's appointments (based on remembered client phone or recent ones)
  const savedUser = getSavedUserData();
  const userBookings = appointments.filter(
    (apt) => savedUser?.phone && apt.clientPhone.replace(/\D/g, '') === savedUser.phone.replace(/\D/g, '')
  );
  const displayedUserBookings = userBookings.length > 0 ? userBookings : appointments.slice(0, 3);

  const salonNameDisplay = config.salonName || config.name || 'Moreninha do Bronze';
  const instagramHref = formatInstagramUrl(config.instagramUrl || config.instagramHandle || 'moreninhadobronze01');

  return (
    <div className="min-h-screen bg-[#f0f7ff] text-slate-800 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* Top sticky navigation */}
      <Header
        salonName={salonNameDisplay}
        onOpenMyAppointments={() => setIsMyAppointmentsOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        userBookingsCount={displayedUserBookings.length}
        buttonText={config.btnMyAppointmentsText || 'Meus Horários'}
      />

      {/* Main Container - Mobile First Max-w-md */}
      <main className="flex-grow max-w-md w-full mx-auto pb-20">
        {/* Profile Hero Header with centered iconic visual */}
        <Hero
          config={config}
          onScheduleClick={() => handleOpenBooking()}
          onOpenMap={() => setIsMapOpen(true)}
          onOpenAdmin={() => setIsAdminOpen(true)}
          onOpenTips={() => setIsTipsOpen(true)}
        />

        {/* Services List with sleek scrollbar & light-gray style */}
        <ServicesSection
          services={services}
          title={config.servicesSectionTitle}
          onSelectService={(service) => handleOpenBooking(service.id)}
          buttonText={config.btnServiceCardText || 'Agendar'}
        />

        {/* Footer info */}
        <footer className="mt-12 px-6 text-center space-y-3 pt-6 border-t border-sky-200/80">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-serif font-bold text-sm text-slate-800">
              {salonNameDisplay}
            </span>
          </div>

          <p className="text-[11px] text-slate-500 font-medium">
            {config.fullAddress || config.address || 'Rua Aurélia, Mesquita – RJ'} • Atendimento das{' '}
            {config.openingHoursText || '09:00 às 21:00'}
          </p>

          <div className="flex items-center justify-center gap-4 text-xs text-slate-600 pt-1 font-medium">
            <button
              type="button"
              onClick={() => setIsTipsOpen(true)}
              className="hover:text-sky-600 cursor-pointer"
            >
              Dicas de Bronze
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setIsMapOpen(true)}
              className="hover:text-sky-600 cursor-pointer"
            >
              Localização
            </button>
            <span>•</span>
            <a
              href={instagramHref}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-pink-600 flex items-center gap-1"
            >
              <Instagram className="w-3 h-3 text-pink-500" />
              Instagram
            </a>
          </div>

          <p className="text-[10px] text-slate-400 pt-2 flex items-center justify-center gap-1">
            <span>Feito com</span>
            <Heart className="w-3 h-3 text-sky-500 fill-sky-500" />
            <span>para realçar sua marquinha perfeita</span>
          </p>
        </footer>
      </main>

      {/* Floating High-Impact WhatsApp Button */}
      <a
        href={formatWhatsAppUrl(
          config.whatsappNumber || config.phone || '21976333205',
          `Olá! Vim pelo site da ${salonNameDisplay} e gostaria de tirar dúvidas sobre os horários.`
        )}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Tirar dúvidas no WhatsApp"
        className="fixed bottom-5 right-5 z-40 bg-gradient-to-tr from-emerald-600 via-emerald-500 to-green-500 text-white p-3.5 rounded-full shadow-2xl flex items-center gap-2 font-bold text-xs hover:scale-105 active:scale-95 transition-all duration-300 whatsapp-pulse group"
      >
        <MessageCircle className="w-6 h-6 fill-white" />
        <span className="hidden sm:inline pr-1">{config.btnFloatingWhatsAppText || 'Falar no WhatsApp'}</span>
      </a>

      {/* Booking Drawer / Wizard Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        services={services}
        initialServiceId={selectedServiceId}
        existingAppointments={appointments}
        specialists={specialists}
        config={config}
        onConfirmBooking={handleConfirmBooking}
      />

      {/* Success Modal with PIX & WhatsApp */}
      <SuccessModal
        isOpen={isSuccessOpen}
        appointment={latestAppointment}
        config={config}
        onClose={() => setIsSuccessOpen(false)}
        onViewMyAppointments={() => setIsMyAppointmentsOpen(true)}
      />

      {/* Client's Appointments Modal */}
      <MyAppointmentsModal
        isOpen={isMyAppointmentsOpen}
        onClose={() => setIsMyAppointmentsOpen(false)}
        appointments={displayedUserBookings}
        config={config}
        onCancelAppointment={handleCancelAppointment}
        onNewBookingClick={() => handleOpenBooking()}
      />

      {/* Admin Control Panel Modal (Full Editor with onSaveServices connected!) */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        appointments={appointments}
        services={services}
        config={config}
        specialists={specialists}
        onUpdateStatus={handleUpdateStatus}
        onDeleteAppointment={handleDeleteAppointment}
        onSaveServices={handleSaveServices}
        onSaveNewService={handleSaveNewService}
        onUpdateService={handleUpdateService}
        onDeleteService={handleDeleteService}
        onSaveConfig={handleSaveConfig}
        onSaveSpecialists={handleSaveSpecialists}
        onShowToast={showToast}
      />

      {/* Google Maps View Modal */}
      <MapModal
        isOpen={isMapOpen}
        config={config}
        onClose={() => setIsMapOpen(false)}
      />

      {/* Bronze Tips Modal */}
      <BronzeTipsModal
        isOpen={isTipsOpen}
        config={config}
        onClose={() => setIsTipsOpen(false)}
      />

      {/* PWA In-App Install Prompt */}
      <PWAInstallBanner />

      {/* Toast Feedback */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}
