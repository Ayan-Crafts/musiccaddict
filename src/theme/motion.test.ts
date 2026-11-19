import { describe, expect, it } from "vitest";
import { formatDuration } from "../lib/format";
import { axis, flowVariants, progressPresentation } from "./motion";
import { STANDARD_LAYOUT, STANDARD_MOTION } from "./themes/shared";
import type { ThemeLayout, ThemeMotion } from "./types";

const inverted: ThemeMotion = { ...STANDARD_MOTION, flow: -1 };
const tenetLayout: ThemeLayout = { nav: "left", progress: "rtl", time: "total-first", controls: "mirrored" };

type Pose = { x: number; opacity: number };
const resolve = (v: unknown, nav: 1 | -1) => (typeof v === "function" ? v(nav) : v) as Pose;

describe("flow-aware motion", () => {
  it("combines theme flow with navigation direction", () => {
    expect(axis(STANDARD_MOTION, 1)).toBe(1);
    expect(axis(STANDARD_MOTION, -1)).toBe(-1);
    expect(axis(inverted, 1)).toBe(-1);
    expect(axis(inverted, -1)).toBe(1);
  });

  it("enters from the opposite side when the flow is inverted", () => {
    const normal = flowVariants(STANDARD_MOTION);
    const tenet = flowVariants(inverted);
    const nEnter = resolve(normal.enter, 1).x;
    const tEnter = resolve(tenet.enter, 1).x;
    expect(nEnter).toBeGreaterThan(0);
    expect(tEnter).toBe(-nEnter);
    // exits go the other way from entries
    expect(Math.sign(resolve(normal.exit, 1).x)).toBe(-Math.sign(nEnter));
    expect(Math.sign(resolve(tenet.exit, 1).x)).toBe(-Math.sign(tEnter));
  });

  it("navigating back reverses the direction", () => {
    const v = flowVariants(STANDARD_MOTION);
    expect(resolve(v.enter, -1).x).toBe(-resolve(v.enter, 1).x);
  });

  it("zero intensity removes spatial movement", () => {
    const v = flowVariants(STANDARD_MOTION, 0);
    expect(Math.abs(resolve(v.enter, 1).x)).toBe(0);
    expect(resolve(v.enter, 1).opacity).toBe(0);
  });
});

describe("progress presentation", () => {
  it("standard: fills from the left, elapsed first", () => {
    const p = progressPresentation(45_000, 260_000, STANDARD_LAYOUT, formatDuration);
    expect(p.origin).toBe("left");
    expect(p.labels).toEqual(["0:45", "4:20"]);
    expect(p.fraction).toBeCloseTo(45 / 260);
    expect(p.seekFraction(0.25)).toBe(0.25);
  });

  it("tenet: fills from the right, total first, seek is mirrored", () => {
    const p = progressPresentation(45_000, 260_000, tenetLayout, formatDuration);
    expect(p.origin).toBe("right");
    expect(p.labels).toEqual(["4:20", "0:45"]);
    // clicking near the right edge seeks near the start of the track
    expect(p.seekFraction(0.9)).toBeCloseTo(0.1);
  });

  it("clamps invalid input", () => {
    expect(progressPresentation(10, 0, STANDARD_LAYOUT, formatDuration).fraction).toBe(0);
    expect(progressPresentation(999, 10, STANDARD_LAYOUT, formatDuration).fraction).toBe(1);
    expect(progressPresentation(NaN, 10, STANDARD_LAYOUT, formatDuration).fraction).toBe(0);
  });
});
