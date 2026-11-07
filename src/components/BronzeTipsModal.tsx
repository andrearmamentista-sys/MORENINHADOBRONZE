import React from 'react';
import { X, Sparkles, CheckCircle2, Droplets } from 'lucide-react';

import { SalonConfig } from '../types';

interface BronzeTipsModalProps {
  isOpen: boolean;
  config?: SalonConfig;
  onClose: () => void;
}

export const BronzeTipsModal: React.FC<BronzeTipsModalProps> = ({ isOpen, config, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-100 border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-600" />
            <h3 className="font-serif font-bold text-lg text-slate-900">
              Dicas & Cuidados do Bronze
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition hover:bg-slate-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          {/* Card 1 */}
          <div className="bg-slate-200/60 p-3.5 rounded-2xl border border-slate-300 space-y-1.5">
            <div className="flex items-center gap-2 text-sky-800 font-bold">
              <Droplets className="w-4 h-4 text-sky-600" />
              <span>Antes do Procedimento</span>
            </div>
            <ul className="text-slate-700 space-y-1 list-disc list-inside">
              <li>Faça uma esfoliação corporal 24h a 48h antes para uniformizar a pele.</li>
              <li>Beba bastante água ou água de coco no dia do procedimento.</li>
              <li>Venha com roupas folgadas e confortáveis.</li>
              <li>Evite perfumes ou cremes oleosos antes da sessão.</li>
            </ul>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-200/60 p-3.5 rounded-2xl border border-slate-300 space-y-1.5">
            <div className="flex items-center gap-2 text-sky-800 font-bold">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>Durante o Atendimento com Fita</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              O biquíni de esparadrapo é personalizado para a sua preferência de marquinha (fina, média ou cavada), garantindo alinhamento e simetria perfeita.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-200/60 p-3.5 rounded-2xl border border-slate-300 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-800 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Pós-Bronze (Para prolongar o tom dourado)</span>
            </div>
            <ul className="text-slate-700 space-y-1 list-disc list-inside">
              <li>Mantenha a hidratação diária da pele com hidratantes específicos.</li>
              <li>Evite banhos muito quentes nas primeiras 24 horas.</li>
              <li>Sua marquinha dura em média de 30 a 45 dias com os devidos cuidados!</li>
            </ul>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-500 transition cursor-pointer shadow-md shadow-sky-600/25"
        >
          {config?.btnTipsCloseText || 'Entendido, obrigado!'}
        </button>
      </div>
    </div>
  );
};
