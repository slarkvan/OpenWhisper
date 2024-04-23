type AppType = {
  whisper: {
    describe: () => void;
    config: () => Promise<WhisperConfigType>;
    check: () => Promise<{ success: boolean; log: string }>;
    setModel: (model: string) => Promise<WhisperConfigType>;
    setService: (
      service: WhisperConfigType["service"]
    ) => Promise<WhisperConfigType>;
    transcribe: (
      params: {
        file?: string;
        blob?: { type: string; arrayBuffer: ArrayBuffer };
      },
      options?: {
        force?: boolean;
        extra?: string[];
      }
    ) => Promise<Partial<WhisperOutputType>>;
    onProgress: (callback: (event, progress: number) => void) => void;
    removeProgressListeners: () => Promise<void>;
  };
  video: {
    create: ({
      uri,
    }: {
      uri: string;
    }) => Promise<{
      filePath: string;
    }>;
  };
  dialog: {
    showOpenDialog: (
      options: Electron.OpenDialogOptions
    ) => Promise<string[] | undefined>;
    showSaveDialog: (
      options: Electron.SaveDialogOptions
    ) => Promise<string | undefined>;
    showMessageBox: (
      options: Electron.MessageBoxOptions
    ) => Promise<Electron.MessageBoxReturnValue>;
    showErrorBox: (title: string, content: string) => Promise<void>;
  };
};
