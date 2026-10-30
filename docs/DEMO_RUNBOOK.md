# Demo runbook — target 8 minutes 30 seconds

This is a presentation outline, not a claim that recording/upload is complete. Rehearse against the verified current UI. Keep each part under5minutes and total under10minutes.

## Part1 — customer pilot (0:00–4:15)

**0:00–0:40 | Business problem**
Open Decision desk, Jan15, cutoff09:45, actuals hidden. Explain that wind makes next-day buying uncertain. The pilot gives the team an auditable forecast snapshot and a numerical evaluation, not an executable trade.

**0:40–1:40 | What was knowable**
Point out decision date versus delivery day, issue09:30 and cutoff09:45, forecast coverage, generation profile and energy summary. Change the decision date and show January31 maps to February1. Explain why selecting the latest forecast today would leak future information.

**1:40–2:30 | Honest hindsight**
Toggle retrospective actuals. Read the hindsight label. Explain hourly forecast comparison against the average of two observed half-hours and why missing halves are excluded. Expand the audit table to show publication times.

**2:30–3:35 | Quantitative findings**
Open Forecast accuracy, full January,09:45. Verified results: MAE about2,013MW; RMSE2,506MW; positive bias1,730MW; all744hours paired. Explain each in plain language and show daily variation. Positive bias means wind came in below forecast on average in this comparison, not a known financial loss. Source population/curtailment/alignment may contribute; don't attribute causality.

**3:35–4:15 | Value and boundaries**
Export a CSV and show auditability. Explain national wind isn't the client's owned allocation; demand and prices are intentionally absent. Full-month errors are hindsight, not a calibrated reserve. Next pilot step would require portfolio inputs and walk-forward validation, not more decorative features.

## Part2 — technical review (4:15–8:30)

**4:15–5:10 | Architecture**
Show directory tree: React+TypeScript; FastAPI; immutable gzip snapshot; same-origin static/API deployment. No database, authentication or secrets needed for this bounded historical pilot. Docker multi-stage build and non-root process; mention actual Docker validation status honestly.

**5:10–6:10 | Ingestion and reproducibility**
Show scripts/fetch_data.py, data/README.md and `/api/metadata`. Point out official-only sources, historical forecast vintages, bounded retries, schema/coverage validation, response hashes, atomic replacement, and explicit refresh rather than slow live data calls on every request.

**6:10–7:10 | Selection and maths**
Show backend/analysis.py: timezone-aware cutoff; latest eligible publication; complete actual pairs; matched-hour metric denominators. Explain the signed error convention and why no full-month fitted bias correction/risk band is advertised.

**7:10–8:00 | Practices**
Run final backend tests, frontend tests and build (or show authentic captured output). Highlight cutoff boundary, missing-data, duplicate/conflict, date-boundary and request-race tests. Explain errors/loading/empty states and exports. Show meaningful commit history and actual deployment verification if available.

**8:00–8:30 | Handoff**
Show README startup, deployment URL only if real, AI disclosure and limitations. State AI assisted research, implementation and tests; do not imply unaided authorship. Close with the traceable decision-support outcome.
