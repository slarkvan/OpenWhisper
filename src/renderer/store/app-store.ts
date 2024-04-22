import { create } from "zustand";

interface AppStore {
  App: null | AppType;

  setApp: (app: AppType) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  App: null,
  setApp: (app) => set({ App: app }),
}));
