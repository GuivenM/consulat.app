import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, FilePlus2, UserCircle, BadgeCheck, AlertTriangle } from 'lucide-react';
import { useRessortissantAuth } from '../context/RessortissantAuthContext';
import { cn } from '../components/Navbar';

const navItems = [
  { label: 'Accueil', path: '/espace-consulaire', icon: Home, end: true },
  { label: 'Nouvelle demande', path: '/espace-consulaire/nouvelle-demande', icon: FilePlus2 },
  { label: 'Mon profil', path: '/espace-consulaire/profil', icon: UserCircle },
];

export function RessortissantSidebar() {
  const { ressortissant } = useRessortissantAuth();

  if (!ressortissant) return null;

  return (
    <aside className="hidden lg:block bg-white rounded-3xl border border-slate-100 p-5">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
          {ressortissant.photo ? (
            <img src={ressortissant.photo} alt={ressortissant.nom_complet} className="w-full h-full object-cover" />
          ) : (
            <span className="font-bold text-slate-500">{ressortissant.prenom[0]}{ressortissant.nom[0]}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-slate-900 truncate">{ressortissant.nom_complet}</p>
          <p className="text-xs text-slate-400 font-mono truncate">
            {ressortissant.numero_registre || 'N° en attribution'}
          </p>
        </div>
      </div>

      {!ressortissant.inscription_verifiee && (
        <p className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg px-2.5 py-2 mb-4">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Inscription en cours de vérification par le consulat.
        </p>
      )}
      {ressortissant.inscription_verifiee && (
        <p className="flex items-center gap-1.5 text-xs text-brand-green-700 bg-brand-green-50 rounded-lg px-2.5 py-2 mb-4">
          <BadgeCheck className="w-3.5 h-3.5 shrink-0" />
          Inscription vérifiée
        </p>
      )}

      <nav className="space-y-1">
        {navItems.map(({ label, path, icon: Icon, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive ? 'bg-brand-green-50 text-brand-green-700' : 'text-slate-600 hover:bg-slate-50'
              )
            }
          >
            <Icon className="w-4 h-4" /> {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

// Mobile uniquement : barre de navigation fixe en bas, pour éviter d'avoir à
// re-scroller la sidebar complète sur chaque page (voir RessortissantLayout).
export function RessortissantMobileNav() {
  const { ressortissant } = useRessortissantAuth();

  if (!ressortissant) return null;

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 flex"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {navItems.map(({ label, path, icon: Icon, end }) => (
        <NavLink
          key={path}
          to={path}
          end={end}
          className={({ isActive }) =>
            cn(
              'flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors',
              isActive ? 'text-brand-green-700' : 'text-slate-500'
            )
          }
        >
          <Icon className="w-5 h-5" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
