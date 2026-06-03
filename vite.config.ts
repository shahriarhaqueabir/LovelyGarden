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
        includeAssets: [
          "favicon.png",
          "apple-touch-icon.png",
          "screenshot.png",
        ],
        manifest: {
          name: "Lovely Garden",
          short_name: "LovelyGarden",
          description:
            "A mobile-first garden workspace with local-first storage, Supabase sync, and optional AI guidance.",
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
          screenshots: [
            {
              src: "screenshot.png",
              sizes: "540x582",
              type: "image/png",
              form_factor: "narrow",
              label: "Lovely Garden logo artwork",
            },
          ],
        },
        workbox: {
          cleanupOutdatedCaches: true,
          navigateFallback: "/index.html",
          globPatterns: [
            "**/index.html",
            "**/manifest.webmanifest",
            "**/*.css",
            "**/*.js",
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
    clearScreen: false,
    server: {
      port: 1420,
      strictPort: true,
      host: true,
    },
    define: {
      // Make only VITE_ prefixed env variables available at runtime (security best practice)
      "process.env": Object.fromEntries(
        Object.entries(env).filter(([key]) => key.startsWith("VITE_")),
      ),
    },
    build: {
      target: "safari15",
      minify: "esbuild",
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (!id.includes("node_modules")) return;

            if (id.includes("rxdb") || id.includes("dexie")) return "vendor-db";
            if (id.includes("lucide-react")) return "vendor-icons";

            if (
              id.includes("/react-dom/") ||
              id.includes("/react/") ||
              id.includes("/scheduler/") ||
              id.includes("/xstate/") ||
              id.includes("/zustand/") ||
              id.includes("/rxjs/") ||
              id.includes("@legendapp")
            ) {
              return "vendor-react";
            }

            if (
              id.includes("/motion/") ||
              id.includes("@headlessui") ||
              id.includes("/recharts/")
            )
              return "vendor-ui";

            if (
              id.includes("/zod/") ||
              id.includes("/react-hook-form/") ||
              id.includes("@hookform")
            )
              return "vendor-forms";

            if (
              id.includes("@orama") ||
              id.includes("@supabase") ||
              id.includes("/date-fns/") ||
              id.includes("/dayjs/") ||
              id.includes("/react-i18next/") ||
              id.includes("/i18next/") ||
              id.includes("@tanstack") ||
              id.includes("/react-hot-toast/") ||
              id.includes("/react-error-boundary/") ||
              id.includes("/clsx/") ||
              id.includes("/tailwind-merge/")
            )
              return "vendor-utils";
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
      ],
    },
  };
});
