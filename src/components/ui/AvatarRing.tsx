import Image from "next/image";
import type { ReactNode } from "react";
import type { Framing, Person } from "@/data/people";

/*
 * The ringed avatar used by the passport cards, the comparison chips and the
 * squad cluster. Figma always sizes the inner disc at 85% of the ring, which is
 * what keeps the 40/34, 48/40.8 and 56/47.6 pairs consistent.
 */

const INNER_RATIO = 0.85;

const TONES = {
  brand:
    "linear-gradient(180deg, rgb(255,255,255) 0%, rgba(255,255,255,0.1) 100%), linear-gradient(180deg, rgb(93,128,255) 0%, rgba(93,128,255,0.1) 100%), linear-gradient(90deg, rgb(38,75,255) 0%, rgb(38,75,255) 100%)",
  muted:
    "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 100%)",
} as const;

export type AvatarRingProps = {
  size: number;
  person?: Person;
  framing?: Framing;
  tone?: keyof typeof TONES;
  /** Centred inside the ring — used for the shield in "Applying Alone". */
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export default function AvatarRing({
  size,
  person,
  framing,
  tone = "brand",
  children,
  className = "",
  style,
}: AvatarRingProps) {
  const inner = size * INNER_RATIO;
  const offset = (size - inner) / 2;

  return (
    <span
      className={`relative block shrink-0 ${className}`.trim()}
      style={{ width: size, height: size, ...style }}
    >
      <span className="absolute inset-0 rounded-full border border-white/20" />
      <span
        className="absolute rounded-full"
        style={{
          left: offset,
          top: offset,
          width: inner,
          height: inner,
          backgroundImage: TONES[tone],
        }}
      />
      {person && framing ? (
        <span
          className="absolute overflow-hidden rounded-full"
          style={{ left: offset, top: offset, width: inner, height: inner }}
        >
          <span
            className="absolute -translate-y-1/2"
            style={{
              left: framing.left,
              right: framing.right,
              top: framing.top,
              aspectRatio: person.aspect,
            }}
          >
            <Image
              src={person.src}
              alt={person.name}
              fill
              sizes={`${Math.ceil(size)}px`}
              className="object-cover"
            />
          </span>
        </span>
      ) : null}
      {children ? (
        <span className="absolute inset-0 grid place-items-center">
          {children}
        </span>
      ) : null}
    </span>
  );
}
