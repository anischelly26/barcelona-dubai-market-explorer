"use client";

import { useEffect } from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";

import type { City, PropertyListing } from "@/lib/market-data";

const settings: Record<City, { center: [number, number]; zoom: number; accent: string }> = {
  Barcelona: { center: [41.3902, 2.1686], zoom: 12, accent: "#47e7d4" },
  Dubai: { center: [25.125, 55.22], zoom: 10, accent: "#ffb454" },
};

function Viewport({ city }: { city: City }) {
  const map = useMap();
  useEffect(() => {
    map.setView(settings[city].center, settings[city].zoom, { animate: false });
  }, [city, map]);
  return null;
}

export default function LeafletMap({ city, listings, selectedId, onSelect }: {
  city: City;
  listings: PropertyListing[];
  selectedId: string;
  onSelect: (listing: PropertyListing) => void;
}) {
  const config = settings[city];
  return (
    <MapContainer
      center={config.center}
      zoom={config.zoom}
      scrollWheelZoom
      className="h-full w-full bg-[#0b1318]"
      zoomControl
      attributionControl
    >
      <Viewport city={city} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {listings.map((listing) => {
        const selected = listing.id === selectedId;
        return (
          <CircleMarker
            key={listing.id}
            center={[listing.latitude, listing.longitude]}
            radius={selected ? 10 : 7}
            pathOptions={{
              color: config.accent,
              fillColor: config.accent,
              fillOpacity: selected ? 0.9 : 0.65,
              weight: selected ? 3 : 2,
            }}
            eventHandlers={{ click: () => onSelect(listing) }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              <strong>{listing.neighborhood}</strong><br />
              €{Math.round(listing.price_per_sqm_eur).toLocaleString()}/m²
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}

