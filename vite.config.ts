import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const base = process.env.VITE_BASE_PATH ?? "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "SnareLab Practice Log",
        short_name: "SnareLab",
        description: "Local-first practice logging for drummers.",
        theme_color: "#5B63F6",
        background_color: "#F7F8FA",
        display: "standalone",
        icons: [
          {
            src: `${base}icons/snarelab-icon-192.png`,
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: `${base}icons/snarelab-icon-512.png`,
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: `${base}icons/snarelab-icon.svg`,
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ],
        start_url: base
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,wav,woff2}"],
        navigateFallback: `${base}index.html`
      }
    })
  ]
});
