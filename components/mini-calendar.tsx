"use client";

import { useState } from "react";
import { DEMO_DAY } from "../lib/domain";

export function MiniCalendar({ selectedDay, onDay }: { selectedDay: string; onDay: (day: string) => void }) {
  const [month, setMonth] = useState((selectedDay || DEMO_DAY).slice(0, 7));
  const [year, monthNumber] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
  const count = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const title = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
  function move(delta: number) {
    const next = new Date(Date.UTC(year, monthNumber - 1 + delta, 1));
    setMonth(`${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return <div className="calendar-box" aria-label="Mini calendário da agenda">
    <div className="calendar-head"><strong>Data da agenda</strong><span>Recepção e profissionais</span></div>
    <div className="calendar-month"><button type="button" aria-label="Mês anterior" onClick={() => move(-1)}>‹</button><strong>{title}</strong><button type="button" aria-label="Próximo mês" onClick={() => move(1)}>›</button></div>
    <div className="calendar-days">{["D", "S", "T", "Q", "Q", "S", "S"].map((label, index) => <b key={index}>{label}</b>)}{Array.from({ length: first }, (_, index) => <span key={`empty-${index}`}/>)}{Array.from({ length: count }, (_, index) => { const date = `${month}-${String(index + 1).padStart(2, "0")}`; return <button type="button" key={date} aria-label={`Selecionar ${date}`} aria-pressed={selectedDay === date} className={selectedDay === date ? "today" : ""} onClick={() => onDay(date)}>{index + 1}</button>; })}</div>
    <button type="button" className="reset" onClick={() => onDay("")}>Mostrar todas as datas</button>
  </div>;
}
