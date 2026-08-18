import SquadCard from "@/components/ui/SquadCard";

/**
 * The Squad card, on its way from the hero to the approve diagram.
 *
 * The page has two Squad cards in it: the one at the front of the hero's fan
 * and the one in the middle of the Squad Approves diagram. They are the same
 * object — it is the product, and it is the subject of both sections — but
 * until now they were two pictures of it, and scrolling from one to the other
 * said nothing about that.
 *
 * This is the card in between. It picks up exactly where the hero's card sits,
 * dims to almost nothing, and travels down the page behind everything as the
 * reader scrolls, until it arrives in the approve diagram's slot and comes back
 * up to full. The hero's card fades out under it as it takes over and the
 * approve diagram's card never appears at all — that slot is filled by this,
 * which is what makes it one card that moved rather than two that swapped.
 *
 * ---------------------------------------------------------------------------
 * WHY IT IS A THIRD CARD RATHER THAN ONE OF THE TWO
 *
 * Neither of them can leave. Both live inside a .stage — a scaled artboard with
 * a container query on it — and the hero's is inside .stage-viewport, which
 * clips on both axes precisely so the fan's entrance can start off the edge.
 * A card animated out of that box is a card cut in half by it. Measured.
 *
 * So the two real cards stay where they are and this one does the travelling,
 * superimposed on each of them at the ends of its journey. All three are the
 * same component at the same proportions, so a cross-fade between them at a
 * matched size and position is not a cross-fade anyone can see.
 *
 * ---------------------------------------------------------------------------
 * It sits in page coordinates rather than viewport ones — absolutely positioned
 * against the initial containing block, since nothing above it is positioned —
 * which is what makes the travel simple to describe: the hero's slot and the
 * approve slot are both fixed points on the page, and the card is somewhere on
 * the line between them. Scrolling does the rest, and because the page moves up
 * at roughly the rate the card moves down it, the card appears to hang in the
 * window while the sections stream past behind it.
 *
 * First child of <main>, before .scene-track, which is the whole of how it ends
 * up behind the sections: both are positioned elements with no z-index, so they
 * paint in document order and everything in the deck lands on top of this.
 */
export default function SquadCardTrail() {
  return (
    <div className="squad-trail" aria-hidden="true">
      <div className="squad-trail-card" data-squad-trail="">
        <SquadCard />
      </div>
    </div>
  );
}
