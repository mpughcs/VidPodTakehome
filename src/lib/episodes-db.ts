import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore"

import { getFirebaseFirestore } from "@/lib/firebase"
import type { Episode } from "@/types/episode"

const DEFAULT_THUMBNAIL =
  "https://img.daisyui.com/images/profile/demo/batperson@192.webp"

export type CreateEpisodeInput = {
  title: string
  description?: string
  thumbnail?: string
  duration?: number
  src?: string
  creatorId: string
}

type FirestoreEpisode = Omit<Episode, "id"> & {
  createdAt?: { toDate: () => Date }
}

function episodesCollection() {
  return collection(getFirebaseFirestore(), "episodes")
}

function toEpisode(id: string, data: FirestoreEpisode): Episode {
  return {
    id,
    title: data.title ?? "Untitled episode",
    description: data.description ?? "",
    thumbnail: data.thumbnail ?? DEFAULT_THUMBNAIL,
    duration: data.duration ?? 300,
    uploadDate: data.uploadDate ?? "",
    creatorId: data.creatorId ?? "",
    src: data.src,
    epNumber: data.epNumber,
  }
}

export async function listEpisodes(): Promise<Episode[]> {
  const snapshot = await getDocs(
    query(episodesCollection(), orderBy("uploadDate", "desc"))
  )
  return snapshot.docs.map((docSnap) =>
    toEpisode(docSnap.id, docSnap.data() as FirestoreEpisode)
  )
}

export function subscribeEpisodes(
  onChange: (episodes: Episode[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    query(episodesCollection(), orderBy("uploadDate", "desc")),
    (snapshot) => {
      const episodes = snapshot.docs.map((docSnap) =>
        toEpisode(docSnap.id, docSnap.data() as FirestoreEpisode)
      )
      onChange(episodes)
    },
    (error) => {
      const err = error as Error & { code?: string }
      onError?.(err)
      console.error("[episodes-db] subscription error:", err)
    }
  )
}

export async function createEpisode(input: CreateEpisodeInput): Promise<Episode> {
  const uploadDate = new Date().toISOString().slice(0, 10)
  const payload = {
    title: input.title.trim(),
    description: input.description?.trim() ?? "",
    thumbnail: input.thumbnail ?? DEFAULT_THUMBNAIL,
    duration: input.duration ?? 300,
    uploadDate,
    src: input.src?.trim() ?? "",
    creatorId: input.creatorId,
    createdAt: serverTimestamp(),
  }

  const docRef = await addDoc(episodesCollection(), payload)

  return {
    id: docRef.id,
    title: payload.title,
    description: payload.description,
    thumbnail: payload.thumbnail,
    duration: payload.duration,
    uploadDate: payload.uploadDate,
    creatorId: payload.creatorId,
    src: payload.src,
  }
}

export async function updateEpisode(
  episodeId: string,
  input: Partial<Omit<CreateEpisodeInput, "creatorId">>
): Promise<void> {
  const docRef = doc(getFirebaseFirestore(), "episodes", episodeId)
  await updateDoc(docRef, {
    ...input,
    ...(input.title ? { title: input.title.trim() } : {}),
    ...(input.description !== undefined
      ? { description: input.description.trim() }
      : {}),
  })
}
