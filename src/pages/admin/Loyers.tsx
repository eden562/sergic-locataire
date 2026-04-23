import { useEffect, useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { LoyerRow } from '../../components/LoyerRow'
import { supabase } from '../../lib/supabase'
import type { Loyer, Bail, User, Logement } from '../../types'

interface LoyerWithContext extends Loyer {
  bail?: Bail & { user?: User; logement?: Logement }
}

export default function AdminLoyers() {
  const [loyers, setLoyers] = useState<LoyerWithContext[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'en_attente' | 'retard' | 'paye'>('all')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data } = await supabase
      .from('loyers')
      .select('*, bail:baux(*, user:users(*), logement:logements(*))')
      .order('annee', { ascending: false })
      .order('mois', { ascending: false })

    setLoyers((data ?? []) as LoyerWithContext[])
    setLoading(false)
  }

  async function markPaid(id: string) {
    await supabase
      .from('loyers')
      .update({ statut: 'paye', date_paiement: new Date().toISOString() })
      .eq('id', id)
    setLoyers((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, statut: 'paye', date_paiement: new Date().toISOString() } : l
      )
    )
  }

  const displayed = filter === 'all' ? loyers : loyers.filter((l) => l.statut === filter)
  const totalRetard = loyers.filter((l) => l.statut === 'retard').reduce((s, l) => s + l.montant + l.charges, 0)

  if (loading) return <div className="animate-pulse text-gray-400">Chargement…</div>

  return (
    <div>
      <PageHeader title="Gestion des loyers" subtitle={`${loyers.length} échéance(s) au total`} />

      {totalRetard > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-semibold text-red-700">
              {loyers.filter((l) => l.statut === 'retard').length} loyer(s) en retard
            </p>
            <p className="text-sm text-red-600">
              Montant total : {totalRetard.toLocaleString('fr-FR')} €
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {([
          { key: 'all', label: 'Tous' },
          { key: 'en_attente', label: 'En attente' },
          { key: 'retard', label: 'Retard' },
          { key: 'paye', label: 'Payés' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === key ? 'bg-foncia-blue text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {displayed.length === 0 ? (
          <div className="card text-center py-8 text-gray-400">Aucun loyer dans cette catégorie.</div>
        ) : (
          displayed.map((loyer) => (
            <div key={loyer.id} className="card">
              {loyer.bail?.user && (
                <p className="text-xs text-foncia-blue font-medium mb-2">
                  {loyer.bail.user.prenom} {loyer.bail.user.nom}
                  {loyer.bail.logement && (
                    <span className="text-gray-400 ml-2">— {loyer.bail.logement.adresse}</span>
                  )}
                </p>
              )}
              <LoyerRow loyer={loyer} onMarkPaid={markPaid} showActions />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
