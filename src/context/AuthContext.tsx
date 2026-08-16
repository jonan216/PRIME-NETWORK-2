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

  const createMissingProfile = async (user: SupabaseUser) => {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (existing) return

    const email = user.email?.toLowerCase() || ''
    const role = email === ADMIN_EMAIL ? 'admin' : 'user'
    const fullName = (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || ''
    const username = (user.user_metadata?.username as string) || email.split('@')[0] || ''

    const { error } = await supabase.from('profiles').insert({
      id: user.id,
      email,
      full_name: fullName,
      username: username.toLowerCase(),
      role,
      referred_by: (user.user_metadata?.referred_by as string) || null,
      balance: 0,
      kyc_verified: false,
      status: 'active',
    })

    if (error) {
      console.error('Error creating missing profile:', mapSupabaseError(error))
    }
  }

  const refreshProfile = async () => {
    if (user) {
      const p = await fetchProfile(user.id)
      setProfile(p)
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        const p = await fetchProfile(session.user.id)
        if (!p) {
          await createMissingProfile(session.user)
        }
        const refreshed = await fetchProfile(session.user.id)
        setProfile(refreshed)
      }
      setIsLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        const p = await fetchProfile(session.user.id)
        if (!p) {
          await createMissingProfile(session.user)
        }
        const refreshed = await fetchProfile(session.user.id)
        setProfile(refreshed)
      } else {
        setProfile(null)
      }
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

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

    const { data, error } = await supabase.auth.signUp({ 
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

    if (data.user) {
      const role = cleanEmail === ADMIN_EMAIL ? 'admin' : 'user'
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email: cleanEmail,
        full_name: fullName,
        username: cleanUsername,
        role,
        referred_by: referredBy || null,
        balance: 0,
        kyc_verified: false,
        status: 'active',
      })

      if (profileError) {
        console.error('Profile creation error:', mapSupabaseError(profileError))
      }
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
