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
  deleteEpisode as deleteEpisodeInDb,
  uploadMp4 as uploadMp4InDb,
  updateEpisode as updateEpisodeInDb,
} from "@/lib/episodes-db"
import { getVideoMetadata } from "@/lib/ads-editor-storage"
import { persistLivePlayerProjectForMp4 } from "@/lib/live-player-project"
import { waitForFirebaseAuthUser } from "@/lib/firebase-auth"
import type { Episode } from "@/types/episode"

type EpisodeContextValue = {
  episodes: Episode[]
  isLoading: boolean
  error: string | null
  createEpisode: (input: Omit<CreateEpisodeInput, "creatorId">) => Promise<Episode>
  isCreating: boolean
  getEpisodeById: (id: string) => Episode | undefined
  deleteEpisode: (episodeId: string) => Promise<void>
  isImporting: boolean
  uploadMp4: (episodeId: string, file: File) => Promise<string>
  selectedEpisodeId: string | null
  setSelectedEpisodeId: (episodeId: string | null) => void
  selectedEpisodeHasSrc: boolean
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
  const [isImporting, setIsImporting] = useState(false)
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null)

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

  const selectedEpisodeHasSrc = useMemo(() => {
    if (!selectedEpisodeId) return false
    const episode = episodes.find((item) => item.id === selectedEpisodeId)
    return Boolean(episode?.src)
  }, [episodes, selectedEpisodeId])

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
  const deleteEpisode = useCallback(
    async (episodeId: string) => {
      await deleteEpisodeInDb(episodeId)
    },
    []
  )
  const uploadMp4 = useCallback(
    async (episodeId: string, file: File) => {
      setIsImporting(true)
      setError(null)
      try {
        const url = await uploadMp4InDb(episodeId, file)
        const objectUrl = URL.createObjectURL(file)
        try {
          const { durationSeconds, width, height } =
            await getVideoMetadata(objectUrl)
          const episode = episodes.find((item) => item.id === episodeId)
          await updateEpisodeInDb(episodeId, {
            src: url,
            duration: durationSeconds,
          })
          persistLivePlayerProjectForMp4(episodeId, {
            src: url,
            title: episode?.title ?? file.name,
            durationSeconds,
            width,
            height,
          })
        } finally {
          URL.revokeObjectURL(objectUrl)
        }
        return url
      } catch (uploadError) {
        const message =
          uploadError instanceof Error
            ? uploadError.message
            : "Could not upload MP4"
        setError(message)
        throw uploadError
      } finally {
        setIsImporting(false)
      }
    }, [episodes])

  const value = useMemo(
    () => ({
      episodes,
      isLoading,
      error,
      createEpisode,
      isCreating,
      getEpisodeById,
      deleteEpisode,
      isImporting,
      uploadMp4,
      selectedEpisodeId,
      setSelectedEpisodeId,
      selectedEpisodeHasSrc,
    }),
    [
      episodes,
      isLoading,
      error,
      createEpisode,
      isCreating,
      getEpisodeById,
      deleteEpisode,
      isImporting,
      uploadMp4,
      selectedEpisodeId,
      setSelectedEpisodeId,
      selectedEpisodeHasSrc,
    ]
  )

  return (
    <EpisodeContext.Provider value={value}>{children}</EpisodeContext.Provider>
  )
}