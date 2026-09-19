"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, AreaChart, ArrowUpRight, Building2, Code2, Database, Filter, MapPin, RefreshCw, Server, ShieldCheck } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { InteractiveMarketMap } from "@/components/interactive-market-map";
import { RoiCalculator } from "@/components/roi-calculator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { marketMetrics } from "@/lib/analytics";
import { loadMarketData } from "@/lib/api";
import { demoProperties, demoTrend, type City, type PropertyListing, type TrendPoint } from "@/lib/market-data";

const euro = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const observedDate = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" });
const trendMonth = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short" });
const trendMonthLong = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long", year: "numeric" });

function CityMap({ city, listings, selectedId, onSelect }: {
  city: City;
  listings: PropertyListing[];
  selectedId: string;
  onSelect: (property: PropertyListing) => void;
}) {
  const accent = city === "Barcelona" ? "#47e7d4" : "#ffb454";
  return (
    <article className="map-card overflow-hidden">
      <div className="flex items-start justify-between gap-4 px-5 pt-5">
        <div>
          <p className="eyebrow">{city === "Barcelona" ? "Spain · EUR" : "UAE · AED normalized to EUR"}</p>
          <h3 className="mt-1 text-lg font-semibold text-white">{city}</h3>
        </div>
        <Badge variant="outline" className="border-white/10 bg-white/5 text-zinc-300">{listings.length} signals</Badge>
      </div>
      <div className="relative mx-3 mt-4 h-72 overflow-hidden rounded-xl border border-white/8 bg-[#0b1318]">
        {listings.length ? (
          <InteractiveMarketMap city={city} listings={listings} selectedId={selectedId} onSelect={onSelect} />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-sm text-zinc-500">No listings match this filter</div>
        )}
      </div>
      <div className="flex items-center justify-between px-5 py-4 text-xs text-zinc-500">
        <span>OpenStreetMap · click a marker to inspect</span>
        <span className="font-mono" style={{ color: accent }}>● GEOSPATIAL</span>
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

function formatLocalPrice(item: PropertyListing) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: item.currency, maximumFractionDigits: 0,
  }).format(item.price_local);
}

