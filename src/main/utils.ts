import path from "path";
import settings from "./settings";

import { createHash } from "crypto";
import { createReadStream } from "fs";

export function hashFile(
  path: string,
  options: { algo: string }
): Promise<string> {
  const algo = options.algo || "md5";
  return new Promise((resolve, reject) => {
    const hash = createHash(algo);
    const stream = createReadStream(path);
    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

export function hashBlob(
  blob: Blob,
  options: { algo: string }
): Promise<string> {
  const algo = options.algo || "md5";
  return new Promise((resolve, reject) => {
    const hash = createHash(algo);
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        const buffer = Buffer.from(reader.result);
        hash.update(buffer);
        resolve(hash.digest("hex"));
      } else {
        reject(new Error("Unexpected result from FileReader"));
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
}

export function openWhisperUrlToPath(openWhisperUr: string): string {
  let filePath = openWhisperUr;

  if (openWhisperUr.match(/openwhisper:\/\/library\/(audios|videos)/g)) {
    filePath = path.posix.join(
      settings.userDataPath(),
      openWhisperUr.replace("openwhisper://library/", "")
    );
  } else if (openWhisperUr.startsWith("openwhisper://library/")) {
    filePath = path.posix.join(
      settings.libraryPath(),
      filePath.replace("openwhisper://library/", "")
    );
  }

  return filePath;
}

export function pathToOpenWhisperUrl(filePath: string): string {
  let enjoyUrl = filePath;

  if (filePath.startsWith(settings.userDataPath())) {
    enjoyUrl = `openwhisper://library/${filePath.replace(
      settings.userDataPath(),
      ""
    )}`;
  } else if (filePath.startsWith(settings.libraryPath())) {
    enjoyUrl = `openwhisper://library/${filePath.replace(
      settings.libraryPath(),
      ""
    )}`;
  }

  return enjoyUrl;
}
