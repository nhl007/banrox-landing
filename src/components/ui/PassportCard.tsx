import Image from "next/image";
import AvatarRing from "@/components/ui/AvatarRing";
import { VerifiedCheck } from "@/components/ui/icons";

/*
 * "Financial Passport" card — 260x379 on the Figma artboard. Every offset below
 * is taken straight from the frame, so the card is laid out at its design size
 * and scaled by the container that places it (see CardFan).
 */

/**
 * That design size, stated once and exported, because a container that scales
 * the card has to divide by it: the phone's deck draws the same card at four
 * different widths and needs the ratio each of them comes to. See HeroFanPhone.
 */
export const PASSPORT_CARD = { width: 260, height: 379 } as const;

const BUREAUS = {
  experian: { src: "/card/logo-experian.svg", label: "Experian", width: 10.1 },
  transunion: {
    src: "/card/logo-transunion.svg",
    label: "Transunion",
    width: 10,
  },
  equifax: { src: "/card/logo-equifax.svg", label: "Equifax", width: 8.7 },
} as const;

const METRIC_ICONS = {
  wallet: "/icons/wallet-01.svg",
  speed: "/icons/dashboard-speed-02.svg",
  pulse: "/icons/pulse-01.svg",
  shield: "/icons/shield-01.svg",
} as const;

const TONES = {
  default: "text-white",
  positive: "text-positive",
  positiveStrong: "text-positive-strong",
  warning: "text-warning",
  negative: "text-negative",
} as const;

export type BureauKey = keyof typeof BUREAUS;
export type MetricIcon = keyof typeof METRIC_ICONS;
export type Tone = keyof typeof TONES;

export type BureauScore = {
  bureau: BureauKey;
  score: number;
  rating: string;
  range: string;
  /**
   * Filled width of the 60px meter. Figma sets this per card by hand rather
   * than deriving it from the score, so it travels with the data.
   */
  fill?: number;
};

export type Metric = {
  icon: MetricIcon;
  label: string;
  value: string;
  tone?: Tone;
};

export type Avatar = {
  src: string;
  /** Figma frames each portrait differently inside the 34px circle. */
  left: string;
  right: string;
  top: string;
  aspect: string;
};

export type PassportCardProps = {
  name: string;
  subtitle: string;
  avatar: Avatar;
  bureaus: [BureauScore, BureauScore, BureauScore];
  metrics: [Metric, Metric, Metric, Metric];
  className?: string;
  /**
   * Lay the card out from its right edge instead of its left.
   *
   * For a card whose LEFT side is the side nobody sees — the two on the right
   * of the phone's deck, which are behind the Squad card from their own left
   * edge inwards (see HeroFanPhone). Unmirrored, the 55px of them that is on
   * the screen is the tail of the card: the far end of a name, the last bureau
   * tile, the right-hand column of metrics and an empty strip of the verified
   * bar. Mirrored, the same 55px is the head of it — the avatar, the name, the
   * first bureau — so all four cards in the deck lead with a face and the
   * composition reads outwards from the product in both directions.
   *
   * `direction: rtl`, not a scaleX. A flip mirrors the glyphs with everything
   * else and every label on the card comes out backwards; direction reverses
   * the LAYOUT and leaves the type alone, which is the whole of what is wanted.
   * The absolutely-positioned artwork — the three top glows, the fingerprint,
   * the pieces inside the verified bar, the fill on a bureau meter — follows it
   * because those are placed on `inset-inline-start` rather than on `left`, so
   * the mirror is the card's own and not a set of exceptions to it.
   *
   * The portrait inside the avatar ring is the one thing that does NOT turn:
   * AvatarRing frames it on physical left/right, deliberately, because a face
   * is not a layout.
   */
  mirrored?: boolean;
};

/** Falls back to a straight 300-850 mapping when no explicit fill is given. */
function meterWidth({ score, fill }: BureauScore) {
  if (fill !== undefined) return Math.min(60, Math.max(0, fill));
  return Math.min(60, Math.max(0, ((score - 300) / 550) * 60));
}

