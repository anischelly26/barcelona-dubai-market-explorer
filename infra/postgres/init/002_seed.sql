WITH n(city, name, lat, lng) AS (
    VALUES
      ('Barcelona', 'Eixample', 41.3902, 2.1639),
      ('Barcelona', 'Gracia', 41.4036, 2.1568),
      ('Barcelona', 'Poblenou', 41.4035, 2.2044),
      ('Dubai', 'Dubai Marina', 25.0805, 55.1403),
      ('Dubai', 'Downtown', 25.1972, 55.2744),
      ('Dubai', 'JVC', 25.0563, 55.2094)
)
INSERT INTO neighborhoods(city, name, center)
SELECT city, name, ST_SetSRID(ST_MakePoint(lng, lat), 4326) FROM n
ON CONFLICT (city, name) DO NOTHING;

WITH seed(external_id, source_name, city, neighborhood, property_type, title, currency, price_local, price_eur, area_sqm, annual_rent_eur, bedrooms, bathrooms, lat, lng) AS (
    VALUES
      ('bcn-eixample', 'Curated demo dataset', 'Barcelona', 'Eixample', 'Apartment', 'Three-bedroom signal in Eixample', 'EUR', 495000, 495000, 82, 20400, 3, 1.0, 41.3902, 2.1639),
      ('bcn-gracia', 'Curated demo dataset', 'Barcelona', 'Gracia', 'Apartment', 'Two-bedroom signal in Gracia', 'EUR', 420000, 420000, 70, 18060, 2, 1.0, 41.4036, 2.1568),
      ('bcn-poblenou', 'Curated demo dataset', 'Barcelona', 'Poblenou', 'Apartment', 'Three-bedroom signal in Poblenou', 'EUR', 540000, 540000, 88, 21600, 3, 1.0, 41.4035, 2.2044),
      ('dub-marina', 'Curated demo dataset', 'Dubai', 'Dubai Marina', 'Apartment', 'Two-bedroom signal in Dubai Marina', 'AED', 1420000, 355000, 92, 22010, 2, 2.0, 25.0805, 55.1403),
      ('dub-downtown', 'Curated demo dataset', 'Dubai', 'Downtown', 'Apartment', 'Two-bedroom signal in Downtown', 'AED', 1880000, 470000, 85, 26790, 2, 2.0, 25.1972, 55.2744),
      ('dub-jvc', 'Curated demo dataset', 'Dubai', 'JVC', 'Apartment', 'One-bedroom signal in JVC', 'AED', 820000, 205000, 74, 14555, 1, 1.0, 25.0563, 55.2094)
), inserted AS (
    INSERT INTO properties (
        external_id, source_name, city, neighborhood_id, property_type, title,
        currency, price_local, area_sqm, annual_rent_eur, bedrooms, bathrooms,
        geom, content_hash, first_seen_at, last_seen_at
    )
    SELECT s.external_id, s.source_name, s.city, n.id, s.property_type, s.title,
           s.currency, s.price_local, s.area_sqm, s.annual_rent_eur, s.bedrooms, s.bathrooms,
           ST_SetSRID(ST_MakePoint(s.lng, s.lat), 4326)::geography,
           encode(digest(s.external_id || s.price_local::text, 'sha256'), 'hex'),
           '2026-09-01T00:00:00Z', '2026-09-01T00:00:00Z'
      FROM seed s JOIN neighborhoods n ON n.city=s.city AND n.name=s.neighborhood
    ON CONFLICT (source_name, external_id) DO UPDATE SET last_seen_at=EXCLUDED.last_seen_at
    RETURNING id, external_id
)
INSERT INTO price_snapshots(property_id, observed_at, price_local, price_eur, price_per_sqm_eur, fx_rate_to_eur)
SELECT i.id, '2026-09-01T00:00:00Z', s.price_local, s.price_eur, s.price_eur / s.area_sqm,
       CASE WHEN s.currency='AED' THEN 0.25 ELSE 1 END
  FROM inserted i JOIN seed s ON s.external_id=i.external_id
ON CONFLICT DO NOTHING;

