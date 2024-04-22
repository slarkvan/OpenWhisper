import { ipcMain } from "electron";
import settings from "@main/settings";
import path from "path";
import { WHISPER_MODELS_OPTIONS, PROCESS_TIMEOUT } from "@/constants";
import { exec, spawn } from "child_process";
import fs from "fs-extra";
import log from "@main/logger";
import url from "url";
import { openWhisperUrlToPath } from "./utils";

const __filename = url.fileURLToPath(import.meta.url);
/*
 * whipser bin file will be in /app.asar.unpacked instead of /app.asar
 */
const __dirname = path
  .dirname(__filename)
  .replace("app.asar", "app.asar.unpacked");

console.log("__dirname", __dirname, __filename, import.meta.url);

const logger = log.scope("whisper");

class Whisper {
  private binMain: string;
  private bundledModelsDir: string;
  public config: WhisperConfigType;

  constructor() {
    const customWhisperPath = path.join(
      settings.libraryPath(),
      "whisper",
      "main"
    );
    this.bundledModelsDir = path.join(__dirname, "lib", "whisper", "models");
    if (fs.existsSync(customWhisperPath)) {
      this.binMain = customWhisperPath;
    } else {
      this.binMain = path.join(__dirname, "lib", "whisper", "main");
    }
    this.initialize();
  }

