import { useState } from 'react'
import { FonciaLogo } from '../../components/FonciaLogo'
import { supabase, uploadFile } from '../../lib/supabase'

type Situation = 'salarie' | 'independant' | 'fonctionnaire' | 'retraite' | 'etudiant' | 'sans_emploi'
type TypeContrat = 'cdi' | 'cdd' | 'interim' | 'independant' | 'fonctionnaire' | 'retraite' | 'autre'

interface FormData {
  // Étape 1
  nom: string
  prenom: string
  date_naissance: string
  email: string
  telephone: string
  situation: Situation | ''
  // Étape 2
  revenus: string
  type_contrat: TypeContrat | ''
  employeur: string
  // Étape 3 — fichiers
  doc_identite: File | null
  doc_salaire1: File | null
  doc_salaire2: File | null
  doc_salaire3: File | null
  doc_impots: File | null
  doc_domicile: File | null
  doc_contrat: File | null
  // Étape 4 — garant
  has_garant: boolean
  garant_nom: string
  garant_prenom: string
  garant_email: string
  garant_revenus: string
  garant_doc_identite: File | null
  garant_doc_salaire: File | null
}

const INITIAL: FormData = {
  nom: '', prenom: '', date_naissance: '', email: '', telephone: '', situation: '',
  revenus: '', type_contrat: '', employeur: '',
  doc_identite: null, doc_salaire1: null, doc_salaire2: null, doc_salaire3: null,
  doc_impots: null, doc_domicile: null, doc_contrat: null,
  has_garant: false,
  garant_nom: '', garant_prenom: '', garant_email: '', garant_revenus: '',
  garant_doc_identite: null, garant_doc_salaire: null,
}

const STEPS = [
  { id: 1, label: 'Identité', icon: '👤' },
  { id: 2, label: 'Finances', icon: '💶' },
  { id: 3, label: 'Documents', icon: '📎' },
  { id: 4, label: 'Garant', icon: '🤝' },
]

