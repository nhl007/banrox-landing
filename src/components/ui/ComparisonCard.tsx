import Image from "next/image";
import type { ReactNode } from "react";

/*
 * Shell for the "alone vs together" panels — 564x628 on the artboard.
 *
 * The decorative layers are kept as separate elements rather than baked into
 * one image so they can be animated independently later. Each carries a
 * data-animate hook:
 *   [data-animate="glow"]    the bloom behind the squad card
 *   [data-animate="texture"] the dot-matrix "circuit" wash on the edges
 *   [data-animate="ring"]    the three concentric orbit rings
 *
 * The rings also carry a light that runs round each of them — see .ring-orbit
 * in globals.css. It is a sibling of the artwork rather than something done to
 * it, because these circles are radially symmetric: rotating the ring itself
 * would animate nothing you could see.
 */

const CARD_W = 564;
const CARD_H = 628;

/**
 * Ring diameters and their untranslated tops, from the artboard, plus how long
 * a light takes to go round each.
 *
 * Inner fastest, which is both what orbits do and what stops the three reading
 * as one rigid object turning. The three periods share no factors, so the
 * lights drift in and out of alignment instead of meeting in the same place
 * every cycle.
 */
const RINGS = [
  { src: "/compare/ring-outer.png", size: 416, top: 42, spin: 17 },
  { src: "/compare/ring-mid.svg", size: 340, top: 79.86, spin: 13 },
  { src: "/compare/ring-inner.svg", size: 304, top: 97.86, spin: 9 },
] as const;

export type ComparisonCardProps = {
  variant: "alone" | "squad";
  children: ReactNode;
  className?: string;
  /** Hook for the scroll sequence; lands on the card's own 564x628 root. */
  reveal?: string;
};

export default function ComparisonCard({
  variant,
  children,
  className = "",
  reveal,
}: ComparisonCardProps) {
  const isSquad = variant === "squad";
  // Figma nudges the squad rings 1.5px right and 5px down.
  const ringDx = isSquad ? 1.5 : 0;
  const ringDy = isSquad ? 5 : 0;

  return (
    // ring, not border: Figma aligns this 2px stroke to the *outside* of the
    // 564x628 frame. A CSS border would eat 2px of the padding box and shift
    // every absolutely-placed child inward by 2px.
    <div
      className={`relative shrink-0 overflow-hidden rounded-3xl ring-2 ring-white/10 bg-[rgba(0,3,20,0.7)] ${className}`.trim()}
      style={{ width: CARD_W, height: CARD_H }}
      data-reveal={reveal}
    >
      {isSquad ? (
        <div data-animate="glow">
          <Image
            src="/compare/glow-1.svg"
            alt=""
            width={770}
            height={328}
            className="pointer-events-none absolute -top-[126px] -left-[102px] max-w-none"
          />
          <Image
            src="/compare/glow-2.svg"
            alt=""
            width={585}
            height={324}
            className="pointer-events-none absolute -top-[122px] -left-[9px] max-w-none"
          />
          <Image
            src="/compare/glow-3.svg"
            alt=""
            width={387}
            height={328}
            className="pointer-events-none absolute -top-[126px] left-[69px] max-w-none mix-blend-plus-lighter"
          />
        </div>
      ) : null}

      {/* Halftone grid revealed in soft patches around the card edges. */}
      <Image
        src={
          isSquad ? "/compare/texture-squad.svg" : "/compare/texture-alone.svg"
        }
        alt=""
        width={619}
        height={716}
        data-animate="texture"
        className="pointer-events-none absolute left-0 max-w-none"
        style={{ top: isSquad ? -3 : -5.5 }}
      />

      {RINGS.map((ring) => (
        /*
         * The placement moves to a wrapper so the light inside can own its
         * transform outright: it is animated with `rotate`, and the centring
         * here is a `translate` — one transform property, two owners, and the
         * ring would snap to the card's left edge the moment the animation
         * took over.
         */
        <div
          key={ring.src}
          className="pointer-events-none absolute left-1/2 -translate-x-1/2"
          style={{
            width: ring.size,
            height: ring.size,
            top: ring.top + ringDy,
            marginLeft: ringDx,
          }}
        >
          <Image
            src={ring.src}
            alt=""
            width={ring.size}
            height={ring.size}
            data-animate="ring"
            className="absolute inset-0 block max-w-none"
            style={{ width: ring.size, height: ring.size }}
          />
          {/*
            Inset negative so the box is wider than the circle it lights: the
            ring sits exactly on this wrapper's edge, and a glow centred there
            would have its outer half clipped away.
          */}
          <div
            className="ring-orbit absolute inset-[-6%] rounded-[50%]"
            style={
              {
                "--orbit": `${ring.spin}s`,
                /*
                 * A third of a turn ahead on the squad card. The two panels are
                 * the same artwork side by side, so lights running in lockstep
                 * read as one object mirrored rather than as two. Negative, so
                 * it starts already advanced instead of waiting to begin.
                 */
                animationDelay: isSquad ? `-${ring.spin / 3}s` : undefined,
              } as React.CSSProperties
            }
          />
        </div>
      ))}

      {children}
    </div>
  );
}
