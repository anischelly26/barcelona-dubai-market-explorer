export type City = "Barcelona" | "Dubai";
export type PropertyType = "Apartment" | "Villa" | "Townhouse" | "Studio";

export type PropertyListing = {
  id: string;
  city: City;
  neighborhood: string;
  property_type: PropertyType;
  title: string;
  currency: "EUR" | "AED";
  price_local: number;
  price_eur: number;
  area_sqm: number;
  price_per_sqm_eur: number;
  annual_rent_eur: number;
  gross_yield_pct: number;
  bedrooms: number | null;
  bathrooms: number | null;
  latitude: number;
  longitude: number;
  source_name: string;
  source_url: string | null;
  observed_at: string;
};

export type TrendPoint = {
  month: string;
  Barcelona: number | null;
  Dubai: number | null;
};

const observed = "2026-09-01T00:00:00Z";

function listing(
  id: string,
  city: City,
  neighborhood: string,
  property_type: PropertyType,
  price_local: number,
  currency: "EUR" | "AED",
  price_eur: number,
  area_sqm: number,
  annual_rent_eur: number,
  latitude: number,
  longitude: number,
  bedrooms: number,
): PropertyListing {
  return {
    id, city, neighborhood, property_type,
    title: `${property_type} signal in ${neighborhood}`,
    currency, price_local, price_eur, area_sqm, annual_rent_eur,
    price_per_sqm_eur: Math.round((price_eur / area_sqm) * 100) / 100,
    gross_yield_pct: Math.round((annual_rent_eur / price_eur) * 10000) / 100,
    bedrooms,
    bathrooms: property_type === "Apartment" ? 1 : 2.5,
    latitude, longitude,
    source_name: "Curated demo dataset",
    source_url: null,
    observed_at: observed,
  };
}

export const demoProperties: PropertyListing[] = [
  listing("bcn-eixample", "Barcelona", "Eixample", "Apartment", 495000, "EUR", 495000, 82, 20400, 41.3902, 2.1639, 3),
  listing("bcn-gracia", "Barcelona", "Gracia", "Apartment", 420000, "EUR", 420000, 70, 18060, 41.4036, 2.1568, 2),
  listing("bcn-poblenou", "Barcelona", "Poblenou", "Apartment", 540000, "EUR", 540000, 88, 21600, 41.4035, 2.2044, 3),
  listing("bcn-sarria", "Barcelona", "Sarria", "Villa", 780000, "EUR", 780000, 112, 27300, 41.3997, 2.1164, 4),
  listing("bcn-sant-antoni", "Barcelona", "Sant Antoni", "Apartment", 385000, "EUR", 385000, 66, 17710, 41.3785, 2.1626, 2),
  listing("bcn-sants", "Barcelona", "Sants", "Apartment", 330000, "EUR", 330000, 72, 15840, 41.3750, 2.1339, 2),
  listing("dub-marina", "Dubai", "Dubai Marina", "Apartment", 1420000, "AED", 355000, 92, 22010, 25.0805, 55.1403, 2),
  listing("dub-downtown", "Dubai", "Downtown", "Apartment", 1880000, "AED", 470000, 85, 26790, 25.1972, 55.2744, 2),
  listing("dub-jvc", "Dubai", "JVC", "Apartment", 820000, "AED", 205000, 74, 14555, 25.0563, 55.2094, 1),
  listing("dub-business-bay", "Dubai", "Business Bay", "Apartment", 1260000, "AED", 315000, 78, 20475, 25.1850, 55.2644, 2),
  listing("dub-palm", "Dubai", "Palm Jumeirah", "Villa", 7400000, "AED", 1850000, 320, 79550, 25.1124, 55.1390, 5),
  listing("dub-hills", "Dubai", "Dubai Hills", "Villa", 3920000, "AED", 980000, 260, 49980, 25.1130, 55.2477, 4),
];

export const demoTrend: TrendPoint[] = [
  ["2025-10-01", 4850, 3710], ["2025-11-01", 4875, 3790],
  ["2025-12-01", 4920, 3840], ["2026-01-01", 4960, 3920],
  ["2026-02-01", 4985, 3980], ["2026-03-01", 5010, 4050],
  ["2026-04-01", 5055, 4110], ["2026-05-01", 5080, 4180],
  ["2026-06-01", 5115, 4260], ["2026-07-01", 5140, 4330],
  ["2026-08-01", 5180, 4410], ["2026-09-01", 5210, 4470],
].map(([month, Barcelona, Dubai]) => ({
  month: String(month), Barcelona: Number(Barcelona), Dubai: Number(Dubai),
}));
