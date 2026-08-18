import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase, mapSupabaseError } from '../lib/supabaseClient'
import type { Session, User as SupabaseUser } from '@supabase/supabase-js'

export interface Profile {
  id: string
  email: string
  full_name: string
  username: string
  role: 'user' | 'admin'
  balance: number
  kyc_verified: boolean
  status: string
  referral_code: string
  referred_by: string | null
  created_at?: string
}

interface AuthContextType {
  user: SupabaseUser | null
  profile: Profile | null
  session: Session | null
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, fullName: string, username: string, referredBy?: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const ADMIN_EMAIL = 'primenetworkadministrator@gmail.com'
const ADMIN_USERNAME = 'admin@primenetwork'

export { ADMIN_EMAIL, ADMIN_USERNAME }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) {
      console.error('Error fetching profile:', mapSupabaseError(error))
      return null
    }
    return data as Profile
  }

  const syncAndReconcileDeposits = async (userId: string) => {
    try {
      // 1. Trigger Marz API deposit reconciliation endpoint
      await fetch('/api/marz/reconcile-deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      }).catch(() => {})

      // 2. Trigger database balance verification procedure
      await supabase.rpc('refresh_marz_verified_balance', { p_user_id: userId }).catch(() => {})
    } catch (err) {
      console.error('[AuthContext] syncAndReconcileDeposits error:', err)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await syncAndReconcileDeposits(user.id)
      const p = await fetchProfile(user.id)
      setProfile(p)
    }
  }

  useEffect(() => {
    let realtimeChannel: any = null

    const setupRealtime = (userId: string) => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel)
      }
      realtimeChannel = supabase
        .channel(`user-sync-${userId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` },
          async () => {
            await refreshProfile()
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
          async () => {
            const p = await fetchProfile(userId)
            if (p) setProfile(p)
          }
        )
        .subscribe()
    }

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        setupRealtime(session.user.id)
        await syncAndReconcileDeposits(session.user.id)
        const p = await fetchProfile(session.user.id)
        setProfile(p)
      }
      setIsLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        setupRealtime(session.user.id)
        await syncAndReconcileDeposits(session.user.id)
        const p = await fetchProfile(session.user.id)
        setProfile(p)
      } else {
        if (realtimeChannel) {
          supabase.removeChannel(realtimeChannel)
          realtimeChannel = null
        }
        setProfile(null)
      }
    })

    return () => {
      subscription.unsubscribe()
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel)
      }
    }
  }, [user?.id])

  const login = async (identifier: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)

    let email = identifier.trim()
    const lowerId = email.toLowerCase()

    if (lowerId === ADMIN_USERNAME) {
      email = ADMIN_EMAIL
    } else if (!email.includes('@')) {
      const { data, error: rpcError } = await supabase.rpc('get_email_by_username', { p_username: email.toLowerCase() })
      if (rpcError || !data || data.length === 0) {
        setIsLoading(false)
        return { success: false, error: rpcError ? mapSupabaseError(rpcError) : 'No account found with that username.' }
      }
      email = data[0].email
    }

    const { error } = await supabase.auth.signInWithPassword({ email: email.toLowerCase(), password })
    setIsLoading(false)
    if (error) return { success: false, error: mapSupabaseError(error) }
    return { success: true }
  }

  const register = async (
    email: string,
    password: string,
    fullName: string,
    username: string,
    referredBy?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    const cleanEmail = email.trim().toLowerCase()
    const cleanUsername = username.trim().toLowerCase()

    const { data: existing } = await supabase.rpc('username_exists', { p_username: cleanUsername })

    if (existing) {
      setIsLoading(false)
      return { success: false, error: 'Username already taken. Please choose another.' }
    }

    const { error } = await supabase.auth.signUp({ 
      email: cleanEmail, 
      password,
      options: {
        data: {
          full_name: fullName,
          username: cleanUsername,
          referred_by: referredBy || null
        }
      }
    })
    if (error) {
      setIsLoading(false)
      return { success: false, error: mapSupabaseError(error) }
    }

    setIsLoading(false)
    return { success: true }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, session, login, register, logout, refreshProfile, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
