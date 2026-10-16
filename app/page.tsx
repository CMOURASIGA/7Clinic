"use client";

import { useEffect, useState } from "react";
import { Management } from "../components/management";
import { ProfessionalView } from "../components/professional";
import { Reception } from "../components/reception";
import { createSeed, DEMO_DAY, executeForRole, notificationItems, type Command, type DemoState, type Role, type UnitId } from "../lib/domain";
import { localRepository } from "../lib/local-repository";

const views: { id: Role; title: string }[] = [
  { id: "reception", title: "Recepção" },
  { id: "professional", title: "Profissionais" },
  { id: "management", title: "Gestão" },
  { id: "finance", title: "Financeiro" },
];

function NavIcon({ role }: { role: Role }) {
  const path = role === "reception"
    ? <><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4M7 13h4M7 17h4M15 13h2"/></>
    : role === "professional"
      ? <><path d="M8 3H6a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 13h6M12 10v6"/></>
      : <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 16v-4M12 16V8M17 16v-6M7 18h10"/></>;
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{path}</svg>;
}

export default function Home() {
  const [state, setState] = useState<DemoState>(createSeed);
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<Role>("reception");
  const [unit, setUnit] = useState<UnitId | "all">("all");
  const [selectedDay, setSelectedDay] = useState(DEMO_DAY);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setState(localRepository.load());
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => { if (ready) localRepository.save(state); }, [state, ready]);

  function run(command: Command) {
    try {
      const next = executeForRole(state, role, command);
      setState(next);
      setMessage({ text: next === state ? "Ação já registrada. Nenhuma duplicidade gerada." : "Ação registrada na demonstração.", error: false });
      return true;
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Não foi possível executar a ação.", error: true });
      return false;
    }
  }

  function reset() {
    if (!window.confirm("Reiniciar todos os dados fictícios desta demonstração neste navegador?")) return;
    localRepository.clear();
    setState(createSeed());
    setMessage({ text: "Demonstração reiniciada.", error: false });
  }

  const notifications = notificationItems(state).length;

  if (!ready) return <div className="loading">Preparando a demonstração do 7Clinic...</div>;

  return <div className="shell">
    {menuOpen ? <button className="sidebar-backdrop" aria-label="Fechar menu" onClick={() => setMenuOpen(false)}/> : null}
    <aside className={`sidebar ${menuOpen ? "is-open" : ""}`} aria-label="Menu do 7Clinic">
      <div className="clinic-lockup"><strong>Movimentar-se</strong><span>CLÍNICA MULTIDISCIPLINAR</span></div>
      <div className="brand"><div><strong>7Clinic</strong><small>Gestão clínica · SPEC 00</small></div></div>
      <div className="side-section">PRINCIPAL</div>
      <nav aria-label="Ambientes" className="nav-links">{views.map((view) => <button key={view.id} className={role === view.id ? "active" : ""} aria-current={role === view.id ? "page" : undefined} onClick={() => { setRole(view.id); setMessage(null); setMenuOpen(false); }}><NavIcon role={view.id}/>{view.title}</button>)}</nav>
      <div className="side-bottom"><div className="calendar-box"><div className="calendar-head"><strong>Data da agenda</strong><span>Recepção e profissionais</span></div><input className="sidebar-date" aria-label="Data da agenda no menu" type="date" value={selectedDay} onChange={(event) => setSelectedDay(event.target.value)}/><button className="reset" onClick={() => setSelectedDay("")}>Mostrar todas as datas</button></div><button className="reset" onClick={reset}>↺ &nbsp; Reiniciar demonstração</button></div>
    </aside>
    <div className="workspace">
      <header className="topbar"><button className="mobile-nav-toggle" aria-label="Abrir menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>☰</button><div className="breadcrumb"><small>WORKSPACE ATIVO</small><strong>{views.find((view) => view.id === role)?.title}</strong></div><div className="top-right"><span className="demo-tag">● &nbsp; DEMONSTRAÇÃO</span><span className="notification" aria-label={`${notifications} notificações demonstrativas`}>♧<b>{notifications}</b></span><div className="identity"><span className="avatar">{role === "reception" ? "R" : role === "professional" ? "P" : "G"}</span><span><strong>{role === "reception" ? "Recepção" : role === "professional" ? "Profissional" : "Gestão"}</strong><small>Perfil simulado</small></span></div></div></header>
      <main className="page-content">
        {message ? <div className={`toast ${message.error ? "toast-error" : ""}`} role="status">{message.text}<button aria-label="Fechar aviso" onClick={() => setMessage(null)}>×</button></div> : null}
        {role === "reception" ? <Reception state={state} unit={unit} onUnit={setUnit} selectedDay={selectedDay} onDay={setSelectedDay} run={run}/> : role === "professional" ? <ProfessionalView state={state} unit={unit} onUnit={setUnit} selectedDay={selectedDay} onDay={setSelectedDay} run={run}/> : <Management state={state} unit={unit} onUnit={setUnit} run={run} financeOnly={role === "finance"}/>}
        <footer className="footer">7Clinic · SPEC 00 · dados 100% fictícios · persistência somente neste navegador · não utilizar para atendimento real</footer>
      </main>
    </div>
  </div>;
}
