import { createClient } from "@supabase/supabase-js";

// Ces deux variables DOIVENT exister :
// - en local: .env.local
// - sur Netlify: Site settings → Environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Aide débutant: message clair en console si variables manquantes
  console.warn(
    "[Supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquantes. " +
    "Ajoute-les dans .env.local (dev) et sur Netlify (prod)."
  );
}

export const supabase = createClient(
  supabaseUrl ?? "https://example.supabase.co",
  supabaseAnonKey ?? "ey_dummy",
  { auth: { persistSession: true, autoRefreshToken: true } }
);
