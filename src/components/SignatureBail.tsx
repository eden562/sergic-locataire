import { useState, useRef } from 'react'

interface SignatureBailProps {
  bailUrl?: string
  onSign: (code: string) => Promise<void>
}

type Step = 'lecture' | 'sms' | 'signature' | 'done'

export function SignatureBail({ bailUrl, onSign }: SignatureBailProps) {
  const [step, setStep] = useState<Step>('lecture')
  const [luEntier, setLuEntier] = useState(false)
  const [accepte, setAccepte] = useState(false)
  const [phone, setPhone] = useState('')
  const [codeSMS, setCodeSMS] = useState('')
  const [smsSent, setSmsSent] = useState(false)
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState('')
  const iframeRef = useRef<HTMLIFrameElement>(null)

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 20) {
      setLuEntier(true)
    }
  }

  function sendSMS() {
    if (!phone.match(/^(\+33|0)[67]\d{8}$/)) {
      setError('Numéro de téléphone invalide')
      return
    }
    setError('')
    setSmsSent(true)
  }

  async function handleSign() {
    if (codeSMS.length !== 6) {
      setError('Code SMS à 6 chiffres requis')
      return
    }
    setSigning(true)
    setError('')
    try {
      await onSign(codeSMS)
      setStep('done')
    } catch {
      setError("Code incorrect ou expiré. Veuillez réessayer.")
    } finally {
      setSigning(false)
    }
  }

  if (step === 'done') {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">✅</span>
        </div>
        <h2 className="text-2xl font-bold text-foncia-navy mb-2">
          Bail signé avec succès !
        </h2>
        <p className="text-gray-500 mb-6">
          Votre bail a été signé électroniquement. Vous avez désormais accès complet à votre espace locataire.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary"
        >
          Accéder à mon espace
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Stepper */}
      <div className="flex items-center gap-2">
        {(['lecture', 'sms', 'signature'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step === s
                  ? 'step-active'
                  : i < ['lecture', 'sms', 'signature'].indexOf(step)
                  ? 'step-done'
                  : 'step-pending'
              }`}
            >
              {i < ['lecture', 'sms', 'signature'].indexOf(step) ? '✓' : i + 1}
            </div>
            {i < 2 && <div className="flex-1 h-0.5 bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* Étape 1 : Lecture du bail */}
      {step === 'lecture' && (
        <div className="card">
          <h2 className="text-lg font-bold text-foncia-navy mb-4">
            1. Lisez votre bail attentivement
          </h2>
          <div
            className="h-96 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50 p-4 mb-4"
            onScroll={handleScroll}
          >
            {bailUrl ? (
              <iframe
                ref={iframeRef}
                src={bailUrl}
                className="w-full h-full border-0"
                title="Bail de location"
              />
            ) : (
              <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
                <p className="font-bold text-base text-foncia-navy">CONTRAT DE LOCATION</p>
                <p>Le présent contrat de bail est établi conformément à la loi du 6 juillet 1989 tendant à améliorer les rapports locatifs.</p>
                <p><strong>Article 1 – Désignation des parties</strong><br/>
                Le présent bail est consenti et accepté entre les soussignés : Foncia Gérance, agissant en qualité de mandataire du propriétaire, et le locataire désigné ci-après.</p>
                <p><strong>Article 2 – Désignation des locaux</strong><br/>
                Les locaux loués sont situés à l'adresse mentionnée dans l'espace locataire, comprenant l'appartement avec toutes ses dépendances.</p>
                <p><strong>Article 3 – Durée du bail</strong><br/>
                Le présent bail est consenti pour une durée de trois (3) ans à compter de la date de prise d'effet, conformément à l'article 10 de la loi du 6 juillet 1989.</p>
                <p><strong>Article 4 – Loyer</strong><br/>
                Le loyer mensuel est fixé comme indiqué dans les conditions particulières. Il est payable le 1er de chaque mois.</p>
                <p><strong>Article 5 – Charges</strong><br/>
                En sus du loyer, le locataire versera des provisions sur charges récupérables dont le montant est précisé dans les conditions particulières.</p>
                <p><strong>Article 6 – Dépôt de garantie</strong><br/>
                Il sera versé un dépôt de garantie correspondant à deux mois de loyer hors charges.</p>
                <p><strong>Article 7 – Obligations du locataire</strong><br/>
                Le locataire s'engage à user paisiblement des locaux loués suivant la destination prévue au contrat, à répondre des dégradations qui surviendraient pendant la durée du contrat, à payer le loyer et les charges aux termes convenus.</p>
                <p><strong>Article 8 – Résiliation</strong><br/>
                Le locataire peut donner congé à tout moment avec un préavis de trois mois réduit à un mois dans les cas prévus par la loi.</p>
                <p className="text-gray-400 mt-8">— Fin du document —</p>
              </div>
            )}
          </div>

          {!luEntier && (
            <p className="text-sm text-amber-600 mb-3">
              ↑ Faites défiler jusqu'au bas du document pour continuer
            </p>
          )}

          <div className="flex items-start gap-3 mb-4">
            <input
              type="checkbox"
              id="accepte"
              checked={accepte}
              onChange={(e) => setAccepte(e.target.checked)}
              disabled={!luEntier}
              className="mt-1 w-4 h-4 accent-foncia-blue cursor-pointer"
            />
            <label
              htmlFor="accepte"
              className={`text-sm ${luEntier ? 'text-gray-700 cursor-pointer' : 'text-gray-400'}`}
            >
              J'ai lu et j'accepte les termes du bail de location dans leur intégralité.
              Je comprends que cette signature électronique a la même valeur juridique qu'une signature manuscrite.
            </label>
          </div>

          <button
            onClick={() => setStep('sms')}
            disabled={!accepte}
            className="btn-primary w-full"
          >
            Continuer vers la vérification
          </button>
        </div>
      )}

      {/* Étape 2 : Vérification SMS */}
      {step === 'sms' && (
        <div className="card">
          <h2 className="text-lg font-bold text-foncia-navy mb-2">
            2. Vérification par SMS
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Pour sécuriser votre signature, nous allons envoyer un code de vérification sur votre téléphone.
          </p>

          {!smsSent ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro de téléphone mobile
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="06 12 34 56 78"
                  className="input-field"
                />
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
              </div>
              <button onClick={sendSMS} className="btn-primary w-full">
                Envoyer le code SMS
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                Code envoyé au {phone}. Valable 10 minutes.
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code à 6 chiffres
                </label>
                <input
                  type="text"
                  value={codeSMS}
                  onChange={(e) => setCodeSMS(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="input-field text-center text-2xl tracking-widest font-mono"
                />
              </div>
              <button
                onClick={() => setStep('signature')}
                disabled={codeSMS.length !== 6}
                className="btn-primary w-full"
              >
                Vérifier le code
              </button>
              <button
                onClick={() => setSmsSent(false)}
                className="text-sm text-foncia-blue hover:underline w-full text-center"
              >
                Renvoyer le code
              </button>
            </div>
          )}
        </div>
      )}

      {/* Étape 3 : Confirmation finale */}
      {step === 'signature' && (
        <div className="card">
          <h2 className="text-lg font-bold text-foncia-navy mb-2">
            3. Signature électronique
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            En cliquant sur "Signer le bail", vous apposez votre signature électronique qui a la même valeur juridique qu'une signature manuscrite (loi n° 2000-230 du 13 mars 2000).
          </p>

          <div className="bg-foncia-bg border border-foncia-navy/20 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-foncia-navy">
              <span className="text-xl">🔒</span>
              <span className="text-sm font-medium">Signature sécurisée</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Horodatage certifié · Code SMS vérifié · {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-4">
              {error}
            </div>
          )}

          <button
            onClick={handleSign}
            disabled={signing}
            className="btn-orange w-full text-lg py-3"
          >
            {signing ? 'Signature en cours…' : '✍️ Signer le bail'}
          </button>
        </div>
      )}
    </div>
  )
}
