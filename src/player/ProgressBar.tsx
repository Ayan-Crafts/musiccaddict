import { formatDuration } from "../lib/format";
import { progressPresentation } from "../theme/motion";
import type { ThemeLayout } from "../theme/types";

interface Props {
  positionMs: number;
  durationMs: number;
  layout: Pick<ThemeLayout, "progress" | "time">;
  /** Seek handler receiving a 0..1 fraction of the track. Omit to disable seeking. */
  onSeek?: (fraction: number) => void;
}

/**
 * Direction-aware progress. In an RTL-progress theme (Tenet) the fill grows from
 * the right edge and the time labels swap, while text itself stays readable.
 */
export function ProgressBar({ positionMs, durationMs, layout, onSeek }: Props) {
  const p = progressPresentation(positionMs, durationMs, layout, formatDuration);

  return (
    <div className="flex w-full items-center gap-3" data-testid="progress" data-origin={p.origin}>
      <span className="tabular w-11 text-right font-mono text-[11px] text-fg-subtle" data-testid="progress-label-left">
        {p.labels[0]}
      </span>
      <div
        role="slider"
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={Math.round(durationMs / 1000)}
        aria-valuenow={Math.round(positionMs / 1000)}
        aria-disabled={!onSeek}
        tabIndex={onSeek ? 0 : -1}
        className="group relative h-1 flex-1 cursor-pointer rounded-full bg-surface-active aria-disabled:cursor-default"
        onClick={(e) => {
          if (!onSeek) return;
          const r = e.currentTarget.getBoundingClientRect();
          onSeek(p.seekFraction((e.clientX - r.left) / r.width));
        }}
      >
        <div
          data-testid="progress-fill"
          className="absolute inset-0 rounded-full bg-fg group-hover:bg-accent"
          style={{ transform: `scaleX(${p.fraction})`, transformOrigin: p.origin }}
        />
      </div>
      <span className="tabular w-11 font-mono text-[11px] text-fg-subtle" data-testid="progress-label-right">
        {p.labels[1]}
      </span>
    </div>
  );
}
