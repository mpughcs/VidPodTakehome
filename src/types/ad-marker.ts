import { formatTimeHms } from "@/lib/time-format"

export type AdMarkerMode = "static" | "auto" | "ab"

export type AdMarker = {
  id: string
  episodeId: string
  startSeconds: number
  endSeconds: number
  mode: AdMarkerMode
  adId?: string
  adIds?: string[]
  createdAt: string
  updatedAt: string
}

export type CreateAdMarkerInput = {
  startSeconds: number
  endSeconds: number
  mode: AdMarkerMode
  adId?: string
  adIds?: string[]
}

export type UpdateAdMarkerInput = Partial<CreateAdMarkerInput>

export function formatMarkerTime(totalSeconds: number): string {
  return formatTimeHms(totalSeconds)
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
