#!/bin/bash

set -euo pipefail

PACKAGE_ROOT="/home/site/wwwroot"
PACKAGE_ARCHIVE="${PACKAGE_ROOT}/output.tar.zst"
RUNTIME_ROOT="/tmp/visioncheckout-runtime"

log() {
  echo "[startup] $1"
}

if [[ -f "${PACKAGE_ARCHIVE}" ]]; then
  log "Extracting runtime package from ${PACKAGE_ARCHIVE}"
  rm -rf "${RUNTIME_ROOT}"
  mkdir -p "${RUNTIME_ROOT}"
  zstd -d -c "${PACKAGE_ARCHIVE}" | tar -xf - -C "${RUNTIME_ROOT}"
  ENTRYPOINT_CANDIDATE="$(find "${RUNTIME_ROOT}" -type f -path "*/backend/azure_entrypoint.py" | sort | tail -n 1 || true)"
  if [[ -z "${ENTRYPOINT_CANDIDATE}" ]]; then
    log "Could not find azure_entrypoint.py inside extracted runtime"
    log "Runtime root contents:"
    ls -la "${RUNTIME_ROOT}" || true
    log "Searching for backend directories:"
    find "${RUNTIME_ROOT}" -maxdepth 5 -type d -name "backend" 2>/dev/null || true
    exit 1
  fi
  APP_ROOT="$(dirname "$(dirname "${ENTRYPOINT_CANDIDATE}")")"
elif [[ -f "${PACKAGE_ROOT}/backend/azure_entrypoint.py" ]]; then
  log "Using unpacked runtime from ${PACKAGE_ROOT}"
  APP_ROOT="${PACKAGE_ROOT}"
else
  log "No runnable backend package found"
  ls -la "${PACKAGE_ROOT}" || true
  exit 1
fi

export PYTHONPATH="${APP_ROOT}:${PYTHONPATH:-}"
PYTHON_BIN="${APP_ROOT}/antenv/bin/python"
ENTRYPOINT="${APP_ROOT}/backend/azure_entrypoint.py"

log "APP_ROOT=${APP_ROOT}"
log "PYTHON_BIN=${PYTHON_BIN}"
log "ENTRYPOINT=${ENTRYPOINT}"

if [[ ! -x "${PYTHON_BIN}" ]]; then
  log "Python runtime is not available at ${PYTHON_BIN}"
  exit 1
fi

if [[ ! -f "${ENTRYPOINT}" ]]; then
  log "Entrypoint file is missing at ${ENTRYPOINT}"
  log "Runtime root contents:"
  ls -la "${APP_ROOT}" || true
  log "Searching for azure_entrypoint.py in runtime root:"
  find "${APP_ROOT}" -maxdepth 5 -type f -name "azure_entrypoint.py" 2>/dev/null || true
  exit 1
fi

exec "${PYTHON_BIN}" "${ENTRYPOINT}"
