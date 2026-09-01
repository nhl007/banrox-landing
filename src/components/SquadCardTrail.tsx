import BanroxEngineHub from "@/components/ui/BanroxEngineHub";
import SquadCard, { SQUAD_CARD } from "@/components/ui/SquadCard";

/**
 * The Squad card, on its way through the page.
 *
 * It docks at six places and is never faded out between them, so this is one
 * element that travels rather than a set that cross-dissolves. Two things make
 * that possible, and both are DOM rather than motion:
 *
 * 1. THE SLICES. Where the three Works step cards sit side by side, the card
 *    has to lie over all three at once, which one card cannot do. So there are
 *    four copies in here: the whole one, and three horizontal thirds. Each
 *    slice is a 420x86.667 window with a full card inside pulled back UP by the
 *    window's own offset, so stacked they are pixel-identical to the whole
 *    card and pulled apart they are three independent cards. The controller
 *    crossfades whole -> slices on the way in and back on the way out.
 *
 *    Only in the WIDE layout: the controller branches on whether the steps are
 *    laid out in a row or a column, and where they are stacked the slices stay
 *    at nothing for the whole page and the whole card squashes flat and slides
 *    down the column instead. They still have to exist in both, because the
 *    branch is decided at measure time and re-decided on every resize.
 *
 * 2. THE FACES. The card morphs into whatever stands at two of its docks — the
 *    VS in Alone vs Together, and the engine hub in the Intelligence Layer.
 *    Those live here as 0x0 anchor points OUTSIDE the travelling frame, so the
 *    controller can put them on the card's path without their inheriting its
 *    roll, tip and yaw. Each is sized by reading its one element child's width
 *    against the real host's, so each must have exactly one child and it must
 *    have a real width.
 *
 * Whatever it is standing in for wears `.card-taken` while it does, so there is
 * never two of the same object on screen.
 *
 * aria-hidden throughout: the real cards are already in the accessibility tree,
 * and every copy in here is only a picture of one in transit.
 */

/** Three, because the Works section has three steps. */
const SLICES = 3;

/**
 * 260 / 3. The stylesheet rounds the same number to 86.667px by hand — see the
 * note on `.squad-trail-slice` in globals.css.
 */
const SLICE_H = SQUAD_CARD.height / SLICES;

export default function SquadCardTrail() {
  return (
    <div className="squad-trail" aria-hidden="true">
      {/*
       * The frame is what travels: the controller writes x, y, scale and
       * opacity here and nothing else does. Its box is the authored face offset
       * by half of itself, so its origin IS the card's centre.
       */}
      <div className="squad-trail-frame" data-card-travel="">
        {/*
         * The in-plane turn. rotationZ goes here — the card's roll, -90 for
         * almost the whole journey and back to 0 for the last quarter turn at
         * Early Access. This element carries the perspective the 3D rotations
         * below it are seen through.
         */}
        <div className="size-full" data-card-turn="">
          {/*
           * And the out-of-plane one: rotationY and rotationX, the yaw and tip
           * of the arcs and of the face morph. Two elements rather than one,
           * because the roll has to happen inside the perspective its own
           * element sets.
           */}
          <div className="size-full" data-card-swing="">
            <div className="squad-trail-whole" data-card-whole="">
              <SquadCard orientation="landscape" size={SQUAD_CARD.width} />
            </div>

            {/*
             * Held at nothing by the stylesheet; only the Works dwell in the
             * row layout brings them up. Each is a window on to its own third.
             */}
            {Array.from({ length: SLICES }, (_, i) => (
              <div
                key={i}
                className="squad-trail-slice"
                data-card-slice={i}
                style={{ top: i * SLICE_H }}
              >
                <div
                  className="squad-trail-slice-art"
                  style={{ top: -(i * SLICE_H) }}
                >
                  <SquadCard orientation="landscape" size={SQUAD_CARD.width} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/*
       * The two faces, as siblings of the frame rather than children of it:
       * the controller puts them on the card's path, but they must not inherit
       * the card's own turn. Each is a point with its content centred on it.
       */}
      <div className="squad-trail-face" data-card-face="vs">
        {/*
         * The Alone vs Together VS, minus that instance's sm: positioning and
         * its data-reveal: this one is placed by the stylesheet and the
         * controller, and is not a reveal target.
         */}
        <span className="font-display flex h-12 items-center text-[48px] leading-none text-white italic opacity-70">
          VS
        </span>
      </div>
      <div className="squad-trail-face" data-card-face="engine">
        <BanroxEngineHub />
      </div>
    </div>
  );
}
