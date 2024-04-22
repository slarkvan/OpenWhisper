import { useEffect } from "react";
import { useAppStore } from "@/renderer/store/app-store";

export const AppContainer = ({ children }: { children: React.ReactNode }) => {
  const { App, setApp } = useAppStore();

  useEffect(() => {
    if (App) return;
    setApp(window.__APP__);
  }, [App]);

  return <div id="app-container">{children}</div>;
};
