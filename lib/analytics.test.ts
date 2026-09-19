import { describe, expect, it } from "vitest";

import { calculateRoi, median, rankMarketOpportunities } from "@/lib/analytics";
import { demoProperties } from "@/lib/market-data";

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

  it("ranks visible opportunities with bounded relative scores", () => {
    const ranked = rankMarketOpportunities(demoProperties);
    expect(ranked).toHaveLength(demoProperties.length);
    expect(ranked[0].opportunityScore).toBeGreaterThanOrEqual(ranked[1].opportunityScore);
    expect(ranked.every((item) => item.opportunityScore >= 0 && item.opportunityScore <= 100)).toBe(true);
  });

  it("returns a neutral score when only one property is visible", () => {
    expect(rankMarketOpportunities([demoProperties[0]])[0].opportunityScore).toBe(50);
  });
});
