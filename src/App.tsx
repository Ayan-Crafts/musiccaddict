import { MotionConfig } from "motion/react";
import { useEffect } from "react";
import { AppShell } from "./app/AppShell";
import { useThemeStore } from "./theme/store";

export default function App() {
  const init = useThemeStore((s) => s.init);
  const ready = useThemeStore((s) => s.ready);

  useEffect(() => {
    void init();
  }, [init]);

  if (!ready) return null;

  return (
    <MotionConfig reducedMotion="user">
      <AppShell />
    </MotionConfig>
  );
}
