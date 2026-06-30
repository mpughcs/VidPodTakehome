import type { Ad } from "@/types/ad"
import type { AdMarker } from "@/types/ad-marker"

export type PlaybackAtContent =
  | { kind: "episode"; episodeTime: number }
  | { kind: "ad"; marker: AdMarker; adOffset: number; ad: Ad | null }

/** Sticky ad pick per marker for auto / A/B (cleared when seeking before the marker). */
export type MarkerAdSelection = Map<string, string>

export type AdResolveOptions = {
  allAds?: Ad[]
  selection?: MarkerAdSelection
  /** Markers whose ad slots expand the content timeline (matches playback display). */
  servedMarkerIds?: ReadonlySet<string>
}

function sortMarkers(markers: AdMarker[]) {
  return [...markers].sort((a, b) => a.startSeconds - b.startSeconds)
}

function pickRandom<T>(items: T[]): T | undefined {
  if (items.length === 0) return undefined
  return items[Math.floor(Math.random() * items.length)]
}

function getPlayableAds(ads: Ad[]) {
  return ads.filter((ad) => Boolean(ad.src))
}

export function resolveAdForMarker(
  marker: AdMarker,
  adsById: Map<string, Ad>,
  options?: AdResolveOptions
): Ad | null {
  const { allAds = [], selection } = options ?? {}

  if (marker.mode === "static" && marker.adId) {
    return adsById.get(marker.adId) ?? null
  }

  const cachedId = selection?.get(marker.id)
  if (cachedId) {
    return adsById.get(cachedId) ?? null
  }

  let chosen: Ad | null = null

  if (marker.mode === "ab" && marker.adIds?.length) {
    const candidates = marker.adIds
      .map((id) => adsById.get(id))
      .filter((ad): ad is Ad => Boolean(ad?.src))
    chosen = pickRandom(candidates) ?? null
  } else if (marker.mode === "auto") {
    chosen = pickRandom(getPlayableAds(allAds)) ?? null
  }

  if (chosen && selection) {
    selection.set(marker.id, chosen.id)
  }

  return chosen
}

/** Map timeline/content position to episode source time (after served ad slots). */
export function contentTimeToEpisodeTime(
  contentSeconds: number,
  markers: AdMarker[],
  servedMarkerIds: ReadonlySet<string> = new Set()
): number {
  const content = Math.max(0, contentSeconds)

  for (const marker of sortMarkers(markers)) {
    if (content >= marker.startSeconds && content < marker.endSeconds) {
      return marker.startSeconds
    }
  }

  let resumeEpisode = 0
  let resumeContentEnd = 0
  for (const marker of sortMarkers(markers)) {
    if (!servedMarkerIds.has(marker.id)) continue
    if (content >= marker.endSeconds) {
      resumeEpisode = marker.startSeconds
      resumeContentEnd = marker.endSeconds
    }
  }

  if (resumeContentEnd > 0) {
    return resumeEpisode + (content - resumeContentEnd)
  }

  return content
}

/** Map episode source time to timeline/content position (accounts for served ad slots). */
export function episodeTimeToContentTime(
  episodeSeconds: number,
  markers: AdMarker[],
  servedMarkerIds: ReadonlySet<string>
): number {
  const episode = Math.max(0, episodeSeconds)

  let resumeEpisode = 0
  let resumeContentEnd = 0
  for (const marker of sortMarkers(markers)) {
    if (!servedMarkerIds.has(marker.id)) continue
    if (episode >= marker.startSeconds) {
      resumeEpisode = marker.startSeconds
      resumeContentEnd = marker.endSeconds
    }
  }

  if (resumeContentEnd > 0) {
    return resumeContentEnd + (episode - resumeEpisode)
  }

  return episode
}

/** Map a content-time scrub position to episode or in-slot ad playback. */
export function resolvePlaybackAtContentTime(
  contentSeconds: number,
  markers: AdMarker[],
  adsById: Map<string, Ad>,
  options?: AdResolveOptions
): PlaybackAtContent {
  const clamped = Math.max(0, contentSeconds)

  for (const marker of sortMarkers(markers)) {
    const slotStart = marker.startSeconds
    const slotEnd = marker.endSeconds
    if (clamped >= slotStart && clamped < slotEnd) {
      return {
        kind: "ad",
        marker,
        adOffset: clamped - slotStart,
        ad: resolveAdForMarker(marker, adsById, options),
      }
    }
  }

  return {
    kind: "episode",
    episodeTime: contentTimeToEpisodeTime(
      clamped,
      markers,
      options?.servedMarkerIds ?? new Set()
    ),
  }
}

export function getContentTimelineDuration(
  markers: AdMarker[],
  episodeDurationSeconds: number
): number {
  let maxEnd = episodeDurationSeconds
  for (const marker of markers) {
    maxEnd = Math.max(maxEnd, marker.endSeconds)
  }
  return maxEnd
}

/** Episode source gaps on the content timeline (purple blocks between ad slots). */
export type EpisodeSrcSegment = {
  timelineStart: number
  timelineEnd: number
}

export function getEpisodeSrcSegments(
  timelineDuration: number,
  markers: AdMarker[]
): EpisodeSrcSegment[] {
  const sorted = sortMarkers(markers)
  const segments: EpisodeSrcSegment[] = []
  let cursor = 0

  for (const marker of sorted) {
    const gapEnd = Math.min(marker.startSeconds, timelineDuration)
    if (gapEnd > cursor + 0.001) {
      segments.push({ timelineStart: cursor, timelineEnd: gapEnd })
    }
    cursor = Math.max(cursor, marker.endSeconds)
  }

  if (cursor < timelineDuration - 0.001) {
    segments.push({ timelineStart: cursor, timelineEnd: timelineDuration })
  }

  return segments
}

export function getAdSlotDuration(marker: AdMarker): number {
  return Math.max(0, marker.endSeconds - marker.startSeconds)
}

export function clearServedMarkersBeforeContentTime(
  contentTime: number,
  servedMarkerIds: Set<string>,
  markers: AdMarker[]
) {
  for (const marker of markers) {
    if (contentTime < marker.startSeconds) {
      servedMarkerIds.delete(marker.id)
    }
  }
}

export function clearMarkerAdSelectionsBeforeContentTime(
  contentTime: number,
  selection: MarkerAdSelection,
  markers: AdMarker[]
) {
  for (const marker of markers) {
    if (contentTime < marker.startSeconds) {
      selection.delete(marker.id)
    }
  }
}

/** Content time shown on the timeline while preview is running. */
export function getDisplayContentTime(
  phase: "episode" | "ad",
  episodeTime: number,
  marker: AdMarker | null,
  adOffset: number,
  markers: AdMarker[] = [],
  servedMarkerIds: ReadonlySet<string> = new Set()
): number {
  if (phase === "ad" && marker) {
    return marker.startSeconds + adOffset
  }
  return episodeTimeToContentTime(episodeTime, markers, servedMarkerIds)
}
