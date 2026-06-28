import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore"
import { getDownloadURL, ref, uploadBytes, getStorage } from "firebase/storage"

import { getFirebaseApp, getFirebaseFirestore } from "@/lib/firebase"
import { getVideoMetadata } from "@/lib/ads-editor-storage"
import type { Ad, CreateAdInput } from "@/types/ad"

type FirestoreAd = Omit<Ad, "id"> & {
  createdAt?: { toDate: () => Date }
}

function adsCollection() {
  return collection(getFirebaseFirestore(), "ads")
}

function toAd(id: string, data: FirestoreAd): Ad {
  return {
    id,
    title: data.title ?? "Untitled ad",
    company: data.company ?? "",
    product: data.product ?? "",
    src: data.src ?? "",
    duration: data.duration,
    uploadDate: data.uploadDate,
    creatorId: data.creatorId,
  }
}

export async function listAds(): Promise<Ad[]> {
  const snapshot = await getDocs(query(adsCollection(), orderBy("uploadDate", "desc")))
  return snapshot.docs.map((docSnap) =>
    toAd(docSnap.id, docSnap.data() as FirestoreAd)
  )
}

export function subscribeAds(
  onChange: (ads: Ad[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    query(adsCollection(), orderBy("uploadDate", "desc")),
    (snapshot) => {
      const ads = snapshot.docs.map((docSnap) =>
        toAd(docSnap.id, docSnap.data() as FirestoreAd)
      )
      onChange(ads)
    },
    (error) => {
      onError?.(error)
      console.error("[ads-db] subscription error:", error)
    }
  )
}

export async function getAd(adId: string): Promise<Ad | null> {
  const docSnap = await getDoc(doc(getFirebaseFirestore(), "ads", adId))
  if (!docSnap.exists()) return null
  return toAd(docSnap.id, docSnap.data() as FirestoreAd)
}

export async function createAd(input: CreateAdInput): Promise<Ad> {
  const uploadDate = new Date().toISOString().slice(0, 10)
  const payload = {
    title: input.title.trim(),
    company: input.company.trim(),
    product: input.product.trim(),
    src: input.src?.trim() ?? "",
    uploadDate,
    creatorId: input.creatorId ?? "",
    createdAt: serverTimestamp(),
    ...(input.duration != null ? { duration: input.duration } : {}),
  }

  const docRef = await addDoc(adsCollection(), payload)

  return {
    id: docRef.id,
    title: payload.title,
    company: payload.company,
    product: payload.product,
    src: payload.src,
    duration: input.duration,
    uploadDate: payload.uploadDate,
    creatorId: payload.creatorId,
  }
}

export async function updateAd(
  adId: string,
  input: Partial<Omit<CreateAdInput, "creatorId">>
): Promise<void> {
  const docRef = doc(getFirebaseFirestore(), "ads", adId)
  const updates: Record<string, unknown> = {}

  if (input.title !== undefined) updates.title = input.title.trim()
  if (input.company !== undefined) updates.company = input.company.trim()
  if (input.product !== undefined) updates.product = input.product.trim()
  if (input.src !== undefined) updates.src = input.src.trim()
  if (input.duration != null) updates.duration = input.duration

  await updateDoc(docRef, updates)
}

export async function deleteAd(adId: string): Promise<void> {
  await deleteDoc(doc(getFirebaseFirestore(), "ads", adId))
}

export async function uploadAdMp4(adId: string, file: File): Promise<string> {
  const storage = getStorage(getFirebaseApp())
  const storageRef = ref(storage, `ads/${adId}.mp4`)

  try {
    await uploadBytes(storageRef, file, {
      contentType: "video/mp4",
    })
    return getDownloadURL(storageRef)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Storage upload failed"
    if (message.includes("unauthorized") || message.includes("permission")) {
      throw new Error(
        "Storage upload denied. Deploy storage rules with: firebase deploy --only storage"
      )
    }
    throw new Error(`Could not upload ad MP4: ${message}`)
  }
}

export async function uploadAdWithMp4(
  input: CreateAdInput,
  file: File
): Promise<Ad> {
  const ad = await createAd(input)

  try {
    const src = await uploadAdMp4(ad.id, file)
    const objectUrl = URL.createObjectURL(file)

    try {
      const { durationSeconds } = await getVideoMetadata(objectUrl)
      await updateAd(ad.id, { src, duration: durationSeconds })
      return { ...ad, src, duration: durationSeconds }
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
  } catch (error) {
    await deleteAd(ad.id).catch(() => undefined)
    if (error instanceof Error) throw error
    throw new Error("Ad upload failed")
  }
}

export function adsToMap(ads: Ad[]): Map<string, Ad> {
  return new Map(ads.map((ad) => [ad.id, ad]))
}
