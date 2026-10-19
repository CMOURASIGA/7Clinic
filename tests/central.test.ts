import test from "node:test";
import assert from "node:assert/strict";
import { applyCentralCommand, availableSlots, centralOf, createCentralSeed, type Conversation } from "../lib/central.ts";
import { applyCommand, createScenario, type DemoState } from "../lib/domain.ts";

const fixture = (): DemoState => ({ ...createScenario(), central: createCentralSeed() });
const update = (state: DemoState, id: string, patch: Partial<Conversation>) => applyCentralCommand(state, { type: "update", conversationId: id, patch });

test("HV-14 três ou mais conversas têm identidades, estados e filtros distintos", () => {
  const central = createCentralSeed();
  assert.equal(central.conversations.length, 4);
  assert.equal(new Set(central.conversations.map((item) => item.patientId)).size, 4);
  assert.deepEqual(new Set(central.conversations.map((item) => item.status)), new Set(["RECEBIDA", "EM_ATENDIMENTO", "AGUARDANDO_PACIENTE"]));
  const filtered = applyCentralCommand(fixture(), { type: "filter", value: "AGUARDANDO_PACIENTE" });
  assert.equal(centralOf(filtered).statusFilter, "AGUARDANDO_PACIENTE");
  assert.equal(centralOf(filtered).conversations.filter((item) => item.status === centralOf(filtered).statusFilter).length, 1);
});

test("HV-15 alternância A-B-C-A preserva rascunho, cadastro, filtros e horário sem contaminar B/C", () => {
  let state = fixture();
  const a = centralOf(state).conversations[0];
  const available = availableSlots(state, a).find((item) => item.available);
  assert.ok(available);
  state = update(state, "c1", { draft: "Rascunho exclusivo A", edit: { ...a.edit, contact: "CONTATO-ALTERADO-A" }, filters: { ...a.filters, day: "2026-10-17" }, choice: available.slot });
  for (const id of ["c2", "c3", "c1"]) state = applyCentralCommand(state, { type: "select", conversationId: id });
  const [restored, b, c] = centralOf(state).conversations;
  assert.equal(centralOf(state).selectedId, "c1");
  assert.equal(restored.draft, "Rascunho exclusivo A");
  assert.equal(restored.edit.contact, "CONTATO-ALTERADO-A");
  assert.equal(restored.filters.day, "2026-10-17");
  assert.deepEqual(restored.choice, available.slot);
  assert.equal(b.draft, ""); assert.equal(c.draft, "");
  assert.notEqual(b.edit.contact, restored.edit.contact);
});

test("HV-16 estado serializado retoma a conversa selecionada e os rascunhos", () => {
  let state = fixture();
  state = update(state, "c2", { draft: "Retomar conversa B", noteDraft: "Nota B" });
  state = applyCentralCommand(state, { type: "select", conversationId: "c2" });
  const reloaded = JSON.parse(JSON.stringify(state)) as DemoState;
  assert.equal(centralOf(reloaded).selectedId, "c2");
  assert.equal(centralOf(reloaded).conversations[1].draft, "Retomar conversa B");
  assert.equal(centralOf(reloaded).conversations[1].noteDraft, "Nota B");
});

test("HV-17 cadastro e anexos vinculados não permitem gravar outra identidade", () => {
  let state = fixture();
  const b = centralOf(state).conversations[1];
  assert.deepEqual(b.attachments.map((item) => item.id), ["doc-c2-card"]);
  state = update(state, "c2", { edit: { ...b.edit, card: "DEMO-C2-CORRIGIDO" } });
  state = applyCentralCommand(state, { type: "saveCadastro", conversationId: "c2" });
  assert.equal(state.patients.find((item) => item.id === "p2")?.card, "DEMO-C2-CORRIGIDO");
  assert.equal(state.patients.find((item) => item.id === "p1")?.card, "DEMO-001");
  const tampered = update(state, "c2", { patientId: "p1" });
  assert.throws(() => applyCentralCommand(tampered, { type: "saveCadastro", conversationId: "c2" }), /Vínculo|alterado fora/);
});

