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
  VideoElement,
  TRACK_TYPES,
  useTimelineContext,
  type ProjectJSON,
} from "@twick/timeline"

import { buildEpisodeTimelineProject } from "@/components/ads-editor/timeline/episode-timeline-data"
import {
  createAdMarker,
  deleteAdMarker,
  subscribeAdMarkers,
  updateAdMarker,
} from "@/lib/ad-markers-db"
import { syncAdMarkersToEditor } from "@/lib/ad-markers-timeline"
import { waitForFirebaseAuthUser } from "@/lib/firebase-auth"
import {
  getVideoDurationSeconds,
  hydrateProjectAssets,
  loadProjectFromLocalStorage,
  saveProjectToLocalStorage,
  saveVideoBlob,
} from "@/lib/ads-editor-storage"
import type {
  AdMarker,
  AdMarkerMode,
  CreateAdMarkerInput,
  UpdateAdMarkerInput,
} from "@/types/ad-marker"
import { DEFAULT_MARKER_DURATION_SECONDS } from "@/types/ad-marker"

const IMPORT_TRACK_NAME = "Imported clips"
const VIDEO_RESOLUTION = { width: 720, height: 480 }
const TIMELINE_CONTEXT_ID = "ads-editor-timeline"

type AdsTimelineContextValue = {
  episodeId: string
  adMarkers: AdMarker[]
  isLoadingMarkers: boolean
  markersError: string | null
  createMarker: (input: CreateAdMarkerInput) => Promise<void>
  updateMarker: (markerId: string, input: UpdateAdMarkerInput) => Promise<void>
  removeMarker: (markerId: string) => Promise<void>
  autoPlaceMarkers: () => Promise<void>
  importMp4: (file: File) => Promise<void>
  isImporting: boolean
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
  const [isImporting, setIsImporting] = useState(false)
  const skipNextSyncRef = useRef(false)

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
          slot.startSeconds + DEFAULT_MARKER_DURATION_SECONDS > marker.startSeconds
      )
      if (overlaps) continue

      await createAdMarker(episodeId, {
        startSeconds: slot.startSeconds,
        endSeconds: slot.startSeconds + DEFAULT_MARKER_DURATION_SECONDS,
        mode: slot.mode,
      })
    }
  }, [adMarkers, episodeId])

  const importMp4 = useCallback(
    async (file: File) => {
      setIsImporting(true)
      try {
        const assetId = crypto.randomUUID()
        await saveVideoBlob(assetId, file)

        const objectUrl = URL.createObjectURL(file)
        const duration = await getVideoDurationSeconds(objectUrl)

        let track = editor.getTrackByName(IMPORT_TRACK_NAME)
        if (!track) {
          track = editor.addTrack(IMPORT_TRACK_NAME, TRACK_TYPES.VIDEO)
        }

        const lastEnd = track
          .getElements()
          .reduce((max, element) => Math.max(max, element.getEnd()), 0)

        const start = lastEnd
        const end = Math.min(start + duration, episodeDurationSeconds)

        const videoElement = new VideoElement(objectUrl, VIDEO_RESOLUTION)
          .setStart(start)
          .setEnd(end)
          .setName(file.name.replace(/\.mp4$/i, ""))

        await editor.addElementToTrack(track, videoElement)

        const project = editor.getProject()
        const nextProject: ProjectJSON = {
          ...project,
          assets: {
            ...project.assets,
            [assetId]: {
              id: assetId,
              type: "video",
              url: objectUrl,
              duration: duration * 1000,
            },
          },
          tracks: project.tracks.map((t) =>
            t.id === track!.getId()
              ? {
                  ...t,
                  elements: t.elements.map((el) => {
                    const isNew =
                      el.name === videoElement.getName() && el.s === start
                    if (!isNew) return el
                    return {
                      ...el,
                      props: {
                        ...el.props,
                        imported: true,
                        srcAssetId: assetId,
                        src: objectUrl,
                      },
                    }
                  }),
                }
              : t
          ),
        }

        skipNextSyncRef.current = true
        editor.loadProject(nextProject)
        saveProjectToLocalStorage(nextProject, episodeId)
      } finally {
        setIsImporting(false)
      }
    },
    [editor, episodeDurationSeconds, episodeId]
  )

  const value = useMemo(
    () => ({
      episodeId,
      adMarkers,
      isLoadingMarkers,
      markersError,
      createMarker,
      updateMarker,
      removeMarker,
      autoPlaceMarkers,
      importMp4,
      isImporting,
    }),
    [
      episodeId,
      adMarkers,
      isLoadingMarkers,
      markersError,
      createMarker,
      updateMarker,
      removeMarker,
      autoPlaceMarkers,
      importMp4,
      isImporting,
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
      const baseProject = stored
        ? await hydrateProjectAssets(stored)
        : buildEpisodeTimelineProject(episodeTitle, episodeDurationSeconds)

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
