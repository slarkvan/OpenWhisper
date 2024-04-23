import { IpcMainInvokeEvent, ipcMain } from "electron";
import fs from "fs-extra";
import path from "path";
import { v5 as uuidv5 } from "uuid";
import log from "@main/logger";
import { hashFile, pathToOpenWhisperUrl } from "./utils";
import settings from "./settings";

const logger = log.scope("video");

interface IVideoHandler {
  copy: () => void;
  register: () => void;
}

class VideoHandler implements IVideoHandler {
  copy: () => void;

  static async buildFromLocalFile(filePath: string): Promise<string> {
    logger.debug("buildFromLocalFile params:", filePath);
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
    } catch (error) {
      throw new Error(`video/file-not-found, filePath: ${filePath}`);
    }

    const extname = path.extname(filePath);
    const stats = fs.statSync(filePath);
    console.log("stats.size", stats.size);

    const md5 = await hashFile(filePath, { algo: "md5" });
    const id = uuidv5(`${md5}`, uuidv5.URL);
    logger.debug("Generated ID:", id);

    const destDir = path.join(settings.userDataPath(), "videos");
    const destFile = path.join(destDir, `${md5}${extname}`);

    try {
      fs.ensureDirSync(destDir);
      fs.copySync(filePath, destFile);

      fs.accessSync(destFile, fs.constants.R_OK);
    } catch (error) {
      throw new Error(`failed to copy video file, filePath: ${filePath}`);
    }
    // /Users/txx/Documents/OpenWhisperLibrary/slark/videos/580de651952ff2dd26c88a1ccd1478b3.mp4
    logger.debug("Copied video file to:", destFile);
    return destFile;
  }

  private async create(_event: IpcMainInvokeEvent, params: { uri: string }) {
    console.log("create params:", params);
    const { uri } = params;
    const filePath = await VideoHandler.buildFromLocalFile(uri);
    return { filePath: pathToOpenWhisperUrl(filePath) };
  }

  register() {
    ipcMain.handle("video/create", this.create);
  }
}

export const videoHandler = new VideoHandler();
