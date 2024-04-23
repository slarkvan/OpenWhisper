import { app, BrowserWindow, protocol, net } from "electron";
import ElectronSquirrelStartup from "electron-squirrel-startup";
import path from "path";
import mainWindow from "@main/window";
import url from "url";
import settings from "./main/settings";

const __filename = url.fileURLToPath(import.meta.url);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (ElectronSquirrelStartup) {
  app.quit();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  protocol.handle("openwhisper", (request) => {
    let url = request.url.replace("openwhisper://", "");
    console.log("request url:", request.url, url);
    if (url.match(/library\/(audios|videos|recordings|speeches)/g)) {
      url = url.replace("library/", "");
      url = path.join(settings.userDataPath(), url);
    } else if (url.startsWith("library")) {
      url = url.replace("library/", "");
      url = path.join(settings.libraryPath(), url);
    }
    console.log("2 request url:", url);
    return net.fetch(`file:///${url}`);
  });

  mainWindow.init();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow.init();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
protocol.registerSchemesAsPrivileged([
  {
    scheme: "openwhisper",
    privileges: {
      standard: true,
      secure: true,
      bypassCSP: true,
      allowServiceWorkers: true,
      supportFetchAPI: true,
      stream: true,
      codeCache: true,
      corsEnabled: true,
    },
  },
]);
