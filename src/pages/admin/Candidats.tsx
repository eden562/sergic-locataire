import { useEffect, useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { PageHeader } from '../../components/PageHeader'
import { supabase } from '../../lib/supabase'
import type { Candidature, StatutCandidature, Logement } from '../../types'

const STATUT_BADGE: Record<StatutCandidature, string> = {
  incomplet: 'badge-gray',
  en_analyse: 'badge-blue',
  accepte: 'badge-green',
  refuse: 'badge-red',
  signe: 'badge-green',
}

const STATUT_LABEL: Record<StatutCandidature, string> = {
  incomplet: 'Incomplet',
  en_analyse: 'En analyse',
  accepte: 'Accepté',
  refuse: 'Refusé',
  signe: 'Signé',
}

const DOC_LABELS: Record<string, string> = {
  identite: "Pièce d'identité",
  salaire1: 'Bulletin de salaire (1)',
  salaire2: 'Bulletin de salaire (2)',
  salaire3: 'Bulletin de salaire (3)',
  impots: "Avis d'imposition",
  domicile: 'Justificatif de domicile',
  contrat: 'Contrat de travail',
  garant_identite: 'Garant — Pièce d\'identité',
  garant_salaire: 'Garant — Justificatif de revenus',
}

function docLabel(url: string): string {
  const filename = url.split('/').pop() ?? ''
  const key = Object.keys(DOC_LABELS).find((k) => filename.includes(k))
  return key ? DOC_LABELS[key] : filename.replace(/_\d+_/, ' — ')
}

function DocsPanel({ candidature, onClose }: { candidature: Candidature; onClose: () => void }) {
  const docs = candidature.documents_urls ?? []
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-sergic-navy text-lg">
              Dossier — {candidature.prenom} {candidature.nom}
            </h2>
            <p className="text-xs text-gray-400">{docs.length} document(s)</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
          {docs.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Aucun document déposé.</p>
          ) : (
            docs.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-sergic-blue hover:bg-sergic-bg transition-colors group"
              >
                <span className="text-2xl">📄</span>
                <span className="text-sm text-sergic-navy font-medium flex-1 group-hover:underline">
                  {docLabel(url)}
                </span>
                <span className="text-xs text-sergic-orange">Ouvrir →</span>
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function SortableRow({
  candidature,
  logements,
  onAccept,
  onRefuse,
  onAssignLogement,
  onViewDocs,
}: {
  candidature: Candidature
  logements: Logement[]
  onAccept: (c: Candidature) => void
  onRefuse: (id: string) => void
  onAssignLogement: (id: string, logementId: string | null) => void
  onViewDocs: (c: Candidature) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: candidature.id,
  })

  const style = { transform: CSS.Transform.toString(transform), transition }
  const canAct = !['accepte', 'refuse', 'signe'].includes(candidature.statut)

  return (
    <tr ref={setNodeRef} style={style} className="border-b border-gray-100 hover:bg-gray-50">
      <td className="px-4 py-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab text-gray-300 hover:text-gray-500 text-lg"
          title="Glisser pour réordonner"
        >
          ⠿
        </button>
      </td>
      <td className="px-4 py-3">
        <p className="font-medium text-sergic-navy">{candidature.prenom} {candidature.nom}</p>
        <p className="text-xs text-gray-500">{candidature.email}</p>
        <p className="text-xs text-gray-400">{candidature.telephone}</p>
      </td>
      <td className="px-4 py-3 text-sm font-medium text-sergic-navy">
        {candidature.revenus.toLocaleString('fr-FR')} €/mois
      </td>
      <td className="px-4 py-3 min-w-[200px]">
        {canAct ? (
          <select
            value={candidature.logement_id ?? ''}
            onChange={(e) => onAssignLogement(candidature.id, e.target.value || null)}
            className="input-field text-sm py-1.5"
          >
            <option value="">— Non assigné —</option>
            {logements.map((l) => (
              <option key={l.id} value={l.id}>
                {l.adresse}, {l.ville}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-sm text-gray-600">
            {logements.find((l) => l.id === candidature.logement_id)
              ? `${logements.find((l) => l.id === candidature.logement_id)!.adresse}, ${logements.find((l) => l.id === candidature.logement_id)!.ville}`
              : <span className="text-gray-400 italic">Non assigné</span>
            }
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <span className={`badge ${STATUT_BADGE[candidature.statut]}`}>
          {STATUT_LABEL[candidature.statut]}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-gray-400">
        {new Date(candidature.created_at).toLocaleDateString('fr-FR')}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => onViewDocs(candidature)}
            className="text-xs bg-sergic-bg text-sergic-blue hover:bg-blue-50 px-3 py-1.5 rounded-lg font-medium transition-colors text-left"
          >
            📎 Dossier ({candidature.documents_urls?.length ?? 0})
          </button>
          {canAct ? (
            <div className="flex gap-1.5">
              <button
                onClick={() => onAccept(candidature)}
                disabled={!candidature.logement_id}
                title={!candidature.logement_id ? "Assignez un bien d'abord" : ''}
                className="text-xs bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg font-medium transition-colors"
              >
                ✓ Accepter
              </button>
              <button
                onClick={() => onRefuse(candidature.id)}
                className="text-xs bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded-lg font-medium transition-colors"
              >
                ✗ Refuser
              </button>
            </div>
          ) : (
            <span className="text-xs text-gray-400 font-medium">
              {candidature.statut === 'accepte' && '✓ Accepté'}
              {candidature.statut === 'refuse' && '✗ Refusé'}
              {candidature.statut === 'signe' && '✍ Signé'}
            </span>
          )}
        </div>
      </td>
    </tr>
  )
}

export default function AdminCandidats() {
  const [candidatures, setCandidatures] = useState<Candidature[]>([])
  const [logements, setLogements] = useState<Logement[]>([])
  const [filterStatut, setFilterStatut] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [acceptError, setAcceptError] = useState('')
  const [viewingDocs, setViewingDocs] = useState<Candidature | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [{ data: c }, { data: l }] = await Promise.all([
      supabase.from('candidatures').select('*').order('ordre_priorite'),
      supabase.from('logements').select('*').eq('actif', true),
    ])
    setCandidatures((c ?? []) as Candidature[])
    setLogements((l ?? []) as Logement[])
    setLoading(false)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const filtered = displayed()
    const oldIndex = filtered.findIndex((c) => c.id === active.id)
    const newIndex = filtered.findIndex((c) => c.id === over.id)
    const reordered = arrayMove(filtered, oldIndex, newIndex)

    const updated = candidatures.map((c) => {
      const idx = reordered.findIndex((r) => r.id === c.id)
      return idx >= 0 ? { ...c, ordre_priorite: idx + 1 } : c
    })
    setCandidatures(updated)
    reordered.forEach((c, i) => {
      supabase.from('candidatures').update({ ordre_priorite: i + 1 }).eq('id', c.id)
    })
  }

  async function assignLogement(candidatureId: string, logementId: string | null) {
    await supabase.from('candidatures').update({ logement_id: logementId }).eq('id', candidatureId)
    setCandidatures((prev) =>
      prev.map((c) => c.id === candidatureId ? { ...c, logement_id: logementId } as Candidature : c)
    )
  }

  async function accepter(candidature: Candidature) {
    setProcessing(candidature.id)
    setAcceptError('')

    const logement = logements.find((l) => l.id === candidature.logement_id)
    const adresseBien = logement ? `${logement.adresse}, ${logement.ville}` : ''

    const { data, error } = await supabase.functions.invoke('accept-candidature', {
      body: {
        candidature_id: candidature.id,
        email: candidature.email,
        prenom: candidature.prenom,
        nom: candidature.nom,
        adresse_bien: adresseBien,
      },
    })

    if (error || data?.error) {
      setAcceptError(`Erreur : ${data?.error ?? error?.message ?? 'inconnue'}`)
      setProcessing(null)
      return
    }

    setCandidatures((prev) =>
      prev.map((c) => c.id === candidature.id ? { ...c, statut: 'accepte' } : c)
    )
    setProcessing(null)
  }

  async function refuser(id: string) {
    await supabase.from('candidatures').update({ statut: 'refuse' }).eq('id', id)
    setCandidatures((prev) => prev.map((c) => c.id === id ? { ...c, statut: 'refuse' } : c))
  }

  function displayed() {
    if (filterStatut === 'all') return candidatures
    return candidatures.filter((c) => c.statut === filterStatut)
  }

  const list = displayed()

  if (loading) return <div className="animate-pulse text-gray-400">Chargement…</div>

  return (
    <div>
      <PageHeader
        title="Candidatures"
        subtitle={`${candidatures.length} dossier(s) reçu(s)`}
      />

      <div className="card mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <label className="text-sm font-medium text-gray-700">Filtrer :</label>
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="input-field w-auto"
          >
            <option value="all">Tous les statuts</option>
            <option value="incomplet">Incomplet</option>
            <option value="en_analyse">En analyse</option>
            <option value="accepte">Accepté</option>
            <option value="refuse">Refusé</option>
            <option value="signe">Signé</option>
          </select>
          <span className="text-sm text-gray-500 ml-auto">{list.length} candidature(s)</span>
        </div>
      </div>

      <div className="card overflow-x-auto p-0">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <table className="w-full">
            <thead className="bg-sergic-bg">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-8">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Candidat</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Revenus</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Bien assigné</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <SortableContext items={list.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      Aucune candidature.
                    </td>
                  </tr>
                ) : (
                  list.map((c) => (
                    <SortableRow
                      key={c.id}
                      candidature={c}
                      logements={logements}
                      onAccept={accepter}
                      onRefuse={refuser}
                      onAssignLogement={assignLogement}
                      onViewDocs={setViewingDocs}
                    />
                  ))
                )}
              </tbody>
            </SortableContext>
          </table>
        </DndContext>
      </div>

      {viewingDocs && (
        <DocsPanel candidature={viewingDocs} onClose={() => setViewingDocs(null)} />
      )}

      {acceptError && (
        <div className="fixed bottom-6 right-6 bg-red-600 text-white px-5 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3">
          <span>{acceptError}</span>
          <button onClick={() => setAcceptError('')} className="font-bold text-lg leading-none">×</button>
        </div>
      )}

      {processing && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 text-center shadow-xl">
            <div className="text-3xl mb-3 animate-spin">⚙️</div>
            <p className="font-medium text-sergic-navy">Traitement en cours…</p>
            <p className="text-sm text-gray-500 mt-1">Création du compte et envoi des emails</p>
          </div>
        </div>
      )}
    </div>
  )
}
