import Link from "next/link"

export function SignInPrompt() {
  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center px-6 py-16">
      <div className="max-w-lg rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Sign in required
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">
          Sign in to manage episodes
        </h1>
        <p className="mt-3 text-slate-500">
          Your workspace data is protected. Sign in or create an account to
          create episodes and ad markers.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/login" className="btn btn-primary rounded-xl px-8">
            Sign in
          </Link>

        </div>
      </div>
    </div>
  )
}
