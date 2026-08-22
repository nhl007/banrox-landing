import Image from "next/image";
import Badge from "@/components/ui/Badge";
import BanroxEngineHub from "@/components/ui/BanroxEngineHub";
import ConnectorTrace from "@/components/ui/ConnectorTrace";
import MemberScoreCard from "@/components/ui/MemberScoreCard";
import SignalCard, { type SignalRow } from "@/components/ui/SignalCard";
import { Brain, Tick } from "@/components/ui/icons";
import { PEOPLE, type PersonKey } from "@/data/people";

/*
 * "Built on intelligence" — a vertical funnel: 4 member score cards feed a
 * connector fan into 4 signal-category cards, which feed a single line into
 * the Banrox Engine hub, which feeds a final "approved" pill.
 *
 * Stage is 1112x948 (Figma's "Group 2147230231" body). Its own metadata
 * reports the hub's y as 350px past the group's declared height — the same
 * artifact hit in SquadApproves' SquadCard — so its position here is
 * screenshot-measured rather than taken from that field.
 */

const STAGE_W = 1112;
const STAGE_H = 948;

/**
 * The phone's artboard for the same funnel: 370x1050.5, which is the mobile
 * frame's content column and the four rows stacked in it.
 *
 *   member cards   a 2x2 grid, 177x117 each, 16 apart, at y0
 *   two drops      64 each, at y250, under each column
 *   signal box     370x316 at y314, four 173-wide cards inside it 8 apart
 *   one drop       64 at y630
 *   the hub        256.5x252 at (56.75, 694.5)
 *   one drop       64 at y946
 *   the verdict    306x40 at (32, 1010.5)
 *
 * Each part is the wide layout's own component at its own scale, and the three
 * scales are all different because the frame sizes each row to the column
 * rather than to one ratio: 0.681 on a score card, 0.752 on a signal card,
 * 0.75 on the hub, and the verdict pill not scaled at all — 306 wide with its
 * 16px type intact, because it is one line of reading rather than a diagram.
 */
const PHONE_W = 370;
const PHONE_H = 1050.5;
const SCORE_SCALE = 177 / 260;
const SIGNAL_SCALE = 173 / 230;
const HUB_SCALE = 256.5 / 342;

/** The 2x2 grid of score cards, and the 2x2 inside the signal box. */
const SCORE_AT = [
  { left: 0, top: 0 },
  { left: 193, top: 0 },
  { left: 0, top: 133.0926 },
  { left: 193, top: 133.0926 },
];
const SIGNAL_AT = [
  { left: 8, top: 8 },
  { left: 189, top: 8 },
  { left: 8, top: 162.1565 },
  { left: 189, top: 162.1565 },
];

/**
 * The drops between the rows. Same hairline the wide runs are drawn with — 1px,
 * white at 0.4, dashed 3 on 3 off — and the phone's replacement for them: the
 * wide fan spreads four cards into one box across 853px, which is not a shape
 * a 370px column has anywhere to put.
 */
function DashDown({ left, top }: { left: number; top: number }) {
  return (
    <span
      aria-hidden
      className="absolute block h-16 w-px sm:hidden"
      style={{
        left,
        top,
        backgroundImage:
          "repeating-linear-gradient(to bottom, rgba(255,255,255,0.4) 0 3px, transparent 3px 6px)",
      }}
    />
  );
}

const SCORES: {
  personKey: PersonKey;
  memberLabel: string;
  score: number;
  rating: "Excellent" | "Good";
  meterPercent: number;
}[] = [
  {
    personKey: "lilit",
    memberLabel: "Member 01",
    score: 762,
    rating: "Excellent",
    meterPercent: 71.6,
  },
  {
    personKey: "aram",
    memberLabel: "Member 02",
    score: 588,
    rating: "Good",
    meterPercent: 53.9,
  },
  {
    personKey: "mika",
    memberLabel: "Member 03",
    score: 590,
    rating: "Good",
    meterPercent: 45.1,
  },
  {
    personKey: "david",
    memberLabel: "Member 04",
    score: 875,
    rating: "Excellent",
    meterPercent: 83.3,
  },
];

const SIGNALS: {
  icon: "shield" | "dollar" | "pie" | "chart";
  title: [string, string];
  rows: SignalRow[];
}[] = [
  {
    icon: "shield",
    title: ["Identity &", "Fraud Signals"],
    rows: [
      { label: "ID verified", verified: true },
      { label: "Device trust", value: "High" },
      { label: "Synthetic risk", value: "Low" },
      { label: "Identity age", value: "5+ years" },
    ],
  },
  {
    icon: "dollar",
    title: ["Income &", "Financial Stability"],
    rows: [
      { label: "Monthly income", value: "$9,200" },
      { label: "Income stability", value: "96%" },
      { label: "Employer verified", verified: true },
    ],
  },
  {
    icon: "pie",
    title: ["Payment &", "Debt Behavior"],
    rows: [
      { label: "On-time payments", value: "97%" },
      { label: "Debt-to-income", value: "31%" },
      { label: "Revolving usage", value: "18%" },
      { label: "Payment discipline", value: "Strong" },
    ],
  },
  {
    icon: "chart",
    title: ["Account &", "History Analysis"],
    rows: [
      { label: "Credit age", value: "5.2 years" },
      { label: "Account mix", value: "Strong" },
      { label: "Inquiries (12m)", value: "2" },
      { label: "Derogatory marks", value: "None" },
    ],
  },
];

