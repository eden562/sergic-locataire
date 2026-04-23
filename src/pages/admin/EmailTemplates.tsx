import { useEffect, useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { EmailEditor } from '../../components/EmailEditor'
import { supabase } from '../../lib/supabase'
import type { EmailTemplate, EmailTemplateCle } from '../../types'

const TEMPLATE_INFO: Record<EmailTemplateCle, { label: string; icon: string; desc: string }> = {
  confirmation_reception: {
    label: 'Confirmation de réception',
    icon: '📬',
    desc: 'Envoyé automatiquement dès qu\'un dossier est soumis.',
  },
  dossier_incomplet: {
    label: 'Dossier incomplet',
    icon: '⚠️',
    desc: 'Envoyé si des documents manquent dans le dossier.',
  },
  acceptation_candidature: {
    label: 'Acceptation de candidature',
    icon: '✅',
    desc: "Envoyé quand l'admin clique \"Accepter\" (email 1/2).",
  },
  ouverture_espace_locataire: {
    label: 'Ouverture espace locataire',
    icon: '🔑',
    desc: 'Contient le lien de création de mot de passe (email 2/2).',
  },
  rappel_bail_non_signe: {
    label: 'Rappel bail non signé',
    icon: '📋',
    desc: 'Envoyé automatiquement 48h après ouverture si bail non signé.',
  },
  quittance_disponible: {
    label: 'Quittance disponible',
    icon: '🧾',
    desc: 'Envoyé quand une nouvelle quittance est générée.',
  },
  rappel_echeance_loyer: {
    label: "Rappel d'échéance de loyer",
    icon: '💶',
    desc: "Envoyé quelques jours avant la date d'échéance.",
  },
}

const DEFAULT_TEMPLATES: Record<EmailTemplateCle, { objet: string; contenu: string }> = {
  confirmation_reception: {
    objet: 'Foncia — Votre dossier a bien été reçu',
    contenu: `Bonjour {prénom} {nom},\n\nNous accusons bonne réception de votre dossier de candidature pour le logement situé au {adresse_bien}.\n\nNotre équipe va l'étudier dans les meilleurs délais et reviendra vers vous sous 48 à 72 heures.\n\nCordialement,\nL'équipe {nom_agence}`,
  },
  dossier_incomplet: {
    objet: 'Foncia — Votre dossier est incomplet',
    contenu: `Bonjour {prénom} {nom},\n\nNous avons bien reçu votre dossier pour le logement au {adresse_bien}, mais il manque certains documents pour qu'il soit complet.\n\nMerci de compléter votre dossier en vous reconnectant sur notre site.\n\nCordialement,\nL'équipe {nom_agence}`,
  },
  acceptation_candidature: {
    objet: 'Foncia — Félicitations, votre candidature est acceptée !',
    contenu: `Bonjour {prénom} {nom},\n\nNous avons le plaisir de vous informer que votre dossier de candidature pour le logement situé au {adresse_bien} a été retenu.\n\nVous allez recevoir un second email pour accéder à votre espace locataire et signer votre bail.\n\nCordialement,\nL'équipe {nom_agence}`,
  },
  ouverture_espace_locataire: {
    objet: 'Foncia — Accédez à votre espace locataire',
    contenu: `Bonjour {prénom} {nom},\n\nVotre espace locataire pour le logement au {adresse_bien} est maintenant ouvert.\n\nPour y accéder et signer votre bail, cliquez sur le lien ci-dessous :\n{lien_connexion}\n\nCe lien est valable 48 heures. Une fois connecté, vous devrez lire et signer votre bail électroniquement avant d'accéder à votre espace complet.\n\nCordialement,\nL'équipe {nom_agence}`,
  },
  rappel_bail_non_signe: {
    objet: 'Foncia — Rappel : votre bail est en attente de signature',
    contenu: `Bonjour {prénom} {nom},\n\nNous vous rappelons que votre bail pour le logement au {adresse_bien} est toujours en attente de signature électronique.\n\nMerci de vous connecter à votre espace locataire pour finaliser la signature :\n{lien_connexion}\n\nCordialement,\nL'équipe {nom_agence}`,
  },
  quittance_disponible: {
    objet: 'Foncia — Votre quittance de loyer est disponible',
    contenu: `Bonjour {prénom} {nom},\n\nVotre quittance de loyer du mois de {date_echeance} pour le logement au {adresse_bien} est désormais disponible.\n\nVous pouvez la télécharger depuis votre espace locataire :\n{lien_connexion}\n\nCordialement,\nL'équipe {nom_agence}`,
  },
  rappel_echeance_loyer: {
    objet: 'Foncia — Rappel de votre échéance de loyer',
    contenu: `Bonjour {prénom} {nom},\n\nNous vous rappelons que votre loyer de {montant_loyer} € est dû le {date_echeance} pour le logement au {adresse_bien}.\n\nPour toute question, contactez-nous via votre espace locataire.\n\nCordialement,\nL'équipe {nom_agence}`,
  },
}

export default function AdminEmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selected, setSelected] = useState<EmailTemplateCle>('confirmation_reception')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadTemplates() }, [])

  async function loadTemplates() {
    const { data } = await supabase.from('email_templates').select('*')

    if (!data || data.length === 0) {
      // Initialiser les templates par défaut
      const defaults = Object.entries(DEFAULT_TEMPLATES).map(([cle, tmpl]) => ({
        cle,
        nom: TEMPLATE_INFO[cle as EmailTemplateCle].label,
        objet: tmpl.objet,
        contenu: tmpl.contenu,
        variables: ['{prénom}', '{nom}', '{adresse_bien}', '{nom_agence}', '{lien_connexion}'],
      }))
      await supabase.from('email_templates').insert(defaults)
      const { data: fresh } = await supabase.from('email_templates').select('*')
      setTemplates((fresh ?? []) as EmailTemplate[])
    } else {
      setTemplates(data as EmailTemplate[])
    }
    setLoading(false)
  }

  async function handleSave(cle: EmailTemplateCle, updated: Partial<EmailTemplate>) {
    await supabase
      .from('email_templates')
      .update({ ...updated, updated_at: new Date().toISOString() })
      .eq('cle', cle)
    setTemplates((prev) =>
      prev.map((t) => (t.cle === cle ? { ...t, ...updated } : t))
    )
  }

  const currentTemplate = templates.find((t) => t.cle === selected)

  if (loading) return <div className="animate-pulse text-gray-400">Chargement…</div>

  return (
    <div>
      <PageHeader
        title="Modèles d'emails"
        subtitle="Personnalisez tous les emails envoyés automatiquement"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des templates */}
        <div className="space-y-2">
          {(Object.keys(TEMPLATE_INFO) as EmailTemplateCle[]).map((cle) => {
            const info = TEMPLATE_INFO[cle]
            return (
              <button
                key={cle}
                onClick={() => setSelected(cle)}
                className={`w-full text-left p-4 rounded-xl transition-all ${
                  selected === cle
                    ? 'bg-foncia-blue text-white'
                    : 'bg-white hover:bg-gray-50 border border-gray-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">{info.icon}</span>
                  <div>
                    <p className={`font-medium text-sm ${selected === cle ? 'text-white' : 'text-foncia-navy'}`}>
                      {info.label}
                    </p>
                    <p className={`text-xs mt-0.5 ${selected === cle ? 'text-white/70' : 'text-gray-500'}`}>
                      {info.desc}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Éditeur */}
        <div className="lg:col-span-2 card">
          {currentTemplate ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">{TEMPLATE_INFO[selected].icon}</span>
                <div>
                  <h2 className="font-bold text-foncia-navy">{TEMPLATE_INFO[selected].label}</h2>
                  <p className="text-sm text-gray-500">{TEMPLATE_INFO[selected].desc}</p>
                </div>
              </div>
              <EmailEditor
                template={currentTemplate}
                onSave={(updated) => handleSave(selected, updated)}
              />
            </>
          ) : (
            <div className="text-center py-12 text-gray-400">
              Sélectionnez un modèle pour l'éditer.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
