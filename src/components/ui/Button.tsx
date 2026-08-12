import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "md" | "lg";

/*
 * Figma pads these asymmetrically — 32px leading, 24px trailing — so a label
 * with a trailing icon sits optically centred. That holds for every variant.
 *
 * `translate` is in the transition list, not `transform`. Tailwind v4 compiles
 * its translate, scale and rotate utilities to the standalone CSS properties of
 * those names rather than into one `transform`, so a list naming `transform`
 * transitions nothing they write and the lift below would snap, not ease.
 *
 * group/btn is named rather than bare: the trailing icon leans on it, and an
 * unnamed group would also be claimed by any grouped ancestor a caller drops
 * this button into.
 */
const base =
  "group/btn inline-flex shrink-0 items-center justify-center gap-2 rounded-lg pl-8 pr-6 whitespace-nowrap transition-[translate,box-shadow,background-color,filter,opacity] duration-300 ease-out motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-lighter";

/*
 * Rising to meet the cursor, and pressed back down on click.
 *
 * The press is the half of this that is easy to leave out and the half that
 * makes the button feel like a button — without it a click lands on something
 * already lifted and nothing acknowledges it. Much faster than the lift, too:
 * a press that eases over 300ms reads as lag, not as depression.
 */
const lift = "hover:-translate-y-0.5 active:translate-y-0 active:duration-75";

/*
 * The primary ring is a white gradient rather than the flat white Figma's
 * export claims, so the border is transparent and .bg-brand-cta paints it —
 * along with the light that periodically passes through it. Both live in that
 * one class: the ring and the sweep are layers of the same background, and
 * splitting them would mean re-deriving the clip that keeps them on the border.
 *
 * Which is also why hover brightens the primary with a filter instead of
 * restating the gradient: the ring, the fill and the travelling light are four
 * layers of one background-image, and there is no hover state that could edit
 * one of them without writing out all four again. brightness lifts the ring
 * with the fill, and leaves the sweep alone — it is already pure white, and
 * white does not brighten.
 *
 * The bloom under it is the page's own: #264bff, the same brand-deep the footer
 * cards throw when they lift.
 */
const variants: Record<ButtonVariant, string> = {
  primary: `bg-brand-cta border-[1.5px] border-transparent text-white font-medium ${lift} hover:brightness-110 hover:shadow-[0_10px_24px_-8px_rgba(38,75,255,0.75)]`,
  secondary: `bg-white/[0.04] text-white font-medium ${lift} hover:bg-white/[0.09] hover:shadow-[0_10px_24px_-12px_rgba(226,230,255,0.4)]`,
  /* No lift: this one is a text link sitting in the nav pill, and it matches
     the plain links beside it rather than the filled buttons. */
  ghost: "text-ink hover:opacity-70",
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
  const classes =
    `${base} ${variants[variant]} ${sizes[size]} ${className}`.trim();
  const content = (
    <>
      {children}
      {/*
        The icon leans the way it points. Every caller passes ArrowUpRight, and
        an arrow that travels up and right on hover is the button previewing
        what pressing it does — which is a nudge worth more than a bigger one
        in some arbitrary direction.

        inline-flex on the wrapper so it hugs the glyph: as a plain span it
        would be an inline box carrying the font's line-height, which is taller
        than the 18px icon and would shift it off the label's centre line.
      */}
      {icon ? (
        <span className="inline-flex transition-[translate] duration-300 ease-out motion-reduce:transition-none group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5">
          {icon}
        </span>
      ) : null}
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
