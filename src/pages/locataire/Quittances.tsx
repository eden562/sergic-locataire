import { useEffect, useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import type { Loyer } from '../../types'

const MOIS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
]

export default function LocataireQuittances() {
  const { user } = useAuth()
  const [loyers, setLoyers] = useState<Loyer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user])

  async function loadData() {
    const { data: bail } = await supabase
      .from('baux')
      .select('id')
      .eq('user_id', user!.id)
      .eq('statut_signature', 'signe')
      .single()

    if (bail) {
      const { data } = await supabase
        .from('loyers')
        .select('*')
        .eq('bail_id', bail.id)
        .eq('statut', 'paye')
        .order('annee', { ascending: false })
        .order('mois', { ascending: false })

      setLoyers((data ?? []) as Loyer[])
    }
    setLoading(false)
  }

  function downloadQuittance(loyer: Loyer) {
    // Génération PDF côté client (simulation) — en production : Supabase Edge Function
    const content = `QUITTANCE DE LOYER\n\nMois : ${MOIS[loyer.mois - 1]} ${loyer.annee}\nLoyer HC : ${loyer.montant} €\nCharges : ${loyer.charges} €\nTotal : ${loyer.montant + loyer.charges} €\nDate de paiement : ${loyer.date_paiement ? new Date(loyer.date_paiement).toLocaleDateString('fr-FR') : '—'}`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `quittance-${MOIS[loyer.mois - 1]}-${loyer.annee}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="animate-pulse text-gray-400">Chargement…</div>

  return (
    <div>
      <PageHeader
        title="Mes quittances"
        subtitle="Téléchargez vos quittances de loyer"
      />

      {loyers.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-5xl mb-4">🧾</p>
          <p className="text-gray-500">Aucune quittance disponible pour le moment.</p>
          <p className="text-sm text-gray-400 mt-1">
            Les quittances apparaissent lorsque vos paiements sont enregistrés.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loyers.map((loyer) => (
            <div key={loyer.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-sergic-bg flex items-center justify-center text-2xl">
                  🧾
                </div>
                <div>
                  <p className="font-bold text-sergic-navy">
                    {MOIS[loyer.mois - 1]} {loyer.annee}
                  </p>
                  <p className="text-xs text-gray-500">
                    {loyer.date_paiement
                      ? `Payé le ${new Date(loyer.date_paiement).toLocaleDateString('fr-FR')}`
                      : 'Date non renseignée'}
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm mb-4">
                <span className="text-gray-500">Loyer + charges</span>
                <span className="font-bold text-sergic-navy">
                  {(loyer.montant + loyer.charges).toLocaleString('fr-FR')} €
                </span>
              </div>
              <button
                onClick={() => downloadQuittance(loyer)}
                className="btn-primary w-full text-sm py-2"
              >
                📥 Télécharger
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
