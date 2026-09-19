"use client";

import { useMemo, useState } from "react";
import { Calculator, Check, Gauge, RotateCcw, WalletCards } from "lucide-react";

import { calculateRoi } from "@/lib/analytics";

const euro = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

type Scenario = {
  name: string;
  purchasePrice: number;
  monthlyRent: number;
  annualCosts: number;
  vacancy: number;
  acquisitionCosts: number;
};

const scenarios: Scenario[] = [
  { name: "Conservative", purchasePrice: 420000, monthlyRent: 2400, annualCosts: 5200, vacancy: 9, acquisitionCosts: 12 },
  { name: "Balanced", purchasePrice: 350000, monthlyRent: 2100, annualCosts: 3600, vacancy: 5, acquisitionCosts: 10 },
  { name: "Optimistic", purchasePrice: 325000, monthlyRent: 2450, annualCosts: 2800, vacancy: 2, acquisitionCosts: 9 },
];

function NumericInput({ label, value, onChange, suffix }: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix: string;
}) {
  return (
    <label className="space-y-2 text-sm text-zinc-400">
      <span>{label}</span>
      <span className="numeric-field">
        <input
          aria-label={`${label} ${suffix}`}
          className="min-w-0 flex-1 bg-transparent py-3 text-sm font-medium text-zinc-100 outline-none"
          type="number"
          min="0"
          value={value}
          onChange={(event) => onChange(Math.max(0, Number(event.target.value)))}
        />
        <span className="text-xs text-zinc-500">{suffix}</span>
      </span>
    </label>
  );
}

export function RoiCalculator() {
  const [purchasePrice, setPurchasePrice] = useState(350000);
  const [monthlyRent, setMonthlyRent] = useState(2100);
  const [annualCosts, setAnnualCosts] = useState(3600);
  const [vacancy, setVacancy] = useState(5);
  const [acquisitionCosts, setAcquisitionCosts] = useState(10);
  const [activeScenario, setActiveScenario] = useState("Balanced");

  const roi = useMemo(() => calculateRoi({
    purchasePriceEur: purchasePrice,
    monthlyRentEur: monthlyRent,
    annualCostsEur: annualCosts,
    vacancyRatePct: vacancy,
    acquisitionCostsPct: acquisitionCosts,
  }), [purchasePrice, monthlyRent, annualCosts, vacancy, acquisitionCosts]);

  const applyScenario = (scenario: Scenario) => {
    setPurchasePrice(scenario.purchasePrice);
    setMonthlyRent(scenario.monthlyRent);
    setAnnualCosts(scenario.annualCosts);
    setVacancy(scenario.vacancy);
    setAcquisitionCosts(scenario.acquisitionCosts);
    setActiveScenario(scenario.name);
  };

  const update = (setter: (value: number) => void) => (value: number) => {
    setter(value);
    setActiveScenario("Custom");
  };

  return (
    <article className="roi-panel">
      <aside className="roi-sidebar">
        <div className="flex items-center justify-between gap-4">
          <span className="method-icon"><Calculator className="size-4" /></span>
          <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-zinc-500">Interactive</span>
        </div>
        <p className="eyebrow mt-8">Investment simulator</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Stress-test the deal.</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-400">Start with a preset, then tune the numbers. Every result updates instantly.</p>

        <div className="mt-6 space-y-2">
          {scenarios.map((scenario) => (
            <button key={scenario.name} type="button" onClick={() => applyScenario(scenario)} className={`scenario-button ${activeScenario === scenario.name ? "scenario-active" : ""}`}>
              <span>{scenario.name}</span>
              {activeScenario === scenario.name ? <Check className="size-4" /> : <span className="text-xs text-zinc-600">{scenario.vacancy}% vacancy</span>}
            </button>
          ))}
        </div>
        {activeScenario === "Custom" && (
          <button type="button" className="mt-4 inline-flex items-center gap-2 text-sm text-[#70ebdd] transition hover:text-white" onClick={() => applyScenario(scenarios[1])}><RotateCcw className="size-3.5" /> Reset to balanced</button>
        )}
      </aside>

      <div className="p-5 sm:p-7 lg:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="eyebrow">Scenario inputs</p><h3 className="mt-1 text-lg font-semibold text-white">{activeScenario} assumptions</h3></div>
          <span className="flex items-center gap-2 text-xs text-zinc-500"><Gauge className="size-4 text-[#9d8cff]" /> Live calculation</span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <NumericInput label="Purchase price" value={purchasePrice} onChange={update(setPurchasePrice)} suffix="EUR" />
          <NumericInput label="Monthly rent" value={monthlyRent} onChange={update(setMonthlyRent)} suffix="EUR" />
          <NumericInput label="Annual costs" value={annualCosts} onChange={update(setAnnualCosts)} suffix="EUR" />
          <NumericInput label="Vacancy" value={vacancy} onChange={update(setVacancy)} suffix="%" />
          <NumericInput label="Acquisition costs" value={acquisitionCosts} onChange={update(setAcquisitionCosts)} suffix="%" />
        </div>

        <dl className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-live="polite">
          <div className="roi-result"><dt>Gross yield</dt><dd>{roi.grossYieldPct.toFixed(2)}%</dd><span>Before operating friction</span></div>
          <div className="roi-result roi-result-primary"><dt>Net yield</dt><dd>{roi.netYieldPct.toFixed(2)}%</dd><span>After costs and vacancy</span></div>
          <div className="roi-result"><dt>Annual net income</dt><dd>{euro.format(roi.annualNetIncome)}</dd><span className="flex items-center gap-1.5"><WalletCards className="size-3.5" /> Estimated cash flow</span></div>
          <div className="roi-result"><dt>Estimated payback</dt><dd>{roi.paybackYears ? `${roi.paybackYears.toFixed(1)} yrs` : "—"}</dd><span>{roi.paybackYears ? "At current assumptions" : "Income is not positive"}</span></div>
        </dl>
      </div>
    </article>
  );
}
