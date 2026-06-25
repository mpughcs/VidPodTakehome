import {
  addDoc,
  collection,
  deleteDoc,
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
import type {
  AdMarker,
  AdMarkerMode,
  CreateAdMarkerInput,
  UpdateAdMarkerInput,
} from "@/types/ad-marker"

type FirestoreAdMarker = {
  episodeId: string
  startSeconds: number
  endSeconds: number
  mode: AdMarkerMode
  createdAt?: { toDate: () => Date }
  updatedAt?: { toDate: () => Date }
}

function markersCollection(episodeId: string) {
  return collection(getFirebaseFirestore(), "episodes", episodeId, "adMarkers")
}

function toAdMarker(
  episodeId: string,
  id: string,
  data: FirestoreAdMarker
): AdMarker {
  return {
    id,
    episodeId,
    startSeconds: data.startSeconds,
    endSeconds: data.endSeconds,
    mode: data.mode,
    createdAt: data.createdAt?.toDate().toISOString() ?? new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate().toISOString() ?? new Date().toISOString(),
  }
}

export async function listAdMarkers(episodeId: string): Promise<AdMarker[]> {
  const snapshot = await getDocs(
    query(markersCollection(episodeId), orderBy("startSeconds", "asc"))
  )

  return snapshot.docs.map((docSnap) =>
    toAdMarker(episodeId, docSnap.id, docSnap.data() as FirestoreAdMarker)
  )
}

export function subscribeAdMarkers(
  episodeId: string,
  onChange: (markers: AdMarker[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    query(markersCollection(episodeId), orderBy("startSeconds", "asc")),
    (snapshot) => {
      const markers = snapshot.docs.map((docSnap) =>
        toAdMarker(episodeId, docSnap.id, docSnap.data() as FirestoreAdMarker)
      )
      onChange(markers)
    },
    (error) => {
      onError?.(error)
      console.error("[ad-markers-db] subscription error:", error)
    }
  )
}

export async function createAdMarker(
  episodeId: string,
  input: CreateAdMarkerInput
): Promise<AdMarker> {
  const docRef = await addDoc(markersCollection(episodeId), {
    episodeId,
    startSeconds: input.startSeconds,
    endSeconds: input.endSeconds,
    mode: input.mode,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return {
    id: docRef.id,
    episodeId,
    startSeconds: input.startSeconds,
    endSeconds: input.endSeconds,
    mode: input.mode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export async function updateAdMarker(
  episodeId: string,
  markerId: string,
  input: UpdateAdMarkerInput
): Promise<void> {
  const docRef = doc(getFirebaseFirestore(), "episodes", episodeId, "adMarkers", markerId)
  await updateDoc(docRef, {
    ...input,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteAdMarker(
  episodeId: string,
  markerId: string
): Promise<void> {
  const docRef = doc(getFirebaseFirestore(), "episodes", episodeId, "adMarkers", markerId)
  await deleteDoc(docRef)
}

const DEFAULT_SEED_MARKERS: CreateAdMarkerInput[] = [
  { startSeconds: 30, endSeconds: 45, mode: "auto" },
  { startSeconds: 60, endSeconds: 75, mode: "static" },
  { startSeconds: 90, endSeconds: 105, mode: "ab" },
]

export async function seedDefaultAdMarkersIfEmpty(
  episodeId: string
): Promise<AdMarker[]> {
  const existing = await listAdMarkers(episodeId)
  if (existing.length > 0) return existing

  const created: AdMarker[] = []
  for (const marker of DEFAULT_SEED_MARKERS) {
    created.push(await createAdMarker(episodeId, marker))
  }
  return created
}
