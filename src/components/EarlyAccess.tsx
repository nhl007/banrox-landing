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
 */
function Glow({ src, top, offsetX }: { src: string; top: number; offsetX: number }) {
  return (
    <div
      className="pointer-events-none absolute size-103 -translate-x-1/2"
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
    />
  );
}

export default function EarlyAccess() {
  return (
    <section className="relative flex w-full flex-col items-center gap-15 overflow-x-clip px-6 pt-20 pb-30">
      <Glow src="/early/glow-back.svg" top={285} offsetX={0} />
      <Glow src="/early/glow-front.svg" top={384} offsetX={60} />

      {/* The card keeps its 420x260 proportions and scales below that width
          instead of reflowing. The extra wrapper keeps .stage-viewport's own
          negative margin-block from eating into the section's gap. */}
      <div className="relative w-full">
        <div className="stage-viewport w-full">
          <div
            className="stage-sizer"
            style={
              {
                "--stage-w": 420,
                "--stage-h": 260,
                "--stage-min": 0.55,
              } as React.CSSProperties
            }
          >
            <div className="stage">
              <SquadCard orientation="landscape" />
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex w-full max-w-204 flex-col items-center gap-15">
        <div className="flex w-full flex-col items-center gap-4">
          <Badge icon={<CreditCard />}>Early Access</Badge>
          <h2 className="font-heading w-full text-center text-[clamp(2rem,4.55vw,3.5rem)] leading-none font-normal">
            Be first.
            <br />
            Bring <span className="font-display italic">your squad.</span>
          </h2>
          <p className="w-full text-center text-base leading-normal tracking-[-0.32px] text-white/70">
            Join the waitlist for Squad Card. When we launch, your group is ready.
          </p>
        </div>

        <form className="flex w-full flex-col items-center gap-15">
          <div className="flex w-full flex-col gap-4 sm:flex-row">
            <Field name="firstName" label="First Name" autoComplete="given-name" />
            <Field
              name="email"
              type="email"
              label="Email Address"
              autoComplete="email"
              required
            />
          </div>

          <div className="flex w-full flex-col items-center gap-4">
            <p className="w-full text-center text-xs leading-normal tracking-[-0.24px] text-white/70">
              <span className="font-medium text-white">2,847</span> people on the
              waitlist
            </p>
            <Button type="submit" size="lg" icon={<ArrowUpRight />}>
              Join the Waitlist
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
