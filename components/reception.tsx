"use client";

import { useState } from "react";
import { DEMO_DAY, hasPriorPending, pendingItems, UNIT_NAMES, type Command, type DemoState, type UnitId } from "../lib/domain";
import { patientName, professionalName, ReasonDialog, Stat, Status, UnitPicker } from "./shared";

export function Reception({ state, unit, onUnit, selectedDay, onDay, run, onManagement, onFocus, focusAppointmentId, onResolveBlock, onReturn }: {
  state: DemoState;
  unit: UnitId | "all";
  onUnit: (unit: UnitId | "all") => void;
  selectedDay: string;
  onDay: (day: string) => void;
  run: (command: Command) => boolean;
  onManagement: () => void;
  onFocus: (day: string, id: string) => void;
  focusAppointmentId?: string | null;
  onResolveBlock?: (id: string, target: "professional" | "finance") => void;
  onReturn?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [reasonAction, setReasonAction] = useState<{ id: string; type: "reverse" | "cancel" } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
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
    .filter((item) => item.id === focusAppointmentId || (unit === "all" || item.unitId === unit) && (filter === "all" || item.status === filter) && (!selectedDay || item.day === selectedDay) && patientName(state, item).toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (a.day + a.time).localeCompare(b.day + b.time));
  const focused = state.appointments.find((item) => item.id === focusAppointmentId);
  const pending = pendingItems(state, unit).filter((item) => item.kind !== "clinical").map((item) => item.appointment);
  const priorPending = (item: typeof state.appointments[number]) => state.appointments.filter((prior) => prior.id !== item.id && prior.patientId === item.patientId && prior.status === "scheduled" && (prior.day < item.day || prior.day === item.day && prior.time < item.time)).sort((a, b) => (a.day + a.time).localeCompare(b.day + b.time));

  const humanDate = (day: string) => day.split("-").reverse().join("/");
  const humanTime = (time: string) => time.endsWith(":00") ? `${Number(time.slice(0, 2))}h` : time.replace(":", "h");

  return <>
    <div className="view-header"><div><span className="kicker">RECEPÇÃO · OPERAÇÃO DEMONSTRATIVA</span><h1>Agenda e atendimento</h1><p>Confirme, registre faltas e transfira atendimentos entre as duas unidades.</p></div><UnitPicker value={unit} onChange={onUnit}/></div>
    {focused ? <div className="context-banner"><strong>Atendimento de {patientName(state, focused)}, {humanDate(focused.day)} às {humanTime(focused.time)}, selecionado.</strong> {focused.status === "confirmed" && focused.evolution ? "Existe evolução clínica. O profissional deve invalidá-la com motivo antes da reversão." : state.financial.some((entry) => entry.appointmentId === focused.id && (entry.revenueReceived || entry.payoutPaid)) ? "Existe conciliação. O Financeiro deve reabrir o recebimento ou repasse antes da reversão." : "Confira o atendimento abaixo."}<div className="button-line">{focused.evolution && onResolveBlock ? <button className="button button-light" onClick={() => onResolveBlock(focused.id, "professional")}>Abrir prontuário</button> : null}{state.financial.some((entry) => entry.appointmentId === focused.id && (entry.revenueReceived || entry.payoutPaid)) && onResolveBlock ? <button className="button button-light" onClick={() => onResolveBlock(focused.id, "finance")}>Abrir financeiro</button> : null}{onReturn ? <button className="button button-light" onClick={onReturn}>Voltar ao contexto anterior</button> : null}</div></div> : null}
    <div className="warning"><strong>Ambiente público de demonstração.</strong> Cadastre somente nomes, carteiras e atendimentos fictícios. Os dados ficam neste navegador.</div>
    <details className="surface guide"><summary>Como usar a Recepção</summary><p>Confirme agendamentos para liberar o prontuário e gerar produção. Quando houver bloqueio, abra o atendimento anterior e confirme, corrija ou cancele. Faltas, transferências e reversões mantêm histórico demonstrativo.</p></details>
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
        return <article className={`appointment ${focusAppointmentId === item.id ? "appointment-focused" : ""}`} key={item.id}>
          <div className="appointment-time"><strong>{item.time}</strong><small>{item.day.split("-").reverse().join("/")}</small></div>
          <div className="appointment-details"><strong>{patientName(state, item)}</strong><small>{professionalName(state, item)} · {UNIT_NAMES[item.unitId]} · {state.patients.find((patient) => patient.id === item.patientId)?.insurance}</small>{blocked ? <em>{priorPending(item).map((prior) => <span key={prior.id}>Confirmação bloqueada: regularize o atendimento anterior deste paciente, agendado para {humanDate(prior.day)} às {humanTime(prior.time)}, ou solicite liberação à Gestão. <button className="button button-light" onClick={() => onFocus(prior.day, prior.id)}>Ver atendimento das {humanTime(prior.time)}</button></span>)}</em> : null}{item.exceptionReason ? <em>Liberação excepcional registrada</em> : null}</div>
          <Status status={item.status}/>
          <div className="row-actions">{item.status === "scheduled" ? <><button onClick={() => run({ type: "confirm", appointmentId: item.id, actor: "Recepção demonstrativa" })} className="button button-primary" disabled={blocked}>Confirmar</button><button className="button button-light" onClick={() => run({ type: "absence", appointmentId: item.id, actor: "Recepção demonstrativa" })}>Falta</button><select aria-label={`Transferir ${patientName(state, item)}`} value={item.unitId} onChange={(event) => run({ type: "transfer", appointmentId: item.id, unitId: event.target.value as UnitId, actor: "Recepção demonstrativa" })}><option value="u1">Unidade I</option><option value="u2">Unidade II</option></select><button className="button button-light" onClick={() => { setEditingId(item.id); setEditDay(item.day); setEditTime(item.time); setEditProfessional(item.professionalId); setEditUnit(item.unitId); setEditReason(""); }}>Editar</button>{!state.financial.some((entry) => entry.appointmentId === item.id) && !state.financialReversals.some((entry) => entry.appointmentId === item.id) && !item.clinicalHistory?.length && !state.audit.some((event) => event.appointmentId === item.id && !["SCHEDULE", "SEED"].includes(event.action)) ? <button className="button button-light" onClick={() => setDeleteId(item.id)}>Excluir agendamento</button> : null}</> : item.status !== "cancelled" ? <button className="button button-light" onClick={() => setReasonAction({ id: item.id, type: "reverse" })}>Desfazer {item.status === "confirmed" ? "confirmação" : "falta"}</button> : null}{item.status !== "cancelled" ? <button className="button button-light" onClick={() => setReasonAction({ id: item.id, type: "cancel" })}>Cancelar</button> : null}</div>
          {editingId === item.id ? <form className="form-grid" onSubmit={(event) => { event.preventDefault(); if (run({ type: "editAppointment", appointmentId: item.id, day: editDay, time: editTime, professionalId: editProfessional, unitId: editUnit, reason: editReason, actor: "Recepção demonstrativa" })) { setEditingId(null); onDay(editDay); } }}><label>Data<input type="date" required value={editDay} onChange={(event) => setEditDay(event.target.value)}/></label><label>Horário<input type="time" required value={editTime} onChange={(event) => setEditTime(event.target.value)}/></label><label>Profissional<select value={editProfessional} onChange={(event) => setEditProfessional(event.target.value)}>{state.professionals.map((professional) => <option key={professional.id} value={professional.id}>{professional.name}</option>)}</select></label><label>Unidade<select value={editUnit} onChange={(event) => setEditUnit(event.target.value as UnitId)}>{Object.entries(UNIT_NAMES).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label><label>Motivo<input required minLength={10} value={editReason} onChange={(event) => setEditReason(event.target.value)}/></label><button className="button button-primary">Salvar alteração</button><button type="button" className="button button-light" onClick={() => setEditingId(null)}>Fechar</button></form> : null}
        </article>;
      }) : <div className="empty">Nenhum atendimento para os filtros selecionados.</div>}</div>
    </section>
    {reasonAction ? (() => { const related = state.appointments.find((item) => item.id === reasonAction.id); const entry = state.financial.find((item) => item.appointmentId === reasonAction.id); const target = related?.evolution ? "professional" : entry?.revenueReceived || entry?.payoutPaid ? "finance" : null; return target ? <div className="dialog-backdrop"><div className="reason-dialog" role="dialog" aria-modal="true" aria-label="Operação bloqueada"><h2>Operação bloqueada</h2><p>{target === "professional" ? "Há evolução clínica ativa. O profissional precisa tratar o registro explicitamente antes de alterar o atendimento." : "Há recebimento ou repasse conciliado. O Financeiro precisa reabrir a conciliação antes de alterar o atendimento."}</p><p>Atendimento preservado para retorno após a correção.</p><div className="button-line"><button className="button button-light" onClick={() => setReasonAction(null)}>Voltar</button><button className="button button-primary" onClick={() => { onResolveBlock?.(reasonAction.id, target); setReasonAction(null); }}>Abrir {target === "professional" ? "prontuário" : "financeiro"}</button></div></div></div> : <ReasonDialog title={reasonAction.type === "reverse" ? "Desfazer atendimento" : "Cancelar atendimento"} onClose={() => setReasonAction(null)} onConfirm={(reason) => run({ type: reasonAction.type, appointmentId: reasonAction.id, reason, actor: "Recepção demonstrativa" })}/>; })() : null}
    {deleteId ? <div className="dialog-backdrop"><div className="reason-dialog" role="dialog" aria-modal="true" aria-label="Excluir agendamento"><h2>Excluir este agendamento?</h2><p>Apenas um agendamento ainda não confirmado e sem vínculos posteriores pode ser removido. A exclusão ficará registrada na auditoria demonstrativa.</p><div className="button-line"><button className="button button-light" onClick={() => setDeleteId(null)}>Manter agendamento</button><button className="button button-primary" onClick={() => { if (run({ type: "deleteAppointment", appointmentId: deleteId, actor: "Recepção demonstrativa" })) setDeleteId(null); }}>Sim, excluir agendamento</button></div></div></div> : null}
    <section className="surface"><div className="section-heading"><div><h2>Central de pendências</h2><p>Confirmações aguardando ação da recepção.</p></div></div><div className="pending-grid">{pending.map((item) => { const blocked = state.policies.blockOnPriorPending && hasPriorPending(state, item) && !item.exceptionReason; return <div className="pending-card" key={item.id}><span className="dot"/><div><strong>{patientName(state, item)}</strong><small>{item.day} · {item.time} · {UNIT_NAMES[item.unitId]} · {blocked ? "Bloqueio aplicável" : "A confirmar"}</small><div className="button-line"><button className="button button-light" onClick={() => onDay(item.day)}>Ver na agenda</button>{blocked ? <button className="button button-light" onClick={onManagement}>Solicitar liberação</button> : <button className="button button-primary" onClick={() => run({ type: "confirm", appointmentId: item.id, actor: "Recepção demonstrativa" })}>Confirmar</button>}</div></div></div>; })}{!pending.length ? <p className="muted">Nenhuma confirmação pendente.</p> : null}</div></section>
  </>;
}
