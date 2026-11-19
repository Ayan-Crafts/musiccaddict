import type { CSSProperties } from "react";
import type { ThemeManifest } from "../theme/types";

/**
 * A live miniature of the app rendered with the theme's own tokens and layout,
 * so the preview is the real manifest — not a screenshot.
 */
export function ThemePreview({ theme }: { theme: ThemeManifest }) {
  const vars = theme.tokens as unknown as CSSProperties;
  const rtl = theme.layout.progress === "rtl";
  return (
    <div style={{ ...vars, backgroundImage: "var(--backdrop)" }} className="flex h-40 flex-col overflow-hidden rounded-[14px] bg-bg ring-1 ring-border" aria-hidden="true">
      <div className={`flex flex-1 gap-2 p-2.5 ${theme.layout.nav === "right" ? "flex-row-reverse" : ""}`}>
        <div className="flex w-14 flex-col gap-1.5 pt-1">
          <div className="h-2 w-9 rounded-full bg-accent" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-1.5 rounded-full bg-fg-subtle/40" style={{ width: `${70 - i * 8}%` }} />
          ))}
        </div>
        <div className="grid flex-1 grid-cols-3 gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-[6px] bg-surface ring-1 ring-border">
              <div className="m-1.5 aspect-square rounded-[4px] bg-gradient-to-br from-accent/70 to-surface-active" style={{ opacity: 1 - i * 0.25 }} />
            </div>
          ))}
        </div>
      </div>
      <div className="flex h-8 items-center gap-2 border-t border-border bg-bg-elevated px-3">
        <div className="h-4 w-4 rounded-[3px] bg-surface-active" />
        <div className={`relative h-1 flex-1 rounded-full bg-surface-active`}>
          <div className="absolute inset-y-0 w-2/5 rounded-full bg-accent" style={rtl ? { right: 0 } : { left: 0 }} />
        </div>
      </div>
    </div>
  );
}
