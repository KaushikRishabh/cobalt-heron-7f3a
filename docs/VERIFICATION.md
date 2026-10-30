# Verification record

Cloud build, 2026-10-30. Test results are local unless explicitly stated otherwise.

## Data and numerical review

- Real official archive: 19,272 WINDFOR vintage rows; 1,488 FUELHH WIND half-hours.
- Default 09:45 cutoff:744 / 744 matched hours (31 delivery days).
- An independent review reconstructed all comparisons without calling backend analysis functions. MAE 2,013.0080645 MW; RMSE 2,505.9431494 MW; signed bias +1,729.9314516 MW; WAPE 17.84018925%; 627 overforecast hours, 117 underforecast hours.
- All default-selected forecasts were published 09:30 UTC on their decision day. No duplicate forecast target/publication keys or actual target keys.
- Independently re-fetched Jan1 WINDFOR, Jan2 FUELHH and Feb1 FUELHH. All three raw response hashes matched the ingestion provenance.
- Strong positive bias is a result in these records, not proof of a specific weather-model defect. See the alignment and scope caveats in METHODOLOGY.md.

## Backend

- 23 tests pass, including metric arithmetic, cutoff boundary, timezone handling, Jan31=>Feb1, duplicate/conflict handling, missing half-hours, invalid inputs and ingestion validation.
- Ruff code check and formatting pass; dependency consistency check passes.
- Root API integration smoke: health/dashboard/month analysis return 200; out-of-scope February decision date and 24:00 cutoff return 422.
- One upstream Starlette HTTPX test-client deprecation warning. It does not fail tests or affect runtime requests.

## Browser and frontend

- 16 frontend tests pass; TypeScript and production build pass; Prettier check passes.
- Full npm dependency audit reports 0 known vulnerabilities at verification time.
- Cloud Chromium desktop UI verified: loaded real data, decision/accuracy switching, Jan 31 to Feb 1 mapping, cutoff changes, hidden actuals by default and reset after date change, invalid date-range state with export disabled, recovery, and CSV download contents.
- Jan 1 at 00:00 demonstrates a real incomplete forecast: 22/24 hours, last two hours missing, total labelled “Known hours only · incomplete day”, no zero-fill.
- Native date-input event issue found during browser QA and fixed with regression coverage; final browser retest passes.
- Responsive CSS is implemented; no physical mobile-device browser test has been performed.
- Final production UI is served by the Python entrypoint in the managed cloud preview, not by a frontend-only mock.

## Not verified / release blockers

- Docker build/run: not executed, Docker unavailable in cloud workspace. CI smoke workflow is prepared but not run remotely.
- Vercel deployment: not attempted, publication approval pending. Prepared config is not a verified deployment.
- Public repository/CI: no push or remote creation performed.
- Mac demo recording, YouTube upload, incognito public-link verification and Microsoft Form submission: not performed during cloud implementation.
