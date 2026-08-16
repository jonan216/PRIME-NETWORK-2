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

export { ADMIN_EMAIL }

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
        setProfile(p)
      }
      setIsLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        const p = await fetchProfile(session.user.id)
        setProfile(p)
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

    // First try to resolve as username, even if it looks like an email
    const { data: usernameData, error: usernameError } = await supabase.rpc('get_email_by_username', { p_username: email.toLowerCase() })
    if (!usernameError && usernameData && usernameData.length > 0) {
      email = usernameData[0].email
    } else if (!email.includes('@')) {
      setIsLoading(false)
      return { success: false, error: usernameError ? mapSupabaseError(usernameError) : 'No account found with that username.' }
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
