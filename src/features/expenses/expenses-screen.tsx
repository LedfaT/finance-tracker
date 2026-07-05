import { categories, formatMoney } from "../../lib/finance";
import { categoryLabel, t } from "../../lib/i18n";
import type { ExpenseDraft, FinanceState, Locale } from "../../types/finance";

interface ExpensesScreenProps {
  expenseDraft: ExpenseDraft;
  finance: FinanceState;
  locale: Locale;
  onAddExpense: () => void;
  onRemoveExpense: (expenseId: string) => void;
  onUpdateDraft: (patch: Partial<ExpenseDraft>) => void;
}

export const ExpensesScreen = ({
  expenseDraft,
  finance,
  locale,
  onAddExpense,
  onRemoveExpense,
  onUpdateDraft,
}: ExpensesScreenProps) => (
  <section className="flow-screen">
    <div className="message message--bot">
      <span>{t(locale, "navExpenses")}</span>
      <strong>{t(locale, "expenses")}</strong>
      <p>{t(locale, "monthlyReportHint")}</p>
    </div>

    <div className="panel">
      <div className="two-fields">
        <label className="field">
          <span>{t(locale, "amount")}</span>
          <input
            inputMode="decimal"
            onChange={(event) => onUpdateDraft({ amount: event.target.value })}
            placeholder="850"
            type="number"
            value={expenseDraft.amount}
          />
        </label>
        <label className="field">
          <span>{t(locale, "date")}</span>
          <input
            onChange={(event) => onUpdateDraft({ date: event.target.value })}
            type="date"
            value={expenseDraft.date}
          />
        </label>
      </div>
      <label className="field">
        <span>{t(locale, "category")}</span>
        <select
          onChange={(event) => onUpdateDraft({ category: event.target.value })}
          value={expenseDraft.category}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {categoryLabel(locale, category)}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>{t(locale, "comment")}</span>
        <input
          onChange={(event) => onUpdateDraft({ note: event.target.value })}
          placeholder="Кофе, аренда, подписка..."
          value={expenseDraft.note}
        />
      </label>
      <button className="primary-action" onClick={onAddExpense} type="button">
        {t(locale, "addExpense")}
      </button>
    </div>

    <div className="list-panel">
      {finance.expenses.map((expense) => (
        <div className="expense-row" key={expense.id}>
          <div>
            <strong>{expense.note}</strong>
            <span>
              {categoryLabel(locale, expense.category)} · {expense.date}
            </span>
          </div>
          <b>{formatMoney(expense.amount)}</b>
          <button
            aria-label="Удалить расход"
            onClick={() => onRemoveExpense(expense.id)}
            type="button"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  </section>
);
