import { create } from "zustand";
import type { NavDirection } from "../theme/motion";
import type { RouteId } from "./routes";

/**
 * Desktop navigation with back/forward history. A store instead of a URL router:
 * there is nothing to deep-link, and the persistent player must never be inside
 * a routed subtree.
 */
interface RouterState {
  current: RouteId;
  back: RouteId[];
  forward: RouteId[];
  /** Direction of the last navigation; drives transition direction. */
  direction: NavDirection;
  navigate: (to: RouteId) => void;
  goBack: () => void;
  goForward: () => void;
}

const MAX_HISTORY = 50;

export const useRouter = create<RouterState>((set, get) => ({
  current: "home",
  back: [],
  forward: [],
  direction: 1,

  navigate(to) {
    const { current, back } = get();
    if (to === current) return;
    set({ current: to, back: [...back, current].slice(-MAX_HISTORY), forward: [], direction: 1 });
  },

  goBack() {
    const { current, back, forward } = get();
    const prev = back[back.length - 1];
    if (!prev) return;
    set({ current: prev, back: back.slice(0, -1), forward: [current, ...forward], direction: -1 });
  },

  goForward() {
    const { current, back, forward } = get();
    const [next, ...rest] = forward;
    if (!next) return;
    set({ current: next, back: [...back, current], forward: rest, direction: 1 });
  },
}));
