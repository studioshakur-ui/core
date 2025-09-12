import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Évite que Vite prétraite ExcelJS (on prend la build déjà minifiée)
    exclude: ["exceljs"]
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    },
    rollupOptions: {
      output: {
        // On isole exceljs dans un chunk séparé (optionnel mais plus propre)
        manualChunks: {
          exceljs: ["exceljs/dist/exceljs.min.js"]
        }
      }
    }
  },
  define: {
    // Neutralise process et global (ExcelJS peut les référencer)
    "process.env": {},
    global: "window"
  }
});
