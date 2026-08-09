import Image from "next/image";

/*
 * The physical Squad card. Figma authors it as a 420x260 landscape card and
 * rotates it -90deg to stand upright at 260x420, which is why the layout below
 * is written in landscape and the wrapper does the turning.
 */

const CARD_W = 420;
const CARD_H = 260;

const engravedText = {
  backgroundImage: "linear-gradient(to bottom, #526cef 0%, #121e57 100%)",
  backgroundClip: "text",
  color: "transparent",
} as const;

const BASE_W = 260;
const BASE_H = 420;

export type SquadCardProps = {
  label?: string;
  cardNumber?: string;
  className?: string;
  /** Upright width in px. Internals stay authored at 260 and scale uniformly. */
  size?: number;
};

export default function SquadCard({
  label = "SquadCard",
  cardNumber = "**** **** **** 7214",
  className = "",
  size = BASE_W,
}: SquadCardProps) {
  const scale = size / BASE_W;

  return (
    <div
      className={`relative shrink-0 ${className}`.trim()}
      style={{ width: size, height: BASE_H * scale }}
      role="img"
      aria-label={`Banrox ${label}, ending 7214`}
    >
      <div
        className="absolute top-0 left-0"
        style={{
          width: BASE_W,
          height: BASE_H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
      <div
        className="absolute top-1/2 left-1/2 overflow-hidden rounded-[32px] bg-white"
        style={{
          width: CARD_W,
          height: CARD_H,
          transform: "translate(-50%, -50%) rotate(-90deg)",
        }}
      >
        {/* Brushed-metal fill, mirrored and dropped to 60%. */}
        <Image
          src="/squadcard/metal-texture.jpg"
          alt=""
          width={590}
          height={260}
          className="pointer-events-none absolute top-0 -left-[116px] max-w-none opacity-60"
          style={{ transform: "scaleX(-1)" }}
          priority
        />

        {/* The two engraved sweep lines. */}
        <Image
          src="/squadcard/swoosh-1.svg"
          alt=""
          width={382}
          height={274}
          className="pointer-events-none absolute -top-[7px] -left-[63px] max-w-none"
        />
        <Image
          src="/squadcard/swoosh-2.svg"
          alt=""
          width={386}
          height={278}
          className="pointer-events-none absolute -top-[6px] -left-[62px] max-w-none"
        />

        {/* Oversized logomark bleeding off the lower-left corner. */}
        <Image
          src="/squadcard/logomark-large.svg"
          alt=""
          width={144}
          height={160}
          className="pointer-events-none absolute bottom-0 -left-[14px] max-w-none mix-blend-hard-light"
        />
        <Image
          src="/squadcard/logomark-edge.svg"
          alt=""
          width={144}
          height={160}
          className="pointer-events-none absolute bottom-0 -left-[14px] max-w-none mix-blend-hard-light"
        />

        <Image
          src="/squadcard/logo-wordmark.svg"
          alt=""
          width={92}
          height={20}
          className="pointer-events-none absolute top-6 right-6 max-w-none mix-blend-hard-light"
        />

        <Image
          src="/squadcard/chip.png"
          alt=""
          width={50}
          height={40}
          className="absolute top-6 left-6 rounded-[7.045px] border border-[rgba(8,8,20,0.1)] object-bottom"
        />

        <span
          className="font-heading absolute top-[180px] translate-x-1/2 text-[16px] leading-none font-medium opacity-80"
          style={{ right: 64, ...engravedText }}
        >
          {label}
        </span>

        {/*
          Figma sets this in a "Credit Card" face that ships with the design
          file, not the project; monospace is the closest available stand-in.
        */}
        <span
          className="absolute bottom-10 left-[208px] translate-y-full font-mono text-[16px] leading-none tracking-[0.06em] opacity-80"
          style={engravedText}
        >
          {cardNumber}
        </span>
      </div>
      </div>
    </div>
  );
}
