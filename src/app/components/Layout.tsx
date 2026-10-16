import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { SosButton } from './SosButton';
import { Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-gray-900">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <SosButton />
    </div>
  );
}
