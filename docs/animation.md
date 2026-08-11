# Task

Build a scroll-driven animation system for the landing page. Implement the global
system first, then the three sections listed below. More sections will follow, so
the architecture must make adding a new section trivial (register a section + its
intro/outro timeline; the controller handles the rest).

Before writing code: read the existing page structure/components and tell me the
stack you'll use and where the controller will live. If GSAP + ScrollTrigger is
already installed, use it. If not, ask before adding a dependency.

## Constraints

- Desktop only. Below the desktop breakpoint, skip all animation and render every
  element in its final resting state — no partial states, no hidden elements.
- Respect `prefers-reduced-motion`: same fallback as mobile.
- No layout shift or scrollbar jump when animations run.
- Animations must be fully reversible, not re-triggered forward copies.

# Global scroll system

Every section has two timelines: **intro** and **outro**. The outro is the intro
played in reverse.

The page behaves as a sequence of full-viewport states, not free scrolling:

1. Page loads → user is pinned at the top → navbar intro plays.
2. User scrolls down → the current section's outro plays → on completion, the page
   snaps/scrolls so the next section fills the viewport → that section's intro
   plays automatically.
3. Repeat for each subsequent section.
4. Scrolling up does the exact inverse: current section's outro plays, previous
   section is revealed, and its intro plays (i.e. the user sees the previous
   section animate in again, not jump to a finished state).

Rules for the controller:

- Lock scroll input while a transition (outro → snap → intro) is running. Queue or
  ignore additional scroll events until it finishes; do not let two transitions
  overlap.
- Direction is determined by scroll intent, and must be re-evaluated for each
  transition so a user can reverse direction at any boundary.
- Kill/clean up timelines on unmount; no leaked ScrollTriggers on route change.
- Expose a single config array (section id → element ref → intro timeline factory)
  so new sections plug in without touching the controller.

# Section specs

## Navbar

- **Intro:** starts fully outside the viewport (above the top edge), drops down
  into place.
- **Outro:** folds and retracts back above the viewport edge.
- The navbar outro is the first thing that plays when the user scrolls away from
  the top of the page, before the hero intro begins.

## Hero

Two parts, animated sequentially: (1) text + CTA buttons, (2) card stack.

Trigger order on first scroll from the top:
navbar outro → scroll hero to top so it occupies the full viewport → hero intro.

**Part 1 — text and CTAs**

1. Heading/subheading rise from below while scaling from 0 → 1.
2. CTA buttons start lying flat on the screen plane — rotated on the X axis so
   they read as horizontal/face-down — then flip up to their natural upright
   position.

**Part 2 — cards**

1. All cards start flat on the screen plane, same as the buttons. The stack must be
   legible while flat: every card behind the center "squad" card is visible,
   offset, not hidden underneath it.
2. The stack rotates counter-clockwise and floats up into its real vertical
   position, moving as one unit.
3. Once upright, the surrounding cards fan out from behind the squad card into
   their final positions.

**Outro:** exact reverse — cards collapse back behind the squad card, the stack
rotates clockwise back down to flat, buttons flip down, text scales down and drops.

Requires a `perspective` on the container and sensible `transform-origin` values
(bottom edge for the flip-up, so cards hinge rather than spin about their center).

## "Alone vs Together"

Triggered by the hero outro. Once the hero outro completes, this section reveals
itself and its intro plays.

Two parts, sequential:

1. Text: same treatment as the hero — rise from below, scale from 0 → 1.
2. Two cards slide in to their final positions, one from the left edge, one from
   the right.

**Outro:** cards exit back out to left/right, then text scales down and drops.

# Deliverable

Working implementation of the controller + these three sections. Keep timing values
(durations, eases, stagger) in one named config object so I can tune them without
hunting through files. Tell me the values you picked and why.

# Confirm before building

- Are the intro/outro timelines _scrubbed_ by scroll position, or _played_ at a
  fixed duration once triggered? My description implies played-at-fixed-duration
  with scroll locked during playback — confirm that's what you're implementing.
- How should a fast scroll / trackpad flick be handled: one transition per gesture,
  or allow skipping ahead?
