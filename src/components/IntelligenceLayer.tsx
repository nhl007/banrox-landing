import Image from "next/image";
import Badge from "@/components/ui/Badge";
import BanroxEngineHub from "@/components/ui/BanroxEngineHub";
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
  { personKey: "lilit", memberLabel: "Member 01", score: 762, rating: "Excellent", meterPercent: 71.6 },
  { personKey: "aram", memberLabel: "Member 02", score: 588, rating: "Good", meterPercent: 53.9 },
  { personKey: "mika", memberLabel: "Member 03", score: 590, rating: "Good", meterPercent: 45.1 },
  { personKey: "david", memberLabel: "Member 04", score: 875, rating: "Excellent", meterPercent: 83.3 },
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

function ConvergenceDot({
  className = "",
  style,
}: {
  className?: string;
  style: React.CSSProperties;
}) {
  return (
    <span
      className={`absolute size-4 rounded-full border border-white/40 bg-white shadow-[0_0_12px_4px_rgba(93,128,255,0.6)] ${className}`.trim()}
      style={style}
    />
  );
}

export default function IntelligenceLayer() {
  return (
    <section className="w-full pt-25 pb-[170px]">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col items-center gap-4 px-6">
        <Badge icon={<Brain />}>Intelligence Layer</Badge>
        <h2 className="font-heading w-full pb-px text-center text-[clamp(1.75rem,3.9vw,3rem)] leading-none font-normal">
          Built on <span className="font-display italic">intelligence.</span>
          <br />
          Not just a credit score.
        </h2>
      </div>

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
              {/* Ambient glow behind the fan-to-signal-row convergence. */}
              <Image
                src="/intel/bg-glow.svg"
                alt=""
                width={1189}
                height={1189}
                className="pointer-events-none absolute max-w-none"
                style={{ left: 556, top: 165, transform: "translate(-50%, -50%)" }}
              />

              {/* Row 1: four member score cards. */}
              <div className="absolute flex gap-6" style={{ left: 0, top: 0 }}>
                {SCORES.map((s) => (
                  <MemberScoreCard key={s.memberLabel} person={PEOPLE[s.personKey]} {...s} />
                ))}
              </div>

              <Image
                src="/intel/connector-top.svg"
                alt=""
                width={853}
                height={120.5}
                className="pointer-events-none absolute max-w-none"
                style={{ left: 130, top: 172 }}
              />
              <ConvergenceDot className="-translate-x-1/2 -translate-y-1/2" style={{ left: 572, top: 298 } as React.CSSProperties} />

              {/* Row 2: four signal-category cards. */}
              <div className="absolute flex gap-2" style={{ left: 76.5, top: 282 }}>
                {SIGNALS.map((s) => (
                  <SignalCard key={s.title.join(" ")} {...s} />
                ))}
              </div>

              {/* Connector: signal row down into the hub. */}
              <span
                className="absolute w-px border-l border-dashed border-white/20"
                style={{ left: 572, top: 492, height: 40 }}
              />
              <ConvergenceDot className="-translate-x-1/2 -translate-y-1/2" style={{ left: 572, top: 532 } as React.CSSProperties} />

              <div className="absolute" style={{ left: 385, top: 532 }}>
                <BanroxEngineHub />
              </div>

              {/* Connector: hub down into the approved pill. */}
              <span
                className="absolute w-px border-l border-dashed border-white/20"
                style={{ left: 572, top: 868, height: 40 }}
              />

              <div
                className="bg-vignette absolute flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-[rgba(8,8,20,0.2)] px-4 py-3 whitespace-nowrap shadow-[inset_0px_4px_20px_0px_rgba(255,255,255,0.08)]"
                style={{ left: 387, top: 908, width: 338 }}
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
    </section>
  );
}
