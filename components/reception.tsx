"use client";

import { useState } from "react";
import { DEMO_DAY, hasPriorPending, UNIT_NAMES, type Command, type DemoState, type UnitId } from "../lib/domain";
import { patientName, professionalName, Stat, Status, UnitPicker } from "./shared";

export function Reception({ state, unit, onUnit, run }: {
  state: DemoState;
  unit: UnitId | "all";
  onUnit: (unit: UnitId | "all") => void;
  run: (command: Command) => boolean;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [queryDay, setQueryDay] = useState(DEMO_DAY);
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
    .filter((item) => (unit === "all" || item.unitId === unit) && (filter === "all" || item.status === filter) && (!queryDay || item.day === queryDay))
    .filter((item) => patientName(state, item).toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (a.day + a.time).localeCompare(b.day + b.time));
  const pending = state.appointments.filter((item) => item.status === "scheduled" && (unit === "all" || item.unitId === unit));

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
      {showSchedule ? <form className="form-grid" onSubmit={(event) => { event.preventDefault(); if (run({ type: "schedule", patientId, professionalId, unitId: bookingUnit, day, time, actor: "Recepção demonstrativa" })) { setShowSchedule(false); setQueryDay(day); } }}>
        <label>Paciente<select value={patientId} onChange={(event) => setPatientId(event.target.value)}>{state.patients.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Profissional<select value={professionalId} onChange={(event) => setProfessionalId(event.target.value)}>{state.professionals.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Unidade<select value={bookingUnit} onChange={(event) => setBookingUnit(event.target.value as UnitId)}>{Object.entries(UNIT_NAMES).map(([id, value]) => <option key={id} value={id}>{value}</option>)}</select></label>
        <label>Data<input type="date" value={day} onChange={(event) => setDay(event.target.value)}/></label>
        <label>Horário<input type="time" value={time} onChange={(event) => setTime(event.target.value)}/></label>
        <button className="button button-primary">Criar agendamento</button>
      </form> : null}
      <div className="filters"><input aria-label="Buscar paciente" placeholder="Buscar paciente fictício" value={query} onChange={(event) => setQuery(event.target.value)}/><input aria-label="Filtrar data" type="date" value={queryDay} onChange={(event) => setQueryDay(event.target.value)}/><select aria-label="Filtrar status" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Todos os status</option><option value="scheduled">A confirmar</option><option value="confirmed">Confirmado</option><option value="absent">Falta</option></select></div>
      <div className="appointment-list">{appointments.length ? appointments.map((item) => {
        const blocked = state.policies.blockOnPriorPending && hasPriorPending(state, item) && !item.exceptionReason;
        return <article className="appointment" key={item.id}>
          <div className="appointment-time"><strong>{item.time}</strong><small>{item.day.split("-").reverse().join("/")}</small></div>
          <div className="appointment-details"><strong>{patientName(state, item)}</strong><small>{professionalName(state, item)} · {UNIT_NAMES[item.unitId]} · {state.patients.find((patient) => patient.id === item.patientId)?.insurance}</small>{blocked ? <em>Bloqueado: confirmação anterior pendente. Gestão pode liberar.</em> : null}{item.exceptionReason ? <em>Liberação excepcional registrada</em> : null}</div>
          <Status status={item.status}/>
          <div className="row-actions">{item.status === "scheduled" ? <><button onClick={() => run({ type: "confirm", appointmentId: item.id, actor: "Recepção demonstrativa" })} className="button button-primary" disabled={blocked}>Confirmar</button><button className="button button-light" onClick={() => run({ type: "absence", appointmentId: item.id, actor: "Recepção demonstrativa" })}>Falta</button><select aria-label={`Transferir ${patientName(state, item)}`} value={item.unitId} onChange={(event) => run({ type: "transfer", appointmentId: item.id, unitId: event.target.value as UnitId, actor: "Recepção demonstrativa" })}><option value="u1">Unidade I</option><option value="u2">Unidade II</option></select></> : <span className="muted">Sem ações pendentes</span>}</div>
        </article>;
      }) : <div className="empty">Nenhum atendimento para os filtros selecionados.</div>}</div>
    </section>
    <section className="surface"><div className="section-heading"><div><h2>Central de pendências</h2><p>Confirmações aguardando ação da recepção.</p></div></div><div className="pending-grid">{pending.map((item) => <div className="pending-card" key={item.id}><span className="dot"/><div><strong>{patientName(state, item)}</strong><small>{item.time} · {UNIT_NAMES[item.unitId]} · {hasPriorPending(state, item) && state.policies.blockOnPriorPending ? "Bloqueio aplicável" : "A confirmar"}</small></div></div>)}</div></section>
  </>;
}
