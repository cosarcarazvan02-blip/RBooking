#!/usr/bin/env bash

# Oprește toate serviciile de fundal la ieșire (Ctrl+C)
trap 'kill $(jobs -p) 2>/dev/null' EXIT

echo "Starting Backend API A (http://localhost:5293)..."
dotnet run --project backend/RBooking.API &

echo "Starting Backend API B - reviews (http://localhost:5294)..."
dotnet run --project backend/RBooking.ApiB &

echo "Starting Backend API B - webhooks (http://localhost:5310)..."
dotnet run --project backend/RBooking.WebhookAPI &

echo "Starting Frontend (http://localhost:3000)..."
npm --prefix frontend run dev &

wait
