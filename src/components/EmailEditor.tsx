import { useState } from 'react'
import type { EmailTemplate } from '../types'

const VARIABLE_LIST = [
  '{prénom}', '{nom}', '{adresse_bien}', '{montant_loyer}',
  '{date_echeance}', '{nom_agence}', '{lien_connexion}',
  '{date_signature}', '{numero_dossier}',
]

interface EmailEditorProps {
  template: EmailTemplate
  onSave: (updated: Partial<EmailTemplate>) => Promise<void>
}

export function EmailEditor({ template, onSave }: EmailEditorProps) {
  const [objet, setObjet] = useState(template.objet)
  const [contenu, setContenu] = useState(template.contenu)
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const previewContent = contenu
    .replace(/{prénom}/g, 'Jean')
    .replace(/{nom}/g, 'DUPONT')
    .replace(/{adresse_bien}/g, '12 rue de la Paix, 75001 Paris')
    .replace(/{montant_loyer}/g, '850')
    .replace(/{date_echeance}/g, '01/06/2026')
    .replace(/{nom_agence}/g, 'Foncia Paris 1er')
    .replace(/{lien_connexion}/g, 'https://foncia-locataire.fr/set-password?token=xxx')
    .replace(/{date_signature}/g, '15/04/2026')
    .replace(/{numero_dossier}/g, 'DOS-2026-0042')

  async function handleSave() {
    setSaving(true)
    await onSave({ objet, contenu })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function insertVariable(v: string) {
    setContenu((c) => c + v)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Objet de l'email
        </label>
        <input
          type="text"
          value={objet}
          onChange={(e) => setObjet(e.target.value)}
          className="input-field"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Contenu
          </label>
          <button
            onClick={() => setPreview(!preview)}
            className="text-sm text-foncia-blue hover:underline"
          >
            {preview ? 'Éditer' : 'Aperçu'}
          </button>
        </div>

        {preview ? (
          <div className="border border-gray-200 rounded-lg p-4 bg-white min-h-[200px]">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Objet : {objet.replace(/{prénom}/g, 'Jean').replace(/{nom}/g, 'DUPONT')}
            </p>
            <hr className="mb-3" />
            <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
              {previewContent}
            </div>
          </div>
        ) : (
          <textarea
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
            rows={10}
            className="input-field resize-none font-mono text-sm"
          />
        )}
      </div>

      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">
          Variables disponibles (cliquer pour insérer) :
        </p>
        <div className="flex flex-wrap gap-2">
          {VARIABLE_LIST.map((v) => (
            <button
              key={v}
              onClick={() => insertVariable(v)}
              className="text-xs bg-foncia-bg text-foncia-navy px-2 py-1 rounded font-mono hover:bg-blue-100 transition-colors"
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={() => {
            setObjet(template.objet)
            setContenu(template.contenu)
          }}
          className="btn-secondary text-sm py-2"
        >
          Annuler
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary text-sm py-2"
        >
          {saving ? 'Enregistrement…' : saved ? '✓ Enregistré' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}
