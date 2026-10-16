"use client";

import { useState } from "react";
import { type Command, type DemoState, type UnitId, UNIT_NAMES } from "../lib/domain";
import { patientName, Stat, Status, UnitPicker } from "./shared";

export function ProfessionalView({ state, unit, onUnit, run }: { state: DemoState; unit: UnitId | "all"; onUnit: (unit: UnitId | "all") => void; run: (command: Command) => void }) {
  const [professionalId, setProfessionalId] = useState(state.professionals[0].id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const professional = state.professionals.find((item) => item.id === professionalId)!;
  const appointments = state.appointments.filter((item) => item.professionalId === professionalId && (unit === "all" || item.unitId === unit)).sort((a, b) => (a.day + a.time).localeCompare(b.day + b.time));
  const pending = appointments.filter((item) => item.status === "confirmed" && !item.evolution);
  const selected = appointments.find((item) => item.id === selectedId);

  return <>
    <div className="view-header"><div><span className="kicker">PROFISSIONAL · ACESSO SIMULADO</span><h1>Minha agenda</h1><p>Atendimentos vinculados ao profissional selecionado e evoluções fictícias.</p></div><div className="control-group"><label className="picker-label">Profissional<select value={professionalId} onChange={(event) => { setProfessionalId(event.target.value); setSelectedId(null); }}>{state.professionals.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><UnitPicker value={unit} onChange={onUnit}/></div></div>
    <div className="warning"><strong>Simulação de acesso.</strong> A troca de perfil nesta versão não é autenticação. Não inserir informações clínicas ou pessoais reais.</div>
    <div className="stats"><Stat label="Agenda individual" value={appointments.length} note={professional.specialty}/><Stat label="Confirmados" value={appointments.filter((item) => item.status === "confirmed").length} note="Prontuário liberado"/><Stat label="Evoluções pendentes" value={pending.length} note="Somente atendimentos confirmados"/><Stat label="Evoluções concluídas" value={appointments.filter((item) => !!item.evolution).length} note="Conteúdo fictício"/></div>
    <div className="split">
      <section className="surface"><div className="section-heading"><div><h2>Atendimentos</h2><p>Selecione um confirmado para registrar ou visualizar a evolução.</p></div></div><div className="appointment-list">{appointments.map((item) => <button className={`clinical-row ${selectedId === item.id ? "selected" : ""}`} key={item.id} onClick={() => { setSelectedId(item.id); setNote(""); }}><span className="appointment-time"><strong>{item.time}</strong><small>{UNIT_NAMES[item.unitId]}</small></span><span className="appointment-details"><strong>{patientName(state, item)}</strong><small>{professional.specialty} · {item.day.split("-").reverse().join("/")}</small></span><Status status={item.status}/></button>)}</div></section>
      <section className="surface clinical-panel"><div className="section-heading"><div><h2>Prontuário demonstrativo</h2><p>Apenas pacientes da agenda vinculada.</p></div></div>{!selected ? <div className="empty">Selecione um atendimento da sua agenda.</div> : selected.status !== "confirmed" ? <div className="empty">A recepção precisa confirmar o atendimento antes de liberar o prontuário.</div> : <div><span className="kicker">{patientName(state, selected)} · {selected.id}</span><h3>{selected.evolution ? "Evolução registrada" : "Evolução pendente"}</h3>{selected.evolution ? <p className="clinical-note">{selected.evolution}</p> : <form onSubmit={(event) => { event.preventDefault(); run({ type: "evolve", appointmentId: selected.id, professionalId, note, actor: professional.name }); setNote(""); }}><label className="field">Evolução fictícia<textarea required minLength={10} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Exemplo demonstrativo, sem informações reais de saúde" rows={6}/></label><button className="button button-primary">Registrar evolução</button></form>}<div className="history"><h3>Histórico demonstrativo do paciente</h3>{state.appointments.filter((item) => item.patientId === selected.patientId && item.professionalId === professionalId && item.status === "confirmed").map((item) => <p key={item.id}>{item.day.split("-").reverse().join("/")} · {UNIT_NAMES[item.unitId]} · {item.evolution ? "Evolução registrada" : "Evolução pendente"}</p>)}</div></div>}</section>
    </div>
    {state.policies.notifyOnClinicalPending ? <section className="surface"><h2>Alertas de prontuários pendentes</h2><div className="pending-grid">{pending.map((item) => <div className="pending-card" key={item.id}><span className="dot"/><div><strong>{patientName(state, item)}</strong><small>{item.day.split("-").reverse().join("/")} · {item.time} · {UNIT_NAMES[item.unitId]}</small></div></div>)}{!pending.length ? <p className="muted">Nenhuma evolução pendente.</p> : null}</div></section> : null}
  </>;
}
