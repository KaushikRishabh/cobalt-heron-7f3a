# Mac demo handoff

This repository is portable source, not a cloud virtual environment. Do not copy `node_modules` or `backend/.venv` from Linux to macOS.

## Materialize and run

1. Obtain the source archive through the supported file transfer/Library workflow. Extract into a **new isolated directory** (do not touch other projects).
The handoff ZIP also contains `repository.bundle` with local commit history. To restore the Git repository into a separate directory: `git clone repository.bundle ../wind-demo`. Do not publish the bundle or create a remote until approved.

2. Check installed Python3.12+, Node24, and optionally Docker. Do not change global tooling or install paid services without approval.
3. In the extracted project root:

```sh
python3 -m venv backend/.venv
source backend/.venv/bin/activate
pip install -r backend/requirements-dev.txt
npm --prefix frontend ci
npm --prefix frontend run build
python -m pytest backend/tests -q
npm --prefix frontend test
python -m uvicorn app:app --host 127.0.0.1 --port 8000
```

4. Open http://localhost:8000. Confirm `/api/health` reports the packaged snapshot checksum. The app uses only bundled real records; no credentials are needed.
5. If Docker exists, verify `docker compose up --build`, health, UI and APIs. Record actual result, not “Docker verified” merely because files exist.

## Recording plan (target 8–9 minutes)

The brief requires one unlisted YouTube video <=10min, with a customer part and technical part, each initial overview <=5min. See DEMO_RUNBOOK.md.

- Use a clean browser window with only this app and a code editor; hide private tabs/notifications/account menus.
- Capture at1920×1080 if available, text large enough to read, with clear narration. Avoid recording a loading-only or error view as the product demo.
- Explain the actual dataset results and their limits. Do not claim this predicts a client's procurement volume or saves a specific amount.
- Narration should honestly acknowledge AI assistance and distinguish what was tested from what remains unverified.
- Verify total duration, video/audio quality and all public links before submission.

## Authorization boundary

The requested Mac demo work may proceed under the parent's current authorization after cloud validation. This file does not independently authorize deployment, public GitHub creation/push, YouTube upload, or submission. Parent must resolve those approvals. Any created video is to be preserved at full quality in the user's private Google Drive under their standing rule; use the supported Drive upload workflow and return the verified private link.
