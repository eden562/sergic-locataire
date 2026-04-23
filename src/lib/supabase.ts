import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Variables Supabase manquantes. Copiez .env.example en .env et renseignez vos clés.'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
)

export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true })
  if (error) {
    console.error('Upload error:', error)
    return null
  }
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)
  return urlData.publicUrl
}

export async function sendEmail(
  to: string,
  templateKey: string,
  variables: Record<string, string>
): Promise<void> {
  await supabase.functions.invoke('send-email', {
    body: { to, templateKey, variables },
  })
}
