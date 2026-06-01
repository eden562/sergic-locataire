import { useEffect, useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { DemandeItem } from '../../components/DemandeItem'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import type { Demande, CategorieDemande } from '../../types'

export default function LocataireDemandes() {
  const { user } = useAuth()
  const [demandes, setDemandes] = useState<Demande[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ titre: '', description: '', categorie: 'reparation' as CategorieDemande })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!user) return
    loadDemandes()
  }, [user])

  async function loadDemandes() {
    const { data } = await supabase
      .from('demandes')
      .select('*')
      .eq('user_id', user!.id)
      .order('date_creation', { ascending: false })
    setDemandes((data ?? []) as Demande[])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    await supabase.from('demandes').insert({
      user_id: user!.id,
      titre: form.titre,
      description: form.description,
      categorie: form.categorie,
      statut: 'ouvert',
      date_creation: new Date().toISOString(),
    })
    setForm({ titre: '', description: '', categorie: 'reparation' })
    setShowForm(false)
    setSubmitting(false)
    loadDemandes()
  }

  if (loading) return <div className="animate-pulse text-gray-400">Chargement…</div>

  return (
    <div>
      <PageHeader
        title="Demandes d'intervention"
        subtitle="Signalez un problème ou demandez des travaux"
        action={
          <button onClick={() => setShowForm(!showForm)} className="btn-orange">
            + Nouvelle demande
          </button>
        }
      />

      {showForm && (
        <div className="card mb-6">
          <h2 className="font-bold text-sergic-navy mb-4">Nouvelle demande</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
              <select
                value={form.categorie}
                onChange={(e) => setForm((f) => ({ ...f, categorie: e.target.value as CategorieDemande }))}
                className="input-field"
              >
                <option value="reparation">🔧 Réparation</option>
                <option value="plomberie">🚿 Plomberie</option>
                <option value="electricite">⚡ Électricité</option>
                <option value="serrurerie">🔑 Serrurerie</option>
                <option value="autre">📌 Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
              <input
                type="text"
                value={form.titre}
                onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))}
                required
                className="input-field"
                placeholder="Ex: Fuite sous l'évier"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description détaillée</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                required
                rows={4}
                className="input-field resize-none"
                placeholder="Décrivez le problème avec le plus de détails possible…"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Annuler
              </button>
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Envoi…' : 'Envoyer la demande'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {demandes.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-5xl mb-4">🔧</p>
            <p className="text-gray-500">Aucune demande en cours.</p>
            <p className="text-sm text-gray-400 mt-1">
              Cliquez sur "Nouvelle demande" pour signaler un problème.
            </p>
          </div>
        ) : (
          demandes.map((d) => <DemandeItem key={d.id} demande={d} />)
        )}
      </div>
    </div>
  )
}
