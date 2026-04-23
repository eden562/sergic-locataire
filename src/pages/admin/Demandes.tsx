import { useEffect, useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { DemandeItem } from '../../components/DemandeItem'
import { supabase } from '../../lib/supabase'
import type { Demande, StatutDemande, User } from '../../types'

interface DemandeWithUser extends Demande {
  user?: User
}

export default function AdminDemandes() {
  const [demandes, setDemandes] = useState<DemandeWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | StatutDemande>('all')
  const [selected, setSelected] = useState<DemandeWithUser | null>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data } = await supabase
      .from('demandes')
      .select('*, user:users(prenom, nom, email)')
      .order('date_creation', { ascending: false })
    setDemandes((data ?? []) as DemandeWithUser[])
    setLoading(false)
  }

  async function changeStatus(id: string, statut: StatutDemande) {
    const updates: Partial<Demande> = { statut }
    if (statut === 'resolu') updates.date_resolution = new Date().toISOString()
    await supabase.from('demandes').update(updates).eq('id', id)
    setDemandes((prev) => prev.map((d) => d.id === id ? { ...d, ...updates } : d))
    if (selected?.id === id) setSelected((s) => s ? { ...s, ...updates } : s)
  }

  async function sendReply() {
    if (!reply.trim() || !selected) return
    setSending(true)
    await supabase.from('messages').insert({
      user_id: selected.user_id,
      expediteur: 'admin',
      contenu: reply.trim(),
      date_envoi: new Date().toISOString(),
      lu: false,
      demande_id: selected.id,
    })
    setReply('')
    setSending(false)
  }

  const displayed = filter === 'all' ? demandes : demandes.filter((d) => d.statut === filter)

  if (loading) return <div className="animate-pulse text-gray-400">Chargement…</div>

  return (
    <div>
      <PageHeader title="Demandes d'intervention" subtitle={`${demandes.filter((d) => d.statut !== 'resolu' && d.statut !== 'ferme').length} demande(s) active(s)`} />

      <div className="flex gap-2 mb-6">
        {([
          { key: 'all', label: 'Toutes' },
          { key: 'ouvert', label: 'Ouvertes' },
          { key: 'en_cours', label: 'En cours' },
          { key: 'resolu', label: 'Résolues' },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          {displayed.length === 0 ? (
            <div className="card text-center py-8 text-gray-400">Aucune demande.</div>
          ) : (
            displayed.map((d) => (
              <div key={d.id} onClick={() => setSelected(d)} className={`cursor-pointer transition-all ${selected?.id === d.id ? 'ring-2 ring-foncia-blue rounded-xl' : ''}`}>
                <DemandeItem
                  demande={d}
                  onStatusChange={changeStatus}
                />
                {d.user && (
                  <div className="px-4 pb-3 -mt-2">
                    <p className="text-xs text-foncia-blue">
                      {d.user.prenom} {d.user.nom} · {d.user.email}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {selected && (
          <div className="card h-fit sticky top-6">
            <h2 className="font-bold text-foncia-navy mb-1">{selected.titre}</h2>
            <p className="text-sm text-gray-500 mb-4">{selected.description}</p>

            <div className="bg-foncia-bg rounded-lg p-3 mb-4 text-sm">
              <p><span className="text-gray-500">Locataire :</span> <strong>{selected.user?.prenom} {selected.user?.nom}</strong></p>
              <p><span className="text-gray-500">Email :</span> {selected.user?.email}</p>
              <p><span className="text-gray-500">Date :</span> {new Date(selected.date_creation).toLocaleDateString('fr-FR')}</p>
            </div>

            <div className="flex gap-2 mb-4">
              {selected.statut === 'ouvert' && (
                <button onClick={() => changeStatus(selected.id, 'en_cours')} className="btn-secondary text-sm py-1.5">
                  Prendre en charge
                </button>
              )}
              {selected.statut !== 'resolu' && selected.statut !== 'ferme' && (
                <button onClick={() => changeStatus(selected.id, 'resolu')} className="btn-primary text-sm py-1.5">
                  Marquer résolu
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Répondre via messagerie</label>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={3}
                className="input-field resize-none mb-2"
                placeholder="Votre réponse…"
              />
              <button onClick={sendReply} disabled={sending || !reply.trim()} className="btn-primary w-full text-sm py-2">
                {sending ? 'Envoi…' : 'Envoyer le message'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
