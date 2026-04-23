// Supabase Edge Function : envoi d'email générique avec template

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

function interpolate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`)
}

Deno.serve(async (req) => {
  const { to, templateKey, variables } = await req.json()

  const { data: tmpl } = await supabase
    .from('email_templates')
    .select('*')
    .eq('cle', templateKey)
    .single()

  if (!tmpl) {
    return new Response(JSON.stringify({ error: 'Template not found' }), { status: 404 })
  }

  const vars = { nom_agence: 'Foncia', ...variables }
  const subject = interpolate(tmpl.objet, vars)
  const html = `<div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
    <div style="border-bottom: 3px solid #e8610a; padding-bottom: 16px; margin-bottom: 24px;">
      <span style="font-size: 24px; font-weight: bold; color: #1a3a6e; letter-spacing: 0.15em;">FONCIA</span>
    </div>
    <div style="white-space: pre-wrap; color: #374151; line-height: 1.6;">
      ${interpolate(tmpl.contenu, vars)}
    </div>
    <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px;">
      © Foncia Gérance · Ce message est confidentiel.
    </div>
  </div>`

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  if (!RESEND_API_KEY) {
    console.log(`[EMAIL MOCK] To: ${to}\nSubject: ${subject}`)
    return new Response(JSON.stringify({ success: true, mock: true }))
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Foncia <noreply@foncia-locataire.fr>',
      to: [to],
      subject,
      html,
    }),
  })

  const data = await res.json()
  return new Response(JSON.stringify({ success: res.ok, data }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
