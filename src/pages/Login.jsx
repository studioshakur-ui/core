import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const onSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) alert(error.message);
    else setSent(true);
  };
  if (sent) return <p>Check ton email pour le lien magique.</p>;
  return (
    <form onSubmit={onSubmit} className="max-w-sm mx-auto p-4 space-y-3">
      <input
        className="border rounded p-2 w-full"
        type="email"
        placeholder="ton@email.com"
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
        required
      />
      <button className="bg-black text-white rounded px-4 py-2">Se connecter</button>
    </form>
  );
}
