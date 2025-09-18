import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          pdf: ["jspdf", "jspdf-autotable", "html2canvas"],
          prism: ["prismjs"],
        },
      },
    },
    chunkSizeWarningLimit: 1200,
    sourcemap: false,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  server: {
    headers: {
      // Completely disable COOP for development to allow OAuth popups
      "Cross-Origin-Opener-Policy": "unsafe-none",
      "Cross-Origin-Embedder-Policy": "unsafe-none",
    },
  },
});
