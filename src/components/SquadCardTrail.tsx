import SquadCard, { SQUAD_CARD } from "@/components/ui/SquadCard";

/**
 * The Squad card, on its way from the hero to the approve diagram to the
 * waitlist.
 *
 * The page draws this card three times — at the front of the hero's fan, in the
 * middle of the Squad Approves diagram, and lying flat over the Early Access
 * form. It is the same object in all three: it is the product, and those are
 * the three sections that are about it. This is the one that carries it between
 * them. See `.squad-trail` in globals.css for where it paints and why it is a
 * fourth card rather than one of the three, and `squadTravel` in
 * scroll/timelines.ts for the path.
 *
 * Landscape, always. Figma authors the face at 420x260 and the two upright
 * instances are that face turned a quarter; a landscape card at rotationZ -90
 * is pixel-identical to `orientation="portrait"`, so ONE element covers all
 * three docks and the final quarter turn at Early Access is performed rather
 * than restated. It is also the largest the card is ever drawn — 420 wide at
 * the last dock — so the raster is made once at full size and only ever scaled
 * down, which is the difference between a crisp card and a soft one.
 *
 * aria-hidden throughout: there are already three of these in the accessibility
 * tree, each with the card's own label, and this is the one that is only ever a
 * picture of them in transit.
 */
export default function SquadCardTrail() {
  return (
    <div className="squad-trail" aria-hidden="true">
      <div className="squad-trail-frame" data-card-travel="">
        {/*
          The card, and nothing else on this element: the frame above owns x, y,
          scale and opacity, this owns rotation, and neither ever writes the
          other's property. SquadCard's own root carries a transform of its own
          to scale its face, so the rotation goes on a wrapper rather than on
          the card — the same reason EarlyAccess wraps its instance.
        */}
        <div className="size-full" data-card-turn="">
          <SquadCard orientation="landscape" size={SQUAD_CARD.width} />
        </div>
      </div>
    </div>
  );
}
