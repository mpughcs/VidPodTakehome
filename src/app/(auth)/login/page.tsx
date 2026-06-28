import { type Metadata } from "next"
import Link from "next/link"

import { Logo } from "@/components/Logo"
import { SlimLayout } from "@/components/SlimLayout"
import { LoginForm } from "@/app/(auth)/login/LoginForm"

export const metadata: Metadata = {
  title: "Sign In",
}

export default function Login() {
  return (
    <SlimLayout
     
    >
      <div className="flex">
        <Link href="/" aria-label="Home">
          <Logo className="h-10 w-auto" />
        </Link>
      </div>
      <h2 className="mt-20 text-lg font-semibold text-text-primary">
        Sign in to your account
      </h2>
      <p className="mt-2 text-sm text-text-secondary">
        Don’t have an account?{" "}
        <Link href="/register" className="font-medium text-brand hover:underline">
          Sign up
        </Link>{" "}
        for a free trial.
      </p>
      <LoginForm />
    </SlimLayout>
  )
}

