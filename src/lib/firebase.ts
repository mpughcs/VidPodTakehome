import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app"
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth"
import { getFunctions, connectFunctionsEmulator, type Functions } from "firebase/functions"
import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore"

// NOTE: This module is imported by client components.
// In Next, `process.env.X` is replaced at build time, but *dynamic* access
// like `process.env[name]` will not be inlined and will be `undefined` at runtime.
const firebaseEnv = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
} as const

function assertFirebaseEnv() {
  const required: Array<keyof typeof firebaseEnv> = [
    "apiKey",
    "authDomain",
    "projectId",
    "appId",
  ]
  for (const key of required) {
    if (!firebaseEnv[key]) {
      const envName =
        key === "apiKey"
          ? "NEXT_PUBLIC_FIREBASE_API_KEY"
          : key === "authDomain"
            ? "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
            : key === "projectId"
              ? "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
              : "NEXT_PUBLIC_FIREBASE_APP_ID"
      throw new Error(
        `[firebase] Missing required environment variable: ${envName}. ` +
          `Set it in your environment (e.g. .env.local).`
      )
    }
  }
}

function getFirebaseConfig() {
  assertFirebaseEnv()
  return {
    apiKey: firebaseEnv.apiKey!,
    authDomain: firebaseEnv.authDomain!,
    projectId: firebaseEnv.projectId!,
    storageBucket: firebaseEnv.storageBucket,
    messagingSenderId: firebaseEnv.messagingSenderId,
    appId: firebaseEnv.appId!,
  }
}

/** Use emulators when app is open at localhost/127.0.0.1 or when explicitly enabled via env. */
function useEmulators(): boolean {
  if (typeof window !== "undefined") {
    const host = window.location.hostname
    return host === "localhost" || host === "127.0.0.1"
  }
  return process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true"
}

export function getFirebaseApp(): FirebaseApp {
  if (getApps().length) return getApp()
  return initializeApp(getFirebaseConfig())
}

let _functions: Functions | null = null
export function getFirebaseFunctions(): Functions {
  if (_functions) return _functions
  _functions = getFunctions(getFirebaseApp(), "us-central1")
  if (useEmulators()) {
    connectFunctionsEmulator(_functions, "127.0.0.1", 5001)
  }
  return _functions
}

let _auth: Auth | null = null
export function getFirebaseAuth(): Auth {
  if (_auth) return _auth
  _auth = getAuth(getFirebaseApp())
  if (useEmulators()) {
    connectAuthEmulator(_auth, "http://127.0.0.1:9099", { disableWarnings: true })
  }
  return _auth
}

let _firestore: Firestore | null = null
export function getFirebaseFirestore(): Firestore {
  if (_firestore) return _firestore
  _firestore = getFirestore(getFirebaseApp())
  if (useEmulators()) {
    connectFirestoreEmulator(_firestore, "127.0.0.1", 8080)
  }
  return _firestore
}

