import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * Login (demo)
 * - Scrivi "manager" per entrare come Manager
 * - Qualsiasi altro nome → Capo
 * - Salva in localStorage (core_auth_v1) e reindirizza
 */
export default function Login() {
  const nav = useNavigate();
  const [name, setName] = React.useState("");

  // Se già loggato, vai alla pagina corretta
  React.useEffect(() => {
    try {
      const auth = JSON.parse(localStorage.getItem("core_auth_v1") || "{}");
      const user = auth?.user || null;
      if (user?.role === "manager") nav("/manager", { replace: true });
      else if (user?.role === "capo") nav("/capo", { replace: true });
    } catch {
      /* ignore */
    }
  }, [nav]);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const role = trimmed.toLowerCase() === "manager" ? "manager" : "capo";
    localStorage.setItem(
      "core_auth_v1",
      JSON.stringify({ user: { name: trimmed, role } })
    );
    nav(role === "manager" ? "/manager" : "/capo", { replace: true });
  }

  return (
    <div className="max-w-md mx-auto card">
      <h1 className="text-2xl font-extrabold mb-2">Accedi</h1>
      <p className="text-sm opacity-70 mb-4">
        Scrivi <b>manager</b> per entrare come Manager, oppure il tuo{" "}
        <b>nome</b> per entrare come Capo.
      </p>

      <form className="grid gap-3" onSubmit={handleSubmit}>
        <label className="grid gap-1">
          <span className="text-sm opacity-70">Nome utente</span>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='es. "Maiga" o "manager"'
            autoFocus
          />
        </label>

        <div className="flex items-center gap-2">
          <button type="submit" className="btn">
            Entra
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => setName("manager")}
            title="Compila con 'manager'"
          >
            Manager demo
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => setName("Maiga")}
            title="Compila con 'Maiga'"
          >
            Capo demo
          </button>
        </div>
      </form>
    </div>
  );
}
