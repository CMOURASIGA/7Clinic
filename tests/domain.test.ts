import assert from "node:assert/strict";
import test from "node:test";
import { applyCommand, createSeed, executeForRole, notificationItems, pendingItems, totals } from "../lib/domain.ts";
import { filterFinance, type FinanceFilters } from "../lib/finance-selectors.ts";

test("confirmação libera prontuário e gera produção financeira antes da evolução", () => {
  const state = executeForRole(createSeed(), "reception", { type: "confirm", appointmentId: "a1", actor: "Recepção" });
  assert.equal(state.appointments.find((a) => a.id === "a1")?.status, "confirmed");
  assert.equal(state.appointments.find((a) => a.id === "a1")?.evolution, undefined);
  assert.equal(state.financial.find((f) => f.appointmentId === "a1")?.payout, 18);
  assert.equal(totals(state, "u1").clinicalPending, 1);
});

test("confirmação repetida e transferência não duplicam financeiro", () => {
  const initial = createSeed();
  const transferred = applyCommand(initial, { type: "transfer", appointmentId: "a2", unitId: "u2", actor: "Recepção" });
  const confirmed = applyCommand(transferred, { type: "confirm", appointmentId: "a2", actor: "Recepção" });
  const repeated = applyCommand(confirmed, { type: "confirm", appointmentId: "a2", actor: "Recepção" });
  assert.equal(transferred.appointments.length, initial.appointments.length);
  assert.equal(repeated.financial.filter((f) => f.appointmentId === "a2").length, 1);
  assert.equal(repeated.financial.find((f) => f.appointmentId === "a2")?.unitId, "u2");
});

test("bloqueio configurável e exceção justificada ficam auditados", () => {
  let state = executeForRole(createSeed(), "management", { type: "policy", key: "blockOnPriorPending", enabled: true, actor: "Gestão" });
  assert.throws(() => executeForRole(state, "reception", { type: "confirm", appointmentId: "a5", actor: "Recepção" }), /Bloqueio/);
  state = executeForRole(state, "management", { type: "exception", appointmentId: "a5", reason: "Liberação excepcional de demonstração", actor: "Gestão" });
  state = executeForRole(state, "reception", { type: "confirm", appointmentId: "a5", actor: "Recepção" });
  assert.equal(state.appointments.find((a) => a.id === "a5")?.status, "confirmed");
  assert.ok(state.audit.some((event) => event.action === "EXCEPTION" && event.appointmentId === "a5"));
});

test("falta não gera lançamento e confirmação posterior é negada", () => {
  const state = applyCommand(createSeed(), { type: "absence", appointmentId: "a4", actor: "Recepção" });
  assert.equal(state.financial.some((f) => f.appointmentId === "a4"), false);
  assert.throws(() => applyCommand(state, { type: "confirm", appointmentId: "a4", actor: "Recepção" }), /Somente/);
});

test("apenas profissional vinculado registra evolução e gestão não vê conteúdo pela ação", () => {
  const state = createSeed();
  assert.throws(() => executeForRole(state, "professional", { type: "evolve", appointmentId: "a3", professionalId: "pr2", note: "Texto fictício de evolução", actor: "Profissional" }), /não autorizado/);
  assert.throws(() => executeForRole(state, "reception", { type: "evolve", appointmentId: "a3", professionalId: "pr1", note: "Texto fictício de evolução", actor: "Recepção" }), /indisponível/);
  const evolved = executeForRole(state, "professional", { type: "evolve", appointmentId: "a3", professionalId: "pr1", note: "Texto fictício de evolução", actor: "Profissional" });
  assert.equal(evolved.financial.length, state.financial.length);
  assert.equal(evolved.audit.at(-1)?.detail.includes("Texto fictício"), false);
});

test("repasse parametrizado só afeta novas confirmações", () => {
  let state = executeForRole(createSeed(), "finance", { type: "payoutRule", amount: 25, actor: "Gestão" });
  state = executeForRole(state, "reception", { type: "confirm", appointmentId: "a1", actor: "Recepção" });
  assert.equal(state.financial.find((f) => f.appointmentId === "a3")?.payout, 18);
  assert.equal(state.financial.find((f) => f.appointmentId === "a1")?.payout, 25);
});

test("recebimento e pagamento são conciliados separadamente", () => {
  let state = createSeed();
  state = executeForRole(state, "finance", { type: "settle", entryId: "fin:a3", field: "revenueReceived", actor: "Gestão" });
  assert.equal(totals(state, "u2").receivedRevenue, 120);
  assert.equal(totals(state, "u2").payoutDue, 18);
  state = executeForRole(state, "finance", { type: "settle", entryId: "fin:a3", field: "payoutPaid", actor: "Gestão" });
  assert.equal(totals(state, "u2").payoutDue, 0);
});

