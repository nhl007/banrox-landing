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
function Glow({
  src,
  top,
  offsetX,
}: {
  src: string;
  top: string;
  offsetX: number;
}) {
  return (
    <div
      className="pointer-events-none absolute -z-10 hidden size-103 -translate-x-1/2 sm:block"
      style={{ top, left: `calc(50% + ${offsetX}px)` }}
      data-reveal="glow"
      data-glow-from="0.7 -0.7"
    >
      <div className="absolute inset-[-63.11%]">
        <Image
          src={src}
          alt=""
          width={932}
          height={932}
          className="block size-full max-w-none"
        />
      </div>
    </div>
  );
}

/*
 * A labelled field.
 *
 * The label is a real one above the input rather than a placeholder standing in
 * for it: a placeholder is gone the moment there is anything in the box, which
 * is exactly when someone checking their own typing wants to know what the box
 * was for. It is hidden from sm: up, where the artboard's single row of two
 * bare inputs is the design and there is no room for it.
 *
 * text-base is not a size choice. iOS zooms the whole page in when a focused
 * input is under 16px, and the page is a deck — the zoom does not go away when
 * the field is blurred.
 */
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
    <div className="flex w-full flex-col sm:min-w-px sm:flex-1">
      <label htmlFor={name} className="sr-only">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={label}
        autoComplete={autoComplete}
        required={required}
        className="bg-vignette h-12 w-full rounded-lg border-[1.5px] border-white/30 pr-1 pl-5 text-base text-white placeholder:text-white/70 focus-visible:border-white/60 focus-visible:outline-none sm:text-sm"
        data-reveal="field"
      />
    </div>
  );
}

export default function EarlyAccess() {
  return (
    <section
      className="screen relative isolate w-full overflow-x-clip"
      data-sequence-section="early"
    >
      {/*
        Ellipses 6150 and 6151 at the size the phone's frame draws them: two
        260px circles rather than the 412s the wide layout carries, and placed
        against the section rather than against the card's slot — the mobile
        frame puts one off the left edge level with the heading and the other
        just right of centre a little below it.

        Their own files, because the blur does not scale with the circle: Figma
        blurs both at 130 whatever size the circle is, so shrinking the 932px
        asset to fit a 260px circle would shrink the blur to 82 with it and turn
        a wash into a disc. Same circle, same gradient, same opacity, stated at
        260 with the blur left at 130. Compare the hero's bloom, which has the
        same problem for the same reason.
      */}
      {/* The same two roles the wide layout's pair carries, so earlyCard brings
          them in with the card and glowDrift keeps them shearing across each
          other afterwards. `shown` is what stops either tier being handed the
          other's — see timelines.ts. */}
      <div className="screen-glow sm:hidden" aria-hidden="true">
        <Image
          src="/early/glow-back-phone.svg"
          alt=""
          width={780}
          height={780}
          className="absolute max-w-none"
          style={{ left: "calc(50% - 483px)", top: 80.1 }}
          data-reveal="glow"
          data-glow-from="0.7 -0.7"
        />
        <Image
          src="/early/glow-front-phone.svg"
          alt=""
          width={780}
          height={780}
          className="absolute max-w-none"
          style={{ left: "calc(50% - 262px)", top: 99.1 }}
          data-reveal="glow"
          data-glow-from="0.7 -0.7"
        />
      </div>
      <div className="screen-body relative z-10">
        {/*
          The one section that leads with artwork, so the card takes the flexible
          slot and the words below it take only what they need — the reverse of
          everywhere else. The card keeps its 420x260 proportions and scales
          rather than reflowing.
        */}
        <div className="screen-payload px-4 sm:px-6">
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

        <div className="screen-copy mx-auto flex max-w-204 flex-col items-center gap-12 px-4 sm:gap-[clamp(1rem,3.2svh,3.75rem)] sm:px-6">
          <div className="flex w-full flex-col items-center gap-4 sm:gap-[clamp(0.5rem,1.8svh,1rem)]">
            <div className="flex" data-reveal="copy">
              <Badge icon={<CreditCard />}>Early Access</Badge>
            </div>
            <h2
              className="font-heading type-title w-full text-center sm:text-[clamp(1.75rem,min(4.55vw,6.4svh),3.5rem)] sm:leading-none"
              data-reveal="copy"
            >
              Be first.
              <br />
              Bring <span className="font-display italic">your squad.</span>
            </h2>
            <p
              className="type-lede type-measure w-full tracking-[-0.32px] text-white/70"
              data-reveal="copy"
            >
              Join the waitlist for Squad Card. When we launch, your group is
              ready.
            </p>
          </div>

          <form className="flex w-full flex-col items-center gap-12 sm:gap-[clamp(1rem,3.2svh,3.75rem)]">
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
                <Button
                  type="submit"
                  size="lg"
                  icon={<ArrowUpRight />}
                  className="justify-center"
                >
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
