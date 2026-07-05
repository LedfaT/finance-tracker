import { formatMoney, taxPresets } from "../../lib/finance";
import { t } from "../../lib/i18n";
import type { FinanceState, Locale, TaxPreset } from "../../types/finance";

interface TaxesScreenProps {
  finance: FinanceState;
  locale: Locale;
  onApplyPreset: (preset: TaxPreset) => void;
  onNext: () => void;
  onUpdateFinance: (patch: Partial<FinanceState>) => void;
  taxAmount: number;
}

export const TaxesScreen = ({
  finance,
  locale,
  onApplyPreset,
  onNext,
  onUpdateFinance,
  taxAmount,
}: TaxesScreenProps) => (
  <section className="flow-screen">
    <div className="message message--bot">
      <span>{t(locale, "navTaxes")}</span>
      <strong>{t(locale, "taxMode")}</strong>
      <p>{t(locale, "taxHint")}</p>
    </div>

    <div className="panel">
      <div className="segmented">
        {taxPresets.map((preset) => (
          <button
            data-active={finance.taxMode === preset.id}
            key={preset.id}
            onClick={() => onApplyPreset(preset)}
            type="button"
          >
            {t(locale, preset.id)}
          </button>
        ))}
      </div>
      <div className="two-fields">
        <label className="field">
          <span>%</span>
          <input
            inputMode="decimal"
            onChange={(event) =>
              onUpdateFinance({
                taxMode: "manual",
                taxPercent: Number(event.target.value),
              })
            }
            type="number"
            value={finance.taxPercent}
          />
        </label>
        <label className="field">
          <span>{t(locale, "fixedTax")}</span>
          <input
            inputMode="numeric"
            onChange={(event) =>
              onUpdateFinance({
                fixedTax: Number(event.target.value),
                taxMode: "manual",
              })
            }
            type="number"
            value={finance.fixedTax}
          />
        </label>
      </div>
      <div className="highlight">
        <span>{t(locale, "taxDue")}</span>
        <strong>{formatMoney(taxAmount)}</strong>
      </div>
      <button className="primary-action" onClick={onNext} type="button">
        {t(locale, "nextExpenses")}
      </button>
    </div>
  </section>
);
