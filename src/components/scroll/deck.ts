/*
 * What the navigation rail and the controller both need to know: which section
 * is showing, and how to ask for a different one.
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

/*
 * Replaced rather than mutated: useSyncExternalStore compares snapshots by
 * identity, so a mutated object would never look like it had changed.
 */
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

/** The controller, saying where it is. */
export const setDeckAt = (index: number, footer: boolean) => {
  if (index === state.index && footer === state.footer) return;
  state = { ...state, index, footer };
  emit();
};

/**
 * The controller, offering to take requests — and withdrawing the offer when
 * it is torn down, which gsap.matchMedia does every time the window crosses
 * the gate.
 */
export const setDeckNavigator = (fn: Navigate | null) => {
  navigate = fn;
  state = fn
    ? { ...state, active: true }
    : { index: 0, footer: false, active: false };
  emit();
};

/** The rail, asking. */
export const deckGoTo = (index: number) => {
  if (!navigate) return false;
  navigate(index);
  return true;
};
