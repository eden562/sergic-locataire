import { useEffect, useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { DocumentCard } from '../../components/DocumentCard'
import { supabase, uploadFile } from '../../lib/supabase'
import type { Document, TypeDocument, User } from '../../types'

export default function AdminDocuments() {
  const [locataires, setLocataires] = useState<User[]>([])
  const [selected, setSelected] = useState<string>('')
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [newDoc, setNewDoc] = useState<{ nom: string; type: TypeDocument; file: File | null }>({
    nom: '', type: 'autre', file: null,
  })

  useEffect(() => {
    supabase.from('users').select('*').eq('role', 'locataire').order('nom').then(({ data }) => {
      setLocataires((data ?? []) as User[])
    })
  }, [])

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    supabase
      .from('documents')
      .select('*')
      .eq('user_id', selected)
      .order('date_upload', { ascending: false })
      .then(({ data }) => {
        setDocuments((data ?? []) as Document[])
        setLoading(false)
      })
  }, [selected])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!newDoc.file || !selected) return
    setUploading(true)

    const path = `locataires/${selected}/${newDoc.type}_${Date.now()}_${newDoc.file.name}`
    const url = await uploadFile('documents', path, newDoc.file)

    if (url) {
      await supabase.from('documents').insert({
        user_id: selected,
        nom: newDoc.nom || newDoc.file.name,
        type: newDoc.type,
        url,
        date_upload: new Date().toISOString(),
        taille: newDoc.file.size,
      })
      setNewDoc({ nom: '', type: 'autre', file: null })
      // Recharger
      const { data } = await supabase.from('documents').select('*').eq('user_id', selected).order('date_upload', { ascending: false })
      setDocuments((data ?? []) as Document[])
    }
    setUploading(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('documents').delete().eq('id', id)
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }

  return (
    <div>
      <PageHeader title="Documents locataires" subtitle="Gérez les documents par locataire" />

      <div className="card mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Locataire</label>
            <select value={selected} onChange={(e) => setSelected(e.target.value)} className="input-field">
              <option value="">Sélectionner un locataire…</option>
              {locataires.map((l) => (
                <option key={l.id} value={l.id}>{l.prenom} {l.nom}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selected && (
        <>
          <div className="card mb-6">
            <h2 className="font-bold text-sergic-navy mb-4">Uploader un document</h2>
            <form onSubmit={handleUpload} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                <select value={newDoc.type} onChange={(e) => setNewDoc((f) => ({ ...f, type: e.target.value as TypeDocument }))} className="input-field">
                  <option value="bail">Bail</option>
                  <option value="quittance">Quittance</option>
                  <option value="identite">Pièce d'identité</option>
                  <option value="bulletin_salaire">Bulletin de salaire</option>
                  <option value="avis_imposition">Avis d'imposition</option>
                  <option value="justificatif_domicile">Justificatif domicile</option>
                  <option value="contrat_travail">Contrat de travail</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nom du document</label>
                <input type="text" value={newDoc.nom} onChange={(e) => setNewDoc((f) => ({ ...f, nom: e.target.value }))} className="input-field" placeholder="Optionnel" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Fichier *</label>
                <input
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setNewDoc((f) => ({ ...f, file: e.target.files?.[0] ?? null }))}
                  className="input-field text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-sergic-bg file:text-sergic-navy file:font-medium"
                />
              </div>
              <div className="sm:col-span-3 flex justify-end">
                <button type="submit" disabled={uploading || !newDoc.file} className="btn-primary">
                  {uploading ? 'Upload…' : '📤 Uploader'}
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="animate-pulse text-gray-400">Chargement…</div>
            ) : documents.length === 0 ? (
              <div className="card text-center py-8 text-gray-400">Aucun document pour ce locataire.</div>
            ) : (
              documents.map((doc) => (
                <DocumentCard key={doc.id} document={doc} onDelete={handleDelete} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
