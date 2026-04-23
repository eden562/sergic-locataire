import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader'
import { StatCard } from '../../components/StatCard'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import type { Bail, Loyer } from '../../types'

export default function LocataireDashboard() {
  const { user } = useAuth()
  const [bail, setBail] = useState<Bail | null>(null)
  const [loyers, setLoyers] = useState<Loyer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user])

  async function loadData() {
    const { data: bailData } = await supabase
      .from('baux')
      .select('*, logement:logements(*)')
      .eq('user_id', user!.id)
      .eq('statut_signature', 'signe')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (bailData) {
      setBail(bailData as Bail)

      const { data: loyersData } = await supabase
        .from('loyers')
        .select('*')
        .eq('bail_id', bailData.id)
        .order('annee', { ascending: false })
        .order('mois', { ascending: false })
        .limit(12)

      setLoyers((loyersData ?? []) as Loyer[])
    }
    setLoading(false)
  }

  if (loading) {
    return <div className="animate-pulse text-gray-400">Chargement…</div>
  }

  const prochainsLoyer = loyers.find((l) => l.statut === 'en_attente')
  const loyersRetard = loyers.filter((l) => l.statut === 'retard').length
  const dernierPaiement = loyers.find((l) => l.statut === 'paye')

  return (
    <div>
      <PageHeader
        title={`Bonjour, ${user?.prenom} 👋`}
        subtitle={
          bail?.logement
            ? `${bail.logement.adresse}, ${bail.logement.cp} ${bail.logement.ville}`
            : undefined
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Loyer mensuel"
          value={bail ? `${(bail.loyer_hc + bail.charges).toLocaleString('fr-FR')} €` : '—'}
          icon="💶"
          color="blue"
        />
        <StatCard
          label="Dépôt de garantie"
          value={bail ? `${bail.depot_garantie.toLocaleString('fr-FR')} €` : '—'}
          icon="🔒"
          color="orange"
        />
        <StatCard
          label="Retards de paiement"
          value={loyersRetard}
          icon="⚠️"
          color={loyersRetard > 0 ? 'red' : 'green'}
        />
        <StatCard
          label="Début du bail"
          value={bail ? new Date(bail.date_debut).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : '—'}
          icon="📅"
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prochain loyer */}
        <div className="card">
          <h2 className="font-bold text-foncia-navy mb-4">Prochain loyer</h2>
          {prochainsLoyer ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-foncia-navy">
                  {(prochainsLoyer.montant + prochainsLoyer.charges).toLocaleString('fr-FR')} €
                </p>
                <p className="text-sm text-gray-500">
                  Échéance le 1er du mois
                </p>
              </div>
              <div className="text-right">
                <span className="badge badge-orange">En attente</span>
                <p className="text-xs text-gray-400 mt-1">
                  {prochainsLoyer.montant.toLocaleString('fr-FR')} € HC<br />
                  + {prochainsLoyer.charges.toLocaleString('fr-FR')} € charges
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Aucun loyer en attente.</p>
          )}
        </div>

        {/* Dernier paiement */}
        <div className="card">
          <h2 className="font-bold text-foncia-navy mb-4">Dernier paiement</h2>
          {dernierPaiement ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-green-600">
                  {(dernierPaiement.montant + dernierPaiement.charges).toLocaleString('fr-FR')} €
                </p>
                <p className="text-sm text-gray-500">
                  {dernierPaiement.date_paiement
                    ? new Date(dernierPaiement.date_paiement).toLocaleDateString('fr-FR')
                    : 'Date inconnue'}
                </p>
              </div>
              <span className="badge badge-green">Payé</span>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Aucun paiement enregistré.</p>
          )}
        </div>

        {/* Accès rapides */}
        <div className="card lg:col-span-2">
          <h2 className="font-bold text-foncia-navy mb-4">Accès rapides</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { to: '/locataire/quittances', icon: '🧾', label: 'Quittances' },
              { to: '/locataire/documents', icon: '📂', label: 'Documents' },
              { to: '/locataire/demandes', icon: '🔧', label: 'Demande' },
              { to: '/locataire/messages', icon: '💬', label: 'Messagerie' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-foncia-bg hover:bg-blue-50 transition-colors text-center"
              >
                <span className="text-3xl">{item.icon}</span>
                <span className="text-sm font-medium text-foncia-navy">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
