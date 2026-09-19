import { demoProperties, demoTrend, type PropertyListing, type TrendPoint } from "@/lib/market-data";

export type MarketPayload = {
  properties: PropertyListing[];
  trends: TrendPoint[];
  dataMode: "database" | "demo" | "fallback";
  refreshedAt: Date;
};

export async function loadMarketData(signal?: AbortSignal): Promise<MarketPayload> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!baseUrl) {
    return { properties: demoProperties, trends: demoTrend, dataMode: "demo", refreshedAt: new Date() };
  }

  try {
    const [propertyResponse, trendResponse] = await Promise.all([
      fetch(`${baseUrl}/v1/properties?limit=500`, { signal }),
      fetch(`${baseUrl}/v1/analytics/trends?months=12`, { signal }),
    ]);
    if (!propertyResponse.ok || !trendResponse.ok) throw new Error("Market API unavailable");
    const propertyPayload = await propertyResponse.json() as {
      items: PropertyListing[];
      data_mode: "database" | "demo";
    };
    const trends = await trendResponse.json() as TrendPoint[];
    return {
      properties: propertyPayload.items,
      trends,
      dataMode: propertyPayload.data_mode,
      refreshedAt: new Date(),
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    return { properties: demoProperties, trends: demoTrend, dataMode: "fallback", refreshedAt: new Date() };
  }
}

