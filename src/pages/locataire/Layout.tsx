import { Outlet, Navigate } from 'react-router-dom'
import { Sidebar } from '../../components/Sidebar'
import { useAuth } from '../../hooks/useAuth'

const NAV_ITEMS = [
  { to: '/locataire/dashboard', icon: '🏠', label: 'Tableau de bord' },
  { to: '/locataire/logement', icon: '📍', label: 'Mon logement' },
  { to: '/locataire/loyers', icon: '💶', label: 'Mes loyers' },
  { to: '/locataire/quittances', icon: '🧾', label: 'Quittances' },
  { to: '/locataire/documents', icon: '📂', label: 'Documents' },
  { to: '/locataire/demandes', icon: '🔧', label: 'Demandes' },
  { to: '/locataire/messages', icon: '💬', label: 'Messagerie' },
  { to: '/locataire/profil', icon: '👤', label: 'Mon profil' },
]

export default function LocataireLayout() {
  const { user, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-sergic-bg flex items-center justify-center">
        <div className="text-sergic-navy text-lg font-medium animate-pulse">Chargement…</div>
      </div>
    )
  }

  if (!user || role !== 'locataire') {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar items={NAV_ITEMS} title="Espace locataire" />
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
