"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import type { User } from "firebase/auth"
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth"

import { getFirebaseAuth } from "@/lib/firebase"

type RegisterArgs = {
  email: string
  password: string
  displayName?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (args: RegisterArgs) => Promise<User>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const auth = getFirebaseAuth()
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  async function login(email: string, password: string) {
    const auth = getFirebaseAuth()
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  }

  async function register({ email, password, displayName }: RegisterArgs) {
    const auth = getFirebaseAuth()
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)

    if (displayName) {
      // Keep this best-effort: it’s non-critical metadata.
      await updateProfile(userCredential.user, { displayName })
    }

    return userCredential.user
  }

  async function logout() {
    const auth = getFirebaseAuth()
    await signOut(auth)
    setUser(null)
  }

  const value: AuthContextType = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      loading,
      login,
      register,
      logout,
    }),
    [user, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

