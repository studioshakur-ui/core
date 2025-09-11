// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: ".",             // racine = dossier courant
  base: "/",             // Netlify/host standard. (Pour GH Pages: '/nom-repo/')
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  build: {
    rollupOptions: {
      // on force l'entrée sur le vrai index.html du projet
      input: path.resolve(__dirname, "index.html"),
    },
  },
});
