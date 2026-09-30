#!/usr/bin/env bash
# Shared helpers for the deploy scripts. Expects the current directory to be apps/cms.

# Reads KEY from .env without executing it (values such as connection strings may contain `&`).
env_value() {
  local key="$1"
  grep -E "^${key}=" .env | tail -n 1 | cut -d= -f2- | sed -e 's/^["'\'']//' -e 's/["'\'']$//'
}

require_env_file() {
  if [[ ! -f .env ]]; then
    echo "Missing $(pwd)/.env - run: cp .env.example .env  and fill in the values." >&2
    exit 1
  fi
}

validate_env() {
  local database_url payload_secret server_url
  database_url="$(env_value DATABASE_URL)"
  payload_secret="$(env_value PAYLOAD_SECRET)"
  server_url="$(env_value SERVER_URL)"

  local has_error=false

  if [[ ! "$database_url" =~ ^mongodb(\+srv)?:// ]] || [[ "$database_url" == *CHANGE_ME* ]]; then
    echo "DATABASE_URL must be set to your MongoDB connection string." >&2
    has_error=true
  fi

  if [[ ${#payload_secret} -lt 32 ]] || [[ "$payload_secret" == *CHANGE_ME* ]]; then
    echo "PAYLOAD_SECRET must be at least 32 characters. Generate one with: openssl rand -hex 32" >&2
    has_error=true
  fi

  if [[ ! "$server_url" =~ ^https?://[^/]+$ ]] || [[ "$server_url" == *CHANGE_ME* ]]; then
    echo "SERVER_URL must be the public origin without a trailing slash, e.g. https://cms.example.com" >&2
    has_error=true
  fi

  if [[ "$has_error" == true ]]; then
    exit 1
  fi
}
