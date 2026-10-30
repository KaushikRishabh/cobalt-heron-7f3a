# Reproducible Elexon snapshot

`january_2026.json.gz` contains actual responses from Elexon Insights public APIs, not synthetic demonstration data. Retrieved 2026-10-30 at 03:43:38 UTC. Compressed SHA-256:

`a94e9d5cb05b09d7007959fa851ae0edd5b8e14a12a82c79065d9325e993d41c`

- WINDFOR: 19,272 records, publications queried 2025-12-30 inclusive through 2026-02-01 midnight. Includes prior publications for the earliest January decision cutoff; all forecast target timestamps in this snapshot fall on whole hours.
- FUELHH: 1,488 records, `fuelType=WIND`, delivery settlement dates 2026-01-02–2026-02-01 inclusive. Exactly 48 half-hour actuals each day.
- Every request URL, response row count and SHA-256 of its original response bytes is stored inside the compressed file under `sources` (64 requests). Duplicate identical JSON records across inclusive query boundaries are removed, with distinct publication vintages retained.
- `fetch.log` is the actual ingestion output. Snapshot output uses atomic replacement; interrupted refresh leaves the existing snapshot intact. The application never refreshes from the upstream API on a request, avoiding rate-limit and outage dependency during demonstration.

## Refresh

From repository root: `python scripts/fetch_data.py`. Only Python standard-library networking is required. The request concurrency is two, with three bounded attempts for transient transport/HTTP failures. This replaces the bundled snapshot; restart the app to invalidate its process-local parsed-data cache. Retain/review the resulting source manifest and changed SHA-256 when updating.

## Semantics and limits

Official sources:
- https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream
- https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream
- https://bmrs.elexon.co.uk/wind-generation
- https://developer.data.elexon.co.uk/

The app selects the latest publication at or before the cutoff independently for each next-day target hour. This permits mixed vintages if a newer publication omits a target; it does not silently replace missing forecasts with later information. Publication age is auditable. It treats the hourly WINDFOR value as representative of the hour and compares it with the mean of the two FUELHH half-hours starting at HH:00 and HH:30. **That is a disclosed alignment convention**: the inspected API fields do not prove that the hourly forecast is an integrated hourly average. No interpolation is invented. Missing either actual half-hour removes that hour from paired metrics. Latest published actual revisions are retrospective truth, not information claimed available at purchase time.

A January decision means a next-day delivery: the scope is Jan 2–Feb 1, not Jan 1–31 delivery. January London time is UTC. This scope does not need daylight-saving handling outside January.

At the illustrative 09:45 decision cutoff, the retrieved snapshot yields 744/744 paired hours, MAE 2013.008064516129 MW, RMSE 2505.943149370381 MW, signed bias +1729.9314516129032 MW, WAPE 17.84018924672366%. These are descriptive results on this exact snapshot, not promised future performance. MW error integrated over each one-hour comparison interval gives MWh error. Positive forecast-minus-actual errors mean wind is overforecast. National wind is not a utility-owned portfolio; no demand, price, portfolio or purchase-order data is fabricated.
