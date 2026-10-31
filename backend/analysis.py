"""Pure, deterministic as-of selection and hourly comparison functions."""

from datetime import UTC, date, datetime, time, timedelta
from math import isfinite, sqrt
from zoneinfo import ZoneInfo

UK = ZoneInfo("Europe/London")
FIRST, LAST = date(2026, 1, 1), date(2026, 1, 31)


def timestamp(value):
    result = datetime.fromisoformat(value)
    if result.tzinfo is None:
        raise ValueError("Timestamp must include timezone")
    return result.astimezone(UTC)


def iso(value):
    return value.isoformat().replace("+00:00", "Z")


def decision_cutoff(day, cutoff):
    if not FIRST <= day <= LAST:
        raise ValueError("Decision date must be in January 2026")
    try:
        if len(cutoff) != 5 or cutoff[2] != ":":
            raise ValueError()
        hour, minute = map(int, cutoff.split(":"))
        clock = time(hour, minute)
    except ValueError as exc:
        raise ValueError("Cutoff must be HH:MM, 00:00–23:59") from exc
    return datetime.combine(day, clock, UK).astimezone(UTC)


def valid_generation(row):
    value = row.get("generation")
    return (
        isinstance(value, (int, float))
        and not isinstance(value, bool)
        and isfinite(value)
    )


def metrics(series):
    pairs = [
        r for r in series if r["forecast_mw"] is not None and r["actual_mw"] is not None
    ]
    n = len(pairs)
    errors = [r["forecast_mw"] - r["actual_mw"] for r in pairs]
    actual = sum(r["actual_mw"] for r in pairs)
    forecast = sum(r["forecast_mw"] for r in pairs)
    return {
        "count": n,
        "expected_count": len(series),
        "coverage_pct": 100 * n / len(series) if series else 0,
        "mae_mw": sum(map(abs, errors)) / n if n else None,
        "rmse_mw": sqrt(sum(e * e for e in errors) / n) if n else None,
        "bias_mw": sum(errors) / n if n else None,
        "wape_pct": 100 * sum(map(abs, errors)) / actual if n and actual else None,
        "forecast_energy_mwh": forecast if n else None,
        "actual_energy_mwh": actual if n else None,
        "energy_error_mwh": sum(errors) if n else None,
        "overforecast_hours": sum(e > 0 for e in errors),
        "underforecast_hours": sum(e < 0 for e in errors),
    }


def build_index(forecasts, actuals):
    forecast_index = {}
    actual_index = {}
    for row in forecasts:
        if not valid_generation(row):
            continue
        target = timestamp(row["startTime"])
        published = timestamp(row["publishTime"])
        forecast_index.setdefault(target, []).append(
            (published, float(row["generation"]))
        )
    # Identical vintages deduplicated; contradictory same-time values rejected, never order-dependent.
    for target, values in forecast_index.items():
        mapping = {}
        for published, generation in values:
            if published in mapping and mapping[published] != generation:
                raise ValueError(
                    "Conflicting forecast values at identical target/publication"
                )
            mapping[published] = generation
        forecast_index[target] = sorted(mapping.items())
    for row in actuals:
        if row.get("fuelType") != "WIND" or not valid_generation(row):
            continue
        target = timestamp(row["startTime"])
        published = timestamp(row["publishTime"])
        value = float(row["generation"])
        previous = actual_index.get(target)
        if previous and previous[0] == published and previous[1] != value:
            raise ValueError("Conflicting actuals at identical target/publication")
        if previous is None or published > previous[0]:
            actual_index[target] = (published, value)
    return forecast_index, actual_index


def dashboard(day, cutoff, indices):
    asof = decision_cutoff(day, cutoff)
    delivery = day + timedelta(days=1)
    beginning = datetime.combine(delivery, time(), UK).astimezone(UTC)
    forecasts, actuals = indices
    series = []
    for hour in range(24):
        target = beginning + timedelta(hours=hour)
        vintages = [item for item in forecasts.get(target, []) if item[0] <= asof]
        selected = vintages[-1] if vintages else None
        halves = [actuals.get(target + timedelta(minutes=m)) for m in (0, 30)]
        actual = sum(item[1] for item in halves) / 2 if all(halves) else None
        forecast = selected[1] if selected else None
        series.append(
            {
                "start_time": iso(target),
                "forecast_mw": forecast,
                "actual_mw": actual,
                "publish_time": iso(selected[0]) if selected else None,
                "error_mw": forecast - actual
                if forecast is not None and actual is not None
                else None,
                "actual_publish_times": [
                    iso(item[0]) for item in halves if item is not None
                ],
                "actual_half_hours": sum(item is not None for item in halves),
            }
        )
    publications = [r["publish_time"] for r in series if r["publish_time"]]
    known_forecasts = [r["forecast_mw"] for r in series if r["forecast_mw"] is not None]
    known_actuals = [r["actual_mw"] for r in series if r["actual_mw"] is not None]
    return {
        "decision_date": str(day),
        "delivery_date": str(delivery),
        "cutoff": cutoff,
        "cutoff_timestamp": iso(asof),
        "timezone": "Europe/London",
        "resolution_minutes": 60,
        "series": series,
        "metrics": metrics(series),
        "forecast_coverage_pct": 100 * len(known_forecasts) / 24,
        "latest_publish_time": max(publications) if publications else None,
        "oldest_publish_time": min(publications) if publications else None,
        "forecast_total_mwh": sum(known_forecasts) if known_forecasts else None,
        "actual_total_mwh": sum(known_actuals) if known_actuals else None,
    }
