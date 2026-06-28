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
  restoreAdMarker,
  subscribeAdMarkers,
  updateAdMarker,
} from "@/lib/ad-markers-db"
import {
  syncAdMarkersToEditor,
  getAdMarkerElementsFromProject,
  mergeMarkerTimesFromTimeline,
  timelineMarkersMatch,
  adMarkerFromElement,
  adMarkerRestoreInputFromElement,
} from "@/lib/ad-markers-timeline"
import { subscribeAds } from "@/lib/ads-db"
import { waitForFirebaseAuthUser } from "@/lib/firebase-auth"
import {
  hydrateProjectAssets,
  loadProjectFromLocalStorage,
  saveProjectToLocalStorage,
} from "@/lib/ads-editor-storage"
import type { Ad } from "@/types/ad"
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
  episodeSrc?: string
  currentTime: number
  setCurrentTime: (seconds: number) => void
  seekTo: (seconds: number) => void
  seekTime: number
  isAdPlaying: boolean
  setIsAdPlaying: (playing: boolean) => void
  skipAd: () => void
  skipAdNonce: number
  adMarkers: AdMarker[]
  ads: Ad[]
  isLoadingMarkers: boolean
  isLoadingAds: boolean
  markersError: string | null
  adsError: string | null
  createMarker: (input: CreateAdMarkerInput) => Promise<void>
  updateMarker: (markerId: string, input: UpdateAdMarkerInput) => Promise<void>
  removeMarker: (markerId: string) => Promise<void>
  autoPlaceMarkers: () => Promise<void>
  setTimelineDragging: (dragging: boolean) => void
  playbackMarkers: AdMarker[]
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
  episodeSrc?: string
}

function TimelinePersistence({ episodeId }: { episodeId: string }) {
  const { present, changeLog } = useTimelineContext()

  useEffect(() => {
    if (!present) return
    saveProjectToLocalStorage(present, episodeId)
  }, [present, changeLog, episodeId])

  return null
}

function TimelineMarkerPersistence({
  adMarkers,
  episodeId,
  isTimelineDraggingRef,
  isSyncingFromTimelineRef,
  flushPersistenceRef,
  onOptimisticMarkers,
  adMarkersRef,
}: {
  adMarkers: AdMarker[]
  episodeId: string
  isTimelineDraggingRef: React.RefObject<boolean>
  isSyncingFromTimelineRef: React.MutableRefObject<boolean>
  flushPersistenceRef: React.MutableRefObject<() => void>
  onOptimisticMarkers: (markers: AdMarker[]) => void
  adMarkersRef: React.MutableRefObject<AdMarker[]>
}) {
  const { changeLog, editor } = useTimelineContext()
  const isPersistingRef = useRef(false)

  useEffect(() => {
    adMarkersRef.current = adMarkers
  }, [adMarkers, adMarkersRef])

  const persistTimelineMarkers = useCallback(async () => {
    if (isPersistingRef.current) return

    const elements = getAdMarkerElementsFromProject(editor.getProject())
    const markers = adMarkersRef.current
    const elementIds = new Set(elements.map((element) => element.id))

    const pendingUpdates: Array<{
      markerId: string
      startSeconds: number
      endSeconds: number
    }> = []
    const pendingRestores: Array<{ markerId: string; input: CreateAdMarkerInput }> =
      []
    const pendingDeletes: string[] = []

    for (const element of elements) {
      const marker = markers.find((item) => item.id === element.id)
      if (!marker) {
        pendingRestores.push({
          markerId: element.id,
          input: adMarkerRestoreInputFromElement(element),
        })
        continue
      }

      if (
        element.s !== marker.startSeconds ||
        element.e !== marker.endSeconds
      ) {
        pendingUpdates.push({
          markerId: marker.id,
          startSeconds: element.s,
          endSeconds: element.e,
        })
      }
    }

    for (const marker of markers) {
      if (!elementIds.has(marker.id)) {
        pendingDeletes.push(marker.id)
      }
    }

    if (
      pendingUpdates.length === 0 &&
      pendingRestores.length === 0 &&
      pendingDeletes.length === 0
    ) {
      return
    }

    const optimisticMarkers = elements
      .map((element) => adMarkerFromElement(episodeId, element))
      .sort((a, b) => a.startSeconds - b.startSeconds)
    adMarkersRef.current = optimisticMarkers
    onOptimisticMarkers(optimisticMarkers)

    isPersistingRef.current = true
    isSyncingFromTimelineRef.current = true
    try {
      await Promise.all([
        ...pendingUpdates.map((item) =>
          updateAdMarker(episodeId, item.markerId, {
            startSeconds: item.startSeconds,
            endSeconds: item.endSeconds,
          })
        ),
        ...pendingRestores.map((item) =>
          restoreAdMarker(episodeId, item.markerId, item.input)
        ),
        ...pendingDeletes.map((markerId) =>
          deleteAdMarker(episodeId, markerId)
        ),
      ])
    } finally {
      isPersistingRef.current = false
      isSyncingFromTimelineRef.current = false
    }
  }, [editor, episodeId, isSyncingFromTimelineRef, onOptimisticMarkers])

  useEffect(() => {
    flushPersistenceRef.current = () => {
      void persistTimelineMarkers()
    }
  }, [flushPersistenceRef, persistTimelineMarkers])

  useEffect(() => {
    if (isTimelineDraggingRef.current) return
    void persistTimelineMarkers()
  }, [changeLog, isTimelineDraggingRef, persistTimelineMarkers])

  return null
}

