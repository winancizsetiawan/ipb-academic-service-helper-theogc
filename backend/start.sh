#!/bin/bash
set -e

echo "[START] Running Alembic database migrations..."
alembic upgrade head
echo "[START] Migrations complete. Starting server..."

exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" --workers "${WORKERS:-1}"
