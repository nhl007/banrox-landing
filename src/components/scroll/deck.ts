/*
 * What the navigation rail and the controller both need to know: which section
 * is showing, and how to ask for a different one.
 *
 * A small store rather than context or props, because the two ends of it are
 * nowhere near each other in the tree — the controller lives inside a useGSAP
 * closure in a client component wrapping the whole page, and the rail is a
 * sibling of the footer. Threading a ref between them would mean making every
 * section component a client component to pass it through.
 *
 * The rail also has to work when there is NO deck: below the gate, and under
 * reduced motion, the page is an ordinary column of sections and nothing
 * registers a navigator. `active` is how the rail knows to scroll to a section
 * instead of asking for it.
 */

export type DeckState = {
  /** Which section is showing. */
  index: number;
  /** Whether the reader has left the deck for the footer below it. */
  footer: boolean;
  /** Whether a controller is driving a deck at all. */
  active: boolean;
};

type Navigate = (index: number) => void;

const listeners = new Set<() => void>();

/* Replaced rather than mutated: useSyncExternalStore compares snapshots by
   identity, so a mutated object would never look like it had changed. */
let state: DeckState = { index: 0, footer: false, active: false };
let navigate: Navigate | null = null;

const emit = () => {
  for (const fn of listeners) fn();
};

export const deckSnapshot = () => state;

/** The server renders the rail with no deck yet; this is that state. */
const initial: DeckState = { index: 0, footer: false, active: false };
export const deckServerSnapshot = () => initial;

export const deckSubscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

/**
 * The controller, saying where it is.
 *
 * Guarded on equality because the footer half of this is published from a
 * scroll listener, which fires far more often than it changes anything.
 */
export const setDeckAt = (index: number, footer: boolean) => {
  if (index === state.index && footer === state.footer) return;
  state = { ...state, index, footer };
  emit();
};

/**
 * The controller, offering to take requests — and withdrawing the offer when it
 * is torn down, which gsap.matchMedia does every time the window crosses the
 * gate. Passing null is what puts the rail back to scrolling.
 */
export const setDeckNavigator = (fn: Navigate | null) => {
  navigate = fn;
  state = fn
    ? { ...state, active: true }
    : { index: 0, footer: false, active: false };
  emit();
};

/**
 * The rail, asking. An index past the last section means the footer, which the
 * deck does not own but does have to get out of the way of. Returns false if
 * nobody is listening.
 */
export const deckGoTo = (index: number) => {
  if (!navigate) return false;
  navigate(index);
  return true;
};
