import test from "node:test";
import assert from "node:assert/strict";
import { createScenario, executeForRole } from "../lib/domain.ts";
import { presentAudit } from "../lib/audit-presentation.ts";

test("histórico operacional traduz conciliações sem alterar identificadores de auditoria", () => {
  let state = createScenario();
  state = executeForRole(state, "finance", { type: "settle", entryId: "fin:a3", field: "payoutPaid", actor: "Financeiro" });
  const event = state.audit.at(-1)!;
  assert.match(event.detail, /payoutPaid.*fin:a3/);
  const view = presentAudit(event, state);
  assert.match(view.detail, /Repasse conciliado.*Paciente Exemplo C.*16\/10\/2026/);
  assert.doesNotMatch(JSON.stringify(view), /payoutPaid|fin:a3|\ba3\b/);
  state = executeForRole(state, "finance", { type: "reopenSettlement", entryId: "fin:a3", field: "payoutPaid", reason: "Ajuste fictício", actor: "Financeiro" });
  assert.match(presentAudit(state.audit.at(-1)!, state).detail, /Repasse reaberto.*Ajuste fictício/);
});

test("regra de repasse e recebimento usam formato monetário brasileiro", () => {
  let state = createScenario();
  state = executeForRole(state, "management", { type: "payoutRule", amount: 20, actor: "Gestão" });
  const view = presentAudit(state.audit.at(-1)!, state);
  assert.match(view.detail, /R\$ 20,00/);
  assert.doesNotMatch(view.detail, /20\.00/);
  state = executeForRole(state, "finance", { type: "settle", entryId: "fin:a3", field: "revenueReceived", actor: "Financeiro" });
  assert.match(presentAudit(state.audit.at(-1)!, state).detail, /Recebimento conciliado/);
});
