import { useState, type ReactNode } from "react";
import { Badge, Button, Panel, cx } from "../components/ui/primitives";
import { api, type IpcResult } from "../lib/ipc";
import { useIpc } from "../lib/useAsync";
import { listThemes } from "../theme/registry";
import { useThemeStore } from "../theme/store";
import { BackendNotice } from "./BackendNotice";
import { PageHeader } from "./PageHeader";

export function SettingsScreen() {
  const { theme, setTheme, userIntensity, setUserIntensity } = useThemeStore();
  const [info] = useIpc(api.appInfo);
  const [db, reloadDb] = useIpc(api.dbStatus);
  const [backup, setBackup] = useState<IpcResult<string> | "running" | null>(null);

  const appInfo = info.status === "done" && info.result.ok ? info.result.value : null;
  const dbStatus = db.status === "done" && db.result.ok ? db.result.value : null;
  const backendError = info.status === "done" && !info.result.ok ? info.result.error : null;

  return (
    <>
      <PageHeader eyebrow="Preferences" title="Settings" subtitle="Everything is stored locally in SONORA's database on this device." />
      {backendError && <div className="mb-6 max-w-3xl"><BackendNotice error={backendError} /></div>}

      <div className="max-w-3xl space-y-6">
        <Section title="Appearance">
          <Row label="Theme" hint="More themes in the Theme Gallery.">
            <div className="flex rounded-full bg-surface-hover p-1 ring-1 ring-border">
              {listThemes().map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={cx(
                    "h-8 rounded-full px-4 text-xs font-semibold transition-colors",
                    theme.id === t.id ? "bg-fg text-bg" : "text-fg-muted hover:text-fg",
                  )}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </Row>
          <Row label="Animation intensity">
            <input type="range" min={0} max={1} step={0.05} value={userIntensity} onChange={(e) => setUserIntensity(Number(e.target.value))} className="w-48 accent-[var(--accent)]" aria-label="Animation intensity" />
          </Row>
        </Section>

        <Section title="Privacy & data">
          <Row label="Database backup" hint="Writes a verified copy of your library database to the backups folder.">
            <Button
              icon="database"
              disabled={!dbStatus || backup === "running"}
              onClick={async () => {
                setBackup("running");
                setBackup(await api.backupDatabase());
                reloadDb();
              }}
            >
              {backup === "running" ? "Backing up…" : "Back up now"}
            </Button>
          </Row>
          {backup && backup !== "running" && (
            <p className={cx("-mt-2 break-all pb-3 text-xs", backup.ok ? "text-emerald-500" : "text-red-400")} data-selectable>
              {backup.ok ? `Saved to ${backup.value}` : `${backup.error.code}: ${backup.error.message}`}
            </p>
          )}
          <Row label="Telemetry" hint="SONORA sends no usage data anywhere.">
            <Badge tone="ok">Off — always</Badge>
          </Row>
        </Section>

        <Section title="About">
          <Info label="Version" value={appInfo ? `${appInfo.name} ${appInfo.version}` : "—"} />
          <Info label="Platform" value={appInfo ? `${appInfo.os} · ${appInfo.arch}` : "—"} />
          <Info label="Data folder" value={appInfo?.dataDir ?? "—"} />
          <Info label="Database schema" value={dbStatus ? `v${dbStatus.schemaVersion} (latest v${dbStatus.latestSchemaVersion})` : "—"} />
        </Section>

        <Section title="Coming later">
          {[
            ["Audio", "Output device, EQ preset, crossfade, normalisation, buffer", 5],
            ["Library", "Folders, automatic scanning, duplicates, metadata, artwork cache", 2],
            ["Devices", "USB detection, export format, folder structure, verification", 7],
            ["Integrations", "Spotify connection, providers and permissions", 3],
          ].map(([name, desc, phase]) => (
            <Row key={name as string} label={name as string} hint={desc as string}>
              <Badge>Phase {phase}</Badge>
            </Row>
          ))}
        </Section>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Panel className="p-0">
      <h2 className="border-b border-border px-6 py-4 text-[13px] font-bold uppercase tracking-[0.12em] text-fg-subtle">{title}</h2>
      <div className="divide-y divide-border px-6">{children}</div>
    </Panel>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div>
        <div className="text-sm font-semibold text-fg">{label}</div>
        {hint && <div className="mt-0.5 text-xs text-fg-muted">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-6 py-3 text-sm">
      <span className="text-fg-muted">{label}</span>
      <span className="truncate font-mono text-xs text-fg" data-selectable>{value}</span>
    </div>
  );
}
