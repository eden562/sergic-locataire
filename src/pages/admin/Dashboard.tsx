import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader'
import { StatCard } from '../../components/StatCard'
import { supabase } from '../../lib/supabase'

interface Stats {
  candidatures: number
  locataires: number
  biens: number
  loyersRetard: number
  bailsEnAttente: number
  demandesOuvertes: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    candidatures: 0, locataires: 0, biens: 0,
    loyersRetard: 0, bailsEnAttente: 0, demandesOuvertes: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadStats() }, [])

  async function loadStats() {
    const [cand, loc, biens, loyersRetard, bails, demandes] = await Promise.all([
      supabase.from('candidatures').select('id', { count: 'exact', head: true }).eq('statut', 'en_analyse'),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'locataire'),
      supabase.from('logements').select('id', { count: 'exact', head: true }).eq('actif', true),
      supabase.from('loyers').select('id', { count: 'exact', head: true }).eq('statut', 'retard'),
      supabase.from('baux').select('id', { count: 'exact', head: true }).eq('statut_signature', 'en_attente'),
      supabase.from('demandes').select('id', { count: 'exact', head: true }).in('statut', ['ouvert', 'en_cours']),
    ])

    setStats({
      candidatures: cand.count ?? 0,
      locataires: loc.count ?? 0,
      biens: biens.count ?? 0,
      loyersRetard: loyersRetard.count ?? 0,
      bailsEnAttente: bails.count ?? 0,
      demandesOuvertes: demandes.count ?? 0,
    })
    setLoading(false)
  }

  if (loading) return <div className="animate-pulse text-gray-400">Chargement…</div>

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        subtitle={`${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Candidatures en analyse" value={stats.candidatures} icon="📝" color="blue" />
        <StatCard label="Locataires actifs" value={stats.locataires} icon="🏘️" color="green" />
        <StatCard label="Biens gérés" value={stats.biens} icon="🏠" color="orange" />
        <StatCard label="Loyers en retard" value={stats.loyersRetard} icon="⚠️" color={stats.loyersRetard > 0 ? 'red' : 'green'} />
        <StatCard label="Baux à signer" value={stats.bailsEnAttente} icon="📋" color={stats.bailsEnAttente > 0 ? 'orange' : 'green'} />
        <StatCard label="Demandes ouvertes" value={stats.demandesOuvertes} icon="🔧" color="blue" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { to: '/admin/candidats', icon: '📝', label: 'Gérer les candidatures', color: 'bg-blue-50 text-foncia-blue' },
          { to: '/admin/locataires', icon: '🏘️', label: 'Gérer les locataires', color: 'bg-green-50 text-green-700' },
          { to: '/admin/loyers', icon: '💶', label: 'Suivi des loyers', color: 'bg-orange-50 text-orange-700' },
          { to: '/admin/emails', icon: '✉️', label: "Modèles d'emails", color: 'bg-purple-50 text-purple-700' },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`p-5 rounded-xl ${item.color} hover:opacity-80 transition-opacity flex items-center gap-3 font-medium`}
          >
            <span className="text-3xl">{item.icon}</span>
            <span className="text-sm">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
