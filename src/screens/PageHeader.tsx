import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, subtitle, aside }: { eyebrow?: string; title: string; subtitle?: string; aside?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-6 pt-4">
      <div>
        {eyebrow && <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">{eyebrow}</div>}
        <h1 className="font-display text-[34px] font-extrabold leading-none tracking-[-0.02em] text-fg">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-[15px] text-fg-muted">{subtitle}</p>}
      </div>
      {aside}
    </div>
  );
}
