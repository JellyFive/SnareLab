import { createContext, useContext } from "react";

interface AppShellContextValue {
  openSettings: () => void;
}

const AppShellContext = createContext<AppShellContextValue>({
  openSettings: () => undefined,
});

export const AppShellProvider = AppShellContext.Provider;

export function useAppShell(): AppShellContextValue {
  return useContext(AppShellContext);
}
