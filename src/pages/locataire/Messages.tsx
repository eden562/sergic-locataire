import { useEffect, useState, useRef } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import type { Message } from '../../types'

export default function LocataireMessages() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return
    loadMessages()

    const channel = supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `user_id=eq.${user.id}` }, (payload) => {
        setMessages((m) => [...m, payload.new as Message])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', user!.id)
      .order('date_envoi', { ascending: true })

    setMessages((data ?? []) as Message[])

    // Marquer comme lus
    await supabase
      .from('messages')
      .update({ lu: true })
      .eq('user_id', user!.id)
      .eq('lu', false)
      .eq('expediteur', 'admin')

    setLoading(false)
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim()) return
    setSending(true)
    await supabase.from('messages').insert({
      user_id: user!.id,
      expediteur: 'locataire',
      contenu: newMessage.trim(),
      date_envoi: new Date().toISOString(),
      lu: false,
    })
    setNewMessage('')
    setSending(false)
  }

  if (loading) return <div className="animate-pulse text-gray-400">Chargement…</div>

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader title="Messagerie" subtitle="Échangez avec votre gestionnaire Foncia" />

      <div className="card flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-4 p-2">
          {messages.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-3xl mb-2">💬</p>
              <p>Aucun message. Envoyez votre premier message !</p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.expediteur === 'locataire' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs sm:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.expediteur === 'locataire'
                    ? 'bg-foncia-blue text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}
              >
                {msg.expediteur === 'admin' && (
                  <p className="text-xs font-semibold text-foncia-orange mb-1">Foncia</p>
                )}
                <p>{msg.contenu}</p>
                <p className={`text-xs mt-1 ${msg.expediteur === 'locataire' ? 'text-white/60' : 'text-gray-400'}`}>
                  {new Date(msg.date_envoi).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="border-t border-gray-100 pt-4 mt-4 flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrivez votre message…"
            className="input-field flex-1"
          />
          <button type="submit" disabled={sending || !newMessage.trim()} className="btn-primary px-6">
            {sending ? '…' : '→'}
          </button>
        </form>
      </div>
    </div>
  )
}
