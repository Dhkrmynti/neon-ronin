import { createRoot } from "react-dom/client";
import "@fontsource/dela-gothic-one/400.css";
import "@fontsource/zen-kaku-gothic-new/latin-400.css";
import "@fontsource/zen-kaku-gothic-new/latin-700.css";
import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/latin-700.css";
import "lenis/dist/lenis.css";
import "./styles/site.css";
import { App } from "./App";

// Lets the CSS hide things that the scroll animations are about to reveal, only when they will run.
if (window.matchMedia("(prefers-reduced-motion: no-preference)").matches) document.documentElement.classList.add("motion");

createRoot(document.getElementById("root")!).render(<App />);
