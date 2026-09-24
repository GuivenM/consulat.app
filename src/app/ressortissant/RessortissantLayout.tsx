import React from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { LogOut, BadgeCheck, AlertTriangle } from 'lucide-react';
import { useRessortissantAuth } from '../context/RessortissantAuthContext';
import { Button } from '../components/ui/button';
import { RessortissantSidebar, RessortissantMobileNav } from './RessortissantSidebar';

export function RessortissantLayout() {
  const { logout, ressortissant } = useRessortissantAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/espace-consulaire/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/espace-consulaire" className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center p-1.5 shrink-0">
              <img src="/logo-consulat-mark.png" alt="Consulat" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-sm text-slate-900 shrink-0">Espace consulaire</span>
            {/* Rappel compact du profil sur mobile, où la sidebar complète est masquée */}
            {ressortissant && (
              <span className="lg:hidden flex items-center gap-1 text-xs text-slate-400 border-l border-slate-200 pl-2.5 ml-1 min-w-0 truncate">
                {ressortissant.inscription_verifiee ? (
                  <BadgeCheck className="w-3.5 h-3.5 text-brand-green-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                )}
                <span className="truncate">{ressortissant.prenom}</span>
              </span>
            )}
          </Link>

          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-600 shrink-0">
            <LogOut className="w-4 h-4" /> Déconnexion
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6 items-start">
        <RessortissantSidebar />
        <main className="pb-20 lg:pb-0">
          <Outlet />
        </main>
      </div>

      <RessortissantMobileNav />
    </div>
  );
}
