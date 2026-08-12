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
function StageArt({
  src,
  left,
  top,
  width,
  height,
  reveal,
}: {
  src: string;
  left: number;
  top: number;
  width: number;
  height: number;
  reveal?: string;
}) {
  return (
    <Image
      src={src}
      alt=""
      width={width}
      height={height}
      className="pointer-events-none absolute max-w-none"
      style={{ left, top }}
      data-reveal={reveal}
    />
  );
}

export default function IntelligenceLayer() {
  return (
    <section
      className="relative w-full pt-25 pb-25"
      data-sequence-section="intelligence"
    >
      {/* See Hero. */}
      <div data-shift="">
        <div
          className="mx-auto flex w-full max-w-[1240px] flex-col items-center gap-4 px-6"
          data-beat="copy"
        >
          <div className="flex" data-reveal="copy">
            <Badge icon={<Brain />}>Intelligence Layer</Badge>
          </div>
          <h2
            className="font-heading w-full text-center text-[clamp(1.75rem,3.9vw,3rem)] leading-none font-normal"
            data-reveal="copy"
          >
            Built on <span className="font-display italic">intelligence.</span>
            <br />
            Not just a credit score.
          </h2>
        </div>

        {/* No data-reveal on the wrapper: the funnel is 948px tall, so it is
            built a row at a time as each row arrives — see sections.ts — and a
            group fade over the top would flatten that back into one crossfade. */}
        <div className="mt-15 w-full">
          <div className="stage-viewport w-full">
            <div
              className="stage-sizer relative"
              style={
                {
                  "--stage-w": STAGE_W,
                  "--stage-h": STAGE_H,
                  "--stage-min": 0.35,
                } as React.CSSProperties
              }
            >
              <div className="stage relative">
                {/* Ambient glow, centred on the stage behind the signal row. */}
                <StageArt
                  src="/intel/bg-glow.svg"
                  left={-38}
                  top={-224}
                  width={1189}
                  height={1189}
                  reveal="aura"
                />

                {/* Row 1: four member score cards. */}
                <div
                  className="absolute flex gap-6"
                  style={{ left: 0, top: 0 }}
                  data-beat="members"
                >
                  {SCORES.map((s) => (
                    <div key={s.memberLabel} data-reveal="member">
                      <MemberScoreCard person={PEOPLE[s.personKey]} {...s} />
                    </div>
                  ))}
                </div>

                {/* The fan from the four cards down into the signal row — so the
                    light runs down it, the direction the whole diagram flows. */}
                <ConnectorTrace
                  src="/intel/connector-top.svg"
                  width={853}
                  height={120.5}
                  left={130}
                  top={172}
                  axis="y"
                  spark={70}
                  pad={20}
                />

                {/*
                  Figma nests this arc inside the signal container, where its own
                  overflow-clip would hide it entirely — yet the artboard renders
                  it. Same quirk as the other ambient glows: it has to be a
                  sibling of the clipping box, not a child.
                */}
                <StageArt
                  src="/intel/signal-arc.svg"
                  left={283}
                  top={172.5}
                  width={547}
                  height={158}
                  reveal="signals"
                />

                {/* Both convergence dots sit *behind* the box they meet, so the
                    translucent surface dims their lower half. */}
                <StageArt
                  src="/intel/fan-dot.svg"
                  left={533}
                  top={259}
                  width={46}
                  height={46}
                  reveal="node"
                />

                {/* Row 2: the signal container and its four category cards. */}
                {/* The hairline is an inset ring, not a border: Figma draws the
                    stroke over the 8px padding, and a real border would eat 2px
                    the four 230px cards need. */}
                <div
                  className="bg-vignette absolute flex h-[210px] w-[960px] gap-2 rounded-2xl bg-[rgba(8,8,20,0.2)] p-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),inset_0px_4px_20px_0px_rgba(255,255,255,0.08)]"
                  style={{ left: 76.5, top: 282 }}
                  data-reveal="signals"
                  data-beat="signals"
                >
                  {/* "category", not "signal": the container above is already
                      [data-reveal='signals'], and two roles a letter apart is
                      one typo away from a card row that never animates. */}
                  {SIGNALS.map((s) => (
                    <SignalCard
                      key={s.title.join(" ")}
                      reveal="category"
                      {...s}
                    />
                  ))}
                </div>

                {/* Connector: signal row down into the hub. Figma mirrors the
                    asset so the bright end leads into the dot — and that dot
                    carries a blurred drop shadow filling the whole 46px box, so
                    the light has to be held to the stroke's own width or it
                    paints the shadow's disc instead of the wire. */}
                <ConnectorTrace
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

                <div
                  className="absolute"
                  style={{ left: 385, top: 532 }}
                  data-reveal="hub"
                  data-beat="hub"
                >
                  <BanroxEngineHub />
                </div>

                {/* Connector: hub down into the approved pill. Only a pixel wide,
                    so the padding is what gives its bloom anywhere to spread. */}
                <ConnectorTrace
                  src="/intel/pill-connector.svg"
                  width={1}
                  height={40}
                  left={555.5}
                  top={868}
                  axis="y"
                  spark={26}
                  pad={24}
                />

                <div
                  className="bg-vignette absolute flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-[rgba(8,8,20,0.2)] px-4 py-3 whitespace-nowrap shadow-[inset_0px_4px_20px_0px_rgba(255,255,255,0.08)]"
                  style={{ left: 387, top: 908, width: 338 }}
                  data-reveal="verdict"
                  data-beat="verdict"
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
    </section>
  );
}
