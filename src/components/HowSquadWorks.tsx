import Image from "next/image";
import AvatarRing from "@/components/ui/AvatarRing";
import Badge from "@/components/ui/Badge";
import ConnectorTrace from "@/components/ui/ConnectorTrace";
import FigurePanel from "@/components/ui/FigurePanel";
import ScoreBadge from "@/components/ui/ScoreBadge";
import StepCard from "@/components/ui/StepCard";
import { CreditCard, VerifiedCheck } from "@/components/ui/icons";
import SectionBloom from "@/components/ui/SectionBloom";
import { PEOPLE, VOTE_FRAMING } from "@/data/people";

/*
 * "How Squad Works" — three 392x508 step cards in a row, 32px apart
 * (3x392 + 2x32 = 1240, the standard content width).
 */

/*
 * Step 3's arc, and the room left around it for the endpoint dots and for the
 * light's bloom to fall off before the wipe clips it.
 *
 * Everything decorating the arc is authored in panel coordinates — which is how
 * Figma gives them and the only way to check them against the artwork — and
 * `onArc` rebases them onto the trace's own padded box, where they have to live
 * so the wipe reveals them along with the line they belong to.
 *
 * Figma frames the bracket at (113.5, 16) 199.5x90 and the asset overhangs that
 * by half a stroke on three sides, which is the box below. The two numbers to
 * check it against are the dots: the path's ends land on (113.5, 74.5) and
 * (313, 106), and the dots Figma places independently sit at (113, 75) and
 * (313, 106).
 */
const ARC = { left: 113, top: 15.5, width: 200.5, height: 90.5 };
const TRACE_PAD = 18;
const onArc = (left: number, top: number) => ({
  left: left - ARC.left + TRACE_PAD,
  top: top - ARC.top + TRACE_PAD,
});

function RingedAvatar({
  personKey,
  left,
  top,
  verified = true,
  label,
}: {
  personKey: keyof typeof VOTE_FRAMING;
  left: number;
  top: number;
  verified?: boolean;
  /**
   * A name tag riding just under the avatar. Only "You" uses it, and it has to
   * belong to the avatar rather than to the panel: the four of them go round
   * (see the orbit note below), and a tag left at the bottom of the panel would
   * spend three quarters of every lap labelling somebody else.
   */
  label?: string;
}) {
  return (
    /* data-orbit-rider: turned back by exactly what the ring turns, so this
       travels the circle upright. See worksOrbit. */
    <div className="absolute" style={{ left, top }} data-orbit-rider>
      <AvatarRing
        size={40}
        person={PEOPLE[personKey]}
        framing={VOTE_FRAMING[personKey]}
      />
      {verified ? (
        <span className="absolute right-0 bottom-0.5">
          <VerifiedCheck size={12} />
        </span>
      ) : null}
      {label ? (
        /* Figma centres this half a pixel right of the avatar's own centre, at
           the panel's 179.5 against its 179 — kept rather than rounded away, so
           the tag sits where the artboard puts it. */
        <span className="absolute top-[33px] left-[calc(50%+0.5px)] flex h-3.5 -translate-x-1/2 items-center justify-center rounded-[10px] bg-white px-1 drop-shadow-[0px_6px_4px_rgba(38,75,255,0.6)]">
          <span className="font-heading text-brand-deep text-[10px] leading-none whitespace-nowrap">
            {label}
          </span>
        </span>
      ) : null}
    </div>
  );
}

