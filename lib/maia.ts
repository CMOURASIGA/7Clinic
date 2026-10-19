import { hasPriorPending, type Appointment, type DemoState, type UnitId, UNIT_NAMES } from "./domain.ts";

const currency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const normalize = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const clinicalPending = (item: Appointment) => item.status === "confirmed" && item.evolutionStatus !== "final" && !(!item.evolutionStatus && item.evolution);

export function answerMaia(question: string, state: DemoState, scope: { unit: UnitId | "all"; professionalId: string; from: string; to: string }): string {
  const appointments = state.appointments.filter((item) => (scope.unit === "all" || item.unitId === scope.unit) && (!scope.professionalId || item.professionalId === scope.professionalId) && (!scope.from || item.day >= scope.from) && (!scope.to || item.day <= scope.to));
  const ids = new Set(appointments.map((item) => item.id));
  const entries = state.financial.filter((item) => ids.has(item.appointmentId));
  const input = normalize(question.trim());
  if (!input) return "Informe uma pergunta operacional sobre os dados fictícios desta visão.";
  const professionals = state.professionals.filter((item) => !scope.professionalId || item.id === scope.professionalId);
  if (input.includes("profissional") && (input.includes("prontuario") || input.includes("evoluc")) && (input.includes("mais") || input.includes("penden"))) {
    const counts = professionals.map((person) => ({ name: person.name, count: appointments.filter((item) => item.professionalId === person.id && clinicalPending(item)).length }));
    const max = Math.max(0, ...counts.map((item) => item.count));
    if (!max) return "Nenhum profissional possui prontuários pendentes nos filtros atuais.";
    return `${counts.filter((item) => item.count === max).map((item) => item.name).join(" e ")} possui ${max} prontuário(s) pendente(s) nesta visão.`;
  }
  if ((input.includes("aguard") || input.includes("penden")) && input.includes("confirm")) {
    const count = appointments.filter((item) => item.status === "scheduled").length;
    return `${count} atendimento(s) aguardam confirmação nos filtros atuais.`;
  }
  if (input.includes("unidade") && input.includes("penden")) {
    const units: UnitId[] = scope.unit === "all" ? ["u1", "u2"] : [scope.unit];
    const counts = units.map((id) => ({ name: UNIT_NAMES[id], count: appointments.filter((item) => item.unitId === id && (item.status === "scheduled" || clinicalPending(item))).length }));
    const max = Math.max(0, ...counts.map((item) => item.count));
    return max ? `${counts.filter((item) => item.count === max).map((item) => item.name).join(" e ")} possui mais pendências: ${max} atendimento(s).` : "Nenhuma unidade possui pendências nos filtros atuais.";
  }
  if (input.includes("produc") && input.includes("profissional")) {
    return professionals.map((person) => `${person.name}: ${currency(entries.filter((item) => item.professionalId === person.id).reduce((total, item) => total + item.expectedRevenue, 0))}`).join("; ") + ". Valores demonstrativos dos filtros atuais.";
  }
  if (input.includes("receb") && input.includes("penden")) {
    const pending = entries.filter((item) => !item.revenueReceived);
    return `${pending.length} recebimento(s) pendente(s), total de ${currency(pending.reduce((total, item) => total + item.expectedRevenue, 0))}, nos filtros atuais. Atendimentos: ${pending.map((item) => item.appointmentId).join(", ") || "nenhum"}.`;
  }
  if (input.includes("bloque") || input.includes("exce")) {
    const blocked = appointments.filter((item) => item.status === "scheduled" && state.policies.blockOnPriorPending && !item.exceptionReason && hasPriorPending(state, item)).length;
    return `A regra está ${state.policies.blockOnPriorPending ? "ativa" : "inativa"}; ${blocked} atendimento(s) bloqueado(s) nesta visão. A Gestão pode justificar liberações excepcionais.`;
  }
  if (input.includes("finance") || input.includes("receita") || input.includes("repasse")) {
    return `Produção demonstrativa: ${currency(entries.reduce((total, item) => total + item.expectedRevenue, 0))}; recebidos: ${currency(entries.filter((item) => item.revenueReceived).reduce((total, item) => total + item.expectedRevenue, 0))}; repasses pendentes: ${currency(entries.filter((item) => !item.payoutPaid).reduce((total, item) => total + item.payout, 0))}.`;
  }
  return "Ainda não consigo responder a essa pergunta com os dados demonstrativos. Tente perguntar sobre confirmação, prontuários pendentes, unidade, produção por profissional ou recebimentos pendentes.";
}
