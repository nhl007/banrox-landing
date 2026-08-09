import Image from "next/image";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { ArrowUpRight, CreditCard } from "@/components/ui/icons";
import CardFan from "@/components/CardFan";

/*
 * The ambient bloom behind the card fan — Figma's Ellipse 6145 and 6146. Both
 * are siblings of the hero frame on the canvas rather than children of it, so
 * they run well past its lower edge and keep going into the next section; the
 * bloom alone is 1028px tall against a 973px frame. Two things follow:
 *
 *  - the layer is pinned behind the whole page (-z-10) so the bleed sits under
 *    the next section's copy instead of over it, and
 *  - the section clips on the x axis only. The assets are 2164px wide at their
 *    widest and would otherwise scroll the page sideways, but overflow-hidden
 *    would put the hard cut back.
 *
 * Offsets are measured from the card fan, which is what the ellipses are
 * actually placed against, so they survive changes to the copy above. Each
 * asset already carries its own 400px blur margin around the ellipse. The
 * artboard offsets are -405 and -364; the extra 4px accounts for
 * .stage-viewport's negative margin-block, which collapses out through the
 * wrapper and puts the containing block 4px above the stage itself.
 */
function HeroGlow() {
  return (
    <>
      <Image
        src="/hero/glow-bloom.svg"
        alt=""
        width={1828}
        height={1828}
        className="pointer-events-none absolute left-1/2 -z-10 max-w-none -translate-x-1/2"
        style={{ top: -401 }}
        priority
      />
      <Image
        src="/hero/glow-band.svg"
        alt=""
        width={2164}
        height={1312}
        className="pointer-events-none absolute left-1/2 -z-10 max-w-none -translate-x-1/2"
        style={{ top: -360 }}
        priority
      />
    </>
  );
}

export default function Hero() {
  return (
    <section className="relative w-full overflow-x-clip pb-[176px]">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col items-center px-6 pt-20 ">
        <div className="flex w-full flex-col items-center gap-8">
          <div className="flex w-full flex-col items-center gap-4">
            <Badge icon={<CreditCard />}>
              Introducing Squad Card by Banrox
            </Badge>

            <div className="flex flex-col items-center gap-4 text-center">
              {/*
                72px at the 1440 artboard; clamped so it degrades gracefully on
                narrow viewports, which the Figma frame does not specify.
              */}
              <h1 className="font-heading max-w-[956px] text-[clamp(2.25rem,6.1vw,4.5rem)] leading-none font-normal">
                One card. One line.
                <br />
                Four people who{" "}
                <span className="font-display italic">have your back.</span>
              </h1>
              <p className="max-w-[604px] text-base leading-[1.5] tracking-[-0.32px] text-white/70">
                Squad is a shared credit line built for people who trust each
                other. Everyone gets their own lane, and the squad holds the
                reserve.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              href="/waitlist"
              variant="primary"
              size="lg"
              icon={<ArrowUpRight />}
            >
              Join the Waitlist
            </Button>
            <Button
              href="/invite"
              variant="secondary"
              size="lg"
              icon={<ArrowUpRight />}
            >
              Invite Your Squad
            </Button>
          </div>

          <p className="text-center text-xs leading-[1.5] tracking-[-0.24px] text-white/70">
            <span className="font-medium text-white">2,847</span> people on the
            waitlist
          </p>
        </div>
      </div>

      <div className="relative">
        <HeroGlow />
        <CardFan />
      </div>
    </section>
  );
}
