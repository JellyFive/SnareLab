import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
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
            src: "/icons/snarelab-icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ],
        start_url: "/"
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,woff2}"],
        navigateFallback: "/index.html"
      }
    })
  ]
});
