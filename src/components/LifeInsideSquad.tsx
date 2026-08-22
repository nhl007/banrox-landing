import Image from "next/image";
import AvatarRing from "@/components/ui/AvatarRing";
import Badge from "@/components/ui/Badge";
import ConnectorTrace from "@/components/ui/ConnectorTrace";
import { LeafIcon } from "@/components/ui/icons";
import { PEOPLE, VOTE_FRAMING, type Framing } from "@/data/people";

/*
 * "Life Inside Squad" — three cards on an 855x542 stage: a lane being spent
 * down, a member covering another member, and the squad's own health.
 *
 * It is the one section on the page that is about a week rather than about a
 * mechanism. Everything above it explains how a squad is assembled, scored and
 * voted on; this is what that looks like on an ordinary Tuesday, which is why
 * the three cards are laid out flat side by side rather than stacked into a
 * funnel or fanned into a diagram. Nothing here points at anything else except
 * one hairline, and that one is a payment.
 */

const STAGE_W = 855;
const STAGE_H = 542;

/**
 * The phone's artboard for the same three: 370x984.76, which is the mobile
 * frame's content column and the cards stacked in it 16 apart.
 *
 *   lane     370x218.6 at y0
 *   cover    370x290.2 at y234.6
 *   health   370x444   at y540.8
 *
 * The first two are the wide layout's own cards at a scale — 0.781 down and
 * 1.036 UP, because the lane card is drawn 474 wide to share a row and the
 * cover card only 357, and on the phone they both get the whole 370 column. The
 * health card is the one that is redrawn: an 855x238 rail has nowhere to put
 * three stats and four scores in a 370px column, so its rows stack and its
 * scores become a 2x2, at the type sizes it already had.
 */
const PHONE_W = 370;
const PHONE_H = 984.76;
const LANE_SCALE = 370 / 474;
const COVER_SCALE = 370 / 357;

/**
 * The two 64px portraits on the cover card, at the crop Figma gives them at
 * that size.
 *
 * Inline rather than a sixth entry in people.ts, because the sets there are
 * whole-squad records and this is the one placement on the page that shows two
 * of the four. Every framing in that file is a per-size nudge; making a
 * four-person record out of two measured values would mean inventing the other
 * two.
 */
const COVER_FRAMING: Record<"mika" | "lilit", Framing> = {
  mika: { left: "-8.82%", right: "-14.7%", top: "calc(50% + 1.8px)" },
  lilit: { left: "-5.88%", right: "-5.88%", top: "calc(50% + 0.8px)" },
};

/**
 * The shell all three cards share: a 16px-radius panel over the page, lit from
 * inside its own top edge.
 *
 * `bg-vignette` is the 4% radial + 2px backdrop blur Figma puts under every one
 * of them, and it is already in the stylesheet because the signal cards and the
 * score badges carry the same pair.
 */
const CARD =
  "bg-vignette relative overflow-hidden rounded-2xl bg-[rgba(8,8,20,0.5)] ring-[1.5px] ring-white/10 ring-inset shadow-[inset_0px_4px_20px_0px_rgba(255,255,255,0.08)]";

/**
 * The three blurred vectors every card on this page is lit by, and the dot
 * texture over them.
 *
 * One component because all three cards carry the same four layers in the same
 * order at three different sizes — glow, glow, glow-with-plus-lighter, texture
 * — and writing it out three times is three chances for the order to drift.
 * The numbers are each card's own, straight off the frame.
 */
function CardLight({
  glows,
  texture,
}: {
  glows: [Placed, Placed, Placed];
  texture: React.ReactNode;
}) {
  return (
    <>
      {glows.map((g, i) => (
        <Image
          key={g.src}
          src={g.src}
          alt=""
          width={g.width}
          height={g.height}
          className={`pointer-events-none absolute max-w-none ${
            i === 2 ? "mix-blend-plus-lighter" : ""
          }`}
          style={{ left: g.left, top: g.top }}
        />
      ))}
      {texture}
    </>
  );
}

type Placed = {
  src: string;
  width: number;
  height: number;
  left: number | string;
  top: number;
};

/* -------------------------------------------------------------------------- */

