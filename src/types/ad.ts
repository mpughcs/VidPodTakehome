export type Ad = {
  id: string
  title: string
  company: string
  product: string
  src: string
  duration?: number
  uploadDate?: string
  creatorId?: string
}

export type CreateAdInput = {
  title: string
  company: string
  product: string
  src?: string
  duration?: number
  creatorId?: string
}

export function formatAdDuration(totalSeconds?: number): string {
  if (!totalSeconds || !Number.isFinite(totalSeconds)) return "—"
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${minutes}m ${remainder}s`
}
