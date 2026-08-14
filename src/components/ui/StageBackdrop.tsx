import type { CSSProperties, ReactNode } from "react";

/**
 * A stage that carries nothing but decoration, sitting behind the page.
 *
 * Two sections have an ambient glow authored in stage coordinates — the bloom
 * behind the hero's card fan, the halo behind the approve diagram's squad card
 * — and both have to scale exactly with the stage they belong to, or the glow
 * drifts off its subject the moment the window is not the artboard's size.
 *
 * They cannot simply live in that stage. A stage is a container query, a
 * container query is a stacking context, and anything painted "behind" from
 * inside one is still painted in front of the heading above it. Both stages
 * also carry a clip, which is the whole reason their contents can start off
 * the edge of the screen, and a glow is exactly the thing that has to bleed.
 *
 * So the glow gets a stage of its own, laid over the same box. Same width, same
 * height, same container — so the same scale falls out — and behind everything
 * on the page, which is where the -z-10 sibling it replaces used to sit.
 *
 * Give it the SAME --stage-w/--stage-h as the stage it shadows. Nothing
 * enforces that; the geometry is only shared because the numbers agree.
 */
export default function StageBackdrop({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: ReactNode;
}) {
  return (
    <div className="stage-backdrop" aria-hidden="true">
      <div
        className="stage-sizer"
        style={
          {
            "--stage-w": width,
            "--stage-h": height,
          } as CSSProperties
        }
      >
        <div className="stage">{children}</div>
      </div>
    </div>
  );
}
