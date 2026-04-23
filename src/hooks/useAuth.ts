import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User, UserRole } from '../types'

interface AuthState {
  user: User | null
  role: UserRole | null
  loading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    loading: true,
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setState({ user: null, role: null, loading: false })
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          fetchUserProfile(session.user.id)
        } else {
          setState({ user: null, role: null, loading: false })
        }
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  async function fetchUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !data) {
      setState({ user: null, role: null, loading: false })
      return
    }

    setState({ user: data as User, role: data.role as UserRole, loading: false })
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
    setState({ user: null, role: null, loading: false })
  }

  async function updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  }

  return { ...state, signIn, signOut, updatePassword }
}
