import type { TrackJSON } from "@twick/timeline"

export const TIMELINE_ZOOM_MIN = 0.5
export const TIMELINE_ZOOM_MAX = 4

export function getTimelineDuration(
  tracks: TrackJSON[],
  fallbackDuration: number
): number {
  let maxEnd = 0
  for (const track of tracks) {
    for (const element of track.elements ?? []) {
      maxEnd = Math.max(maxEnd, element.e)
    }
  }
  return maxEnd || fallbackDuration
}

export function getVisibleDuration(
  timelineDuration: number,
  zoom: number
): number {
  return timelineDuration / zoom
}

export function clampViewportStart(
  viewportStart: number,
  timelineDuration: number,
  visibleDuration: number
): number {
  const maxStart = Math.max(0, timelineDuration - visibleDuration)
  return Math.min(maxStart, Math.max(0, viewportStart))
}

/** Keep the playhead at the same fraction of the visible window when zoom changes. */
export function zoomAroundPlayhead({
  currentZoom,
  nextZoom,
  timelineDuration,
  viewportStart,
  playhead,
}: {
  currentZoom: number
  nextZoom: number
  timelineDuration: number
  viewportStart: number
  playhead: number
}): { zoom: number; viewportStart: number } {
  const clampedZoom = Math.min(
    TIMELINE_ZOOM_MAX,
    Math.max(TIMELINE_ZOOM_MIN, nextZoom)
  )
  const oldVisible = getVisibleDuration(timelineDuration, currentZoom)
  const newVisible = getVisibleDuration(timelineDuration, clampedZoom)
  const fraction =
    oldVisible > 0
      ? Math.min(1, Math.max(0, (playhead - viewportStart) / oldVisible))
      : 0.5

  return {
    zoom: clampedZoom,
    viewportStart: clampViewportStart(
      playhead - fraction * newVisible,
      timelineDuration,
      newVisible
    ),
  }
}
