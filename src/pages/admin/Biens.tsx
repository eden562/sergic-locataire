import { useEffect, useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { supabase } from '../../lib/supabase'
import type { Logement } from '../../types'

const EMPTY: Omit<Logement, 'id' | 'created_at'> = {
  adresse: '', ville: '', cp: '', surface: 0, nb_pieces: 1,
  etage: 0, loyer_hc: 0, charges: 0, description: '', actif: true,
}

export default function AdminBiens() {
  const [biens, setBiens] = useState<Logement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Logement | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadBiens() }, [])

  async function loadBiens() {
    const { data } = await supabase.from('logements').select('*').order('ville').order('adresse')
    setBiens((data ?? []) as Logement[])
    setLoading(false)
  }

  function startEdit(bien: Logement) {
    setEditing(bien)
    setForm({ adresse: bien.adresse, ville: bien.ville, cp: bien.cp, surface: bien.surface,
      nb_pieces: bien.nb_pieces, etage: bien.etage ?? 0, loyer_hc: bien.loyer_hc,
      charges: bien.charges, description: bien.description ?? '', actif: bien.actif })
    setShowForm(true)
  }

  function startNew() {
    setEditing(null)
    setForm(EMPTY)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    if (editing) {
      await supabase.from('logements').update(form).eq('id', editing.id)
    } else {
      await supabase.from('logements').insert(form)
    }
    setSaving(false)
    setShowForm(false)
    loadBiens()
  }

  async function toggleActif(bien: Logement) {
    await supabase.from('logements').update({ actif: !bien.actif }).eq('id', bien.id)
    setBiens((prev) => prev.map((b) => b.id === bien.id ? { ...b, actif: !b.actif } : b))
  }

  if (loading) return <div className="animate-pulse text-gray-400">Chargement…</div>

  return (
    <div>
      <PageHeader
        title="Biens immobiliers"
        subtitle={`${biens.filter((b) => b.actif).length} bien(s) actif(s)`}
        action={
          <button onClick={startNew} className="btn-primary">
            + Ajouter un bien
          </button>
        }
      />

      {showForm && (
        <div className="card mb-6">
          <h2 className="font-bold text-foncia-navy mb-4">
            {editing ? 'Modifier le bien' : 'Nouveau bien'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Adresse *</label>
                <input type="text" value={form.adresse} onChange={(e) => setForm((f) => ({ ...f, adresse: e.target.value }))} required className="input-field" placeholder="12 rue de la Paix" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">CP *</label>
                <input type="text" value={form.cp} onChange={(e) => setForm((f) => ({ ...f, cp: e.target.value }))} required className="input-field" placeholder="75001" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Ville *</label>
                <input type="text" value={form.ville} onChange={(e) => setForm((f) => ({ ...f, ville: e.target.value }))} required className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Étage</label>
                <input type="number" value={form.etage} onChange={(e) => setForm((f) => ({ ...f, etage: parseInt(e.target.value) || 0 }))} className="input-field" min="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Surface (m²)</label>
                <input type="number" value={form.surface} onChange={(e) => setForm((f) => ({ ...f, surface: parseFloat(e.target.value) || 0 }))} className="input-field" min="0" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Pièces</label>
                <input type="number" value={form.nb_pieces} onChange={(e) => setForm((f) => ({ ...f, nb_pieces: parseInt(e.target.value) || 1 }))} className="input-field" min="1" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Loyer HC (€)</label>
                <input type="number" value={form.loyer_hc} onChange={(e) => setForm((f) => ({ ...f, loyer_hc: parseFloat(e.target.value) || 0 }))} className="input-field" min="0" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Charges (€)</label>
                <input type="number" value={form.charges} onChange={(e) => setForm((f) => ({ ...f, charges: parseFloat(e.target.value) || 0 }))} className="input-field" min="0" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="input-field resize-none" />
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Annuler</button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Enregistrement…' : editing ? 'Modifier' : 'Créer le bien'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {biens.map((bien) => (
          <div key={bien.id} className={`card ${!bien.actif ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-bold text-foncia-navy">{bien.adresse}</p>
                <p className="text-sm text-gray-500">{bien.cp} {bien.ville}</p>
              </div>
              <span className={`badge ${bien.actif ? 'badge-green' : 'badge-gray'}`}>
                {bien.actif ? 'Actif' : 'Archivé'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center bg-foncia-bg rounded-lg p-3 mb-4">
              <div>
                <p className="font-bold text-foncia-navy">{bien.surface} m²</p>
                <p className="text-xs text-gray-500">Surface</p>
              </div>
              <div>
                <p className="font-bold text-foncia-navy">{bien.nb_pieces} pièces</p>
                <p className="text-xs text-gray-500">Composition</p>
              </div>
              <div>
                <p className="font-bold text-foncia-orange">{(bien.loyer_hc + bien.charges).toLocaleString('fr-FR')} €</p>
                <p className="text-xs text-gray-500">Loyer CC</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(bien)} className="btn-secondary text-sm py-1.5 flex-1">
                Modifier
              </button>
              <button onClick={() => toggleActif(bien)} className={`text-sm py-1.5 px-4 rounded-lg font-medium transition-colors ${bien.actif ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                {bien.actif ? 'Archiver' : 'Réactiver'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
