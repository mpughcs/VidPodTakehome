import { type Metadata } from "next"
import Link from "next/link"

import { Logo } from "@/components/Logo"
import { SlimLayout } from "@/components/SlimLayout"
import { RegisterForm } from "@/app/(auth)/register/RegisterForm"

export const metadata: Metadata = {
  title: "Sign Up",
}

export default function Register() {
  return (
    <SlimLayout   press={[
      {
        meta: "Bandcamp Daily · Jan 20, 2026",
        title: `Sunday Mourners, "A-Rhythm Absolute"`,
        quote:
          "It's a great time to be an indie band making anything that sounds post-punk.",
        source: "Bandcamp Daily",
      },
      {
        meta: "Tinnitist · Jan 15, 2026",
        title: "Albums Of The Week: Sunday Mourners | A-Rhythm Absolute",
        quote:
          "Sunday Mourners are here and it is OK. It is OK to feel good about indie music again.",
        source: "Tinnitist",
      },
      {
        meta: "The Tulane Hullabaloo · Jan 25, 2026",
        title: "Sunday Mourners' debut album establishes fresh voice in indie rock",
        quote: "A new Los Angeles band has joined this wave, carving out their own path.",
        source: "The Tulane Hullabaloo",
      },
    ]}>
      <div className="flex">
        <Link href="/" aria-label="Home">
          <Logo className="h-10 w-auto" />
        </Link>
      </div>
      <h2 className="mt-20 text-lg font-semibold text-text-primary">
        Get started for free
      </h2>
      <p className="mt-2 text-sm text-text-secondary">
        Already registered?{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Sign in
        </Link>{" "}
        to your account.
      </p>
      <RegisterForm />
    </SlimLayout>
  )
}