/*
 * Every piece of anonymous artwork on this card carries `rtl:` scaleX(-1) as
 * well as a logical inset, and the two are one idea: on a mirrored card (see
 * `mirrored`) the inset moves the artwork to the other side and the flip turns
 * it round, which is what a mirror actually is. Position alone is not enough
 * for anything with a shape — the verified bar's wave is cut flush with one end
 * of the bar and fades out at the other, so moved-but-not-turned it puts its
 * cut edge in the middle of the bar. Visible, and the reason this exists.
 *
 * The bureau logos, the metric icons and the portrait in the avatar ring are
 * NOT in this set. They are marks and a face; the mirror is of the layout.
 */

/** Blurred triangles that bloom out of the top edge; the card clips them. */
/*
 * The hover response, and the whole of it: the light already at the top of the
 * card comes up.
 *
 * On each image rather than on a wrapper around the three, which is the part
 * that matters. glow-3 carries `mix-blend-plus-lighter`, and it blends against
 * its backdrop *within its parent's stacking context* — so wrapping the set in
 * a div with an opacity or a filter of its own would isolate that group and
 * leave glow-3 blending against its two siblings instead of against the card.
 * A filter on the blended element itself is applied before the blend and
 * changes nothing about what it blends with.
 *
 * group/card is named rather than bare: PassportCard is dropped inside other
 * grouped elements, and an unnamed group would be claimed by the nearest one.
 */
const GLOW_HOVER =
  "transition-[filter] duration-500 ease-out group-hover/card:brightness-[1.45] motion-reduce:transition-none";

function TopGlow() {
  return (
    <>
      <Image
        src="/card/glow-1.svg"
        alt=""
        width={420}
        height={339}
        className={`pointer-events-none absolute -top-[127px] -start-20 max-w-none rtl:[transform:scaleX(-1)] ${GLOW_HOVER}`}
      />
      <Image
        src="/card/glow-2.svg"
        alt=""
        width={341}
        height={336}
        className={`pointer-events-none absolute -top-[124px] -start-9 max-w-none rtl:[transform:scaleX(-1)] ${GLOW_HOVER}`}
      />
      <Image
        src="/card/glow-3.svg"
        alt=""
        width={257}
        height={339}
        className={`pointer-events-none absolute -top-[127px] start-2 max-w-none mix-blend-plus-lighter rtl:[transform:scaleX(-1)] ${GLOW_HOVER}`}
      />
    </>
  );
}

function BureauTile(props: BureauScore) {
  const { bureau, score, rating, range } = props;
  const meta = BUREAUS[bureau];
  return (
    <div className="relative flex flex-1 flex-col items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] py-2 shadow-[inset_-2px_-2px_6px_0px_rgba(255,255,255,0.05),inset_4px_4px_8px_0px_rgba(0,0,0,0.2)]">
      <span className="flex h-3.5 items-center justify-center gap-[1.8px]">
        <Image
          src={meta.src}
          alt=""
          width={10}
          height={10}
          style={{ width: meta.width, height: 10 }}
        />
        <span className="text-gradient-bureau font-heading text-[6px] leading-none font-semibold tracking-[0.96px] uppercase">
          {meta.label}
        </span>
      </span>

      <span className="text-gradient-score font-heading text-[20px] leading-none font-medium">
        {score}
      </span>

      <span className="flex flex-col gap-1">
        <span className="flex w-[60px] items-start justify-between text-[8px] leading-none">
          <span className="font-heading text-brand-lighter font-medium">
            {rating}
          </span>
          <span className="font-heading text-white/50">{range}</span>
        </span>
        <span className="relative block h-[3px] w-[60px] rounded-[20px] bg-white/10">
          <span
            className="bg-score-meter absolute top-0 start-0 block h-[3px] rounded-[20px]"
            style={{ width: meterWidth(props) }}
          />
        </span>
      </span>
    </div>
  );
}

