import Image from "next/image";
import AvatarRing from "@/components/ui/AvatarRing";
import Badge from "@/components/ui/Badge";
import FigurePanel from "@/components/ui/FigurePanel";
import ScoreBadge from "@/components/ui/ScoreBadge";
import StepCard from "@/components/ui/StepCard";
import { CreditCard, VerifiedCheck } from "@/components/ui/icons";
import { PEOPLE, VOTE_FRAMING } from "@/data/people";

/*
 * "How Squad Works" — three 392x508 step cards in a row, 32px apart
 * (3x392 + 2x32 = 1240, the standard content width).
 */

function RingedAvatar({
  personKey,
  left,
  top,
  verified = true,
}: {
  personKey: keyof typeof VOTE_FRAMING;
  left: number;
  top: number;
  verified?: boolean;
}) {
  return (
    <div className="absolute" style={{ left, top }}>
      <AvatarRing size={40} person={PEOPLE[personKey]} framing={VOTE_FRAMING[personKey]} />
      {verified ? (
        <span className="absolute right-0 bottom-0.5">
          <VerifiedCheck size={12} />
        </span>
      ) : null}
    </div>
  );
}

function Step1Figure() {
  return (
    <FigurePanel texture="/works/step1-texture.svg">
      {/* Three concentric rings, centred in the panel. */}
      <Image
        src="/works/step1-ring-outer.svg"
        alt=""
        width={192}
        height={192}
        className="pointer-events-none absolute top-1/2 left-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
      />
      <Image
        src="/works/step1-ring-mid.svg"
        alt=""
        width={118}
        height={118}
        className="pointer-events-none absolute top-1/2 left-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
      />
      <Image
        src="/works/step1-ring-inner.svg"
        alt=""
        width={212}
        height={212}
        className="pointer-events-none absolute top-1/2 left-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
      />

      <RingedAvatar personKey="lilit" left={160} top={14} />
      <RingedAvatar personKey="mika" left={256} top={110} />
      <RingedAvatar personKey="aram" left={64} top={110} />
      <RingedAvatar personKey="david" left={159} top={206} verified={false} />

      <span className="absolute top-[239px] left-[calc(50%-0.5px)] flex h-3.5 -translate-x-1/2 items-center justify-center rounded-[10px] bg-white px-1 drop-shadow-[0px_6px_4px_rgba(38,75,255,0.6)]">
        <span className="font-heading text-brand-deep text-[10px] leading-none whitespace-nowrap">
          You
        </span>
      </span>

      <Image
        src="/works/step1-hub-logo.svg"
        alt=""
        width={54}
        height={60}
        className="pointer-events-none absolute top-[91px] left-[153px] max-w-none mix-blend-hard-light"
      />
      <p className="font-heading absolute top-[150px] left-[calc(50%+0.5px)] -translate-x-1/2 text-[16px] leading-[1.2] tracking-[-0.96px] whitespace-nowrap text-white/50">
        4 / 4
      </p>
    </FigurePanel>
  );
}

function Step2Figure() {
  return (
    <FigurePanel texture="/works/step2-texture.svg">
      <Image
        src="/works/step2-connectors.svg"
        alt=""
        width={240}
        height={152}
        className="pointer-events-none absolute top-[40.5px] left-[60.5px] max-w-none"
      />

      <div className="absolute top-[16px] left-[16px]">
        <ScoreBadge person={PEOPLE.lilit} personKey="lilit" score={762} rating="Good" />
      </div>
      <div className="absolute top-[164px] left-[16px]">
        <ScoreBadge person={PEOPLE.aram} personKey="aram" score={645} rating="Fair" />
      </div>
      <div className="absolute top-[16px] left-[245px]">
        <ScoreBadge person={PEOPLE.mika} personKey="mika" score={590} rating="Poor" />
      </div>
      <div className="absolute top-[164px] left-[245px]">
        <ScoreBadge person={PEOPLE.david} personKey="david" score={875} rating="Good" />
      </div>

      {/* Group-score ring, centred a touch above the panel's vertical middle. */}
      <div className="absolute top-[113px] left-1/2 -translate-x-1/2 -translate-y-1/2">
        <Image
          src="/works/step2-ring-mid.svg"
          alt=""
          width={118}
          height={118}
          className="pointer-events-none absolute top-1/2 left-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
        />
        <Image
          src="/works/step2-ring-inner.svg"
          alt=""
          width={224}
          height={224}
          className="pointer-events-none absolute top-1/2 left-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
        />
        <div className="relative flex flex-col items-center gap-2 text-center">
          <p className="font-heading text-[10px] tracking-[1px] text-white uppercase opacity-40">
            Group Score
          </p>
          <div className="flex flex-col items-center gap-1 leading-none">
            <p className="font-heading text-[24px] text-white">718</p>
            <p className="font-heading text-success text-[12px] font-semibold">
              Good
            </p>
          </div>
        </div>
      </div>

      <div className="absolute top-[231px] left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap">
        <p className="font-heading text-[14px] leading-[1.2] text-white/50">
          4 profiles
        </p>
        <span className="bg-white/50 block size-[3px] shrink-0 rounded-full" />
        <p className="font-heading text-[14px] leading-[1.2] text-white/50">
          1 assessment
        </p>
      </div>
    </FigurePanel>
  );
}

