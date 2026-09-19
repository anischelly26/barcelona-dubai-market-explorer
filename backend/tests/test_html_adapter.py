from pathlib import Path

from backend.app.ingestion.html_adapter import PermittedHtmlAdapter


def test_parses_documented_fixture():
    html = Path("backend/tests/fixtures/listings.html").read_text()
    rows = PermittedHtmlAdapter("Fixture Portal", "test-agent").parse(html, "https://example.test")
    assert len(rows) == 1
    assert rows[0].city == "Dubai"
    assert rows[0].area_unit == "sqft"
    assert rows[0].external_id == "demo-1"

