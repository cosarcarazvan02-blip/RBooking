#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Start backend and frontend in parallel and stop both on first exit.
cd "$root_dir"

echo "Starting backend (backend/RBooking.API)..."
cd backend/RBooking.API
if ! command -v dotnet >/dev/null 2>&1; then
  echo "Error: dotnet is not installed or not available on PATH." >&2
  exit 1
fi

dotnet run &
backend_pid=$!

echo "Starting frontend (frontend)..."
cd "$root_dir/frontend"
if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is not installed or not available on PATH." >&2
  kill "$backend_pid" 2>/dev/null || true
  exit 1
fi

npm run dev &
frontend_pid=$!

cleanup() {
  echo "Shutting down..."
  kill "$backend_pid" "$frontend_pid" 2>/dev/null || true
  wait "$backend_pid" 2>/dev/null || true
  wait "$frontend_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

wait -n "$backend_pid" "$frontend_pid"
status=$?

echo "One process exited with status $status. Stopping the other process..."
cleanup
exit "$status"
