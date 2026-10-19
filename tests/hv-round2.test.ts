import test from "node:test";
import assert from "node:assert/strict";
import { answerMaia } from "../lib/maia.ts";
import { createScenario, createSeed, executeForRole } from "../lib/domain.ts";
import { financeSummary, type FinanceFilters } from "../lib/finance-selectors.ts";

const scope = { unit: "all" as const, professionalId: "", from: "", to: "" };

test("exclusão exige agendamento sem vínculos e preserva auditoria e sequência", () => {
  let state = createSeed();
  state = executeForRole(state, "reception", { type: "schedule", patientId: "p4", professionalId: "pr2", unitId: "u1", day: "2026-10-17", time: "09:00", actor: "Recepção" });
  const id = state.appointments.at(-1)!.id;
  state = executeForRole(state, "reception", { type: "deleteAppointment", appointmentId: id, actor: "Recepção" });
  assert.equal(state.appointments.some((item) => item.id === id), false);
  assert.equal(state.audit.at(-1)?.action, "DELETE_APPOINTMENT");
  assert.ok(state.audit.at(-1)?.before?.includes("09:00"));
  state = executeForRole(state, "reception", { type: "schedule", patientId: "p4", professionalId: "pr2", unitId: "u1", day: "2026-10-17", time: "10:00", actor: "Recepção" });
  assert.notEqual(state.appointments.at(-1)?.id, id);
  assert.throws(() => executeForRole(state, "reception", { type: "deleteAppointment", appointmentId: "a3", actor: "Recepção" }), /cancelamento ou reversão/);
});

test("atendimento editado com vínculo posterior não é excluído diretamente", () => {
  let state = createSeed();
  state = executeForRole(state, "reception", { type: "editAppointment", appointmentId: "a1", day: "2026-10-17", time: "08:00", professionalId: "pr1", unitId: "u1", reason: "Correção fictícia", actor: "Recepção" });
  assert.throws(() => executeForRole(state, "reception", { type: "deleteAppointment", appointmentId: "a1", actor: "Recepção" }), /cancelamento ou reversão/);
});

test("regra de repasse pertence à Gestão e preserva lançamentos anteriores", () => {
  let state = createSeed();
  assert.throws(() => executeForRole(state, "finance", { type: "payoutRule", amount: 30, actor: "Financeiro" }), /indisponível/);
  state = executeForRole(state, "management", { type: "payoutRule", amount: 30, actor: "Gestão" });
  assert.equal(state.financial[0].payout, 18);
  state = executeForRole(state, "reception", { type: "confirm", appointmentId: "a1", actor: "Recepção" });
  assert.equal(state.financial.at(-1)?.payout, 30);
});

test("Maia responde às cinco perguntas apenas com dados do escopo", () => {
  const state = createScenario();
  assert.match(answerMaia("Qual profissional possui mais prontuários pendentes?", state, scope), /Profissional Exemplo 1|Profissional Exemplo 2/);
  assert.match(answerMaia("Quantos atendimentos estão aguardando confirmação?", state, scope), /5 atendimento/);
  assert.match(answerMaia("Qual unidade possui mais pendências?", state, scope), /Unidade I/);
  assert.match(answerMaia("Qual é a produção financeira por profissional?", state, scope), /Profissional Exemplo 1: R\$\s*120,00/);
  assert.match(answerMaia("Quais recebimentos estão pendentes?", state, scope), /2 recebimento/);
  assert.match(answerMaia("Quantos atendimentos estão aguardando confirmação?", state, { ...scope, unit: "u2" }), /2 atendimento/);
  assert.match(answerMaia("Previsão do tempo?", state, scope), /Ainda não consigo responder/);
});

test("subtotais financeiros obedecem conta, situação, profissional e unidade", () => {
  const state = createScenario();
  const filters: FinanceFilters = { professionalId: "pr2", insurance: "", from: "", to: "", account: "receivable", situation: "open" };
  const result = financeSummary(state, "u1", filters);
  assert.equal(result.production, 120);
  assert.equal(result.toReceive, 120);
  assert.equal(result.received, 0);
  assert.equal(result.toPay, 0);
});
