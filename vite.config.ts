import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { loadEnv } from "vite";
import dotenv from "dotenv";
import { configDefaults } from "vitest/config";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env file using dotenv first, then Vite's loadEnv for VITE_ prefix handling
  dotenv.config({ path: `.env.${mode}` });
  dotenv.config(); // Load default .env
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
        manifest: {
          name: "Garden Deck",
          short_name: "GardenDeck",
          description:
            "An offline-first card-based gardening game and manager.",
          theme_color: "#0c0a09", // stone-950
          icons: [
            {
              src: "pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        },
        workbox: {
          navigateFallback: "/index.html",
          globPatterns: [
            "**/index.html",
            "**/manifest.webmanifest",
            "**/*.css",
            "**/vendor-*.js",
            "**/index-*.js",
          ],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "open-meteo-weather",
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 3600, // 1 hour
                },
              },
            },
          ],
        },
      }),
    ],
    // 1. prevent vite from obscuring rust errors
    clearScreen: false,
    // 2. tauri expects a fixed port, fail if that port is used
    server: {
      port: 1420,
      strictPort: true,
      host: true,
      watch: {
        // 3. tell vite to ignore watching `src-tauri`
        ignored: ["**/src-tauri/**"],
      },
    },
    define: {
      // Make only VITE_ prefixed env variables available at runtime (security best practice)
      "process.env": Object.fromEntries(
        Object.entries(env).filter(([key]) => key.startsWith("VITE_")),
      ),
    },
    build: {
      // Tauri supports modern JS features (BigInt required by Orama/RxDB)
      target:
        process.env.TAURI_PLATFORM === "windows" ? "chrome105" : "safari15",
      // don't minify for debug builds
      minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
      // produce sourcemaps for debug builds
      sourcemap: !!process.env.TAURI_DEBUG,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes("node_modules")) {
              // Database - independent of React
              if (id.includes("rxdb") || id.includes("dexie")) {
                return "vendor-db";
              }
              // Icons - independent of React
              if (id.includes("lucide-react")) {
                return "vendor-icons";
              }
              // Everything else (including React and its deps) stays together to avoid circular deps
              return "vendor-misc";
            }
            return undefined;
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./tests/setup.ts"],
      exclude: [
        ...configDefaults.exclude,
        "e2e/**",
        "node_modules_broken/**",
        "dist/**",
        "dist2/**",
        "dist_probe/**",
        "src-tauri/target/**",
      ],
    },
  };
});
