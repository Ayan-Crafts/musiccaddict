import type { Transition, Variants } from "motion/react";
import type { ThemeLayout, ThemeMotion } from "./types";

/** +1 when the user navigates forward, -1 when going back. */
export type NavDirection = 1 | -1;

/**
 * The spatial axis for an animation: the theme's flow multiplied by the
 * navigation direction. Tenet (flow -1) therefore enters from the opposite side
 * for every movement, and "back" is reversed relative to "forward" in every theme.
 */
export function axis(motion: ThemeMotion, nav: NavDirection = 1): 1 | -1 {
  return (motion.flow * nav) as 1 | -1;
}

export function effectiveIntensity(motion: ThemeMotion, userIntensity = 1): number {
  return clamp01(motion.intensity) * clamp01(userIntensity);
}

/**
 * Page/panel transition variants. Use with `custom={navDirection}` on both the
 * AnimatePresence and the motion element so exits use the *new* direction.
 */
export function flowVariants(motion: ThemeMotion, userIntensity = 1, distance = 48): Variants {
  const k = effectiveIntensity(motion, userIntensity);
  return {
    enter: (nav: NavDirection = 1) => ({ opacity: 0, x: axis(motion, nav) * distance * k }),
    center: { opacity: 1, x: 0 },
    exit: (nav: NavDirection = 1) => ({ opacity: 0, x: -axis(motion, nav) * distance * 0.5 * k }),
  };
}

export function flowTransition(motion: ThemeMotion, userIntensity = 1): Transition {
  const k = effectiveIntensity(motion, userIntensity);
  return k === 0
    ? { duration: motion.duration.fast }
    : { duration: motion.duration.base, ease: motion.ease };
}

export interface ProgressPresentation {
  /** 0..1 */
  fraction: number;
  /** CSS transform-origin for the fill so it grows from the correct edge. */
  origin: "left" | "right";
  /** Left and right labels, in visual order. */
  labels: [string, string];
  /** Maps a pointer position (0..1 from the left edge) to a seek fraction. */
  seekFraction: (visualX: number) => number;
}

export function progressPresentation(
  positionMs: number,
  durationMs: number,
  layout: Pick<ThemeLayout, "progress" | "time">,
  format: (ms: number) => string,
): ProgressPresentation {
  const fraction = durationMs > 0 ? clamp01(positionMs / durationMs) : 0;
  const elapsed = format(positionMs);
  const total = format(durationMs);
  const rtl = layout.progress === "rtl";
  return {
    fraction,
    origin: rtl ? "right" : "left",
    labels: layout.time === "elapsed-first" ? [elapsed, total] : [total, elapsed],
    seekFraction: (x) => (rtl ? 1 - clamp01(x) : clamp01(x)),
  };
}

function clamp01(n: number): number {
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;
}
