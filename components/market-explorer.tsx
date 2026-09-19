"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Building2,
  CircleDollarSign,
  Code2,
  Database,
  Layers3,
  Map as MapIcon,
  MapPin,
  RefreshCw,
  Server,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
} from "lucide-react";
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

type Tone = "aqua" | "amber" | "violet" | "neutral";

function formatLocalPrice(item: PropertyListing) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: item.currency,
    maximumFractionDigits: 0,
  }).format(item.price_local);
}

function MetricCard({ icon: Icon, label, value, detail, tone = "neutral" }: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  detail: string;
  tone?: Tone;
}) {
  return (
    <article className={`metric-card metric-${tone}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{value}</p>
        </div>
        <span className="metric-icon"><Icon className="size-4" /></span>
      </div>
      <p className="mt-3 text-sm leading-5 text-zinc-400">{detail}</p>
    </article>
  );
}

function CityScoreCard({ city, median, averageYield, count, maxMedian }: {
  city: City;
  median: number;
  averageYield: number;
  count: number;
  maxMedian: number;
}) {
  const width = median && maxMedian ? Math.max(12, (median / maxMedian) * 100) : 0;
  return (
    <article className={`city-score ${city === "Barcelona" ? "city-score-bcn" : "city-score-dubai"}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="city-dot" />
          <div>
            <h4 className="font-semibold text-white">{city}</h4>
            <p className="text-xs text-zinc-500">{city === "Barcelona" ? "Spain · EUR" : "UAE · normalized EUR"}</p>
          </div>
        </div>
        <span className="font-mono text-xs text-zinc-400">{count} listings</span>
      </div>
      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs text-zinc-500">Median asking price</p>
          <p className="mt-1 text-xl font-semibold text-white">{median ? `${euro.format(median)} / m²` : "—"}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-500">Average yield</p>
          <p className="mt-1 font-mono text-base font-semibold text-zinc-200">{averageYield ? `${averageYield.toFixed(1)}%` : "—"}</p>
        </div>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/30">
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${width}%` }} />
      </div>
    </article>
  );
}

function CityMap({ city, listings, selectedId, onSelect }: {
  city: City;
  listings: PropertyListing[];
  selectedId: string;
  onSelect: (property: PropertyListing) => void;
}) {
  return (
    <article className={`map-card overflow-hidden ${city === "Barcelona" ? "map-card-bcn" : "map-card-dubai"}`}>
      <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
        <div>
          <p className="eyebrow">{city === "Barcelona" ? "Mediterranean market" : "Gulf market"}</p>
          <h3 className="mt-1 text-xl font-semibold text-white">{city}</h3>
        </div>
        <Badge variant="outline" className="border-white/10 bg-black/15 text-zinc-300">{listings.length} signals</Badge>
      </div>
      <div className="map-frame relative mx-3 mt-4 h-[19rem] overflow-hidden rounded-2xl border border-white/10 bg-[#081116] sm:mx-4 lg:h-[22rem]">
        {listings.length ? (
          <InteractiveMarketMap city={city} listings={listings} selectedId={selectedId} onSelect={onSelect} />
        ) : (
          <div className="absolute inset-0 grid place-items-center px-8 text-center text-sm text-zinc-400">No listings match this filter. Increase the budget or reset the property type.</div>
        )}
      </div>
      <div className="flex items-center justify-between gap-4 px-5 py-4 text-xs text-zinc-500 sm:px-6">
        <span>Tap a marker to inspect it</span>
        <span className="font-mono uppercase tracking-wide">OpenStreetMap</span>
      </div>
    </article>
  );
}

function PropertySpotlight({ property }: { property: PropertyListing }) {
  const facts = [
    ["Local price", formatLocalPrice(property)],
    ["Normalized", euro.format(property.price_eur)],
    ["Price / m²", euro.format(property.price_per_sqm_eur)],
    ["Floor area", `${property.area_sqm} m²`],
    ["Gross yield", `${property.gross_yield_pct.toFixed(1)}%`],
    ["Bedrooms", String(property.bedrooms)],
  ];

  return (
    <article className="panel overflow-hidden">
      <div className={`spotlight-top ${property.city === "Barcelona" ? "spotlight-bcn" : "spotlight-dubai"}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow text-white/65">Selected property</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">{property.neighborhood}</h3>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-white/75"><MapPin className="size-4" /> {property.city}</p>
          </div>
          <Badge className="border border-white/10 bg-black/20 text-white">{property.property_type}</Badge>
        </div>
        <p className="mt-7 text-sm text-white/65">Normalized asking price</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-white">{euro.format(property.price_eur)}</p>
      </div>
      <dl className="grid grid-cols-2 gap-px bg-white/8">
        {facts.map(([label, value]) => (
          <div key={label} className="bg-[#0b151a] p-4 sm:p-5">
            <dt className="text-xs uppercase tracking-[0.12em] text-zinc-500">{label}</dt>
            <dd className="mt-2 text-sm font-medium text-zinc-100">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 text-xs leading-5 text-zinc-500">
        <span>Source: {property.source_name}</span>
        <span>Observed {observedDate.format(new Date(property.observed_at))}</span>
      </div>
    </article>
  );
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
  const activeSelected = filtered.find((property) => property.id === selected.id) ?? filtered[0] ?? selected;
  const maxMedian = Math.max(bcnMetrics.medianPricePerSqm, dubaiMetrics.medianPricePerSqm);
  const priceAdvantage = bcnMetrics.medianPricePerSqm && dubaiMetrics.medianPricePerSqm
    ? Math.round((1 - dubaiMetrics.medianPricePerSqm / bcnMetrics.medianPricePerSqm) * 100)
    : 0;
  const yieldLeader = bcnMetrics.averageYield >= dubaiMetrics.averageYield ? "Barcelona" : "Dubai";
  const yieldGap = Math.abs(bcnMetrics.averageYield - dubaiMetrics.averageYield);
  const resetFilters = () => {
    setType("All");
    setMaxBudget([1000]);
  };

  return (
    <main className="dashboard-shell min-h-screen pb-24 text-zinc-100 md:pb-0">
      <header className="sticky top-0 z-[1000] border-b border-white/8 bg-[#071014]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <a href="#overview" className="flex items-center gap-3" aria-label="Market Explorer home">
            <span className="brand-mark"><BarChart3 className="size-5" /></span>
            <span><strong className="block text-sm font-semibold tracking-wide text-white sm:text-base">Market Explorer</strong><span className="block text-xs text-zinc-500">Barcelona ↔ Dubai</span></span>
          </a>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
            {[['Overview', '#overview'], ['Maps', '#maps'], ['Analytics', '#analytics'], ['ROI', '#roi']].map(([label, href]) => (
              <a key={href} href={href} className="rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white">{label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <span className={`status-badge ${dataMode === "database" ? "status-live" : "status-demo"}`}>
              <span className="status-dot" />
              <span className="hidden sm:inline">{dataMode === "database" ? "PostgreSQL live" : dataMode === "fallback" ? "API fallback" : "Public demo data"}</span>
              <span className="sm:hidden">{dataMode === "database" ? "Live" : "Demo"}</span>
            </span>
            <a className="header-icon-button" href="https://github.com/anischelly26/barcelona-dubai-market-explorer" target="_blank" rel="noreferrer" aria-label="View source code on GitHub"><Code2 className="size-4" /></a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section id="overview" className="scroll-mt-24">
          <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr] xl:items-end">
            <div>
              <p className="eyebrow text-[#66f4e3]">Live comparative intelligence</p>
              <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl">One view. <span className="title-gradient">Two property markets.</span></h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400 sm:text-base">Filter, map and compare Barcelona and Dubai on one normalized data layer—then stress-test an investment before you shortlist it.</p>
            </div>

            <div className="control-deck">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-200"><SlidersHorizontal className="size-4 text-[#49ead6]" /> Market controls</div>
                <div className="flex items-center gap-2 text-xs text-zinc-500"><Activity className="size-3.5" /> Updated {refreshedAt ? refreshedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "on load"}</div>
              </div>
              <div className="mt-5 grid gap-5 md:grid-cols-[180px_1fr_auto] md:items-end">
                <label className="space-y-2 text-sm text-zinc-400">Property type
                  <Select value={type} onValueChange={setType}><SelectTrigger className="w-full border-white/10 bg-[#071116] text-zinc-100"><SelectValue /></SelectTrigger><SelectContent className="z-[1200] border-white/10 bg-[#0d181d] text-zinc-100"><SelectItem value="All">All properties</SelectItem><SelectItem value="Apartment">Apartments</SelectItem><SelectItem value="Villa">Villas</SelectItem></SelectContent></Select>
                </label>
                <label className="space-y-3 text-sm text-zinc-400"><span className="flex justify-between gap-4"><span>Maximum budget</span><strong className="font-mono font-medium text-white">€{compact.format(maxBudget[0] * 1000)}</strong></span><Slider min={200} max={2000} step={50} value={maxBudget} onValueChange={setMaxBudget} aria-label="Maximum property budget" className="[&_[data-slot=slider-range]]:bg-[#49ead6] [&_[data-slot=slider-thumb]]:border-[#49ead6]" /></label>
                <Button variant="outline" className="border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10 hover:text-white" onClick={resetFilters}><RefreshCw className="size-4" /> Reset</Button>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={Building2} label="Barcelona median" value={bcnMetrics.medianPricePerSqm ? `${euro.format(bcnMetrics.medianPricePerSqm)} / m²` : "—"} detail={`${bcn.length} filtered properties`} tone="aqua" />
            <MetricCard icon={MapPin} label="Dubai median" value={dubaiMetrics.medianPricePerSqm ? `${euro.format(dubaiMetrics.medianPricePerSqm)} / m²` : "—"} detail="AED and sqft normalized" tone="amber" />
            <MetricCard icon={TrendingUp} label="Average gross yield" value={allMetrics.averageYield ? `${allMetrics.averageYield.toFixed(1)}%` : "—"} detail="Annual rent ÷ purchase price" tone="violet" />
            <MetricCard icon={Layers3} label="Listings analyzed" value={String(filtered.length)} detail={`${properties.length} records available`} />
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[1.45fr_0.75fr]">
            <article className="comparison-panel">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><p className="eyebrow">Market pulse</p><h2 className="mt-1 text-xl font-semibold text-white">Side-by-side snapshot</h2></div>
                <span className="signal-pill"><Sparkles className="size-3.5" /> {priceAdvantage > 0 ? `Dubai is ${priceAdvantage}% lower per m²` : "Markets are closely priced"}</span>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <CityScoreCard city="Barcelona" median={bcnMetrics.medianPricePerSqm} averageYield={bcnMetrics.averageYield} count={bcn.length} maxMedian={maxMedian} />
                <CityScoreCard city="Dubai" median={dubaiMetrics.medianPricePerSqm} averageYield={dubaiMetrics.averageYield} count={dubai.length} maxMedian={maxMedian} />
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/8 bg-black/15 px-4 py-3 text-sm text-zinc-400">
                <span><strong className="text-zinc-200">Yield lead:</strong> {yieldLeader}</span>
                <span className="font-mono text-xs text-zinc-500">+{yieldGap.toFixed(1)} percentage points</span>
              </div>
            </article>
            <PropertySpotlight property={activeSelected} />
          </div>
        </section>

        <section id="maps" className="mt-10 scroll-mt-24">
          <div className="section-heading"><div><p className="eyebrow">Geospatial explorer</p><h2>See where every signal lives</h2></div><p>Select any marker to update the property spotlight above.</p></div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <CityMap city="Barcelona" listings={bcn} selectedId={activeSelected.id} onSelect={setSelected} />
            <CityMap city="Dubai" listings={dubai} selectedId={activeSelected.id} onSelect={setSelected} />
          </div>
        </section>

        <section id="analytics" className="mt-10 scroll-mt-24">
          <div className="section-heading"><div><p className="eyebrow">Historical analytics</p><h2>Price movement, normalized</h2></div><p>Comparable EUR/m² trends remove currency and unit friction.</p></div>
          <article className="panel mt-4 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><h3 className="text-lg font-semibold text-white">Market price index</h3><p className="mt-1 text-sm text-zinc-500">EUR per square metre</p></div>
              <div className="period-switch" aria-label="Chart period">{[3, 6, 12].map((months) => <button key={months} type="button" onClick={() => setPeriod(months)} className={period === months ? "period-active" : ""}>{months}M</button>)}</div>
            </div>
            <div className="mt-6 h-[18rem] w-full sm:h-[22rem]"><ResponsiveContainer width="100%" height="100%"><LineChart data={visibleTrend} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}><CartesianGrid stroke="#1b2b32" strokeDasharray="3 6" vertical={false} /><XAxis dataKey="month" tick={{ fill: "#84939a", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => trendMonth.format(new Date(String(value)))} /><YAxis tick={{ fill: "#84939a", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${Math.round(value / 1000)}k`} /><Tooltip contentStyle={{ background: "#0b151a", border: "1px solid #263a43", borderRadius: 12, fontSize: 12 }} formatter={(value) => [`€${Number(value).toLocaleString()}/m²`]} labelFormatter={(value) => trendMonthLong.format(new Date(String(value)))} /><Legend wrapperStyle={{ fontSize: 12, color: "#a1a1aa" }} /><Line type="monotone" dataKey="Barcelona" stroke="#49ead6" strokeWidth={3} dot={false} connectNulls activeDot={{ r: 5 }} /><Line type="monotone" dataKey="Dubai" stroke="#ffb45f" strokeWidth={3} dot={false} connectNulls activeDot={{ r: 5 }} /></LineChart></ResponsiveContainer></div>
          </article>
        </section>

        <section id="roi" className="mt-10 scroll-mt-24"><RoiCalculator /></section>

        <section id="architecture" className="mt-10 scroll-mt-24">
          <div className="section-heading"><div><p className="eyebrow">Under the hood</p><h2>Built like a real data product</h2></div><p>From ingestion to investment insight, every layer is testable and replaceable.</p></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { icon: Database, title: "PostgreSQL + PostGIS", text: "Indexed listings, neighborhoods, FX rates and historical price snapshots." },
              { icon: Server, title: "FastAPI service", text: "Typed filtering, geospatial search, market trends and ROI endpoints." },
              { icon: Building2, title: "Automated ingestion", text: "Rate-limited adapters, validation, normalization, deduplication and daily scheduling." },
              { icon: ShieldCheck, title: "Responsible sourcing", text: "Only permitted sources; no CAPTCHA bypassing or protected-content reproduction." },
            ].map(({ icon: Icon, title, text }, index) => <article key={title} className="method-card"><span className="method-icon"><Icon className="size-4" /></span><span className="font-mono text-xs text-zinc-600">0{index + 1}</span><h3 className="mt-5 text-base font-semibold text-zinc-100">{title}</h3><p className="mt-2 text-sm leading-6 text-zinc-500">{text}</p></article>)}
          </div>
        </section>

        <footer className="mt-10 flex flex-col gap-3 border-t border-white/8 py-7 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between"><span>Built by Anis Chelli · Software Engineering portfolio project</span><a href="https://github.com/anischelly26/barcelona-dubai-market-explorer" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-zinc-400 transition hover:text-white">Source and documentation <ArrowUpRight className="size-3.5" /></a></footer>
      </div>

      <nav className="mobile-nav md:hidden" aria-label="Mobile navigation">
        {[{ label: "Overview", href: "#overview", icon: Layers3 }, { label: "Maps", href: "#maps", icon: MapIcon }, { label: "Trends", href: "#analytics", icon: BarChart3 }, { label: "ROI", href: "#roi", icon: CircleDollarSign }].map(({ label, href, icon: Icon }) => <a key={href} href={href}><Icon className="size-4" /><span>{label}</span></a>)}
      </nav>
    </main>
  );
}
