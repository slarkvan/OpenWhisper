// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { IpcRendererEvent, contextBridge, ipcRenderer } from "electron";
// import { version } from "../package.json";

// LOG: preload scripts
contextBridge.exposeInMainWorld("__APP__", {
  video: {
    create: ({ uri }: { uri: string }) => {
      return ipcRenderer.invoke("video/create", { uri });
    },
  },
  whisper: {
    describe: () => {
      return ipcRenderer.invoke("whisper/describe");
    },
    config: () => {
      return ipcRenderer.invoke("whisper-config");
    },
    setModel: (model: string) => {
      return ipcRenderer.invoke("whisper-set-model", model);
    },
    setService: (service: string) => {
      return ipcRenderer.invoke("whisper-set-service", service);
    },
    check: () => {
      return ipcRenderer.invoke("whisper-check");
    },
    transcribe: (
      params: {
        file?: string;
        blob?: {
          type: string;
          arrayBuffer: ArrayBuffer;
        };
      },
      options?: {
        force?: boolean;
        extra?: string[];
      }
    ) => {
      return ipcRenderer.invoke("whisper-transcribe", params, options);
    },
    onProgress: (
      callback: (event: IpcRendererEvent, progress: number) => void
    ) => ipcRenderer.on("whisper-on-progress", callback),
    removeProgressListeners: () => {
      ipcRenderer.removeAllListeners("whisper-on-progress");
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
  ffmpeg: {
    check: () => {
      return ipcRenderer.invoke("ffmpeg-check-command");
    },
    transcode: (input: string, output: string, options: string[]) => {
      return ipcRenderer.invoke("ffmpeg-transcode", input, output, options);
    },
  },
});
