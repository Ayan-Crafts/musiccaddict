import { useEffect, useState } from "react";
import { Badge, Button, Panel, SectionTitle, cx } from "../components/ui/primitives";
import { PLANNED_THEMES } from "../theme/catalog";
import { listThemes } from "../theme/registry";
import { useThemeStore } from "../theme/store";
import type { ThemeManifest } from "../theme/types";
import { PageHeader } from "./PageHeader";
import { ThemePreview } from "./ThemePreview";

export function ThemeGalleryScreen() {
  const { theme: active, setTheme, userIntensity, setUserIntensity } = useThemeStore();
  const [installed, setInstalled] = useState<ThemeManifest[]>([]);

  useEffect(() => {
    Promise.all(listThemes().map((e) => e.load())).then(setInstalled);
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Theme Engine"
        title="Theme Gallery"
        subtitle="Themes change colour, type, layout and motion — never your music. Switching is instant and playback is never interrupted."
      />

      <SectionTitle eyebrow="Installed" title="Base themes" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
        {installed.map((t) => {
          const isActive = t.id === active.id;
          return (
            <Panel key={t.id} className={cx("p-4 transition-shadow", isActive && "outline-2 outline-offset-2 outline-accent")}>
              <ThemePreview theme={t} />
              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-fg">{t.name}</div>
                  <p className="mt-0.5 text-sm text-fg-muted">{t.description}</p>
                </div>
                {isActive ? (
                  <Badge tone="accent">Active</Badge>
                ) : (
                  <Button variant="primary" onClick={() => setTheme(t.id)}>Apply</Button>
                )}
              </div>
            </Panel>
          );
        })}
      </div>

      <div className="mt-10 max-w-xl">
        <SectionTitle eyebrow="Motion" title="Animation intensity" />
        <Panel className="p-5">
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={userIntensity}
              onChange={(e) => setUserIntensity(Number(e.target.value))}
              className="flex-1 accent-[var(--accent)]"
              aria-label="Animation intensity"
            />
            <span className="tabular w-12 text-right font-mono text-sm text-fg-muted">{Math.round(userIntensity * 100)}%</span>
          </div>
          <p className="mt-2 text-xs text-fg-subtle">0% keeps fades only. Your system's reduced-motion setting is always respected.</p>
        </Panel>
      </div>

      <div className="mt-10">
        <SectionTitle eyebrow="Planned · Phase 9" title="Signature themes" />
        <p className="-mt-2 mb-5 max-w-2xl text-sm text-fg-muted">
          Each will be a complete identity — layout, motion, visualiser and player — built from original artwork. Not installed yet.
        </p>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
          {PLANNED_THEMES.map((t) => (
            <div key={t.id} className="rounded-[var(--radius-md)] bg-surface/60 p-4 ring-1 ring-border">
              <div className="flex h-14 overflow-hidden rounded-[10px]">
                {t.swatch.map((c, i) => (
                  <div key={c} style={{ background: c, flex: i === 0 ? 3 : 1 }} />
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-semibold text-fg">{t.name}</span>
                <span className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-fg-subtle">{t.family}</span>
              </div>
              <p className="mt-1 text-[13px] leading-snug text-fg-muted">{t.idea}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
