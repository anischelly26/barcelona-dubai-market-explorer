import type { PropertyListing } from "@/lib/market-data";

export type RoiInput = {
  purchasePriceEur: number;
  monthlyRentEur: number;
  annualCostsEur: number;
  vacancyRatePct: number;
  acquisitionCostsPct: number;
};

export function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

export function calculateRoi(input: RoiInput) {
  const annualGrossIncome = input.monthlyRentEur * 12;
  const effectiveIncome = annualGrossIncome * (1 - input.vacancyRatePct / 100);
  const annualNetIncome = effectiveIncome - input.annualCostsEur;
  const totalCashRequired = input.purchasePriceEur * (1 + input.acquisitionCostsPct / 100);
  return {
    annualGrossIncome,
    annualNetIncome,
    totalCashRequired,
    grossYieldPct: input.purchasePriceEur > 0 ? annualGrossIncome / input.purchasePriceEur * 100 : 0,
    netYieldPct: totalCashRequired > 0 ? annualNetIncome / totalCashRequired * 100 : 0,
    paybackYears: annualNetIncome > 0 ? totalCashRequired / annualNetIncome : null,
  };
}

export function marketMetrics(listings: PropertyListing[]) {
  const averageYield = listings.length
    ? listings.reduce((sum, item) => sum + item.gross_yield_pct, 0) / listings.length
    : 0;
  return {
    medianPrice: median(listings.map((item) => item.price_eur)),
    medianPricePerSqm: median(listings.map((item) => item.price_per_sqm_eur)),
    averageYield,
  };
}

