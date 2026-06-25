import Link from "next/link"
import clsx from "clsx"

export function NavLink({
  href,
  children,
  className,
}: {
  href: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "inline-block rounded-lg px-2 py-1 text-sm text-text-secondary hover:bg-surface-overlay hover:text-text-primary",
        className
      )}
    >
      {children}
    </Link>
  )
}

