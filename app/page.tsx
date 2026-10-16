"use client";

import { useEffect, useState } from "react";
import { Management } from "../components/management";
import { ProfessionalView } from "../components/professional";
import { Reception } from "../components/reception";
import { createSeed, executeForRole, type Command, type DemoState, type Role, type UnitId } from "../lib/domain";
import { localRepository } from "../lib/local-repository";

const views: { id: Role; title: string; symbol: string }[] = [
  { id: "reception", title: "Recepção", symbol: "▦" },
  { id: "professional", title: "Profissionais", symbol: "♙" },
  { id: "management", title: "Gestão", symbol: "◫" },
];

export default function Home() {
  const [state, setState] = useState<DemoState>(createSeed);
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<Role>("reception");
  const [unit, setUnit] = useState<UnitId | "all">("all");
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

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

  const notifications = state.appointments.filter((item) => item.status === "scheduled" && state.policies.notifyOnConfirmationPending).length
    + state.appointments.filter((item) => item.status === "confirmed" && !item.evolution && state.policies.notifyOnClinicalPending).length;

  if (!ready) return <div className="loading">Preparando a demonstração do 7Clinic...</div>;

  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-symbol">7</div><div><strong>7Clinic</strong><small>CLÍNICA MOVIMENTAR-SE</small></div></div>
      <div className="side-section">AMBIENTES</div>
      <nav aria-label="Ambientes" className="nav-links">{views.map((view) => <button key={view.id} className={role === view.id ? "active" : ""} onClick={() => { setRole(view.id); setMessage(null); }}><span aria-hidden="true">{view.symbol}</span>{view.title}</button>)}</nav>
      <div className="side-bottom"><div className="calendar-box"><div className="calendar-head"><strong>Outubro 2026</strong><span>◀ &nbsp; ▶</span></div><div className="calendar-days">{["D","S","T","Q","Q","S","S"].map((day, index) => <b key={index}>{day}</b>)}{Array.from({ length: 4 }, (_, index) => <i key={`empty-${index}`}/>)}{Array.from({ length: 31 }, (_, index) => <span key={index} className={index + 1 === 16 ? "today" : ""}>{index + 1}</span>)}</div></div><button className="reset" onClick={reset}>↺ &nbsp; Reiniciar demonstração</button></div>
    </aside>
    <div className="workspace">
      <header className="topbar"><div className="breadcrumb">7Clinic <span>/</span> {views.find((view) => view.id === role)?.title}</div><div className="top-right"><span className="demo-tag">● &nbsp; DEMONSTRAÇÃO</span><span className="notification" aria-label={`${notifications} notificações demonstrativas`}>♧<b>{notifications}</b></span><div className="identity"><span className="avatar">{role === "reception" ? "R" : role === "professional" ? "P" : "G"}</span><span><strong>{role === "reception" ? "Recepção" : role === "professional" ? "Profissional" : "Gestão"}</strong><small>Perfil simulado</small></span></div></div></header>
      <main className="page-content">
        {message ? <div className={`toast ${message.error ? "toast-error" : ""}`} role="status">{message.text}<button aria-label="Fechar aviso" onClick={() => setMessage(null)}>×</button></div> : null}
        {role === "reception" ? <Reception state={state} unit={unit} onUnit={setUnit} run={run}/> : role === "professional" ? <ProfessionalView state={state} unit={unit} onUnit={setUnit} run={run}/> : <Management state={state} unit={unit} onUnit={setUnit} run={run}/>}
        <footer className="footer">7Clinic · SPEC 00 · dados 100% fictícios · persistência somente neste navegador · não utilizar para atendimento real</footer>
      </main>
    </div>
  </div>;
}
