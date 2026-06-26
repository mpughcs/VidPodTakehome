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
