import { useEffect, useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { supabase } from '../../lib/supabase'
import type { User, Bail } from '../../types'

interface LocataireWithBail extends User {
  bail?: Bail & { logement?: { adresse: string; ville: string } }
}

export default function AdminLocataires() {
  const [locataires, setLocataires] = useState<LocataireWithBail[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'locataire')
      .order('nom')

    if (!users) { setLoading(false); return }

    const { data: bails } = await supabase
      .from('baux')
      .select('*, logement:logements(adresse, ville)')
      .in('user_id', users.map((u) => u.id))
      .in('statut_signature', ['en_attente', 'signe'])

    const bailMap = new Map((bails ?? []).map((b) => [b.user_id, b]))

    setLocataires(
      users.map((u) => ({ ...u, bail: bailMap.get(u.id) })) as LocataireWithBail[]
    )
    setLoading(false)
  }

  async function suspendre(id: string, currentRole: string) {
    const newRole = currentRole === 'locataire' ? 'suspendu' : 'locataire'
    await supabase.from('users').update({ role: newRole }).eq('id', id)
    setLocataires((prev) => prev.map((l) => l.id === id ? { ...l, role: newRole as 'locataire' } : l))
  }

  const filtered = locataires.filter((l) => {
    const q = search.toLowerCase()
    return (
      l.nom.toLowerCase().includes(q) ||
      l.prenom.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q)
    )
  })

  if (loading) return <div className="animate-pulse text-gray-400">Chargement…</div>

  return (
    <div>
      <PageHeader
        title="Locataires"
        subtitle={`${locataires.length} locataire(s) actif(s)`}
      />

      <div className="card mb-6">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un locataire…"
          className="input-field"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((loc) => (
          <div key={loc.id} className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-sergic-blue flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {loc.prenom[0]}{loc.nom[0]}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sergic-navy">
                  {loc.prenom} {loc.nom}
                </p>
                {loc.bail?.statut_signature === 'en_attente' && (
                  <span className="badge badge-orange">⏳ Bail à signer</span>
                )}
                {loc.bail?.statut_signature === 'signe' && (
                  <span className="badge badge-green">✓ Bail signé</span>
                )}
              </div>
              <p className="text-sm text-gray-500">{loc.email} · {loc.telephone}</p>
              {loc.bail?.logement && (
                <p className="text-xs text-sergic-blue mt-0.5">
                  📍 {loc.bail.logement.adresse}, {loc.bail.logement.ville}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => suspendre(loc.id, loc.role)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  loc.role === 'locataire'
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {loc.role === 'locataire' ? 'Suspendre' : 'Réactiver'}
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-gray-400">Aucun locataire trouvé.</p>
          </div>
        )}
      </div>
    </div>
  )
}
