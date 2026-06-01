import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SergicLogo } from '../components/SergicLogo'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, user, role } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user && role) {
      navigate(role === 'admin' ? '/admin' : '/locataire/dashboard', { replace: true })
    }
  }, [user, role, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
    } catch {
      setError('Email ou mot de passe incorrect.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-sergic-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <SergicLogo size="lg" />
        </div>

        <div className="card">
          <h1 className="text-xl font-bold text-sergic-navy mb-1">Connexion</h1>
          <p className="text-sm text-gray-500 mb-6">
            Accédez à votre espace personnel
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jean.dupont@email.fr"
                required
                className="input-field"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Première connexion ?{' '}
              <a href="/candidat" className="text-sergic-blue hover:underline font-medium">
                Déposer un dossier de candidature
              </a>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} Sergic Gérance · Tous droits réservés
        </p>
      </div>
    </div>
  )
}
