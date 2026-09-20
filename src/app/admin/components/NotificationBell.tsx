import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, FileText, Mail, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../../components/ui/dropdown-menu';
import { cn } from '../../components/Navbar';
import { AdminNotification } from '../hooks/useAdminNotifications';

const ICONS: Record<AdminNotification['type'], React.ComponentType<{ className?: string }>> = {
  demande: FileText,
  message: Mail,
};

function tempsEcoule(dateIso: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(dateIso).getTime()) / 60000));
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const heures = Math.floor(minutes / 60);
  if (heures < 24) return `il y a ${heures} h`;
  const jours = Math.floor(heures / 24);
  return `il y a ${jours} j`;
}

interface NotificationBellProps {
  loading: boolean;
  items: AdminNotification[];
  total: number;
  dark?: boolean;
}

export function NotificationBell({ loading, items, total, dark = false }: NotificationBellProps) {
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'relative w-9 h-9 rounded-full flex items-center justify-center transition-colors',
            dark
              ? 'text-slate-300 hover:text-white hover:bg-white/10'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          )}
          aria-label="Notifications"
        >
          <Bell className="w-[18px] h-[18px]" />
          {total > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-brand-red-600 text-white text-[10px] font-bold flex items-center justify-center leading-none">
              {total > 9 ? '9+' : total}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          {total > 0 && <span className="text-xs font-normal text-slate-400">{total} à traiter</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {loading ? (
          <div className="flex items-center justify-center py-6 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-slate-400">Rien de nouveau 🎉</p>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {items.map((n) => {
              const Icon = ICONS[n.type];
              return (
                <DropdownMenuItem
                  key={`${n.type}-${n.id}`}
                  onClick={() => navigate(n.lien)}
                  className="flex items-start gap-3 py-2.5"
                >
                  <div className="w-7 h-7 rounded-full bg-brand-green-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-brand-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-900 leading-tight truncate">{n.titre}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {n.sous_titre} · {tempsEcoule(n.date)}
                    </p>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
