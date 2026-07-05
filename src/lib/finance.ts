import type {
  Expense,
  FinanceState,
  MonthSummary,
  TaxPreset,
} from "../types/finance";

export const categories = [
  "Жилье",
  "Еда",
  "Транспорт",
  "Сервисы",
  "Здоровье",
  "Другое",
];

export const taxPresets: TaxPreset[] = [
  { fixedTax: 3200, id: "fop2", label: "ФОП 2", percent: 0 },
  { fixedTax: 1760, id: "fop3", label: "ФОП 3", percent: 5 },
  { fixedTax: 0, id: "manual", label: "Вручную", percent: 10 },
];

export const previousMonths: MonthSummary[] = [
  { expenses: 41_300, income: 92_000, label: "Мар" },
  { expenses: 48_900, income: 104_000, label: "Апр" },
  { expenses: 45_200, income: 98_000, label: "Май" },
  { expenses: 52_400, income: 112_000, label: "Июн" },
];

export const defaultFinanceState: FinanceState = {
  expenses: [
    {
      amount: 1260,
      category: "Еда",
      date: "2026-07-05",
      id: "seed-food",
      note: "Продукты",
    },
    {
      amount: 420,
      category: "Транспорт",
      date: "2026-07-05",
      id: "seed-transport",
      note: "Такси",
    },
  ],
  fixedTax: 1760,
  income: 0,
  taxMode: "fop3",
  taxPercent: 5,
};

export const createExpenseId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}`;
};

export const formatMoney = (value: number) =>
  new Intl.NumberFormat("uk-UA", {
    currency: "UAH",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);

export const getToday = () => new Date().toISOString().slice(0, 10);

export const calculateTotalExpenses = (expenses: Expense[]) =>
  expenses.reduce((sum, expense) => sum + expense.amount, 0);

export const calculateTaxAmount = (finance: FinanceState) =>
  Math.round(finance.income * (finance.taxPercent / 100) + finance.fixedTax);

export const calculateNetIncome = (finance: FinanceState) =>
  Math.max(0, finance.income - calculateTaxAmount(finance));

export const getExpensesByCategory = (expenses: Expense[]) =>
  categories.map((category) => ({
    amount: expenses
      .filter((expense) => expense.category === category)
      .reduce((sum, expense) => sum + expense.amount, 0),
    category,
  }));

export const getMonthlyChart = ({
  finance,
  totalExpenses,
}: {
  finance: FinanceState;
  totalExpenses: number;
}) => [
  ...previousMonths,
  {
    expenses: totalExpenses,
    income: finance.income,
    label: "Июл",
  },
];
