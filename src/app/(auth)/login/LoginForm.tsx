"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"

import { TextField } from "@/components/Fields"
import { useAuth } from "@/context/AuthContext"

export function LoginForm() {
  const router = useRouter()
  const { login } = useAuth()

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const form = new FormData(e.currentTarget)
      const email = String(form.get("email") ?? "")
      const password = String(form.get("password") ?? "")

      await login(email, password)
      router.push("/")
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed"
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-10 grid grid-cols-1 gap-y-8">
      <TextField
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <TextField
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      {error ? (
        <p className="-mt-2 text-sm text-red-500" role="alert">
          {error}
        </p>
      ) : null}
      <div>
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={submitting}
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </div>
    </form>
  )
}

