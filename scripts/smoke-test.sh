#!/usr/bin/env bash
# Smoke test for the containerised stack (docker compose up or kubectl port-forward).
# Usage: scripts/smoke-test.sh [FRONTEND_URL] [API_URL]
set -euo pipefail

FRONTEND_URL="${1:-http://localhost:3000}"
API_URL="${2:-http://localhost:5284}"

wait_for() {
  local url="$1"
  for _ in $(seq 1 60); do
    if curl -fs -o /dev/null "$url"; then
      return 0
    fi
    sleep 2
  done
  echo "Timed out waiting for $url" >&2
  return 1
}

echo "Waiting for API health at $API_URL/health"
wait_for "$API_URL/health"

echo "Waiting for frontend at $FRONTEND_URL/claims/new"
wait_for "$FRONTEND_URL/claims/new"

payload='{
  "policyNumber": "POL-2024-001234",
  "claimDate": "2024-12-01T00:00:00",
  "claimType": "Colision",
  "vehiclePlate": "1234 ABC",
  "insuredName": "Juan Garcia Lopez",
  "phone": "612345678",
  "address": "Calle Mayor 10, 2A",
  "postalCode": "28001",
  "description": "Smoke test"
}'

echo "POST $FRONTEND_URL/api/claims (frontend proxy -> API)"
status=$(curl -sS -o /tmp/smoke-response.json -w '%{http_code}' \
  -X POST "$FRONTEND_URL/api/claims" -H 'Content-Type: application/json' -d "$payload")
cat /tmp/smoke-response.json; echo
if [ "$status" != "201" ]; then
  echo "Expected 201, got $status" >&2
  exit 1
fi

echo "POST invalid claim expects 400"
status=$(curl -sS -o /dev/null -w '%{http_code}' \
  -X POST "$FRONTEND_URL/api/claims" -H 'Content-Type: application/json' -d '{}')
if [ "$status" != "400" ]; then
  echo "Expected 400, got $status" >&2
  exit 1
fi

echo "Smoke test passed"
