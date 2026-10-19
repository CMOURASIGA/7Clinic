import { conflict, DEMO_DAY, type DemoState, type UnitId } from "./domain.ts";

export type ConversationStatus = "RECEBIDA" | "EM_ATENDIMENTO" | "AGUARDANDO_PACIENTE" | "ENCERRADA";
export type RequestStatus = "EM_COLETA" | "EM_CONFERENCIA" | "AGUARDANDO_ESCOLHA" | "PRE_AGENDADA" | "SEM_AGENDAMENTO";
export type Turn = "manha" | "tarde" | "noite";
export type FieldOrigin = "texto" | "anexo" | "cadastro" | "humano";
export type FieldState = "informado" | "ausente" | "conferir" | "conferido";
export interface CollectedField { value: string; origin: FieldOrigin; state: FieldState; updatedAt?: string; actor?: string }
export interface DemoAttachment { id: string; type: "Carteirinha" | "Pedido médico"; label: string }
export interface CentralMessage { id: string; at: string; author: "bot" | "paciente" | "atendente" | "nota"; text: string; attachmentId?: string }
export interface SlotChoice { day: string; time: string; professionalId: string; unitId: UnitId }
export interface Conversation {
  id: string;
  patientId?: string;
  title: string;
  channel: "Chat demonstrativo";
  assignedTo: string;
  status: ConversationStatus;
  requestStatus: RequestStatus;
  messages: CentralMessage[];
  attachments: DemoAttachment[];
  fields: Record<"name" | "contact" | "insurance" | "card" | "specialty" | "unit" | "turn" | "order", CollectedField>;
  draft: string;
  noteDraft: string;
  edit: { name: string; contact: string; insurance: string; card: string; specialty: string; unit: string; turn: string; order: string };
  filters: { day: string; unit: UnitId | "all"; specialty: string; turn: Turn | "all"; professionalId: string };
  choice?: SlotChoice;
  choiceConfirmed: boolean;
  appointmentId?: string;
  panel: "list" | "conversation" | "operation";
  operationTab: "cadastro" | "agenda";
}
export interface CentralState { selectedId: string; search: string; statusFilter: ConversationStatus | "all"; conversations: Conversation[] }
const field = (value: string, origin: FieldOrigin, state: FieldState): CollectedField => ({ value, origin, state });
const DEMO_AT = "2026-10-16T12:00:00.000Z";
const message = (id: string, author: CentralMessage["author"], text: string, attachmentId?: string): CentralMessage => ({ id, at: DEMO_AT, author, text, attachmentId });
function makeConversation(id: string, patientId: string | undefined, title: string, status: ConversationStatus, requestStatus: RequestStatus, unit: UnitId, specialty: string, turn: Turn, documents: DemoAttachment[], incomplete = false): Conversation {
  const fields: Conversation["fields"] = {
    name: field(title, patientId ? "cadastro" : "texto", "conferido"),
    contact: field(`CONTATO-DEMO-${id.toUpperCase()}`, "texto", "conferido"),
    insurance: field(patientId === "p3" ? "Particular demonstrativo" : patientId === "p2" ? "Convênio Fictício Verde" : "Convênio Fictício Azul", "texto", "conferido"),
    card: field(incomplete ? "" : `CENTRAL-${id.toUpperCase()}`, documents.some((doc) => doc.type === "Carteirinha") ? "anexo" : "texto", (incomplete || documents.some((doc) => doc.type === "Carteirinha")) ? "conferir" : "conferido"),
    specialty: field(specialty, "texto", incomplete ? "informado" : "conferido"),
    unit: field(unit, "texto", incomplete ? "informado" : "conferido"),
    turn: field(turn, "texto", incomplete ? "informado" : "conferido"),
    order: field(documents.some((doc) => doc.type === "Pedido médico") ? "Anexo sintético recebido" : "Sem pedido anexado", documents.length ? "anexo" : "texto", documents.some((doc) => doc.type === "Pedido médico") ? "conferir" : "informado"),
  };
  return {
    id, patientId, title, status, requestStatus, channel: "Chat demonstrativo", assignedTo: "Atendente Exemplo", fields, attachments: documents,
    messages: [message(`${id}-1`, "bot", "Olá! Vou reunir seus dados para que a equipe possa continuar o atendimento."), message(`${id}-2`, "paciente", `Sou ${title}. Prefiro ${turn} na ${unit === "u1" ? "Unidade I" : "Unidade II"}.`), ...(documents.length ? [message(`${id}-3`, "paciente", "Enviei os documentos para conferência humana.", documents[0].id)] : []), message(`${id}-4`, "bot", incomplete ? "A coleta foi interrompida. A atendente pode retomar os dados pendentes." : "Os dados foram encaminhados à atendente. Ela consultará a agenda e informará as opções.")],
    draft: "", noteDraft: "", edit: { name: fields.name.value, contact: fields.contact.value, insurance: fields.insurance.value, card: fields.card.value, specialty, unit, turn, order: fields.order.value },
    filters: { day: DEMO_DAY, unit: incomplete ? "all" : unit, specialty: incomplete ? "all" : specialty, turn: incomplete ? "all" : turn, professionalId: "all" }, choiceConfirmed: false, panel: "conversation", operationTab: "cadastro",
  };
}
export function createCentralSeed(): CentralState {
  return { selectedId: "c1", search: "", statusFilter: "all", conversations: [
    makeConversation("c1", "p1", "Paciente Exemplo A", "EM_ATENDIMENTO", "EM_CONFERENCIA", "u1", "Fisioterapia", "manha", [{ id: "doc-c1-card", type: "Carteirinha", label: "Carteirinha fictícia A" }, { id: "doc-c1-order", type: "Pedido médico", label: "Pedido demonstrativo A" }]),
    makeConversation("c2", "p2", "Paciente Exemplo B", "AGUARDANDO_PACIENTE", "EM_COLETA", "u2", "Pilates", "tarde", [{ id: "doc-c2-card", type: "Carteirinha", label: "Carteirinha fictícia B" }], true),
    makeConversation("c3", "p3", "Paciente Exemplo C", "EM_ATENDIMENTO", "AGUARDANDO_ESCOLHA", "u2", "Fisioterapia", "manha", []),
    makeConversation("c4", undefined, "Paciente Exemplo E", "RECEBIDA", "EM_CONFERENCIA", "u1", "Pilates", "tarde", [{ id: "doc-c4-order", type: "Pedido médico", label: "Pedido demonstrativo E" }]),
  ] };
}
export function centralOf(state: DemoState): CentralState { return state.central ?? createCentralSeed(); }
export type CentralCommand =
  | { type: "select"; conversationId: string }
  | { type: "search"; value: string }
  | { type: "filter"; value: ConversationStatus | "all" }
  | { type: "update"; conversationId: string; patch: Partial<Pick<Conversation, "draft" | "noteDraft" | "edit" | "filters" | "choice" | "choiceConfirmed" | "panel" | "operationTab">> }
  | { type: "send" | "note" | "discardDraft" | "saveCadastro" | "reserve"; conversationId: string }
  | { type: "setStatus"; conversationId: string; status: ConversationStatus };

