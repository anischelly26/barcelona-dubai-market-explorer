from backend.app.schemas import RoiRequest
from backend.app.services.roi import calculate_roi


def test_roi_includes_vacancy_costs_and_acquisition_costs():
    result = calculate_roi(RoiRequest(
        purchase_price_eur=300_000,
        monthly_rent_eur=2_000,
        annual_costs_eur=3_000,
        vacancy_rate_pct=5,
        acquisition_costs_pct=10,
    ))
    assert result.gross_yield_pct == 8.0
    assert result.annual_net_income_eur == 19_800
    assert result.total_cash_required_eur == 330_000
    assert result.net_yield_pct == 6.0

