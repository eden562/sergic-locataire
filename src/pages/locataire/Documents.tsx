import { useEffect, useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { DocumentCard } from '../../components/DocumentCard'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import type { Document } from '../../types'

export default function LocataireDocuments() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('date_upload', { ascending: false })
      .then(({ data }) => {
        setDocuments((data ?? []) as Document[])
        setLoading(false)
      })
  }, [user])

  if (loading) return <div className="animate-pulse text-gray-400">Chargement…</div>

  const grouped = documents.reduce<Record<string, Document[]>>((acc, doc) => {
    const key = doc.type
    if (!acc[key]) acc[key] = []
    acc[key].push(doc)
    return acc
  }, {})

  const typeLabels: Record<string, string> = {
    bail: '📄 Bail',
    quittance: '🧾 Quittances',
    identite: '🪪 Identité',
    bulletin_salaire: '💼 Bulletins de salaire',
    avis_imposition: "📋 Avis d'imposition",
    justificatif_domicile: '🏠 Justificatifs',
    contrat_travail: '📝 Contrats',
    autre: '📎 Autres',
  }

  return (
    <div>
      <PageHeader title="Mes documents" subtitle="Tous vos documents Foncia" />

      {documents.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-5xl mb-4">📂</p>
          <p className="text-gray-500">Aucun document disponible.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([type, docs]) => (
            <div key={type}>
              <h2 className="font-bold text-foncia-navy mb-3">
                {typeLabels[type] ?? type}
              </h2>
              <div className="space-y-3">
                {docs.map((doc) => (
                  <DocumentCard key={doc.id} document={doc} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
