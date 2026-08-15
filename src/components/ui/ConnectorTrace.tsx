import Image from "next/image";

/*
 * A run of connector artwork that draws itself, with a light riding the
 * drawing edge.
 *
 * The light is the same artwork a second time, used as a mask over a
 * travelling gradient, so it can only paint where a line actually is: one
 * sweep lights every branch of a fan at once, each exactly where it bends,
 * with no path data duplicated in JS. Which end it starts from is the
 * section's business — the timeline reads the axis off the DOM.
 *
 * Nothing here animates on its own. The wrapper carries [data-reveal='lines']
 * and the gradient [data-spark]; the section's timeline drives both.
 */

/*
 * Offset copies of the artwork, composited into one dilated mask.
 *
 * Two things make that necessary. Figma draws these runs as 1px strokes at
 * 0.3-0.4 opacity, so a single copy caps the light at a fraction of a hairline
 * and simply does not read; mask layers composite additively by default, so
 * five copies reach ~92% at the core. And the runs are dashed 3-on-3-off,
 * which a sweep would strobe through — spreading the mask past the gaps turns
 * it back into one continuous wire to travel down.
 *
 * The cross rather than a square: it has to thicken horizontal runs and
 * vertical elbows by the same amount.
 */
const SPREAD = 1.5;
const OFFSETS: [number, number][] = [
  [0, 0],
  [0, -SPREAD],
  [0, SPREAD],
  [-SPREAD, 0],
  [SPREAD, 0],
];

/*
 * The bloom sits on a wrapper rather than on the masked layer itself because
 * filters are applied *before* masks: on the layer it would bloom the
 * gradient's rectangle and then have the bloom masked away.
 */
const BLOOM =
  "drop-shadow(0 0 3px rgba(190,208,255,0.9)) drop-shadow(0 0 9px rgba(90,130,255,0.85)) drop-shadow(0 0 18px rgba(43,88,250,0.7))";

const STOPS =
  "rgba(43,88,250,0) 0%, rgba(43,88,250,0.35) 28%, rgba(137,163,255,0.85) 48%, #ffffff 60%, rgba(137,163,255,0) 82%";

/*
 * The narrowed light is an ellipse rather than a band with a head and a tail.
 *
 * `cross` is only ever set where the mask is effectively solid — a junction dot
 * and its shadow — and a mask that solid paints back whatever silhouette it is
 * given, hard edges included. Soft in both directions is the only shape that
 * cannot show its own outline.
 */
const SOFT = "#ffffff 0%, rgba(137,163,255,0.7) 38%, rgba(43,88,250,0) 82%";

export type ConnectorTraceProps = {
  src: string;
  /**
   * Extra classes on the run's own box.
   *
   * What it exists for is `hidden sm:block`, on a run whose two endpoints stop
   * being in the same place on a phone — the approve diagram stacks into a
   * column there, so a wire drawn between two of its parts is joining
   * coordinates that no longer describe anything. A run inside an artboard that
   * survives intact, scaled, keeps its wire and passes nothing.
   */
  className?: string;
  /** The artwork's own size, in stage units. */
  width: number;
  height: number;
  /** The artwork's top-left, in the coordinates of its positioned ancestor. */
  left: number;
  top: number;
  /** Which way the light runs. */
  axis?: "x" | "y";
  /** How long the light is along that axis. */
  spark?: number;
  /**
   * How wide the light is *across* the run. Defaults to the whole box, which is
   * what a fan wants — its branches are spread over the full width and the mask
   * decides where the light lands.
   *
   * Set it where the mask cannot be trusted to do that job. A run whose artwork
   * carries an SVG drop shadow has mask coverage everywhere the shadow reaches,
   * not just on the stroke, so a full-width light paints the shadow's whole disc
   * and the run reads as a lit rectangle. Narrowing it to the stroke turns that
   * back into a light traveling down a wire, flaring as it crosses the junction.
   */
  cross?: number;
  /**
   * Room left around the artwork, and worth setting on every run.
   *
   * The wipe clips this box, and it clips the light's bloom with it — so with
   * the box drawn tight to the artwork the bloom ends on a hard vertical edge
   * and the whole run reads as a lit rectangle rather than a lit wire. The
   * padding is what lets the glow fall off to nothing before the clip reaches
   * it, and it wants to be wider than the bloom's own radius.
   *
   * It also gives children somewhere to sit: they are positioned against the
   * padded box, so an endpoint dot just outside the artwork is not sheared off.
   */
  pad?: number;
  /**
   * Some assets come out of Figma facing the wrong way, because Figma draws
   * them once and mirrors the wrapper so the bright end leads into whatever
   * they point at. That mirrors this element's own coordinate system too, which
   * the timeline has to know about — hence the attribute rather than a bare
   * transform.
   *
   * Set whichever axis the Figma wrapper mirrors, never both: the flip is one
   * bit on the DOM and the timeline resolves it against `axis`.
   */
  flipX?: boolean;
  flipY?: boolean;
  children?: React.ReactNode;
};

