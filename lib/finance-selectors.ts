import type { DemoState, FinancialEntry, FinancialReversal, UnitId } from "./domain";

export type Account = "all" | "receivable" | "payable";
export type Situation = "all" | "open" | "settled" | "reversed";
export interface FinanceFilters {
  professionalId: string;
  insurance: string;
  from: string;
  to: string;
  account: Account;
  situation: Situation;
}

export function filterFinance(state: DemoState, unit: UnitId | "all", filters: FinanceFilters) {
  const matches = (item: FinancialEntry | FinancialReversal) => {
    const reversed = "reversedAt" in item;
    const appointment = reversed ? undefined : state.appointments.find((a) => a.id === item.appointmentId);
    const patient = reversed ? undefined : state.patients.find((p) => p.id === appointment?.patientId);
    const day = reversed ? item.day : appointment?.day;
    const insurance = reversed ? item.insurance : patient?.insurance;
    return (unit === "all" || item.unitId === unit)
      && (!filters.professionalId || item.professionalId === filters.professionalId)
      && (!filters.insurance || insurance === filters.insurance)
      && (!filters.from || !!day && day >= filters.from)
      && (!filters.to || !!day && day <= filters.to);
  };
  const entries = state.financial.filter((item) => {
    if (!matches(item) || filters.situation === "reversed") return false;
    if (filters.situation === "all") return true;
    const receive = filters.account !== "payable" && (filters.situation === "settled" ? item.revenueReceived : !item.revenueReceived);
    const pay = filters.account !== "receivable" && (filters.situation === "settled" ? item.payoutPaid : !item.payoutPaid);
    return receive || pay;
  });
  const reversals = (state.financialReversals ?? []).filter((item) => matches(item) && (filters.situation === "all" || filters.situation === "reversed"));
  return { entries, reversals };
}

