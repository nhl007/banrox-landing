import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "md" | "lg";

/*
 * Figma pads these asymmetrically — 32px leading, 24px trailing — so a label
 * with a trailing icon sits optically centred. That holds for every variant.
 */
const base =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg pl-8 pr-6 whitespace-nowrap transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-lighter";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand-radial border-[1.5px] border-white text-white font-medium",
  secondary: "bg-white/[0.04] text-white font-medium",
  ghost: "text-ink",
};

const sizes: Record<ButtonSize, string> = {
  md: "h-12 text-base tracking-[-0.32px]",
  lg: "h-14 text-lg tracking-[-0.36px]",
};

type BaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Rendered after the label, e.g. <ArrowUpRight />. */
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
};

type ButtonAsLink = BaseProps & { href: string } & Omit<
    ComponentPropsWithoutRef<typeof Link>,
    "href" | "className" | "children"
  >;

type ButtonAsButton = BaseProps & { href?: never } & Omit<
    ComponentPropsWithoutRef<"button">,
    "className" | "children"
  >;

export type ButtonProps = ButtonAsLink | ButtonAsButton;

export default function Button({
  variant = "primary",
  size = "md",
  icon,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`.trim();
  const content = (
    <>
      {children}
      {icon}
    </>
  );

  if ("href" in props && props.href !== undefined) {
    const { href, ...linkProps } = props as ButtonAsLink;
    return (
      <Link href={href} className={classes} {...linkProps}>
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} {...(props as ButtonAsButton)}>
      {content}
    </button>
  );
}
