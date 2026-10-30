# Requirement traceability

Source: REint Full Stack SWE challenge v4 Shared.docx, 3 pages, read 2026-10-30 in its shared Word viewer.

- UK utility day-ahead purchasing team: inspect the latest wind forecast available at decision time and quantitatively assess forecast accuracy.
- Only Elexon national FUELHH (fuelType WIND) actuals and WINDFOR forecasts; purchase decisions during January 2026.
- React frontend, Python backend, Docker. Deploy sample on Vercel or Heroku.
- Maximum 16 hours; no submission deadline, earlier preferred.
- Unlisted YouTube video, at most 10 minutes: customer pitch and technical review (architecture/design/analysis/code/practices), initial overview for each at most 5 minutes. Video is mandatory and evaluated first.
- Public GitHub repository with anonymous/random name. README: directory details, startup, deployed app URL, explicit AI disclosure.
- Submit links through the supplied Microsoft Form only after checking each link in incognito mode.

## Explicit interpretation
January means **decision dates**, not delivery dates. D+1 deliveries therefore span 2 January through 1 February 2026, inclusive. A calendar-day delivery window is used; it is not a complete exchange order calendar. No cutoff hour or metric was prescribed. Default 09:45 UK time is an illustrative pre-auction snapshot (5 minutes before N2EX's documented 09:50 GMT gate), not a claim that all GB markets share a gate. The cutoff is configurable.

## Scope limits
National wind is not the client's contracted wind allocation. No demand, prices, portfolio, thermal procurement, or fabricated external data is introduced. This is forecast decision support, not an executable trading or purchase recommendation.

## Release gate
Local build/demo preparation is authorized. Public repository, deployment, YouTube upload, and form submission remain pending separate approval. No URLs or completion claims are fabricated.
