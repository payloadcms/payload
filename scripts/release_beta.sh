#!/usr/bin/env bash

set -ex

# Build packages/payload

package_name=$1
package_dir="packages/$package_name"

if [ -z "$package_name" ]; then
  echo "Please specify a package to publish"
  exit 1
fi

# Check if packages/$package_name exists

if [ ! -d "$package_dir" ]; then
  echo "Package $package_name does not exist"
  exit 1
fi

npm --prefix "$package_dir" version pre --preid beta
git add "$package_dir"/package.json
new_version=$(node -p "require('./$package_dir/package.json').version")
git commit -m "chore(release): $package_name@$new_version"
pnpm publish -C "$package_dir" --tag beta --no-git-checks
