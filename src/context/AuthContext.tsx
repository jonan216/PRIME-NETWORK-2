import { createContext, useContext, useState, type ReactNode } from 'react'

interface User {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
  kycVerified: boolean
  balance?: number
}

interface AuthContextType {
  user: User | null
  login: (identifier: string, password: string) => Promise<boolean>
  register: (email: string, password: string, name: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('prime_user')
    return stored ? JSON.parse(stored) : null
  })
  const [isLoading, setIsLoading] = useState(false)

  const ADMIN_EMAIL = 'primeadministratorwealth@gmail.com'
  const ADMIN_PASSWORD = 'Wealth@2026!'
  const ADMIN_USER: User = {
    id: 'admin-1',
    email: ADMIN_EMAIL,
    name: 'PRIME NETWORK ADMINISTRATOR',
    role: 'admin',
    kycVerified: true,
  }

  const login = async (identifier: string, password: string) => {
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 800))

    const cleanId = identifier.trim().toLowerCase()
    const cleanPassword = password.trim()

    if ((cleanId === ADMIN_EMAIL.toLowerCase() || cleanId === 'admin') && cleanPassword === ADMIN_PASSWORD) {
      setUser(ADMIN_USER)
      localStorage.setItem('prime_user', JSON.stringify(ADMIN_USER))
      setIsLoading(false)
      return true
    }

    const mockUser: User = {
      id: Date.now().toString(),
      email: cleanId.includes('@') ? cleanId : `${cleanId}@user.com`,
      name: cleanId.includes('@') ? cleanId.split('@')[0] : cleanId,
      role: 'user',
      kycVerified: true,
    }
    setUser(mockUser)
    localStorage.setItem('prime_user', JSON.stringify(mockUser))
    setIsLoading(false)
    return true
  }

  const register = async (email: string, _password: string, name: string) => {
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 800))
    const cleanEmail = email.trim().toLowerCase()
    const isAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase()
    const newUser: User = isAdmin ? ADMIN_USER : {
      id: Date.now().toString(),
      email: cleanEmail,
      name,
      role: 'user',
      kycVerified: false,
    }
    setUser(newUser)
    localStorage.setItem('prime_user', JSON.stringify(newUser))
    setIsLoading(false)
    return true
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('prime_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
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
