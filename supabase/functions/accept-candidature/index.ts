import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { candidature_id, email, prenom, nom, adresse_bien } = await req.json()

    // 1. Créer le compte auth ou récupérer l'existant
    let userId: string | undefined

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { prenom, nom },
    })

    if (authError) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()
      userId = existing?.id
    } else {
      userId = authData?.user?.id
    }

    // 2. Créer/mettre à jour le profil locataire
    if (userId) {
      await supabase.from('users').upsert({
        id: userId,
        email,
        prenom,
        nom,
        role: 'locataire',
      }, { onConflict: 'id' })
    }

    // 3. Mettre à jour le statut de la candidature
    await supabase
      .from('candidatures')
      .update({ statut: 'accepte' })
      .eq('id', candidature_id)

    // 4. Générer le lien de set-password
    let lien = `${Deno.env.get('SITE_URL') ?? ''}/set-password`
    try {
      const { data: linkData } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email,
      })
      if (linkData?.properties?.action_link) {
        lien = linkData.properties.action_link.replace('/auth/v1/verify', '/set-password')
      }
    } catch (_) { /* lien par défaut */ }

    // 5. Envoyer les emails (non bloquant)
    try {
      const [{ data: tmpl1 }, { data: tmpl2 }] = await Promise.all([
        supabase.from('email_templates').select('*').eq('cle', 'acceptation_candidature').single(),
        supabase.from('email_templates').select('*').eq('cle', 'ouverture_espace_locataire').single(),
      ])

      const vars: Record<string, string> = {
        prénom: prenom, nom, adresse_bien: adresse_bien ?? '',
        nom_agence: 'Foncia', lien_connexion: lien,
      }

      function interpolate(text: string) {
        return text.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`)
      }

      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
      for (const tmpl of [tmpl1, tmpl2]) {
        if (!tmpl) continue
        if (RESEND_API_KEY) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Foncia <noreply@foncia-locataire.fr>',
              to: [email],
              subject: interpolate(tmpl.objet),
              html: interpolate(tmpl.contenu),
            }),
          })
        } else {
          console.log(`[EMAIL MOCK] To: ${email} | Subject: ${interpolate(tmpl.objet)}`)
        }
      }
    } catch (emailErr) {
      console.error('Email sending failed (non-fatal):', emailErr)
    }

    return new Response(
      JSON.stringify({ success: true, userId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('accept-candidature error:', err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
