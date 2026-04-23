import type { Demande, StatutDemande } from '../types'

const statutConfig: Record<StatutDemande, { label: string; badge: string }> = {
  ouvert: { label: 'Ouvert', badge: 'badge-blue' },
  en_cours: { label: 'En cours', badge: 'badge-orange' },
  resolu: { label: 'Résolu', badge: 'badge-green' },
  ferme: { label: 'Fermé', badge: 'badge-gray' },
}

const categorieIcons: Record<string, string> = {
  reparation: '🔧',
  plomberie: '🚿',
  electricite: '⚡',
  serrurerie: '🔑',
  autre: '📌',
}

interface DemandeItemProps {
  demande: Demande
  onStatusChange?: (id: string, statut: StatutDemande) => void
  onClick?: (demande: Demande) => void
}

export function DemandeItem({ demande, onStatusChange, onClick }: DemandeItemProps) {
  const { label, badge } = statutConfig[demande.statut]

  return (
    <div
      className={`card hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      onClick={() => onClick?.(demande)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-2xl mt-0.5">{categorieIcons[demande.categorie]}</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foncia-navy truncate">{demande.titre}</p>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{demande.description}</p>
            <p className="text-xs text-gray-400 mt-2">
              {new Date(demande.date_creation).toLocaleDateString('fr-FR')}
              {demande.date_resolution && (
                <> · Résolu le {new Date(demande.date_resolution).toLocaleDateString('fr-FR')}</>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className={`badge ${badge}`}>{label}</span>
          {onStatusChange && demande.statut !== 'resolu' && demande.statut !== 'ferme' && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onStatusChange(
                  demande.id,
                  demande.statut === 'ouvert' ? 'en_cours' : 'resolu'
                )
              }}
              className="text-xs text-foncia-blue hover:underline"
            >
              {demande.statut === 'ouvert' ? 'Prendre en charge' : 'Marquer résolu'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
