import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";

// LOG: render entry

const root = createRoot(document.getElementById("app"));
root.render(<App />);
