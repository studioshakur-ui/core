import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
optimizeDeps: {
  exclude: ["exceljs", "@dnd-kit/core", "@dnd-kit/accessibility", "@dnd-kit/utilities"]
}
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  optimizeDeps: { exclude: ["exceljs"] },
  build: {
    commonjsOptions: { include: [/node_modules/], transformMixedEsModules: true },
    rollupOptions: {
      output: { manualChunks: { exceljs: ["exceljs/dist/exceljs.min.js"] } }
    }
  },
  define: { "process.env": {}, global: "window" }
});
