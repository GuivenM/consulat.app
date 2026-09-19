import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, CalendarDays, UserCircle } from 'lucide-react';
import { useMemberAuth } from '../context/MemberAuthContext';
import { cn } from '../components/Navbar';

const navItems = [
  { label: 'Accueil', path: '/membre', icon: Home, end: true },
  { label: 'Événements', path: '/membre/evenements', icon: CalendarDays },
  { label: 'Mon profil', path: '/membre/profil', icon: UserCircle },
];

export function MemberSidebar() {
  const { membre } = useMemberAuth();
  if (!membre) return null;

  return (
    <aside className="lg:sticky lg:top-20 space-y-3">
      <NavLink to="/membre/profil" className="block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <div className="h-14 bg-gradient-to-r from-brand-green-600 to-brand-green-800" />
        <div className="px-4 pb-4 -mt-8">
          <div className="w-16 h-16 rounded-full bg-white p-1 shadow-sm">
            <div className="w-full h-full rounded-full bg-brand-green-100 overflow-hidden flex items-center justify-center text-brand-green-700 font-bold text-lg">
              {membre.photo ? (
                <img src={membre.photo} alt={membre.nom} className="w-full h-full object-cover" />
              ) : (
                <span>
                  {membre.prenom?.[0]}
                  {membre.nom?.[0]}
                </span>
              )}
            </div>
          </div>
          <p className="font-bold text-slate-900 mt-2">{membre.nom_complet}</p>
          {(membre.poste || membre.commission) && (
            <p className="text-sm text-slate-500">{membre.poste || membre.commission}</p>
          )}
        </div>
      </NavLink>

      <nav className="bg-white rounded-2xl border border-slate-100 shadow-sm p-2">
        {navItems.map(({ label, path, icon: Icon, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-green-50 text-brand-green-700'
                  : 'text-slate-600 hover:bg-slate-50'
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
