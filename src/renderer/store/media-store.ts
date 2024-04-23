import { create } from "zustand";

interface MediaStore {
  mediaUri: null | string;
  mediaFilePath: null | string;

  setMediaUri: (uri: string) => void;
  setMediaFilePath: (filePath: string) => void;
}

export const useMediaStore = create<MediaStore>((set) => ({
  mediaUri: null,
  mediaFilePath: null,
  setMediaUri: (uri) => set({ mediaUri: uri }),
  setMediaFilePath: (filePath) => set({ mediaFilePath: filePath }),
}));
