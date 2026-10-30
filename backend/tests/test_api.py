from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_valid_snapshot():
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    d = response.json()
    assert len(d["series"]) == 24
    assert d["cutoff"] == "09:45"
    assert d["provenance"]["forecast_records"] > 1000
    for r in d["series"]:
        if r["publish_time"]:
            assert r["publish_time"] <= d["cutoff_timestamp"]


def test_full_month():
    d = client.get("/api/analysis").json()
    assert len(d["daily"]) == 31
    assert d["metrics"]["expected_count"] == 744
    assert d["daily"][-1]["delivery_date"] == "2026-02-01"


def test_invalid_queries():
    for url in [
        "/api/dashboard?decision_date=2026-02-01",
        "/api/dashboard?cutoff=24:00",
        "/api/dashboard?decision_date=nope",
        "/api/analysis?start=2026-01-20&end=2026-01-10",
    ]:
        assert client.get(url).status_code == 422