export default function ConnectorTrace({
  src,
  width,
  height,
  left,
  top,
  axis = "x",
  spark = 220,
  cross,
  pad = 0,
  flipX = false,
  flipY = false,
  className = "",
  children,
}: ConnectorTraceProps) {
  /* Its own inverse, which is what lets the same string undo it below. */
  const mirror = flipX ? "scaleX(-1)" : flipY ? "scaleY(-1)" : null;
  const across = axis === "x";
  /*
   * Parked entirely off the run's own start edge, so the pass begins with
   * nothing on screen and the light arrives.
   *
   * It used to sit half on, straddling that edge, because it ran *with* the
   * wipe and the wipe clipped its leading half away — what was left read as a
   * head riding the drawing edge. Now that it runs after the wipe there is
   * nothing left to clip it, and half a light parked on the near end would
   * simply be a white smudge that starts there.
   */
  const along = across
    ? { left: -spark, width: spark }
    : { top: -spark, height: spark };
  const wide = across
    ? cross
      ? { top: `calc(50% - ${cross / 2}px)`, height: cross }
      : { top: 0, bottom: 0 }
    : cross
      ? { left: `calc(50% - ${cross / 2}px)`, width: cross }
      : { left: 0, right: 0 };
  const mask = {
    maskImage: OFFSETS.map(() => `url(${src})`).join(","),
    maskPosition: OFFSETS.map(([x, y]) => `${x + pad}px ${y + pad}px`).join(
      ",",
    ),
    maskSize: OFFSETS.map(() => `${width}px ${height}px`).join(","),
    maskRepeat: OFFSETS.map(() => "no-repeat").join(","),
  };

  return (
    <div
      className={`pointer-events-none absolute ${className}`.trim()}
      style={{
        left: left - pad,
        top: top - pad,
        width: width + pad * 2,
        height: height + pad * 2,
        ...(mirror ? { transform: mirror } : null),
      }}
      data-reveal="lines"
      data-trace-axis={axis}
      {...(mirror ? { "data-trace-flip": "" } : null)}
    >
      <Image
        src={src}
        alt=""
        width={width}
        height={height}
        className="absolute max-w-none"
        style={{ left: pad, top: pad }}
      />

      <div className="absolute inset-0" style={{ filter: BLOOM }}>
        <div className="absolute inset-0" style={mask}>
          {/*
            Deliberately not a [data-reveal]. That hook means "the sequence owns
            whether this is on screen", and both the CSS start state and the
            <noscript> override read it as something to hand back at full
            opacity when nothing will play. This is a moving light: with nothing
            to move it, the honest resting state is off, not a bright smudge
            parked over one end of the run. So it holds itself hidden and only
            the timeline turns it on.
          */}
          <div
            className="absolute opacity-0"
            style={{
              ...along,
              ...wide,
              backgroundImage: cross
                ? `radial-gradient(ellipse ${(across ? spark : cross) / 2}px ${(across ? cross : spark) / 2}px at 50% 50%, ${SOFT})`
                : `linear-gradient(${across ? 90 : 180}deg, ${STOPS})`,
            }}
            data-spark=""
          />
        </div>
      </div>

      {/*
        Children stay in the artwork's *unmirrored* coordinates.

        The mirror belongs to the export, not to the run — a caller reading
        endpoint dots off Figma has them in panel coordinates, and asking it to
        subtract each one from the box width to place a dot would put the sizing
        maths in the one place it is hardest to check against the artwork.
        Undoing the flip on a box the exact size of the mirrored one leaves the
        box where it was and hands children back their original axes.

        Inside the wipe rather than beside it, so a dot is still revealed with
        the line it terminates.
      */}
      {mirror ? (
        <div className="absolute inset-0" style={{ transform: mirror }}>
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
}
