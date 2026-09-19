import asyncio
from dataclasses import dataclass
from decimal import Decimal
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup
from tenacity import retry, stop_after_attempt, wait_exponential

from backend.app.services.normalization import RawListing


@dataclass(frozen=True)
class HtmlSelectors:
    card: str = "[data-listing]"
    title: str = "[data-title]"
    price: str = "[data-price]"
    area: str = "[data-area]"
    rent: str = "[data-rent]"


class PermittedHtmlAdapter:
    """Small, rate-limited adapter for sources that explicitly permit collection.

    The adapter intentionally does not bypass CAPTCHAs, authentication, robots
    controls, or rate limits. Each real source needs its own documented license,
    selector mapping, and compliance review before use.
    """

    def __init__(self, source_name: str, user_agent: str, selectors: HtmlSelectors | None = None):
        self.source_name = source_name
        self.user_agent = user_agent
        self.selectors = selectors or HtmlSelectors()

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8), reraise=True)
    async def fetch(self, url: str) -> str:
        parsed = urlparse(url)
        if parsed.scheme not in {"http", "https"}:
            raise ValueError("Only HTTP(S) sources are supported")
        async with httpx.AsyncClient(
            timeout=20,
            follow_redirects=True,
            headers={"User-Agent": self.user_agent, "Accept": "text/html"},
        ) as client:
            response = await client.get(url)
            response.raise_for_status()
            await asyncio.sleep(0.5)
            return response.text

    def parse(self, html: str, source_url: str) -> list[RawListing]:
        soup = BeautifulSoup(html, "html.parser")
        listings: list[RawListing] = []
        for card in soup.select(self.selectors.card):
            def attr(name: str, fallback: str = "") -> str:
                return str(card.get(f"data-{name}", fallback)).strip()

            title_node = card.select_one(self.selectors.title)
            price_node = card.select_one(self.selectors.price)
            area_node = card.select_one(self.selectors.area)
            rent_node = card.select_one(self.selectors.rent)
            listings.append(RawListing(
                external_id=attr("id"),
                city=attr("city"),
                neighborhood=attr("neighborhood"),
                property_type=attr("type", "Apartment"),
                title=(title_node.get_text(" ", strip=True) if title_node else attr("title")),
                price=Decimal(price_node.get_text(strip=True) if price_node else attr("price")),
                currency=attr("currency"),
                area=Decimal(area_node.get_text(strip=True) if area_node else attr("area")),
                area_unit=attr("area-unit", "sqm"),
                monthly_rent=Decimal(rent_node.get_text(strip=True) if rent_node else attr("rent", "0")),
                latitude=float(attr("lat")),
                longitude=float(attr("lng")),
                source_name=self.source_name,
                source_url=source_url,
                bedrooms=int(attr("bedrooms")) if attr("bedrooms") else None,
                bathrooms=float(attr("bathrooms")) if attr("bathrooms") else None,
            ))
        return listings

