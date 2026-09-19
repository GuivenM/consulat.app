import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Actions } from './pages/Actions';
import { ActionsSection } from './pages/ActionsSection';
import { Guide } from './pages/Guide';
import { News } from './pages/News';
import { NewsDetail } from './pages/NewsDetail';
import { Contact } from './pages/Contact';
import { MentionsLegales } from './pages/MentionsLegales';
import { PolitiqueConfidentialite } from './pages/PolitiqueConfidentialite';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { MemberAuthProvider } from './context/MemberAuthContext';
import { ImageLightboxProvider } from './components/ImageLightbox';
import { AdminLogin } from './admin/AdminLogin';
import { ActivationCompteAdmin } from './admin/ActivationCompteAdmin';
import { MotDePasseOublie } from './admin/MotDePasseOublie';
import { AdminLayout } from './admin/AdminLayout';
import { ProtectedRoute } from './admin/ProtectedRoute';
import { Dashboard } from './admin/Dashboard';
import { AdminMessages } from './admin/pages/AdminMessages';
import { AdminMembres } from './admin/pages/AdminMembres';
import { AdminEvenements } from './admin/pages/AdminEvenements';
import { AdminActualites } from './admin/pages/AdminActualites';
import { AdminGuide } from './admin/pages/AdminGuide';
import { AdminPartenaires } from './admin/pages/AdminPartenaires';
import { AdminActions } from './admin/pages/AdminActions';
import { AdminUtilisateurs } from './admin/pages/AdminUtilisateurs';
import { AdminJournal } from './admin/pages/AdminJournal';
import { MemberLogin } from './member/MemberLogin';
import { MotDePasseOublieMembre } from './member/MotDePasseOublieMembre';
import { ActivationCompte } from './member/ActivationCompte';
import { MemberLayout } from './member/MemberLayout';
import { MemberProtectedRoute } from './member/MemberProtectedRoute';
import { MemberDashboard } from './member/MemberDashboard';
import { MemberEvenements } from './member/MemberEvenements';
import { MemberProfil } from './member/MemberProfil';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
      <MemberAuthProvider>
      <ImageLightboxProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="actions" element={<Actions />} />
            <Route path="actions/:section" element={<ActionsSection />} />
            <Route path="guide" element={<Guide />} />
            <Route path="news" element={<News />} />
            <Route path="news/:id" element={<NewsDetail />} />
            <Route path="contact" element={<Contact />} />
            <Route path="mentions-legales" element={<MentionsLegales />} />
            <Route path="confidentialite" element={<PolitiqueConfidentialite />} />
          </Route>

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/activer-compte" element={<ActivationCompteAdmin />} />
          <Route path="/admin/mot-de-passe-oublie" element={<MotDePasseOublie />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="messages" element={<AdminMessages />} />
              <Route path="membres" element={<AdminMembres />} />
              <Route path="evenements" element={<AdminEvenements />} />
              <Route path="actualites" element={<AdminActualites />} />
              <Route path="guide" element={<AdminGuide />} />
              <Route path="partenaires" element={<AdminPartenaires />} />
              <Route path="actions" element={<AdminActions />} />
              <Route element={<ProtectedRoute roles={['super_admin']} />}>
                <Route path="utilisateurs" element={<AdminUtilisateurs />} />
                <Route path="journal" element={<AdminJournal />} />
              </Route>
            </Route>
          </Route>

          <Route path="/membre/login" element={<MemberLogin />} />
          <Route path="/mot-de-passe-oublie" element={<MotDePasseOublieMembre />} />
          <Route path="/activer-compte" element={<ActivationCompte />} />

          <Route element={<MemberProtectedRoute />}>
            <Route path="/membre" element={<MemberLayout />}>
              <Route index element={<MemberDashboard />} />
              <Route path="evenements" element={<MemberEvenements />} />
              <Route path="profil" element={<MemberProfil />} />
            </Route>
          </Route>
        </Routes>
      </ImageLightboxProvider>
      </MemberAuthProvider>
      </AuthProvider>
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  );
}
