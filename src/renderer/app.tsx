import { useCallback } from "react";
import { useAppStore } from "@/renderer/store/app-store";
import { AudioFormats, VideoFormats } from "@/constants";
import { useMediaStore } from "./store/media-store";

export const App = () => {
  const App = useAppStore((s) => s.App);
  const {
    mediaUri,
    mediaFilePath,
    setMediaUri,
    setMediaFilePath,
  } = useMediaStore();
  console.log("App", App);

  const handleLocalFile = useCallback(() => {
    (async () => {
      const files = await App.dialog.showOpenDialog({
        properties: ["openFile"],
        filters: [
          {
            name: "audio,video",
            extensions: [...AudioFormats, ...VideoFormats],
          },
        ],
      });
      if (files) {
        console.log("files[0]", files[0]);
        setMediaUri(files[0]);
      }
    })();
  }, [App]);

  const transcribeByLocal = useCallback(() => {
    (async () => {
      const res = await App.whisper.transcribe(
        {
          file: mediaFilePath,
        },
        {
          force: true,
          extra: ["--prompt", `"Hello! Welcome to listen to this audio."`],
        }
      );

      return {
        engine: "whisper",
        model: res.model.type,
        text: res.transcription.map((segment: any) => segment.text).join(" "),
      };
    })();
  }, [App, mediaFilePath]);

  const handleCopyLocalFile = useCallback(() => {
    (async () => {
      console.log("mediaUri", mediaUri);
      const res = await App.video.create({
        uri: mediaUri,
      });
      setMediaFilePath(res?.filePath);
    })();
  }, [App, mediaUri]);

  return (
    <div>
      <button onClick={handleLocalFile}>Upload File</button>
      <button onClick={handleCopyLocalFile}>Copy File</button>
      <button onClick={transcribeByLocal}>Whisper transcribe</button>
    </div>
  );
};
