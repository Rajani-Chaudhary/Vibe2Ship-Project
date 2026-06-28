import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const projectRoot = path.resolve(__dirname);
const normalizedRoot = projectRoot.charAt(0).toUpperCase() + projectRoot.slice(1);

export default defineConfig({
  plugins: [
    react(),
  ],

  resolve: {
    alias: {
      "@": path.resolve(normalizedRoot, "src"),
      "@assets": path.resolve(normalizedRoot, "../../attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },

  root: normalizedRoot,

  build: {
    outDir: path.resolve(normalizedRoot, "dist"),
    emptyOutDir: true,
  },

  server: {
    port: 5173,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },

  preview: {
    port: 4173,
    host: "0.0.0.0",
  },
});