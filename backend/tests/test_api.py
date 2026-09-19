from fastapi.testclient import TestClient

from backend.app.main import app


def test_health_and_filtered_properties():
    with TestClient(app) as client:
        health = client.get("/health")
        assert health.status_code == 200
        assert health.json()["data_mode"] == "demo"

        response = client.get("/v1/properties", params={"city": "Dubai", "max_price_eur": 400000})
        assert response.status_code == 200
        payload = response.json()
        assert payload["total"] >= 1
        assert all(item["city"] == "Dubai" for item in payload["items"])
        assert all(item["price_eur"] <= 400000 for item in payload["items"])


def test_roi_endpoint_validation():
    with TestClient(app) as client:
        response = client.post("/v1/analytics/roi", json={
            "purchase_price_eur": 250000,
            "monthly_rent_eur": 1500,
            "annual_costs_eur": 2000,
            "vacancy_rate_pct": 5,
            "acquisition_costs_pct": 10,
        })
        assert response.status_code == 200
        assert response.json()["net_yield_pct"] > 0

