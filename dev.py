"""Adapt the preview daemon's Vite-style arguments to our single Python server."""

import argparse

import uvicorn

parser = argparse.ArgumentParser()
parser.add_argument("--host", default="127.0.0.1")
parser.add_argument("--port", type=int, default=8000)
parser.add_argument("--strictPort", action="store_true")
args = parser.parse_args()
# Uvicorn already exits rather than silently moving to another occupied port.
uvicorn.run("app:app", host=args.host, port=args.port)
