import { useEffect, useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import type { Bail } from '../../types'

export default function LocataireLogement() {
  const { user } = useAuth()
  const [bail, setBail] = useState<Bail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('baux')
      .select('*, logement:logements(*), user:users(*)')
      .eq('user_id', user.id)
      .eq('statut_signature', 'signe')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        setBail(data as Bail)
        setLoading(false)
      })
  }, [user])

  if (loading) return <div className="animate-pulse text-gray-400">Chargement…</div>
  if (!bail) return <div className="text-gray-500">Aucun bail actif trouvé.</div>

  const { logement } = bail

  return (
    <div>
      <PageHeader title="Mon logement" subtitle={logement ? `${logement.adresse}, ${logement.ville}` : undefined} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-bold text-foncia-navy mb-4">Caractéristiques</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Adresse', value: logement?.adresse },
              { label: 'Ville', value: `${logement?.cp} ${logement?.ville}` },
              { label: 'Surface', value: logement ? `${logement.surface} m²` : '—' },
              { label: 'Pièces', value: logement?.nb_pieces },
              { label: 'Étage', value: logement?.etage !== undefined ? logement.etage : 'RDC' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
                <p className="font-medium text-foncia-navy">{value ?? '—'}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="font-bold text-foncia-navy mb-4">Mon bail</h2>
          <div className="space-y-3">
            {[
              { label: 'Loyer hors charges', value: `${bail.loyer_hc.toLocaleString('fr-FR')} €` },
              { label: 'Charges', value: `${bail.charges.toLocaleString('fr-FR')} €` },
              {
                label: 'Total mensuel',
                value: `${(bail.loyer_hc + bail.charges).toLocaleString('fr-FR')} €`,
                highlight: true,
              },
              { label: 'Dépôt de garantie', value: `${bail.depot_garantie.toLocaleString('fr-FR')} €` },
              {
                label: 'Début du bail',
                value: new Date(bail.date_debut).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'long', year: 'numeric',
                }),
              },
              bail.date_signature
                ? {
                    label: 'Signé le',
                    value: new Date(bail.date_signature).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    }),
                  }
                : null,
            ]
              .filter(Boolean)
              .map((item) => (
                <div
                  key={item!.label}
                  className={`flex justify-between py-2 ${
                    item!.highlight ? 'border-t border-b border-gray-100 font-bold' : ''
                  }`}
                >
                  <span className="text-sm text-gray-600">{item!.label}</span>
                  <span className={`text-sm ${item!.highlight ? 'text-foncia-orange text-base' : 'text-foncia-navy font-medium'}`}>
                    {item!.value}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {logement?.description && (
          <div className="card lg:col-span-2">
            <h2 className="font-bold text-foncia-navy mb-3">Description</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{logement.description}</p>
          </div>
        )}
      </div>
    </div>
  )
}
