import type { User } from "firebase/auth"

import { getFirebaseAuth } from "@/lib/firebase"

/** Wait until Auth has restored the session and Firestore can attach the ID token. */
export async function waitForFirebaseAuthUser(): Promise<User | null> {
  const auth = getFirebaseAuth()
  await auth.authStateReady()

  const user = auth.currentUser
  if (!user) return null

  // Force token fetch so the first Firestore request is authenticated.
  await user.getIdToken()
  return user
}
