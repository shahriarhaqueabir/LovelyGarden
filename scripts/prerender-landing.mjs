/**
 * Prerender script — renders the landing page to static HTML at build time.
 *
 * Uses Vite's SSR capabilities to render the LandingPage component to a string,
 * then inlines it into the built index.html shell. No headless browser needed.
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "..", "dist");
const ROOT = resolve(__dirname, "..");

async function prerender() {
  console.log("[prerender] Building SSR render function...");

  // Use Vite's SSR to render the landing page
  const { createServer } = await import("vite");

  const vite = await createServer({
    root: ROOT,
    server: { middlewareMode: true },
    appType: "custom",
    logLevel: "silent",
  });

  try {
    const { renderToString } = await import("react-dom/server");
    const React = await import("react");

    // Import the LandingPage module via Vite's SSR transform
    const { LandingPage } = await vite.ssrLoadModule(
      "/src/pages/LandingPage.tsx",
    );

    // Render the landing page to a string
    const appHtml = renderToString(
      React.createElement(LandingPage, {
        onGetStarted: () => {},
      }),
    );

    // Read the built index.html shell
    const indexPath = resolve(DIST, "index.html");
    let html = readFileSync(indexPath, "utf-8");

    // Replace the root placeholder with the rendered HTML
    html = html.replace(
      '<div id="root"></div>',
      `<div id="root">${appHtml}</div>`,
    );

    // Add a script tag that rehydrates the app (it skips the landing
    // page in browser via the showAuth state flow)
    html = html.replace(
      "</body>",
      "<script>window.__PRERENDERED__ = true;</script>\n</body>",
    );

    writeFileSync(indexPath, html, "utf-8");
    console.log(
      `[prerender] Written ${html.length.toLocaleString()} bytes to index.html`,
    );
    console.log(
      `[prerender] Landing page SSR: ${appHtml.length.toLocaleString()} chars`,
    );
  } finally {
    await vite.close();
  }

  console.log("[prerender] Done.");
}

prerender();
