import Image from "next/image";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import SquadCard from "@/components/ui/SquadCard";
import { ArrowUpRight, CreditCard } from "@/components/ui/icons";

/*
 * "Be first. Bring your squad." — the waitlist section, a 1440x981 artboard.
 * The card is the shared SquadCard laid flat rather than stood upright, and the
 * only fixed geometry is the pair of ambient glows sitting behind it.
 */

/*
 * Both glows are the same 412px circle under a 260px blur, so Figma exports
 * them as 932x932 assets that overhang their box by 63.11% on every side. They
 * are anchored to the section's centre line rather than its left edge.
 *
 * `top` is a fraction of the card's slot rather than a pixel offset, now that
 * the slot's height answers the window. The artboard puts them at 285 and 384
 * in a section whose card sat between 80 and 340, which is where the two
 * percentages come from.
 */
function Glow({ src, top, offsetX }: { src: string; top: string; offsetX: number }) {
  return (
    <div
      className="pointer-events-none absolute -z-10 size-103 -translate-x-1/2"
      style={{ top, left: `calc(50% + ${offsetX}px)` }}
    >
      <div className="absolute inset-[-63.11%]">
        <Image src={src} alt="" width={932} height={932} className="block size-full max-w-none" />
      </div>
    </div>
  );
}

function Field({
  name,
  type = "text",
  label,
  autoComplete,
  required = false,
}: {
  name: string;
  type?: "text" | "email";
  label: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <input
      name={name}
      type={type}
      aria-label={label}
      placeholder={label}
      autoComplete={autoComplete}
      required={required}
      className="bg-vignette h-12 w-full rounded-lg border-[1.5px] border-white/30 pr-1 pl-5 text-sm text-white placeholder:text-white/70 focus-visible:border-white/60 focus-visible:outline-none sm:min-w-px sm:flex-1"
      data-reveal="field"
    />
  );
}

export default function EarlyAccess() {
  return (
    <section
      className="screen relative w-full overflow-x-clip"
      data-sequence-section="early"
    >
      <div className="screen-body">
        {/*
          The one section that leads with artwork, so the card takes the flexible
          slot and the words below it take only what they need — the reverse of
          everywhere else. The card keeps its 420x260 proportions and scales
          rather than reflowing.
        */}
        <div className="screen-payload px-6">
          <Glow src="/early/glow-back.svg" top="79%" offsetX={0} />
          <Glow src="/early/glow-front.svg" top="117%" offsetX={60} />

          <div className="stage-viewport stage-viewport-open">
            <div
              className="stage-sizer"
              style={
                {
                  "--stage-w": 420,
                  "--stage-h": 260,
                } as React.CSSProperties
              }
            >
              <div className="stage">
                {/* The wrapper, not the card: SquadCard's own root already
                    carries a transform to scale its face, and the turn belongs
                    to something that owns its transform outright. */}
                <div data-reveal="card">
                  <SquadCard orientation="landscape" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="screen-copy mx-auto flex max-w-204 flex-col items-center gap-[clamp(1rem,3.2svh,3.75rem)] px-6">
          <div className="flex w-full flex-col items-center gap-[clamp(0.5rem,1.8svh,1rem)]">
            <div className="flex" data-reveal="copy">
              <Badge icon={<CreditCard />}>Early Access</Badge>
            </div>
            <h2
              className="font-heading w-full text-center text-[clamp(1.75rem,min(4.55vw,6.4svh),3.5rem)] leading-none font-normal"
              data-reveal="copy"
            >
              Be first.
              <br />
              Bring <span className="font-display italic">your squad.</span>
            </h2>
            <p
              className="type-lede w-full text-center leading-normal tracking-[-0.32px] text-white/70"
              data-reveal="copy"
            >
              Join the waitlist for Squad Card. When we launch, your group is
              ready.
            </p>
          </div>

          <form className="flex w-full flex-col items-center gap-[clamp(1rem,3.2svh,3.75rem)]">
            <div className="flex w-full flex-col gap-4 sm:flex-row">
              <Field
                name="firstName"
                label="First Name"
                autoComplete="given-name"
              />
              <Field
                name="email"
                type="email"
                label="Email Address"
                autoComplete="email"
                required
              />
            </div>

            <div className="flex w-full flex-col items-center gap-4">
              <p
                className="w-full text-center text-xs leading-normal tracking-[-0.24px] text-white/70"
                data-reveal="field"
              >
                <span className="font-medium text-white">2,847</span> people on
                the waitlist
              </p>
              {/* The wrapper takes the hinge: Button owns its own hover
                  transform, and two owners on one transform collide. */}
              <div className="flex" data-reveal="cta">
                <Button type="submit" size="lg" icon={<ArrowUpRight />}>
                  Join the Waitlist
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
