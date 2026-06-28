export function isValidMp4File(file: File): boolean {
  return file.type === "video/mp4" || file.name.toLowerCase().endsWith(".mp4")
}

export function titleFromMp4Filename(filename: string): string {
  const base = filename.replace(/\.mp4$/i, "")
  return base.replace(/[-_]+/g, " ").trim() || "Untitled ad"
}
