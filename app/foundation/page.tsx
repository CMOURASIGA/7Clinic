"use client";

import { useState, type FormEvent } from "react";
import { createFoundationBrowserClient } from "../../lib/supabase/browser";

export default function FoundationPage() {
  const [message, setMessage] = useState("");
  const [session, setSession] = useState("");

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const email = String(fields.get("email") || "");
    const password = String(fields.get("password") || "");
    try {
      const { error } = await createFoundationBrowserClient().auth.signInWithPassword({ email, password });
      if (error) throw error;
      setMessage("Identidade autenticada. Conferindo grants ativos...");
      await refresh();
    } catch {
      setMessage("Autenticação indisponível ou credenciais inválidas.");
    }
  }

  async function refresh() {
    const response = await fetch("/api/foundation/session", { cache: "no-store" });
    const body = await response.json();
    setSession(response.ok ? JSON.stringify(body, null, 2) : "");
    if (!response.ok) setMessage("Sem vínculo ativo ou ambiente local indisponível.");
  }

  async function logout() {
    try {
      await createFoundationBrowserClient().auth.signOut();
    } finally {
      setSession("");
      setMessage("Sessão encerrada.");
    }
  }

  return (
    <main style={{ maxWidth: 520, margin: "4rem auto", padding: "1.5rem", color: "#142232" }}>
      <h1>Fundação CP-02</h1>
      <p>Acesso técnico local com identidades sintéticas. O MVP demonstrativo segue independente.</p>
      <form onSubmit={login} style={{ display: "grid", gap: 12 }}>
        <label>Email fictício<input name="email" type="email" required autoComplete="username" /></label>
        <label>Senha local<input name="password" type="password" required autoComplete="current-password" /></label>
        <button type="submit">Entrar</button>
      </form>
      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <button type="button" onClick={refresh}>Verificar acesso</button>
        <button type="button" onClick={logout}>Sair</button>
      </div>
      <p role="status">{message}</p>
      {session && <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{session}</pre>}
    </main>
  );
}
