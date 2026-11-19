import { AnimatePresence, motion } from "motion/react";
import { PlayerBar } from "../player/PlayerBar";
import { flowTransition, flowVariants } from "../theme/motion";
import { useThemeStore } from "../theme/store";
import { useRouter } from "./router";
import { SCREENS } from "./screens";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

/**
 * Layout: [nav | routed screen] above a persistent PlayerBar.
 * The player is a sibling of the routed area, never a child, so it survives
 * every navigation and theme change.
 */
export function AppShell() {
  const { current, direction } = useRouter();
  const { theme, userIntensity } = useThemeStore();
  const Screen = SCREENS[current];
  const variants = flowVariants(theme.motion, userIntensity);
  const transition = flowTransition(theme.motion, userIntensity);

  return (
    <div className="flex h-full flex-col" style={{ backgroundImage: "var(--backdrop)" }}>
      <div className={theme.layout.nav === "right" ? "flex min-h-0 flex-1 flex-row-reverse" : "flex min-h-0 flex-1"}>
        <Sidebar />
        <main className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div
                key={current}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
                className="absolute inset-0 overflow-y-auto px-8 pb-10"
              >
                <Screen />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
      <PlayerBar />
    </div>
  );
}
