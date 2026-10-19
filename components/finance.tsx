"use client";

import { useState } from "react";
import { type Command, type DemoState, type FinancialEntry, type UnitId, UNIT_NAMES } from "../lib/domain";
import { money, ReasonDialog, UnitPicker } from "./shared";
import { filterFinance, financeSummary, type FinanceFilters, type Account, type Situation } from "../lib/finance-selectors";

export function Finance({ state, unit, onUnit, run, focusAppointmentId, onReturn }: { state: DemoState; unit: UnitId | "all"; onUnit: (unit: UnitId | "all") => void; run: (command: Command) => boolean; focusAppointmentId?: string | null; onReturn?: () => void }) {
  const [filters, setFilters] = useState<FinanceFilters>({ professionalId: "", insurance: "", from: "", to: "", account: "all", situation: "all" });
  const [activeIndicator, setActiveIndicator] = useState<string | null>(null);
  const indicatorScope: Record<string, { account: Account; situation: Situation }> = {
    production: { account: "all", situation: "all" }, toReceive: { account: "receivable", situation: "open" },
    received: { account: "receivable", situation: "settled" }, toPay: { account: "payable", situation: "open" },
    paid: { account: "payable", situation: "settled" }, reversed: { account: "all", situation: "reversed" },
  };
  const detailFilters = activeIndicator ? { ...filters, ...indicatorScope[activeIndicator] } : filters;
  const { entries, reversals, receivable, payable } = filterFinance(state, unit, detailFilters);
  const summary = financeSummary(state, unit, filters);
  const detailSummary = financeSummary(state, unit, detailFilters);
  const [reopenAction, setReopenAction] = useState<{ item: FinancialEntry; field: "revenueReceived" | "payoutPaid" } | null>(null);
  const insuranceOptions = [...new Set(state.patients.map((patient) => patient.insurance))];
  const visibleIds = new Set([...entries.map((entry) => entry.appointmentId), ...reversals.map((entry) => entry.appointmentId)]);
  const audit = state.audit.filter((item) => ["SETTLE", "REOPEN_SETTLEMENT", "REVERSE", "CANCEL"].includes(item.action) && !!item.appointmentId && visibleIds.has(item.appointmentId));
  function update<K extends keyof FinanceFilters>(key: K, value: FinanceFilters[K]) { setActiveIndicator(null); setFilters((current) => ({ ...current, [key]: value })); }
  function selectIndicator(key: string) { setActiveIndicator((current) => current === key ? null : key); }
  const cards: { key: string; label: string; value: number; note: string; account: Account; situation: Situation }[] = [
    { key: "production", label: "Produção gerada filtrada", value: summary.production, note: `${summary.entries} lançamentos ativos`, account: "all", situation: "all" },
    { key: "toReceive", label: "A receber", value: summary.toReceive, note: "Contas abertas no filtro", account: "receivable", situation: "open" },
    { key: "received", label: "Recebido", value: summary.received, note: "Conciliação simulada", account: "receivable", situation: "settled" },
    { key: "toPay", label: "A pagar", value: summary.toPay, note: "Repasses abertos", account: "payable", situation: "open" },
    { key: "paid", label: "Repassado", value: summary.paid, note: "Repasses conciliados", account: "payable", situation: "settled" },
    { key: "reversed", label: "Revertido", value: summary.reversed, note: `${summary.reversals} reversões`, account: "all", situation: "reversed" },
  ];
  return <>
    <div className="view-header"><div><span className="kicker">FINANCEIRO · DADOS FICTÍCIOS</span><h1>Produção e contas</h1><p>Recebimentos e repasses simulados, independentes do prontuário.</p></div><UnitPicker value={unit} onChange={onUnit}/></div>
    {focusAppointmentId && onReturn ? <div className="context-banner">Lançamento do atendimento {focusAppointmentId} selecionado. <button className="button button-light" onClick={onReturn}>Voltar ao atendimento</button></div> : null}
    <div className="warning"><strong>Operação demonstrativa.</strong> Nenhum pagamento ou recebimento real é processado.</div>
    <details className="surface guide"><summary>Como usar o Financeiro</summary><p>A confirmação cria produção imediatamente. Recebimento e repasse têm conciliações independentes; reabra com motivo antes de uma reversão. Os históricos mostram as movimentações e os valores revertidos.</p></details>
    <section className="surface"><div className="section-heading"><div><h2>Filtros financeiros</h2><p>Período de atendimento, profissional, convênio, unidade, tipo de conta e situação.</p></div></div><div className="form-grid">
      <label>Profissional<select value={filters.professionalId} onChange={(event) => update("professionalId", event.target.value)}><option value="">Todos</option>{state.professionals.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label>Convênio<select value={filters.insurance} onChange={(event) => update("insurance", event.target.value)}><option value="">Todos</option>{insuranceOptions.map((name) => <option key={name}>{name}</option>)}</select></label>
      <label>De<input type="date" value={filters.from} onChange={(event) => update("from", event.target.value)}/></label>
      <label>Até<input type="date" value={filters.to} onChange={(event) => update("to", event.target.value)}/></label>
      <label>Conta<select value={filters.account} onChange={(event) => { setActiveIndicator(null); update("account", event.target.value as Account); }}><option value="all">Todas</option><option value="receivable">A receber</option><option value="payable">A pagar</option></select></label>
      <label>Situação<select value={filters.situation} onChange={(event) => { setActiveIndicator(null); update("situation", event.target.value as Situation); }}><option value="all">Todas</option><option value="open">Em aberto</option><option value="settled">Conciliadas</option><option value="reversed">Revertidas</option></select></label>
    </div>{activeIndicator ? <button className="button button-light" onClick={() => setActiveIndicator(null)}>Limpar indicador selecionado</button> : null}</section>
    <p className="muted">Produção é o valor gerado na confirmação. Recebimentos e repasses são conciliados separadamente. Reversões saem dos saldos ativos.</p>
    <div className="stats">{cards.map((card) => <button type="button" key={card.key} className={`stat stat-action ${activeIndicator === card.key ? "stat-selected" : ""}`} aria-pressed={activeIndicator === card.key} onClick={() => selectIndicator(card.key)}><span className="eyebrow">{card.label}</span><strong>{money(card.value)}</strong><small>{card.note}</small></button>)}</div>
    {activeIndicator ? <p className="muted" role="status">Detalhamento selecionado: {cards.find((card) => card.key === activeIndicator)?.label}. Valor no recorte: {money(detailSummary[activeIndicator as keyof typeof detailSummary] as number)}.</p> : null}
    <section className="surface"><div className="section-heading"><div><h2>Produção por profissional</h2><p>Uma consulta confirmada gera um lançamento ativo.</p></div></div><div className="table-scroll"><table><thead><tr><th>Profissional</th><th>Consultas</th><th>Receita prevista</th><th>Repasse</th></tr></thead><tbody>{state.professionals.map((professional) => { const rows = entries.filter((item) => item.professionalId === professional.id); return <tr key={professional.id}><td>{professional.name}</td><td>{rows.length}</td><td>{money(rows.reduce((sum, item) => sum + item.expectedRevenue, 0))}</td><td>{money(rows.reduce((sum, item) => sum + item.payout, 0))}</td></tr>; })}</tbody></table></div></section>
    <section className="surface"><div className="section-heading"><div><h2>Contas a receber e a pagar</h2><p>As duas contas têm estados independentes. Produção nos filtros: {money(detailSummary.production)}.</p></div></div><div className="ledger">{entries.map((item) => { const appointment = state.appointments.find((a) => a.id === item.appointmentId); const patient = state.patients.find((p) => p.id === appointment?.patientId); return <div className={`ledger-item ${focusAppointmentId === item.appointmentId ? "appointment-focused" : ""}`} key={item.id}><div><strong>{patient?.name ?? "Paciente fictício"}</strong><small>{appointment?.day} · {UNIT_NAMES[item.unitId]} · {patient?.insurance} · {item.id}</small></div>{receivable.includes(item) ? <div className="ledger-amount"><span>Receber {money(item.expectedRevenue)}</span><small>{item.revenueReceived ? "Conciliado" : "Em aberto"}</small><button className="button button-light" onClick={() => item.revenueReceived ? setReopenAction({ item, field: "revenueReceived" }) : run({ type: "settle", entryId: item.id, field: "revenueReceived", actor: "Financeiro demonstrativo" })}>{item.revenueReceived ? "Reabrir recebimento" : "Marcar recebido"}</button></div> : null}{payable.includes(item) ? <div className="ledger-amount"><span>Pagar {money(item.payout)}</span><small>{item.payoutPaid ? "Conciliado" : "Em aberto"}</small><button className="button button-light" onClick={() => item.payoutPaid ? setReopenAction({ item, field: "payoutPaid" }) : run({ type: "settle", entryId: item.id, field: "payoutPaid", actor: "Financeiro demonstrativo" })}>{item.payoutPaid ? "Reabrir repasse" : "Marcar pago"}</button></div> : null}</div>; })}{!entries.length && detailFilters.situation !== "reversed" ? <p className="empty">Nenhum lançamento ativo nos filtros selecionados.</p> : null}</div></section>
    <section className="surface"><h2>Histórico financeiro</h2><p className="muted">Movimentações dos atendimentos presentes nos filtros atuais.</p><div className="audit-list">{audit.slice().reverse().slice(0, 30).map((item) => <div key={item.id}><strong>{item.action} · {item.appointmentId}</strong><span>{item.detail}</span><small>{new Date(item.at).toLocaleString("pt-BR")} · {item.actor}</small></div>)}{!audit.length ? <p className="muted">Sem movimentações para os filtros.</p> : null}</div></section>
    <details className="surface"><summary>Histórico de reversões</summary><p>Consulta secundária dos valores revertidos. O atendimento permanece identificado no histórico.</p><div className="audit-list">{reversals.slice().reverse().map((item) => <div key={item.id}><strong>{item.appointmentId} · {UNIT_NAMES[item.unitId]}</strong><span>Receita {money(item.expectedRevenue)} · repasse {money(item.payout)}</span><small>{new Date(item.reversedAt).toLocaleString("pt-BR")} · {item.actor} · {item.reason}</small></div>)}{!reversals.length ? <p className="muted">Nenhuma reversão nos filtros selecionados.</p> : null}</div></details>
    {reopenAction ? <ReasonDialog title={reopenAction.field === "revenueReceived" ? "Reabrir recebimento" : "Reabrir repasse"} onClose={() => setReopenAction(null)} onConfirm={(reason) => run({ type: "reopenSettlement", entryId: reopenAction.item.id, field: reopenAction.field, reason, actor: "Financeiro demonstrativo" })}/> : null}
    <section className="surface"><h2>Regra de repasse aplicada</h2><p>Valor para novas confirmações: {money(state.payoutRules.at(-1)?.amount ?? 18)}. Os valores históricos de cada lançamento permanecem preservados. Configuração disponível na Gestão.</p></section>
  </>;
}
