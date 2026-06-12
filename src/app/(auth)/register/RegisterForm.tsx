"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/Button"
import { SelectField, TextField } from "@/components/Fields"
import { useAuth } from "@/context/AuthContext"

export function RegisterForm() {
  const router = useRouter()
  const { register } = useAuth()

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const form = new FormData(e.currentTarget)
      const firstName = String(form.get("first_name") ?? "")
      const lastName = String(form.get("last_name") ?? "")
      const email = String(form.get("email") ?? "")
      const password = String(form.get("password") ?? "")

      const displayName = `${firstName} ${lastName}`.trim() || undefined
      await register({ email, password, displayName })

      router.push("/")
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign up failed"
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2"
    >
      <TextField
        label="First name"
        name="first_name"
        type="text"
        autoComplete="given-name"
        required
      />
      <TextField
        label="Last name"
        name="last_name"
        type="text"
        autoComplete="family-name"
        required
      />
      <TextField
        className="col-span-full"
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <TextField
        className="col-span-full"
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
      />
      {/* <SelectField
        className="col-span-full"
        label="How did you hear about us?"
        name="referral_source"
      >
        <option>AltaVista search</option>
        <option>Super Bowl commercial</option>
        <option>Our route 34 city bus ad</option>
        <option>The “Never Use This” podcast</option>
      </SelectField> */}
      {error ? (
        <p className="-mt-2 text-sm text-red-500 sm:col-span-full" role="alert">
          {error}
        </p>
      ) : null}
      <div className="col-span-full">
        <Button
          type="submit"
          variant="solid"
          color="blue"
          className="w-full"
          disabled={submitting}
        >
          <span>
            {submitting ? "Signing up…" : "Sign up"}{" "}
            <span aria-hidden="true">&rarr;</span>
          </span>
        </Button>
      </div>
    </form>
  )
}

