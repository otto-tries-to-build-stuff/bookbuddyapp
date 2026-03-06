/**
 * main.tsx — The Entry Point of the App
 *
 * This is the very first file that runs when someone opens your website.
 * Think of it as the "front door" — it finds the HTML element where the
 * app should appear and renders the root <App /> component into it.
 *
 * Key concepts:
 * - `createRoot` is a React 18 function that connects React to the actual
 *   HTML page (specifically the <div id="root"> in index.html).
 * - `import "./index.css"` loads all the global styles (colors, fonts, etc.)
 *   so they're available everywhere in the app.
 */

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Find the HTML element with id="root" and render our entire React app inside it.
// The `!` tells TypeScript "I promise this element exists" (it's defined in index.html).
createRoot(document.getElementById("root")!).render(<App />);
