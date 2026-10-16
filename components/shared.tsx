import type { Appointment, DemoState, UnitId } from "../lib/domain";
import { UNIT_NAMES } from "../lib/domain";

export function money(amount: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);
}

export function patientName(state: DemoState, appointment: Appointment) {
  return state.patients.find((item) => item.id === appointment.patientId)?.name ?? "Paciente não encontrado";
}

export function professionalName(state: DemoState, appointment: Appointment) {
  return state.professionals.find((item) => item.id === appointment.professionalId)?.name ?? "Profissional não encontrado";
}

export function statusLabel(status: Appointment["status"]) {
  return { scheduled: "A confirmar", confirmed: "Confirmado", absent: "Falta", cancelled: "Cancelado" }[status];
}

export function Status({ status }: { status: Appointment["status"] }) {
  return <span className={`status status-${status}`}>{statusLabel(status)}</span>;
}

export function Stat({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return <div className="stat"><span className="eyebrow">{label}</span><strong>{value}</strong><small>{note}</small></div>;
}

export function UnitPicker({ value, onChange, allowAll = true }: { value: UnitId | "all"; onChange: (value: UnitId | "all") => void; allowAll?: boolean }) {
  return <label className="picker-label">Unidade
    <select aria-label="Filtrar unidade" value={value} onChange={(event) => onChange(event.target.value as UnitId | "all")}>
      {allowAll ? <option value="all">Visão consolidada</option> : null}
      {Object.entries(UNIT_NAMES).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
    </select>
  </label>;
}
