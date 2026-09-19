import { describe, expect, it } from "vitest";

import { calculateRoi, median } from "@/lib/analytics";

describe("analytics", () => {
  it("calculates median for odd and even arrays", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(3);
  });

  it("calculates net yield after vacancy and costs", () => {
    const result = calculateRoi({
      purchasePriceEur: 300000,
      monthlyRentEur: 2000,
      annualCostsEur: 3000,
      vacancyRatePct: 5,
      acquisitionCostsPct: 10,
    });
    expect(result.grossYieldPct).toBe(8);
    expect(result.annualNetIncome).toBe(19800);
    expect(result.netYieldPct).toBeCloseTo(6);
  });
});