test("cadastro e agendamento fictício recusam carteira e horário duplicados", () => {
  let state = createSeed();
  state = executeForRole(state, "reception", { type: "registerPatient", name: "Paciente Exemplo E", insurance: "Plano Fictício", card: "DEMO-005", actor: "Recepção" });
  assert.equal(state.patients.length, 5);
  assert.throws(() => executeForRole(state, "reception", { type: "registerPatient", name: "Paciente Exemplo F", insurance: "Plano Fictício", card: "demo-005", actor: "Recepção" }), /já cadastrada/);
  state = executeForRole(state, "reception", { type: "schedule", patientId: "p5", professionalId: "pr1", unitId: "u2", day: "2026-10-16", time: "13:00", actor: "Recepção" });
  assert.ok(state.appointments.some((item) => item.patientId === "p5" && item.status === "scheduled"));
  assert.throws(() => executeForRole(state, "reception", { type: "schedule", patientId: "p4", professionalId: "pr1", unitId: "u2", day: "2026-10-16", time: "13:00", actor: "Recepção" }), /horário/);
});

test("transferência de confirmado é negada até definição de estorno", () => {
  assert.throws(() => applyCommand(createSeed(), { type: "transfer", appointmentId: "a3", unitId: "u1", actor: "Recepção" }), /antes da confirmação/);
});

test("reversão, edição e cancelamento preservam ID, histórico e não duplicam produção", () => {
  let state = applyCommand(createSeed(), { type: "confirm", appointmentId: "a1", actor: "Recepção" });
  state = applyCommand(state, { type: "reverse", appointmentId: "a1", reason: "Confirmação registrada por engano", actor: "Recepção" });
  assert.equal(state.financial.some((item) => item.appointmentId === "a1"), false);
  state = applyCommand(state, { type: "editAppointment", appointmentId: "a1", day: "2026-10-17", time: "12:30", professionalId: "pr2", unitId: "u2", reason: "Mudança solicitada na demonstração", actor: "Recepção" });
  state = applyCommand(state, { type: "confirm", appointmentId: "a1", actor: "Recepção" });
  assert.equal(state.financial.filter((item) => item.appointmentId === "a1").length, 1);
  assert.equal(state.financial.find((item) => item.appointmentId === "a1")?.unitId, "u2");
  state = applyCommand(state, { type: "cancel", appointmentId: "a1", reason: "Atendimento criado incorretamente", actor: "Recepção" });
  assert.equal(state.appointments.find((item) => item.id === "a1")?.status, "cancelled");
  assert.equal(state.financial.some((item) => item.appointmentId === "a1"), false);
  assert.ok(state.audit.some((item) => item.action === "EDIT_APPOINTMENT" && item.appointmentId === "a1"));
});

test("falta corrigida retorna ao agendamento e recusa conflito de horário", () => {
  let state = applyCommand(createSeed(), { type: "absence", appointmentId: "a1", actor: "Recepção" });
  state = applyCommand(state, { type: "reverse", appointmentId: "a1", reason: "Falta lançada por engano", actor: "Recepção" });
  assert.equal(state.appointments.find((item) => item.id === "a1")?.status, "scheduled");
  assert.throws(() => applyCommand(state, { type: "editAppointment", appointmentId: "a1", day: "2026-10-16", time: "10:00", professionalId: "pr1", unitId: "u2", reason: "Teste de conflito válido", actor: "Recepção" }), /horário/);
});

test("rascunho pode ser editado, finalizado e complementado sem mudar financeiro", () => {
  let state = createSeed();
  state = executeForRole(state, "professional", { type: "saveDraft", appointmentId: "a3", professionalId: "pr1", note: "Rascunho fictício inicial", actor: "Profissional" });
  state = executeForRole(state, "professional", { type: "saveDraft", appointmentId: "a3", professionalId: "pr1", note: "Rascunho fictício revisado", actor: "Profissional" });
  assert.throws(() => executeForRole(state, "reception", { type: "reverse", appointmentId: "a3", reason: "Confirmado por engano", actor: "Recepção" }), /evolução clínica/);
  state = executeForRole(state, "professional", { type: "finalizeEvolution", appointmentId: "a3", professionalId: "pr1", actor: "Profissional" });
  state = executeForRole(state, "professional", { type: "amendEvolution", appointmentId: "a3", professionalId: "pr1", note: "Complemento fictício posterior", actor: "Profissional" });
  assert.equal(state.appointments.find((item) => item.id === "a3")?.amendments?.length, 1);
  assert.equal(state.financial.length, 1);
  state = executeForRole(state, "professional", { type: "voidEvolution", appointmentId: "a3", professionalId: "pr1", reason: "Registro fictício incorreto", actor: "Profissional" });
  state = executeForRole(state, "reception", { type: "reverse", appointmentId: "a3", reason: "Confirmação incorreta na recepção", actor: "Recepção" });
  assert.equal(state.financial.length, 0);
});

