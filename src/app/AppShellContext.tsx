import { createContext, useContext } from "react";

interface AppShellContextValue {
  classificationRevision: number;
  notifyClassificationChanged: () => void;
  openSettings: () => void;
}

const AppShellContext = createContext<AppShellContextValue>({
  classificationRevision: 0,
  notifyClassificationChanged: () => undefined,
  openSettings: () => undefined,
});

export const AppShellProvider = AppShellContext.Provider;

export function useAppShell(): AppShellContextValue {
  return useContext(AppShellContext);
}