  initialize() {
    const models = [];

    const bundledModels = fs.readdirSync(this.bundledModelsDir);
    for (const file of bundledModels) {
      const model = WHISPER_MODELS_OPTIONS.find((m) => m.name == file);
      if (!model) continue;

      models.push({
        ...model,
        savePath: path.join(this.bundledModelsDir, file),
      });
    }

    const dir = path.join(settings.libraryPath(), "whisper", "models");
    fs.ensureDirSync(dir);
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const model = WHISPER_MODELS_OPTIONS.find((m) => m.name == file);
      if (!model) continue;

      models.push({
        ...model,
        savePath: path.join(dir, file),
      });
    }
    settings.setSync("whisper.availableModels", models);
    settings.setSync("whisper.modelsPath", dir);
    this.config = settings.whisperConfig();
  }

  currentModel() {
    if (!this.config.availableModels) return;

    let model: WhisperConfigType["availableModels"][0];
    if (this.config.model) {
      model = (this.config.availableModels || []).find(
        (m) => m.name === this.config.model
      );
    }
    if (!model) {
      model = this.config.availableModels[0];
    }

    settings.setSync("whisper.model", model.name);
    return model.savePath;
  }

  async check() {
    const model = this.currentModel();
    logger.debug(`Checking whisper model: ${model}`);

    const sampleFile = path.join(__dirname, "samples", "jfk.wav");
    const tmpDir = settings.cachePath();
    const outputFile = path.join(tmpDir, "jfk.json");
    fs.rmSync(outputFile, { force: true });
    return new Promise((resolve, _reject) => {
      const commands = [
        `"${this.binMain}"`,
        `--file "${sampleFile}"`,
        `--model "${model}"`,
        "--output-json",
        `--output-file "${path.join(tmpDir, "jfk")}"`,
      ];
      logger.debug(`Checking whisper command: ${commands.join(" ")}`);
      exec(
        commands.join(" "),
        {
          timeout: PROCESS_TIMEOUT,
        },
        (error, stdout, stderr) => {
          if (error) {
            logger.error("error", error);
          }

          if (stderr) {
            logger.info("stderr", stderr);
          }

          if (stdout) {
            logger.debug(stdout);
          }

          resolve({
            success: fs.existsSync(outputFile),
            log: `${error?.message || ""}\n${stderr}\n${stdout}`,
          });
        }
      );
    });
  }

  /* Ensure the file is in wav format
   * and 16kHz sample rate
   */
  async transcribe(
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
      onProgress?: (progress: number) => void;
    }
  ): Promise<Partial<WhisperOutputType>> {
    logger.debug("transcribing from local");

    const { blob } = params;
    let { file } = params;

    if (file) {
      file = openWhisperUrlToPath(file);
    } else if (blob) {
      const format = blob.type.split("/")[1];
      if (format !== "wav") {
        throw new Error("Only wav format is supported");
      }

      file = path.join(settings.cachePath(), `${Date.now()}.${format}`);
      await fs.outputFile(file, Buffer.from(blob.arrayBuffer));
    } else {
      throw new Error("No file or blob provided");
    }

    const model = this.currentModel();

    const { force = false, extra = [], onProgress } = options || {};
    const filename = path.basename(file, path.extname(file));
    const tmpDir = settings.cachePath();
    const outputFile = path.join(tmpDir, filename + ".json");

    logger.info(`Trying to transcribe ${file} to ${outputFile}`);
    if (fs.pathExistsSync(outputFile) && !force) {
      logger.info(`File ${outputFile} already exists`);
      return fs.readJson(outputFile);
    }

    const commandArguments = [
      "--file",
      file,
      "--model",
      model,
      "--output-json",
      "--output-file",
      path.join(tmpDir, filename),
      "-pp",
      ...extra,
    ];

    logger.info(
      `Running command: ${this.binMain} ${commandArguments.join(" ")}`
    );
    // LOG: Whipser executor
    const command = spawn(this.binMain, commandArguments, {
      timeout: PROCESS_TIMEOUT,
    });

    return new Promise((resolve, reject) => {
      command.stdout.on("data", (data) => {
        logger.debug(`stdout: ${data}`);
      });

      command.stderr.on("data", (data) => {
        const output = data.toString();
        logger.info(`stderr: ${output}`);
        if (output.startsWith("whisper_print_progress_callback")) {
          const progress = parseInt(output.match(/\d+%/)?.[0] || "0");
          if (typeof progress === "number") onProgress(progress);
        }
      });

      command.on("exit", (code) => {
        logger.info(`transcribe process exited with code ${code}`);
      });

      command.on("error", (err) => {
        logger.error("transcribe error", err.message);
        reject(err);
      });

      command.on("close", () => {
        if (fs.pathExistsSync(outputFile)) {
          resolve(fs.readJson(outputFile));
        } else {
          reject(new Error("Transcription failed"));
        }
      });
    });
  }

  registerIpcHandlers() {
    console.log("registerIpcHandlers");
    ipcMain.handle("whisper/describe", async () => {
      console.log("whisper/describe");
      return this.config;
    });

    ipcMain.handle("whisper-config", async () => {
      return this.config;
    });

    ipcMain.handle("whisper-set-model", async (event, model) => {
      const originalModel = settings.getSync("whisper.model");
      settings.setSync("whisper.model", model);
      this.config = settings.whisperConfig();

      return this.check()
        .then(({ success, log }) => {
          if (success) {
            return Object.assign({}, this.config, { ready: true });
          } else {
            throw new Error(log);
          }
        })
        .catch((err) => {
          settings.setSync("whisper.model", originalModel);
          event.sender.send("on-notification", {
            type: "error",
            message: err.message,
          });
        });
    });

    ipcMain.handle("whisper-set-service", async (event, service) => {
      if (service === "local") {
        try {
          await this.check();
          settings.setSync("whisper.service", service);
          this.config.service = service;
          return this.config;
        } catch (err) {
          event.sender.send("on-notification", {
            type: "error",
            message: err.message,
          });
        }
      } else if (["cloudflare", "azure", "openai"].includes(service)) {
        settings.setSync("whisper.service", service);
        this.config.service = service;
        return this.config;
      } else {
        event.sender.send("on-notification", {
          type: "error",
          message: "Unknown service",
        });
      }
    });

    ipcMain.handle("whisper-check", async (_event) => {
      return await this.check();
    });

    ipcMain.handle("whisper-transcribe", async (event, params, options) => {
      try {
        return await this.transcribe(params, {
          ...options,
          onProgress: (progress) => {
            event.sender.send("whisper-on-progress", progress);
          },
        });
      } catch (err) {
        event.sender.send("on-notification", {
          type: "error",
          message: err.message,
        });
      }
    });
  }
}

export default new Whisper();
