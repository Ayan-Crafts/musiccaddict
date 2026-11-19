import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ProgressBar } from "./ProgressBar";

afterEach(cleanup);

describe("ProgressBar", () => {
  it("renders standard direction", () => {
    render(<ProgressBar positionMs={45_000} durationMs={260_000} layout={{ progress: "ltr", time: "elapsed-first" }} />);
    expect(screen.getByTestId("progress").dataset.origin).toBe("left");
    expect(screen.getByTestId("progress-label-left").textContent).toBe("0:45");
    expect(screen.getByTestId("progress-label-right").textContent).toBe("4:20");
    expect(screen.getByTestId("progress-fill").style.transformOrigin).toBe("left");
  });

  it("renders Tenet direction without reversing text", () => {
    render(<ProgressBar positionMs={45_000} durationMs={260_000} layout={{ progress: "rtl", time: "total-first" }} />);
    expect(screen.getByTestId("progress-label-left").textContent).toBe("4:20");
    expect(screen.getByTestId("progress-label-right").textContent).toBe("0:45");
    expect(screen.getByTestId("progress-fill").style.transformOrigin).toBe("right");
    expect(getComputedStyle(screen.getByTestId("progress")).direction).not.toBe("rtl");
  });

  it("is not seekable without a handler", () => {
    render(<ProgressBar positionMs={0} durationMs={0} layout={{ progress: "ltr", time: "elapsed-first" }} />);
    expect(screen.getByRole("slider").getAttribute("aria-disabled")).toBe("true");
  });
});