function MetricTile({ icon, label, value, tone = "default" }: Metric) {
  return (
    <div className="relative flex h-12 flex-1 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-2 py-3 shadow-[inset_-2px_-2px_6px_0px_rgba(255,255,255,0.05),inset_4px_4px_8px_0px_rgba(0,0,0,0.2)]">
      <span className="relative flex size-6 shrink-0 items-center justify-center rounded-full border border-white/20 bg-[#8585e9]/20 shadow-[inset_2px_2px_4px_0px_rgba(255,255,255,0.2)]">
        <Image src={METRIC_ICONS[icon]} alt="" width={12} height={12} />
      </span>
      {/* Figma marks these nowrap; "Identity & privacy" only just fits. */}
      <span className="font-heading flex flex-col gap-1 leading-none font-medium whitespace-nowrap">
        <span className="text-[8px] text-white opacity-50">{label}</span>
        {/*
          <bdi>, and only here. On a mirrored card (see `mirrored`) the text
          direction is rtl, and "$19,500/mo" is not one run to the bidi
          algorithm: the digits are weak, the slash between them and "mo" is
          neutral, so it splits into a number and a word and lays the two out
          right to left — "mo/$19,500". Measured, on the card that is FIRST in
          the deck's right-hand rank, in the strip of it the reader can see.
          An isolate takes its direction from its own first strong character
          and puts the run back together; it changes nothing in the other four
          cards, where the paragraph was already ltr. The label above it and
          every other string on the card are whole words and need none.
        */}
        <span className={`text-[12px] ${TONES[tone]}`}>
          <bdi>{value}</bdi>
        </span>
      </span>
    </div>
  );
}

export default function PassportCard({
  name,
  subtitle,
  avatar,
  bureaus,
  metrics,
  className = "",
  mirrored = false,
}: PassportCardProps) {
  return (
    <div
      className={`bg-card relative overflow-hidden rounded-2xl border border-white/10 ${className}`.trim()}
      style={{ width: PASSPORT_CARD.width, height: PASSPORT_CARD.height }}
      dir={mirrored ? "rtl" : undefined}
    >
      <TopGlow />

      {/* Fingerprint watermark, top-right. */}
      <Image
        src="/card/texture-top.png"
        alt=""
        width={131}
        height={131}
        className="pointer-events-none absolute -top-[39px] start-[157px] max-w-none rtl:[transform:scaleX(-1)]"
      />

      <div
        className="relative flex flex-col gap-4 p-4"
        style={{ width: PASSPORT_CARD.width }}
      >
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <AvatarRing
              size={40}
              person={{ name, src: avatar.src, aspect: avatar.aspect }}
              framing={avatar}
            />

            <span className="flex flex-col gap-2">
              <span className="flex items-center gap-2">
                <span className="font-heading text-[14px] leading-none font-medium text-white">
                  {name}
                </span>
                <VerifiedCheck size={12} />
              </span>
              <span className="font-heading text-[10px] leading-none font-medium text-white opacity-70">
                {subtitle}
              </span>
            </span>
          </div>
        </div>

        <p className="font-heading w-full text-center text-[10px] leading-none font-semibold tracking-[1.6px] text-white uppercase opacity-40">
          Financial Passport
        </p>

        <div className="flex w-full flex-col gap-2">
          <div className="flex w-full items-center gap-2">
            {bureaus.map((b) => (
              <BureauTile key={b.bureau} {...b} />
            ))}
          </div>
          <div className="flex w-full flex-col gap-2">
            <div className="flex w-full items-center gap-2">
              <MetricTile {...metrics[0]} />
              <MetricTile {...metrics[1]} />
            </div>
            <div className="flex w-full items-center gap-2">
              <MetricTile {...metrics[2]} />
              <MetricTile {...metrics[3]} />
            </div>
          </div>
        </div>

        <div className="relative h-14 w-full overflow-hidden rounded-lg border border-white/5 bg-white/[0.02] shadow-[inset_4px_4px_6px_0px_rgba(255,255,255,0.05)]">
          <Image
            src="/card/glow-1.svg"
            alt=""
            width={420}
            height={339}
            className="pointer-events-none absolute -top-[126px] start-[82px] max-w-none rtl:[transform:scaleX(-1)]"
          />
          {/* Exported at the bar's clip bounds, so it drops straight in. */}
          <Image
            src="/card/texture-verified.png"
            alt=""
            width={556}
            height={168}
            className="pointer-events-none absolute top-0 start-[42.57px] h-14 w-[185.43px] max-w-none rtl:[transform:scaleX(-1)]"
          />
          <span className="absolute top-[11px] start-[11px] flex items-center gap-2">
            <Image
              src="/card/verified-shield.svg"
              alt=""
              width={27}
              height={32}
              className="h-8 w-[26.93px]"
            />
            <span className="font-heading w-14 text-[12px] leading-[1.2] text-white">
              Verified Borrower
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
