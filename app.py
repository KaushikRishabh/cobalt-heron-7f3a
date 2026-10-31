"""Single-origin deployment entrypoint: Python API plus compiled React UI."""

from pathlib import Path

from fastapi.staticfiles import StaticFiles

from backend.main import app

frontend = Path(__file__).parent / "frontend" / "dist"
if frontend.is_dir():
    # API routes were registered before this fallback static mount.
    app.mount("/", StaticFiles(directory=frontend, html=True), name="frontend")
