import { Outlet, Navigate } from 'react-router-dom'
import { Sidebar } from '../../components/Sidebar'
import { useAuth } from '../../hooks/useAuth'

const NAV_ITEMS = [
  { to: '/admin', icon: '📊', label: 'Tableau de bord' },
  { to: '/admin/candidats', icon: '📝', label: 'Candidatures' },
  { to: '/admin/locataires', icon: '🏘️', label: 'Locataires' },
  { to: '/admin/biens', icon: '🏠', label: 'Biens' },
  { to: '/admin/loyers', icon: '💶', label: 'Loyers' },
  { to: '/admin/documents', icon: '📂', label: 'Documents' },
  { to: '/admin/demandes', icon: '🔧', label: 'Demandes' },
  { to: '/admin/messages', icon: '💬', label: 'Messages' },
  { to: '/admin/emails', icon: '✉️', label: "Modèles d'emails" },
]

export default function AdminLayout() {
  const { user, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-foncia-bg flex items-center justify-center">
        <div className="text-foncia-navy text-lg font-medium animate-pulse">Chargement…</div>
      </div>
    )
  }

  if (!user || role !== 'admin') {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar items={NAV_ITEMS} title="Administration" />
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
