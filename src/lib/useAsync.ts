import { useCallback, useEffect, useState } from "react";
import type { IpcResult } from "./ipc";

export type AsyncState<T> =
  | { status: "loading" }
  | { status: "done"; result: IpcResult<T> };

export function useIpc<T>(fn: () => Promise<IpcResult<T>>): [AsyncState<T>, () => void] {
  const [state, setState] = useState<AsyncState<T>>({ status: "loading" });
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;
    setState({ status: "loading" });
    fn().then((result) => alive && setState({ status: "done", result }));
    return () => {
      alive = false;
    };
  }, [tick]);

  return [state, reload];
}
