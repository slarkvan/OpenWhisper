import { useCallback } from "react";
import { useAppStore } from "@/renderer/store/app-store";
import { AudioFormats, VideoFormats } from "@/constants";
import { useMediaStore } from "./store/media-store";
import ReactPlayer from "react-player";
import { Button } from "@/renderer/components/ui/button";
import { MediaPlayer, MediaProvider } from "@vidstack/react";
import {
  defaultLayoutIcons,
  DefaultVideoLayout,
} from "@vidstack/react/player/layouts/default";

export const App = () => {
  const App = useAppStore((s) => s.App);
  const {
    mediaUri,
    mediaFilePath,
    setMediaUri,
    setMediaFilePath,
  } = useMediaStore();

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
      const res = await App.video.create({
        uri: mediaUri,
      });
      console.log("video.create", res);
      setMediaFilePath(res?.filePath);
    })();
  }, [App, mediaUri]);

  const testFfmpeg = useCallback(() => {
    (async () => {
      const res = await App.ffmpeg.check();
      console.log("ffmpeg check res", res);
    })();
  }, [App]);

  const transcode = useCallback(() => {
    (async () => {
      const res = await App.ffmpeg.transcode(mediaFilePath);
      console.log("ffmpeg transcode res", res);
      const res2 = await App.whisper.transcribe(
        {
          file: res,
        },
        {
          force: true,
          extra: ["--prompt", `"Hello! Welcome to listen to this audio."`],
        }
      );
      console.log("whisper transcribe res2", res2);
    })();
  }, [App, mediaFilePath]);

  return (
    <div className="min-w-[600px]">
      <div className="text-orange-500">OpenWhisper</div>
      <Button onClick={handleLocalFile}>Upload File</Button>
      <button onClick={handleCopyLocalFile}>Copy File</button>
      <button onClick={transcribeByLocal}>Whisper transcribe</button>

      <br />
      <button onClick={testFfmpeg}>Test ffmpeg</button>
      <button onClick={transcode}>ffmpeg transcode</button>
      <div>mediaUri:{mediaUri}</div>
      <div>mediaFilePath:{mediaFilePath}</div>

      {mediaFilePath && (
        <MediaPlayer
          title="Sprite Fight"
          // src="https://files.vidstack.io/sprite-fight/720p.mp4"
          src={{
            src: mediaFilePath,
            type: "video/mp4",
          }}
        >
          <MediaProvider />
          <DefaultVideoLayout
            thumbnails="https://files.vidstack.io/sprite-fight/thumbnails.vtt"
            icons={defaultLayoutIcons}
          />
        </MediaPlayer>
      )}
    </div>
  );
};
