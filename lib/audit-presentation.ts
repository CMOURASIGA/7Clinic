import type { AuditEvent, DemoState } from "./domain.ts";
import { UNIT_NAMES } from "./domain.ts";

const operations: Record<string, string> = {
  DELETE_APPOINTMENT: "Exclusão de agendamento", EDIT_APPOINTMENT: "Correção de agendamento",
  REVERSE: "Reversão de atendimento", CANCEL: "Cancelamento", PAYOUT_RULE: "Alteração da regra de repasse",
  POLICY: "Alteração de bloqueio ou alerta", EXCEPTION: "Liberação excepcional", SETTLE: "Conciliação financeira",
  REOPEN_SETTLEMENT: "Reabertura financeira", CONFIRM: "Confirmação", ABSENCE: "Falta", TRANSFER: "Transferência",
  SCHEDULE: "Agendamento", REGISTER_PATIENT: "Cadastro de paciente", VOID_EVOLUTION: "Invalidação de evolução",
};

export function operationLabel(action: string) {
  return operations[action] ?? action.replaceAll("_", " ").toLowerCase();
}

function dayLabel(day: string) { return day.split("-").reverse().join("/"); }

export function relatedAppointment(event: AuditEvent, state: DemoState): string | null {
  if (!event.appointmentId) return null;
  const appointment = state.appointments.find((item) => item.id === event.appointmentId);
  if (appointment) {
    const patient = state.patients.find((item) => item.id === appointment.patientId);
    return `${patient?.name ?? "Paciente fictício"}, ${dayLabel(appointment.day)} às ${appointment.time}, ${UNIT_NAMES[appointment.unitId]}`;
  }
  const historical = event.before?.match(/(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/);
  return historical ? `agendamento excluído de ${dayLabel(historical[1])} às ${historical[2]}` : "agendamento excluído da demonstração";
}

export function auditText(value: string, state: DemoState, event: AuditEvent): string {
  const related = relatedAppointment(event, state);
  if (event.action === "SETTLE") return `${value.includes("payoutPaid") ? "Repasse conciliado" : "Recebimento conciliado"}${related ? ` para ${related}` : ""}.`;
  if (event.action === "REOPEN_SETTLEMENT") {
    const reason = value.split(":").slice(1).join(":").trim();
    return `${value.includes("payoutPaid") ? "Repasse reaberto" : "Recebimento reaberto"}. Motivo: ${reason}`;
  }
  return value
    .replace(/\b(?:revenueReceived|payoutPaid)\b/g, (field) => field === "payoutPaid" ? "repasse" : "recebimento")
    .replace(/\bfin:[\w-]+\b/g, related ?? "lançamento relacionado")
    .replace(/\bpr\d+\b/g, (id) => state.professionals.find((item) => item.id === id)?.name ?? "profissional fictício")
    .replace(/\bR\$\s*(\d+(?:[.,]\d{1,2})?)\b/g, (_match, amount: string) => `R$ ${Number(amount.replace(",", ".")).toFixed(2).replace(".", ",")}`)
    .replace(/\b(blockOnPriorPending|notifyOnClinicalPending|notifyOnConfirmationPending)\b/g, (key) => ({ blockOnPriorPending: "Bloqueio por confirmação anterior pendente", notifyOnClinicalPending: "Alerta de prontuário pendente", notifyOnConfirmationPending: "Alerta de confirmação pendente" })[key] ?? key)
    .replace(/\b(confirmed|scheduled|cancelled|absent)\b/g, (status) => ({ confirmed: "confirmado", scheduled: "agendado", cancelled: "cancelado", absent: "falta" })[status] ?? status);
}

export function presentAudit(event: AuditEvent, state: DemoState) {
  return {
    operation: operationLabel(event.action),
    related: relatedAppointment(event, state),
    detail: auditText(event.detail, state, event),
    before: event.before ? auditText(event.before, state, event) : null,
    after: event.after ? auditText(event.after, state, event) : null,
  };
}