function Step1Figure() {
  return (
    <FigurePanel texture="/works/step1-texture.svg">
      {/* Three concentric rings, centred in the panel. data-glow: these never
          settle — see worksAmbient. */}
      <Image
        src="/works/step1-ring-outer.svg"
        alt=""
        width={192}
        height={192}
        className="pointer-events-none absolute top-1/2 left-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
        data-glow=""
      />
      <Image
        src="/works/step1-ring-mid.svg"
        alt=""
        width={118}
        height={118}
        className="pointer-events-none absolute top-1/2 left-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
        data-glow=""
      />
      <Image
        src="/works/step1-ring-inner.svg"
        alt=""
        width={212}
        height={212}
        className="pointer-events-none absolute top-1/2 left-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
        data-glow=""
      />

      {/*
        The squad, on a circle around the hub — and the box that turns them
        along it. See worksOrbit.

        The four keep the coordinates Figma gives them, and those coordinates
        are already a circle: a 40px avatar at (160,14) has its centre at
        (180,34), which is 96px straight up from the panel's own centre at
        (180,130), and the other three are 96px right, left and down from the
        same point. David is a pixel to the left of it rather than on it, which
        is how the artboard places him and what he is left at — it puts him
        0.6deg out of phase with the other three and nothing else.

        So the wrapper is the panel box, inset-0, and rotating it about its own
        centre rotates the circle about its centre. Nothing computes an angle,
        nothing is authored in polar coordinates, and with no rotation on it —
        below the motion gate, or under reduced motion — this is the artboard
        exactly as it was drawn.

        pointer-events-none because it now covers the whole panel and everything
        in it is decorative; the avatars keep their alt text either way.
      */}
      <div className="pointer-events-none absolute inset-0" data-orbit>
        <RingedAvatar personKey="lilit" left={160} top={14} />
        <RingedAvatar personKey="mika" left={256} top={110} />
        <RingedAvatar personKey="aram" left={64} top={110} />
        <RingedAvatar
          personKey="david"
          left={159}
          top={206}
          verified={false}
          label="You"
        />
      </div>

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
      <ConnectorTrace
        src="/works/step2-connectors.svg"
        width={240}
        height={152}
        left={60.5}
        top={40.5}
        spark={110}
        pad={16}
      />

      <div className="absolute top-[16px] left-[16px]">
        <ScoreBadge
          person={PEOPLE.lilit}
          personKey="lilit"
          score={762}
          rating="Good"
        />
      </div>
      <div className="absolute top-[164px] left-[16px]">
        <ScoreBadge
          person={PEOPLE.aram}
          personKey="aram"
          score={645}
          rating="Fair"
        />
      </div>
      <div className="absolute top-[16px] right-[17px] ">
        <ScoreBadge
          person={PEOPLE.mika}
          personKey="mika"
          score={590}
          rating="Poor"
        />
      </div>
      <div className="absolute top-[164px] right-[17px]">
        <ScoreBadge
          person={PEOPLE.david}
          personKey="david"
          score={875}
          rating="Good"
        />
      </div>

      {/* Group-score ring, centred a touch above the panel's vertical middle. */}
      <div className="absolute top-[113px] left-1/2 -translate-x-1/2 -translate-y-1/2">
        <Image
          src="/works/step2-ring-mid.svg"
          alt=""
          width={118}
          height={118}
          className="pointer-events-none absolute top-1/2 left-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
          data-glow=""
        />
        <Image
          src="/works/step2-ring-inner.svg"
          alt=""
          width={224}
          height={224}
          className="pointer-events-none absolute top-1/2 left-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
          data-glow=""
        />
        <div className="relative flex flex-col items-center gap-2 text-center">
          <p className="font-heading text-sm tracking-[1px] text-white uppercase opacity-40 text-[10px]">
            Group Score
          </p>
          <div className="flex flex-col items-center gap-1 leading-none">
            <p className="font-heading text-[24px] text-white">718</p>
            <p className="font-heading text-success text-sm font-semibold sm:text-[12px]">
              Good
            </p>
          </div>
        </div>
      </div>

      <div className="absolute top-[231px] left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap">
        <p className="font-heading text-base leading-[1.2] text-white/50 sm:text-[14px]">
          4 profiles
        </p>
        <span className="bg-white/50 block size-[3px] shrink-0 rounded-full" />
        <p className="font-heading text-base leading-[1.2] text-white/50 sm:text-[14px]">
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
    <FigurePanel texture="/works/step3-texture.svg" textureHeight={260}>
      {/*
        The bracket joining the Lilit and Reserve bars, with an endpoint dot on
        each and a bright tick riding each run.

        Everything is positioned against the trace's own padded box rather than
        the panel, so the wipe reveals the dots and ticks along with the line
        they belong to — the origin is the arc's top-left less TRACE_PAD.

        flipX because the asset is exported with its long leg on the left and
        Figma mirrors it in place. Unmirrored it descends to y=106 over Lilit —
        27px into the bar it is supposed to stop on top of — and stops 35px
        short of the Reserve bar on the other side, which is the tell if this
        ever gets re-exported and the flip is dropped.
      */}
      <ConnectorTrace
        src={"/works/step3-arc.svg"}
        {...ARC}
        spark={100}
        pad={TRACE_PAD}
        flipX
      >
        {/* Centred rather than corner-positioned: the asset's own rotation
            (matching Figma's wrapper) makes its post-rotation bounding box
            awkward to derive by hand, but its centre point is exact. y=16 is
            the arc's own horizontal run — the top of ARC plus its half-stroke
            overhang. Mirrored with the artwork so its gradient still runs
            bright-end-first into the corner it points at. */}
        <Image
          src="/works/step3-tick-h.svg"
          alt=""
          width={9.25}
          height={1}
          className="pointer-events-none absolute max-w-none -translate-x-1/2 -translate-y-1/2 -scale-x-100"
          style={onArc(161.37, 16)}
        />
        {/* Clear of the 8px corner radius, so it sits on the straight part of
            the right-hand run rather than where the path is still bending. */}
        <Image
          src="/works/step3-tick-v.svg"
          alt=""
          width={9.25}
          height={1}
          className="pointer-events-none absolute max-w-none -translate-x-1/2 -translate-y-1/2 -rotate-90"
          style={onArc(313, 56.13)}
        />
        {/* The endpoints: the top of the Lilit bar and the top of the Reserve. */}
        <Image
          src="/works/step3-dot.svg"
          alt=""
          width={8}
          height={8}
          className="pointer-events-none absolute max-w-none"
          style={onArc(109, 71)}
        />
        <Image
          src="/works/step3-dot.svg"
          alt=""
          width={8}
          height={8}
          className="pointer-events-none absolute max-w-none"
          style={onArc(309, 102)}
        />
      </ConnectorTrace>

      <div className="absolute bottom-4 left-1/2 flex w-[328px] -translate-x-1/2 items-end gap-1">
        {BARS.map((bar) => (
          <div
            key={bar.name}
            className="flex flex-1 flex-col items-center justify-center gap-1"
          >
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
            <div className="flex flex-col items-center text-sm leading-normal tracking-[-0.24px] whitespace-nowrap sm:text-[12px]">
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
    <section
      className="screen relative isolate w-full"
      data-sequence-section="works"
    >
      {/* isolate above, z-10 here: between them the ambient ground is pinned
          behind this section's content and in front of the page, and cannot
          escape to either side of that. See .screen-glow. */}
      <SectionBloom id="works" />
      <div className="screen-body relative z-10">
        <div className="screen-copy mx-auto flex max-w-[1240px] flex-col items-center gap-4 px-5 sm:gap-[clamp(0.5rem,1.8svh,1rem)] sm:px-6">
          <div className="flex" data-reveal="copy">
            <Badge icon={<CreditCard />}>How Squad works</Badge>
          </div>
          <h2
            className="font-heading type-title w-full text-center leading-none font-normal"
            data-reveal="copy"
          >
            Three steps.
            <br />
            One <span className="font-display italic">shared line.</span>
          </h2>
        </div>

        {/* No data-reveal on the wrapper: each card grows in on its own, and a
            group fade over the top would flatten that back into one crossfade. */}
        <div className="screen-payload px-5 sm:px-0">
          <div className="stage-viewport stage-fluid">
            <div
              className="stage-sizer"
              style={
                {
                  "--stage-w": 1240,
                  "--stage-h": 508,
                } as React.CSSProperties
              }
            >
              <div className="stage flex w-full flex-col gap-6 sm:w-auto sm:flex-row sm:gap-8">
                <div
                  className="w-full shrink-0 sm:w-[392px]"
                  data-reveal="step"
                >
                  <StepCard
                    figure={<Step1Figure />}
                    title="Form your squad"
                    description="Invite up to 3 trusted people — friends, family, or anyone you trust financially. Each member connects their bank and authorizes a credit check."
                  />
                </div>
                <div
                  className="w-full shrink-0 sm:w-[392px]"
                  data-reveal="step"
                >
                  <StepCard
                    figure={<Step2Figure />}
                    title="Get scored as a group"
                    description="Banrox's patented group risk engine combines every member's profile into a single group assessment. Combined behavior is more stable — which is why the group qualifies for more."
                  />
                </div>
                <div
                  className="w-full shrink-0 sm:w-[392px]"
                  data-reveal="step"
                >
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
      </div>
    </section>
  );
}
