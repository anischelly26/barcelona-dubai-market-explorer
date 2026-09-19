CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS neighborhoods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    city text NOT NULL CHECK (city IN ('Barcelona', 'Dubai')),
    name text NOT NULL,
    boundary geometry(MultiPolygon, 4326),
    center geometry(Point, 4326),
    UNIQUE (city, name)
);

CREATE TABLE IF NOT EXISTS properties (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id text NOT NULL,
    source_name text NOT NULL,
    source_url text,
    city text NOT NULL CHECK (city IN ('Barcelona', 'Dubai')),
    neighborhood_id uuid NOT NULL REFERENCES neighborhoods(id),
    property_type text NOT NULL CHECK (property_type IN ('Apartment', 'Villa', 'Townhouse', 'Studio')),
    title text NOT NULL,
    currency char(3) NOT NULL CHECK (currency IN ('EUR', 'AED')),
    price_local numeric(14, 2) NOT NULL CHECK (price_local > 0),
    area_sqm numeric(10, 2) NOT NULL CHECK (area_sqm > 0),
    annual_rent_eur numeric(14, 2) NOT NULL DEFAULT 0,
    bedrooms integer CHECK (bedrooms >= 0),
    bathrooms numeric(4, 1) CHECK (bathrooms >= 0),
    geom geography(Point, 4326) NOT NULL,
    content_hash char(64) NOT NULL,
    first_seen_at timestamptz NOT NULL,
    last_seen_at timestamptz NOT NULL,
    active boolean NOT NULL DEFAULT true,
    UNIQUE (source_name, external_id)
);

CREATE TABLE IF NOT EXISTS price_snapshots (
    id bigserial PRIMARY KEY,
    property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    observed_at timestamptz NOT NULL,
    price_local numeric(14, 2) NOT NULL,
    price_eur numeric(14, 2) NOT NULL,
    price_per_sqm_eur numeric(12, 2) NOT NULL,
    fx_rate_to_eur numeric(14, 8) NOT NULL,
    UNIQUE (property_id, observed_at)
);

CREATE TABLE IF NOT EXISTS fx_rates (
    rate_date date NOT NULL,
    base_currency char(3) NOT NULL,
    quote_currency char(3) NOT NULL DEFAULT 'EUR',
    rate numeric(14, 8) NOT NULL CHECK (rate > 0),
    source text NOT NULL,
    PRIMARY KEY (rate_date, base_currency, quote_currency)
);

CREATE TABLE IF NOT EXISTS ingestion_runs (
    id bigserial PRIMARY KEY,
    source_name text NOT NULL,
    started_at timestamptz NOT NULL DEFAULT now(),
    finished_at timestamptz,
    status text NOT NULL CHECK (status IN ('running', 'success', 'partial', 'failed')),
    records_seen integer NOT NULL DEFAULT 0,
    records_accepted integer NOT NULL DEFAULT 0,
    records_rejected integer NOT NULL DEFAULT 0,
    error_summary text
);

CREATE INDEX IF NOT EXISTS properties_geom_gix ON properties USING gist (geom);
CREATE INDEX IF NOT EXISTS properties_city_type_idx ON properties (city, property_type) WHERE active;
CREATE INDEX IF NOT EXISTS price_snapshots_property_time_idx ON price_snapshots (property_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS price_snapshots_time_idx ON price_snapshots (observed_at DESC);

CREATE OR REPLACE VIEW market_summary AS
WITH latest AS (
    SELECT DISTINCT ON (property_id) property_id, price_eur, price_per_sqm_eur
      FROM price_snapshots
     ORDER BY property_id, observed_at DESC
)
SELECT p.city,
       count(*)::int AS listings,
       percentile_cont(0.5) WITHIN GROUP (ORDER BY l.price_eur)::float AS median_price_eur,
       percentile_cont(0.5) WITHIN GROUP (ORDER BY l.price_per_sqm_eur)::float AS median_price_per_sqm_eur,
       avg(COALESCE(p.annual_rent_eur / NULLIF(l.price_eur, 0) * 100, 0))::float AS average_gross_yield_pct
  FROM properties p JOIN latest l ON l.property_id = p.id
 WHERE p.active
 GROUP BY p.city;

