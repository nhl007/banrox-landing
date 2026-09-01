import Image from "next/image";
import AvatarRing from "@/components/ui/AvatarRing";
import Badge from "@/components/ui/Badge";
import ComparisonCard from "@/components/ui/ComparisonCard";
import PersonChip from "@/components/ui/PersonChip";
import StrengthBar from "@/components/ui/StrengthBar";
import { ArrowDataTransfer, Cancel, Tick } from "@/components/ui/icons";
import SectionBloom from "@/components/ui/SectionBloom";
import { CLUSTER_FRAMING, PEOPLE, type PersonKey } from "@/data/people";

/*
 * "Alone Vs Together" — two 564x628 panels on a 1240-wide row, 112px apart,
 * with the VS mark centred between them.
 */

const ROW_W = 1240;
const ROW_H = 628;

/**
 * And the phone's, which is the same pair stacked: 514 of panel, 24, the 48px
 * VS, 24, 514 of panel. 370 wide is the mobile frame less its 16px gutters.
 */
const PHONE_COLUMN_W = 370;
const PHONE_COLUMN_H = 1124;

/** The squad cluster: offsets and diameters straight off the artboard. */
const CLUSTER: {
  person: PersonKey;
  size: number;
  left: number;
  top: number;
}[] = [
  { person: "david", size: 40, left: 0, top: 17 },
  { person: "lilit", size: 56, left: 29, top: 41 },
  { person: "mika", size: 40, left: 74, top: 17 },
  { person: "aram", size: 40, left: 37, top: 0 },
];

function Separator({ tone }: { tone: "negative" | "success" }) {
  return (
    <span
      className={`block size-1 shrink-0 rounded-full ${
        tone === "negative" ? "bg-negative" : "bg-success"
      }`}
    />
  );
}

function AloneCard() {
  return (
    <ComparisonCard variant="alone" reveal="card-left">
      {/*
       * The verdict, in the middle of the rings. 216 wide at y148 on the wide panel;
       * the same 216 at three quarters the size, dead centre, at y119.5 on the
       * phone's. origin-top is what keeps the top edge on that 119.5 while the box
       * shrinks around its own centre line.
       */}
      <div className="absolute top-[119.5px] left-1/2 flex w-[216px] origin-top -translate-x-1/2 scale-75 flex-col items-center gap-5 sm:top-[148px] sm:scale-100">
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <AvatarRing size={56} tone="muted">
              <Image
                src="/icons/shield-filled.svg"
                alt=""
                width={24}
                height={27}
                style={{ width: 23.91, height: 26.65 }}
              />
            </AvatarRing>
            <p className="font-heading text-base leading-[1.2] whitespace-nowrap text-white/50">
              Applying Alone
            </p>
          </div>

          <div className="flex w-full flex-col items-center gap-0.5">
            <div className="flex items-center justify-center gap-2">
              <span className="flex items-center gap-2">
                <Cancel size={20} />
                <span className="font-heading text-negative text-[24px] leading-[1.2] whitespace-nowrap">
                  Declined
                </span>
              </span>
              <Separator tone="negative" />
              <span className="font-heading text-negative text-[24px] leading-[1.2] font-medium whitespace-nowrap">
                $0.00
              </span>
            </div>
            <p className="font-heading text-[16px] leading-[1.2] whitespace-nowrap text-white/70">
              No access
            </p>
          </div>
        </div>

        <p className="font-heading w-full text-center text-[12px] leading-[1.4] text-white opacity-50">
          File, on its own. High DTI. Rebuilding score. No approval.
        </p>
      </div>

      {/*
       * Scattered around the rings on both artboards — the phone's frame is smaller
       * and pulls them in, so each carries the two positions rather than one and a
       * fallback.
       */}
      <PersonChip
        person="lilit"
        reason="Income too low"
        left={367}
        top={47}
        phone={{ left: 240.25, top: 63.75 }}
      />
      <PersonChip
        person="aram"
        reason="Recent account issue"
        left={34}
        top={100}
        phone={{ left: 20.5, top: 83.5 }}
      />
      <PersonChip
        person="mika"
        reason="Limited credit history"
        left={16}
        top={353}
        phone={{ left: 18, top: 273.25 }}
      />
      <PersonChip
        person="david"
        reason="High utilization"
        left={381}
        top={376}
        phone={{ left: 220.75, top: 290.5 }}
      />

      <StrengthBar
        reveal="bar"
        title="Alone Strength"
        note="Not enough approval power."
        stats={[
          { value: "502", label: "Credit Score" },
          { value: "68%", label: "DTI" },
          { value: "$4.5k", label: "Income" },
        ]}
      />
    </ComparisonCard>
  );
}

