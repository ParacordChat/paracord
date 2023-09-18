import preact from "@preact/preset-vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    // global: {},
  },
  // base: "/paracord/",
  plugins: [
    preact(),
    wasm(),
    topLevelAwait(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo.svg", "iconMasks/*.png"],
      manifest: {
        theme_color: "#4bffac",
        background_color: "#af79ff",
        display: "standalone",
        // scope: "/paracord/",
        // start_url: "/paracord/",
        scope: "/",
        start_url: "/",
        name: "Paracord secure chat",
        short_name: "Paracord",
        description: "A secure chat that cleans up after itself",
        icons: [
          {
            src: "/iconMasks/maskable_icon_x48.png",
            sizes: "48x48",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/iconMasks/maskable_icon_x72.png",
            sizes: "72x72",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/iconMasks/maskable_icon_x96.png",
            sizes: "96x96",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/iconMasks/maskable_icon_x128.png",
            sizes: "128x128",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/iconMasks/maskable_icon_x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/iconMasks/maskable_icon_x384.png",
            sizes: "384x384",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/iconMasks/maskable_icon_x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      // devOptions: {
      //   enabled: true,
      // },
    }),
  ],
});
