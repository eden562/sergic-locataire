import { useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export default function LocataireProfil() {
  const { user, updatePassword } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    prenom: user?.prenom ?? '',
    nom: user?.nom ?? '',
    telephone: user?.telephone ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  async function handleSave() {
    setSaving(true)
    await supabase
      .from('users')
      .update({ prenom: form.prenom, nom: form.nom, telephone: form.telephone })
      .eq('id', user!.id)
    setSaving(false)
    setSaved(true)
    setEditing(false)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (pwForm.new !== pwForm.confirm) {
      setPwError('Les mots de passe ne correspondent pas.')
      return
    }
    if (pwForm.new.length < 8) {
      setPwError('Minimum 8 caractères.')
      return
    }
    setPwError('')
    try {
      await updatePassword(pwForm.new)
      setPwSuccess(true)
      setPwForm({ current: '', new: '', confirm: '' })
      setTimeout(() => setPwSuccess(false), 3000)
    } catch {
      setPwError('Erreur lors du changement de mot de passe.')
    }
  }

  return (
    <div>
      <PageHeader title="Mon profil" subtitle="Gérez vos informations personnelles" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-foncia-navy">Informations personnelles</h2>
            <button
              onClick={() => setEditing(!editing)}
              className="text-sm text-foncia-blue hover:underline"
            >
              {editing ? 'Annuler' : 'Modifier'}
            </button>
          </div>

          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Prénom</label>
                  <input
                    type="text"
                    value={form.prenom}
                    onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Nom</label>
                  <input
                    type="text"
                    value={form.nom}
                    onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={form.telephone}
                  onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
                  className="input-field"
                />
              </div>
              <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
                {saving ? 'Enregistrement…' : saved ? '✓ Enregistré' : 'Enregistrer'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Prénom', value: user?.prenom },
                { label: 'Nom', value: user?.nom },
                { label: 'Email', value: user?.email },
                { label: 'Téléphone', value: user?.telephone },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-medium text-foncia-navy">{value ?? '—'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="font-bold text-foncia-navy mb-4">Changer le mot de passe</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nouveau mot de passe</label>
              <input
                type="password"
                value={pwForm.new}
                onChange={(e) => setPwForm((f) => ({ ...f, new: e.target.value }))}
                required
                minLength={8}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Confirmer</label>
              <input
                type="password"
                value={pwForm.confirm}
                onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                required
                className="input-field"
              />
            </div>
            {pwError && (
              <p className="text-red-600 text-sm">{pwError}</p>
            )}
            {pwSuccess && (
              <p className="text-green-600 text-sm">✓ Mot de passe mis à jour !</p>
            )}
            <button type="submit" className="btn-primary w-full">
              Changer le mot de passe
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
