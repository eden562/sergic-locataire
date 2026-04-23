// Supabase Edge Function : notification admin quand bail signé

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  const { bail_id, user_id } = await req.json()

  const [{ data: bail }, { data: user }] = await Promise.all([
    supabase.from('baux').select('*, logement:logements(adresse, ville)').eq('id', bail_id).single(),
    supabase.from('users').select('prenom, nom, email').eq('id', user_id).single(),
  ])

  // Récupérer les admins
  const { data: admins } = await supabase
    .from('users')
    .select('email')
    .eq('role', 'admin')

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  for (const admin of admins ?? []) {
    const html = `
      <div style="font-family: sans-serif; padding: 24px;">
        <h2 style="color: #1a3a6e;">✅ Bail signé</h2>
        <p><strong>${user?.prenom} ${user?.nom}</strong> vient de signer son bail électroniquement.</p>
        <p><strong>Logement :</strong> ${bail?.logement?.adresse}, ${bail?.logement?.ville}</p>
        <p><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
        <p><a href="${Deno.env.get('SITE_URL')}/admin/locataires" style="color: #e8610a;">→ Voir dans l'administration</a></p>
      </div>
    `

    if (RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Foncia <noreply@foncia-locataire.fr>',
          to: [admin.email],
          subject: `[Foncia] Bail signé — ${user?.prenom} ${user?.nom}`,
          html,
        }),
      })
    } else {
      console.log(`[MOCK] Bail signé notif to admin: ${admin.email}`)
    }
  }

  return new Response(JSON.stringify({ success: true }))
})
