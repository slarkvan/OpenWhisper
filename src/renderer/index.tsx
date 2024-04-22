import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { AppContainer } from "@/renderer/container/AppContainer";

// LOG: render entry

const root = createRoot(document.getElementById("app"));
root.render(
  <AppContainer>
    <App />
  </AppContainer>
);
