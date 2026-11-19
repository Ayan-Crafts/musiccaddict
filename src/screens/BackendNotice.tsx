import type { IpcError } from "../lib/ipc";

export function BackendNotice({ error }: { error: IpcError }) {
  const noBackend = error.code === "NO_BACKEND";
  return (
    <div className="rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-500/8 px-4 py-3 text-sm text-fg">
      <span className="font-semibold">{noBackend ? "Desktop backend not connected." : "Backend error."}</span>{" "}
      <span className="text-fg-muted">
        {noBackend ? (
          <>
            You're viewing the UI in a browser. Run <code className="font-mono text-xs">npm run tauri dev</code> for the full app.
          </>
        ) : (
          `${error.code}: ${error.message}`
        )}
      </span>
    </div>
  );
}
