"""Read-only bundled snapshot cache. Refresh explicitly with scripts/fetch_data.py."""

import gzip
import hashlib
import json
import os
from functools import lru_cache
from pathlib import Path

from .analysis import build_index

DEFAULT = Path(__file__).resolve().parents[1] / "data" / "january_2026.json.gz"


@lru_cache(maxsize=1)
def load():
    path = Path(os.environ.get("ELEXON_SNAPSHOT", str(DEFAULT)))
    raw = path.read_bytes()
    snapshot = json.loads(gzip.decompress(raw))
    if snapshot.get("schema_version") != 1:
        raise ValueError("Unsupported snapshot schema")
    datasets = snapshot["datasets"]
    indices = build_index(datasets["WINDFOR"], datasets["FUELHH"])
    if any(t.minute or t.second or t.microsecond for t in indices[0]):
        raise ValueError("Snapshot forecast cadence changed; review hourly alignment")
    if any(t.minute not in (0, 30) or t.second or t.microsecond for t in indices[1]):
        raise ValueError("Snapshot actual cadence changed; review half-hour alignment")
    provenance = {
        "provider": "Elexon Insights Solution",
        "datasets": ["WINDFOR", "FUELHH (WIND only)"],
        "retrieved_at": snapshot["retrieved_at"],
        "snapshot_sha256": hashlib.sha256(raw).hexdigest(),
        "forecast_records": len(datasets["WINDFOR"]),
        "actual_records": len(datasets["FUELHH"]),
        "source_urls": [
            "https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream",
            "https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream",
        ],
        "mode": "immutable archived snapshot; not live",
    }
    return indices, provenance