function AdsTimelineInner({
  children,
  episodeId,
  episodeDurationSeconds,
  episodeSrc,
}: {
  children: ReactNode
  episodeId: string
  episodeDurationSeconds: number
  episodeSrc?: string
}) {
  const { editor, present } = useTimelineContext()
  const [adMarkers, setAdMarkers] = useState<AdMarker[]>([])
  const [ads, setAds] = useState<Ad[]>([])
  const [isLoadingMarkers, setIsLoadingMarkers] = useState(true)
  const [isLoadingAds, setIsLoadingAds] = useState(true)
  const [markersError, setMarkersError] = useState<string | null>(null)
  const [adsError, setAdsError] = useState<string | null>(null)
  const skipNextSyncCountRef = useRef(0)
  const adMarkersRef = useRef<AdMarker[]>([])
  const isTimelineDraggingRef = useRef(false)
  const isSyncingFromTimelineRef = useRef(false)
  const flushMarkerPersistenceRef = useRef<() => void>(() => {})
  const [currentTime, setCurrentTimeState] = useState(0)
  const [seekTime, setSeekTime] = useState(0)
  const [isAdPlaying, setIsAdPlaying] = useState(false)
  const [skipAdNonce, setSkipAdNonce] = useState(0)

  const setCurrentTime = useCallback((seconds: number) => {
    setCurrentTimeState(seconds)
  }, [])

  const skipAd = useCallback(() => {
    setSkipAdNonce((nonce) => nonce + 1)
  }, [])

  const setTimelineDragging = useCallback((dragging: boolean) => {
    isTimelineDraggingRef.current = dragging
    if (!dragging) {
      flushMarkerPersistenceRef.current()
    }
  }, [])

  const applyOptimisticMarkers = useCallback((markers: AdMarker[]) => {
    adMarkersRef.current = markers
    setAdMarkers(markers)
  }, [])

  const playbackMarkers = useMemo(
    () => mergeMarkerTimesFromTimeline(adMarkers, present),
    [adMarkers, present]
  )

  const seekTo = useCallback(
    (seconds: number) => {
      if (isAdPlaying) return
      const clamped = Math.max(0, Math.min(seconds, episodeDurationSeconds))
      setCurrentTimeState(clamped)
      setSeekTime(clamped)
    },
    [episodeDurationSeconds, isAdPlaying]
  )

  useEffect(() => {
    setCurrentTimeState(0)
    setSeekTime(0)
    setIsAdPlaying(false)
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
      setIsLoadingAds(true)
      setAdsError(null)

      const authUser = await waitForFirebaseAuthUser()
      if (cancelled) return

      if (!authUser) {
        setIsLoadingAds(false)
        setAdsError("Sign in to load the ad library.")
        return
      }

      unsubscribe = subscribeAds(
        (nextAds) => {
          if (cancelled) return
          setAds(nextAds)
          setIsLoadingAds(false)
        },
        (error) => {
          if (cancelled) return
          setAdsError(error.message)
          setIsLoadingAds(false)
        }
      )
    }

    connect()

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [])

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
          adMarkersRef.current = markers
          setAdMarkers(markers)
          setIsLoadingMarkers(false)

          if (isSyncingFromTimelineRef.current) return

          const project = editor.getProject()
          if (timelineMarkersMatch(markers, project)) {
            skipNextSyncCountRef.current = 0
            return
          }

          if (skipNextSyncCountRef.current > 0) {
            skipNextSyncCountRef.current -= 1
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
  }, [episodeId, syncTimeline, editor])

  const createMarker = useCallback(
    async (input: CreateAdMarkerInput) => {
      setMarkersError(null)
      await createAdMarker(episodeId, input)
      if (input.startSeconds > 0) {
        seekTo(Math.max(0, input.startSeconds - 1))
      }
    },
    [episodeId, seekTo]
  )

  const updateMarker = useCallback(
    async (markerId: string, input: UpdateAdMarkerInput) => {
      setMarkersError(null)
      skipNextSyncCountRef.current += 1
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
      episodeSrc,
      currentTime,
      setCurrentTime,
      seekTo,
      seekTime,
      isAdPlaying,
      setIsAdPlaying,
      skipAd,
      skipAdNonce,
      adMarkers,
      playbackMarkers,
      ads,
      isLoadingMarkers,
      isLoadingAds,
      markersError,
      adsError,
      createMarker,
      updateMarker,
      removeMarker,
      autoPlaceMarkers,
      setTimelineDragging,
    }),
    [
      episodeId,
      episodeDurationSeconds,
      episodeSrc,
      currentTime,
      setCurrentTime,
      seekTo,
      seekTime,
      isAdPlaying,
      setIsAdPlaying,
      skipAd,
      skipAdNonce,
      adMarkers,
      playbackMarkers,
      ads,
      isLoadingMarkers,
      isLoadingAds,
      markersError,
      adsError,
      createMarker,
      updateMarker,
      removeMarker,
      autoPlaceMarkers,
      setTimelineDragging,
    ]
  )

  return (
    <AdsTimelineContext.Provider value={value}>
      <TimelinePersistence episodeId={episodeId} />
      <TimelineMarkerPersistence
        adMarkers={adMarkers}
        episodeId={episodeId}
        isTimelineDraggingRef={isTimelineDraggingRef}
        isSyncingFromTimelineRef={isSyncingFromTimelineRef}
        flushPersistenceRef={flushMarkerPersistenceRef}
        onOptimisticMarkers={applyOptimisticMarkers}
        adMarkersRef={adMarkersRef}
      />
      {children}
    </AdsTimelineContext.Provider>
  )
}

export function AdsTimelineProvider({
  children,
  episodeId,
  episodeTitle,
  episodeDurationSeconds,
  episodeSrc,
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
        episodeSrc={episodeSrc}
      >
        {children}
      </AdsTimelineInner>
    </TimelineProvider>
  )
}

export { useTimelineContext } from "@twick/timeline"
