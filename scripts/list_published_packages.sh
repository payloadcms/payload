#!/usr/bin/env bash

# List all published packages

packages=$(find packages -name package.json -type f -exec grep -L '"private": true' {} \; | xargs jq -r '.name')

# sort alphabetically
packages=$(echo "$packages" | tr ' ' '\n' | sort -u | tr '\n' ' ')

# Loop through each package and print the name and version. Print as table

printf "%-30s %-20s %-20s\n" "package" "latest" "beta"

for package in $packages; do
  info=$(npm view "$package" dist-tags --json)
  latest=$(echo "$info" | jq -r '.latest')
  beta=$(echo "$info" | jq -r '.beta')
  printf "%-30s %-20s %-20s\n" "$package" "$latest" "$beta"
done