/** One of the lane card's two readouts: an icon in a disc, a label, a figure. */
function LaneStat({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="relative flex flex-1 items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 shadow-[inset_-2px_-2px_6px_0px_rgba(255,255,255,0.05),inset_4px_4px_8px_0px_rgba(0,0,0,0.2)] backdrop-blur-[4px]">
      <span className="bg-brand-lighter/20 relative flex size-8 shrink-0 items-center justify-center rounded-full border border-white/20 shadow-[inset_2px_2px_4px_0px_rgba(255,255,255,0.2)]">
        <Image src={icon} alt="" width={16} height={16} className="size-4" />
      </span>
      <span className="font-heading flex flex-col items-start gap-1 leading-none font-medium whitespace-nowrap text-white">
        <span className="text-[12px] opacity-50">{label}</span>
        {/* data-count: the sequence counts this up on arrival, and the printed
            value stays the element's own text — see countUp. */}
        <span data-count="" className="text-[24px]">
          {value}
        </span>
      </span>
    </div>
  );
}

/**
 * Card one: Lilit's lane, spent down.
 *
 * 474x280 with 24 of padding and 16 between its four rows, which is what the
 * frame measures — the row of two readouts at the bottom is the only part of it
 * that is not simply a line of type.
 */
function LaneCard() {
  return (
    <div className={`${CARD} h-[280px] w-[474px]`}>
      <CardLight
        glows={[
          {
            src: "/life/lane-glow-1.svg",
            width: 552,
            height: 232,
            left: "calc(50% + 12.43px - 276px)",
            top: -114,
          },
          {
            src: "/life/lane-glow-2.svg",
            width: 548,
            height: 231,
            left: "calc(50% + 10.43px - 274px)",
            top: -114,
          },
          {
            src: "/life/lane-glow-3.svg",
            width: 368,
            height: 232,
            left: 62.43,
            top: -114,
          },
        ]}
        texture={
          <>
            {/*
              The topography under the lower half of the card, and the soft blob
              over its top right corner. Both are flattened exports: Figma builds
              each out of a dozen masked ellipses, and the mask stack does not
              survive being re-expressed as CSS — what it draws does.
            */}
            <Image
              src="/life/lane-texture.png"
              alt=""
              width={474}
              height={204}
              className="pointer-events-none absolute top-[76px] left-0 max-w-none"
            />
            <Image
              src="/life/lane-blob.svg"
              alt=""
              width={199}
              height={199}
              className="pointer-events-none absolute top-[-62.5px] left-[325px] max-w-none"
            />
          </>
        }
      />

      <div className="relative flex h-full flex-col items-center justify-center gap-4 p-6">
        <div
          className="flex w-full items-center justify-between"
          data-reveal="item"
        >
          <div className="flex items-center gap-3">
            <AvatarRing
              size={40}
              person={PEOPLE.lilit}
              framing={VOTE_FRAMING.lilit}
            />
            <p className="font-heading text-[20px] leading-none font-medium whitespace-nowrap text-white">
              Lilit&rsquo;s lane
            </p>
          </div>
          <Image
            src="/life/fingerprint-48.svg"
            alt=""
            width={39}
            height={39}
            className="size-[39px] shrink-0"
          />
        </div>

        <div className="flex w-full flex-col gap-3" data-reveal="item">
          <div className="font-heading flex w-full items-end justify-between leading-none font-medium whitespace-nowrap">
            <span className="flex items-end gap-2">
              <span data-count="" className="text-[40px] text-white">
                $3,860
              </span>
              <span className="text-brand-lighter text-[14px]">available</span>
            </span>
            <span className="text-[14px] text-white/50">
              $2,140 spent of $6,000
            </span>
          </div>

          {/* The bar and the figure above it are one fact stated twice: what is
              left of the lane, and how much of it is gone. */}
          <div className="relative h-2 w-full rounded-[20px] bg-white/10">
            <div
              data-meter="71.7"
              className="absolute top-0 left-0 h-2 rounded-[20px]"
              style={{
                width: "71.7%",
                backgroundImage:
                  "linear-gradient(5.09deg, #2b58fa 10.843%, #89a3ff 84.747%)",
              }}
            />
          </div>
        </div>

        <div className="flex w-full items-start gap-4" data-reveal="item">
          <LaneStat
            icon="/life/calendar-04.svg"
            label="This month"
            value="$2,140"
          />
          <LaneStat
            icon="/life/wallet-01.svg"
            label="Lane limit"
            value="$6,000"
          />
        </div>

        <p
          className="font-heading text-[12px] leading-none font-medium whitespace-nowrap text-white/50"
          data-reveal="item"
        >
          His card stops at his lane.
        </p>
      </div>
    </div>
  );
}

