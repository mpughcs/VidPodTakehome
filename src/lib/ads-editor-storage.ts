import type { ProjectJSON } from "@twick/timeline"

const PROJECT_KEY_PREFIX = "ads-editor:project"
const DB_NAME = "ads-editor"
const DB_VERSION = 1
const VIDEO_STORE = "video-blobs"

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("default", DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(VIDEO_STORE)) {
        db.createObjectStore(VIDEO_STORE)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveVideoBlob(id: string, blob: Blob): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(VIDEO_STORE, "readwrite")
    tx.objectStore(VIDEO_STORE).put(blob, id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

export async function getVideoBlob(id: string): Promise<Blob | undefined> {
  const db = await openDb()
  const blob = await new Promise<Blob | undefined>((resolve, reject) => {
    const tx = db.transaction(VIDEO_STORE, "readonly")
    const request = tx.objectStore(VIDEO_STORE).get(id)
    request.onsuccess = () => resolve(request.result as Blob | undefined)
    request.onerror = () => reject(request.error)
  })
  db.close()
  return blob
}

export function saveProjectToLocalStorage(
  project: ProjectJSON,
  episodeId: string
) {
  localStorage.setItem(
    `${PROJECT_KEY_PREFIX}:${episodeId}`,
    JSON.stringify(project)
  )
}

export function loadProjectFromLocalStorage(
  episodeId: string
): ProjectJSON | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(`${PROJECT_KEY_PREFIX}:${episodeId}`)
  if (!raw) return null
  try {
    return JSON.parse(raw) as ProjectJSON
  } catch {
    return null
  }
}

export async function hydrateProjectAssets(
  project: ProjectJSON
): Promise<ProjectJSON> {
  if (!project.assets) return project

  const assets = { ...project.assets }

  for (const [assetId, asset] of Object.entries(assets)) {
    const blob = await getVideoBlob(assetId)
    if (!blob) continue
    assets[assetId] = {
      ...asset,
      url: URL.createObjectURL(blob),
    }
  }

  const tracks = project.tracks.map((track) => ({
    ...track,
    elements: track.elements.map((element) => {
      const assetId = element.props?.srcAssetId as string | undefined
      if (!assetId || !assets[assetId]?.url) return element
      return {
        ...element,
        props: {
          ...element.props,
          src: assets[assetId].url,
        },
      }
    }),
  }))

  return { ...project, assets, tracks }
}

export async function getVideoDurationSeconds(objectUrl: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video")
    video.preload = "metadata"
    video.onloadedmetadata = () => {
      resolve(Number.isFinite(video.duration) ? video.duration : 30)
      video.remove()
    }
    video.onerror = () => reject(new Error("Could not read video metadata"))
    video.src = objectUrl
  })
}
