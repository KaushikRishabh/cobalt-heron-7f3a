# Deployment and release checklist

## Local container

```sh
docker compose up --build
# Open http://localhost:8000
```

One multi-stage image builds React, then serves its static output and the Python API from the same origin. Bundled historical data is read-only. No credentials or database are needed. The process runs as a non-root user; Compose binds localhost only. To stop: `docker compose down`.

**Verification:** Docker is absent from the cloud build machine. The source includes a CI container build and HTTP smoke test, but that workflow has not run remotely until a repository is authorized and published.

## Vercel (prepared, not published)

The supplied `vercel.json` selects FastAPI, builds the React frontend, and includes the bundled data. `app.py` exposes the API and static mount. These follow the [official FastAPI deployment documentation](https://vercel.com/docs/frameworks/backend/fastapi).

After explicit publication approval:
1. Create a **public repository with an anonymous/random name**, as requested by the brief. Review files for private details first; do not upload `.env`, caches or virtual environments.
2. Import that repository into the user's Vercel account, repository root as project root. Confirm an eligible free plan and no billable add-ons. If a paid plan is required, stop for approval.
3. Verify the build and `/api/health`, `/api/dashboard`, `/api/analysis`, and the UI. Check the actual data snapshot checksum in the health response.
4. Test the public app in a signed-out/incognito context, including refreshing the home page and switching decision dates.
5. Put the **verified actual deployed URL** in README. No placeholder link should be submitted.

No cloud deployment has been performed yet. Platform-specific build behavior must be verified during the authorized deployment, not inferred from local tests.

## Submission gate

- [ ] Public anonymous-name GitHub repository, exact tested commit verified remotely.
- [ ] CI passes, including Docker build/run.
- [ ] Vercel/Heroku deployment works without sign-in.
- [ ] README contains real deployment URL and honest AI-use disclosure.
- [ ] Unlisted YouTube demo exists, <=10 minutes, customer and technical parts each <=5 minutes.
- [ ] Video reviewed for readable UI/code, audio, no credentials/private tabs.
- [ ] Each submitted URL verified in incognito/signed-out context.
- [ ] User approval obtained before uploading/publishing/submitting.
- [ ] Submit Microsoft Form; retain verified confirmation.
