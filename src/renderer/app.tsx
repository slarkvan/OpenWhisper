import { useCallback, useState } from "react";
import { useAppStore } from "@/renderer/store/app-store";
import { AudioFormats, VideoFormats } from "@/constants";

export const App = () => {
  const App = useAppStore((s) => s.App);
  console.log("App", App);

  const [uri, setUri] = useState("");

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
        setUri(files[0]);
      }
    })();
  }, [App]);

  return (
    <div>
      <button onClick={handleLocalFile}>Test ICP</button>
    </div>
  );
};
