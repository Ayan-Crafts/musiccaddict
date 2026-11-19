import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

type ButtonVariant = "primary" | "secondary" | "ghost";

export function Button({
  variant = "secondary",
  icon,
  children,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; icon?: IconName }) {
  return (
    <button
      type="button"
      className={cx(
        "inline-flex h-9 items-center gap-2 rounded-full px-4 text-[13px] font-semibold tracking-tight transition-[background,color,box-shadow,transform] duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40",
        variant === "primary" && "bg-accent text-accent-fg shadow-[0_8px_24px_-8px_var(--glow)] hover:brightness-110",
        variant === "secondary" && "bg-surface text-fg ring-1 ring-border hover:bg-surface-hover",
        variant === "ghost" && "text-fg-muted hover:bg-surface-hover hover:text-fg",
        className,
      )}
      {...rest}
    >
      {icon && <Icon name={icon} size={16} />}
      {children}
    </button>
  );
}

export function IconButton({
  icon,
  label,
  size = 18,
  active,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: IconName; label: string; size?: number; active?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={rest.title ?? label}
      className={cx(
        "grid h-9 w-9 place-items-center rounded-full transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-35",
        active ? "text-accent" : "text-fg-muted enabled:hover:bg-surface-hover enabled:hover:text-fg",
        className,
      )}
      {...rest}
    >
      <Icon name={icon} size={size} />
    </button>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cx("rounded-[var(--radius-lg)] bg-surface p-6 ring-1 ring-border shadow-[var(--shadow-panel)]", className)}>
      {children}
    </section>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" | "ok" | "warn" }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em]",
        tone === "neutral" && "bg-surface-hover text-fg-muted",
        tone === "accent" && "bg-accent-soft text-accent",
        tone === "ok" && "bg-emerald-500/12 text-emerald-500",
        tone === "warn" && "bg-amber-500/12 text-amber-500",
      )}
    >
      {children}
    </span>
  );
}

export function SectionTitle({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-subtle">{eyebrow}</div>}
        <h2 className="font-display text-lg font-bold tracking-tight text-fg">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: IconName; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-[var(--radius-md)] border border-dashed border-border-strong p-6">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent">
        <Icon name={icon} size={18} />
      </div>
      <div>
        <div className="font-semibold text-fg">{title}</div>
        <p className="mt-1 max-w-prose text-sm text-fg-muted">{body}</p>
      </div>
      {action}
    </div>
  );
}
