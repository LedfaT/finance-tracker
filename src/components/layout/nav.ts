import type { TranslationKey } from "../../lib/i18n";
import type { ScreenId } from "../../types/finance";

export const navItems: { id: ScreenId; labelKey: TranslationKey }[] = [
  { id: "auth", labelKey: "navAuth" },
  { id: "income", labelKey: "navIncome" },
  { id: "taxes", labelKey: "navTaxes" },
  { id: "expenses", labelKey: "navExpenses" },
  { id: "reports", labelKey: "navReports" },
];
