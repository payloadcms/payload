#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: convert-demo.sh INPUT.webm [OUTPUT.mp4] [options]

Options:
  --trim-start SECONDS  Trim initial loading frames (default: 0.75)
  --crf NUMBER          H.264 quality, lower is higher quality (default: 23)
  --max-kb NUMBER       Fail when output exceeds this upload budget (default: 10240)
  --help                Show this help
EOF
}

if [ "${1:-}" = "--help" ]; then
  usage
  exit 0
fi

INPUT="${1:-}"
if [ -z "$INPUT" ]; then
  usage >&2
  exit 1
fi
shift

OUTPUT="${INPUT%.*}.mp4"
if [ "$#" -gt 0 ] && [[ "$1" != --* ]]; then
  OUTPUT="$1"
  shift
fi

TRIM_START="0.75"
CRF="23"
MAX_KB="10240"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --trim-start)
      TRIM_START="${2:-}"
      shift 2
      ;;
    --crf)
      CRF="${2:-}"
      shift 2
      ;;
    --max-kb)
      MAX_KB="${2:-}"
      shift 2
      ;;
    --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

if [ ! -f "$INPUT" ]; then
  echo "Input recording does not exist: $INPUT" >&2
  exit 1
fi
if ! [[ "$TRIM_START" =~ ^[0-9]+([.][0-9]+)?$ ]]; then
  echo "--trim-start must be a non-negative number" >&2
  exit 1
fi
if ! [[ "$CRF" =~ ^[0-9]+$ ]] || [ "$CRF" -gt 51 ]; then
  echo "--crf must be an integer from 0 to 51" >&2
  exit 1
fi
if ! [[ "$MAX_KB" =~ ^[1-9][0-9]*$ ]]; then
  echo "--max-kb must be a positive integer" >&2
  exit 1
fi

for command_name in ffmpeg ffprobe; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "$command_name is required to prepare GitHub-compatible video" >&2
    exit 1
  fi
done

mkdir -p "$(dirname "$OUTPUT")"

ffmpeg -y \
  -ss "$TRIM_START" \
  -i "$INPUT" \
  -an \
  -c:v libx264 \
  -preset medium \
  -crf "$CRF" \
  -pix_fmt yuv420p \
  -movflags +faststart \
  "$OUTPUT"

CODEC="$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of default=noprint_wrappers=1:nokey=1 "$OUTPUT")"
if [ "$CODEC" != "h264" ]; then
  echo "Expected H.264 output, found: $CODEC" >&2
  exit 1
fi

FILE_BYTES="$(wc -c < "$OUTPUT" | tr -d ' ')"
MAX_BYTES=$((MAX_KB * 1024))
if [ "$FILE_BYTES" -gt "$MAX_BYTES" ]; then
  echo "Converted video exceeds the ${MAX_KB} KB upload budget. Shorten the demo or rerun with a higher --crf value." >&2
  exit 1
fi

OUTPUT_DIRECTORY="$(cd "$(dirname "$OUTPUT")" && pwd -P)"
echo "${OUTPUT_DIRECTORY}/$(basename "$OUTPUT")"
