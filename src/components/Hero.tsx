import Image from "next/image";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import StageBackdrop from "@/components/ui/StageBackdrop";
import { ArrowUpRight, CreditCard } from "@/components/ui/icons";
import CardFan, { FAN_STAGE, cards } from "@/components/CardFan";
import PassportCard, { PASSPORT_CARD } from "@/components/ui/PassportCard";
import SquadCard, { SQUAD_CARD } from "@/components/ui/SquadCard";

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
 * The phone's fan, which is a different arrangement of the same five cards: a
 * deck rather than a row.
 *
 * Landscape it is one row of four files with the product laid across them. On a
 * phone there is no width for a row, so the four passports tuck in BEHIND the
 * Squad card — centred on one line, each rank drawn smaller than the one in
 * front of it and stepped further out, so all four show an edge and the card
 * they are gathered around is the whole of what is on top.
 *
 * It replaced a two-and-two arrangement 230px either side of the middle, which
 * wanted a wider frame than any phone has. Measured at 390: Aram sat entirely
 * behind Mika and David entirely behind Lilit, so two of the four people the
 * section is about were not on the screen at all, and the two that were ran off
 * both edges with their headings cut in half. The deck is the same five cards
 * in the width a phone actually has — and it says the sentence the hero is
 * making better than the row did, because a stack whose front card is the
 * product is that sentence.
 *
 * Every horizontal number is an offset from the fan's own centre line rather
 * than from its left edge, because the composition is symmetrical about that
 * line and phones are not all 402px wide. A card whose left edge is fixed at
 * -159 is a different picture at 360 and at 430; a card whose centre is fixed
 * 126px left of the middle is the same picture at both, with a little more or
 * less of its outer edge showing.
 *
 * The widths are the other half of it, and they are the part the row had no
 * answer for. A passport is authored at 260 and the Squad card at 260 on its
 * end; at those sizes two passports either side of the product is 900px of
 * composition. Drawing each rank smaller is what the eye reads as depth AND
 * what closes the whole deck up to 392px — one phone wide, with the outermost
 * pair breaking the edge by a couple of pixels the way the frame draws it.
 *
 * Nothing is stated as a `top`. Every box in the deck is centred on one
 * horizontal line, which is what makes the ranks read as one object seen from
 * the front rather than as four cards that happen to be behind a fifth.
 *
 * And the two on the right are laid out from their right edge — see `mirrored`
 * on PassportCard. Which end of a card is on the screen is a fact about which
 * side of the deck it is on, so the two facts are the same one: `dx > 0`.
 */
const DECK = {
  /*
   * The Squad card on its end — the front of the deck, and the measure
   * everything else is drawn against. 172 rather than the 260 the row used: the
   * two ranks behind it have to fit either side within a phone, and 260 leaves
   * them nowhere to go. It is still the largest thing in the deck by a rank and
   * still the only card whose face is fully on the screen.
   */
  squad: 172,
  /* The rank immediately behind it, all but hidden: 2px inside the Squad card's
     edge on both sides when the deck is closed, so the fan opens out of a
     silhouette with nothing peeking. */
  inner: { width: 168, dx: 56 },
  /* And the back of the stack, seen only as an edge. */
  outer: { width: 140, dx: 126 },
} as const;

/** The Squad card's box on its end, whose height is the deck's own. */
const SQUAD_BOX = {
  width: DECK.squad,
  height: Math.round((DECK.squad * SQUAD_CARD.width) / SQUAD_CARD.height),
} as const;

/** A passport drawn at `width`, and the scale that gets it there. */
function passport(width: number) {
  return {
    width,
    height: Math.round((width * PASSPORT_CARD.height) / PASSPORT_CARD.width),
    scale: width / PASSPORT_CARD.width,
  };
}

/*
 * The four, in the order they are dealt.
 *
 * Left and right are the row's own — Aram and Mika to the left of the product,
 * Lilit and David to its right — so nobody has swapped sides between the two
 * tiers. What changed is rank: the pair Figma layered on top (Mika, Lilit) is
 * the pair nearest the front here, which is the same statement about depth the
 * wide fan makes with its z-order.
 *
 * Outer pair first, so the fan opens back to front and alternates sides as it
 * goes — see MOTION.hero.fanPhone for the stagger that reads it out.
 */
const HERO_DECK_PHONE = [
  {
    name: "Aram Petrosyan",
    dx: -DECK.outer.dx,
    z: 10,
    ...passport(DECK.outer.width),
  },
  {
    name: "David Melkonyan",
    dx: DECK.outer.dx,
    z: 10,
    ...passport(DECK.outer.width),
  },
  {
    name: "Mika Grigoryan",
    dx: -DECK.inner.dx,
    z: 20,
    ...passport(DECK.inner.width),
  },
  {
    name: "Lilit Sargsyan",
    dx: DECK.inner.dx,
    z: 20,
    ...passport(DECK.inner.width),
  },
];

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