/*
 * Absolutely-positioned decoration inside the stage. Figma exports each of
 * these with the blur/glow baked in, so the asset is larger than the node it
 * belongs to; `left`/`top` are the asset's own top-left in stage coordinates.
 */
/*
 * Decoration placed in stage coordinates — glows, arcs, the convergence dot.
 *
 * Hidden below the gate rather than repositioned: every one of them describes a
 * distance between two things on the artboard, and on a phone those things are
 * stacked in a column instead. An arc drawn between the row that was and the
 * box that was is a line pointing at nothing.
 */
function StageArt({
  src,
  left,
  top,
  width,
  height,
  reveal,
  glowFrom,
}: {
  src: string;
  left: number;
  top: number;
  width: number;
  height: number;
  reveal?: string;
  /** The direction this piece's light travels in from — see glowFrom. */
  glowFrom?: string;
}) {
  return (
    <Image
      src={src}
      alt=""
      width={width}
      height={height}
      className="pointer-events-none absolute hidden max-w-none sm:block"
      style={{ left, top }}
      data-reveal={reveal}
      data-glow-from={glowFrom}
    />
  );
}

export default function IntelligenceLayer() {
  return (
    <section
      className="screen relative isolate w-full"
      data-sequence-section="intelligence"
    >
      {/*
        Ellipse 6147 — the light the mobile frame gives this section, and the
        only one it gives it: a 389px circle of brand blue blurred by 200,
        centred just off the left edge and level with the signal cards. It is
        literally the same file the wide layout's aura is (bg-glow.svg IS that
        circle at that blur), placed in the section rather than in a stage.

        isolate above, z-10 on the body: between them the layer is pinned behind
        this section's content and in front of the page, and cannot escape to
        either side of that. See .screen-glow.
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
            <Badge icon={<Brain />}>Intelligence Layer</Badge>
          </div>
          <h2
            className="font-heading type-title w-full text-center leading-none font-normal"
            data-reveal="copy"
          >
            Built on <span className="font-display italic">intelligence.</span>
            <br />
            Not just a credit score.
          </h2>
        </div>

        {/* No data-reveal on the wrapper: the funnel is built a row at a time,
            each drawing itself into the one below — see sections.ts — and a
            group fade over the top would flatten that into one crossfade.

            It is also the tallest artboard on the page by a wide margin (948px
            against the next one's 628), so it is the section that pays most for
            being fitted into a screen: on a short window this is where the
            scale bottoms out first. */}
        <div className="screen-payload px-4 sm:px-0">
          {/* stage-viewport-clip: the funnel's ambient glow is a 1189px asset on
              a 1112px stage, so it overhangs the artboard on every side. The top
              and bottom of it were always cropped; clipping the sides too keeps
              a window near the stage's own width from raising a scrollbar for
              39px of blur. */}
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
                      {/* Ambient glow, centred on the stage behind the signal
                          row. Wide layout only — the phone's frame lights this
                          section from a single ellipse off its left edge
                          instead, and a 1189px aura in a 370px column would be
                          the whole screen. */}
                      <StageArt
                        src="/intel/bg-glow.svg"
                        left={-38}
                        top={-224}
                        width={1189}
                        height={1189}
                        reveal="aura"
                        glowFrom="0.7 0.7"
                      />

                      {/* Row 1: four member score cards. A row of four across
                          the whole stage up here, a 2x2 grid at 0.681 down
                          there — both absolute, so one element carries both. */}
                      {SCORES.map((s, i) => (
                        <div
                          key={s.memberLabel}
                          className="absolute top-[var(--pt)] left-[var(--pl)] origin-top-left scale-[var(--s)] sm:top-0 sm:left-[var(--wl)] sm:scale-100"
                          style={
                            {
                              "--pl": `${SCORE_AT[i].left}px`,
                              "--pt": `${SCORE_AT[i].top}px`,
                              "--wl": `${i * 284}px`,
                              "--s": SCORE_SCALE,
                            } as React.CSSProperties
                          }
                          data-reveal="member"
                        >
                          <MemberScoreCard
                            person={PEOPLE[s.personKey]}
                            {...s}
                          />
                        </div>
                      ))}

                      {/* The fan from the four cards down into the signal row —
                          so the light runs down it, the direction the whole
                          diagram flows. Two straight drops do the same job in
                          the column; see DashDown. */}
                      <ConnectorTrace
                        className="hidden sm:block"
                        src="/intel/connector-top.svg"
                        width={853}
                        height={120.5}
                        left={130}
                        top={172}
                        axis="y"
                        spark={70}
                        pad={20}
                      />
                      <DashDown left={89} top={250} />
                      <DashDown left={282} top={250} />

                      {/*
                        Figma nests this arc inside the signal container, where
                        its own overflow-clip would hide it entirely — yet the
                        artboard renders it. Same quirk as the other ambient
                        glows: it has to be a sibling of the clipping box, not a
                        child. Both frames draw it centred on the column with its
                        middle about 30px above the box it lights, so the phone's
                        is the same asset at 447/547 of the size.
                      */}
                      <Image
                        src="/intel/signal-arc.svg"
                        alt=""
                        width={547}
                        height={158}
                        className="pointer-events-none absolute top-[284px] left-[-38.5px] max-w-none origin-top-left scale-[0.817] sm:top-[172.5px] sm:left-[283px] sm:scale-100"
                        data-reveal="signals"
                      />

                      {/* Both convergence dots sit *behind* the box they meet, so
                          the translucent surface dims their lower half. */}
                      <StageArt
                        src="/intel/fan-dot.svg"
                        left={533}
                        top={259}
                        width={46}
                        height={46}
                        reveal="node"
                      />

                      {/* Row 2: the signal container and its four category cards.
                          The hairline is an inset ring, not a border: Figma draws
                          the stroke over the 8px padding, and a real border would
                          eat 2px the four cards need. */}
                      <div
                        className="bg-vignette absolute top-[314.185px] left-0 h-[316.313px] w-[370px] rounded-2xl bg-[rgba(8,8,20,0.2)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),inset_0px_4px_20px_0px_rgba(255,255,255,0.08)] sm:top-[282px] sm:left-[76.5px] sm:h-[210px] sm:w-[960px]"
                        data-reveal="signals"
                      >
                        {/* "category", not "signal": the container is already
                            [data-reveal='signals'], and two roles a letter apart
                            is one typo away from a card row that never animates. */}
                        {SIGNALS.map((s, i) => (
                          <div
                            key={s.title.join(" ")}
                            className="absolute top-[var(--pt)] left-[var(--pl)] origin-top-left scale-[var(--s)] sm:top-2 sm:left-[var(--wl)] sm:scale-100"
                            style={
                              {
                                "--pl": `${SIGNAL_AT[i].left}px`,
                                "--pt": `${SIGNAL_AT[i].top}px`,
                                "--wl": `${8 + i * 238}px`,
                                "--s": SIGNAL_SCALE,
                              } as React.CSSProperties
                            }
                          >
                            <SignalCard reveal="category" {...s} />
                          </div>
                        ))}
                      </div>

                      {/* Connector: signal row down into the hub. Figma mirrors
                          the asset so the bright end leads into the dot — and
                          that dot carries a blurred drop shadow filling the whole
                          46px box, so the light has to be held to the stroke's
                          own width or it paints the shadow's disc instead of the
                          wire. */}
                      <ConnectorTrace
                        className="hidden sm:block"
                        src="/intel/hub-connector.svg"
                        width={46}
                        height={64}
                        left={533}
                        top={491}
                        axis="y"
                        spark={40}
                        cross={14}
                        pad={24}
                        flipY
                      />
                      <DashDown left={185} top={630} />

                      <div
                        className="absolute top-[694.5px] left-[56.75px] origin-top-left scale-[var(--s)] sm:top-[532px] sm:left-[385px] sm:scale-100"
                        style={{ "--s": HUB_SCALE } as React.CSSProperties}
                        data-reveal="hub"
                      >
                        <BanroxEngineHub />
                      </div>

                      {/* Connector: hub down into the approved pill. Only a pixel
                          wide, so the padding is what gives its bloom anywhere to
                          spread. */}
                      <ConnectorTrace
                        className="hidden sm:block"
                        src="/intel/pill-connector.svg"
                        width={1}
                        height={40}
                        left={555.5}
                        top={868}
                        axis="y"
                        spark={26}
                        pad={24}
                      />
                      <DashDown left={185} top={946} />

                      {/* Not scaled on the phone, only narrowed: 306 wide with
                          its 16px type intact. It is the one line of reading in
                          the diagram and the sentence the whole funnel is for. */}
                      <div
                        className="bg-vignette absolute top-[1010.5px] left-8 flex h-10 w-[306px] items-center justify-center gap-2 rounded-lg border border-white/10 bg-[rgba(8,8,20,0.2)] px-4 py-3 whitespace-nowrap shadow-[inset_0px_4px_20px_0px_rgba(255,255,255,0.08)] sm:top-[908px] sm:left-[387px] sm:w-[338px]"
                        data-reveal="verdict"
                      >
                        <Tick size={16} />
                        <div className="flex items-center gap-2">
                          <p className="font-heading text-[16px] leading-none text-white">
                            Combined Straight
                          </p>
                          <span className="bg-white/50 block size-1 shrink-0 rounded-full" />
                          <p className="font-heading text-success text-[16px] leading-none">
                            Approved $25,000
                          </p>
                        </div>
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
