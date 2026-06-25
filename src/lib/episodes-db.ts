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

export type CreateEpisodeInput = {
  title: string
  description?: string
  author?: string
  company?: string
  product?: string
  thumbnail?: string
  duration?: number
}

type FirestoreEpisode = Omit<Episode, "id"> & {
  createdAt?: { toDate: () => Date }
}

const DEFAULT_THUMBNAIL =
  "https://img.daisyui.com/images/profile/demo/batperson@192.webp"

function episodesCollection() {
  return collection(getFirebaseFirestore(), "episodes")
}

function toEpisode(id: string, data: FirestoreEpisode): Episode {
  return {
    id,
    title: data.title,
    author: data.author,
    company: data.company,
    product: data.product,
    description: data.description,
    thumbnail: data.thumbnail,
    duration: data.duration,
    uploadDate: data.uploadDate,
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
    author: input.author?.trim() ?? "Unknown author",
    company: input.company?.trim() ?? "",
    product: input.product?.trim() ?? "",
    thumbnail: input.thumbnail ?? DEFAULT_THUMBNAIL,
    duration: input.duration ?? 300,
    uploadDate,
    createdAt: serverTimestamp(),
  }

  const docRef = await addDoc(episodesCollection(), payload)

  return {
    id: docRef.id,
    title: payload.title,
    description: payload.description,
    author: payload.author,
    company: payload.company,
    product: payload.product,
    thumbnail: payload.thumbnail,
    duration: payload.duration,
    uploadDate: payload.uploadDate,
  }
}

export async function updateEpisode(
  episodeId: string,
  input: Partial<CreateEpisodeInput>
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
