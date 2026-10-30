"""Rebuild the immutable January pilot snapshot from official Elexon public APIs."""

import gzip
import hashlib
import json
import pathlib
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, date, datetime, timedelta

ROOT = pathlib.Path(__file__).resolve().parents[1]
BASE = "https://data.elexon.co.uk/bmrs/api/v1/datasets/"


def fetch(job):
    dataset, params = job
    url = BASE + dataset + "/stream?" + urllib.parse.urlencode(params)
    for attempt in range(3):
        try:
            with urllib.request.urlopen(url, timeout=60) as response:
                raw = response.read()
            rows = json.loads(raw)
            if not isinstance(rows, list):
                raise TypeError("Expected JSON list")
            print(dataset, params, len(rows), flush=True)
            return (
                dataset,
                rows,
                {
                    "url": url,
                    "rows": len(rows),
                    "sha256_response": hashlib.sha256(raw).hexdigest(),
                },
            )
        except (TimeoutError, urllib.error.HTTPError, urllib.error.URLError):
            if attempt == 2:
                raise
            time.sleep(2**attempt)


def validate_snapshot(results):
    """Fail closed before replacing known-good data if source schema/cadence changes."""
    from math import isfinite

    for dataset, rows in results.items():
        if not rows:
            raise ValueError(f"{dataset} returned no data")
        for row in rows:
            if row.get("dataset") != dataset:
                raise ValueError(f"Unexpected dataset in {dataset}")
            value = row.get("generation")
            if (
                isinstance(value, bool)
                or not isinstance(value, (int, float))
                or not isfinite(value)
            ):
                raise ValueError("Non-finite or non-numeric generation")
            for key in ("publishTime", "startTime"):
                parsed = datetime.fromisoformat(row[key])
                if parsed.tzinfo is None:
                    raise ValueError("Timezone missing")
            if dataset == "FUELHH" and row.get("fuelType") != "WIND":
                raise ValueError("Non-WIND actuals returned")
    actual_slots = {r["startTime"] for r in results["FUELHH"]}
    first = datetime(2026, 1, 2, tzinfo=UTC)
    required = {
        (first + timedelta(minutes=30 * i)).isoformat().replace("+00:00", "Z")
        for i in range(1488)
    }
    if not required.issubset(actual_slots):
        raise ValueError("Incomplete actual coverage; previous snapshot retained")
    publications = {r["publishTime"][:10] for r in results["WINDFOR"]}
    if any(
        str(date(2026, 1, 1) + timedelta(days=i)) not in publications for i in range(31)
    ):
        raise ValueError("Missing January forecast publication day")


def main():
    # Include prior publications so an early-Jan-1 cutoff can still find an available D+1 forecast.
    jobs = []
    for i in range(33):
        d = date(2025, 12, 30) + timedelta(days=i)
        jobs.append(
            (
                "WINDFOR",
                {
                    "publishDateTimeFrom": str(d) + "T00:00:00Z",
                    "publishDateTimeTo": str(d + timedelta(days=1)) + "T00:00:00Z",
                },
            )
        )
    for i in range(31):
        d = date(2026, 1, 2) + timedelta(days=i)
        jobs.append(
            (
                "FUELHH",
                {
                    "settlementDateFrom": str(d),
                    "settlementDateTo": str(d),
                    "fuelType": "WIND",
                },
            )
        )
    results = {"WINDFOR": [], "FUELHH": []}
    sources = []
    with ThreadPoolExecutor(max_workers=2) as pool:
        for dataset, rows, source in pool.map(fetch, jobs):
            results[dataset].extend(rows)
            sources.append(source)
    # Remove identical inclusive-boundary duplicates; retain distinct publication vintages.
    results = {
        k: [
            json.loads(r) for r in sorted({json.dumps(r, sort_keys=True) for r in rows})
        ]
        for k, rows in results.items()
    }
    validate_snapshot(results)
    payload = {
        "schema_version": 1,
        "retrieved_at": datetime.now(UTC).isoformat(),
        "sources": sources,
        "datasets": results,
    }
    raw = json.dumps(payload, separators=(",", ":")).encode()
    target = ROOT / "data" / "january_2026.json.gz"
    target.parent.mkdir(parents=True, exist_ok=True)
    tmp = target.with_suffix(".tmp")
    with tmp.open("wb") as f, gzip.GzipFile(fileobj=f, mode="wb", mtime=0) as z:
        z.write(raw)
    tmp.replace(target)
    print(
        "Saved",
        target,
        {k: len(v) for k, v in results.items()},
        "sha256",
        hashlib.sha256(target.read_bytes()).hexdigest(),
    )


if __name__ == "__main__":
    main()
