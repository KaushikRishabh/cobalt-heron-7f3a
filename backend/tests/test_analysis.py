from datetime import date

import pytest

from backend.analysis import build_index, dashboard, decision_cutoff, metrics


def f(t, p, g):
    return {"startTime": t, "publishTime": p, "generation": g}


def a(t, g, p="2026-01-03T00:00:00Z"):
    return {**f(t, p, g), "fuelType": "WIND"}


def test_asof_and_actual_hour_alignment():
    t = "2026-01-02T00:00:00Z"
    idx = build_index(
        [
            f(t, "2026-01-01T09:30:00Z", 100),
            f(t, "2026-01-01T09:45:00Z", 110),
            f(t, "2026-01-01T09:46:00Z", 999),
        ],
        [a(t, 80), a("2026-01-02T00:30:00Z", 100)],
    )
    result = dashboard(date(2026, 1, 1), "09:45", idx)
    assert result["series"][0]["forecast_mw"] == 110
    assert result["series"][0]["actual_mw"] == 90
    assert result["series"][0]["error_mw"] == 20
    assert result["metrics"]["count"] == 1
    assert result["metrics"]["energy_error_mwh"] == 20
    assert result["metrics"]["mae_mw"] == 20
    assert result["series"][1]["forecast_mw"] is None


def test_missing_half_not_imputed():
    t = "2026-01-02T00:00:00Z"
    r = dashboard(
        date(2026, 1, 1),
        "09:45",
        build_index([f(t, "2026-01-01T09:30:00Z", 10)], [a(t, 0)]),
    )
    assert r["series"][0]["actual_mw"] is None
    assert r["series"][0]["actual_half_hours"] == 1
    assert r["metrics"]["mae_mw"] is None


def test_zero_is_valid_and_wape_zero_denominator():
    assert metrics([{"forecast_mw": 0, "actual_mw": 0}])["mae_mw"] == 0
    assert metrics([{"forecast_mw": 1, "actual_mw": 0}])["wape_pct"] is None


def test_math():
    m = metrics(
        [{"forecast_mw": 100, "actual_mw": 80}, {"forecast_mw": 80, "actual_mw": 100}]
    )
    assert m["mae_mw"] == m["rmse_mw"] == 20
    assert m["bias_mw"] == m["energy_error_mwh"] == 0
    assert m["wape_pct"] == pytest.approx(40 / 180 * 100)
    assert m["forecast_energy_mwh"] == 180


def test_month_boundary_and_prior_publication():
    t = "2026-02-01T23:00:00Z"
    r = dashboard(
        date(2026, 1, 31), "00:00", build_index([f(t, "2026-01-30T22:30:00Z", 1)], [])
    )
    assert r["delivery_date"] == "2026-02-01"
    assert r["series"][-1]["forecast_mw"] == 1


@pytest.mark.parametrize(
    "day,cutoff",
    [
        (date(2025, 12, 31), "09:45"),
        (date(2026, 2, 1), "09:45"),
        (date(2026, 1, 1), "24:00"),
        (date(2026, 1, 1), "9:45"),
        (date(2026, 1, 1), "09:60"),
    ],
)
def test_validation(day, cutoff):
    with pytest.raises(ValueError):
        decision_cutoff(day, cutoff)


def test_duplicate_conflict_and_nonwind():
    t = "2026-01-02T00:00:00Z"
    p = "2026-01-01T09:30:00Z"
    with pytest.raises(ValueError):
        build_index([f(t, p, 1), f(t, p, 2)], [])
    assert build_index([], [{**a(t, 3), "fuelType": "GAS"}])[1] == {}


def test_latest_actual_revision():
    t = "2026-01-02T00:00:00Z"
    assert (
        next(
            iter(
                build_index([], [a(t, 1), a(t, 2, "2026-01-04T00:00:00Z")])[1].values()
            )
        )[1]
        == 2
    )


def test_finite_validation_and_negative_net_generation():
    from backend.analysis import timestamp, valid_generation

    assert valid_generation({"generation": -1})
    for value in (True, float("nan"), float("inf"), None, "12"):
        assert not valid_generation({"generation": value})
    with pytest.raises(ValueError):
        timestamp("2026-01-01T00:00:00")
    with pytest.raises(ValueError):
        timestamp("not-a-time")


def test_forecast_order_invariance():
    t = "2026-01-02T00:00:00Z"
    rows = [f(t, "2026-01-01T07:30:00Z", 10), f(t, "2026-01-01T09:30:00Z", 20)]
    assert build_index(rows, []) == build_index(list(reversed(rows)), [])