function FileInput({
  label, required, file, onChange,
}: {
  label: string
  required?: boolean
  file: File | null
  onChange: (f: File | null) => void
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className={`drop-zone ${file ? 'border-green-400 bg-green-50' : ''}`}>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          style={{ position: 'absolute' }}
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
        <div className="relative pointer-events-none">
          {file ? (
            <div className="flex items-center justify-center gap-2 text-green-700">
              <span className="text-xl">✅</span>
              <span className="text-sm font-medium truncate max-w-xs">{file.name}</span>
            </div>
          ) : (
            <div className="text-gray-400">
              <p className="text-2xl mb-1">📁</p>
              <p className="text-sm">Cliquez ou glissez un fichier ici</p>
              <p className="text-xs">PDF, JPG, PNG — max 10 Mo</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CandidatFormulaire() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(INITIAL)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')


  function update(key: keyof FormData, value: unknown) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function isStep1Valid() {
    return form.nom && form.prenom && form.date_naissance && form.email && form.telephone && form.situation
  }

  function isStep2Valid() {
    return form.revenus && form.type_contrat
  }

  function isStep3Valid() {
    return form.doc_identite && form.doc_salaire1 && form.doc_domicile
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError('')

    try {
      const docsUrls: string[] = []
      const docs = [
        { file: form.doc_identite, name: 'identite' },
        { file: form.doc_salaire1, name: 'salaire1' },
        { file: form.doc_salaire2, name: 'salaire2' },
        { file: form.doc_salaire3, name: 'salaire3' },
        { file: form.doc_impots, name: 'impots' },
        { file: form.doc_domicile, name: 'domicile' },
        { file: form.doc_contrat, name: 'contrat' },
        { file: form.garant_doc_identite, name: 'garant_identite' },
        { file: form.garant_doc_salaire, name: 'garant_salaire' },
      ]

      for (const doc of docs) {
        if (doc.file) {
          const path = `candidatures/${form.email}/${doc.name}_${Date.now()}_${doc.file.name}`
          const url = await uploadFile('documents', path, doc.file)
          if (url) docsUrls.push(url)
        }
      }

      const { error: insertError } = await supabase.from('candidatures').insert({
        logement_id: null,
        nom: form.nom.toUpperCase(),
        prenom: form.prenom,
        email: form.email,
        telephone: form.telephone,
        date_naissance: form.date_naissance,
        situation: form.situation,
        revenus: parseFloat(form.revenus),
        type_contrat: form.type_contrat,
        employeur: form.employeur,
        statut: docsUrls.length >= 3 ? 'en_analyse' : 'incomplet',
        ordre_priorite: 999,
        garant_nom: form.has_garant ? form.garant_nom : null,
        garant_prenom: form.has_garant ? form.garant_prenom : null,
        garant_email: form.has_garant ? form.garant_email : null,
        garant_revenus: form.has_garant && form.garant_revenus ? parseFloat(form.garant_revenus) : null,
        documents_urls: docsUrls,
      })

      if (insertError) throw insertError

      // Déclencher email de confirmation via edge function
      await supabase.functions.invoke('send-email', {
        body: {
          to: form.email,
          templateKey: 'confirmation_reception',
          variables: {
            prénom: form.prenom,
            nom: form.nom,
            nom_agence: 'Foncia',
          },
        },
      })

      setSubmitted(true)
    } catch (err) {
      console.error(err)
      setError("Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-foncia-bg flex items-center justify-center p-4">
        <div className="w-full max-w-lg card text-center py-12">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-foncia-navy mb-3">
            Dossier envoyé !
          </h1>
          <p className="text-gray-600 mb-2">
            Merci <strong>{form.prenom} {form.nom}</strong>,<br />
            votre dossier de candidature a bien été reçu.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Un email de confirmation a été envoyé à <strong>{form.email}</strong>.<br />
            Nous reviendrons vers vous dans les meilleurs délais.
          </p>
          <a href="/" className="btn-primary inline-block">
            Retour à l'accueil
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-foncia-bg">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <FonciaLogo size="md" />
          <div className="text-right">
            <p className="text-sm font-medium text-foncia-navy">Dossier de candidature</p>
            <p className="text-xs text-gray-500">Étape {step} sur 4</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Stepper */}
        <div className="flex items-center mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step === s.id
                      ? 'step-active shadow-lg shadow-foncia-blue/30'
                      : step > s.id
                      ? 'step-done'
                      : 'step-pending'
                  }`}
                >
                  {step > s.id ? '✓' : s.icon}
                </div>
                <span className="text-xs text-gray-500 mt-1 hidden sm:block">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 transition-all ${
                    step > s.id ? 'bg-green-400' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="card">
          {/* ÉTAPE 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-foncia-navy">Informations personnelles</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.prenom}
                    onChange={(e) => update('prenom', e.target.value)}
                    className="input-field"
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.nom}
                    onChange={(e) => update('nom', e.target.value)}
                    className="input-field"
                    placeholder="DUPONT"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de naissance <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.date_naissance}
                  onChange={(e) => update('date_naissance', e.target.value)}
                  className="input-field"
                  max={new Date(Date.now() - 18 * 365.25 * 86400000).toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  className="input-field"
                  placeholder="jean.dupont@email.fr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={form.telephone}
                  onChange={(e) => update('telephone', e.target.value)}
                  className="input-field"
                  placeholder="06 12 34 56 78"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Situation professionnelle <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.situation}
                  onChange={(e) => update('situation', e.target.value)}
                  className="input-field"
                >
                  <option value="">Sélectionner…</option>
                  <option value="salarie">Salarié(e)</option>
                  <option value="independant">Indépendant(e) / Freelance</option>
                  <option value="fonctionnaire">Fonctionnaire</option>
                  <option value="retraite">Retraité(e)</option>
                  <option value="etudiant">Étudiant(e)</option>
                  <option value="sans_emploi">Sans emploi</option>
                </select>
              </div>
            </div>
          )}

          {/* ÉTAPE 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-foncia-navy">Situation financière</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Revenus mensuels nets (€) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={form.revenus}
                  onChange={(e) => update('revenus', e.target.value)}
                  className="input-field"
                  placeholder="2 500"
                  min="0"
                  step="50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de contrat <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.type_contrat}
                  onChange={(e) => update('type_contrat', e.target.value)}
                  className="input-field"
                >
                  <option value="">Sélectionner…</option>
                  <option value="cdi">CDI</option>
                  <option value="cdd">CDD</option>
                  <option value="interim">Intérim</option>
                  <option value="independant">Indépendant / Auto-entrepreneur</option>
                  <option value="fonctionnaire">Fonctionnaire</option>
                  <option value="retraite">Retraite</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employeur / Entreprise
                </label>
                <input
                  type="text"
                  value={form.employeur}
                  onChange={(e) => update('employeur', e.target.value)}
                  className="input-field"
                  placeholder="Nom de l'entreprise"
                />
              </div>

              {form.revenus && (
                <div className="bg-foncia-bg rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    Taux d'effort indicatif :
                    <strong className="text-foncia-navy ml-1">
                      {/* Loyer fictif pour illustration */}
                      basé sur vos revenus déclarés
                    </strong>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Les revenus doivent généralement représenter 3× le loyer mensuel.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ÉTAPE 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-foncia-navy">Pièces justificatives</h2>
              <p className="text-sm text-gray-500">
                Formats acceptés : PDF, JPG, PNG. Taille max : 10 Mo par fichier.
              </p>

              <div className="relative">
                <FileInput
                  label="Pièce d'identité"
                  required
                  file={form.doc_identite}
                  onChange={(f) => update('doc_identite', f)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="relative">
                  <FileInput
                    label="Bulletin de salaire (mois 1)"
                    required
                    file={form.doc_salaire1}
                    onChange={(f) => update('doc_salaire1', f)}
                  />
                </div>
                <div className="relative">
                  <FileInput
                    label="Bulletin de salaire (mois 2)"
                    file={form.doc_salaire2}
                    onChange={(f) => update('doc_salaire2', f)}
                  />
                </div>
                <div className="relative">
                  <FileInput
                    label="Bulletin de salaire (mois 3)"
                    file={form.doc_salaire3}
                    onChange={(f) => update('doc_salaire3', f)}
                  />
                </div>
              </div>

              <div className="relative">
                <FileInput
                  label="Avis d'imposition"
                  file={form.doc_impots}
                  onChange={(f) => update('doc_impots', f)}
                />
              </div>

              <div className="relative">
                <FileInput
                  label="Justificatif de domicile"
                  required
                  file={form.doc_domicile}
                  onChange={(f) => update('doc_domicile', f)}
                />
              </div>

              <div className="relative">
                <FileInput
                  label="Contrat de travail"
                  file={form.doc_contrat}
                  onChange={(f) => update('doc_contrat', f)}
                />
              </div>

              {!isStep3Valid() && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                  Documents obligatoires : pièce d'identité, au moins un bulletin de salaire, justificatif de domicile.
                </div>
              )}
            </div>
          )}

          {/* ÉTAPE 4 */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-foncia-navy">Garant (optionnel)</h2>
              <p className="text-sm text-gray-500">
                Un garant peut renforcer votre dossier. Cette étape est facultative.
              </p>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="has_garant"
                  checked={form.has_garant}
                  onChange={(e) => update('has_garant', e.target.checked)}
                  className="w-4 h-4 accent-foncia-blue"
                />
                <label htmlFor="has_garant" className="text-sm font-medium text-gray-700 cursor-pointer">
                  J'ai un garant à présenter
                </label>
              </div>

              {form.has_garant && (
                <div className="space-y-4 pt-2 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                      <input
                        type="text"
                        value={form.garant_prenom}
                        onChange={(e) => update('garant_prenom', e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                      <input
                        type="text"
                        value={form.garant_nom}
                        onChange={(e) => update('garant_nom', e.target.value)}
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email du garant</label>
                    <input
                      type="email"
                      value={form.garant_email}
                      onChange={(e) => update('garant_email', e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Revenus mensuels nets (€)</label>
                    <input
                      type="number"
                      value={form.garant_revenus}
                      onChange={(e) => update('garant_revenus', e.target.value)}
                      className="input-field"
                      min="0"
                    />
                  </div>

                  <div className="relative">
                    <FileInput
                      label="Pièce d'identité du garant"
                      file={form.garant_doc_identite}
                      onChange={(f) => update('garant_doc_identite', f)}
                    />
                  </div>
                  <div className="relative">
                    <FileInput
                      label="Justificatif de revenus du garant"
                      file={form.garant_doc_salaire}
                      onChange={(f) => update('garant_doc_salaire', f)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
            {step > 1 ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="btn-secondary"
              >
                ← Précédent
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={
                  (step === 1 && !isStep1Valid()) ||
                  (step === 2 && !isStep2Valid()) ||
                  (step === 3 && !isStep3Valid())
                }
                className="btn-primary"
              >
                Suivant →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-orange"
              >
                {submitting ? 'Envoi en cours…' : '📤 Envoyer mon dossier'}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
