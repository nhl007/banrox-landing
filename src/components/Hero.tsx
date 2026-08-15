import Image from "next/image";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import StageBackdrop from "@/components/ui/StageBackdrop";
import { ArrowUpRight, CreditCard } from "@/components/ui/icons";
import CardFan, { FAN_STAGE } from "@/components/CardFan";

/*
 * The ambient bloom behind the card fan — Figma's Ellipse 6145 and 6146. Both
 * are siblings of the hero frame on the canvas rather than children of it, so
 * they run well past its lower edge and keep going into the next section; the
 * bloom alone is 1828px against a 516px stage.
 *
 * Placed in the fan's own stage coordinates and rendered through StageBackdrop,
 * which gives them a copy of that stage to sit in: they scale with the fan
 * instead of staying 1828px wide while it shrinks to fit the window, and they
 * are painted behind the page rather than inside a stage that clips.
 *
 * The offsets are the artboard's, less the fan's own origin — the stage is
 * 1262 wide, so an 1828px asset centred on it starts at (1262-1828)/2.
 */
function HeroGlow() {
  return (
    <>
      <Image
        src="/hero/glow-bloom.svg"
        alt=""
        width={1828}
        height={1828}
        className="pointer-events-none absolute max-w-none"
        style={{ left: (FAN_STAGE.width - 1828) / 2, top: -405 }}
        data-reveal="glow"
        priority
      />
      <Image
        src="/hero/glow-band.svg"
        alt=""
        width={2164}
        height={1312}
        className="pointer-events-none absolute max-w-none"
        style={{ left: (FAN_STAGE.width - 2164) / 2, top: -364 }}
        data-reveal="glow"
        priority
      />
    </>
  );
}

/*
 * The data-reveal tags below are the hero's entrance choreography. The timeline
 * lives in src/components/scroll/timelines.ts and the wrapper elements exist
 * only to give it something with a box to hinge and scale.
 *
 * Nothing here waits to be scrolled to: the section fires off the page load, in
 * the order it reads — see the hero entry in sections.ts.
 */
export default function Hero() {
  return (
    <section
      className="screen relative w-full overflow-x-clip"
      data-sequence-section="hero"
    >
      <div className="screen-body">
        <div
          className="screen-copy mx-auto flex max-w-[1240px] flex-col items-center gap-[clamp(0.75rem,2.6svh,2rem)] px-6"
        >
          <div className="flex w-full flex-col items-center gap-[clamp(0.5rem,1.8svh,1rem)]">
            <div className="flex" data-reveal="copy">
              <Badge icon={<CreditCard />}>
                Introducing Squad Card by Banrox
              </Badge>
            </div>

            <div className="flex flex-col items-center gap-[clamp(0.5rem,1.8svh,1rem)] text-center">
              {/*
                72px at the 1440 artboard. .type-hero clamps it against the
                window's height as well as its width — on a 720px laptop the
                artboard size is 48px taken straight out of the card fan below.
              */}
              <h1
                className="font-heading type-hero max-w-[956px] leading-none font-normal"
                data-reveal="copy"
              >
                One card. One line.
                <br />
                Four people who{" "}
                <span className="font-display italic">have your back.</span>
              </h1>
              <p
                className="type-lede max-w-[604px] leading-[1.5] tracking-[-0.32px] text-white/70"
                data-reveal="copy"
              >
                Squad is a shared credit line built for people who trust each
                other. Everyone gets their own lane, and the squad holds the
                reserve.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <span className="inline-flex" data-reveal="button">
              <Button
                href="/waitlist"
                variant="primary"
                size="lg"
                icon={<ArrowUpRight />}
              >
                Join the Waitlist
              </Button>
            </span>
            <span className="inline-flex" data-reveal="button">
              <Button
                href="/invite"
                variant="secondary"
                size="lg"
                icon={<ArrowUpRight />}
              >
                Invite Your Squad
              </Button>
            </span>
          </div>

          <p
            className="text-center text-xs leading-[1.5] tracking-[-0.24px] text-white/70"
            data-reveal="note"
          >
            <span className="font-medium text-white">2,847</span> people on the
            waitlist
          </p>
        </div>

        <div className="screen-payload">
          <StageBackdrop {...FAN_STAGE}>
            <HeroGlow />
          </StageBackdrop>
          <CardFan />
        </div>
      </div>
    </section>
  );
}
