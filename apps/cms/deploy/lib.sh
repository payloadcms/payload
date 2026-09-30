#!/usr/bin/env bash
# Shared helpers for the deploy scripts. Expects the current directory to be apps/cms.

# Reads KEY from .env without executing it (values such as connection strings may contain `&`).
# A missing key yields an empty string; `|| true` keeps grep's "no match" from aborting callers
# that run with `set -e -o pipefail`.
env_value() {
  local key="$1"
  { grep -E "^${key}=" .env || true; } | tail -n 1 | cut -d= -f2- | sed -e 's/^["'\'']//' -e 's/["'\'']$//'
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

  local s3_bucket s3_region s3_endpoint s3_access_key_id s3_secret_access_key
  s3_bucket="$(env_value S3_BUCKET)"
  s3_region="$(env_value S3_REGION)"
  s3_endpoint="$(env_value S3_ENDPOINT)"
  s3_access_key_id="$(env_value S3_ACCESS_KEY_ID)"
  s3_secret_access_key="$(env_value S3_SECRET_ACCESS_KEY)"

  if [[ -n "$s3_bucket" && -z "$s3_region" && -z "$s3_endpoint" ]]; then
    echo "S3_REGION must be set when S3_BUCKET is set (the bucket's region, e.g. ap-southeast-1)." >&2
    has_error=true
  fi

  if [[ -n "$s3_access_key_id" && -z "$s3_secret_access_key" ]] || [[ -z "$s3_access_key_id" && -n "$s3_secret_access_key" ]]; then
    echo "Set both S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY, or neither (to use the EC2 IAM role)." >&2
    has_error=true
  fi

  if [[ "$has_error" == true ]]; then
    exit 1
  fi
}
