from backend.app.schemas import RoiRequest, RoiResponse


def calculate_roi(request: RoiRequest) -> RoiResponse:
    annual_gross = request.monthly_rent_eur * 12
    effective_income = annual_gross * (1 - request.vacancy_rate_pct / 100)
    annual_net = effective_income - request.annual_costs_eur
    total_cash = request.purchase_price_eur * (1 + request.acquisition_costs_pct / 100)
    gross_yield = annual_gross / request.purchase_price_eur * 100
    net_yield = annual_net / total_cash * 100
    payback = total_cash / annual_net if annual_net > 0 else None

    return RoiResponse(
        gross_yield_pct=round(gross_yield, 2),
        net_yield_pct=round(net_yield, 2),
        annual_gross_income_eur=round(annual_gross, 2),
        annual_net_income_eur=round(annual_net, 2),
        total_cash_required_eur=round(total_cash, 2),
        payback_years=round(payback, 1) if payback else None,
    )

