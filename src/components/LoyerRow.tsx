import type { Loyer } from '../types'

const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

interface LoyerRowProps {
  loyer: Loyer
  onMarkPaid?: (id: string) => void
  showActions?: boolean
}

const statutBadge = {
  paye: 'badge-green',
  en_attente: 'badge-orange',
  retard: 'badge-red',
}

const statutLabel = {
  paye: 'Payé',
  en_attente: 'En attente',
  retard: 'Retard',
}

export function LoyerRow({ loyer, onMarkPaid, showActions = false }: LoyerRowProps) {
  const total = loyer.montant + (loyer.charges || 0)
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-foncia-bg flex items-center justify-center text-foncia-navy font-bold text-sm">
          {String(loyer.mois).padStart(2, '0')}
        </div>
        <div>
          <p className="font-medium text-foncia-navy">
            {MOIS[loyer.mois - 1]} {loyer.annee}
          </p>
          <p className="text-xs text-gray-500">
            {loyer.montant.toLocaleString('fr-FR')} € HC + {(loyer.charges || 0).toLocaleString('fr-FR')} € charges
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-semibold text-foncia-navy">
          {total.toLocaleString('fr-FR')} €
        </span>
        <span className={`badge ${statutBadge[loyer.statut]}`}>
          {statutLabel[loyer.statut]}
        </span>
        {showActions && loyer.statut !== 'paye' && onMarkPaid && (
          <button
            onClick={() => onMarkPaid(loyer.id)}
            className="text-xs btn-primary py-1 px-3"
          >
            Marquer payé
          </button>
        )}
        {loyer.date_paiement && (
          <span className="text-xs text-gray-400">
            {new Date(loyer.date_paiement).toLocaleDateString('fr-FR')}
          </span>
        )}
      </div>
    </div>
  )
}
