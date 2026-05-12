#!/bin/sh
set -e

python -m backend.app.db.init_db

exec gunicorn \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind "0.0.0.0:${PORT:-8000}" \
  --timeout 120 \
  backend.app.main:app
