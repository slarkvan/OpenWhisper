import { BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import url from "url";
import whisper from "./whisper";
import { videoHandler } from "./video";
import ffmpeg from "./ffmpeg";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const main = {
  win: null as BrowserWindow | null,
  init: () => {},
};

main.init = () => {
  if (main.win) {
    main.win.show();
    return;
  }

  whisper.registerIpcHandlers();
  videoHandler.register();
  ffmpeg.registerIpcHandlers();

  // Dialog
  ipcMain.handle("dialog-show-open-dialog", (event, options) => {
    return dialog.showOpenDialogSync(
      BrowserWindow.fromWebContents(event.sender),
      options
    );
  });

  ipcMain.handle("dialog-show-save-dialog", (event, options) => {
    return dialog.showSaveDialogSync(
      BrowserWindow.fromWebContents(event.sender),
      options
    );
  });

  ipcMain.handle("dialog-show-message-box", (event, options) => {
    return dialog.showMessageBoxSync(
      BrowserWindow.fromWebContents(event.sender),
      options
    );
  });

  ipcMain.handle("dialog-show-error-box", (_event, title, content) => {
    return dialog.showErrorBox(title, content);
  });

  const createWindow = () => {
    const mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        spellcheck: false,
        preload: path.join(__dirname, "preload.js"),
      },
    });

    // and load the index.html of the app.
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
      mainWindow.loadFile(
        path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
      );
    }
    whisper.initialize();
    // Open the DevTools.
    mainWindow.webContents.openDevTools();

    return mainWindow;
  };

  main.win = createWindow();
};

export default main;
