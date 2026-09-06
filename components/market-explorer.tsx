"use client";

import { useMemo, useState } from "react";
import { AreaChart, ArrowUpRight, Building2, Code2, Database, Filter, MapPin, RefreshCw, ShieldCheck } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { marketTrend, properties, type City, type PropertyListing } from "@/lib/market-data";

const euro = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

function pricePerSqm(property: PropertyListing) {
  return Math.round(property.priceEur / property.areaSqm);
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function CityMap({ city, listings, selectedId, onSelect }: {
  city: City;
  listings: PropertyListing[];
  selectedId: string;
  onSelect: (property: PropertyListing) => void;
}) {
  const accent = city === "Barcelona" ? "#47e7d4" : "#ffb454";
  return (
    <article className="map-card">
      <div className="flex items-start justify-between gap-4 px-5 pt-5">
        <div>
          <p className="eyebrow">{city === "Barcelona" ? "Spain · EUR" : "UAE · AED normalized to EUR"}</p>
          <h3 className="mt-1 text-lg font-semibold text-white">{city}</h3>
        </div>
        <Badge variant="outline" className="border-white/10 bg-white/5 text-zinc-300">{listings.length} signals</Badge>
      </div>

      <div className="relative mx-3 mt-4 h-64 overflow-hidden rounded-xl border border-white/8 bg-[#0b1318]">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-label={`${city} neighborhood signal map`}>
          <defs>
            <pattern id={`grid-${city}`} width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#20323b" strokeWidth="0.35" />
            </pattern>
            <radialGradient id={`glow-${city}`}>
              <stop offset="0%" stopColor={accent} stopOpacity="0.2" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill={`url(#grid-${city})`} />
          <circle cx={city === "Barcelona" ? 60 : 48} cy="50" r="42" fill={`url(#glow-${city})`} />
          <path d={city === "Barcelona" ? "M8 77 C24 69 34 79 49 69 S75 50 94 54" : "M12 84 C31 74 43 65 57 58 S76 42 90 20"} fill="none" stroke={accent} strokeOpacity="0.25" strokeWidth="1.2" />
          {listings.map((property) => {
            const selected = property.id === selectedId;
            return (
              <g key={property.id} role="button" tabIndex={0} aria-label={`${property.neighborhood}, ${euro.format(property.priceEur)}`} onClick={() => onSelect(property)} onKeyDown={(event) => event.key === "Enter" && onSelect(property)} className="cursor-pointer outline-none">
                {selected && <circle cx={property.x} cy={property.y} r="5.5" fill="none" stroke={accent} strokeWidth="0.8" opacity="0.65" />}
                <circle cx={property.x} cy={property.y} r={selected ? 2.7 : 2.1} fill={accent} stroke="#071014" strokeWidth="0.8" />
                <text x={property.x + 3.8} y={property.y + 1.2} fill={selected ? "#ffffff" : "#a8b7bd"} fontSize="3.1" fontWeight={selected ? 700 : 500}>{property.neighborhood}</text>
              </g>
            );
          })}
        </svg>
        {!listings.length && <div className="absolute inset-0 grid place-items-center text-sm text-zinc-500">No listings match this filter</div>}
      </div>
      <div className="flex items-center justify-between px-5 py-4 text-xs text-zinc-500">
        <span>Click a signal to inspect</span>
        <span className="font-mono" style={{ color: accent }}>● LIVE MODEL</span>
      </div>
    </article>
  );
}

function MetricCard({ label, value, detail, tone = "neutral" }: {
  label: string;
  value: string;
  detail: string;
  tone?: "aqua" | "amber" | "neutral";
}) {
  return (
    <article className="metric-card">
      <div className={`metric-mark ${tone}`} />
      <p className="eyebrow">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-xs text-zinc-500">{detail}</p>
    </article>
  );
}

export function MarketExplorer() {
  const [type, setType] = useState("All");
  const [maxBudget, setMaxBudget] = useState([1000]);
  const [period, setPeriod] = useState(12);
  const [selected, setSelected] = useState<PropertyListing>(properties[0]);

  const filtered = useMemo(
    () => properties.filter((property) => (type === "All" || property.type === type) && property.priceEur <= maxBudget[0] * 1000),
    [type, maxBudget],
  );
  const visibleTrend = marketTrend.slice(-period);
  const bcn = filtered.filter((property) => property.city === "Barcelona");
  const dubai = filtered.filter((property) => property.city === "Dubai");
  const avgYield = filtered.length ? filtered.reduce((sum, item) => sum + item.yieldPct, 0) / filtered.length : 0;
  const bcnMedian = median(bcn.map(pricePerSqm));
  const dubaiMedian = median(dubai.map(pricePerSqm));

  return (
    <main className="min-h-screen bg-[#071014] text-zinc-100">
      <header className="border-b border-white/8 bg-[#071014]/95">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-5 px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-lg border border-[#47e7d4]/30 bg-[#47e7d4]/10 text-[#47e7d4]"><AreaChart className="size-5" /></div>
            <div>
              <h1 className="text-sm font-semibold tracking-wide text-white sm:text-base">Market Explorer</h1>
              <p className="text-xs text-zinc-500">Barcelona ↔ Dubai</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <Badge variant="outline" className="border-amber-300/20 bg-amber-300/8 text-amber-200">Synthetic demo data</Badge>
            <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10 hover:text-white" asChild>
              <a href="#methodology"><Code2 className="size-4" /> Architecture</a>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-5 py-7 lg:px-8">
        <section className="mb-7 grid gap-5 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
          <div>
            <p className="eyebrow text-[#47e7d4]">Cross-market intelligence workspace</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">Compare two property markets on one normalized data layer.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">An engineering MVP for property ingestion, currency and unit normalization, geospatial signals, and comparative analytics.</p>
          </div>

          <div className="filter-panel">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-400"><Filter className="size-3.5" /> ACTIVE FILTERS</div>
            <div className="mt-4 grid gap-5 sm:grid-cols-[160px_1fr_auto] sm:items-end">
              <label className="space-y-2 text-xs text-zinc-500">
                Property type
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="w-full border-white/10 bg-[#0b151a] text-zinc-200"><SelectValue /></SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#0d181d] text-zinc-200">
                    <SelectItem value="All">All properties</SelectItem>
                    <SelectItem value="Apartment">Apartments</SelectItem>
                    <SelectItem value="Villa">Villas</SelectItem>
                  </SelectContent>
                </Select>
              </label>
              <label className="space-y-3 text-xs text-zinc-500">
                <span className="flex justify-between"><span>Maximum budget</span><strong className="font-mono font-medium text-zinc-200">€{compact.format(maxBudget[0] * 1000)}</strong></span>
                <Slider min={200} max={2000} step={50} value={maxBudget} onValueChange={setMaxBudget} className="[&_[data-slot=slider-range]]:bg-[#47e7d4] [&_[data-slot=slider-thumb]]:border-[#47e7d4]" />
              </label>
              <Button variant="outline" className="border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white" onClick={() => { setType("All"); setMaxBudget([1000]); }}><RefreshCw className="size-4" /> Reset</Button>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Barcelona median" value={bcnMedian ? `${euro.format(bcnMedian)} / m²` : "—"} detail={`${bcn.length} filtered neighborhood signals`} tone="aqua" />
          <MetricCard label="Dubai median" value={dubaiMedian ? `${euro.format(dubaiMedian)} / m²` : "—"} detail="AED converted to EUR for comparison" tone="amber" />
          <MetricCard label="Average gross yield" value={avgYield ? `${avgYield.toFixed(1)}%` : "—"} detail="Illustrative annual rental yield" />
          <MetricCard label="Listings analyzed" value={String(filtered.length)} detail={`${properties.length} records in current demo dataset`} />
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <CityMap city="Barcelona" listings={bcn} selectedId={selected.id} onSelect={setSelected} />
          <CityMap city="Dubai" listings={dubai} selectedId={selected.id} onSelect={setSelected} />
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[1.55fr_0.75fr]">
          <article className="panel p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><p className="eyebrow">Normalized price movement</p><h3 className="mt-1 text-lg font-semibold text-white">Market price index · EUR / m²</h3></div>
              <div className="flex rounded-lg border border-white/8 bg-[#081216] p-1">
                {[3, 6, 12].map((months) => <button key={months} type="button" onClick={() => setPeriod(months)} className={`rounded-md px-3 py-1.5 text-xs transition ${period === months ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>{months}M</button>)}
              </div>
            </div>
            <div className="mt-5 h-[310px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={visibleTrend} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="#1b2b32" strokeDasharray="3 6" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "#718087", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#718087", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                  <Tooltip contentStyle={{ background: "#0b151a", border: "1px solid #21323a", borderRadius: 8, fontSize: 12 }} formatter={(value) => [`€${Number(value).toLocaleString()}/m²`]} />
                  <Legend wrapperStyle={{ fontSize: 12, color: "#a1a1aa" }} />
                  <Line type="monotone" dataKey="Barcelona" stroke="#47e7d4" strokeWidth={2.4} dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Dubai" stroke="#ffb454" strokeWidth={2.4} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="panel overflow-hidden">
            <div className="border-b border-white/8 p-5">
              <p className="eyebrow">Selected market signal</p>
              <div className="mt-3 flex items-start justify-between gap-4">
                <div><h3 className="text-xl font-semibold text-white">{selected.neighborhood}</h3><p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400"><MapPin className="size-3.5" /> {selected.city}</p></div>
                <Badge className={selected.city === "Barcelona" ? "bg-[#47e7d4]/12 text-[#72f4e4]" : "bg-[#ffb454]/12 text-[#ffc77d]"}>{selected.type}</Badge>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-px bg-white/8">
              {[["Asking price", selected.localPrice], ["Normalized", euro.format(selected.priceEur)], ["Floor area", `${selected.areaSqm} m²`], ["Price / m²", euro.format(pricePerSqm(selected))], ["Gross yield", `${selected.yieldPct.toFixed(1)}%`], ["Data status", "Illustrative"]].map(([label, value]) => (
                <div key={label} className="bg-[#0b151a] p-4"><dt className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">{label}</dt><dd className="mt-1.5 text-sm font-medium text-zinc-200">{value}</dd></div>
              ))}
            </dl>
            <div className="p-5 text-xs leading-5 text-zinc-500">Values demonstrate the product logic and are not investment advice or live market estimates.</div>
          </article>
        </section>

        <section id="methodology" className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            { icon: Database, title: "Normalized data contract", text: "One schema for listings, price snapshots, geolocation, units, and currency." },
            { icon: Building2, title: "API-ready architecture", text: "The interface is designed to consume a FastAPI service backed by PostgreSQL/PostGIS." },
            { icon: ShieldCheck, title: "Responsible sourcing", text: "This MVP uses synthetic data. Future ingestion should use licensed APIs or permitted open data." },
          ].map(({ icon: Icon, title, text }) => <article key={title} className="method-card"><Icon className="size-4 text-[#47e7d4]" /><h3 className="mt-4 text-sm font-semibold text-zinc-100">{title}</h3><p className="mt-2 text-xs leading-5 text-zinc-500">{text}</p></article>)}
        </section>

        <footer className="mt-8 flex flex-col gap-3 border-t border-white/8 py-6 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
          <span>Built by Anis Chelli · Software Engineering portfolio project</span>
          <a href="#methodology" className="inline-flex items-center gap-1.5 text-zinc-400 transition hover:text-white">Technical roadmap <ArrowUpRight className="size-3.5" /></a>
        </footer>
      </div>
    </main>
  );
}
