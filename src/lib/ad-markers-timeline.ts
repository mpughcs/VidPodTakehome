import type { ElementJSON, ProjectJSON } from "@twick/timeline"

import type { AdMarker, AdMarkerMode, CreateAdMarkerInput } from "@/types/ad-marker"

const AD_MARKERS_TRACK_ID = "track-ads"
const AD_MARKERS_TRACK_NAME = "Ad markers"

export { AD_MARKERS_TRACK_ID, AD_MARKERS_TRACK_NAME }

/** Twick VideoElement.getPosition() requires frame; ad markers are timeline-only clips. */
const AD_MARKER_VIDEO_FRAME = { x: 0, y: 0, size: [0, 0] as [number, number] }

const MODE_LABELS: Record<AdMarkerMode, string> = {
  static: "Static",
  auto: "Auto",
  ab: "A/B",
}

export function adMarkersToTrackElements(markers: AdMarker[]) {
  return markers.map((marker) => ({
    id: marker.id,
    type: "video" as const,
    name: MODE_LABELS[marker.mode],
    s: marker.startSeconds,
    e: marker.endSeconds,
    frame: AD_MARKER_VIDEO_FRAME,
    props: {
      adMode: marker.mode,
      ...(marker.adId ? { adId: marker.adId } : {}),
      ...(marker.adIds?.length ? { adIds: marker.adIds } : {}),
    },
  }))
}

export function adMarkerFromElement(
  episodeId: string,
  element: ElementJSON
): AdMarker {
  const props = element.props ?? {}
  return {
    id: element.id,
    episodeId,
    startSeconds: element.s,
    endSeconds: element.e,
    mode: (props.adMode as AdMarkerMode) ?? "auto",
    adId: typeof props.adId === "string" ? props.adId : undefined,
    adIds: Array.isArray(props.adIds)
      ? (props.adIds as unknown[]).filter(
          (id): id is string => typeof id === "string"
        )
      : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export function adMarkerRestoreInputFromElement(
  element: ElementJSON
): CreateAdMarkerInput {
  const marker = adMarkerFromElement("", element)
  return {
    startSeconds: marker.startSeconds,
    endSeconds: marker.endSeconds,
    mode: marker.mode,
    ...(marker.adId ? { adId: marker.adId } : {}),
    ...(marker.adIds?.length ? { adIds: marker.adIds } : {}),
  }
}

export function patchAdMarkerTimesInProject(
  project: ProjectJSON,
  elementId: string,
  startSeconds: number,
  endSeconds: number
): ProjectJSON {
  return {
    ...project,
    tracks: project.tracks.map((track) => ({
      ...track,
      elements: track.elements.map((element) =>
        element.id === elementId && isAdMarkerElement(element)
          ? {
              ...element,
              s: startSeconds,
              e: endSeconds,
              frame: element.frame ?? AD_MARKER_VIDEO_FRAME,
            }
          : element
      ),
    })),
  }
}

export function mergeMarkerTimesFromTimeline(
  markers: AdMarker[],
  project: ProjectJSON | null | undefined
): AdMarker[] {
  if (!project?.tracks?.length) return markers

  const elements = getAdMarkerElementsFromProject(project)
  if (elements.length === 0) return markers

  const timesById = new Map(
    elements.map((element) => [element.id, { s: element.s, e: element.e }])
  )

  return markers.map((marker) => {
    const times = timesById.get(marker.id)
    if (!times) return marker
    if (
      times.s === marker.startSeconds &&
      times.e === marker.endSeconds
    ) {
      return marker
    }
    return {
      ...marker,
      startSeconds: times.s,
      endSeconds: times.e,
    }
  })
}

export function mergeAdMarkersIntoProject(
  project: ProjectJSON,
  markers: AdMarker[]
): ProjectJSON {
  const elements = adMarkersToTrackElements(markers)
  const hasTrack = project.tracks.some(
    (track) =>
      track.id === AD_MARKERS_TRACK_ID || track.name === AD_MARKERS_TRACK_NAME
  )

  if (!hasTrack) {
    return {
      ...project,
      tracks: [
        ...project.tracks,
        {
          id: AD_MARKERS_TRACK_ID,
          name: AD_MARKERS_TRACK_NAME,
          type: "video",
          elements,
        },
      ],
    }
  }

  return {
    ...project,
    tracks: project.tracks.map((track) =>
      track.id === AD_MARKERS_TRACK_ID || track.name === AD_MARKERS_TRACK_NAME
        ? { ...track, elements }
        : track
    ),
  }
}

export function timelineMarkerTimesMatch(
  markers: AdMarker[],
  project: ProjectJSON
): boolean {
  return timelineMarkersMatch(markers, project)
}

export function timelineMarkersMatch(
  markers: AdMarker[],
  project: ProjectJSON
): boolean {
  const elements = getAdMarkerElementsFromProject(project)
  if (markers.length !== elements.length) return false

  return markers.every((marker) => {
    const element = elements.find((item) => item.id === marker.id)
    if (!element) return false
    return (
      element.s === marker.startSeconds && element.e === marker.endSeconds
    )
  })
}

export function syncAdMarkersToEditor(
  editor: {
    getProject: () => ProjectJSON
    loadProjectSnapshot: (project: {
      tracks: ProjectJSON["tracks"]
      version: number
      backgroundColor?: string
      metadata?: ProjectJSON["metadata"]
    }) => void
  },
  markers: AdMarker[]
) {
  const project = editor.getProject()
  const merged = mergeAdMarkersIntoProject(project, markers)
  editor.loadProjectSnapshot({
    tracks: merged.tracks,
    version: merged.version,
    backgroundColor: merged.backgroundColor,
    metadata: merged.metadata,
  })
}

export function getAdMarkerElementsFromProject(project: ProjectJSON) {
  const adTrack = project.tracks.find(
    (track) =>
      track.id === AD_MARKERS_TRACK_ID || track.name === AD_MARKERS_TRACK_NAME
  )
  return adTrack?.elements ?? []
}

export function isAdMarkerElement(element: ElementJSON) {
  return element.props?.adMode != null
}
