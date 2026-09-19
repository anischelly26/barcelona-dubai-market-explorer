"use client";

import { ArrowRight, BadgeEuro, Maximize2, Sparkles, TrendingUp } from "lucide-react";
import type { CSSProperties } from "react";

import type { RankedOpportunity } from "@/lib/analytics";
import type { PropertyListing } from "@/lib/market-data";

const euro = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export type RadarSort = "score" | "yield" | "price" | "space";

const strategies: Array<{ value: RadarSort; label: string; icon: typeof Sparkles }> = [
  { value: "score", label: "Smart score", icon: Sparkles },
  { value: "yield", label: "Highest yield", icon: TrendingUp },
  { value: "price", label: "Lowest price", icon: BadgeEuro },
  { value: "space", label: "Most space", icon: Maximize2 },
];

function sortListings(listings: RankedOpportunity[], sort: RadarSort) {
  return [...listings].sort((a, b) => {
    if (sort === "yield") return b.gross_yield_pct - a.gross_yield_pct;
    if (sort === "price") return a.price_eur - b.price_eur;
    if (sort === "space") return b.area_sqm - a.area_sqm;
    return b.opportunityScore - a.opportunityScore;
  });
}

export function PropertyRadar({ listings, selectedId, sort, onSortChange, onSelect }: {
  listings: RankedOpportunity[];
  selectedId: string;
  sort: RadarSort;
  onSortChange: (sort: RadarSort) => void;
  onSelect: (property: PropertyListing) => void;
}) {
  const ranked = sortListings(listings, sort).slice(0, 6);

  return (
    <section id="radar" className="mt-10 scroll-mt-24">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Property radar</p>
          <h2>Turn listings into a shortlist</h2>
        </div>
        <p>The score ranks the visible set by yield, price efficiency and usable space. It is comparative, not investment advice.</p>
      </div>

      <div className="radar-shell mt-4">
        <div className="strategy-bar" aria-label="Property ranking strategy">
          <span className="hidden text-sm font-medium text-zinc-300 lg:block">Rank by</span>
          <div className="strategy-scroll scrollbar-none">
            {strategies.map(({ value, label, icon: Icon }) => (
              <button key={value} type="button" onClick={() => onSortChange(value)} className={sort === value ? "strategy-active" : ""} aria-pressed={sort === value}>
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>
          <span className="ml-auto hidden font-mono text-xs text-zinc-500 sm:block">{listings.length} matches</span>
        </div>

        {ranked.length ? (
          <div className="radar-grid">
            {ranked.map((property, index) => (
              <button
                key={property.id}
                type="button"
                className={`property-radar-card ${property.id === selectedId ? "property-radar-selected" : ""}`}
                onClick={() => onSelect(property)}
                aria-label={`Inspect ${property.property_type} in ${property.neighborhood}, ${property.city}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="rank-number">{String(index + 1).padStart(2, "0")}</span>
                    <span className="min-w-0 text-left">
                      <strong className="block truncate text-base font-semibold text-white">{property.neighborhood}</strong>
                      <span className="mt-1 block text-xs text-zinc-500">{property.city} · {property.property_type}</span>
                    </span>
                  </div>
                  <span className="score-orbit" style={{ "--score": `${property.opportunityScore * 3.6}deg` } as CSSProperties}>
                    <strong>{property.opportunityScore}</strong><small>score</small>
                  </span>
                </div>

                <dl className="mt-5 grid grid-cols-3 gap-2 text-left">
                  <div><dt>Price</dt><dd>{euro.format(property.price_eur)}</dd></div>
                  <div><dt>Yield</dt><dd>{property.gross_yield_pct.toFixed(1)}%</dd></div>
                  <div><dt>Space</dt><dd>{property.area_sqm} m²</dd></div>
                </dl>

                <span className="mt-5 flex items-center justify-between border-t border-white/8 pt-4 text-xs text-zinc-500">
                  {euro.format(property.price_per_sqm_eur)} / m²
                  <span className="inline-flex items-center gap-1.5 font-medium text-zinc-300">Inspect <ArrowRight className="size-3.5" /></span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="radar-empty"><Sparkles className="size-5" /><strong>No matches yet</strong><span>Try widening your budget or clearing the search.</span></div>
        )}
      </div>
    </section>
  );
}
