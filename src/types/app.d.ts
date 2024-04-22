type AppType = {
  whisper: {
    describe: () => void;
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
