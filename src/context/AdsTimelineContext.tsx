"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import {
  TimelineProvider,
  useTimelineContext,
  type ProjectJSON,
} from "@twick/timeline"

import {
  buildEpisodeTimelineProject,
  patchEpisodeDuration,
} from "@/components/ads-editor/timeline/episode-timeline-data"
import {
  createAdMarker,
  deleteAdMarker,
  subscribeAdMarkers,
  updateAdMarker,
} from "@/lib/ad-markers-db"
import { syncAdMarkersToEditor } from "@/lib/ad-markers-timeline"
import { waitForFirebaseAuthUser } from "@/lib/firebase-auth"
import {
  hydrateProjectAssets,
  loadProjectFromLocalStorage,
  saveProjectToLocalStorage,
} from "@/lib/ads-editor-storage"
import type {
  AdMarker,
  AdMarkerMode,
  CreateAdMarkerInput,
  UpdateAdMarkerInput,
} from "@/types/ad-marker"

const TIMELINE_CONTEXT_ID = "ads-editor-timeline"

type AdsTimelineContextValue = {
  episodeId: string
  episodeDurationSeconds: number
  currentTime: number
  setCurrentTime: (seconds: number) => void
  seekTo: (seconds: number) => void
  seekTime: number
  adMarkers: AdMarker[]
  isLoadingMarkers: boolean
  markersError: string | null
  createMarker: (input: CreateAdMarkerInput) => Promise<void>
  updateMarker: (markerId: string, input: UpdateAdMarkerInput) => Promise<void>
  removeMarker: (markerId: string) => Promise<void>
  autoPlaceMarkers: () => Promise<void>
}

const AdsTimelineContext = createContext<AdsTimelineContextValue | null>(null)

export function useAdsTimeline() {
  const context = useContext(AdsTimelineContext)
  if (!context) {
    throw new Error("useAdsTimeline must be used within AdsTimelineProvider")
  }
  return context
}

type AdsTimelineProviderProps = {
  children: ReactNode
  episodeId: string
  episodeTitle: string
  episodeDurationSeconds: number
}

function TimelinePersistence({ episodeId }: { episodeId: string }) {
  const { present, changeLog } = useTimelineContext()

  useEffect(() => {
    if (!present) return
    saveProjectToLocalStorage(present, episodeId)
  }, [present, changeLog, episodeId])

  return null
}

