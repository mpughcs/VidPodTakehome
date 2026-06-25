"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
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

export type RegisterArgs = {
  email: string
  password: string
  displayName?: string
}

type UserContextValue = {
  user: User | null
  uid: string | null
  email: string | null
  displayName: string | null
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (args: RegisterArgs) => Promise<User>
  logout: () => Promise<void>
}

const UserContext = createContext<UserContextValue | null>(null)

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error("useUser must be used within UserProvider")
  }
  return context
}

export function UserProvider({ children }: { children: ReactNode }) {
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
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    )

    if (displayName) {
      await updateProfile(userCredential.user, { displayName })
    }

    return userCredential.user
  }

  async function logout() {
    const auth = getFirebaseAuth()
    await signOut(auth)
    setUser(null)
  }

  const value = useMemo<UserContextValue>(
    () => ({
      user,
      uid: user?.uid ?? null,
      email: user?.email ?? null,
      displayName: user?.displayName ?? null,
      isAuthenticated: !!user,
      loading,
      login,
      register,
      logout,
    }),
    [user, loading]
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
