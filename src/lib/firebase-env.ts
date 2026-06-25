/**
 * Firebase client config from env.
 *
 * Next.js only inlines `process.env.NEXT_PUBLIC_*` when referenced statically
 * (not via process.env[variableName]). Keep these as literal property names.
 */
export type FirebaseClientConfig = {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

const ENV_KEYS = {
  apiKey: "NEXT_PUBLIC_FIREBASE_API_KEY",
  authDomain: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  projectId: "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  storageBucket: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  appId: "NEXT_PUBLIC_FIREBASE_APP_ID",
} as const

function readRawFirebaseEnv() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  }
}

export function getMissingFirebaseEnvKeys(): string[] {
  const raw = readRawFirebaseEnv()
  return (Object.keys(ENV_KEYS) as Array<keyof typeof ENV_KEYS>).flatMap(
    (key) => (raw[key] ? [] : [ENV_KEYS[key]])
  )
}

export function getFirebaseClientConfig(): FirebaseClientConfig {
  const raw = readRawFirebaseEnv()
  const missing = getMissingFirebaseEnvKeys()

  if (missing.length > 0) {
    throw new Error(
      `[firebase] Missing environment variable(s): ${missing.join(", ")}. ` +
        "Add them to .env.local in the project root, then restart the dev server " +
        "(Next.js only picks up env changes on restart)."
    )
  }

  return {
    apiKey: raw.apiKey,
    authDomain: raw.authDomain,
    projectId: raw.projectId,
    storageBucket: raw.storageBucket,
    messagingSenderId: raw.messagingSenderId,
    appId: raw.appId,
  }
}

export function useFirebaseEmulators(): boolean {
  return process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true"
}
