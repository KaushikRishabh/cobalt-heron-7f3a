# Wind Decision Desk

A small decision-support pilot for a GB utility's day-ahead purchasing team. Replay what Elexon's wind forecast said **at the decision cutoff**, then evaluate it against observed wind generation—without using later forecast revisions.

**Deployment URL:** not yet deployed; publication approval pending. This is not a submission-ready release until the deployment, public repository, mandatory video, and signed-out link checks are completed.

## What it does

- Decision dates **1–31 January 2026**; next-day delivery **2 January–1 February**.
- Configurable decision cutoff, default **09:45 Europe/London** (GMT during this window).
- Latest eligible WINDFOR publication for each delivery hour, with issuance and coverage visible.
- Retrospective FUELHH WIND comparison, MAE, RMSE, signed bias, WAPE and energy difference.
- Bundled real Elexon archive for reproducible, fast use without API keys or live network dependency.

This is **not** a procurement optimizer. National wind is not a client's wind allocation; no demand, prices, portfolio or invented financial savings are used.

## Start locally

Prerequisites: Python 3.12 and Node.js 24 (or Docker with Compose).

```sh
python3 -m venv backend/.venv
# macOS/Linux:
source backend/.venv/bin/activate
pip install -r requirements.txt
npm --prefix frontend ci
npm --prefix frontend run build
python -m uvicorn app:app --host 127.0.0.1 --port 8000
```

Open **http://localhost:8000**. API documentation: **http://localhost:8000/docs**. The real historical data is included; no Elexon account is required.

For Docker:

```sh
docker compose up --build
```

Docker has not been executed on the cloud build machine because its Docker executable is absent; see [deployment verification](docs/DEPLOYMENT.md).

## Development and checks

```sh
# With the Python virtual environment activated:
pip install -r backend/requirements-dev.txt
python -m pytest backend/tests -q
npm --prefix frontend test
npm --prefix frontend run build
# Explicit refresh; network required, official Elexon endpoints only:
python scripts/fetch_data.py
```

For frontend hot reload, run the Python API on port 8000 and `npm --prefix frontend run dev` in another terminal. The frontend's development proxy forwards `/api` requests. The single-origin production build needs no CORS exception.

## Structure

| Path | Purpose |
| --- | --- |
| `frontend/` | React + TypeScript dashboard, styles and component/helper tests |
| `backend/analysis.py` | Pure as-of selection, hourly alignment and metrics |
| `backend/store.py` | Validated immutable archive loading and memory cache |
| `backend/main.py` | Typed date inputs, validation, JSON API and metadata |
| `backend/tests/` | Deterministic synthetic edge-case and API tests |
| `data/january_2026.json.gz` | Real Elexon records, retrieval time, source URLs and hashes |
| `scripts/fetch_data.py` | Bounded, retrying, atomic archive rebuild |
| `app.py` | Production entrypoint, API followed by compiled React static files |
| `Dockerfile`, `compose.yaml` | Multi-stage, non-root, read-only local container |
| `vercel.json` | Prepared Vercel deployment configuration |
| `.github/workflows/checks.yml` | Tests, frontend build, Docker build and HTTP smoke checks |
| `docs/` | Methodology, brief traceability, verification, deployment and demo handoff |

## Method and limitations

See [methodology](docs/METHODOLOGY.md). All timestamps are timezone-aware. Forecast selection uses `publishTime <= decision cutoff` separately for each target. Actuals and full-month statistics are hindsight, never information that was available at the selected decision time. In this snapshot forecasts are hourly; actuals are half-hourly. The comparison uses the mean of the two actual half-hours as an explicitly disclosed hourly alignment convention.

No missing actual half-hour is imputed. Error metrics are calculated on complete matched hours only, and coverage is displayed. Positive signed error means wind was overforecast; all else equal that can create a wind shortfall relative to plan, **not** a known monetary loss.

## Data sources

- [Elexon WINDFOR stream documentation](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream)
- [Elexon FUELHH stream documentation](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream)
- [Elexon wind forecast scope and frequency](https://bmrs.elexon.co.uk/wind-generation)

The archive is an immutable historical snapshot, not live market data. Retrieval and checksums are exposed at `/api/metadata`; raw request provenance is retained inside the archive. Elexon supplies the data; no affiliation or endorsement is implied.

## AI use

**This project was developed with OpenAI ChatGPT/Codex assistance**, including domain/API research, implementation, test creation, code review, documentation and demo preparation. Parallel AI agents worked on the backend, frontend and independent methodology review. Results are based on downloaded Elexon records, not AI-generated observations. The owner should review and understand the code before presenting it; this README does not claim unaided authorship. Actual activities and verification limits are recorded in [WORKLOG](docs/WORKLOG.md) and [verification](docs/VERIFICATION.md).
