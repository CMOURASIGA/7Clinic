"use client";

import { useState } from "react";
import { hasPriorPending, totals, type Command, type DemoState, type UnitId, UNIT_NAMES } from "../lib/domain";
import { money, patientName, Stat, UnitPicker } from "./shared";

export function Management({ state, unit, onUnit, run }: { state: DemoState; unit: UnitId | "all"; onUnit: (unit: UnitId | "all") => void; run: (command: Command) => void }) {
  const [reason, setReason] = useState<Record<string, string>>({});
  const [amount, setAmount] = useState(String(state.payoutRules.at(-1)?.amount ?? 18));
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const summary = totals(state, unit);
  const entries = state.financial.filter((item) => unit === "all" || item.unitId === unit);
  const blocked = state.policies.blockOnPriorPending ? state.appointments.filter((item) => item.status === "scheduled" && !item.exceptionReason && hasPriorPending(state, item) && (unit === "all" || item.unitId === unit)) : [];
  const byProfessional = state.professionals.map((professional) => ({
    professional,
    entries: entries.filter((item) => item.professionalId === professional.id),
  }));

  function askMaia() {
    const input = question.toLowerCase();
    if (input.includes("finance") || input.includes("receita") || input.includes("repasse")) {
      setAnswer(`Na visão selecionada, há ${money(summary.expectedRevenue)} de receita prevista, ${money(summary.receivedRevenue)} recebida e ${money(summary.payoutDue)} de repasses a pagar. Os valores não dependem do preenchimento clínico.`);
    } else if (input.includes("bloque") || input.includes("exce")) {
      setAnswer(`A regra de bloqueio está ${state.policies.blockOnPriorPending ? "ativa" : "inativa"} e há ${blocked.length} atendimentos bloqueados nesta visão. A gestão pode justificar uma liberação excepcional.`);
    } else {
      setAnswer(`Nesta visão, ${summary.scheduled} confirmações aguardam ação e ${summary.clinicalPending} prontuários estão pendentes. Trata-se somente de uma resposta simulada, sem avaliação clínica.`);
    }
  }

  return <>
    <div className="view-header"><div><span className="kicker">GESTÃO · VISÃO DEMONSTRATIVA</span><h1>Painel de gestão</h1><p>Operação, produção financeira e pendências por unidade ou consolidado.</p></div><UnitPicker value={unit} onChange={onUnit}/></div>
    <div className="stats"><Stat label="Confirmados" value={summary.confirmed} note="Atendimentos únicos"/><Stat label="Receita prevista" value={money(summary.expectedRevenue)} note={`Recebido: ${money(summary.receivedRevenue)}`}/><Stat label="Repasses a pagar" value={money(summary.payoutDue)} note="Por consulta confirmada"/><Stat label="Pendências clínicas" value={summary.clinicalPending} note="Sem bloquear o financeiro"/></div>
    <div className="split">
      <section className="surface"><div className="section-heading"><div><h2>Produção por profissional</h2><p>Valores fictícios; uma confirmação gera um lançamento.</p></div></div><div className="table-scroll"><table><thead><tr><th>Profissional</th><th>Consultas</th><th>Receita prevista</th><th>Repasse</th></tr></thead><tbody>{byProfessional.map(({ professional, entries: rows }) => <tr key={professional.id}><td>{professional.name}</td><td>{rows.length}</td><td>{money(rows.reduce((sum, item) => sum + item.expectedRevenue, 0))}</td><td>{money(rows.reduce((sum, item) => sum + item.payout, 0))}</td></tr>)}</tbody></table></div></section>
      <section className="surface"><div className="section-heading"><div><h2>Unidades</h2><p>Conferência sem duplicidade.</p></div></div>{(["u1", "u2"] as const).map((id) => { const item = totals(state, id); return <div className="unit-summary" key={id}><strong>{UNIT_NAMES[id]}</strong><span>{item.confirmed} confirmados · {item.absent} faltas</span><b>{money(item.expectedRevenue)}</b></div>; })}<div className="note">O repasse vigente é {money(state.payoutRules.at(-1)?.amount ?? 18)} por consulta. Histórico preservado.</div></section>
    </div>
    <section className="surface"><div className="section-heading"><div><h2>Acompanhamento de pendências</h2><p>Confirmações e evoluções desta visão, sem conteúdo clínico.</p></div></div><div className="pending-grid">{state.appointments.filter((item) => (unit === "all" || item.unitId === unit) && (item.status === "scheduled" || (item.status === "confirmed" && !item.evolution))).map((item) => <div className="pending-card" key={item.id}><span className="dot"/><div><strong>{item.status === "scheduled" ? "Confirmar atendimento" : "Evolução pendente"}</strong><small>{patientName(state, item)} · {UNIT_NAMES[item.unitId]} · {item.time}</small></div></div>)}</div></section>
    <div className="split">
      <section className="surface"><div className="section-heading"><div><h2>Contas a receber e a pagar</h2><p>Conciliação manual demonstrativa, sem processamento de pagamentos.</p></div></div><div className="ledger">{entries.map((item) => <div className="ledger-item" key={item.id}><div><strong>{patientName(state, state.appointments.find((appointment) => appointment.id === item.appointmentId)!)}</strong><small>{UNIT_NAMES[item.unitId]} · {item.id} · {state.professionals.find((professional) => professional.id === item.professionalId)?.name}</small></div><div className="ledger-amount"><span>Receber {money(item.expectedRevenue)}</span><button className="button button-light" disabled={item.revenueReceived} onClick={() => run({ type: "settle", entryId: item.id, field: "revenueReceived", actor: "Gestão demonstrativa" })}>{item.revenueReceived ? "Recebido" : "Marcar recebido"}</button></div><div className="ledger-amount"><span>Pagar {money(item.payout)}</span><button className="button button-light" disabled={item.payoutPaid} onClick={() => run({ type: "settle", entryId: item.id, field: "payoutPaid", actor: "Gestão demonstrativa" })}>{item.payoutPaid ? "Pago" : "Marcar pago"}</button></div></div>)}{!entries.length ? <p className="empty">Nenhum lançamento nesta unidade.</p> : null}</div></section>
      <section className="surface"><div className="section-heading"><div><h2>Regras e notificações</h2><p>Configuração da gestão com trilha de auditoria.</p></div></div><div className="settings">
        {([["blockOnPriorPending", "Bloquear confirmação se houver atendimento anterior pendente"],["notifyOnClinicalPending", "Alertar evolução clínica pendente"],["notifyOnConfirmationPending", "Alertar confirmação pendente"]] as const).map(([key, label]) => <label className="toggle" key={key}><span>{label}</span><input type="checkbox" checked={state.policies[key]} onChange={(event) => run({ type: "policy", key, enabled: event.target.checked, actor: "Gestão demonstrativa" })}/></label>)}
        <form className="inline-form" onSubmit={(event) => { event.preventDefault(); run({ type: "payoutRule", amount: Number(amount), actor: "Gestão demonstrativa" }); }}><label>Repasse por consulta (R$)<input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)}/></label><button className="button button-light">Atualizar para novas confirmações</button></form>
      </div></section>
    </div>
    <div className="split">
      <section className="surface"><div className="section-heading"><div><h2>Bloqueios e liberações excepcionais</h2><p>Justificativa obrigatória e ação auditada.</p></div></div>{blocked.length ? blocked.map((item) => <form className="exception" key={item.id} onSubmit={(event) => { event.preventDefault(); run({ type: "exception", appointmentId: item.id, reason: reason[item.id] ?? "", actor: "Gestão demonstrativa" }); setReason((current) => ({ ...current, [item.id]: "" })); }}><strong>{patientName(state, item)} · {UNIT_NAMES[item.unitId]}</strong><label>Justificativa<input required minLength={10} value={reason[item.id] ?? ""} onChange={(event) => setReason((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="Motivo demonstrativo da liberação"/></label><button className="button button-primary">Liberar</button></form>) : <p className="empty">Nenhum bloqueio aplicável nesta visão. Ative a regra e tente confirmar o segundo agendamento do Paciente Exemplo A.</p>}</section>
      <section className="surface maia-panel"><span className="kicker">MAIA · MODO DEMONSTRATIVO</span><h2>O que você quer acompanhar?</h2><p>Respostas simuladas com os indicadores locais. Sem IA externa e sem orientação clínica.</p><div className="suggestions">{["Pendências de hoje", "Receita e repasses", "Bloqueios e exceções"].map((sample) => <button className="chip" key={sample} onClick={() => setQuestion(sample)}>{sample}</button>)}</div><form className="maia-form" onSubmit={(event) => { event.preventDefault(); askMaia(); }}><input aria-label="Perguntar à Maia" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Pergunte sobre a demonstração"/><button className="button button-primary">Perguntar</button></form>{answer ? <div className="maia-answer">{answer}</div> : null}</section>
    </div>
    <section className="surface"><div className="section-heading"><div><h2>Trilha de auditoria demonstrativa</h2><p>Sem texto clínico, com ator, ação e referência.</p></div></div><div className="audit-list">{state.audit.slice().reverse().slice(0, 12).map((item) => <div key={item.id}><strong>{item.action}</strong><span>{item.detail}</span><small>{item.actor} · {new Date(item.at).toLocaleString("pt-BR")} {item.appointmentId ? `· ${item.appointmentId}` : ""}</small></div>)}</div></section>
  </>;
}
