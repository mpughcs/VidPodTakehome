/** Matches Firebase Storage rule in storage.rules */
export const MAX_MP4_BYTES = 500 * 1024 * 1024

export const MP4_UPLOAD_REQUIREMENTS = "MP4 only. Max file size 500 MB."

export function isValidMp4File(file: File): boolean {
  return file.type === "video/mp4" || file.name.toLowerCase().endsWith(".mp4")
}

export function isValidMp4FileSize(file: File): boolean {
  return file.size < MAX_MP4_BYTES
}

export type Mp4FileValidationResult =
  | { valid: true }
  | { valid: false; error: string }

export function validateMp4File(file: File): Mp4FileValidationResult {
  if (!isValidMp4File(file)) {
    return { valid: false, error: "Only `.mp4` files are supported." }
  }
  if (!isValidMp4FileSize(file)) {
    return { valid: false, error: "File must be under 500 MB." }
  }
  return { valid: true }
}

export function titleFromMp4Filename(filename: string): string {
  const base = filename.replace(/\.mp4$/i, "")
  return base.replace(/[-_]+/g, " ").trim() || "Untitled ad"
}
