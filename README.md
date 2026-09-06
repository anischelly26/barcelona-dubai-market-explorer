# Barcelona & Dubai Market Explorer

A portfolio-grade property intelligence MVP by **Anis Chelli**. It demonstrates how heterogeneous listings from Barcelona and Dubai can be normalized into one comparable data model, explored geographically, and analyzed through a responsive dashboard.

**[Open the live MVP](https://barcelona-dubai-market-explorer.rhythmx.chatgpt.site)**

**Current status:** frontend MVP complete; backend and ingestion pipeline planned.

> The current MVP uses synthetic, illustrative data. It does not scrape or reproduce protected listing content and must not be used for investment decisions.

## What it demonstrates

- Cross-market currency and unit normalization
- Interactive filtering by property type and budget
- Geospatial neighborhood signal exploration
- Comparative price-per-square-metre trends
- Derived metrics for median pricing and gross rental yield
- A product interface ready to consume a real backend API

## Stack

- Next.js / React / TypeScript
- Tailwind CSS and shadcn/ui
- Recharts for comparative time-series visualization
- SVG-based geospatial prototype
- Target backend: FastAPI, PostgreSQL/PostGIS, Docker

## Architecture

```text
Licensed APIs / open datasets
            ↓
Python ingestion and validation
            ↓
Normalization layer (currency, units, schema)
            ↓
PostgreSQL + PostGIS + price snapshots
            ↓
FastAPI analytics service
            ↓
Next.js comparison dashboard
```

The repository currently implements the frontend product slice and a typed synthetic dataset. The next milestone is to move the data contract behind FastAPI and add a reproducible ingestion job using legally permitted sources.

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Roadmap

1. Create the FastAPI service and OpenAPI contract.
2. Add PostgreSQL/PostGIS tables for listings, price snapshots, neighborhoods, and FX rates.
3. Build a compliant ingestion connector for one open Barcelona dataset and one licensed UAE source.
4. Add validation, deduplication, historical snapshots, and automated tests.
5. Containerize the frontend, API, worker, and database with Docker Compose.
6. Add CI checks, observability, and a documented benchmark for API latency and data quality.

## Data ethics

Before connecting a source, verify its terms of service, robots policy, licensing, retention rules, and personal-data implications. Use official APIs or open datasets where possible. Anti-blocking techniques are intentionally not part of this MVP.
