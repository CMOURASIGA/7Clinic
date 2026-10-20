import type { Appointment, DemoState, UnitId } from "../lib/domain";
import { UNIT_NAMES } from "../lib/domain";
import { useState } from "react";

export function ReasonDialog({ title, onConfirm, onClose }: { title: string; onConfirm: (reason: string) => boolean; onClose: () => void }) {
  const [reason, setReason] = useState("");
  return <div className="dialog-backdrop" role="presentation"><div className="reason-dialog" role="dialog" aria-modal="true" aria-label={title}>
    <h2>{title}</h2><p>Informe o motivo para registrar esta operação no histórico demonstrativo.</p>
    <form onSubmit={(event) => { event.preventDefault(); if (onConfirm(reason)) onClose(); }}>
      <label>Motivo<input autoFocus required minLength={10} value={reason} onChange={(event) => setReason(event.target.value)}/></label>
      <div className="button-line"><button type="button" className="button button-light" onClick={onClose}>Voltar</button><button className="button button-primary">Confirmar</button></div>
    </form>
  </div></div>;
}

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
  return { scheduled: "A confirmar", prebooked: "Pré-agendado", confirmed: "Confirmado", absent: "Falta", cancelled: "Cancelado" }[status];
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
