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

  return { kind: "episode", episodeTime: clamped }
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
  adOffset: number
): number {
  if (phase === "ad" && marker) {
    return marker.startSeconds + adOffset
  }
  return episodeTime
}