type Bar = { value: string; name: string; height: number; color: string };

/*
 * Chart colors are a one-off categorical palette distinguishing five people,
 * not semantic status colors, so they live here rather than as design tokens.
 */
const BARS: Bar[] = [
  { value: "$4,000", name: "Mika", height: 160.08, color: "#00c2ff" },
  { value: "$5,000", name: "Lilit", height: 124.69, color: "#7b4fff" },
  { value: "$6,000", name: "Maya", height: 150.29, color: "#22c55e" },
  { value: "$5,250", name: "Jordan", height: 115.71, color: "#f59e0b" },
  { value: "$4,750", name: "Reserve", height: 94, color: "#264bff" },
];

function Step3Figure() {
  return (
    <FigurePanel texture="/works/step3-texture.svg">
      {/* Decorative arc + leader lines connecting the first and last bars. */}
      <Image
        src="/works/step3-arc.svg"
        alt=""
        width={200.5}
        height={90.5}
        className="pointer-events-none absolute top-[60.75px] left-[113px] max-w-none"
      />
      {/* Centred rather than corner-positioned: the asset's own rotation
          (matching Figma's wrapper) makes its post-rotation bounding box
          awkward to derive by hand, but its centre point is exact. */}
      <Image
        src="/works/step3-tick-h.svg"
        alt=""
        width={9.25}
        height={1}
        className="pointer-events-none absolute top-[16px] left-[169.63px] max-w-none -translate-x-1/2 -translate-y-1/2"
      />
      <Image
        src="/works/step3-tick-v.svg"
        alt=""
        width={9.25}
        height={1}
        className="pointer-events-none absolute top-[64.38px] left-[313px] max-w-none -translate-x-1/2 -translate-y-1/2 -rotate-90"
      />
      <Image
        src="/works/step3-dot.svg"
        alt=""
        width={8}
        height={8}
        className="pointer-events-none absolute top-[71px] left-[109px] max-w-none"
      />
      <Image
        src="/works/step3-dot.svg"
        alt=""
        width={8}
        height={8}
        className="pointer-events-none absolute top-[102px] left-[309px] max-w-none"
      />

      <div className="absolute bottom-4 left-1/2 flex w-[328px] -translate-x-1/2 items-end gap-1">
        {BARS.map((bar) => (
          <div key={bar.name} className="flex flex-1 flex-col items-center justify-center gap-1">
            {/*
              Figma builds this as a horizontal capsule rotated -90deg (an
              auto-layout workaround on their end) — a plain vertical bar is
              simpler and identical on screen since nothing here is
              constrained to their DOM shape.
            */}
            <div
              className="w-[3px] rounded-[2px]"
              style={{ height: bar.height, backgroundColor: bar.color }}
            />
            <div className="flex flex-col items-center text-[12px] leading-normal tracking-[-0.24px] whitespace-nowrap">
              <p className="font-semibold text-white">{bar.value}</p>
              <p className="font-medium text-white/70">{bar.name}</p>
            </div>
          </div>
        ))}
      </div>
    </FigurePanel>
  );
}

export default function HowSquadWorks() {
  return (
    <section className="w-full pt-25 pb-[170px]">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col items-center gap-4 px-6">
        <Badge icon={<CreditCard />}>How Squad works</Badge>
        <h2 className="font-heading w-full text-center text-[clamp(1.75rem,3.9vw,3rem)] leading-none font-normal">
          Three steps.
          <br />
          One <span className="font-display italic">shared line.</span>
        </h2>
      </div>

      {/* Gap lives on this wrapper: .stage-viewport sets its own margin-block
          and a utility here would collide with it (same fix as the other
          stage-based sections). */}
      <div className="mt-15 w-full">
        <div className="stage-viewport w-full">
          <div
            className="stage-sizer relative"
            style={
              {
                "--stage-w": 1240,
                "--stage-h": 508,
                "--stage-min": 0.4,
              } as React.CSSProperties
            }
          >
            <div className="stage relative flex gap-8">
              <div className="w-[392px] shrink-0">
                <StepCard
                  figure={<Step1Figure />}
                  title="Form your squad"
                  description="Invite up to 3 trusted people — friends, family, or anyone you trust financially. Each member connects their bank and authorizes a credit check."
                />
              </div>
              <div className="w-[392px] shrink-0">
                <StepCard
                  figure={<Step2Figure />}
                  title="Get scored as a group"
                  description="Banrox's patented group risk engine combines every member's profile into a single group assessment. Combined behavior is more stable — which is why the group qualifies for more."
                />
              </div>
              <div className="w-[392px] shrink-0">
                <StepCard
                  figure={<Step3Figure />}
                  title="Spend in your lane, back each other"
                  description="Each member has a private spending lane. Need more — the squad votes and the reserve releases. Cover each other to keep the account current. The group total never changes."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