function SquadCard() {
  return (
    <ComparisonCard variant="squad" reveal="card-right">
      {/*
       * 241 wide, a pixel right of centre on the wide panel and 1.25 on the phone's
       * — Figma's own nudge in each frame.
       */}
      <div className="absolute top-[108.625px] left-[calc(50%+1.25px)] flex w-[241px] origin-top -translate-x-1/2 scale-75 flex-col items-center gap-5 sm:top-[133.5px] sm:left-[calc(50%+1px)] sm:scale-100">
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-2">
            {/*
             * AvatarRing is itself `relative`, so placement goes on a wrapper rather than
             * through className — the two would tie and collide.
             */}
            <div className="relative h-[97px] w-[114px]">
              {CLUSTER.map(({ person, size, left, top }) => (
                <span key={person} className="absolute" style={{ left, top }}>
                  <AvatarRing
                    size={size}
                    person={PEOPLE[person]}
                    framing={CLUSTER_FRAMING[person]}
                  />
                </span>
              ))}
            </div>
            <p className="font-heading text-[16px] leading-[1.2] whitespace-nowrap text-white/70">
              With Squad
            </p>
          </div>

          <div className="flex flex-col items-center gap-0.5">
            <div className="flex w-full items-center gap-2">
              <span className="flex items-center gap-1.5">
                <Tick size={20} />
                <span className="font-heading text-success text-[24px] leading-[1.2] font-medium whitespace-nowrap">
                  Approved
                </span>
              </span>
              <Separator tone="success" />
              <span className="font-heading text-success text-[24px] leading-[1.2] font-medium whitespace-nowrap">
                $25,000
              </span>
            </div>
            <p className="font-heading text-center text-[16px] leading-[1.2] font-medium whitespace-nowrap text-white">
              Shared Credit Line
            </p>
          </div>
        </div>

        <p className="w-full max-w-[192px] text-center text-[12px] leading-[1.4] tracking-[-0.24px] text-white/50">
          Same file. Backed by three others and one shared reserve.
        </p>
      </div>

      <PersonChip
        person="lilit"
        approved
        left={336}
        top={42}
        phone={{ left: 226, top: 60 }}
      />
      <PersonChip
        person="aram"
        approved
        left={22}
        top={76}
        phone={{ left: 17.5, top: 63.5 }}
      />
      <PersonChip
        person="mika"
        approved
        left={16}
        top={327}
        phone={{ left: 15, top: 300.75 }}
      />
      <PersonChip
        person="david"
        approved
        left={373}
        top={373}
        phone={{ left: 217.75, top: 309.25 }}
      />

      <StrengthBar
        reveal="bar"
        title="Squad Strength"
        note="Higher approval power."
        stats={[
          { value: "712", label: "Avg Squad score", positive: true },
          { value: "34%", label: "Avg DTI", positive: true },
          { value: "$21.5K", label: "Combined Income", positive: true },
        ]}
      />
    </ComparisonCard>
  );
}

export default function AloneVsTogether() {
  return (
    <section
      className="screen relative isolate w-full"
      data-sequence-section="alone"
    >
      {/*
       * isolate above, z-10 here: between them the ambient ground is pinned behind
       * this section's content and in front of the page, and cannot escape to either
       * side of that.
       */}
      <SectionBloom id="alone" />
      <div className="screen-body relative z-10">
        <div className="screen-copy mx-auto flex max-w-[1240px] flex-col items-center gap-4 px-4 sm:gap-[clamp(0.5rem,1.8svh,1rem)] sm:px-6">
          <div className="flex" data-reveal="copy">
            <Badge icon={<ArrowDataTransfer />}>Alone Vs Together</Badge>
          </div>
          <div className="flex w-full flex-col items-center gap-4 text-center sm:gap-[clamp(0.5rem,1.8svh,1rem)]">
            {/*
             * pb-px: Figma measures this two-line box at 97px where the browser lays it
             * out at 96, which would pull everything below up by a pixel.
             */}
            <h2
              className="font-heading type-title w-full pb-px leading-none font-normal"
              data-reveal="copy"
            >
              {/* Both breaks are the wide layout's. */}
              Alone, each of you falls short.{" "}
              <br className="hidden sm:inline" />
              <span className="font-display italic">Together,</span> you qualify
              for more.
            </h2>
            <p
              className="type-lede type-measure max-w-[604px] tracking-[-0.32px] text-white/70"
              data-reveal="copy"
            >
              Squad combines your profiles into one group application.{" "}
              <br className="hidden sm:inline" />
              Different strengths, one shared line.
            </p>
          </div>
        </div>

        {/*
         * stage-viewport-clip: the panels start a little below where they sit
         * (MOTION.alone.lift) and shorter than they end up, so both extend past the
         * stage's floor on the way in.
         */}
        <div className="screen-payload px-4 sm:px-0">
          <div className="stage-viewport stage-viewport-clip stage-fluid">
            <div
              className="stage-sizer"
              style={
                {
                  "--stage-w": ROW_W,
                  "--stage-h": ROW_H,
                } as React.CSSProperties
              }
            >
              <div className="stage w-full sm:w-auto">
                {/* sm:scale-[0.92] — the row, a shade smaller than the artboard draws it. */}
                {/*
                 * The phone's artboard for the pair: 370x1124, which is panel, 24, VS, 24,
                 * panel.
                 */}
                <div className="panel-fit">
                  <div
                    className="panel-sizer"
                    style={
                      {
                        "--panel-w": PHONE_COLUMN_W,
                        "--panel-h": PHONE_COLUMN_H,
                      } as React.CSSProperties
                    }
                  >
                    <div className="panel-stage">
                      <div className="flex w-full flex-col items-center gap-6 sm:h-full sm:scale-[0.92] sm:flex-row sm:items-start sm:gap-28">
                        <AloneCard />
                        {/*
                         * Between the two panels on a phone, dead centre of the row from sm: up — the
                         * same word doing the same job either way. 48px in both, in a 48px box.
                         */}
                        <span
                          className="font-display flex h-12 items-center text-[48px] leading-none text-white italic opacity-70 sm:absolute sm:top-1/2 sm:left-1/2 sm:h-auto sm:-translate-x-1/2 sm:-translate-y-1/2"
                          data-reveal="vs"
                        >
                          VS
                        </span>
                        <SquadCard />
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
