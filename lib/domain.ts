export type UnitId = "u1" | "u2";
export type Role = "reception" | "professional" | "management" | "finance";
export type AppointmentStatus = "scheduled" | "confirmed" | "absent" | "cancelled";

export interface Patient {
  id: string;
  name: string;
  insurance: string;
  card: string;
}

export interface Professional {
  id: string;
  name: string;
  specialty: string;
  units: UnitId[];
}

export interface Appointment {
  id: string;
  patientId: string;
  professionalId: string;
  unitId: UnitId;
  day: string;
  time: string;
  status: AppointmentStatus;
  evolution?: string;
  evolutionStatus?: "draft" | "final";
  amendments?: { at: string; note: string }[];
  exceptionReason?: string;
}

export interface FinancialEntry {
  id: string;
  appointmentId: string;
  unitId: UnitId;
  professionalId: string;
  expectedRevenue: number;
  payout: number;
  revenueReceived: boolean;
  payoutPaid: boolean;
  createdAt: string;
}

export interface FinancialReversal {
  id: string;
  appointmentId: string;
  unitId: UnitId;
  professionalId: string;
  patientId: string;
  insurance: string;
  day: string;
  expectedRevenue: number;
  payout: number;
  reversedAt: string;
  reason: string;
  actor: string;
}

export interface PayoutRule {
  effectiveAt: string;
  amount: number;
}

export interface Policies {
  blockOnPriorPending: boolean;
  notifyOnClinicalPending: boolean;
  notifyOnConfirmationPending: boolean;
}

export interface AuditEvent {
  id: string;
  at: string;
  actor: string;
  action: string;
  appointmentId?: string;
  detail: string;
}

export interface DemoState {
  version: 1;
  patients: Patient[];
  professionals: Professional[];
  appointments: Appointment[];
  financial: FinancialEntry[];
  financialReversals: FinancialReversal[];
  payoutRules: PayoutRule[];
  policies: Policies;
  audit: AuditEvent[];
}

export type Command =
  | { type: "registerPatient"; name: string; insurance: string; card: string; actor: string }
  | { type: "schedule"; patientId: string; professionalId: string; unitId: UnitId; day: string; time: string; actor: string }
  | { type: "confirm"; appointmentId: string; actor: string }
  | { type: "absence"; appointmentId: string; actor: string }
  | { type: "editAppointment"; appointmentId: string; day: string; time: string; professionalId: string; unitId: UnitId; reason: string; actor: string }
  | { type: "reverse"; appointmentId: string; reason: string; actor: string }
  | { type: "cancel"; appointmentId: string; reason: string; actor: string }
  | { type: "transfer"; appointmentId: string; unitId: UnitId; actor: string }
  | { type: "evolve"; appointmentId: string; professionalId: string; note: string; actor: string }
  | { type: "saveDraft"; appointmentId: string; professionalId: string; note: string; actor: string }
  | { type: "finalizeEvolution"; appointmentId: string; professionalId: string; actor: string }
  | { type: "amendEvolution"; appointmentId: string; professionalId: string; note: string; actor: string }
  | { type: "discardDraft"; appointmentId: string; professionalId: string; reason: string; actor: string }
  | { type: "voidEvolution"; appointmentId: string; professionalId: string; reason: string; actor: string }
  | { type: "exception"; appointmentId: string; reason: string; actor: string }
  | { type: "policy"; key: keyof Policies; enabled: boolean; actor: string }
  | { type: "payoutRule"; amount: number; actor: string }
  | { type: "settle"; entryId: string; field: "revenueReceived" | "payoutPaid"; actor: string }
  | { type: "reopenSettlement"; entryId: string; field: "revenueReceived" | "payoutPaid"; reason: string; actor: string };

const DEMO_TIME = "2026-10-16T13:00:00.000Z";
export const DEMO_DAY = "2026-10-16";
export const UNIT_NAMES: Record<UnitId, string> = { u1: "Unidade I", u2: "Unidade II" };
export const EXPECTED_REVENUE = 120; // Valor fictício para a demonstração, não tabela contratual.

