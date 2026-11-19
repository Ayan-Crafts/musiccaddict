import type { ReactNode } from "react";
import { useRouter } from "../app/router";
import { Badge, Button, EmptyState, Panel, SectionTitle } from "../components/ui/primitives";
import { formatCount, greeting } from "../lib/format";
import { api, type DbStatus } from "../lib/ipc";
import { useIpc } from "../lib/useAsync";
import { BackendNotice } from "./BackendNotice";

export function HomeScreen() {
  const navigate = useRouter((s) => s.navigate);
  const [status] = useIpc(api.dbStatus);
  const db: DbStatus | null = status.status === "done" && status.result.ok ? status.result.value : null;
  const error = status.status === "done" && !status.result.ok ? status.result.error : null;
  const empty = db !== null && db.audioFileCount === 0;

  return (
    <div className="space-y-10 pt-4">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[var(--radius-lg)] bg-surface p-10 ring-1 ring-border shadow-[var(--shadow-panel)]">
        <div className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-accent opacity-20 blur-[100px]" />
        <div className="relative">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">{greeting()}</div>
          <h1 className="mt-3 max-w-2xl font-display text-[44px] font-extrabold leading-[1.02] tracking-[-0.03em] text-fg">
            Your music. Your library.
            <br />
            <span className="text-fg-muted">Your experience.</span>
          </h1>

          <dl className="mt-8 grid max-w-2xl grid-cols-4 gap-6">
            <Stat label="Tracks" value={db?.trackCount} />
            <Stat label="Audio files" value={db?.audioFileCount} />
            <Stat label="Playlists" value={db?.playlistCount} />
            <Stat label="Folders" value={db?.libraryFolderCount} />
          </dl>
          {error && (
            <div className="mt-6 max-w-2xl">
              <BackendNotice error={error} />
            </div>
          )}
        </div>
      </section>

      {/* Getting started */}
      {(empty || error) && (
        <section>
          <SectionTitle eyebrow="Start here" title="Build your library" />
          <div className="grid grid-cols-3 gap-4">
            <Step n={1} title="Pick your look" body="Dark or Light today; the cinematic and gaming themes follow." phase={1}
              action={<Button variant="secondary" onClick={() => navigate("themes")}>Open Theme Gallery</Button>} />
            <Step n={2} title="Add your music folders" body="SONORA indexes files you own, in the background, without touching them." phase={2} />
            <Step n={3} title="Connect Spotify (optional)" body="Import playlists as metadata and match them to your local files." phase={3} />
          </div>
        </section>
      )}

      <section className="grid grid-cols-2 gap-6">
        <div>
          <SectionTitle eyebrow="Listen" title="Recently played" />
          <EmptyState icon="nowPlaying" title="No listening history yet" body="Tracks you play will appear here. History stays on this device." />
        </div>
        <div>
          <SectionTitle eyebrow="Library" title="Recently added" />
          <EmptyState icon="folderPlus" title="Nothing added yet" body="Once a music folder is scanned, new arrivals show up here." />
        </div>
      </section>

      <section>
        <SectionTitle eyebrow="Device Studio" title="Connected devices" action={<Badge>Phase 7</Badge>} />
        <EmptyState icon="usb" title="USB and Walkman management is coming" body="Detected drives and players will appear here for quick sync and export." />
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-subtle">{label}</dt>
      <dd className="tabular mt-1 font-display text-3xl font-bold tracking-tight text-fg">{value === undefined ? "—" : formatCount(value)}</dd>
    </div>
  );
}

function Step({ n, title, body, phase, done, action }: { n: number; title: string; body: string; phase: number; done?: boolean; action?: ReactNode }) {
  return (
    <Panel className="flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-soft font-mono text-sm font-bold text-accent">{n}</span>
        {done ? <Badge tone="ok">Done</Badge> : phase > 1 ? <Badge>Phase {phase}</Badge> : null}
      </div>
      <div>
        <div className="font-semibold text-fg">{title}</div>
        <p className="mt-1 text-sm text-fg-muted">{body}</p>
      </div>
      {action && <div className="mt-auto pt-1">{action}</div>}
    </Panel>
  );
}
