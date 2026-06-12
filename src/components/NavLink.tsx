import Link from "next/link"

export function NavLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="inline-block rounded-lg px-2 py-1 text-sm text-text-secondary hover:bg-surface-overlay hover:text-text-primary"
    >
      {children}
    </Link>
  )
}

