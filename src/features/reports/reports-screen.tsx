import { formatMoney } from "../../lib/finance";
import { categoryLabel, t } from "../../lib/i18n";
import type { AppSettings, Locale, MonthSummary } from "../../types/finance";

interface CategorySummary {
  amount: number;
  category: string;
}

interface ReportsScreenProps {
  balance: number;
  categorySummary: CategorySummary[];
  income: number;
  locale: Locale;
  monthlyChart: MonthSummary[];
  onSettingsChange: (patch: Partial<AppSettings>) => void;
  settings: AppSettings;
  taxAmount: number;
  totalExpenses: number;
}

export const ReportsScreen = ({
  balance,
  categorySummary,
  income,
  locale,
  monthlyChart,
  onSettingsChange,
  settings,
  taxAmount,
  totalExpenses,
}: ReportsScreenProps) => {
  const maxChartValue = Math.max(
    ...monthlyChart.flatMap((month) => [month.income, month.expenses]),
    1
  );
  const maxCategoryAmount = Math.max(
    ...categorySummary.map((item) => item.amount),
    1
  );
  const getChartHeight = (value: number) =>
    `${Math.max(8, Math.round((value / maxChartValue) * 104))}px`;

  return (
    <section className="flow-screen">
      <div className="report-hero">
        <span>{t(locale, "reportMonth")}</span>
        <strong>{formatMoney(balance)}</strong>
        <p>{t(locale, "balanceCaption")}</p>
      </div>

      <div className="summary-grid report-summary">
        <div>
          <span>{t(locale, "income")}</span>
          <strong>{formatMoney(income)}</strong>
        </div>
        <div>
          <span>{t(locale, "taxes")}</span>
          <strong>{formatMoney(taxAmount)}</strong>
        </div>
        <div>
          <span>{t(locale, "expenses")}</span>
          <strong>{formatMoney(totalExpenses)}</strong>
        </div>
      </div>

      <div className="panel">
        <div className="setting-row">
          <div>
            <strong>{t(locale, "monthlyReport")}</strong>
            <span>{t(locale, "monthlyReportHint")}</span>
          </div>
          <label className="switch" aria-label={t(locale, "monthlyReport")}>
            <input
              checked={settings.monthlyReportEnabled}
              onChange={(event) =>
                onSettingsChange({ monthlyReportEnabled: event.target.checked })
              }
              type="checkbox"
            />
            <span />
          </label>
        </div>
      </div>

      <div className="panel chart-panel">
        <div className="panel-head">
          <div>
            <strong>{t(locale, "monthlyComparison")}</strong>
            <span>
              {t(locale, "income")} / {t(locale, "expenses")}
            </span>
          </div>
        </div>
        <div className="bars" aria-label="Сравнение месяцев">
          {monthlyChart.map((month) => (
            <div className="bar-group" key={month.label}>
              <div className="bar-pair">
                <i
                  className="bar bar--income"
                  style={{ height: getChartHeight(month.income) }}
                />
                <i
                  className="bar bar--expense"
                  style={{ height: getChartHeight(month.expenses) }}
                />
              </div>
              <span>{month.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel records-panel">
        <div className="panel-head">
          <div>
            <strong>{t(locale, "categoryBreakdown")}</strong>
            <span>{t(locale, "expenses")}</span>
          </div>
        </div>
        <div className="records-list category-list">
          {categorySummary.map((item) => (
            <div className="category-row" key={item.category}>
              <div>
                <span>{categoryLabel(locale, item.category)}</span>
                <div className="category-track" aria-hidden="true">
                  <i
                    style={{
                      width: `${Math.round(
                        (item.amount / maxCategoryAmount) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
              <strong>{formatMoney(item.amount)}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
