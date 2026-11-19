import React from "react";
import ReactDOM from "react-dom/client";
import NanoApp from "./NanoApp";
import { Analytics } from "@vercel/analytics/react";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <NanoApp />
    <Analytics />
  </React.StrictMode>
);
