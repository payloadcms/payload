#!/usr/bin/env bash

# List all published packages

# parse params: tag=beta or blank string ''
tag=${1:-}

echo

if [ -n "$tag" ]; then
  echo "Listing packages with tag: $tag"
  tag="@$tag"
else
  echo "Listing latest packages"
  tag=""
fi
echo

packages=$(find packages -name package.json -type f -exec grep -L '"private": true' {} \; | xargs jq -r '.name')

# sort alphabetically
packages=$(echo "$packages" | tr ' ' '\n' | sort -u | tr '\n' ' ')

# Loop through each package and print the name and version. Print as table

for package in $packages; do
  version=$(npm view "$package""$tag" version 2> /dev/null || echo "N/A")
  printf "%-30s %s\n" "$package" "$version"
done
