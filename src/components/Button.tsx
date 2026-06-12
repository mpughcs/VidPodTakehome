import Link from "next/link"
import clsx from "clsx"

const baseStyles = {
  solid:
    "group inline-flex items-center justify-center rounded-full py-2 px-4 text-sm font-semibold focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2",
  outline:
    "group inline-flex ring-1 items-center justify-center rounded-full py-2 px-4 text-sm focus:outline-hidden",
}

const variantStyles = {
  solid: {
    slate:
      "bg-surface-invert text-text-invert hover:bg-text-secondary hover:text-surface active:bg-text-primary active:text-text-muted focus-visible:outline-surface-invert",
    blue: "bg-brand text-brand-foreground hover:text-brand-foreground hover:bg-brand-hover active:bg-brand-hover active:text-brand-foreground focus-visible:outline-brand",
    white:
      "bg-surface text-text-primary hover:bg-brand-muted active:bg-brand-muted active:text-text-secondary focus-visible:outline-surface",
  },
  outline: {
    slate:
      "ring-border text-text-secondary hover:text-text-primary hover:ring-border-strong active:bg-surface-overlay active:text-text-secondary focus-visible:outline-brand focus-visible:ring-border-strong",
    white:
      "ring-text-muted text-text-invert hover:ring-text-tertiary active:ring-text-muted active:text-text-muted focus-visible:outline-surface",
  },
}

type ButtonProps = (
  | {
      variant?: "solid"
      color?: keyof typeof variantStyles.solid
    }
  | {
      variant: "outline"
      color?: keyof typeof variantStyles.outline
    }
) &
  (
    | Omit<React.ComponentPropsWithoutRef<typeof Link>, "color">
    | (Omit<React.ComponentPropsWithoutRef<"button">, "color"> & {
        href?: undefined
      })
  )

export function Button({ className, ...props }: ButtonProps) {
  props.variant ??= "solid"
  props.color ??= "slate"

  className = clsx(
    baseStyles[props.variant],
    props.variant === "outline"
      ? variantStyles.outline[props.color]
      : props.variant === "solid"
        ? variantStyles.solid[props.color]
        : undefined,
    className
  )

  return typeof props.href === "undefined" ? (
    <button className={className} {...props} />
  ) : (
    <Link className={className} {...props} />
  )
}
