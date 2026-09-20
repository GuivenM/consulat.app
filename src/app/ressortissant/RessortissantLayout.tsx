import React from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useRessortissantAuth } from '../context/RessortissantAuthContext';
import { Button } from '../components/ui/button';
import { RessortissantSidebar } from './RessortissantSidebar';

export function RessortissantLayout() {
  const { logout } = useRessortissantAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/espace-consulaire/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/espace-consulaire" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center p-1.5 shrink-0">
              <img src="/logo-consulat-mark.png" alt="Consulat" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-sm text-slate-900">Espace consulaire</span>
          </Link>

          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-600">
            <LogOut className="w-4 h-4" /> Déconnexion
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6 items-start">
        <RessortissantSidebar />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
