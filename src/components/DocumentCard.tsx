import type { Document, TypeDocument } from '../types'

const typeIcons: Record<TypeDocument, string> = {
  identite: '🪪',
  bulletin_salaire: '💼',
  avis_imposition: '📋',
  justificatif_domicile: '🏠',
  contrat_travail: '📝',
  bail: '📄',
  quittance: '🧾',
  autre: '📎',
}

const typeLabels: Record<TypeDocument, string> = {
  identite: "Pièce d'identité",
  bulletin_salaire: 'Bulletin de salaire',
  avis_imposition: "Avis d'imposition",
  justificatif_domicile: 'Justificatif domicile',
  contrat_travail: 'Contrat de travail',
  bail: 'Bail',
  quittance: 'Quittance',
  autre: 'Autre',
}

interface DocumentCardProps {
  document: Document
  onDelete?: (id: string) => void
}

export function DocumentCard({ document, onDelete }: DocumentCardProps) {
  return (
    <div className="card flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-xl bg-sergic-bg flex items-center justify-center text-2xl flex-shrink-0">
        {typeIcons[document.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sergic-navy truncate">{document.nom}</p>
        <p className="text-xs text-gray-500">
          {typeLabels[document.type]} · {new Date(document.date_upload).toLocaleDateString('fr-FR')}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <a
          href={document.url}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-sergic-blue hover:underline font-medium"
        >
          Voir
        </a>
        {onDelete && (
          <button
            onClick={() => onDelete(document.id)}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Supprimer
          </button>
        )}
      </div>
    </div>
  )
}
