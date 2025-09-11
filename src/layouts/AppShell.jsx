import React from "react";
import Navbar from "@/components/Navbar.jsx";

/**
 * AppShell
 * - Fond global (classe .core-bg définie dans index.css)
 * - Navbar en haut
 * - Contenu dans <main> avec container centré
 * - Pas de <BrowserRouter> ici (il est dans main.jsx)
 */

export default function AppShell({ children }) {
  return (
    <div className="core-bg min-h-screen">
      {/* lien d'accès rapide au contenu */}
      <a
        href="#core-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[10000] bg-black text-white px-3 py-2 rounded"
      >
        Aller au contenu
      </a>

      {/* Header / Navbar */}
      <Navbar />

      {/* Contenu principal */}
      <main
        id="core-content"
        className="core-content max-w-screen-2xl mx-auto p-4 md:p-6 lg:p-8"
      >
        {children}
      </main>

      {/* Footer léger (optionnel) */}
      <footer className="core-content max-w-screen-2xl mx-auto px-4 pb-8 text-xs opacity-70">
        <div className="border-t border-white/20 pt-4">
          CORE · il cuore dell'avanzamento cavi
        </div>
      </footer>
    </div>
  );
}