export function createSeed(): DemoState {
  return {
    version: 1,
    patients: [
      { id: "p1", name: "Paciente Exemplo A", insurance: "Convênio Fictício Azul", card: "DEMO-001" },
      { id: "p2", name: "Paciente Exemplo B", insurance: "Convênio Fictício Verde", card: "DEMO-002" },
      { id: "p3", name: "Paciente Exemplo C", insurance: "Particular demonstrativo", card: "DEMO-003" },
      { id: "p4", name: "Paciente Exemplo D", insurance: "Convênio Fictício Azul", card: "DEMO-004" },
    ],
    professionals: [
      { id: "pr1", name: "Profissional Exemplo 1", specialty: "Fisioterapia", units: ["u1", "u2"] },
      { id: "pr2", name: "Profissional Exemplo 2", specialty: "Pilates", units: ["u1", "u2"] },
    ],
    appointments: [
      { id: "a1", patientId: "p1", professionalId: "pr1", unitId: "u1", day: DEMO_DAY, time: "08:00", status: "scheduled" },
      { id: "a2", patientId: "p2", professionalId: "pr2", unitId: "u1", day: DEMO_DAY, time: "09:00", status: "scheduled" },
      { id: "a3", patientId: "p3", professionalId: "pr1", unitId: "u2", day: DEMO_DAY, time: "10:00", status: "confirmed" },
      { id: "a4", patientId: "p4", professionalId: "pr2", unitId: "u2", day: DEMO_DAY, time: "11:00", status: "scheduled" },
      { id: "a5", patientId: "p1", professionalId: "pr1", unitId: "u1", day: DEMO_DAY, time: "15:00", status: "scheduled" },
    ],
    financial: [
      { id: "fin:a3", appointmentId: "a3", unitId: "u2", professionalId: "pr1", expectedRevenue: EXPECTED_REVENUE, payout: 18, revenueReceived: false, payoutPaid: false, createdAt: DEMO_TIME },
    ],
    financialReversals: [],
    payoutRules: [{ effectiveAt: DEMO_TIME, amount: 18 }],
    policies: { blockOnPriorPending: false, notifyOnClinicalPending: true, notifyOnConfirmationPending: true },
    audit: [{ id: "seed", at: DEMO_TIME, actor: "Sistema demonstrativo", action: "SEED", appointmentId: "a3", detail: "Massa inteiramente fictícia." }],
  };
}

/** Massa inteiramente fictícia para percorrer todos os estados no Preview. */
export function createScenario(): DemoState {
  const base = createSeed();
  const appointments: Appointment[] = [
    ...base.appointments,
    { id: "a6", patientId: "p2", professionalId: "pr1", unitId: "u2", day: DEMO_DAY, time: "12:00", status: "absent" },
    { id: "a7", patientId: "p4", professionalId: "pr1", unitId: "u1", day: DEMO_DAY, time: "13:00", status: "cancelled" },
    { id: "a8", patientId: "p4", professionalId: "pr2", unitId: "u1", day: DEMO_DAY, time: "14:00", status: "confirmed", evolution: "Rascunho inteiramente fictício para teste de edição.", evolutionStatus: "draft" },
    { id: "a9", patientId: "p2", professionalId: "pr2", unitId: "u2", day: DEMO_DAY, time: "16:00", status: "confirmed", evolution: "Evolução fictícia finalizada para demonstração.", evolutionStatus: "final" },
    { id: "a10", patientId: "p1", professionalId: "pr2", unitId: "u2", day: DEMO_DAY, time: "17:00", status: "scheduled", exceptionReason: "Liberação fictícia previamente justificada pela gestão." },
  ];
  return {
    ...base,
    appointments,
    financial: [
      ...base.financial,
      { id: "fin:a8", appointmentId: "a8", unitId: "u1", professionalId: "pr2", expectedRevenue: EXPECTED_REVENUE, payout: 18, revenueReceived: true, payoutPaid: false, createdAt: DEMO_TIME },
      { id: "fin:a9", appointmentId: "a9", unitId: "u2", professionalId: "pr2", expectedRevenue: EXPECTED_REVENUE, payout: 18, revenueReceived: true, payoutPaid: true, createdAt: DEMO_TIME },
    ],
    policies: { ...base.policies, blockOnPriorPending: true },
    audit: [
      ...base.audit,
      { id: "seed-scenario", at: DEMO_TIME, actor: "Sistema demonstrativo", action: "SCENARIO", detail: "Estados fictícios: falta, cancelamento, rascunho, evolução final, conciliações, bloqueio e exceção." },
    ],
  };
}

export function hasPriorPending(state: DemoState, appointment: Appointment): boolean {
  return state.appointments.some((other) =>
    other.id !== appointment.id &&
    other.patientId === appointment.patientId &&
    other.status === "scheduled" &&
    (other.day < appointment.day || (other.day === appointment.day && other.time < appointment.time))
  );
}

