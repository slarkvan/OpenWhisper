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
});
