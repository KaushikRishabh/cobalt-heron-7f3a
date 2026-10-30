from datetime import date, timedelta

from fastapi import FastAPI, HTTPException

from .analysis import dashboard, decision_cutoff, metrics
from .store import load

app = FastAPI(title="Wind procurement pilot", version="1.0.0")
NOTES = [
    "Decision dates are January 2026; next-day delivery dates are 2 January–1 February.",
    "09:45 Europe/London is an illustrative decision cutoff, not a universal market gate. January is GMT (UTC).",
    "Per target hour, select the latest WINDFOR publication at or before the decision cutoff. No later forecast revisions are used.",
    "WINDFOR targets in this snapshot are hourly. Comparison treats each forecast as representative of that hour and averages its two FUELHH half-hour actuals. This is an explicit alignment assumption, not an interpolation.",
    "Actuals and accuracy metrics are retrospective evaluation, unavailable on the decision day. Missing actual half-hours are not imputed.",
    "Forecast and actual total energy sums are partial when coverage is incomplete. All error metrics and energy comparisons use matched complete hours only; positive bias means wind overforecast (potential procurement shortfall).",
    "National wind is not a utility portfolio. Demand, owned wind share, prices and costs are outside scope; this app does not compute an executable purchase order.",
    "Full-month accuracy is descriptive hindsight, not a calibrated future prediction interval or financial guarantee.",
]


def context():
    try:
        return load()
    except (OSError, ValueError, KeyError) as exc:
        raise HTTPException(
            503, "Verified data snapshot unavailable. Run python scripts/fetch_data.py."
        ) from exc


def validate(day, cutoff):
    try:
        decision_cutoff(day, cutoff)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc


@app.get("/api/health")
def health():
    _, p = context()
    return {"status": "ok", "snapshot_sha256": p["snapshot_sha256"]}


@app.get("/api/metadata")
def metadata():
    _, p = context()
    return {
        "provenance": p,
        "notes": NOTES,
        "decision_start": "2026-01-01",
        "decision_end": "2026-01-31",
        "default_cutoff": "09:45",
    }


@app.get("/api/dashboard")
def get_dashboard(decision_date: date = date(2026, 1, 15), cutoff: str = "09:45"):
    validate(decision_date, cutoff)
    indices, provenance = context()
    return {
        **dashboard(decision_date, cutoff, indices),
        "provenance": provenance,
        "notes": NOTES,
    }


@app.get("/api/analysis")
def get_analysis(
    start: date = date(2026, 1, 1), end: date = date(2026, 1, 31), cutoff: str = "09:45"
):
    validate(start, cutoff)
    validate(end, cutoff)
    if end < start:
        raise HTTPException(422, "End must be on or after start")
    indices, provenance = context()
    days = []
    series = []
    for offset in range((end - start).days + 1):
        d = dashboard(start + timedelta(days=offset), cutoff, indices)
        series.extend(d["series"])
        days.append(
            {
                k: d[k]
                for k in (
                    "decision_date",
                    "delivery_date",
                    "metrics",
                    "forecast_coverage_pct",
                )
            }
        )
    return {
        "start": str(start),
        "end": str(end),
        "cutoff": cutoff,
        "resolution_minutes": 60,
        "metrics": metrics(series),
        "daily": days,
        "provenance": provenance,
        "notes": NOTES,
    }
