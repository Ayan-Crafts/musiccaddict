import { beforeEach, describe, expect, it } from "vitest";
import { useRouter } from "./router";
import { ROUTES } from "./routes";

const reset = () => useRouter.setState({ current: "home", back: [], forward: [], direction: 1 });

describe("router", () => {
  beforeEach(reset);

  it("navigates with history and direction", () => {
    const r = useRouter.getState();
    r.navigate("songs");
    r.navigate("albums");
    expect(useRouter.getState()).toMatchObject({ current: "albums", back: ["home", "songs"], direction: 1 });

    useRouter.getState().goBack();
    expect(useRouter.getState()).toMatchObject({ current: "songs", forward: ["albums"], direction: -1 });

    useRouter.getState().goForward();
    expect(useRouter.getState()).toMatchObject({ current: "albums", forward: [], direction: 1 });
  });

  it("ignores navigation to the current route and empty history", () => {
    useRouter.getState().navigate("home");
    useRouter.getState().goBack();
    useRouter.getState().goForward();
    expect(useRouter.getState()).toMatchObject({ current: "home", back: [], forward: [] });
  });

  it("new navigation clears forward history", () => {
    const r = useRouter.getState();
    r.navigate("songs");
    useRouter.getState().goBack();
    useRouter.getState().navigate("settings");
    expect(useRouter.getState().forward).toEqual([]);
  });

  it("route ids are unique and cover all 17 navigable screens", () => {
    const ids = ROUTES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(17);
  });
});
