import Image from "next/image";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import StageBackdrop from "@/components/ui/StageBackdrop";
import { ArrowUpRight, CreditCard } from "@/components/ui/icons";
import CardFan, { FAN_STAGE, cards } from "@/components/CardFan";
import PassportCard from "@/components/ui/PassportCard";
import SquadCard from "@/components/ui/SquadCard";

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
        data-glow-from="0 1"
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
        data-glow-from="0 1"
        priority
      />
    </>
  );
}

/*
 * The phone's fan, which is a different arrangement of the same five cards.
 *
 * Landscape it is one row of four files with the product laid across them;
 * upright there is no room for a row, so the artboard stacks them two and two
 * and stands the Squad card on end in the middle of the four. The passports run
 * off both edges on purpose — the section clips them (overflow-x: clip on
 * .screen) and what is left reads as four files the product is sitting on.
 *
 * Every number here is an offset from the fan's own vertical centre line rather
 * than from its left edge, because the composition is symmetrical about that
 * line and phones are not all 402px wide. A card whose left edge is fixed at
 * -159 is a different picture at 360 and at 430; a card whose centre is fixed
 * 230px left of the middle is the same picture at both, with a little more or
 * less of it showing. dx is that offset, y is measured from the top of the fan
 * (the artboard's 739).
 *
 * z: Mika over Aram and Lilit over David, which is Figma's own layer order —
 * the two lower cards overlap the two upper ones, so the fan reads as opening
 * towards the reader rather than away.
 */
const HERO_FAN_PHONE = [
  { name: "Aram Petrosyan", dx: -230, y: 0, z: 10 },
  { name: "David Melkonyan", dx: 230, y: 0, z: 10 },
  { name: "Mika Grigoryan", dx: -150, y: 60, z: 20 },
  { name: "Lilit Sargsyan", dx: 150, y: 60, z: 20 },
] as const;

/**
 * Anything centred on the fan's own middle line, at a given offset from it.
 *
 * Stated as a left edge — the centre line, less half the thing's own width —
 * rather than as `left: 50%` and a translate back. Every element placed by this
 * is one the sequence takes the transform of: the four cards travel on `x` as
 * they come out from behind the Squad card and fold back into it (see
 * heroCards and heroFold), the Squad card turns on `rotationZ`, and the bloom
 * behind them drifts on x, y and scale for as long as the hero is on screen.
 * GSAP folds an existing CSS translate into the same matrix it writes, so a
 * -50% here is one property with two owners: the first tween to touch it snaps
 * the element half its own width to the right and leaves it there. The same
 * lesson the comparison panels' orbit rings learned; there the fix was a
 * wrapper, here the width is known and stating the edge is simpler.
 */
function onCentre(dx: number, width: number, top: number, zIndex?: number) {
  return { left: `calc(50% + ${dx - width / 2}px)`, top, zIndex } as const;
}

/** The passport card's own width, and the Squad card's on its end. */
const PHONE_CARD_W = 260;

