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
}: ExpensesScreenProps) => {
  const totalExpenses = finance.expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const canAddExpense = Number(expenseDraft.amount) > 0;

  return (
    <section className="flow-screen">
      <div className="section-intro">
        <span>{t(locale, "navExpenses")}</span>
        <h2>{t(locale, "expenses")}</h2>
        <p>{t(locale, "monthlyReportHint")}</p>
      </div>

      <div className="panel form-panel">
        <div className="two-fields">
          <label className="field">
            <span>{t(locale, "amount")}</span>
            <input
              inputMode="decimal"
              onChange={(event) =>
                onUpdateDraft({ amount: event.target.value })
              }
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
            onChange={(event) =>
              onUpdateDraft({ category: event.target.value })
            }
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
        <button
          className="primary-action"
          disabled={!canAddExpense}
          onClick={onAddExpense}
          type="button"
        >
          {t(locale, "addExpense")}
        </button>
      </div>

      <div className="panel records-panel">
        <div className="panel-head">
          <div>
            <strong>{t(locale, "recentExpenses")}</strong>
            <span>{formatMoney(totalExpenses)}</span>
          </div>
        </div>

        {finance.expenses.length > 0 ? (
          <div className="records-list">
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
                  className="remove-button"
                  onClick={() => onRemoveExpense(expense.id)}
                  type="button"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <strong>{t(locale, "noExpensesTitle")}</strong>
            <span>{t(locale, "noExpensesHint")}</span>
          </div>
        )}
      </div>
    </section>
  );
};