test("conciliação exige reabertura financeira antes da reversão", () => {
  let state = executeForRole(createSeed(), "finance", { type: "settle", entryId: "fin:a3", field: "payoutPaid", actor: "Financeiro" });
  assert.throws(() => executeForRole(state, "reception", { type: "reverse", appointmentId: "a3", reason: "Confirmação incorreta", actor: "Recepção" }), /conciliado/);
  state = executeForRole(state, "finance", { type: "reopenSettlement", entryId: "fin:a3", field: "payoutPaid", reason: "Pagamento simulado incorreto", actor: "Financeiro" });
  state = executeForRole(state, "reception", { type: "reverse", appointmentId: "a3", reason: "Confirmação incorreta", actor: "Recepção" });
  assert.equal(state.financial.length, 0);
});

test("fluxo integrado atualiza pendências, supervisão e financeiro em cada ambiente", () => {
  let state = createSeed();
  state = executeForRole(state, "reception", { type: "transfer", appointmentId: "a1", unitId: "u2", actor: "Recepção" });
  state = executeForRole(state, "reception", { type: "confirm", appointmentId: "a1", actor: "Recepção" });
  assert.equal(totals(state, "u2").expectedRevenue, 240);
  assert.equal(pendingItems(state, "u2").find((item) => item.appointment.id === "a1")?.kind, "clinical");
  state = executeForRole(state, "professional", { type: "saveDraft", appointmentId: "a1", professionalId: "pr1", note: "Evolução fictícia em rascunho", actor: "Profissional" });
  assert.equal(totals(state, "u2").clinicalPending, 2);
  state = executeForRole(state, "professional", { type: "finalizeEvolution", appointmentId: "a1", professionalId: "pr1", actor: "Profissional" });
  assert.equal(totals(state, "u2").clinicalPending, 1);
  assert.equal(state.financial.filter((item) => item.appointmentId === "a1").length, 1);
  state = executeForRole(state, "finance", { type: "settle", entryId: "fin:a1", field: "revenueReceived", actor: "Financeiro" });
  assert.equal(totals(state, "u2").receivedRevenue, 120);
  state = executeForRole(state, "management", { type: "policy", key: "notifyOnClinicalPending", enabled: false, actor: "Gestão" });
  assert.equal(notificationItems(state).some((item) => item.kind === "clinical"), false);
});

test("correção de falta não reabre horário já ocupado", () => {
  let state = executeForRole(createSeed(), "reception", { type: "absence", appointmentId: "a1", actor: "Recepção" });
  state = executeForRole(state, "reception", { type: "schedule", patientId: "p4", professionalId: "pr1", unitId: "u1", day: "2026-10-16", time: "08:00", actor: "Recepção" });
  assert.throws(() => executeForRole(state, "reception", { type: "reverse", appointmentId: "a1", reason: "Corrigir ausência simulada", actor: "Recepção" }), /Horário ocupado/);
});

test("filtros financeiros respeitam convênio, profissional, período, unidade e situação", () => {
  let state = createSeed();
  state = executeForRole(state, "reception", { type: "confirm", appointmentId: "a2", actor: "Recepção" });
  state = executeForRole(state, "finance", { type: "settle", entryId: "fin:a2", field: "revenueReceived", actor: "Financeiro" });
  const filters: FinanceFilters = { professionalId: "pr2", insurance: "Convênio Fictício Verde", from: "2026-10-16", to: "2026-10-16", account: "receivable", situation: "settled" };
  assert.deepEqual(filterFinance(state, "u1", filters).entries.map((item) => item.appointmentId), ["a2"]);
  assert.equal(filterFinance(state, "u2", filters).entries.length, 0);
  assert.equal(filterFinance(state, "u1", { ...filters, situation: "open" }).entries.length, 0);
  assert.equal(filterFinance(state, "u1", { ...filters, account: "payable", situation: "open" }).entries.length, 1);
});

test("reversão preserva histórico financeiro e não compõe saldo ou duplica reconfirmação", () => {
  let state = executeForRole(createSeed(), "reception", { type: "confirm", appointmentId: "a1", actor: "Recepção" });
  state = executeForRole(state, "reception", { type: "reverse", appointmentId: "a1", reason: "Confirmação de teste incorreta", actor: "Recepção" });
  assert.equal(state.financialReversals.length, 1);
  assert.equal(totals(state, "u1").expectedRevenue, 0);
  const filters: FinanceFilters = { professionalId: "pr1", insurance: "Convênio Fictício Azul", from: "2026-10-16", to: "2026-10-16", account: "all", situation: "reversed" };
  assert.equal(filterFinance(state, "u1", filters).reversals.length, 1);
  state = executeForRole(state, "reception", { type: "editAppointment", appointmentId: "a1", day: "2026-10-17", time: "12:00", professionalId: "pr2", unitId: "u2", reason: "Remarcação demonstrativa", actor: "Recepção" });
  assert.equal(filterFinance(state, "u1", filters).reversals.length, 1);
  state = executeForRole(state, "reception", { type: "confirm", appointmentId: "a1", actor: "Recepção" });
  assert.equal(state.financial.filter((item) => item.appointmentId === "a1").length, 1);
  assert.equal(totals(state, "u2").expectedRevenue, 240);
});
