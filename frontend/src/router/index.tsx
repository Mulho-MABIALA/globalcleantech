import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { getToken } from '../services/api'
import { useMe, hasPermission, PermissionModule } from '../hooks/useMe'

import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import WhatsAppButton from '../components/layout/WhatsAppButton'

import Home from '../pages/public/Home'
import About from '../pages/public/About'
import ContactPage from '../pages/public/ContactPage'
import PostulerPage from '../pages/public/PostulerPage'
import NotFound from '../pages/public/NotFound'
import Login from '../pages/dashboard/Login'
import DashboardHome from '../pages/dashboard/DashboardHome'
import Candidatures from '../pages/dashboard/Candidatures'
import CandidatureDetail from '../pages/dashboard/CandidatureDetail'
import Demandes from '../pages/dashboard/Demandes'
import DemandeDetail from '../pages/dashboard/DemandeDetail'
import Messages from '../pages/dashboard/Messages'
import MessageDetail from '../pages/dashboard/MessageDetail'
import Temoignages from '../pages/dashboard/Temoignages'
import Placements from '../pages/dashboard/Placements'
import Users from '../pages/dashboard/Users'
import Profile from '../pages/dashboard/Profile'
import Newsletter from '../pages/dashboard/Newsletter'
import ContentEditor from '../pages/dashboard/ContentEditor'
import ServicesAdmin from '../pages/dashboard/ServicesAdmin'
import ActualitesAdmin from '../pages/dashboard/ActualitesAdmin'
import PublicitesAdmin from '../pages/dashboard/PublicitesAdmin'
import PubStrip from '../components/pub/PubStrip'
import PubPopup from '../components/pub/PubPopup'
import StatutCandidature from '../pages/public/StatutCandidature'
import MentionsLegales from '../pages/public/MentionsLegales'
import Confidentialite from '../pages/public/Confidentialite'
import DashboardLayout from './DashboardLayout'

function PublicLayout() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <Outlet />
      </main>
      <PubStrip />
      <Footer />
      <WhatsAppButton />
      <PubPopup />
    </>
  )
}

function PrivateRoute() {
  return getToken() ? <Outlet /> : <Navigate to="/admin/login" replace />
}

/**
 * Protège une page du dashboard selon les permissions de l'utilisateur connecté.
 * Un admin passe toujours. Un gestionnaire doit avoir au moins "read" sur le module.
 */
function PermissionRoute({ module }: { module: PermissionModule }) {
  const { data: me, isLoading } = useMe()

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!hasPermission(me, module, 'read')) {
    return (
      <div className="text-center py-24 px-4">
        <p className="text-lg font-semibold text-dark">Accès refusé</p>
        <p className="text-muted mt-1">Vous n'avez pas la permission d'accéder à cette page.</p>
      </div>
    )
  }

  return <Outlet />
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/a-propos" element={<About />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/postuler" element={<PostulerPage />} />
          <Route path="/statut-candidature" element={<StatutCandidature />} />
          <Route path="/mentions-legales" element={<MentionsLegales />} />
          <Route path="/confidentialite" element={<Confidentialite />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="/admin/login" element={<Login />} />

        <Route element={<PrivateRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin/dashboard" element={<DashboardHome />} />

            <Route element={<PermissionRoute module="candidatures" />}>
              <Route path="/admin/candidatures" element={<Candidatures />} />
              <Route path="/admin/candidatures/:id" element={<CandidatureDetail />} />
            </Route>

            <Route element={<PermissionRoute module="demandes" />}>
              <Route path="/admin/demandes" element={<Demandes />} />
              <Route path="/admin/demandes/:id" element={<DemandeDetail />} />
            </Route>

            <Route element={<PermissionRoute module="messages" />}>
              <Route path="/admin/messages" element={<Messages />} />
              <Route path="/admin/messages/:id" element={<MessageDetail />} />
            </Route>

            <Route element={<PermissionRoute module="temoignages" />}>
              <Route path="/admin/temoignages" element={<Temoignages />} />
            </Route>

            <Route element={<PermissionRoute module="placements" />}>
              <Route path="/admin/placements" element={<Placements />} />
            </Route>

            <Route element={<PermissionRoute module="utilisateurs" />}>
              <Route path="/admin/utilisateurs" element={<Users />} />
            </Route>

            <Route path="/admin/profil" element={<Profile />} />

            <Route element={<PermissionRoute module="newsletter" />}>
              <Route path="/admin/newsletter" element={<Newsletter />} />
            </Route>

            <Route element={<PermissionRoute module="contenu" />}>
              <Route path="/admin/contenu" element={<ContentEditor />} />
            </Route>

            <Route element={<PermissionRoute module="services" />}>
              <Route path="/admin/services" element={<ServicesAdmin />} />
            </Route>

            <Route element={<PermissionRoute module="actualites" />}>
              <Route path="/admin/actualites" element={<ActualitesAdmin />} />
            </Route>

            <Route element={<PermissionRoute module="publicites" />}>
              <Route path="/admin/publicites" element={<PublicitesAdmin />} />
            </Route>
          </Route>
        </Route>

        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
