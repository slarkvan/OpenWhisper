import { BrowserWindow } from "electron";
import path from "path";
import url from "url";
import whisper from "./whisper";

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
