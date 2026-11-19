import type { ComponentType } from "react";
import { HomeScreen } from "../screens/HomeScreen";
import { PlaceholderScreen } from "../screens/PlaceholderScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { ThemeGalleryScreen } from "../screens/ThemeGalleryScreen";
import { ROUTES, type RouteId } from "./routes";

const IMPLEMENTED: Partial<Record<RouteId, ComponentType>> = {
  home: HomeScreen,
  themes: ThemeGalleryScreen,
  settings: SettingsScreen,
};

export const SCREENS = Object.fromEntries(
  ROUTES.map((r) => [r.id, IMPLEMENTED[r.id] ?? (() => <PlaceholderScreen route={r} />)]),
) as Record<RouteId, ComponentType>;
