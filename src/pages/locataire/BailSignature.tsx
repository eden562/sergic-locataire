import { useEffect, useState } from 'react'
import { FonciaLogo } from '../../components/FonciaLogo'
import { SignatureBail } from '../../components/SignatureBail'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import type { Bail } from '../../types'

export default function BailSignaturePage() {
  const { user } = useAuth()
  const [bail, setBail] = useState<Bail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('baux')
      .select('*, logement:logements(*)')
      .eq('user_id', user.id)
      .eq('statut_signature', 'en_attente')
      .single()
      .then(({ data }) => {
        setBail(data as Bail)
        setLoading(false)
      })
  }, [user])

  async function handleSign(_code: string) {
    if (!bail) throw new Error('Bail introuvable')
    const { error } = await supabase
      .from('baux')
      .update({
        statut_signature: 'signe',
        date_signature: new Date().toISOString(),
      })
      .eq('id', bail.id)

    if (error) throw error

    // Notifier l'admin
    await supabase.functions.invoke('notify-admin-bail-signe', {
      body: { bail_id: bail.id, user_id: user!.id },
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-foncia-bg flex items-center justify-center">
        <div className="text-foncia-navy animate-pulse">Chargement…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-foncia-bg">
      <header className="bg-white border-b border-gray-200 px-6 py-4 mb-8">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <FonciaLogo size="md" />
          <div className="text-right">
            <p className="text-sm font-medium text-foncia-navy">Signature du bail</p>
            {bail?.logement && (
              <p className="text-xs text-gray-500">{bail.logement.adresse}</p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <div className="bg-foncia-orange-light border border-foncia-orange/30 rounded-xl p-4 mb-6 flex items-start gap-3">
          <span className="text-2xl">📋</span>
          <div>
            <p className="font-semibold text-foncia-navy">Action requise : signature du bail</p>
            <p className="text-sm text-gray-600 mt-1">
              Bienvenue, {user?.prenom} ! Avant d'accéder à votre espace locataire,
              vous devez lire et signer votre bail de location électroniquement.
            </p>
          </div>
        </div>

        <SignatureBail
          bailUrl={bail?.lien_bail_url}
          onSign={handleSign}
        />
      </main>
    </div>
  )
}
