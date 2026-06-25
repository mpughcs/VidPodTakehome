"use client"

import { type ReactNode } from "react"

import { UserProvider } from "@/context/UserContext"
import { getMissingFirebaseEnvKeys } from "@/lib/firebase-env"

function FirebaseEnvGuard({ children }: { children: ReactNode }) {
  const missingKeys = getMissingFirebaseEnvKeys()

  if (missingKeys.length > 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-lg rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">
            Firebase environment not configured
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            These variables are missing or empty. Add them to{" "}
            <code className="rounded bg-slate-100 px-1">.env.local</code> in
            the project root, then restart the dev server.
          </p>
          <ul className="mt-4 list-inside list-disc text-sm text-red-600">
            {missingKeys.map((key) => (
              <li key={key}>{key}</li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseEnvGuard>
      <UserProvider>{children}</UserProvider>
    </FirebaseEnvGuard>
  )
}
