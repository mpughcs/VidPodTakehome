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

import {
  createEpisode as createEpisodeInDb,
  subscribeEpisodes,
  type CreateEpisodeInput,
} from "@/lib/episodes-db"
import { waitForFirebaseAuthUser } from "@/lib/firebase-auth"
import { useUser } from "@/context/UserContext"
import type { Episode } from "@/types/episode"
import type { Unsubscribe } from "firebase/firestore"

const ACTIVE_EPISODE_KEY = "workspace:active-episode-id"

type EpisodeContextValue = {
  episodes: Episode[]
  activeEpisode: Episode | null
  isLoading: boolean
  error: string | null
  selectEpisode: (episodeId: string) => void
  createEpisode: (input: CreateEpisodeInput) => Promise<Episode>
  isCreating: boolean
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
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    const storedId = localStorage.getItem(ACTIVE_EPISODE_KEY)
    if (storedId) setActiveEpisodeId(storedId)
  }, [])

  useEffect(() => {
    if (authLoading) return

    let cancelled = false
    let unsubscribe: Unsubscribe | undefined

    async function connect() {
      if (!isAuthenticated || !user) {
        setEpisodes([])
        setActiveEpisodeId(null)
        localStorage.removeItem(ACTIVE_EPISODE_KEY)
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

          if (nextEpisodes.length === 0) {
            setActiveEpisodeId(null)
            localStorage.removeItem(ACTIVE_EPISODE_KEY)
            return
          }

          setActiveEpisodeId((currentId) => {
            const stillExists = currentId
              ? nextEpisodes.some((episode) => episode.id === currentId)
              : false
            const nextId = stillExists ? currentId! : nextEpisodes[0].id
            localStorage.setItem(ACTIVE_EPISODE_KEY, nextId)
            return nextId
          })
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

  const activeEpisode = useMemo(
    () => episodes.find((episode) => episode.id === activeEpisodeId) ?? null,
    [episodes, activeEpisodeId]
  )

  const selectEpisode = useCallback((episodeId: string) => {
    setActiveEpisodeId(episodeId)
    localStorage.setItem(ACTIVE_EPISODE_KEY, episodeId)
  }, [])

  const createEpisode = useCallback(async (input: CreateEpisodeInput) => {
    setIsCreating(true)
    setError(null)
    try {
      const episode = await createEpisodeInDb(input)
      setActiveEpisodeId(episode.id)
      localStorage.setItem(ACTIVE_EPISODE_KEY, episode.id)
      return episode
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
  }, [])

  const value = useMemo(
    () => ({
      episodes,
      activeEpisode,
      isLoading,
      error,
      selectEpisode,
      createEpisode,
      isCreating,
    }),
    [
      episodes,
      activeEpisode,
      isLoading,
      error,
      selectEpisode,
      createEpisode,
      isCreating,
    ]
  )

  return (
    <EpisodeContext.Provider value={value}>{children}</EpisodeContext.Provider>
  )
}
