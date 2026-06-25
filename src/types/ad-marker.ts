export type AdMarkerMode = "static" | "auto" | "ab"

export type AdMarker = {
  id: string
  episodeId: string
  startSeconds: number
  endSeconds: number
  mode: AdMarkerMode
  createdAt: string
  updatedAt: string
}

export type CreateAdMarkerInput = {
  startSeconds: number
  endSeconds: number
  mode: AdMarkerMode
}

export type UpdateAdMarkerInput = Partial<CreateAdMarkerInput>

export const DEFAULT_EPISODE_ID = "episode-503"
export const AD_MARKERS_TRACK_NAME = "Ad markers"
export const DEFAULT_MARKER_DURATION_SECONDS = 15

export const AD_MARKER_MODE_LABELS: Record<AdMarkerMode, string> = {
  static: "Static",
  auto: "Auto",
  ab: "A/B",
}

export const AD_MARKER_MODE_CLASSES: Record<AdMarkerMode, string> = {
  auto: "bg-emerald-100 text-emerald-700",
  static: "bg-sky-100 text-sky-700",
  ab: "bg-amber-100 text-amber-700",
}

export function formatMarkerTime(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function parseMarkerTime(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const parts = trimmed.split(":").map((part) => Number(part))
  if (parts.some((part) => Number.isNaN(part))) return null

  if (parts.length === 2) {
    const [minutes, seconds] = parts
    return minutes * 60 + seconds
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts
    return hours * 3600 + minutes * 60 + seconds
  }

  return null
}
