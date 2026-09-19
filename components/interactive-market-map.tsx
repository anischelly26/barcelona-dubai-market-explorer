"use client";

import dynamic from "next/dynamic";

import type { City, PropertyListing } from "@/lib/market-data";

const LeafletMap = dynamic(() => import("@/components/leaflet-map"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-zinc-500">Loading map…</div>,
});

export function InteractiveMarketMap(props: {
  city: City;
  listings: PropertyListing[];
  selectedId: string;
  onSelect: (listing: PropertyListing) => void;
}) {
  return <LeafletMap {...props} />;
}

