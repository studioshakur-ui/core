import { supabase } from "../lib/supabaseClient";

export function SupabaseHealth() {
  const [state, setState] = useState("checking...");
  useEffect(() => {
    (async () => {
      try {
        // ping public endpoint: get 1 row from a table publique (ex: teams)
        const { data, error } = await supabase.from("teams").select("id").limit(1);
        if (error) setState("❌ " + error.message);
        else setState("✅ Connected to Supabase");
      } catch (e) {
        setState("❌ " + (e?.message || "unknown error"));
      }
    })();
  }, []);
  return <div className="text-sm opacity-70 mt-2">{state}</div>;
}
