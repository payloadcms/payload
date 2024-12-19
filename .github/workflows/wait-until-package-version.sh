#!/bin/bash

if [[ "$#" -ne 2 ]]; then
  echo "Usage: $0 <package-name> <version>"
  exit 1
fi

PACKAGE_NAME="$1"
TARGET_VERSION=${2#v} # Git tag has leading 'v', npm version does not
TIMEOUT=300  # 5 minutes in seconds
INTERVAL=10  # 10 seconds
ELAPSED=0

echo "Waiting for version ${TARGET_VERSION} of '${PACKAGE_NAME}' to resolve... (timeout: ${TIMEOUT} seconds)"

while [[ ${ELAPSED} -lt ${TIMEOUT} ]]; do
  latest_version=$(npm show "${PACKAGE_NAME}" version 2>/dev/null)

  if [[ ${latest_version} == "${TARGET_VERSION}" ]]; then
    echo "SUCCCESS: Version ${TARGET_VERSION} of ${PACKAGE_NAME} is available."
    exit 0
  else
    echo "Version ${TARGET_VERSION} of ${PACKAGE_NAME} is not available yet. Retrying in ${INTERVAL} seconds... (elapsed: ${ELAPSED}s)"
  fi

  sleep "${INTERVAL}"
  ELAPSED=$((ELAPSED + INTERVAL))
done

echo "Timed out after ${TIMEOUT} seconds waiting for version ${TARGET_VERSION} of '${PACKAGE_NAME}' to resolve."
exit 1
