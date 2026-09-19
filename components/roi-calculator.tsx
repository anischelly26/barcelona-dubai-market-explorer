"use client";

import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";

import { calculateRoi } from "@/lib/analytics";

const euro = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

function NumericInput({ label, value, onChange, suffix }: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix: string;
}) {
  return (
    <label className="space-y-2 text-xs text-zinc-500">
      <span>{label}</span>
      <span className="flex items-center rounded-lg border border-white/10 bg-[#081216] px-3 focus-within:border-[#47e7d4]/60">
        <input
          className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-zinc-100 outline-none"
          type="number"
          min="0"
          value={value}
          onChange={(event) => onChange(Math.max(0, Number(event.target.value)))}
        />
        <span className="text-zinc-600">{suffix}</span>
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
  const roi = useMemo(() => calculateRoi({
    purchasePriceEur: purchasePrice,
    monthlyRentEur: monthlyRent,
    annualCostsEur: annualCosts,
    vacancyRatePct: vacancy,
    acquisitionCostsPct: acquisitionCosts,
  }), [purchasePrice, monthlyRent, annualCosts, vacancy, acquisitionCosts]);

  return (
    <article className="panel p-5 sm:p-6">
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="eyebrow">Investment scenario</p>
          <h3 className="mt-1 text-lg font-semibold text-white">ROI calculator</h3>
          <p className="mt-2 max-w-xl text-xs leading-5 text-zinc-500">Compare gross yield with a more realistic net yield after vacancy, operating costs and acquisition costs.</p>
        </div>
        <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#47e7d4]/10 text-[#47e7d4]"><Calculator className="size-5" /></div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <NumericInput label="Purchase price" value={purchasePrice} onChange={setPurchasePrice} suffix="EUR" />
        <NumericInput label="Monthly rent" value={monthlyRent} onChange={setMonthlyRent} suffix="EUR" />
        <NumericInput label="Annual costs" value={annualCosts} onChange={setAnnualCosts} suffix="EUR" />
        <NumericInput label="Vacancy" value={vacancy} onChange={setVacancy} suffix="%" />
        <NumericInput label="Acquisition costs" value={acquisitionCosts} onChange={setAcquisitionCosts} suffix="%" />
      </div>
      <dl className="mt-5 grid gap-px overflow-hidden rounded-lg border border-white/8 bg-white/8 sm:grid-cols-4">
        {[
          ["Gross yield", `${roi.grossYieldPct.toFixed(2)}%`],
          ["Net yield", `${roi.netYieldPct.toFixed(2)}%`],
          ["Annual net income", euro.format(roi.annualNetIncome)],
          ["Estimated payback", roi.paybackYears ? `${roi.paybackYears.toFixed(1)} years` : "Not positive"],
        ].map(([label, value]) => (
          <div key={label} className="bg-[#0b151a] p-4">
            <dt className="text-[10px] uppercase tracking-[0.13em] text-zinc-600">{label}</dt>
            <dd className="mt-2 text-base font-semibold text-zinc-100">{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

