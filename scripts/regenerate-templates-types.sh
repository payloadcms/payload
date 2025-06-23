#!/bin/bash

# Path to the templates directory
TEMPLATES_DIR="./templates"

# Directories to exclude
EXCLUDE_DIRS=("_data" "_template") # Add names of directories to exclude

# Function to process a template directory asynchronously
process_template() {
  TEMPLATE_DIR="$1"
  DIR_NAME=$(basename "$TEMPLATE_DIR")

  echo "Processing $TEMPLATE_DIR"

  # Navigate into the template directory
  cd "$TEMPLATE_DIR"

   # Check if pnpm-lock.yaml exists initially
  if [[ -f "pnpm-lock.yaml" ]]; then
    LOCK_FILE_EXISTED=true
  else
    LOCK_FILE_EXISTED=false
  fi

  # Run the commands
  rm -rf node_modules pnpm-lock.yaml
  pnpm i --ignore-workspace
  BLOB_READ_WRITE_TOKEN=vercel_blob_rw_abc123_xyz789 pnpm payload generate:types

  # Reset any changes to pnpm-lock.yaml in git
  if git diff --quiet pnpm-lock.yaml; then
    echo "No changes to pnpm-lock.yaml"
  else
    echo "Resetting changes to pnpm-lock.yaml"
    git checkout -- pnpm-lock.yaml
  fi

   # Remove pnpm-lock.yaml if it didn’t exist initially
  if [[ "$LOCK_FILE_EXISTED" == false ]]; then
    echo "Removing pnpm-lock.yaml as it didn't exist before."
    rm -f pnpm-lock.yaml
  fi

  # Navigate back to the original directory
  cd - > /dev/null
}

# Loop through each directory in the templates folder
for TEMPLATE_DIR in "$TEMPLATES_DIR"/*; do
  if [ -d "$TEMPLATE_DIR" ]; then
    DIR_NAME=$(basename "$TEMPLATE_DIR")

    # Check if the directory is in the exclusion list
    if [[ " ${EXCLUDE_DIRS[@]} " =~ " $DIR_NAME " ]]; then
      echo "Skipping $TEMPLATE_DIR"
      continue
    fi

    # Process the template directory asynchronously
    process_template "$TEMPLATE_DIR" &
  fi
done

# Wait for all background jobs to finish
wait
echo "All templates processed."
