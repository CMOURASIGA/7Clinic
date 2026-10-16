import { createScenario, type DemoState } from "./domain.ts";

const STORAGE_KEY = "7clinic:spec00:demo:v1";

function isDemoState(value: unknown): value is DemoState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<DemoState>;
  return state.version === 1
    && Array.isArray(state.appointments)
    && Array.isArray(state.patients)
    && Array.isArray(state.professionals)
    && Array.isArray(state.financial)
    && Array.isArray(state.payoutRules)
    && state.payoutRules.length > 0
    && Array.isArray(state.audit)
    && !!state.policies;
}

export const localRepository = {
  load(): DemoState {
    if (typeof window === "undefined") return createScenario();
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) return createScenario();
      const parsed: unknown = JSON.parse(saved);
      return isDemoState(parsed) ? { ...parsed, financialReversals: Array.isArray(parsed.financialReversals) ? parsed.financialReversals : [] } : createScenario();
    } catch {
      return createScenario();
    }
  },
  save(state: DemoState) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },
  clear() {
    window.localStorage.removeItem(STORAGE_KEY);
  },
};