function AdsTimelineInner({
  children,
  episodeId,
  episodeDurationSeconds,
}: {
  children: ReactNode
  episodeId: string
  episodeDurationSeconds: number
}) {
  const { editor } = useTimelineContext()
  const [adMarkers, setAdMarkers] = useState<AdMarker[]>([])
  const [isLoadingMarkers, setIsLoadingMarkers] = useState(true)
  const [markersError, setMarkersError] = useState<string | null>(null)
  const skipNextSyncRef = useRef(false)
  const [currentTime, setCurrentTimeState] = useState(0)
  const [seekTime, setSeekTime] = useState(0)

  const setCurrentTime = useCallback((seconds: number) => {
    setCurrentTimeState(seconds)
  }, [])

  const seekTo = useCallback(
    (seconds: number) => {
      const clamped = Math.max(0, Math.min(seconds, episodeDurationSeconds))
      setCurrentTimeState(clamped)
      setSeekTime(clamped)
    },
    [episodeDurationSeconds]
  )

  useEffect(() => {
    setCurrentTimeState(0)
    setSeekTime(0)
  }, [episodeId])

  useEffect(() => {
    const project = editor.getProject()
    const episodeElement = project.tracks
      .flatMap((track) => track.elements)
      .find((element) => element.props?.role === "episode")

    if (episodeElement && episodeElement.e !== episodeDurationSeconds) {
      editor.loadProject(patchEpisodeDuration(project, episodeDurationSeconds))
    }
  }, [editor, episodeDurationSeconds])

  const syncTimeline = useCallback(
    (markers: AdMarker[]) => {
      syncAdMarkersToEditor(editor, markers)
    },
    [editor]
  )

  useEffect(() => {
    let cancelled = false
    let unsubscribe: (() => void) | undefined

    async function connect() {
      setIsLoadingMarkers(true)
      setMarkersError(null)

      const authUser = await waitForFirebaseAuthUser()
      if (cancelled) return

      if (!authUser) {
        setIsLoadingMarkers(false)
        setMarkersError("Sign in to load ad markers.")
        return
      }

      unsubscribe = subscribeAdMarkers(
        episodeId,
        (markers) => {
          if (cancelled) return
          setAdMarkers(markers)
          setIsLoadingMarkers(false)
          if (skipNextSyncRef.current) {
            skipNextSyncRef.current = false
            return
          }
          syncTimeline(markers)
        },
        (error) => {
          if (cancelled) return
          setMarkersError(error.message)
          setIsLoadingMarkers(false)
        }
      )
    }

    connect()

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [episodeId, syncTimeline])

  const createMarker = useCallback(
    async (input: CreateAdMarkerInput) => {
      setMarkersError(null)
      await createAdMarker(episodeId, input)
    },
    [episodeId]
  )

  const updateMarker = useCallback(
    async (markerId: string, input: UpdateAdMarkerInput) => {
      setMarkersError(null)
      await updateAdMarker(episodeId, markerId, input)
    },
    [episodeId]
  )

  const removeMarker = useCallback(
    async (markerId: string) => {
      setMarkersError(null)
      await deleteAdMarker(episodeId, markerId)
    },
    [episodeId]
  )

  const autoPlaceMarkers = useCallback(async () => {
    setMarkersError(null)
    const slots: Array<{ startSeconds: number; mode: AdMarkerMode }> = [
      { startSeconds: 45, mode: "auto" },
      { startSeconds: 120, mode: "static" },
      { startSeconds: 210, mode: "ab" },
    ]

    for (const slot of slots) {
      const overlaps = adMarkers.some(
        (marker) =>
          slot.startSeconds < marker.endSeconds &&
          slot.startSeconds + 15 > marker.startSeconds
      )
      if (overlaps) continue

      await createAdMarker(episodeId, {
        startSeconds: slot.startSeconds,
        endSeconds: slot.startSeconds + 15,
        mode: slot.mode,
      })
    }
  }, [adMarkers, episodeId])




  const value = useMemo(
    () => ({
      episodeId,
      episodeDurationSeconds,
      currentTime,
      setCurrentTime,
      seekTo,
      seekTime,
      adMarkers,
      isLoadingMarkers,
      markersError,
      createMarker,
      updateMarker,
      removeMarker,
      autoPlaceMarkers,
    }),
    [
      episodeId,
      episodeDurationSeconds,
      currentTime,
      setCurrentTime,
      seekTo,
      seekTime,
      adMarkers,
      isLoadingMarkers,
      markersError,
      createMarker,
      updateMarker,
      removeMarker,
      autoPlaceMarkers,
    ]
  )

  return (
    <AdsTimelineContext.Provider value={value}>
      <TimelinePersistence episodeId={episodeId} />
      {children}
    </AdsTimelineContext.Provider>
  )
}

export function AdsTimelineProvider({
  children,
  episodeId,
  episodeTitle,
  episodeDurationSeconds,
}: AdsTimelineProviderProps) {
  const [initialData, setInitialData] = useState<ProjectJSON | null>(null)

  useEffect(() => {
    async function load() {
      const stored = loadProjectFromLocalStorage(episodeId)
      const baseProject = patchEpisodeDuration(
        stored
          ? await hydrateProjectAssets(stored)
          : buildEpisodeTimelineProject(episodeTitle, episodeDurationSeconds),
        episodeDurationSeconds
      )

      setInitialData(baseProject)
    }
    load()
  }, [episodeId, episodeTitle, episodeDurationSeconds])

  if (!initialData) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-sm text-slate-400">
        Loading timeline…
      </div>
    )
  }

  return (
    <TimelineProvider
      contextId={TIMELINE_CONTEXT_ID}
      initialData={initialData}
      undoRedoPersistenceKey={`ads-editor-timeline-history:${episodeId}`}
      analytics={{ enabled: false }}
    >
      <AdsTimelineInner
        episodeId={episodeId}
        episodeDurationSeconds={episodeDurationSeconds}
      >
        {children}
      </AdsTimelineInner>
    </TimelineProvider>
  )
}

export { useTimelineContext } from "@twick/timeline"
