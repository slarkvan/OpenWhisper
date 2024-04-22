// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from "electron";
// import { version } from "../package.json";

// LOG: preload scripts
contextBridge.exposeInMainWorld("__APP__", {
  whisper: {
    describe: () => {
      ipcRenderer.invoke("whisper/describe");
    },
  },
  dialog: {
    showOpenDialog: (options: Electron.OpenDialogOptions) =>
      ipcRenderer.invoke("dialog-show-open-dialog", options),
    showSaveDialog: (options: Electron.SaveDialogOptions) =>
      ipcRenderer.invoke("dialog-show-save-dialog", options),
    showMessageBox: (options: Electron.MessageBoxOptions) =>
      ipcRenderer.invoke("dialog-show-message-box", options),
    showErrorBox: (title: string, content: string) =>
      ipcRenderer.invoke("dialog-show-error-box", title, content),
  },
});
