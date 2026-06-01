import { useEffect, useState, useRef } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { supabase } from '../../lib/supabase'
import type { Message, User } from '../../types'

interface Thread {
  user: User
  lastMessage: Message
  unread: number
}

export default function AdminMessages() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadThreads() }, [])

  useEffect(() => {
    if (!selected) return
    loadMessages(selected)

    const channel = supabase
      .channel(`admin-messages-${selected}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `user_id=eq.${selected}` }, (payload) => {
        setMessages((m) => [...m, payload.new as Message])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selected])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadThreads() {
    const { data: users } = await supabase.from('users').select('*').eq('role', 'locataire')
    if (!users) { setLoading(false); return }

    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .in('user_id', users.map((u) => u.id))
      .order('date_envoi', { ascending: false })

    const threadMap = new Map<string, Thread>()
    for (const user of users) {
      const userMsgs = (msgs ?? []).filter((m) => m.user_id === user.id)
      if (userMsgs.length > 0) {
        threadMap.set(user.id, {
          user: user as User,
          lastMessage: userMsgs[0] as Message,
          unread: userMsgs.filter((m) => !m.lu && m.expediteur === 'locataire').length,
        })
      }
    }
    setThreads(Array.from(threadMap.values()).sort((a, b) =>
      new Date(b.lastMessage.date_envoi).getTime() - new Date(a.lastMessage.date_envoi).getTime()
    ))
    setLoading(false)
  }

  async function loadMessages(userId: string) {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .order('date_envoi')
    setMessages((data ?? []) as Message[])

    await supabase
      .from('messages')
      .update({ lu: true })
      .eq('user_id', userId)
      .eq('expediteur', 'locataire')
      .eq('lu', false)

    setThreads((prev) => prev.map((t) => t.user.id === userId ? { ...t, unread: 0 } : t))
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!reply.trim() || !selected) return
    setSending(true)
    await supabase.from('messages').insert({
      user_id: selected,
      expediteur: 'admin',
      contenu: reply.trim(),
      date_envoi: new Date().toISOString(),
      lu: false,
    })
    setReply('')
    setSending(false)
    loadThreads()
  }

  const selectedUser = threads.find((t) => t.user.id === selected)?.user

  if (loading) return <div className="animate-pulse text-gray-400">Chargement…</div>

  return (
    <div>
      <PageHeader title="Messagerie" subtitle="Échangez avec vos locataires" />

      <div className="flex gap-6 h-[calc(100vh-12rem)]">
        {/* Liste des conversations */}
        <div className="w-72 flex-shrink-0 space-y-2 overflow-y-auto">
          {threads.length === 0 && (
            <div className="card text-center py-8 text-gray-400 text-sm">Aucune conversation.</div>
          )}
          {threads.map((thread) => (
            <button
              key={thread.user.id}
              onClick={() => setSelected(thread.user.id)}
              className={`w-full text-left p-4 rounded-xl transition-all ${
                selected === thread.user.id
                  ? 'bg-sergic-blue text-white'
                  : 'bg-white hover:bg-gray-50 border border-gray-100'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className={`font-semibold text-sm ${selected === thread.user.id ? 'text-white' : 'text-sergic-navy'}`}>
                  {thread.user.prenom} {thread.user.nom}
                </p>
                {thread.unread > 0 && (
                  <span className="bg-sergic-orange text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    {thread.unread}
                  </span>
                )}
              </div>
              <p className={`text-xs truncate ${selected === thread.user.id ? 'text-white/70' : 'text-gray-500'}`}>
                {thread.lastMessage.contenu}
              </p>
            </button>
          ))}
        </div>

        {/* Fenêtre de conversation */}
        <div className="flex-1 card flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <p className="text-4xl mb-3">💬</p>
                <p>Sélectionnez une conversation</p>
              </div>
            </div>
          ) : (
            <>
              <div className="border-b border-gray-100 pb-3 mb-4 flex-shrink-0">
                <p className="font-bold text-sergic-navy">
                  {selectedUser?.prenom} {selectedUser?.nom}
                </p>
                <p className="text-xs text-gray-500">{selectedUser?.email}</p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.expediteur === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-sm px-4 py-3 rounded-2xl text-sm ${
                      msg.expediteur === 'admin'
                        ? 'bg-sergic-blue text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                    }`}>
                      <p>{msg.contenu}</p>
                      <p className={`text-xs mt-1 ${msg.expediteur === 'admin' ? 'text-white/60' : 'text-gray-400'}`}>
                        {new Date(msg.date_envoi).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={handleSend} className="border-t border-gray-100 pt-4 mt-4 flex gap-3 flex-shrink-0">
                <input
                  type="text"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Votre réponse…"
                  className="input-field flex-1"
                />
                <button type="submit" disabled={sending || !reply.trim()} className="btn-primary px-6">
                  {sending ? '…' : '→'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
