import Image from "next/image";

/*
 * A run of connector artwork that draws itself, with a light riding the
 * drawing edge.
 */

/* Offset copies of the artwork, composited into one dilated mask. */
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
 */
const SOFT = "#ffffff 0%, rgba(137,163,255,0.7) 38%, rgba(43,88,250,0) 82%";

export type ConnectorTraceProps = {
  src: string;
  /** Extra classes on the run's own box. */
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
  /** How wide the light is *across* the run. */
  cross?: number;
  /** Room left around the artwork, and worth setting on every run. */
  pad?: number;
  /**
   * Some assets come out of Figma facing the wrong way, because Figma draws
   * them once and mirrors the wrapper so the bright end leads into whatever
   * they point at.
   */
  flipX?: boolean;
  flipY?: boolean;
  /**
   * What this run is a connection BETWEEN, for the beats that want one
   * particular run rather than all of them.
   */
  run?: string;
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
  run,
  children,
}: ConnectorTraceProps) {
  /* Its own inverse, which is what lets the same string undo it below. */
  const mirror = flipX ? "scaleX(-1)" : flipY ? "scaleY(-1)" : null;
  const across = axis === "x";
  /*
   * Parked entirely off the run's own start edge, so the pass begins with
   * nothing on screen and the light arrives.
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
      {...(run ? { "data-run": run } : null)}
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
          {/* Deliberately not a [data-reveal]. */}
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

      {/* Children stay in the artwork's *unmirrored* coordinates. */}
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
