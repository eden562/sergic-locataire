import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FonciaLogo } from '../components/FonciaLogo'
import { useAuth } from '../hooks/useAuth'

export default function SetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const { updatePassword } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await updatePassword(password)
      setDone(true)
      setTimeout(() => navigate('/locataire/dashboard', { replace: true }), 2000)
    } catch {
      setError("Une erreur est survenue. Le lien est peut-être expiré.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-foncia-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <FonciaLogo size="lg" />
        </div>

        <div className="card">
          {done ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-xl font-bold text-foncia-navy mb-2">
                Mot de passe créé !
              </h2>
              <p className="text-gray-500 text-sm">
                Redirection vers votre espace locataire…
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-foncia-navy mb-1">
                Créez votre mot de passe
              </h1>
              <p className="text-sm text-gray-500 mb-6">
                Choisissez un mot de passe sécurisé pour accéder à votre espace locataire.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="input-field"
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmer le mot de passe
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    className="input-field"
                    autoComplete="new-password"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="text-xs text-gray-400">
                  Le mot de passe doit contenir au moins 8 caractères.
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3"
                >
                  {loading ? 'Création…' : 'Créer mon mot de passe'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
