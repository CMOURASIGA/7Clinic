"use client";

import { useState } from "react";
import { DEMO_DAY, hasPriorPending, pendingItems, UNIT_NAMES, type Command, type DemoState, type UnitId } from "../lib/domain";
import { patientName, professionalName, Stat, Status, UnitPicker } from "./shared";

export function Reception({ state, unit, onUnit, selectedDay, onDay, run, onManagement }: {
  state: DemoState;
  unit: UnitId | "all";
  onUnit: (unit: UnitId | "all") => void;
  selectedDay: string;
  onDay: (day: string) => void;
  run: (command: Command) => boolean;
  onManagement: () => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editReason, setEditReason] = useState("");
  const [editDay, setEditDay] = useState(DEMO_DAY);
  const [editTime, setEditTime] = useState("08:00");
  const [editProfessional, setEditProfessional] = useState(state.professionals[0].id);
  const [editUnit, setEditUnit] = useState<UnitId>("u1");
  const [showPatient, setShowPatient] = useState(false);
  const [name, setName] = useState("");
  const [insurance, setInsurance] = useState("");
  const [card, setCard] = useState("");
  const [patientId, setPatientId] = useState(state.patients[0].id);
  const [professionalId, setProfessionalId] = useState(state.professionals[0].id);
  const [bookingUnit, setBookingUnit] = useState<UnitId>("u1");
  const [time, setTime] = useState("13:00");
  const [day, setDay] = useState(DEMO_DAY);
  const [showSchedule, setShowSchedule] = useState(false);
  const appointments = state.appointments
    .filter((item) => (unit === "all" || item.unitId === unit) && (filter === "all" || item.status === filter) && (!selectedDay || item.day === selectedDay))
    .filter((item) => patientName(state, item).toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (a.day + a.time).localeCompare(b.day + b.time));
  const pending = pendingItems(state, unit).filter((item) => item.kind !== "clinical").map((item) => item.appointment);

  return <>
    <div className="view-header"><div><span className="kicker">RECEPÇÃO · OPERAÇÃO DEMONSTRATIVA</span><h1>Agenda e atendimento</h1><p>Confirme, registre faltas e transfira atendimentos entre as duas unidades.</p></div><UnitPicker value={unit} onChange={onUnit}/></div>
    <div className="warning"><strong>Ambiente público de demonstração.</strong> Cadastre somente nomes, carteiras e atendimentos fictícios. Os dados ficam neste navegador.</div>
    <div className="stats">
      <Stat label="Agendados" value={pending.length} note="Aguardando confirmação"/>
      <Stat label="Confirmados" value={state.appointments.filter((item) => item.status === "confirmed" && (unit === "all" || item.unitId === unit)).length} note="Prontuário e produção liberados"/>
      <Stat label="Faltas" value={state.appointments.filter((item) => item.status === "absent" && (unit === "all" || item.unitId === unit)).length} note="Sem produção gerada"/>
      <Stat label="Bloqueio" value={state.policies.blockOnPriorPending ? "Ativo" : "Inativo"} note="Configurado pela gestão"/>
    </div>
    <section className="surface">
      <div className="section-heading"><div><h2>Agenda</h2><p>Pacientes e convênios fictícios. Data-base: 16/10/2026.</p></div><div className="button-line"><button className="button button-light" onClick={() => setShowPatient(!showPatient)}>+ Paciente</button><button className="button button-primary" onClick={() => setShowSchedule(!showSchedule)}>+ Agendar</button></div></div>
      {showPatient ? <form className="form-grid" onSubmit={(event) => { event.preventDefault(); if (run({ type: "registerPatient", name, insurance, card, actor: "Recepção demonstrativa" })) { setShowPatient(false); setName(""); setInsurance(""); setCard(""); } }}>
        <label>Nome fictício<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Paciente Exemplo E"/></label>
        <label>Convênio fictício<input required value={insurance} onChange={(event) => setInsurance(event.target.value)} placeholder="Convênio Exemplo"/></label>
        <label>Carteira fictícia<input required value={card} onChange={(event) => setCard(event.target.value)} placeholder="DEMO-005"/></label>
        <button className="button button-primary">Cadastrar</button>
      </form> : null}
      {showSchedule ? <form className="form-grid" onSubmit={(event) => { event.preventDefault(); if (run({ type: "schedule", patientId, professionalId, unitId: bookingUnit, day, time, actor: "Recepção demonstrativa" })) { setShowSchedule(false); onDay(day); } }}>
        <label>Paciente<select value={patientId} onChange={(event) => setPatientId(event.target.value)}>{state.patients.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Profissional<select value={professionalId} onChange={(event) => setProfessionalId(event.target.value)}>{state.professionals.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Unidade<select value={bookingUnit} onChange={(event) => setBookingUnit(event.target.value as UnitId)}>{Object.entries(UNIT_NAMES).map(([id, value]) => <option key={id} value={id}>{value}</option>)}</select></label>
        <label>Data<input type="date" value={day} onChange={(event) => setDay(event.target.value)}/></label>
        <label>Horário<input type="time" value={time} onChange={(event) => setTime(event.target.value)}/></label>
        <button className="button button-primary">Criar agendamento</button>
      </form> : null}
      <div className="filters"><input aria-label="Buscar paciente" placeholder="Buscar paciente fictício" value={query} onChange={(event) => setQuery(event.target.value)}/><input aria-label="Filtrar data" type="date" value={selectedDay} onChange={(event) => onDay(event.target.value)}/><select aria-label="Filtrar status" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Todos os status</option><option value="scheduled">A confirmar</option><option value="confirmed">Confirmado</option><option value="absent">Falta</option><option value="cancelled">Cancelado</option></select></div>
      <div className="appointment-list">{appointments.length ? appointments.map((item) => {
        const blocked = item.status === "scheduled" && state.policies.blockOnPriorPending && hasPriorPending(state, item) && !item.exceptionReason;
        return <article className="appointment" key={item.id}>
          <div className="appointment-time"><strong>{item.time}</strong><small>{item.day.split("-").reverse().join("/")}</small></div>
          <div className="appointment-details"><strong>{patientName(state, item)}</strong><small>{professionalName(state, item)} · {UNIT_NAMES[item.unitId]} · {state.patients.find((patient) => patient.id === item.patientId)?.insurance}</small>{blocked ? <em>Bloqueado: confirmação anterior pendente. Gestão pode liberar.</em> : null}{item.exceptionReason ? <em>Liberação excepcional registrada</em> : null}</div>
          <Status status={item.status}/>
          <div className="row-actions">{item.status === "scheduled" ? <><button onClick={() => run({ type: "confirm", appointmentId: item.id, actor: "Recepção demonstrativa" })} className="button button-primary" disabled={blocked}>Confirmar</button><button className="button button-light" onClick={() => run({ type: "absence", appointmentId: item.id, actor: "Recepção demonstrativa" })}>Falta</button><select aria-label={`Transferir ${patientName(state, item)}`} value={item.unitId} onChange={(event) => run({ type: "transfer", appointmentId: item.id, unitId: event.target.value as UnitId, actor: "Recepção demonstrativa" })}><option value="u1">Unidade I</option><option value="u2">Unidade II</option></select><button className="button button-light" onClick={() => { setEditingId(item.id); setEditDay(item.day); setEditTime(item.time); setEditProfessional(item.professionalId); setEditUnit(item.unitId); setEditReason(""); }}>Editar</button></> : item.status !== "cancelled" ? <button className="button button-light" onClick={() => { const reason = window.prompt("Motivo da reversão (mínimo 10 caracteres):"); if (reason !== null) run({ type: "reverse", appointmentId: item.id, reason, actor: "Recepção demonstrativa" }); }}>Desfazer {item.status === "confirmed" ? "confirmação" : "falta"}</button> : null}{item.status !== "cancelled" ? <button className="button button-light" onClick={() => { const reason = window.prompt("Motivo do cancelamento (mínimo 10 caracteres):"); if (reason !== null) run({ type: "cancel", appointmentId: item.id, reason, actor: "Recepção demonstrativa" }); }}>Cancelar</button> : null}</div>
          {editingId === item.id ? <form className="form-grid" onSubmit={(event) => { event.preventDefault(); if (run({ type: "editAppointment", appointmentId: item.id, day: editDay, time: editTime, professionalId: editProfessional, unitId: editUnit, reason: editReason, actor: "Recepção demonstrativa" })) { setEditingId(null); onDay(editDay); } }}><label>Data<input type="date" required value={editDay} onChange={(event) => setEditDay(event.target.value)}/></label><label>Horário<input type="time" required value={editTime} onChange={(event) => setEditTime(event.target.value)}/></label><label>Profissional<select value={editProfessional} onChange={(event) => setEditProfessional(event.target.value)}>{state.professionals.map((professional) => <option key={professional.id} value={professional.id}>{professional.name}</option>)}</select></label><label>Unidade<select value={editUnit} onChange={(event) => setEditUnit(event.target.value as UnitId)}>{Object.entries(UNIT_NAMES).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label><label>Motivo<input required minLength={10} value={editReason} onChange={(event) => setEditReason(event.target.value)}/></label><button className="button button-primary">Salvar alteração</button><button type="button" className="button button-light" onClick={() => setEditingId(null)}>Fechar</button></form> : null}
        </article>;
      }) : <div className="empty">Nenhum atendimento para os filtros selecionados.</div>}</div>
    </section>
    <section className="surface"><div className="section-heading"><div><h2>Central de pendências</h2><p>Confirmações aguardando ação da recepção.</p></div></div><div className="pending-grid">{pending.map((item) => { const blocked = state.policies.blockOnPriorPending && hasPriorPending(state, item) && !item.exceptionReason; return <div className="pending-card" key={item.id}><span className="dot"/><div><strong>{patientName(state, item)}</strong><small>{item.day} · {item.time} · {UNIT_NAMES[item.unitId]} · {blocked ? "Bloqueio aplicável" : "A confirmar"}</small><div className="button-line"><button className="button button-light" onClick={() => onDay(item.day)}>Ver na agenda</button>{blocked ? <button className="button button-light" onClick={onManagement}>Solicitar liberação</button> : <button className="button button-primary" onClick={() => run({ type: "confirm", appointmentId: item.id, actor: "Recepção demonstrativa" })}>Confirmar</button>}</div></div></div>; })}{!pending.length ? <p className="muted">Nenhuma confirmação pendente.</p> : null}</div></section>
  </>;
}
