import Image from "next/image";
import type { ReactNode } from "react";

/*
 * The 360x260 illustration panel inside each step card: bordered surface,
 * dot-grid texture (different cloud pattern per step, hence passed in), and
 * an inset top highlight. Content is layered on top via children.
 */

export type FigurePanelProps = {
  texture: string;
  /**
   * The texture's own height. Steps 1 and 2 stop short of the bottom edge at
   * 239; step 3's runs the full 260, and since these are exported with
   * `preserveAspectRatio="none"` a wrong value here silently squashes the grid
   * rather than cropping or letterboxing it.
   */
  textureHeight?: number;
  children: ReactNode;
};

export default function FigurePanel({
  texture,
  textureHeight = 239,
  children,
}: FigurePanelProps) {
  return (
    /*
      figure-fit/sizer/stage: this panel is an artboard, not a fluid box — every
      ring, avatar, badge and bar inside it is placed at a coordinate measured
      against these 360x260. On a phone the step card is narrower than that, so
      the artboard is scaled to fit rather than stretched, which is what used to
      lift the avatars off the ring they sit on. Above the gate the card is 392
      wide, the panel is the 360 it was drawn at, and these three wrappers do
      nothing at all. See globals.css.
    */
    <div className="figure-fit shrink-0">
      <div className="figure-sizer">
        <div className="figure-stage">
          <div className="relative h-[260px] w-full overflow-hidden rounded-2xl bg-white/[0.02] shadow-[inset_0px_4px_20px_0px_rgba(255,255,255,0.08)] sm:w-[360px]">
            {/*
              The ring is drawn as its own layer rather than set as a border on
              the panel. A real border makes the *padding* box the containing
              block for everything inside it, so every absolutely-positioned
              child lands inset by the border's width — while Figma measures
              those children from the frame's own edge. Same ring, and the
              coordinates each figure is authored in are the ones Figma gives.

              Its width is also the reason a border cannot be trusted here:
              browsers snap it to whole device pixels, so the inset was 1px on a
              1x display and 1.5px on a 2x one, and the artwork shifted with the
              monitor.
            */}
            <span className="pointer-events-none absolute inset-0 rounded-2xl border-[1.5px] border-white/10" />
            <Image
              src={texture}
              alt=""
              width={358}
              height={textureHeight}
              className="pointer-events-none absolute top-0 left-0 max-w-none"
            />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
