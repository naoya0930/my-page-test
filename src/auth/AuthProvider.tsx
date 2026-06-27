import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'

type AuthContextType = {
  user: User | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  /** Set when a previously stored session could not be restored/refreshed. */
  sessionExpired: boolean
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>
  signUpWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ error: Error | null; needsEmailConfirmation: boolean }>
  signInWithGoogle: () => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)
  // Tracks whether the next SIGNED_OUT event was triggered by the user calling
  // signOut() (deliberate) vs. supabase clearing a failed/expired session.
  const intentionalSignOut = useRef(false)

  useEffect(() => {
    let active = true

    // Purge any stale/invalid session left in localStorage so the app does not
    // keep retrying with a dead refresh token. Marks the session as expired so
    // the login screen can explain why the user was logged out.
    const handleInvalidSession = async () => {
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {})
      if (!active) return
      setSession(null)
      setUser(null)
      setSessionExpired(true)
      setIsLoading(false)
    }

    // Restore the existing session on mount. If the stored refresh token is no
    // longer valid (e.g. the Supabase API/signing key was rotated), getSession
    // resolves with an error or a null session — treat both as logged out.
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (!active) return
        if (error) {
          handleInvalidSession()
          return
        }
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
      })
      .catch(() => {
        if (active) handleInvalidSession()
      })

    // Listen for auth changes. A failed token refresh surfaces here as a
    // SIGNED_OUT event with a null session, which clears the protected routes.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
      if (event === 'SIGNED_OUT') {
        // A SIGNED_OUT we did not initiate means the session expired or its
        // refresh token was rejected — flag it so /login can explain the logout.
        if (!intentionalSignOut.current) {
          setSessionExpired(true)
        }
        intentionalSignOut.current = false
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSessionExpired(false)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) {
        return { error, needsEmailConfirmation: false }
      }
      // When email confirmation is enabled, Supabase returns a user but no
      // session — the account is created but not yet usable until confirmed.
      // When it is disabled, a session is returned and onAuthStateChange logs
      // the user in automatically.
      const needsEmailConfirmation = !data.session
      return { error: null, needsEmailConfirmation }
    } catch (error) {
      return { error: error as Error, needsEmailConfirmation: false }
    }
  }

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/home`,
        },
      })
      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    intentionalSignOut.current = true
    setSessionExpired(false)
    await supabase.auth.signOut()
  }

  const value = {
    user,
    session,
    isAuthenticated: !!user,
    isLoading,
    sessionExpired,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