export function availableSlots(state: DemoState, conversation: Conversation): { slot: SlotChoice; available: boolean; professionalName: string }[] {
  const { day, unit, specialty, turn, professionalId } = conversation.filters;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || unit === "all" || specialty === "all" || turn === "all") return [];
  const times = turn === "manha" ? ["08:00", "09:00", "10:00", "11:00"] : turn === "tarde" ? ["13:00", "14:00", "15:00", "16:00", "17:00"] : [];
  return state.professionals.filter((professional) => professional.units.includes(unit) && professional.specialty === specialty && (professionalId === "all" || professional.id === professionalId)).flatMap((professional) => times.map((time) => ({
    slot: { day, time, unitId: unit, professionalId: professional.id }, professionalName: professional.name,
    available: !conflict(state, "", conversation.patientId ?? "", professional.id, day, time),
  })));
}

export function applyCentralCommand(state: DemoState, command: CentralCommand): DemoState {
  const central = centralOf(state);
  if (command.type === "search") return { ...state, central: { ...central, search: command.value } };
  if (command.type === "filter") return { ...state, central: { ...central, statusFilter: command.value } };
  if (command.type === "select") {
    if (!central.conversations.some((item) => item.id === command.conversationId)) throw new Error("Conversa não encontrada.");
    return { ...state, central: { ...central, selectedId: command.conversationId, conversations: central.conversations.map((item) => item.id === command.conversationId ? { ...item, panel: "conversation" } : item) } };
  }
  const current = central.conversations.find((item) => item.id === command.conversationId);
  if (!current) throw new Error("Conversa não encontrada.");
  const replace = (updated: Conversation, partial: Partial<DemoState> = {}): DemoState => ({ ...state, ...partial, central: { ...central, conversations: central.conversations.map((item) => item.id === current.id ? updated : item) } });
  if (command.type === "update") return replace({ ...current, ...command.patch });
  if (command.type === "discardDraft") return replace({ ...current, draft: "" });
  if (command.type === "setStatus") return replace({ ...current, status: command.status });
  if (command.type === "send" || command.type === "note") {
    const content = (command.type === "send" ? current.draft : current.noteDraft).trim();
    if (!content) throw new Error("Escreva uma mensagem fictícia antes de registrar.");
    return replace({ ...current, draft: command.type === "send" ? "" : current.draft, noteDraft: command.type === "note" ? "" : current.noteDraft, messages: [...current.messages, { id: `${current.id}-m${current.messages.length + 1}`, at: new Date().toISOString(), author: command.type === "send" ? "atendente" : "nota", text: content }] });
  }
  if (command.type === "saveCadastro") {
    if (current.patientId && !state.patients.some((patient) => patient.id === current.patientId)) throw new Error("Vínculo paciente–conversa inválido.");
    if (!current.edit.name.trim() || !current.edit.contact.trim() || !current.edit.specialty.trim() || !["u1", "u2"].includes(current.edit.unit) || !["manha", "tarde", "noite"].includes(current.edit.turn)) throw new Error("Confira identificação, contato, especialidade, unidade e turno.");
    const existing = state.patients.find((item) => item.id === current.patientId);
    if (existing && existing.name !== current.fields.name.value) throw new Error("Cadastro existente alterado fora desta conversa. Recarregue o cenário antes de salvar.");
    const id = existing?.id ?? `p${Math.max(0, ...state.patients.map((item) => Number(item.id.slice(1)) || 0)) + 1}`;
    const duplicate = state.patients.some((item) => item.id !== id && (item.name.toLowerCase() === current.edit.name.trim().toLowerCase() || (current.edit.card && item.card === current.edit.card)));
    if (duplicate) throw new Error("Paciente já cadastrado. Revise o vínculo para evitar duplicidade.");
    const patient = { id, name: current.edit.name.trim(), insurance: current.edit.insurance.trim() || "Particular demonstrativo", card: current.edit.card.trim() || `PENDENTE-${id}` };
    const fields = { ...current.fields };
    for (const key of Object.keys(current.edit) as (keyof Conversation["edit"])[]) {
      if (fields[key].value !== current.edit[key] || (fields[key].state !== "conferido" && current.edit[key].trim())) fields[key] = { value: current.edit[key].trim(), origin: fields[key].value !== current.edit[key] ? "humano" : fields[key].origin, state: current.edit[key].trim() ? "conferido" : "ausente", updatedAt: new Date().toISOString(), actor: "Atendente Exemplo" };
    }
    const at = new Date().toISOString();
    const updated: Conversation = { ...current, patientId: id, title: patient.name, fields, requestStatus: "EM_CONFERENCIA", filters: { ...current.filters, unit: current.edit.unit as UnitId, specialty: current.edit.specialty, turn: current.edit.turn as Turn } };
    const changed = (Object.keys(current.edit) as (keyof Conversation["edit"])[]).filter((key) => current.fields[key].value !== current.edit[key]);
    const safe = (source: typeof current.fields) => JSON.stringify(Object.fromEntries(changed.map((key) => [key, ["contact", "card", "order"].includes(key) ? "[conteúdo omitido]" : source[key].value])));
    const audit = [...state.audit, { id: `central-${state.audit.length + 1}`, at, actor: "Atendente Exemplo", action: "CENTRAL_CADASTRO", detail: `Cadastro contextual ${current.id}; campos alterados: ${changed.join(", ") || "somente conferência"}.`, before: safe(current.fields), after: safe(fields) }];
    return replace(updated, { patients: existing ? state.patients.map((item) => item.id === id ? patient : item) : [...state.patients, patient], audit });
  }
  // Reserva: o estado atual é a única fonte de disponibilidade e associação.
  if (current.appointmentId) throw new Error("Esta solicitação já possui pré-agendamento. Evite duplicidade.");
  if (!current.choice || !current.choiceConfirmed) throw new Error("Registre a escolha explícita do paciente antes de reservar.");
  const patient = state.patients.find((item) => item.id === current.patientId);
  if (!patient || patient.name !== current.fields.name.value) throw new Error("Confira o vínculo entre conversa e paciente antes de reservar.");
  if (["name", "contact", "specialty", "unit", "turn"].some((key) => current.fields[key as keyof Conversation["fields"]].state !== "conferido")) throw new Error("Confira os dados mínimos do cadastro antes de reservar.");
  if (current.fields.insurance.value !== "Particular demonstrativo" && current.fields.card.state !== "conferido") throw new Error("Confira a carteirinha fictícia antes de reservar.");
  if (Object.keys(current.edit).some((key) => current.edit[key as keyof Conversation["edit"]] !== current.fields[key as keyof Conversation["fields"]].value)) throw new Error("Salve ou descarte as alterações de cadastro antes de reservar.");
  const { choice } = current;
  const professional = state.professionals.find((item) => item.id === choice.professionalId);
  if (!professional?.units.includes(choice.unitId) || professional.specialty !== current.fields.specialty.value || choice.unitId !== current.fields.unit.value) throw new Error("Profissional, especialidade ou unidade não correspondem à solicitação.");
  if (current.filters.day !== choice.day || current.filters.unit !== choice.unitId || current.filters.turn !== current.fields.turn.value || !availableSlots(state, current).some((item) => item.available && JSON.stringify(item.slot) === JSON.stringify(choice))) throw new Error("Horário indisponível ou filtros alterados. Consulte a agenda novamente.");
  if (conflict(state, "", patient.id, choice.professionalId, choice.day, choice.time)) throw new Error("Horário ocupado. Consulte outra opção antes de reservar.");
  const usedIds = [...state.appointments.map((item) => item.id), ...state.audit.map((item) => item.appointmentId ?? "")];
  const id = `a${Math.max(0, ...usedIds.map((value) => /^a\d+$/.test(value) ? Number(value.slice(1)) : 0)) + 1}`;
  return replace({ ...current, appointmentId: id, requestStatus: "PRE_AGENDADA" }, {
    appointments: [...state.appointments, { id, patientId: patient.id, professionalId: choice.professionalId, unitId: choice.unitId, day: choice.day, time: choice.time, status: "prebooked" }],
    audit: [...state.audit, { id: `central-${state.audit.length + 1}`, at: new Date().toISOString(), actor: "Atendente Exemplo", action: "PREBOOK", appointmentId: id, detail: `Pré-agendamento da conversa ${current.id}; escolha humana registrada; sem financeiro ou prontuário.` }],
  });
}
