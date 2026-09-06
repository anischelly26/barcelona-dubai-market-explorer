export type City = "Barcelona" | "Dubai";
export type PropertyType = "Apartment" | "Villa";

export type PropertyListing = {
  id: string;
  city: City;
  neighborhood: string;
  type: PropertyType;
  priceEur: number;
  localPrice: string;
  areaSqm: number;
  yieldPct: number;
  x: number;
  y: number;
};

export const properties: PropertyListing[] = [
  { id: "bcn-eixample", city: "Barcelona", neighborhood: "Eixample", type: "Apartment", priceEur: 495000, localPrice: "€495k", areaSqm: 82, yieldPct: 4.1, x: 58, y: 48 },
  { id: "bcn-gracia", city: "Barcelona", neighborhood: "Gràcia", type: "Apartment", priceEur: 420000, localPrice: "€420k", areaSqm: 70, yieldPct: 4.3, x: 48, y: 27 },
  { id: "bcn-poblenou", city: "Barcelona", neighborhood: "Poblenou", type: "Apartment", priceEur: 540000, localPrice: "€540k", areaSqm: 88, yieldPct: 4.0, x: 79, y: 50 },
  { id: "bcn-sarria", city: "Barcelona", neighborhood: "Sarrià", type: "Villa", priceEur: 780000, localPrice: "€780k", areaSqm: 112, yieldPct: 3.5, x: 29, y: 32 },
  { id: "bcn-sant-antoni", city: "Barcelona", neighborhood: "Sant Antoni", type: "Apartment", priceEur: 385000, localPrice: "€385k", areaSqm: 66, yieldPct: 4.6, x: 52, y: 61 },
  { id: "bcn-sants", city: "Barcelona", neighborhood: "Sants", type: "Apartment", priceEur: 330000, localPrice: "€330k", areaSqm: 72, yieldPct: 4.8, x: 34, y: 66 },
  { id: "dub-marina", city: "Dubai", neighborhood: "Dubai Marina", type: "Apartment", priceEur: 355000, localPrice: "AED 1.42m", areaSqm: 92, yieldPct: 6.2, x: 28, y: 72 },
  { id: "dub-downtown", city: "Dubai", neighborhood: "Downtown", type: "Apartment", priceEur: 470000, localPrice: "AED 1.88m", areaSqm: 85, yieldPct: 5.7, x: 64, y: 48 },
  { id: "dub-jvc", city: "Dubai", neighborhood: "JVC", type: "Apartment", priceEur: 205000, localPrice: "AED 820k", areaSqm: 74, yieldPct: 7.1, x: 42, y: 50 },
  { id: "dub-business-bay", city: "Dubai", neighborhood: "Business Bay", type: "Apartment", priceEur: 315000, localPrice: "AED 1.26m", areaSqm: 78, yieldPct: 6.5, x: 69, y: 57 },
  { id: "dub-palm", city: "Dubai", neighborhood: "Palm Jumeirah", type: "Villa", priceEur: 1850000, localPrice: "AED 7.4m", areaSqm: 320, yieldPct: 4.3, x: 19, y: 43 },
  { id: "dub-hills", city: "Dubai", neighborhood: "Dubai Hills", type: "Villa", priceEur: 980000, localPrice: "AED 3.92m", areaSqm: 260, yieldPct: 5.1, x: 48, y: 64 },
];

export const marketTrend = [
  { month: "Sep", Barcelona: 4820, Dubai: 3650 },
  { month: "Oct", Barcelona: 4850, Dubai: 3710 },
  { month: "Nov", Barcelona: 4875, Dubai: 3790 },
  { month: "Dec", Barcelona: 4920, Dubai: 3840 },
  { month: "Jan", Barcelona: 4960, Dubai: 3920 },
  { month: "Feb", Barcelona: 4985, Dubai: 3980 },
  { month: "Mar", Barcelona: 5010, Dubai: 4050 },
  { month: "Apr", Barcelona: 5055, Dubai: 4110 },
  { month: "May", Barcelona: 5080, Dubai: 4180 },
  { month: "Jun", Barcelona: 5115, Dubai: 4260 },
  { month: "Jul", Barcelona: 5140, Dubai: 4330 },
  { month: "Aug", Barcelona: 5180, Dubai: 4410 },
];
