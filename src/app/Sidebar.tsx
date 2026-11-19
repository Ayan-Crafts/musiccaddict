import { motion } from "motion/react";
import { Icon } from "../components/ui/Icon";
import { cx } from "../components/ui/primitives";
import { useRouter } from "./router";
import { ROUTE_GROUPS, ROUTES } from "./routes";

export function Sidebar() {
  const current = useRouter((s) => s.current);
  const navigate = useRouter((s) => s.navigate);

  return (
    <nav className="flex h-full w-[232px] shrink-0 flex-col gap-1 overflow-y-auto px-3 pb-4 pt-5" aria-label="Main">
      <div className="mb-5 flex items-center gap-2.5 px-3">
        <Wordmark />
      </div>

      {ROUTE_GROUPS.map((group) => (
        <div key={group} className="mb-3">
          <div className="px-3 pb-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-fg-subtle">{group}</div>
          <ul className="flex flex-col gap-0.5">
            {ROUTES.filter((r) => r.group === group).map((r) => {
              const active = r.id === current;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => navigate(r.id)}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "relative flex h-9 w-full items-center gap-3 rounded-[10px] px-3 text-[13.5px] font-medium transition-colors",
                      active ? "text-fg" : "text-fg-muted hover:text-fg",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-[10px] bg-surface-hover ring-1 ring-border"
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      />
                    )}
                    <Icon name={r.icon} size={17} className={cx("relative", active && "text-accent")} />
                    <span className="relative truncate">{r.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Wordmark() {
  return (
    <>
      <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="4" fill="var(--accent)" />
        <path d="M8.5 16a7.5 7.5 0 0 1 15 0" fill="none" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" opacity="0.75" />
        <path d="M3.5 16a12.5 12.5 0 0 1 25 0" fill="none" stroke="var(--fg)" strokeWidth="2.4" strokeLinecap="round" opacity="0.35" />
      </svg>
      <span className="font-display text-[17px] font-extrabold tracking-[0.22em] text-fg">SONORA</span>
    </>
  );
}
