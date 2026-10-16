"use client";

import { useState } from "react";
import { hasPriorPending, pendingItems, totals, type Command, type DemoState, type UnitId, UNIT_NAMES } from "../lib/domain";
import { money, patientName, Stat, UnitPicker } from "./shared";

export function Management({ state, unit, onUnit, run, financeOnly = false }: { state: DemoState; unit: UnitId | "all"; onUnit: (unit: UnitId | "all") => void; run: (command: Command) => void; financeOnly?: boolean }) {
  const [reason, setReason] = useState<Record<string, string>>({});
  const [amount, setAmount] = useState(String(state.payoutRules.at(-1)?.amount ?? 18));
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const summary = totals(state, unit);
  const pending = pendingItems(state, unit);
  const entries = state.financial.filter((item) => unit === "all" || item.unitId === unit);
  const blocked = state.policies.blockOnPriorPending ? state.appointments.filter((item) => item.status === "scheduled" && !item.exceptionReason && hasPriorPending(state, item) && (unit === "all" || item.unitId === unit)) : [];
  const byProfessional = state.professionals.map((professional) => ({
    professional,
    entries: entries.filter((item) => item.professionalId === professional.id),
  }));

  function askMaia() {
    const input = question.toLowerCase();
    if (input.includes("bloque") || input.includes("exce")) {
      setAnswer(`A regra de bloqueio está ${state.policies.blockOnPriorPending ? "ativa" : "inativa"} e há ${blocked.length} atendimentos bloqueados nesta visão. A gestão pode justificar uma liberação excepcional.`);
    } else {
      setAnswer(`Nesta visão, ${summary.scheduled} confirmações aguardam ação e ${summary.clinicalPending} prontuários estão pendentes. Trata-se somente de uma resposta simulada, sem avaliação clínica.`);
    }
  }

  if (financeOnly) return <>
    <div className="view-header"><div><span className="kicker">FINANCEIRO · DADOS FICTÍCIOS</span><h1>Produção e contas</h1><p>Produção independente do preenchimento do prontuário.</p></div><UnitPicker value={unit} onChange={onUnit}/></div>
    <div className="stats"><Stat label="Receita prevista" value={money(summary.expectedRevenue)}/><Stat label="Recebido" value={money(summary.receivedRevenue)}/><Stat label="Repasses a pagar" value={money(summary.payoutDue)}/></div>
    <section className="surface"><h2>Produção por profissional</h2><div className="table-scroll"><table><thead><tr><th>Profissional</th><th>Consultas</th><th>Receita prevista</th><th>Repasse</th></tr></thead><tbody>{byProfessional.map(({ professional, entries: rows }) => <tr key={professional.id}><td>{professional.name}</td><td>{rows.length}</td><td>{money(rows.reduce((sum, item) => sum + item.expectedRevenue, 0))}</td><td>{money(rows.reduce((sum, item) => sum + item.payout, 0))}</td></tr>)}</tbody></table></div></section>
    <section className="surface"><h2>Contas a receber e a pagar</h2><p>Conciliação demonstrativa, sem pagamentos reais.</p><div className="ledger">{entries.map((item) => <div className="ledger-item" key={item.id}><div><strong>{patientName(state, state.appointments.find((appointment) => appointment.id === item.appointmentId)!)}</strong><small>{UNIT_NAMES[item.unitId]} · {item.id}</small></div><div className="ledger-amount"><span>Receber {money(item.expectedRevenue)}</span><button className="button button-light" disabled={item.revenueReceived} onClick={() => run({ type: "settle", entryId: item.id, field: "revenueReceived", actor: "Financeiro demonstrativo" })}>{item.revenueReceived ? "Recebido" : "Marcar recebido"}</button>{item.revenueReceived ? <button className="button button-light" onClick={() => { const reason = window.prompt("Motivo para reabrir o recebimento:"); if (reason !== null) run({ type: "reopenSettlement", entryId: item.id, field: "revenueReceived", reason, actor: "Financeiro demonstrativo" }); }}>Reabrir</button> : null}</div><div className="ledger-amount"><span>Pagar {money(item.payout)}</span><button className="button button-light" disabled={item.payoutPaid} onClick={() => run({ type: "settle", entryId: item.id, field: "payoutPaid", actor: "Financeiro demonstrativo" })}>{item.payoutPaid ? "Pago" : "Marcar pago"}</button>{item.payoutPaid ? <button className="button button-light" onClick={() => { const reason = window.prompt("Motivo para reabrir o pagamento:"); if (reason !== null) run({ type: "reopenSettlement", entryId: item.id, field: "payoutPaid", reason, actor: "Financeiro demonstrativo" }); }}>Reabrir</button> : null}</div></div>)}{!entries.length ? <p className="empty">Nenhum lançamento nesta unidade.</p> : null}</div></section>
    <section className="surface"><h2>Regra de repasse</h2><form className="inline-form" onSubmit={(event) => { event.preventDefault(); run({ type: "payoutRule", amount: Number(amount), actor: "Financeiro demonstrativo" }); }}><label>Repasse por consulta (R$)<input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)}/></label><button className="button button-light">Atualizar para novas confirmações</button></form></section>
  </>;

  return <>
    <div className="view-header"><div><span className="kicker">GESTÃO · VISÃO DEMONSTRATIVA</span><h1>Painel de gestão</h1><p>Operação e pendências por unidade ou consolidado.</p></div><UnitPicker value={unit} onChange={onUnit}/></div>
    <div className="stats"><Stat label="Confirmados" value={summary.confirmed} note="Atendimentos únicos"/><Stat label="Agendados" value={summary.scheduled} note="Aguardando confirmação"/><Stat label="Faltas" value={summary.absent} note="Registradas na recepção"/><Stat label="Pendências clínicas" value={summary.clinicalPending} note="Sem bloquear o financeiro"/></div>
    <section className="surface"><div className="section-heading"><div><h2>Supervisão financeira</h2><p>Indicadores consolidados, com operação detalhada no ambiente Financeiro.</p></div></div><div className="stats"><Stat label="Produção prevista" value={money(summary.expectedRevenue)} note="Atendimentos confirmados"/><Stat label="Recebido" value={money(summary.receivedRevenue)} note="Conciliação simulada"/><Stat label="Repasses a pagar" value={money(summary.payoutDue)} note="Sem dependência do prontuário"/></div></section>
    <section className="surface"><h2>Unidades</h2>{(["u1", "u2"] as const).map((id) => { const item = totals(state, id); return <div className="unit-summary" key={id}><strong>{UNIT_NAMES[id]}</strong><span>{item.confirmed} confirmados · {item.absent} faltas · {item.clinicalPending} evoluções pendentes</span></div>; })}</section>
    <section className="surface"><div className="section-heading"><div><h2>Acompanhamento de pendências</h2><p>Confirmações e evoluções desta visão, sem conteúdo clínico.</p></div></div><div className="pending-grid">{pending.map(({ appointment: item, kind }) => <div className="pending-card" key={item.id}><span className="dot"/><div><strong>{kind === "blocked" ? "Confirmação bloqueada" : kind === "confirmation" ? "Confirmar atendimento" : "Evolução pendente"}</strong><small>{patientName(state, item)} · {UNIT_NAMES[item.unitId]} · {item.day} {item.time}</small></div></div>)}{!pending.length ? <p className="muted">Nenhuma pendência nesta visão.</p> : null}</div></section>
    <div className="split">
      <section className="surface"><div className="section-heading"><div><h2>Regras e notificações</h2><p>Configuração da gestão com trilha de auditoria.</p></div></div><div className="settings">
        {([["blockOnPriorPending", "Bloquear confirmação se houver atendimento anterior pendente"],["notifyOnClinicalPending", "Alertar evolução clínica pendente"],["notifyOnConfirmationPending", "Alertar confirmação pendente"]] as const).map(([key, label]) => <label className="toggle" key={key}><span>{label}</span><input type="checkbox" checked={state.policies[key]} onChange={(event) => run({ type: "policy", key, enabled: event.target.checked, actor: "Gestão demonstrativa" })}/></label>)}
      </div></section>
    </div>
    <div className="split">
      <section className="surface"><div className="section-heading"><div><h2>Bloqueios e liberações excepcionais</h2><p>Justificativa obrigatória e ação auditada.</p></div></div>{blocked.length ? blocked.map((item) => <form className="exception" key={item.id} onSubmit={(event) => { event.preventDefault(); run({ type: "exception", appointmentId: item.id, reason: reason[item.id] ?? "", actor: "Gestão demonstrativa" }); setReason((current) => ({ ...current, [item.id]: "" })); }}><strong>{patientName(state, item)} · {UNIT_NAMES[item.unitId]}</strong><label>Justificativa<input required minLength={10} value={reason[item.id] ?? ""} onChange={(event) => setReason((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="Motivo demonstrativo da liberação"/></label><button className="button button-primary">Liberar</button></form>) : <p className="empty">Nenhum bloqueio aplicável nesta visão. Ative a regra e tente confirmar o segundo agendamento do Paciente Exemplo A.</p>}</section>
      <section className="surface maia-panel"><span className="kicker">MAIA · MODO DEMONSTRATIVO</span><h2>O que você quer acompanhar?</h2><p>Respostas simuladas com os indicadores locais. Sem IA externa e sem orientação clínica.</p><div className="suggestions">{["Pendências de hoje", "Atendimentos por unidade", "Bloqueios e exceções"].map((sample) => <button className="chip" key={sample} onClick={() => setQuestion(sample)}>{sample}</button>)}</div><form className="maia-form" onSubmit={(event) => { event.preventDefault(); askMaia(); }}><input aria-label="Perguntar à Maia" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Pergunte sobre a demonstração"/><button className="button button-primary">Perguntar</button></form>{answer ? <div className="maia-answer">{answer}</div> : null}</section>
    </div>
    <section className="surface"><div className="section-heading"><div><h2>Trilha de auditoria demonstrativa</h2><p>Sem texto clínico, com ator, ação e referência.</p></div></div><div className="audit-list">{state.audit.slice().reverse().slice(0, 12).map((item) => <div key={item.id}><strong>{item.action}</strong><span>{item.detail}</span><small>{item.actor} · {new Date(item.at).toLocaleString("pt-BR")} {item.appointmentId ? `· ${item.appointmentId}` : ""}</small></div>)}</div></section>
  </>;
}