/**
 * Card two: one member covering another.
 *
 * 357x280, and the only card on the page whose content is centred in it rather
 * than filling it — two faces, a wire between them, and what happened.
 */
function CoverCard() {
  return (
    <div className={`${CARD} h-[280px] w-[357px]`}>
      <CardLight
        glows={[
          {
            src: "/life/cover-glow-1.svg",
            width: 517,
            height: 351,
            left: "calc(50% + 0.36px - 258.5px)",
            top: -155,
          },
          {
            src: "/life/cover-glow-2.svg",
            width: 409,
            height: 347,
            left: "calc(50% + 1.36px - 204.5px)",
            top: -151,
          },
          {
            src: "/life/cover-glow-3.svg",
            width: 293,
            height: 351,
            left: 32.36,
            top: -155,
          },
        ]}
        texture={
          <Image
            src="/life/cover-texture.svg"
            alt=""
            width={358}
            height={239}
            className="pointer-events-none absolute top-[-3px] -left-[0.5px] max-w-none"
          />
        }
      />

      <div className="absolute top-1/2 left-[53.5px] flex w-[248px] -translate-y-1/2 flex-col items-center gap-7">
        <div className="relative h-16 w-full" data-reveal="item">
          <span className="absolute top-0 left-0">
            <AvatarRing
              size={64}
              person={PEOPLE.mika}
              framing={COVER_FRAMING.mika}
            />
          </span>
          <span className="absolute top-0 left-[184px]">
            <AvatarRing
              size={64}
              person={{ ...PEOPLE.lilit, name: "Lilit Sargsyan" }}
              framing={COVER_FRAMING.lilit}
            />
          </span>

          {/*
            The one thing in this section that is an event rather than a state,
            so it is the one thing drawn rather than placed: the hairline wipes
            open between the two faces and a light runs down it, left to right,
            for as long as the section is on screen (see traceLoop).

            The two 15px caps are the artwork's own — they fade the dashes into
            each portrait — and ride inside the wipe so they are revealed with
            the line they finish.
          */}
          <ConnectorTrace
            src="/life/link-run.svg"
            width={134}
            height={1}
            left={57}
            top={32}
            spark={70}
            cross={10}
            pad={16}
          >
            <Image
              src="/life/link-cap.svg"
              alt=""
              width={16}
              height={1}
              className="absolute max-w-none"
              style={{ left: 15, top: 16 }}
            />
            <Image
              src="/life/link-cap.svg"
              alt=""
              width={16}
              height={1}
              className="absolute max-w-none"
              style={{ left: 105, top: 16 }}
            />
          </ConnectorTrace>
        </div>

        <div
          className="flex w-[208px] flex-col items-center gap-5"
          data-reveal="item"
        >
          <p className="font-heading w-[179px] text-center text-[20px] leading-[1.2] font-medium text-white">
            Mika covered Lilit&rsquo;s $180 payment
          </p>
          <StatePill>Account Current</StatePill>
          <div className="flex w-full items-center justify-center gap-2">
            <p className="font-heading text-[12px] leading-none font-medium whitespace-nowrap text-white/50">
              Settle up by Aug 1
            </p>
            <span className="block size-1 shrink-0 rounded-full bg-white/50" />
            <p className="font-heading text-[12px] leading-none font-medium whitespace-nowrap text-white/50">
              Auto-reminder on
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The green state chip both of the lower cards carry. */
function StatePill({ children }: { children: React.ReactNode }) {
  return (
    <span className="border-success/20 bg-success/10 flex shrink-0 items-center justify-center rounded-[20px] border px-3 py-1.5">
      <span className="font-heading text-success text-[12px] leading-none font-medium whitespace-nowrap">
        {children}
      </span>
    </span>
  );
}

/** One of the health card's three headline stats. */
function HealthStat({
  value,
  label,
  positive,
}: {
  value: string;
  label: string;
  positive?: boolean;
}) {
  return (
    <div className="font-heading flex h-11 flex-1 flex-col items-center justify-center gap-2 text-center leading-none font-medium whitespace-nowrap">
      <p
        data-count=""
        className={`text-[24px] ${positive ? "text-success" : "text-white"}`}
      >
        {value}
      </p>
      <p className="text-[12px] text-white opacity-50">{label}</p>
    </div>
  );
}

/** One of its four member scores. */
function HealthScore({ value, label }: { value: string; label: string }) {
  return (
    <div
      className="relative flex h-[74px] flex-1 flex-col items-center justify-center gap-1.5 overflow-hidden rounded-lg border border-white/10 bg-white/[0.02] pt-2.5 pb-4 backdrop-blur-[4px]"
      data-reveal="score"
    >
      {/* The light each cell stands on, drawn under its own bottom edge and
          clipped by it — so the cell reads as lit from below rather than as
          carrying a decal. */}
      <Image
        src="/life/score-glow.svg"
        alt=""
        width={202}
        height={153}
        className="pointer-events-none absolute bottom-[-97px] left-[calc(50%-0.38px)] max-w-none -translate-x-1/2"
      />
      <p
        data-count=""
        className="relative w-full text-center text-[20px] leading-[1.5] font-medium tracking-[-0.4px] text-white"
      >
        {value}
      </p>
      <p className="font-heading relative text-center text-[12px] leading-none whitespace-nowrap text-white/70">
        {label}
      </p>
    </div>
  );
}

const SCORES = [
  { value: "762", label: "Score of Maya" },
  { value: "588", label: "Score of Lilit" },
  { value: "502", label: "Score of Jordan" },
  { value: "815", label: "Score of Mike" },
];

/**
 * Card three: what the week added up to.
 *
 * The one card that is genuinely redrawn between the two frames rather than
 * scaled: 855x238 with everything on one line up here, 370x444 with the three
 * stats stacked and the four scores in a 2x2 down there. Same type either way —
 * this is the summary, and a summary set at three quarters is a footnote.
 */
function HealthCard() {
  return (
    <div className={`${CARD} h-[444px] w-[370px] sm:h-[238px] sm:w-[855px]`}>
      <CardLight
        glows={[
          {
            src: "/life/health-glow-1.svg",
            width: 1013,
            height: 210,
            left: "calc(50% + 1.35px - 506.5px)",
            top: -116,
          },
          {
            src: "/life/health-glow-2.svg",
            width: 755,
            height: 209,
            left: "calc(50% + 3.35px - 377.5px)",
            top: -115,
          },
          {
            src: "/life/health-glow-3.svg",
            width: 477,
            height: 210,
            left: 190.35,
            top: -116,
          },
        ]}
        texture={
          /* The same dot field the approve ledger stands on, which is the same
             asset in Figma too — both are a wide dark rail with the grid
             showing through the middle of it. */
          <Image
            src="/approve/ledger-texture.svg"
            alt=""
            width={960}
            height={238}
            className="pointer-events-none absolute top-[55px] left-1/2 max-w-none -translate-x-1/2 sm:left-0 sm:translate-x-0"
          />
        }
      />

      <div className="relative flex h-full flex-col items-start gap-6 p-6">
        <div className="flex w-full items-center justify-between">
          <p className="font-heading text-[16px] leading-none whitespace-nowrap text-white/50">
            Squad Health
          </p>
          <StatePill>Excellent</StatePill>
        </div>

        <div className="flex w-full flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-0">
          <HealthStat value="14 months" label="On-Time Streak" positive />
          <HealthDivider />
          <HealthStat value="32%" label="Utilization" />
          <HealthDivider />
          <HealthStat value="4/4" label="Members Improving" positive />
        </div>

        <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:items-center">
          {SCORES.map((s) => (
            <HealthScore key={s.label} {...s} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** The hairline between two stats — on the row only, so it goes with it. */
function HealthDivider() {
  return <span className="hidden h-11 w-px shrink-0 bg-white/10 sm:block" />;
}

/* -------------------------------------------------------------------------- */

export default function LifeInsideSquad() {
  return (
    <section
      className="screen relative isolate w-full"
      data-sequence-section="life"
    >
      {/*
        Ellipse 6147 — the phone's frame lights this section the way it lights
        the funnel above it, from a single 389px circle off the left edge, and
        at exactly the same offset. Above the gate the light is the 245px aura
        inside the diagram instead; a 389px circle has no relationship to a
        stage that scales.

        isolate above, z-10 below: between them the layer is pinned behind this
        section's content and in front of the page. See .screen-glow.
      */}
      <div className="screen-glow sm:hidden" aria-hidden="true">
        <Image
          src="/intel/bg-glow.svg"
          alt=""
          width={1189}
          height={1189}
          className="absolute max-w-none"
          style={{ left: -616, top: 51.6 }}
        />
      </div>

      <div className="screen-body relative z-10">
        <div className="screen-copy mx-auto flex max-w-[1240px] flex-col items-center gap-4 px-4 sm:gap-[clamp(0.5rem,1.8svh,1rem)] sm:px-6">
          <div className="flex" data-reveal="copy">
            <Badge icon={<LeafIcon />}>Life Inside Squad</Badge>
          </div>
          <h2
            className="font-heading type-title w-full text-center leading-none font-normal"
            data-reveal="copy"
          >
            Day to day, it just{" "}
            <span className="font-display italic">works.</span>
          </h2>
        </div>

        {/* No data-reveal on the wrapper: the three cards arrive as three
            statements — see lifeLanes and lifeHealth — and a group fade over the
            top would flatten that back into one crossfade. */}
        <div className="screen-payload px-4 sm:px-0">
          {/* stage-viewport-clip: the cards rise from below their places and the
              two on the top row are swayed apart as the section crosses (see
              depth.ts), so both ends of the stage are briefly overhung. A
              rightward overhang is scrollable overflow, and a horizontal
              scrollbar on this page resizes every container query under it. */}
          <div className="stage-viewport stage-viewport-clip stage-fluid">
            <div
              className="stage-sizer"
              style={
                {
                  "--stage-w": STAGE_W,
                  "--stage-h": STAGE_H,
                } as React.CSSProperties
              }
            >
              <div className="stage">
                <div className="panel-fit">
                  <div
                    className="panel-sizer"
                    style={
                      {
                        "--panel-w": PHONE_W,
                        "--panel-h": PHONE_H,
                      } as React.CSSProperties
                    }
                  >
                    <div className="panel-stage">
                      {/*
                        Ellipse 6148, centred on the diagram — the light the
                        three cards sit in rather than one behind the section.
                        Wide layout only; the phone's is the section-wide circle
                        at the top of this file.
                      */}
                      <Image
                        src="/life/aura.svg"
                        alt=""
                        width={845}
                        height={845}
                        className="pointer-events-none absolute hidden max-w-none sm:block"
                        /*
                          Its top-left in stage units, not `left-1/2` and a
                          -50% translate — and that is not a style preference.
                          depth writes `yPercent` to this element (see the aura
                          layer in depth.ts) and gsap folds any CSS `translate`
                          into the same cache, so a -50% stated there is the
                          first thing overwritten. Measured before this was
                          moved: the glow sat 422px low, centred under the
                          section rather than under the cards.

                          245px circle centred on the stage at (427.5, 270.5);
                          the export is 845 across because Figma bakes the
                          150px blur into it, so the top-left is that centre
                          less 422.5.
                        */
                        style={{ left: 5, top: -152 }}
                        data-reveal="aura"
                        data-glow-from="-0.6 0.8"
                      />

                      {/*
                        Three absolute placements per card, one per frame. The
                        phone's first two are the wide cards at a scale about
                        their own top-left corner, which is what makes 474 and
                        357 both come out at 370 without either being re-laid
                        out. See PHONE_W.
                      */}
                      <div
                        className="absolute top-0 left-0 origin-top-left scale-[var(--s)] sm:scale-100"
                        style={{ "--s": LANE_SCALE } as React.CSSProperties}
                        data-reveal="lane"
                      >
                        <LaneCard />
                      </div>

                      <div
                        className="absolute top-[234.565px] left-0 origin-top-left scale-[var(--s)] sm:top-0 sm:left-[498px] sm:scale-100"
                        style={{ "--s": COVER_SCALE } as React.CSSProperties}
                        data-reveal="cover"
                      >
                        <CoverCard />
                      </div>

                      <div
                        className="absolute top-[540.76px] left-0 sm:top-[304px]"
                        data-reveal="health"
                      >
                        <HealthCard />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
