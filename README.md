# Banrox landing

The Banrox marketing site: one long page of eight sections, scroll-driven.

## Running it

```bash
bun install
bun run dev     # http://localhost:3000
bun run build
bun run lint
```

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind v4 · TypeScript · GSAP 3 with ScrollTrigger.

## Layout of the source

```
src/app/          layout, page, globals.css (all the CSS there is)
src/components/   one file per section, plus SquadCardTrail
src/components/ui/  the pieces the sections are built from
src/components/scroll/  the motion system
```

`page.tsx` is the whole page: `SquadCardTrail` and then eight sections in
document order — Hero, AloneVsTogether, SquadApproves, HowSquadWorks,
IntelligenceLayer, LifeInsideSquad, SquadInvitation, EarlyAccess.

## How the motion works

Everything is scrubbed by scroll position rather than played on a clock, so
scrolling up runs it backwards, stopping stops it, and reloading half way down
the page puts everything where it belongs rather than where an animation had
got to.

| file                      | what it holds                                                                   |
| ------------------------- | ------------------------------------------------------------------------------- |
| `motion.ts`               | every number — durations, distances, easings, the travelling card's whole shape |
| `timelines.ts`            | one factory per beat; each returns a paused timeline                            |
| `sections.ts`             | which beats each section plays, and how they overlap                            |
| `ScrollSequence.tsx`      | the controller: builds the triggers and scrubs them                             |
| `depth.ts`, `parallax.ts` | the layered depth the sections move on                                          |
| `measure.ts`              | reading the page as the stylesheet describes it, not as it currently is         |

### Three tiers

`MOTION.enabled` (≥641px wide), `MOTION.phone` (≤640px), and below both a gate
at `min-height: 480px` / `prefers-reduced-motion` where **nothing animates** and
the server-rendered page is the finished page. Two tiers of markup share one DOM
tree — the hero has a fan of five cards and the same five as a phone deck, the
funnel has drawn connectors and dashed drops — so factories filter their queries
through `shown()` and only touch what this width actually renders.

### Conventions

- `[data-sequence-section]` marks a section the controller drives.
- `[data-reveal="…"]` marks something a beat animates. Its resting state is
  `MOTION.enter`; a beat takes it from there.
- Never give a `[data-reveal]` element an opacity of its own — the sequence
  tweens that property and will overwrite it. Put the alpha on the colour.
- Beats must be reversible: tween properties, don't perform actions.
- Measure through `asAuthored` / `authoredRect`, not `getBoundingClientRect`
  directly. Parts of the page are parked mid-animation, and a distance read off
  a parked layout is the wrong distance.

### The travelling card

The Squad card is drawn three times — the front of the hero's fan, the middle of
the approve diagram, flat over the Early Access form — and it is the same object
each time. `SquadCardTrail` is a fourth copy that carries it between them,
painting behind every section; `squadTravel` in `timelines.ts` is the path and
`MOTION.travel` is its shape.

Three docks, two legs. At a dock the traveller sits exactly on the slot and the
section's own card dissolves in over it, in place, so the exchange is invisible.
Between docks it lies flat, crosses into a lane beside the page's spine, travels
down it, and crosses back and stands upright into the pose of the dock ahead.
The descent quickens through the seam between two sections and eases while one
of them is being read, mixed with a steady glide (`MOTION.travel.rhythm`) so it
never actually stops.

The knobs worth knowing:

|                 |                                                                                                |
| --------------- | ---------------------------------------------------------------------------------------------- |
| `travel.sway`   | how far sideways each leg goes, per leg, as fractions of window width — signed, two lanes each |
| `travel.form`   | when each part of a crossing happens, in fractions of a leg's travelled page                   |
| `travel.rhythm` | how much of the seam rhythm survives against a steady glide                                    |
| `travel.lit`    | how visible the card is in a seam versus over a section                                        |
| `travel.phone`  | what the phone gets instead                                                                    |
