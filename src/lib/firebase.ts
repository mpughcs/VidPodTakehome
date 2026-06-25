import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app"
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth"
import { getFunctions, connectFunctionsEmulator, type Functions } from "firebase/functions"
import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore"

import {
  getFirebaseClientConfig,
  useFirebaseEmulators,
} from "@/lib/firebase-env"

export function getFirebaseApp(): FirebaseApp {
  if (getApps().length) return getApp()
  return initializeApp(getFirebaseClientConfig())
}

let _functions: Functions | null = null
export function getFirebaseFunctions(): Functions {
  if (_functions) return _functions
  _functions = getFunctions(getFirebaseApp(), "us-central1")
  if (useFirebaseEmulators()) {
    connectFunctionsEmulator(_functions, "127.0.0.1", 5001)
  }
  return _functions
}

let _auth: Auth | null = null
export function getFirebaseAuth(): Auth {
  if (_auth) return _auth
  _auth = getAuth(getFirebaseApp())
  if (useFirebaseEmulators()) {
    connectAuthEmulator(_auth, "http://127.0.0.1:9099", { disableWarnings: true })
  }
  return _auth
}

let _firestore: Firestore | null = null
export function getFirebaseFirestore(): Firestore {
  if (_firestore) return _firestore
  _firestore = getFirestore(getFirebaseApp())
  if (useFirebaseEmulators()) {
    connectFirestoreEmulator(_firestore, "127.0.0.1", 8080)
  }
  return _firestore
}

export { getMissingFirebaseEnvKeys } from "@/lib/firebase-env"
