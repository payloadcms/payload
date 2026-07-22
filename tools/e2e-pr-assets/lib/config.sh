#!/usr/bin/env bash

e2e_supported_config_keys() {
  cat <<'EOF'
GITHUB_BROWSER_PROFILE
E2E_GITHUB_AUTO_LOGIN
E2E_GITHUB_AUTO_REMOVE_PROFILE
E2E_GITHUB_FORCE_REMOVE_PROFILE
E2E_MEDIA_AUTO_CLEANUP
E2E_VIDEO_TRIM_START_SECONDS
E2E_VIDEO_AUTO_SCENE_TRIM
E2E_VIDEO_SCENE_THRESHOLD
E2E_VIDEO_SCENE_PREROLL_SECONDS
EOF
}

e2e_is_supported_config_key() {
  local candidate="${1:-}"
  local key=""

  while IFS= read -r key; do
    if [[ "$key" == "$candidate" ]]; then
      return 0
    fi
  done < <(e2e_supported_config_keys)

  return 1
}

e2e_config_dir() {
  if [[ -n "${XDG_CONFIG_HOME:-}" ]]; then
    printf '%s/e2e-pr-assets\n' "$XDG_CONFIG_HOME"
    return
  fi

  printf '%s/.config/e2e-pr-assets\n' "$HOME"
}

e2e_config_file() {
  printf '%s/config\n' "$(e2e_config_dir)"
}

e2e_quote_shell_value() {
  local value="${1-}"
  printf "'%s'" "$(printf '%s' "$value" | sed "s/'/'\\\\''/g")"
}

e2e_format_config_value() {
  local value="${1-}"

  if [[ "$value" =~ ^-?[0-9]+([.][0-9]+)?$ ]]; then
    printf '%s' "$value"
    return
  fi

  printf '%s' "$(e2e_quote_shell_value "$value")"
}

e2e_print_config_pairs() {
  local config_file="${1:-$(e2e_config_file)}"
  local keys=()
  local key=""

  if [[ ! -f "$config_file" ]]; then
    return 0
  fi

  while IFS= read -r key; do
    keys+=("$key")
  done < <(e2e_supported_config_keys)

  CONFIG_FILE="$config_file" bash -s "${keys[@]}" <<'EOF'
set -euo pipefail

config_file="$CONFIG_FILE"

# shellcheck source=/dev/null
source "$config_file"

for key in "$@"; do
  if [[ -n "${!key+x}" ]]; then
    printf '%s\t%s\n' "$key" "${!key}"
  fi
done
EOF
}

e2e_load_config() {
  local config_file="${1:-$(e2e_config_file)}"
  local keys=()
  local original_is_set=()
  local original_values=()
  local key=""
  local index=0

  if [[ ! -f "$config_file" ]]; then
    return 0
  fi

  while IFS= read -r key; do
    keys+=("$key")
    if [[ -n "${!key+x}" ]]; then
      original_is_set+=("1")
      original_values+=("${!key}")
    else
      original_is_set+=("0")
      original_values+=("")
    fi
  done < <(e2e_supported_config_keys)

  # shellcheck source=/dev/null
  source "$config_file"

  for key in "${keys[@]}"; do
    if [[ "${original_is_set[$index]}" == "1" ]]; then
      printf -v "$key" '%s' "${original_values[$index]}"
    fi
    index=$((index + 1))
  done
}