/**
 * A box in the deck: centred on the fan's middle line at `dx`, and on its one
 * horizontal line vertically.
 *
 * The size goes on this wrapper rather than being left to whatever it contains,
 * and that is not tidiness. heroCards and heroFold measure where a card sits
 * when the deck is closed as `offsetLeft + offsetWidth / 2` against the same on
 * the Squad card, and offsetWidth is the LAYOUT width — it does not know about
 * a scale transform. A wrapper that shrink-wrapped a scaled 260px card would
 * measure 260 and every card would fold to the wrong place by half the
 * difference. The wrapper is the drawn box; the scale lives one level inside it.
 */
function inDeck(dx: number, box: { width: number; height: number }, z: number) {
  return {
    ...onCentre(dx, box.width, Math.round((SQUAD_BOX.height - box.height) / 2), z),
    width: box.width,
    height: box.height,
  } as const;
}

function HeroFanPhone() {
  return (
    /* As tall as the card at the front of it, which is the tallest thing in it.
       The ranks behind are shorter and centred, so the deck has its own slack
       top and bottom and the float never pushes a card out of the box.

       The perspective is the same 900px the wide fan's stage carries, and for
       the same reason: the deck opens from lying flat on the display plane, and
       at MOTION.flat.angle a plane with no camera distance to project against
       is a horizontal line. See CardFan. */
    <div
      className="relative w-full shrink-0 [perspective:900px] sm:hidden"
      style={{ height: SQUAD_BOX.height }}
      aria-hidden
    >
      {/*
        Ellipse 6145 — the hero's bloom, at the size the phone's frame draws it:
        a 634px circle centred 10px right of the middle, against the 1028px one
        the wide layout carries.

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

        On the deck's own centre, not the artboard's 366 down from the top of the
        fan. That number placed a 634px circle under a 539px composition; this
        one is 278 tall and the same offset would put most of the light below it.
        The deck has one horizontal line and this is the light behind it.
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
        style={onCentre(10, 1434, Math.round(SQUAD_BOX.height / 2) - 717)}
        data-reveal="glow"
        data-glow-from="0 1"
      />

      {/*
        The fan itself, as one object: this is what lies flat and stands up, and
        the four cards inside it are what come out from behind the Squad card
        once it has. Exactly the roles the wide fan carries, so both tiers open
        on one timeline — see heroCards, and `shown` in timelines.ts for what
        keeps each of them looking at its own layout.

        [data-tier] is the one thing about the deck the timeline cannot measure
        for itself: how far these cards travel is a quarter of what the wide fan
        covers, and a distance is not a duration. See heroCards.
      */}
      <div className="absolute inset-0" data-reveal="fan" data-tier="phone">
        {HERO_DECK_PHONE.map(({ name, dx, z, width, height, scale }) => {
          const card = cards.find((c) => c.name === name);
          if (!card) return null;
          return (
            <div
              key={name}
              className="absolute"
              style={inDeck(dx, { width, height }, z)}
              data-reveal="card"
            >
              {/* The card at its authored 260x379, shrunk into the box above.
                  A transform rather than a smaller card: every offset inside
                  PassportCard is Figma's, and a card re-laid-out at 140 would
                  be a different card — 4px type, a 40px avatar ring at 21, and
                  a border that no longer lines up with the meters under it. */}
              <div
                className="origin-top-left"
                style={{
                  width: PASSPORT_CARD.width,
                  height: PASSPORT_CARD.height,
                  transform: `scale(${scale})`,
                }}
              >
                <PassportCard
                  name={card.name}
                  subtitle={card.subtitle}
                  avatar={card.avatar}
                  bureaus={card.bureaus}
                  metrics={card.metrics}
                  mirrored={dx > 0}
                />
              </div>
            </div>
          );
        })}

        {/* The front of the deck, and in front of all four.
            [data-fan-anchor], like the wide fan's: it is the product and it is
            held still, so the float that keeps the other four alive skips it
            and the fold that puts them away leaves it on the screen alone. */}
        <div
          className="absolute"
          style={inDeck(0, SQUAD_BOX, 30)}
          data-fan-anchor=""
        >
          <SquadCard orientation="portrait" size={SQUAD_BOX.width} />
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
            idea but a picture of one; the answer down here is to re-stack the
            same five cards as a deck — the four passports tucked in behind an
            upright Squad card, in ranks, each rank drawn a size smaller than the
            one in front of it. See HeroFanPhone.
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
