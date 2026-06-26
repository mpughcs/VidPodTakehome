"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { Unsubscribe } from "firebase/firestore"

import { useUser } from "@/context/UserContext"
import {
  createEpisode as createEpisodeInDb,
  subscribeEpisodes,
  type CreateEpisodeInput,
} from "@/lib/episodes-db"
import { waitForFirebaseAuthUser } from "@/lib/firebase-auth"
import type { Episode } from "@/types/episode"

type EpisodeContextValue = {
  episodes: Episode[]
  isLoading: boolean
  error: string | null
  createEpisode: (input: Omit<CreateEpisodeInput, "creatorId">) => Promise<Episode>
  isCreating: boolean
  getEpisodeById: (id: string) => Episode | undefined
}

const EpisodeContext = createContext<EpisodeContextValue | null>(null)

export function useEpisodes() {
  const context = useContext(EpisodeContext)
  if (!context) {
    throw new Error("useEpisodes must be used within EpisodeProvider")
  }
  return context
}

export function EpisodeProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading: authLoading, user } = useUser()
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (authLoading) return

    let cancelled = false
    let unsubscribe: Unsubscribe | undefined

    async function connect() {
      if (!isAuthenticated || !user) {
        setEpisodes([])
        setError(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      const authUser = await waitForFirebaseAuthUser()
      if (cancelled) return

      if (!authUser) {
        setEpisodes([])
        setIsLoading(false)
        return
      }

      unsubscribe = subscribeEpisodes(
        (nextEpisodes) => {
          if (cancelled) return
          setEpisodes(nextEpisodes)
          setIsLoading(false)
        },
        (subscribeError) => {
          if (cancelled) return
          const code = (subscribeError as { code?: string }).code
          const message =
            code === "permission-denied"
              ? "Firestore denied access. Sign in, then deploy rules: firebase deploy --only firestore:rules --project vidpod-2ba39"
              : subscribeError.message
          setError(message)
          setIsLoading(false)
        }
      )
    }

    connect()

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [authLoading, isAuthenticated, user?.uid])

  const getEpisodeById = useCallback(
    (id: string) => episodes.find((episode) => episode.id === id),
    [episodes]
  )

  const createEpisode = useCallback(
    async (input: Omit<CreateEpisodeInput, "creatorId">) => {
      if (!user?.uid) {
        throw new Error("You must be signed in to create an episode.")
      }

      setIsCreating(true)
      setError(null)
      try {
        return await createEpisodeInDb({
          ...input,
          creatorId: user.uid,
        })
      } catch (createError) {
        const message =
          createError instanceof Error
            ? createError.message
            : "Could not create episode"
        setError(message)
        throw createError
      } finally {
        setIsCreating(false)
      }
    },
    [user?.uid]
  )

  const value = useMemo(
    () => ({
      episodes,
      isLoading,
      error,
      createEpisode,
      isCreating,
      getEpisodeById,
    }),
    [episodes, isLoading, error, createEpisode, isCreating, getEpisodeById]
  )

  return (
    <EpisodeContext.Provider value={value}>{children}</EpisodeContext.Provider>
  )
}
