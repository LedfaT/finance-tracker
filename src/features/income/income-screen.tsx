import { formatMoney } from "../../lib/finance";
import { t } from "../../lib/i18n";
import type { FinanceState, Locale } from "../../types/finance";

interface IncomeScreenProps {
  finance: FinanceState;
  locale: Locale;
  netIncome: number;
  onNext: () => void;
  onUpdateFinance: (patch: Partial<FinanceState>) => void;
  taxAmount: number;
}

export const IncomeScreen = ({
  finance,
  locale,
  netIncome,
  onNext,
  onUpdateFinance,
  taxAmount,
}: IncomeScreenProps) => (
  <section className="flow-screen">
    <div className="message message--bot">
      <span>{t(locale, "navIncome")}</span>
      <strong>{t(locale, "income")}</strong>
      <p>{t(locale, "incomeHint")}</p>
    </div>

    <div className="panel">
      <label className="field">
        <span>{t(locale, "income")}</span>
        <input
          inputMode="numeric"
          onChange={(event) =>
            onUpdateFinance({ income: Number(event.target.value) })
          }
          placeholder="120000"
          type="number"
          value={finance.income || ""}
        />
      </label>
      <div className="summary-grid">
        <div>
          <span>{t(locale, "tax")}</span>
          <strong>{formatMoney(taxAmount)}</strong>
        </div>
        <div>
          <span>{t(locale, "netIncome")}</span>
          <strong>{formatMoney(netIncome)}</strong>
        </div>
      </div>
      <button className="primary-action" onClick={onNext} type="button">
        {t(locale, "nextTaxes")}
      </button>
    </div>
  </section>
);
