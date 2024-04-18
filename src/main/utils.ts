import path from "path";
import settings from "./settings";

export function openWhisperUrlToPath(openWhisperUr: string): string {
  let filePath = openWhisperUr;

  if (openWhisperUr.match(/openwhisper:\/\/library\/(audios|videos)/g)) {
    filePath = path.posix.join(
      settings.userDataPath(),
      openWhisperUr.replace("openwhisper://library/", "")
    );
  } else if (openWhisperUr.startsWith("openWhisperUr://library/")) {
    filePath = path.posix.join(
      settings.libraryPath(),
      filePath.replace("openWhisperUr://library/", "")
    );
  }

  return filePath;
}
