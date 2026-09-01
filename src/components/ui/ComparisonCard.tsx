import Image from "next/image";
import type { ReactNode } from "react";

/* Shell for the "alone vs together" panels — 564x628 on the artboard. */

const CARD_W = 564;
const CARD_H = 628;

/**
 * The same panel on the phone's frame: 370x514 rather than 564x628, with
 * everything inside it drawn at three quarters the size and re-placed.
 */
const PHONE_W = 370;
const PHONE_H = 514;

/**
 * Ring diameters and their untranslated tops, from the artboard, plus how long
 * a light takes to go round each.
 */
const RINGS = {
  wide: [
    { src: "/compare/ring-outer.png", size: 416, top: 42, spin: 17 },
    { src: "/compare/ring-mid.svg", size: 340, top: 79.86, spin: 13 },
    { src: "/compare/ring-inner.svg", size: 304, top: 97.86, spin: 9 },
  ],
  phone: [
    { src: "/compare/ring-outer.png", size: 312, top: 40, spin: 17 },
    { src: "/compare/ring-mid.svg", size: 255, top: 68.4, spin: 13 },
    { src: "/compare/ring-inner.svg", size: 228, top: 81.9, spin: 9 },
  ],
} as const;

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
  // Figma nudges the squad rings 1.5px right and 5px down on the wide panel,
  // and 1.5 right / 3.75 down (the same 5, at 0.75) on the phone's. The alone
  // panel's are centred up here and carry the same 1.5 down there — Figma moved
  // the whole group when it redrew the frame, and 1.5px is what it landed on.
  const ringDx = isSquad ? 1.5 : 0;
  const ringDy = isSquad ? 5 : 0;

  const ring = (tier: keyof typeof RINGS, dx: number, dy: number) =>
    RINGS[tier].map((r) => (
      /*
       * The placement moves to a wrapper so the light inside can own its
       * transform outright: it is animated with `rotate`, and the centring
       * here is a `translate` — one transform property, two owners, and the
       * ring would snap to the card's left edge the moment the.
       */
      <div
        key={`${tier}-${r.src}`}
        className={`pointer-events-none absolute left-1/2 -translate-x-1/2 ${
          tier === "phone" ? "sm:hidden" : "hidden sm:block"
        }`}
        style={{
          width: r.size,
          height: r.size,
          top: r.top + dy,
          marginLeft: dx,
        }}
      >
        <Image
          src={r.src}
          alt=""
          width={r.size}
          height={r.size}
          data-animate="ring"
          className="absolute inset-0 block max-w-none"
          style={{ width: r.size, height: r.size }}
        />
        {/*
         * Inset negative so the box is wider than the circle it lights: the ring sits
         * exactly on this wrapper's edge, and a glow centred there would have its
         * outer half clipped away.
         */}
        <div
          className="ring-orbit absolute inset-[-6%] rounded-[50%]"
          style={
            {
              "--orbit": `${r.spin}s`,
              /* A third of a turn ahead on the squad card. */
              animationDelay: isSquad ? `-${r.spin / 3}s` : undefined,
            } as React.CSSProperties
          }
        />
      </div>
    ));

  return (
    // ring, not border: Figma aligns this 2px stroke to the *outside* of the
    // 564x628 frame. A CSS border would eat 2px of the padding box and shift
    // every absolutely-placed child inward by 2px.
    <div
      /*
       * An artboard in both tiers, at the size its own frame is drawn: 370x514
       * on the phone, 564x628 from the gate up.
       */
      className={`relative h-[var(--phone-h)] w-[var(--phone-w)] shrink-0 overflow-hidden rounded-3xl bg-[rgba(0,3,20,0.7)] ring-2 ring-white/10 sm:h-[var(--card-h)] sm:w-[var(--card-w)] ${className}`.trim()}
      style={
        {
          "--card-w": `${CARD_W}px`,
          "--card-h": `${CARD_H}px`,
          "--phone-w": `${PHONE_W}px`,
          "--phone-h": `${PHONE_H}px`,
        } as React.CSSProperties
      }
      data-reveal={reveal}
    >
      {isSquad ? (
        /*
         * The bloom over the top of the squad panel, in the wide panel's own
         * coordinates — a 564-wide box centred on the card, so the three
         * layers keep the offsets they were drawn with in both tiers.
         */
        <div
          className="pointer-events-none absolute top-[48.5px] left-1/2 w-[564px] origin-top -translate-x-1/2 scale-75 sm:top-0 sm:w-full sm:scale-100"
          data-animate="glow"
        >
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
      <div
        className="pointer-events-none absolute top-0 left-0 h-[177px] w-[311px] overflow-hidden sm:h-full sm:w-full"
        style={{ marginTop: isSquad ? -3 : -5.5 }}
      >
        <Image
          src={
            isSquad
              ? "/compare/texture-squad.svg"
              : "/compare/texture-alone.svg"
          }
          alt=""
          width={619}
          height={716}
          data-animate="texture"
          className="absolute top-0 left-0 block max-w-none"
        />
      </div>

      {ring("phone", 1.5, isSquad ? 3.75 : 0)}
      {ring("wide", ringDx, ringDy)}

      {children}
    </div>
  );
}