export function MarketExplorer() {
  const [properties, setProperties] = useState(demoProperties);
  const [trends, setTrends] = useState<TrendPoint[]>(demoTrend);
  const [dataMode, setDataMode] = useState<"database" | "demo" | "fallback">("demo");
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);
  const [type, setType] = useState("All");
  const [maxBudget, setMaxBudget] = useState([1000]);
  const [period, setPeriod] = useState(12);
  const [selected, setSelected] = useState<PropertyListing>(demoProperties[0]);

  useEffect(() => {
    const controller = new AbortController();
    loadMarketData(controller.signal).then((payload) => {
      setProperties(payload.properties);
      setTrends(payload.trends);
      setDataMode(payload.dataMode);
      setRefreshedAt(payload.refreshedAt);
      if (payload.properties.length) setSelected(payload.properties[0]);
    }).catch(() => undefined);
    return () => controller.abort();
  }, []);

  const filtered = useMemo(
    () => properties.filter((property) =>
      (type === "All" || property.property_type === type) && property.price_eur <= maxBudget[0] * 1000,
    ),
    [properties, type, maxBudget],
  );
  const visibleTrend = trends.slice(-period);
  const bcn = filtered.filter((property) => property.city === "Barcelona");
  const dubai = filtered.filter((property) => property.city === "Dubai");
  const bcnMetrics = marketMetrics(bcn);
  const dubaiMetrics = marketMetrics(dubai);
  const allMetrics = marketMetrics(filtered);

  return (
    <main className="min-h-screen bg-[#071014] text-zinc-100">
      <header className="border-b border-white/8 bg-[#071014]/95">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-5 px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-lg border border-[#47e7d4]/30 bg-[#47e7d4]/10 text-[#47e7d4]"><AreaChart className="size-5" /></div>
            <div><h1 className="text-sm font-semibold tracking-wide text-white sm:text-base">Market Explorer</h1><p className="text-xs text-zinc-500">Barcelona ↔ Dubai</p></div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={dataMode === "database" ? "border-emerald-300/20 bg-emerald-300/8 text-emerald-200" : "border-amber-300/20 bg-amber-300/8 text-amber-200"}>
              <Activity className="mr-1 size-3" /> {dataMode === "database" ? "PostgreSQL live" : dataMode === "fallback" ? "API fallback" : "Demo mode"}
            </Badge>
            <Button variant="outline" size="sm" className="hidden border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10 hover:text-white sm:inline-flex" asChild><a href="#architecture"><Code2 className="size-4" /> Architecture</a></Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-5 py-7 lg:px-8">
        <section className="mb-7 grid gap-5 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
          <div>
            <p className="eyebrow text-[#47e7d4]">Full-stack property intelligence</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">Compare two property markets on one normalized data layer.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">A production-oriented pipeline for permitted ingestion, EUR/m² normalization, PostGIS exploration, comparative analytics and investment scenarios.</p>
          </div>
          <div className="filter-panel">
            <div className="flex items-center justify-between gap-3 text-xs font-medium text-zinc-400">
              <span className="flex items-center gap-2"><Filter className="size-3.5" /> ACTIVE FILTERS</span>
              {refreshedAt && <span className="font-normal text-zinc-600">Refreshed {refreshedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
            </div>
            <div className="mt-4 grid gap-5 sm:grid-cols-[160px_1fr_auto] sm:items-end">
              <label className="space-y-2 text-xs text-zinc-500">Property type
                <Select value={type} onValueChange={setType}><SelectTrigger className="w-full border-white/10 bg-[#0b151a] text-zinc-200"><SelectValue /></SelectTrigger><SelectContent className="border-white/10 bg-[#0d181d] text-zinc-200"><SelectItem value="All">All properties</SelectItem><SelectItem value="Apartment">Apartments</SelectItem><SelectItem value="Villa">Villas</SelectItem></SelectContent></Select>
              </label>
              <label className="space-y-3 text-xs text-zinc-500"><span className="flex justify-between"><span>Maximum budget</span><strong className="font-mono font-medium text-zinc-200">€{compact.format(maxBudget[0] * 1000)}</strong></span><Slider min={200} max={2000} step={50} value={maxBudget} onValueChange={setMaxBudget} className="[&_[data-slot=slider-range]]:bg-[#47e7d4] [&_[data-slot=slider-thumb]]:border-[#47e7d4]" /></label>
              <Button variant="outline" className="border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white" onClick={() => { setType("All"); setMaxBudget([1000]); }}><RefreshCw className="size-4" /> Reset</Button>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Barcelona median" value={bcnMetrics.medianPricePerSqm ? `${euro.format(bcnMetrics.medianPricePerSqm)} / m²` : "—"} detail={`${bcn.length} filtered properties`} tone="aqua" />
          <MetricCard label="Dubai median" value={dubaiMetrics.medianPricePerSqm ? `${euro.format(dubaiMetrics.medianPricePerSqm)} / m²` : "—"} detail="AED and sqft normalized" tone="amber" />
          <MetricCard label="Average gross yield" value={allMetrics.averageYield ? `${allMetrics.averageYield.toFixed(1)}%` : "—"} detail="Annual rent / purchase price" />
          <MetricCard label="Listings analyzed" value={String(filtered.length)} detail={`${properties.length} records available`} />
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <CityMap city="Barcelona" listings={bcn} selectedId={selected.id} onSelect={setSelected} />
          <CityMap city="Dubai" listings={dubai} selectedId={selected.id} onSelect={setSelected} />
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[1.55fr_0.75fr]">
          <article className="panel p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><p className="eyebrow">Normalized price movement</p><h3 className="mt-1 text-lg font-semibold text-white">Market price index · EUR / m²</h3></div>
              <div className="flex rounded-lg border border-white/8 bg-[#081216] p-1">{[3, 6, 12].map((months) => <button key={months} type="button" onClick={() => setPeriod(months)} className={`rounded-md px-3 py-1.5 text-xs transition ${period === months ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>{months}M</button>)}</div>
            </div>
            <div className="mt-5 h-[310px] w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={visibleTrend} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}><CartesianGrid stroke="#1b2b32" strokeDasharray="3 6" vertical={false} /><XAxis dataKey="month" tick={{ fill: "#718087", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => trendMonth.format(new Date(String(value)))} /><YAxis tick={{ fill: "#718087", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${Math.round(value / 1000)}k`} /><Tooltip contentStyle={{ background: "#0b151a", border: "1px solid #21323a", borderRadius: 8, fontSize: 12 }} formatter={(value) => [`€${Number(value).toLocaleString()}/m²`]} labelFormatter={(value) => trendMonthLong.format(new Date(String(value)))} /><Legend wrapperStyle={{ fontSize: 12, color: "#a1a1aa" }} /><Line type="monotone" dataKey="Barcelona" stroke="#47e7d4" strokeWidth={2.4} dot={false} connectNulls activeDot={{ r: 4 }} /><Line type="monotone" dataKey="Dubai" stroke="#ffb454" strokeWidth={2.4} dot={false} connectNulls activeDot={{ r: 4 }} /></LineChart></ResponsiveContainer></div>
          </article>

          <article className="panel overflow-hidden">
            <div className="border-b border-white/8 p-5"><p className="eyebrow">Selected property signal</p><div className="mt-3 flex items-start justify-between gap-4"><div><h3 className="text-xl font-semibold text-white">{selected.neighborhood}</h3><p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400"><MapPin className="size-3.5" /> {selected.city}</p></div><Badge className={selected.city === "Barcelona" ? "bg-[#47e7d4]/12 text-[#72f4e4]" : "bg-[#ffb454]/12 text-[#ffc77d]"}>{selected.property_type}</Badge></div></div>
            <dl className="grid grid-cols-2 gap-px bg-white/8">{[["Local price", formatLocalPrice(selected)], ["Normalized", euro.format(selected.price_eur)], ["Floor area", `${selected.area_sqm} m²`], ["Price / m²", euro.format(selected.price_per_sqm_eur)], ["Gross yield", `${selected.gross_yield_pct.toFixed(1)}%`], ["Observed", observedDate.format(new Date(selected.observed_at))]].map(([label, value]) => <div key={label} className="bg-[#0b151a] p-4"><dt className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">{label}</dt><dd className="mt-1.5 text-sm font-medium text-zinc-200">{value}</dd></div>)}</dl>
            <div className="p-5 text-xs leading-5 text-zinc-500">Source: {selected.source_name}. Demonstration values are not investment advice.</div>
          </article>
        </section>

        <section className="mt-4"><RoiCalculator /></section>

        <section id="architecture" className="mt-4 grid gap-3 md:grid-cols-4">
          {[
            { icon: Database, title: "PostgreSQL + PostGIS", text: "Indexed listings, neighborhoods, FX rates and historical price snapshots." },
            { icon: Server, title: "FastAPI service", text: "Typed filtering, geospatial search, market trends and ROI endpoints." },
            { icon: Building2, title: "Automated ingestion", text: "Rate-limited adapters, validation, normalization, deduplication and daily scheduling." },
            { icon: ShieldCheck, title: "Responsible sourcing", text: "Only permitted sources; no CAPTCHA bypassing or protected-content reproduction." },
          ].map(({ icon: Icon, title, text }) => <article key={title} className="method-card"><Icon className="size-4 text-[#47e7d4]" /><h3 className="mt-4 text-sm font-semibold text-zinc-100">{title}</h3><p className="mt-2 text-xs leading-5 text-zinc-500">{text}</p></article>)}
        </section>

        <footer className="mt-8 flex flex-col gap-3 border-t border-white/8 py-6 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between"><span>Built by Anis Chelli · Software Engineering portfolio project</span><a href="https://github.com/anischelly26/barcelona-dubai-market-explorer" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-zinc-400 transition hover:text-white">Source and documentation <ArrowUpRight className="size-3.5" /></a></footer>
      </div>
    </main>
  );
}
