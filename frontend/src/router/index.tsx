import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { getToken } from '../services/api'

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
      <Footer />
      <WhatsAppButton />
    </>
  )
}

function PrivateRoute() {
  return getToken() ? <Outlet /> : <Navigate to="/admin/login" replace />
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
            <Route path="/admin/candidatures" element={<Candidatures />} />
            <Route path="/admin/candidatures/:id" element={<CandidatureDetail />} />
            <Route path="/admin/demandes" element={<Demandes />} />
            <Route path="/admin/demandes/:id" element={<DemandeDetail />} />
            <Route path="/admin/messages" element={<Messages />} />
            <Route path="/admin/messages/:id" element={<MessageDetail />} />
            <Route path="/admin/temoignages" element={<Temoignages />} />
            <Route path="/admin/placements" element={<Placements />} />
            <Route path="/admin/utilisateurs" element={<Users />} />
            <Route path="/admin/profil" element={<Profile />} />
            <Route path="/admin/newsletter" element={<Newsletter />} />
            <Route path="/admin/contenu" element={<ContentEditor />} />
            <Route path="/admin/services" element={<ServicesAdmin />} />
            <Route path="/admin/actualites" element={<ActualitesAdmin />} />
          </Route>
        </Route>

        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
