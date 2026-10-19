"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Image from "next/image";
import { Management } from "../components/management";
import { Finance } from "../components/finance";
import { ProfessionalView } from "../components/professional";
import { Reception } from "../components/reception";
import { createScenario, DEMO_DAY, executeForRole, notificationItems, type Command, type DemoState, type Role, type UnitId } from "../lib/domain";
import { localRepository } from "../lib/local-repository";
import { DEFAULT_BRAND, loadBrand, resetBrand, saveBrand, type DemoBrand } from "../lib/branding";
import { MiniCalendar } from "../components/mini-calendar";
import { Central } from "../components/central";
import { applyCentralCommand, type CentralCommand } from "../lib/central";

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
  const [state, setState] = useState<DemoState>(createScenario);
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<Role>("reception");
  const [unit, setUnit] = useState<UnitId | "all">("all");
  const [selectedDay, setSelectedDay] = useState(DEMO_DAY);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [noticesOpen, setNoticesOpen] = useState(false);
  const [focusAppointmentId, setFocusAppointmentId] = useState<string | null>(null);
  const [returnContext, setReturnContext] = useState<{ role: Role; day: string; unit: UnitId | "all"; appointmentId: string | null } | null>(null);
  const [priorContext, setPriorContext] = useState<typeof returnContext>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [brand, setBrand] = useState<DemoBrand>(DEFAULT_BRAND);
  const [centralOpen, setCentralOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setState(localRepository.load());
      setBrand(loadBrand());
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => { if (ready) localRepository.save(state); }, [state, ready]);
  useEffect(() => { if (ready) saveBrand(brand); }, [brand, ready]);

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

  function runCentral(command: CentralCommand) {
    try {
      if (role !== "reception") throw new Error("Central disponível somente na Recepção demonstrativa.");
      const next = applyCentralCommand(state, command);
      setState(next);
      if (!["update", "select", "search", "filter"].includes(command.type)) setMessage({ text: "Operação demonstrativa registrada.", error: false });
      return true;
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Não foi possível concluir a ação.", error: true });
      return false;
    }
  }

  function reset() {
    localRepository.clear();
    resetBrand();
    setBrand(DEFAULT_BRAND);
    setState(createScenario());
    setSelectedDay(DEMO_DAY);
    setUnit("all");
    setMessage({ text: "Demonstração reiniciada.", error: false });
    setResetOpen(false);
    setFocusAppointmentId(null);
    setReturnContext(null);
    setPriorContext(null);
    setCentralOpen(false);
  }

  const notices = notificationItems(state);
  const notifications = notices.length;
  function navigate(nextRole: Role, day?: string, appointmentId?: string, preserveReturn = false) {
    setCentralOpen(false);
    if (appointmentId && !preserveReturn) setReturnContext({ role, day: selectedDay, unit, appointmentId: focusAppointmentId });
    if (!appointmentId && !preserveReturn) { setReturnContext(null); setPriorContext(null); }
    setRole(nextRole);
    if (appointmentId) setUnit("all");
    if (day) setSelectedDay(day);
    setFocusAppointmentId(appointmentId ?? null);
    setMenuOpen(false);
    setNoticesOpen(false);
  }
  function returnToContext() {
    if (!returnContext) return;
    setRole(returnContext.role);
    setSelectedDay(returnContext.day);
    setUnit(returnContext.unit);
    setFocusAppointmentId(returnContext.appointmentId);
    setReturnContext(priorContext);
    setPriorContext(null);
  }
  function resolveBlock(id: string, target: "professional" | "finance") {
    setPriorContext(returnContext);
    setReturnContext({ role: "reception", day: selectedDay, unit, appointmentId: id });
    navigate(target, state.appointments.find((item) => item.id === id)?.day, id, true);
  }

  if (!ready) return <div className="loading">Preparando a demonstração do 7Clinic...</div>;

  return <div className="shell" style={{ "--navy": brand.primary, "--blue": brand.primary, "--highlight": brand.highlight } as CSSProperties}>
    {menuOpen ? <button className="sidebar-backdrop" aria-label="Fechar menu" onClick={() => setMenuOpen(false)}/> : null}
    <aside className={`sidebar ${menuOpen ? "is-open" : ""}`} aria-label="Menu do 7Clinic">
      <button className="sidebar-close" aria-label="Fechar menu lateral" onClick={() => setMenuOpen(false)}>×</button>
      <div className="clinic-lockup"><Image src={brand.logo} alt={`Logo ${brand.name}`} width={200} height={80} unoptimized className="brand-logo"/><span>{brand.name}</span></div>
      <div className="brand"><div><strong>7Clinic</strong><small>Gestão clínica · SPEC 00</small></div></div>
      <div className="organization-label">Organização demonstrativa: Clínica Movimentar-se</div>
      <div className="side-section">PRINCIPAL</div>
      <nav aria-label="Ambientes" className="nav-links">{views.map((view) => <button key={view.id} className={role === view.id ? "active" : ""} aria-current={role === view.id ? "page" : undefined} onClick={() => { navigate(view.id); setMessage(null); }}><NavIcon role={view.id}/>{view.title}</button>)}</nav>
      <div className="side-bottom"><MiniCalendar selectedDay={selectedDay} onDay={setSelectedDay}/><button className="reset" onClick={() => setResetOpen(true)}>↺ &nbsp; Reiniciar cenário fictício</button></div>
    </aside>
    <div className="workspace">
      {resetOpen ? <div className="dialog-backdrop"><div className="reason-dialog" role="dialog" aria-modal="true" aria-label="Reiniciar cenário fictício"><h2>Reiniciar cenário fictício?</h2><p>As alterações desta demonstração serão substituídas pela massa inicial neste navegador. Esta ação não pode ser desfeita.</p><div className="button-line"><button className="button button-light" onClick={() => setResetOpen(false)}>Manter dados</button><button className="button button-primary" onClick={reset}>Sim, reiniciar cenário</button></div></div></div> : null}
      <header className="topbar"><button className="mobile-nav-toggle" aria-label="Abrir menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>☰</button><div className="breadcrumb"><small>WORKSPACE ATIVO</small><strong>{centralOpen ? "Recepção · Central" : views.find((view) => view.id === role)?.title}</strong></div><div className="top-right"><span className="demo-tag">● &nbsp; DEMONSTRAÇÃO</span><div className="notice-wrap"><button className="notification" aria-label={`${notifications} notificações demonstrativas`} aria-expanded={noticesOpen} onClick={() => setNoticesOpen(!noticesOpen)}>♧<b>{notifications}</b></button>{noticesOpen ? <div className="notice-panel"><strong>Pendências demonstrativas</strong>{notices.slice(0, 12).map(({ appointment, kind }) => <button key={appointment.id} onClick={() => navigate(kind === "clinical" ? "professional" : kind === "blocked" ? "management" : "reception", appointment.day, appointment.id)}>{kind === "clinical" ? "Prontuário pendente" : kind === "blocked" ? "Confirmação bloqueada" : "Confirmar atendimento"}<small>{appointment.id} · {appointment.day} · {appointment.time}</small></button>)}{!notices.length ? <p>Nenhuma pendência notificada.</p> : null}</div> : null}</div><div className="identity"><span className="avatar">{role === "reception" ? "R" : role === "professional" ? "P" : role === "finance" ? "F" : "G"}</span><span><strong>{views.find((view) => view.id === role)?.title}</strong><small>Perfil simulado</small></span></div></div></header>
      <main className="page-content">
        {message ? <div className={`toast ${message.error ? "toast-error" : ""}`} role="status">{message.text}<button aria-label="Fechar aviso" onClick={() => setMessage(null)}>×</button></div> : null}
        {role === "reception" && centralOpen ? <><button className="button button-light central-back" onClick={() => setCentralOpen(false)}>← Voltar à agenda da Recepção</button><Central state={state} run={runCentral} onAgenda={(day, id) => navigate("reception", day, id)}/></> : role === "reception" ? <Reception state={state} unit={unit} onUnit={setUnit} selectedDay={selectedDay} onDay={setSelectedDay} run={run} onCentral={() => setCentralOpen(true)} onManagement={() => navigate("management")} onFocus={(day, id) => navigate("reception", day, id)} focusAppointmentId={focusAppointmentId} onResolveBlock={resolveBlock} onReturn={returnContext ? returnToContext : undefined}/> : role === "professional" ? <ProfessionalView state={state} unit={unit} onUnit={setUnit} selectedDay={selectedDay} onDay={setSelectedDay} focusAppointmentId={focusAppointmentId} run={run} onReturn={returnContext ? returnToContext : undefined}/> : role === "finance" ? <Finance state={state} unit={unit} onUnit={setUnit} run={run} focusAppointmentId={focusAppointmentId} onReturn={returnContext ? returnToContext : undefined}/> : <Management state={state} unit={unit} onUnit={setUnit} run={run} onNavigate={(nextRole, day, id) => navigate(nextRole, day, id)} brand={brand} onBrand={setBrand}/>}
        <footer className="footer">7Clinic · SPEC 00 · dados 100% fictícios · persistência somente neste navegador · não utilizar para atendimento real</footer>
      </main>
    </div>
  </div>;
}