test("HV-18 primeira reserva bloqueia segunda no mesmo slot, sem produção até confirmação", () => {
  let state = fixture();
  const c = centralOf(state).conversations.find((item) => item.id === "c3")!;
  const d = centralOf(state).conversations.find((item) => item.id === "c4")!;
  state = update(state, "c4", { edit: { ...d.edit, specialty: "Fisioterapia", unit: "u2", turn: "manha" } });
  state = applyCentralCommand(state, { type: "saveCadastro", conversationId: "c4" });
  const slot = availableSlots(state, c).find((item) => item.available)!.slot;
  state = update(state, "c3", { choice: slot, choiceConfirmed: true });
  const financialBefore = state.financial.length;
  state = applyCentralCommand(state, { type: "reserve", conversationId: "c3" });
  assert.equal(state.financial.length, financialBefore);
  assert.equal(state.appointments.at(-1)?.status, "prebooked");
  assert.throws(() => applyCentralCommand(state, { type: "reserve", conversationId: "c3" }), /já possui/);
  const updated = centralOf(state).conversations.find((item) => item.id === "c4")!;
  state = update(state, "c4", { filters: { ...updated.filters, day: slot.day, unit: slot.unitId, specialty: "Fisioterapia", turn: "manha" }, choice: slot, choiceConfirmed: true });
  assert.throws(() => applyCentralCommand(state, { type: "reserve", conversationId: "c4" }), /indisponível|ocupado/);
  assert.equal(state.appointments.filter((item) => item.day === slot.day && item.time === slot.time && item.professionalId === slot.professionalId && item.status === "prebooked").length, 1);
  const id = state.appointments.at(-1)!.id;
  const confirmed = applyCommand(state, { type: "confirm", appointmentId: id, actor: "Recepção demonstrativa" });
  assert.equal(confirmed.financial.length, financialBefore + 1);
  assert.equal(applyCommand(confirmed, { type: "confirm", appointmentId: id, actor: "Recepção demonstrativa" }).financial.length, financialBefore + 1);
});

test("HV-19 estados de painéis em tablet/mobile persistem por conversa", () => {
  let state = fixture();
  state = update(state, "c1", { panel: "operation", operationTab: "agenda" });
  state = applyCentralCommand(state, { type: "select", conversationId: "c2" });
  assert.equal(centralOf(state).conversations[0].panel, "operation");
  assert.equal(centralOf(state).conversations[0].operationTab, "agenda");
});

test("HV-20 conversa aguardando paciente e rascunho não enviam nem reservam", () => {
  let state = fixture();
  const b = centralOf(state).conversations[1];
  state = update(state, "c2", { draft: "Mensagem ainda não enviada" });
  assert.equal(centralOf(state).conversations[1].messages.length, b.messages.length);
  assert.equal(centralOf(state).conversations[1].status, "AGUARDANDO_PACIENTE");
  assert.equal(centralOf(state).conversations[1].requestStatus, "EM_COLETA");
  assert.throws(() => applyCentralCommand(state, { type: "reserve", conversationId: "c2" }), /escolha explícita/);
  assert.equal(state.appointments.length, fixture().appointments.length);
});

test("cancelamento do pré-agendamento mantém ID histórico e libera nova escolha na conversa", () => {
  let state = fixture();
  const c = centralOf(state).conversations.find((item) => item.id === "c3")!;
  const slot = availableSlots(state, c).find((item) => item.available)!.slot;
  state = update(state, "c3", { choice: slot, choiceConfirmed: true });
  state = applyCentralCommand(state, { type: "reserve", conversationId: "c3" });
  const first = centralOf(state).conversations.find((item) => item.id === "c3")!.appointmentId!;
  state = applyCommand(state, { type: "cancel", appointmentId: first, actor: "Recepção demonstrativa", reason: "Paciente alterou a escolha fictícia" });
  const released = centralOf(state).conversations.find((item) => item.id === "c3")!;
  assert.equal(released.appointmentId, undefined);
  assert.deepEqual(released.previousAppointmentIds, [first]);
  assert.equal(released.requestStatus, "SEM_AGENDAMENTO");
  assert.equal(state.appointments.find((item) => item.id === first)?.status, "cancelled");
  const secondSlot = availableSlots(state, released).find((item) => item.available && item.slot.time !== slot.time)!.slot;
  state = update(state, "c3", { choice: secondSlot, choiceConfirmed: true });
  state = applyCentralCommand(state, { type: "reserve", conversationId: "c3" });
  assert.notEqual(centralOf(state).conversations.find((item) => item.id === "c3")?.appointmentId, first);
  assert.equal(state.financial.some((item) => item.appointmentId === first), false);
});
