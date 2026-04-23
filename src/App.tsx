import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Auth
import Login from './pages/Login'
import SetPassword from './pages/SetPassword'

// Candidat
import CandidatFormulaire from './pages/candidat/Formulaire'

// Locataire
import LocataireLayout from './pages/locataire/Layout'
import LocataireDashboard from './pages/locataire/Dashboard'
import LocataireLogement from './pages/locataire/Logement'
import LocataireLoyers from './pages/locataire/Loyers'
import LocataireQuittances from './pages/locataire/Quittances'
import LocataireDocuments from './pages/locataire/Documents'
import LocataireDemandes from './pages/locataire/Demandes'
import LocataireMessages from './pages/locataire/Messages'
import LocataireProfil from './pages/locataire/Profil'
import BailSignaturePage from './pages/locataire/BailSignature'

// Admin
import AdminLayout from './pages/admin/Layout'
import AdminDashboard from './pages/admin/Dashboard'
import AdminCandidats from './pages/admin/Candidats'
import AdminLocataires from './pages/admin/Locataires'
import AdminBiens from './pages/admin/Biens'
import AdminLoyers from './pages/admin/Loyers'
import AdminDocuments from './pages/admin/Documents'
import AdminDemandes from './pages/admin/Demandes'
import AdminMessages from './pages/admin/Messages'
import AdminEmailTemplates from './pages/admin/EmailTemplates'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="/candidat" element={<CandidatFormulaire />} />

        {/* Signature du bail (avant accès complet) */}
        <Route path="/locataire/signer-bail" element={<BailSignaturePage />} />

        {/* Espace locataire */}
        <Route path="/locataire" element={<LocataireLayout />}>
          <Route index element={<Navigate to="/locataire/dashboard" replace />} />
          <Route path="dashboard" element={<LocataireDashboard />} />
          <Route path="logement" element={<LocataireLogement />} />
          <Route path="loyers" element={<LocataireLoyers />} />
          <Route path="quittances" element={<LocataireQuittances />} />
          <Route path="documents" element={<LocataireDocuments />} />
          <Route path="demandes" element={<LocataireDemandes />} />
          <Route path="messages" element={<LocataireMessages />} />
          <Route path="profil" element={<LocataireProfil />} />
        </Route>

        {/* Espace admin */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="candidats" element={<AdminCandidats />} />
          <Route path="locataires" element={<AdminLocataires />} />
          <Route path="biens" element={<AdminBiens />} />
          <Route path="loyers" element={<AdminLoyers />} />
          <Route path="documents" element={<AdminDocuments />} />
          <Route path="demandes" element={<AdminDemandes />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="emails" element={<AdminEmailTemplates />} />
        </Route>

        {/* Redirect racine */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
