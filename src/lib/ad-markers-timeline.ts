import type { ProjectJSON } from "@twick/timeline"

import {
  AD_MARKERS_TRACK_NAME,
  AD_MARKER_MODE_LABELS,
  type AdMarker,
} from "@/types/ad-marker"

export const AD_MARKERS_TRACK_ID = "track-ads"

export function adMarkersToTrackElements(markers: AdMarker[]) {
  return markers.map((marker) => ({
    id: marker.id,
    type: "video" as const,
    name: AD_MARKER_MODE_LABELS[marker.mode],
    s: marker.startSeconds,
    e: marker.endSeconds,
    props: { adMode: marker.mode },
  }))
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

export function syncAdMarkersToEditor(
  editor: { getProject: () => ProjectJSON; loadProject: (project: ProjectJSON) => void },
  markers: AdMarker[]
) {
  const project = editor.getProject()
  editor.loadProject(mergeAdMarkersIntoProject(project, markers))
}