function HeroFanPhone() {
  return (
    /* 739 to 1278 on the artboard: the top of the first passport to the foot of
       the Squad card.

       The perspective is the same 900px the wide fan's stage carries, and for
       the same reason: the deck opens from lying flat on the display plane, and
       at MOTION.flat.angle a plane with no camera distance to project against
       is a horizontal line. See CardFan. */
    <div
      className="relative h-[539px] w-full shrink-0 [perspective:900px] sm:hidden"
      aria-hidden
    >
      {/*
        Ellipse 6145 — the hero's bloom, at the size the phone's frame draws it:
        a 634px circle centred 10px right of the middle and 366px down from the
        top of the fan, against the 1028px one the wide layout carries.

        Its own file rather than /hero/glow-bloom.svg scaled down, because the
        blur does not scale with the circle. Figma blurs both by the same
        absolute 200px, so at 634 across the falloff is most of the artwork
        rather than a soft edge on it — scaling the wide asset to 634 shrinks its
        blur to 69 with it and produces a bright disc where the frame has a wash.
        Measured across the row under the card, the two profiles are not the same
        shape: the artboard falls 73 to 49 over 110px where the scaled asset
        falls 114 to 5 over the same. Same circle, same gradient, same 0.5 —
        stated at 634 with the blur left at 200, which is what this file is.

        The 1434 box is the circle plus 2 sigma either side, which is how the
        wide one is exported too (1028 + 800 = 1828).
      */}
      {/*
        Outside the fan, not in it: the fan hinges up off the display plane on
        the way in and the light behind it does not tilt with it. It is the
        hero's [data-reveal='glow'] down here — the same role the bloom and band
        carry above the gate, so heroCards brings it in from below with the rest
        of the scene and glowDrift keeps it moving afterwards, with no second
        arrangement to write for either.
      */}
      <Image
        src="/hero/glow-bloom-phone.svg"
        alt=""
        width={1434}
        height={1434}
        className="pointer-events-none absolute max-w-none"
        style={onCentre(10, 1434, 366 - 717)}
        data-reveal="glow"
        data-glow-from="0 1"
      />

      {/*
        The fan itself, as one object: this is what lies flat and stands up, and
        the four cards inside it are what come out from behind the Squad card
        once it has. Exactly the roles the wide fan carries, so both tiers open
        on one timeline — see heroCards, and `shown` in timelines.ts for what
        keeps each of them looking at its own layout.
      */}
      <div className="absolute inset-0" data-reveal="fan">
        {HERO_FAN_PHONE.map(({ name, dx, y, z }) => {
          const card = cards.find((c) => c.name === name);
          if (!card) return null;
          return (
            <div
              key={name}
              className="absolute"
              style={onCentre(dx, PHONE_CARD_W, y, z)}
              data-reveal="card"
            >
              <PassportCard
                name={card.name}
                subtitle={card.subtitle}
                avatar={card.avatar}
                bureaus={card.bureaus}
                metrics={card.metrics}
              />
            </div>
          );
        })}

        {/* 260x420 standing up, centred, 119px down — and in front of all four.
            [data-fan-anchor], like the wide fan's: it is the product and it is
            held still, so the float that keeps the other four alive skips it
            and the fold that puts them away leaves it on the screen alone. */}
        <div
          className="absolute"
          style={onCentre(0, PHONE_CARD_W, 119, 30)}
          data-fan-anchor=""
        >
          <SquadCard orientation="portrait" size={260} />
        </div>
      </div>
    </div>
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
        {/* 32/16/16 on a phone, which is the artboard's, inside a 16px gutter:
            370 of content in a 402 frame. */}
        <div className="screen-copy mx-auto flex max-w-[1240px] flex-col items-center gap-8 px-4 sm:gap-[clamp(0.75rem,2.6svh,2rem)] sm:px-6">
          <div className="flex w-full flex-col items-center gap-4 sm:gap-[clamp(0.5rem,1.8svh,1rem)]">
            <div className="flex" data-reveal="copy">
              <Badge icon={<CreditCard />}>
                Introducing Squad Card by Banrox
              </Badge>
            </div>

            <div className="flex flex-col items-center gap-4 text-center sm:gap-[clamp(0.5rem,1.8svh,1rem)]">
              <h1
                className="font-heading type-hero max-w-[956px] leading-none font-normal"
                data-reveal="copy"
              >
                {/*
                  Two sets of breaks, one per tier, each the one its artboard
                  draws — two lines wide, four on a phone:

                    One card. One          One card. One line.
                    line. Four people      Four people who have your back.
                    who have your
                    back.

                  Hard rather than left to wrap, and the phone's are the reason.
                  Figma sets the italic in ZT Formom *Oblique*; the project ships
                  only the upright face and CSS slants it, and a synthetic slant
                  keeps the upright's advance widths. Measured, that makes "have
                  your back." 25px narrower here than on the artboard — enough
                  that "back." comes back up onto the third line and the whole
                  block loses 48px of height, taking everything under it with it.
                  Every other line in the hero measures within a pixel of Figma,
                  so this is the one place the difference shows.

                  A <br> with display:none produces no break, which is what makes
                  one heading able to carry both.
                */}
                One card. One <br className="sm:hidden" />
                line. <br className="hidden sm:inline" />
                Four people <br className="sm:hidden" />
                who{" "}
                <span className="font-display italic">
                  have your <br className="sm:hidden" />
                  back.
                </span>
              </h1>
              <p
                className="type-lede type-measure max-w-[604px] tracking-[-0.32px] text-white/70"
                data-reveal="copy"
              >
                Squad is a shared credit line built for people who trust each
                other. Everyone gets their own lane, and the squad holds the
                reserve.
              </p>
            </div>
          </div>

          {/*
            Stacked on a phone, and both exactly as wide as the wider of the two
            labels — 227px on the artboard, which is what "Invite Your Squad" at
            18px comes to inside 32/24 padding. `w-fit` on a stretch column is
            how that is said without naming the number: the column shrink-wraps
            the widest child and the other one is stretched to match it, so the
            pair stays a matched pair in any font the browser ends up with.

            56px tall with an 18px label down here (Button's lg), 48 with a 16px
            one from the gate up — these are the tallest single thing in the copy
            block after the heading, and on a laptop that height comes straight
            off the card fan.
          */}
          <div className="mx-auto flex w-fit flex-col items-stretch gap-4 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
            <span className="flex" data-reveal="button">
              <Button
                href="/waitlist"
                variant="primary"
                size="lg"
                icon={<ArrowUpRight />}
                className="w-full justify-center sm:h-12 sm:w-auto sm:text-base sm:tracking-[-0.32px]"
              >
                Join the Waitlist
              </Button>
            </span>
            <span className="flex" data-reveal="button">
              <Button
                href="/invite"
                variant="secondary"
                size="lg"
                icon={<ArrowUpRight />}
                className="w-full justify-center sm:h-12 sm:w-auto sm:text-base sm:tracking-[-0.32px]"
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
          {/*
            The phone gets its own fan rather than a shrunk copy of the wide
            one. Fitting the 1262px artboard to 360 scales it to 0.28 and lands
            its labels at four pixels, which is not a smaller version of the
            idea but a picture of one; the artboard answers that by re-stacking
            the same five cards two-and-two around an upright Squad card at full
            size. See HeroFanPhone.
          */}
          <HeroFanPhone />

          {/*
            contents rather than block, so from sm: up these two are flex items
            of .screen-payload exactly as they were before this wrapper existed
            — the backdrop still resolves its inset against the payload, and the
            stage is still the thing that flexes.
          */}
          <div className="hidden sm:contents">
            <StageBackdrop {...FAN_STAGE}>
              <HeroGlow />
            </StageBackdrop>
            <CardFan />
          </div>
        </div>
      </div>
    </section>
  );
}
