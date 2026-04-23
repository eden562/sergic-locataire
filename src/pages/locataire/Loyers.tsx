import { useEffect, useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { LoyerRow } from '../../components/LoyerRow'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import type { Bail, Loyer } from '../../types'

export default function LocataireLoyers() {
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
      .select('*')
      .eq('user_id', user!.id)
      .eq('statut_signature', 'signe')
      .single()

    if (bailData) {
      setBail(bailData as Bail)
      const { data } = await supabase
        .from('loyers')
        .select('*')
        .eq('bail_id', bailData.id)
        .order('annee', { ascending: false })
        .order('mois', { ascending: false })

      setLoyers((data ?? []) as Loyer[])
    }
    setLoading(false)
  }

  if (loading) return <div className="animate-pulse text-gray-400">Chargement…</div>

  const totalPaye = loyers.filter((l) => l.statut === 'paye').reduce((s, l) => s + l.montant + l.charges, 0)
  const en_attente = loyers.filter((l) => l.statut !== 'paye').length

  return (
    <div>
      <PageHeader title="Historique des paiements" subtitle={`Bail du ${bail ? new Date(bail.date_debut).toLocaleDateString('fr-FR') : '—'}`} />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-2xl font-bold text-foncia-navy">{loyers.length}</p>
          <p className="text-xs text-gray-500">Échéances totales</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">{totalPaye.toLocaleString('fr-FR')} €</p>
          <p className="text-xs text-gray-500">Total réglé</p>
        </div>
        <div className="card text-center">
          <p className={`text-2xl font-bold ${en_attente > 0 ? 'text-foncia-orange' : 'text-green-600'}`}>
            {en_attente}
          </p>
          <p className="text-xs text-gray-500">En attente</p>
        </div>
      </div>

      <div className="card">
        <h2 className="font-bold text-foncia-navy mb-4">Détail des paiements</h2>
        {loyers.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">Aucun loyer enregistré.</p>
        ) : (
          loyers.map((l) => <LoyerRow key={l.id} loyer={l} />)
        )}
      </div>
    </div>
  )
}
