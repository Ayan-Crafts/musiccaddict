import { Icon } from "../components/ui/Icon";
import { IconButton } from "../components/ui/primitives";
import { useThemeStore } from "../theme/store";
import { useRouter } from "./router";

export function TopBar() {
  const { back, forward, goBack, goForward } = useRouter();
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 px-8">
      <IconButton icon="chevronLeft" label="Back" onClick={goBack} disabled={back.length === 0} />
      <IconButton icon="chevronRight" label="Forward" onClick={goForward} disabled={forward.length === 0} />

      <label className="ml-2 flex h-10 w-full max-w-md items-center gap-2.5 rounded-full bg-surface px-4 text-fg-subtle ring-1 ring-border">
        <Icon name="search" size={16} />
        <input
          type="search"
          disabled
          placeholder="Search arrives with library indexing (Phase 2)"
          className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle disabled:cursor-not-allowed"
        />
      </label>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTheme(theme.scheme === "dark" ? "light" : "dark")}
          className="h-9 rounded-full px-3.5 text-xs font-semibold text-fg-muted ring-1 ring-border transition-colors hover:bg-surface-hover hover:text-fg"
          title="Toggle base theme"
        >
          {theme.scheme === "dark" ? "Light mode" : "Dark mode"}
        </button>
      </div>
    </header>
  );
}
