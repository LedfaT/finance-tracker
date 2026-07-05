import type { FinanceState } from "../types/finance";
import { defaultFinanceState } from "./finance";

const storageKey = "finance-mini-app-state";

export const getStoredFinanceState = () => {
  try {
    const rawState = localStorage.getItem(storageKey);

    if (!rawState) {
      return defaultFinanceState;
    }

    return {
      ...defaultFinanceState,
      ...(JSON.parse(rawState) as Partial<FinanceState>),
    };
  } catch {
    return defaultFinanceState;
  }
};

export const storeFinanceState = (finance: FinanceState) => {
  localStorage.setItem(storageKey, JSON.stringify(finance));
};
