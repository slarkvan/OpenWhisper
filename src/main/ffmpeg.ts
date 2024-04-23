import { ipcMain } from "electron";
import ffmpegPath from "ffmpeg-static";
import ffprobePath from "@andrkrn/ffprobe-static";
import Ffmpeg from "fluent-ffmpeg";
import log from "@main/logger";
import path from "path";
import fs from "fs-extra";
import settings from "@main/settings";
import url from "url";
import { FFMPEG_CONVERT_WAV_OPTIONS } from "@/constants";
import { openWhisperUrlToPath, pathToOpenWhisperUrl } from "@main/utils";

/*
 * ffmpeg and ffprobe bin file will be in /app.asar.unpacked instead of /app.asar
 * the /samples folder is also in /app.asar.unpacked
 */
Ffmpeg.setFfmpegPath(ffmpegPath.replace("app.asar", "app.asar.unpacked"));
Ffmpeg.setFfprobePath(ffprobePath.replace("app.asar", "app.asar.unpacked"));
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path
  .dirname(__filename)
  .replace("app.asar", "app.asar.unpacked");

const logger = log.scope("ffmpeg");

class FfmpegWrapper {
  checkCommand(): Promise<boolean> {
    const ffmpeg = Ffmpeg();
    const sampleFile = path.join(__dirname, "samples", "jfk.wav");
    return new Promise((resolve, _reject) => {
      ffmpeg.input(sampleFile).getAvailableFormats((err, _formats) => {
        if (err) {
          logger.error("Command not valid:", err);
          resolve(false);
        } else {
          logger.info("Command valid, available formats");
          resolve(true);
        }
      });
    });
  }

  generateMetadata(input: string): Promise<Ffmpeg.FfprobeData> {
    const ffmpeg = Ffmpeg();
    return new Promise((resolve, reject) => {
      ffmpeg
        .input(input)
        .on("start", (commandLine) => {
          logger.info("Spawned FFmpeg with command: " + commandLine);
        })
        .on("error", (err) => {
          logger.error(err);
          reject(err);
        })
        .ffprobe((err, metadata) => {
          if (err) {
            logger.error(err);
            reject(err);
          }

          resolve(metadata);
        });
    });
  }

  generateCover(input: string, output: string): Promise<string> {
    const ffmpeg = Ffmpeg();
    return new Promise((resolve, reject) => {
      ffmpeg
        .input(input)
        .thumbnail({
          count: 1,
          filename: path.basename(output),
          folder: path.dirname(output),
        })
        .on("start", (commandLine) => {
          logger.info("Spawned FFmpeg with command: " + commandLine);
          fs.ensureDirSync(path.dirname(output));
        })
        .on("end", () => {
          logger.info(`File ${output} created`);
          resolve(output);
        })
        .on("error", (err) => {
          logger.error(err);
          reject(err);
        });
    });
  }

  ensureSampleRate(
    input: string,
    output: string,
    sampleRate = 16000
  ): Promise<string> {
    logger.info(`Trying to convert ${input} to 16-bit file ${output}`);
    if (fs.pathExistsSync(output)) {
      logger.warn(`File ${output} already exists, deleting.`);
      fs.removeSync(output);
    }

    const ffmpeg = Ffmpeg();
    return new Promise((resolve, reject) => {
      ffmpeg
        .input(input)
        .outputOptions("-ar", `${sampleRate}`)
        .on("error", (err) => {
          logger.error(err);
          reject(err);
        })
        .on("end", () => {
          logger.info(`File ${output} created`);
          resolve(output);
        })
        .save(output);
    });
  }

  convertToWav(
    input: string,
    output: string,
    options: string[] = []
  ): Promise<string> {
    const ffmpeg = Ffmpeg();
    return new Promise((resolve, reject) => {
      ffmpeg
        .input(input)
        .outputOptions(
          "-ar",
          "16000",
          "-ac",
          "1",
          "-c:a",
          "pcm_s16le",
          ...options
        )
        .on("start", (commandLine) => {
          logger.debug(`Trying to convert ${input} to ${output}`);
          logger.info("Spawned FFmpeg with command: " + commandLine);
          fs.ensureDirSync(path.dirname(output));
        })
        .on("end", (stdout, stderr) => {
          if (stdout) {
            logger.debug(stdout);
          }

          if (stderr) {
            logger.info(stderr);
          }

          if (fs.existsSync(output)) {
            resolve(output);
          } else {
            reject(new Error("FFmpeg command failed"));
          }
        })
        .on("error", (err: Error) => {
          logger.error(err);
          reject(err);
        })
        .save(output);
    });
  }

  async prepareForWhisper(input: string, output: string): Promise<string> {
    const metadata = await this.generateMetadata(input);

    if (metadata.format.format_name === "wav") {
      if (metadata.streams[0].sample_rate === 16000) {
        logger.info(`File ${input} already in 16-bit WAVE format`);
        return input;
      } else {
        return this.ensureSampleRate(
          input,
          input.replace(path.extname(input), "_16bit.wav")
        );
      }
    }

    logger.info(`Trying to convert ${input} to 16-bit WAVE file ${output}`);
    if (fs.pathExistsSync(output)) {
      logger.warn(`File ${output} already exists, deleting.`);
      fs.removeSync(output);
    }

    return this.convertToWav(input, output);
  }

  // LOG: transcode by ffmpeg
  async transcode(
    input: string,
    output?: string,
    options?: string[]
  ): Promise<string> {
    // input = openWhisperUrlToPath(input);
    logger.debug(`input:${input}, output:${output}`);
    if (!output) {
      output = path.join(settings.cachePath(), `${path.basename(input)}.wav`);
    } else {
      output = openWhisperUrlToPath(output);
    }
    logger.debug(`input:${input}, output:${output}`);

    options = options || FFMPEG_CONVERT_WAV_OPTIONS;

    const ffmpeg = Ffmpeg();
    return new Promise((resolve, reject) => {
      ffmpeg
        .input(input)
        .outputOptions(...options)
        .on("start", (commandLine) => {
          logger.debug(`Trying to convert ${input} to ${output}`);
          logger.info("Spawned FFmpeg with command: " + commandLine);
          fs.ensureDirSync(path.dirname(output));
        })
        .on("end", (stdout, stderr) => {
          if (stdout) {
            logger.debug(stdout);
          }

          if (stderr) {
            logger.info(stderr);
          }

          if (fs.existsSync(output)) {
            resolve(pathToOpenWhisperUrl(output));
          } else {
            reject(new Error("FFmpeg command failed"));
          }
        })
        .on("error", (err: Error) => {
          logger.error(err);
          reject(err);
        })
        .save(output);
    });
  }

  registerIpcHandlers() {
    ipcMain.handle("ffmpeg-check-command", async (_event) => {
      return await this.checkCommand();
    });

    ipcMain.handle(
      "ffmpeg-transcode",
      async (_event, input, output, options) => {
        return await this.transcode(input, output, options);
      }
    );
  }
}
const ffmpeg = new FfmpegWrapper();

export default ffmpeg;