function audit(state: DemoState, actor: string, action: string, detail: string, appointmentId?: string): AuditEvent[] {
  return [...state.audit, {
    id: `log-${state.audit.length + 1}`,
    at: new Date().toISOString(),
    actor,
    action,
    detail,
    appointmentId,
  }];
}

function requireReason(reason: string): string {
  const value = reason.trim();
  if (value.length < 10) throw new Error("Informe um motivo com ao menos 10 caracteres.");
  return value;
}

function conflict(state: DemoState, id: string, patientId: string, professionalId: string, day: string, time: string): boolean {
  return state.appointments.some((item) => item.id !== id && item.day === day && item.time === time && item.status !== "absent" && item.status !== "cancelled" && (item.patientId === patientId || item.professionalId === professionalId));
}

export function applyCommand(state: DemoState, command: Command): DemoState {
  if (command.type === "registerPatient") {
    const name = command.name.trim();
    const insurance = command.insurance.trim();
    const card = command.card.trim();
    if (name.length < 3 || !insurance || !card) throw new Error("Preencha nome fictício, convênio e carteira.");
    if (state.patients.some((item) => item.card.toLowerCase() === card.toLowerCase())) throw new Error("Carteira já cadastrada.");
    return {
      ...state,
      patients: [...state.patients, { id: `p${state.patients.length + 1}`, name, insurance, card }],
      audit: audit(state, command.actor, "REGISTER_PATIENT", "Cadastro demonstrativo; dados omitidos da auditoria."),
    };
  }
  if (command.type === "schedule") {
    if (!state.patients.some((item) => item.id === command.patientId)) throw new Error("Paciente não encontrado.");
    const professional = state.professionals.find((item) => item.id === command.professionalId);
    if (!professional?.units.includes(command.unitId)) throw new Error("Profissional indisponível nessa unidade.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(command.day) || !/^\d{2}:\d{2}$/.test(command.time)) throw new Error("Data ou horário inválido.");
    if (conflict(state, "", command.patientId, command.professionalId, command.day, command.time)) throw new Error("Paciente ou profissional já possui atendimento nesse horário.");
    const id = `a${Math.max(0, ...state.appointments.map((item) => Number(item.id.slice(1)) || 0)) + 1}`;
    return {
      ...state,
      appointments: [...state.appointments, { id, patientId: command.patientId, professionalId: command.professionalId, unitId: command.unitId, day: command.day, time: command.time, status: "scheduled" }],
      audit: audit(state, command.actor, "SCHEDULE", "Atendimento demonstrativo agendado.", id),
    };
  }
  if (command.type === "policy") {
    if (typeof command.enabled !== "boolean") throw new Error("Política inválida.");
    return {
      ...state,
      policies: { ...state.policies, [command.key]: command.enabled },
      audit: audit(state, command.actor, "POLICY", `${command.key}: ${command.enabled ? "ativa" : "inativa"}`),
    };
  }
  if (command.type === "payoutRule") {
    if (!Number.isFinite(command.amount) || command.amount < 0) throw new Error("Repasse inválido.");
    const at = new Date().toISOString();
    return {
      ...state,
      payoutRules: [...state.payoutRules, { effectiveAt: at, amount: command.amount }],
      audit: audit(state, command.actor, "PAYOUT_RULE", `Novo repasse: R$ ${command.amount.toFixed(2)}`),
    };
  }
  if (command.type === "settle") {
    const entry = state.financial.find((item) => item.id === command.entryId);
    if (!entry) throw new Error("Lançamento não encontrado.");
    if (entry[command.field]) return state;
    return {
      ...state,
      financial: state.financial.map((item) => item.id === entry.id ? { ...item, [command.field]: true } : item),
      audit: audit(state, command.actor, "SETTLE", `${command.field} no lançamento ${entry.id}`, entry.appointmentId),
    };
  }
  if (command.type === "reopenSettlement") {
    const entry = state.financial.find((item) => item.id === command.entryId);
    if (!entry || !entry[command.field]) throw new Error("Conciliação não encontrada.");
    const reason = requireReason(command.reason);
    return { ...state, financial: state.financial.map((item) => item.id === entry.id ? { ...item, [command.field]: false } : item), audit: audit(state, command.actor, "REOPEN_SETTLEMENT", `${command.field}: ${reason}`, entry.appointmentId) };
  }

  const appointment = state.appointments.find((item) => item.id === command.appointmentId);
  if (!appointment) throw new Error("Atendimento não encontrado.");
  const replace = (updated: Appointment) => state.appointments.map((item) => item.id === updated.id ? updated : item);

  if (command.type === "editAppointment") {
    if (appointment.status !== "scheduled") throw new Error("Reverta a confirmação ou falta antes de editar.");
    const reason = requireReason(command.reason);
    const professional = state.professionals.find((item) => item.id === command.professionalId);
    if (!professional?.units.includes(command.unitId)) throw new Error("Profissional indisponível nessa unidade.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(command.day) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(command.time)) throw new Error("Data ou horário inválido.");
    if (conflict(state, appointment.id, appointment.patientId, command.professionalId, command.day, command.time)) throw new Error("Paciente ou profissional já possui atendimento nesse horário.");
    const detail = `${appointment.day} ${appointment.time} ${UNIT_NAMES[appointment.unitId]} ${appointment.professionalId} → ${command.day} ${command.time} ${UNIT_NAMES[command.unitId]} ${command.professionalId}. Motivo: ${reason}`;
    return { ...state, appointments: replace({ ...appointment, day: command.day, time: command.time, professionalId: command.professionalId, unitId: command.unitId, exceptionReason: undefined }), audit: audit(state, command.actor, "EDIT_APPOINTMENT", detail, appointment.id) };
  }
  if (command.type === "reverse" || command.type === "cancel") {
    const reason = requireReason(command.reason);
    if (appointment.status === "cancelled") throw new Error("Atendimento já cancelado.");
    if (command.type === "reverse" && appointment.status === "scheduled") throw new Error("Atendimento já está agendado.");
    if (appointment.evolution) throw new Error("Existe evolução clínica. O profissional deve tratar explicitamente o registro antes da reversão.");
    if (command.type === "reverse" && conflict(state, appointment.id, appointment.patientId, appointment.professionalId, appointment.day, appointment.time)) throw new Error("Horário ocupado. Reagende o atendimento conflitante antes de desfazer a falta.");
    const entry = state.financial.find((item) => item.appointmentId === appointment.id);
    if (entry?.revenueReceived || entry?.payoutPaid) throw new Error("Lançamento já conciliado. A gestão precisa tratar o financeiro antes desta reversão.");
    const reversal: FinancialReversal | null = entry ? { id: `rev:${state.audit.length + 1}:${appointment.id}`, appointmentId: appointment.id, unitId: entry.unitId, professionalId: entry.professionalId, patientId: appointment.patientId, insurance: state.patients.find((patient) => patient.id === appointment.patientId)?.insurance ?? "Convênio fictício", day: appointment.day, expectedRevenue: entry.expectedRevenue, payout: entry.payout, reversedAt: new Date().toISOString(), reason, actor: command.actor } : null;
    return { ...state,
      appointments: replace({ ...appointment, status: command.type === "reverse" ? "scheduled" : "cancelled", exceptionReason: undefined }),
      financial: state.financial.filter((item) => item.appointmentId !== appointment.id),
      financialReversals: reversal ? [...(state.financialReversals ?? []), reversal] : state.financialReversals ?? [],
      audit: audit(state, command.actor, command.type === "reverse" ? "REVERSE" : "CANCEL", `${appointment.status} → ${command.type === "reverse" ? "scheduled" : "cancelled"}; ${reversal ? `lançamento ${entry?.id} revertido (receita R$ ${entry?.expectedRevenue.toFixed(2)}, repasse R$ ${entry?.payout.toFixed(2)})` : "sem lançamento"}. Motivo: ${reason}`, appointment.id),
    };
  }

  if (command.type === "confirm") {
    if (appointment.status === "confirmed") return state; // Idempotência, inclusive da produção.
    if (appointment.status !== "scheduled") throw new Error("Somente atendimento agendado pode ser confirmado.");
    if (state.policies.blockOnPriorPending && hasPriorPending(state, appointment) && !appointment.exceptionReason) {
      throw new Error("Bloqueio configurado: há confirmação anterior pendente. Solicite liberação à gestão.");
    }
    const payout = state.payoutRules[state.payoutRules.length - 1].amount;
    const entry: FinancialEntry = {
      id: `fin:${appointment.id}`,
      appointmentId: appointment.id,
      unitId: appointment.unitId,
      professionalId: appointment.professionalId,
      expectedRevenue: EXPECTED_REVENUE,
      payout,
      revenueReceived: false,
      payoutPaid: false,
      createdAt: new Date().toISOString(),
    };
    return {
      ...state,
      appointments: replace({ ...appointment, status: "confirmed" }),
      financial: state.financial.some((item) => item.appointmentId === appointment.id) ? state.financial : [...state.financial, entry],
      audit: audit(state, command.actor, "CONFIRM", "Prontuário liberado e produção financeira criada independentemente.", appointment.id),
    };
  }
  if (command.type === "absence") {
    if (appointment.status !== "scheduled") throw new Error("Somente atendimento agendado pode receber falta.");
    return { ...state, appointments: replace({ ...appointment, status: "absent" }), audit: audit(state, command.actor, "ABSENCE", "Falta registrada.", appointment.id) };
  }
  if (command.type === "transfer") {
    if (appointment.status !== "scheduled") throw new Error("Transferência demonstrativa permitida apenas antes da confirmação.");
    if (appointment.unitId === command.unitId) return state;
    const professional = state.professionals.find((item) => item.id === appointment.professionalId);
    if (!professional?.units.includes(command.unitId)) throw new Error("Profissional não atende na unidade de destino.");
    if (state.appointments.some((item) => item.id !== appointment.id && item.professionalId === appointment.professionalId && item.unitId === command.unitId && item.day === appointment.day && item.time === appointment.time && item.status !== "absent")) {
      throw new Error("Horário ocupado na unidade de destino.");
    }
    return {
      ...state,
      appointments: replace({ ...appointment, unitId: command.unitId }),
      audit: audit(state, command.actor, "TRANSFER", `${UNIT_NAMES[appointment.unitId]} → ${UNIT_NAMES[command.unitId]}; mesmo ID, nenhum lançamento adicional.`, appointment.id),
    };
  }
  if (command.type === "exception") {
    if (appointment.status !== "scheduled") throw new Error("Somente atendimento agendado pode ser liberado.");
    if (!state.policies.blockOnPriorPending || !hasPriorPending(state, appointment)) throw new Error("Não há bloqueio aplicável.");
    const reason = command.reason.trim();
    if (reason.length < 10) throw new Error("Informe justificativa com ao menos 10 caracteres.");
    return { ...state, appointments: replace({ ...appointment, exceptionReason: reason }), audit: audit(state, command.actor, "EXCEPTION", reason, appointment.id) };
  }
  if (command.type === "evolve") {
    if (appointment.status !== "confirmed") throw new Error("Prontuário ainda não liberado.");
    if (appointment.professionalId !== command.professionalId) throw new Error("Acesso não autorizado ao prontuário.");
    if (appointment.evolutionStatus === "final") throw new Error("Evolução finalizada. Registre um complemento.");
    const note = command.note.trim();
    if (note.length < 10) throw new Error("Registre ao menos 10 caracteres de evolução fictícia.");
    return { ...state, appointments: replace({ ...appointment, evolution: note, evolutionStatus: "final" }), audit: audit(state, command.actor, "EVOLUTION", "Evolução demonstrativa finalizada, conteúdo omitido da auditoria.", appointment.id) };
  }
  if (["saveDraft", "finalizeEvolution", "amendEvolution", "discardDraft", "voidEvolution"].includes(command.type)) {
    if (appointment.status !== "confirmed") throw new Error("Prontuário ainda não liberado.");
    if (appointment.professionalId !== command.professionalId) throw new Error("Acesso não autorizado ao prontuário.");
    if (command.type === "saveDraft") {
      if (appointment.evolutionStatus === "final") throw new Error("Evolução finalizada. Registre um complemento.");
      const note = command.note.trim();
      if (note.length < 10) throw new Error("Registre ao menos 10 caracteres fictícios.");
      return { ...state, appointments: replace({ ...appointment, evolution: note, evolutionStatus: "draft" }), audit: audit(state, command.actor, "DRAFT", "Rascunho salvo; conteúdo omitido.", appointment.id) };
    }
    if (command.type === "finalizeEvolution") {
      if (!appointment.evolution || appointment.evolutionStatus === "final") throw new Error("Salve um rascunho antes de finalizar.");
      return { ...state, appointments: replace({ ...appointment, evolutionStatus: "final" }), audit: audit(state, command.actor, "FINALIZE", "Evolução finalizada; conteúdo omitido.", appointment.id) };
    }
    if (command.type === "discardDraft") {
      if (appointment.evolutionStatus !== "draft") throw new Error("Apenas rascunho pode ser descartado.");
      const reason = requireReason(command.reason);
      return { ...state, appointments: replace({ ...appointment, evolution: undefined, evolutionStatus: undefined }), audit: audit(state, command.actor, "DISCARD_DRAFT", `Rascunho descartado. Motivo: ${reason}`, appointment.id) };
    }
    if (command.type === "voidEvolution") {
      if (!appointment.evolution) throw new Error("Evolução não encontrada.");
      const reason = requireReason(command.reason);
      return { ...state, appointments: replace({ ...appointment, evolution: undefined, evolutionStatus: undefined, amendments: undefined }), audit: audit(state, command.actor, "VOID_EVOLUTION", `Registro fictício invalidado pelo profissional. Motivo: ${reason}`, appointment.id) };
    }
    if (appointment.evolutionStatus !== "final" && !appointment.evolution) throw new Error("Finalize a evolução antes de complementar.");
    const note = command.note.trim();
    if (note.length < 10) throw new Error("Registre ao menos 10 caracteres fictícios.");
    return { ...state, appointments: replace({ ...appointment, amendments: [...(appointment.amendments ?? []), { at: new Date().toISOString(), note }] }), audit: audit(state, command.actor, "AMEND", "Complemento registrado; conteúdo omitido.", appointment.id) };
  }
  return state;
}

export function executeForRole(state: DemoState, role: Role, command: Command): DemoState {
  const receptionActions: Command["type"][] = ["registerPatient", "schedule", "confirm", "absence", "transfer", "editAppointment", "reverse", "cancel"];
  const managementActions: Command["type"][] = ["exception", "policy"];
  if (role === "finance" && !["settle", "payoutRule", "reopenSettlement"].includes(command.type)) throw new Error("Ação indisponível para o financeiro.");
  if (role === "reception" && !receptionActions.includes(command.type)) throw new Error("Ação indisponível para a recepção.");
  if (role === "management" && !managementActions.includes(command.type)) throw new Error("Ação indisponível para a gestão.");
  if (role === "professional" && !["evolve", "saveDraft", "finalizeEvolution", "amendEvolution", "discardDraft", "voidEvolution"].includes(command.type)) throw new Error("Ação indisponível para o profissional.");
  return applyCommand(state, command);
}

export function totals(state: DemoState, unit: UnitId | "all") {
  const appointments = state.appointments.filter((item) => unit === "all" || item.unitId === unit);
  const financial = state.financial.filter((item) => unit === "all" || item.unitId === unit);
  return {
    scheduled: appointments.filter((item) => item.status === "scheduled").length,
    confirmed: appointments.filter((item) => item.status === "confirmed").length,
    absent: appointments.filter((item) => item.status === "absent").length,
    clinicalPending: appointments.filter((item) => item.status === "confirmed" && item.evolutionStatus !== "final" && !(!item.evolutionStatus && item.evolution)).length,
    expectedRevenue: financial.reduce((sum, item) => sum + item.expectedRevenue, 0),
    receivedRevenue: financial.filter((item) => item.revenueReceived).reduce((sum, item) => sum + item.expectedRevenue, 0),
    payoutDue: financial.filter((item) => !item.payoutPaid).reduce((sum, item) => sum + item.payout, 0),
  };
}

export interface PendingItem {
  appointment: Appointment;
  kind: "confirmation" | "clinical" | "blocked";
}

export function pendingItems(state: DemoState, unit: UnitId | "all" = "all"): PendingItem[] {
  return state.appointments.filter((item) => unit === "all" || item.unitId === unit).flatMap((appointment): PendingItem[] => {
    if (appointment.status === "scheduled") return [{ appointment, kind: state.policies.blockOnPriorPending && hasPriorPending(state, appointment) && !appointment.exceptionReason ? "blocked" as const : "confirmation" as const }];
    if (appointment.status === "confirmed" && appointment.evolutionStatus !== "final" && !(appointment.evolution && !appointment.evolutionStatus)) return [{ appointment, kind: "clinical" as const }];
    return [];
  });
}

export function notificationItems(state: DemoState, unit: UnitId | "all" = "all"): PendingItem[] {
  return pendingItems(state, unit).filter((item) => item.kind === "clinical" ? state.policies.notifyOnClinicalPending : state.policies.notifyOnConfirmationPending);
}
