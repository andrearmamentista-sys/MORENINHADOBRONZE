import React, { useState } from 'react';
import { Service } from '../types';
import { formatCurrency } from '../utils/helpers';
import { Clock, Sparkles, Calendar } from 'lucide-react';
import { RobustImage } from './RobustImage';

interface ServicesSectionProps {
  services: Service[];
  title?: string;
  onSelectService: (service: Service) => void;
  buttonText?: string;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  services,
  title,
  onSelectService,
  buttonText = 'Agendar',
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const categories = ['todos', ...Array.from(new Set(services.map((s) => s.category).filter(Boolean)))];

  const filteredServices =
    activeCategory === 'todos'
      ? services
      : services.filter((s) => s.category === activeCategory);

  return (
    <section className="px-4 mt-8 space-y-4" id="servicesSection">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="font-serif font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight">
            {title || 'Serviços & Procedimentos'}
          </h2>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200 uppercase tracking-wider">
            {services.length} opções
          </span>
        </div>
        <span className="text-xs text-slate-500 font-semibold tracking-wide">Escolha o seu</span>
      </div>

      {/* Category Pills (if more than 2 categories exist) */}
      {categories.length > 2 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat || 'todos')}
              className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap font-semibold text-xs transition capitalize cursor-pointer shadow-2xs ${
                activeCategory === cat
                  ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-300'
                  : 'bg-slate-100 border border-slate-300 text-slate-700 hover:text-sky-700 hover:border-sky-300'
              }`}
            >
              {cat === 'todos' ? 'Todos os Procedimentos' : cat}
            </button>
          ))}
        </div>
      )}

      {/* Services List - Smooth natural page scroll on mobile */}
      <div className="space-y-4">
        {filteredServices.map((service) => {
          const durationLabel = service.duration || (service.durationMinutes ? `${service.durationMinutes} minutos` : '60 min');

          return (
            <div
              key={service.id}
              className="bg-slate-100 border border-slate-300 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col group hover:border-sky-300"
            >
              {/* Service Cover Image - Seamless edge dissolve with app colors without visible contour */}
              <div className="relative group/cover">
                <RobustImage
                  src={service.imageUrl || service.image}
                  fallbackSrc="/images/service-hero.png"
                  additionalFallbacks={['/images/banner.png', '/images/banner-thumb.png']}
                  alt={service.name}
                  title={service.name}
                  category={service.category || 'Bronzeamento'}
                  showAmbientGlow={true}
                  aspectRatioClass="h-56"
                  objectFit="contain"
                  className="transition duration-300 group-hover:scale-102"
                />

                {service.popular && (
                  <div className="absolute top-3 right-3 py-1 px-2.5 rounded-full text-[10px] font-bold bg-sky-600/95 text-white shadow-md backdrop-blur-xs flex items-center gap-1 z-20">
                    <Sparkles className="w-3 h-3 text-white fill-white" />
                    Mais Procurado
                  </div>
                )}
              </div>

              {/* Service Information */}
              <div className="p-4 flex flex-col flex-grow justify-between space-y-3">
                <div>
                  <h3 className="font-serif font-bold text-lg text-slate-900 group-hover:text-sky-700 transition tracking-tight leading-snug">
                    {service.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed font-normal">
                    {service.description}
                  </p>
                </div>

                {/* Bottom Price & Booking CTA */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <div>
                    <span className="text-sky-700 font-extrabold text-lg tabular-nums tracking-tight">
                      {formatCurrency(service.price)}
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-sky-500" />
                      {durationLabel}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectService(service)}
                    className="px-5 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-sky-500 active:scale-95 transition shadow-sm shadow-sky-600/30 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{buttonText}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
