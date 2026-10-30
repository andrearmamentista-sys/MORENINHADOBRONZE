import React from 'react';
import { Sparkles, Calendar, Lock } from 'lucide-react';

interface HeaderProps {
  salonName: string;
  onOpenMyAppointments: () => void;
  onOpenAdmin: () => void;
  userBookingsCount: number;
  buttonText?: string;
}

export const Header: React.FC<HeaderProps> = ({
  salonName,
  onOpenMyAppointments,
  onOpenAdmin,
  userBookingsCount,
  buttonText = 'Meus Horários',
}) => {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-100/95 border-b border-slate-300 shadow-xs">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand logo & dynamic name */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 via-sky-500 to-cyan-400 flex items-center justify-center shadow-md shadow-sky-500/20 ring-2 ring-sky-200">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-serif font-extrabold text-base sm:text-lg tracking-tight text-slate-900">
            {salonName}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenMyAppointments}
            type="button"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200 transition flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
            aria-label="Ver meus agendamentos"
          >
            <Calendar className="w-3.5 h-3.5 text-sky-600" />
            <span>{buttonText}</span>
            {userBookingsCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-sky-600 text-white shadow-xs">
                {userBookingsCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenAdmin}
            type="button"
            className="p-2 rounded-xl text-slate-600 hover:text-sky-700 hover:bg-sky-50 border border-slate-300 transition active:scale-95 cursor-pointer"
            title="Painel Administrativo"
            aria-label="Painel Administrativo"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
