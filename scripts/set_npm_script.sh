#!/usr/bin/env bash

set -ex

# Add/set an npm script on every package in packages directory

# Get all package.json files in packages directory, except eslint-* packages
package_json_files=$(find packages -name "package.json" \
  -not -path "packages/eslint-*")

npm_script_name="lint"
npm_script_command="eslint ."

# Loop through each package.json file
for package_json_file in $package_json_files; do
  # use jq to set a value inside of the package.json "scripts" object
  jq ".scripts[\"$npm_script_name\"] = \"$npm_script_command\"" "$package_json_file" \
    > tmp.json && mv tmp.json "$package_json_file"
done
