import { Icon, type IconName } from "../components/ui/Icon";
import { IconButton } from "../components/ui/primitives";
import { useThemeStore } from "../theme/store";
import { ProgressBar } from "./ProgressBar";
import { usePlayer } from "./store";

const ENGINE_PENDING = "Audio engine arrives in Phase 4";

/**
 * The persistent player. Rendered by the shell outside the routed screen area,
 * so navigation and theme changes never unmount it.
 */
export function PlayerBar() {
  const layout = useThemeStore((s) => s.theme.layout);
  const { engineAvailable, status, track, positionMs, durationMs, shuffle, repeat } = usePlayer();
  const disabled = !engineAvailable || !track;

  const transport: Array<{ key: string; icon: IconName; label: string; primary?: boolean; active?: boolean }> = [
    { key: "shuffle", icon: "shuffle", label: "Shuffle", active: shuffle },
    { key: "prev", icon: "prev", label: "Previous" },
    { key: "play", icon: status === "playing" ? "pause" : "play", label: status === "playing" ? "Pause" : "Play", primary: true },
    { key: "next", icon: "next", label: "Next" },
    { key: "repeat", icon: "repeat", label: "Repeat", active: repeat !== "off" },
  ];
  if (layout.controls === "mirrored") transport.reverse();

  return (
    <footer
      className="relative z-20 grid h-[84px] shrink-0 grid-cols-[minmax(220px,1fr)_minmax(320px,1.4fr)_minmax(220px,1fr)] items-center gap-6 border-t border-border bg-bg-elevated/85 px-5 backdrop-blur-xl"
      aria-label="Player"
    >
      {/* Now playing */}
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-gradient-to-br from-surface-active to-surface text-fg-subtle ring-1 ring-border">
          <Icon name="music" size={20} />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-fg">{track?.title ?? "Nothing playing"}</div>
          <div className="truncate text-xs text-fg-muted">
            {track ? `${track.artist} — ${track.album}` : "Your queue is empty"}
          </div>
        </div>
      </div>

      {/* Transport */}
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-1">
          {transport.map((c) =>
            c.primary ? (
              <button
                key={c.key}
                type="button"
                aria-label={c.label}
                title={disabled ? ENGINE_PENDING : c.label}
                disabled={disabled}
                className="mx-2 grid h-10 w-10 place-items-center rounded-full bg-fg text-bg transition-transform enabled:hover:scale-105 disabled:opacity-35"
              >
                <Icon name={c.icon} size={18} />
              </button>
            ) : (
              <IconButton
                key={c.key}
                icon={c.icon}
                label={c.label}
                title={disabled ? ENGINE_PENDING : c.label}
                active={c.active}
                disabled={disabled}
                size={c.key === "prev" || c.key === "next" ? 16 : 17}
              />
            ),
          )}
        </div>
        <ProgressBar positionMs={positionMs} durationMs={durationMs} layout={layout} />
      </div>

      {/* Output */}
      <div className="flex items-center justify-end gap-1">
        <IconButton icon="queue" label="Queue" title={ENGINE_PENDING} disabled={!engineAvailable} />
        <IconButton icon="speaker" label="Output device" title={ENGINE_PENDING} disabled={!engineAvailable} />
        <IconButton icon="volume" label="Volume" title={ENGINE_PENDING} disabled={!engineAvailable} />
        <div className="ml-1 h-1 w-24 rounded-full bg-surface-active" aria-hidden="true" />
      </div>
    </footer>
  );
}
