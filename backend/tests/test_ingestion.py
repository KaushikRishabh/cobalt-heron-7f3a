import copy
import gzip
import json
from pathlib import Path

import pytest

from scripts.fetch_data import validate_snapshot


@pytest.fixture(scope="module")
def datasets():
    path = Path(__file__).resolve().parents[2] / "data" / "january_2026.json.gz"
    with gzip.open(path) as file:
        return json.load(file)["datasets"]


def test_snapshot_valid(datasets):
    validate_snapshot(datasets)


@pytest.mark.parametrize(
    "mutation", ["empty", "missing_actual", "other_fuel", "bad_generation", "bad_time"]
)
def test_snapshot_validation_fails_closed(datasets, mutation):
    data = copy.deepcopy(datasets)
    if mutation == "empty":
        data["WINDFOR"] = []
    elif mutation == "missing_actual":
        data["FUELHH"].pop()
    elif mutation == "other_fuel":
        data["FUELHH"][0]["fuelType"] = "GAS"
    elif mutation == "bad_generation":
        data["WINDFOR"][0]["generation"] = float("nan")
    elif mutation == "bad_time":
        data["WINDFOR"][0]["publishTime"] = "2026-01-01T00:00:00"
    with pytest.raises(ValueError):
        validate_snapshot(data)
