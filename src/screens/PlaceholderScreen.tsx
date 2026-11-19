import type { RouteMeta } from "../app/routes";
import { Icon } from "../components/ui/Icon";
import { Badge, Panel } from "../components/ui/primitives";
import { PageHeader } from "./PageHeader";

/**
 * Honest placeholder for a screen whose functionality lands in a later phase.
 * It describes what will exist; it never shows invented data.
 */
export function PlaceholderScreen({ route }: { route: RouteMeta }) {
  return (
    <>
      <PageHeader eyebrow={route.group} title={route.label} subtitle={route.summary} aside={<Badge tone="accent">Phase {route.phase}</Badge>} />
      <Panel className="max-w-3xl">
        <div className="flex items-start gap-5">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent">
            <Icon name={route.icon} size={22} />
          </div>
          <div>
            <h2 className="font-semibold text-fg">Not built yet</h2>
            <p className="mt-1 text-sm text-fg-muted">
              This screen becomes functional in Phase {route.phase} of the roadmap. It will include:
            </p>
            {route.plan && (
              <ul className="mt-4 space-y-2.5">
                {route.plan.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-fg">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Panel>
    </>
  );
}
