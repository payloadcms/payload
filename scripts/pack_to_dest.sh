#!/usr/bin/env bash

set -ex

# Build and pack package as tgz and move to destination

package_name=$1
package_dir="packages/$package_name"
dest=$2

if [ -z "$package_name" ]; then
  echo "Please specify a package to publish"
  exit 1
fi

# Check if packages/$package_name exists

if [ ! -d "$package_dir" ]; then
  echo "Package $package_name does not exist"
  exit 1
fi

# Check if destination directory exists
if [ ! -d "$dest" ]; then
  echo "Destination directory $dest does not exist"
  exit 1
fi

pnpm --filter "$package_name" run clean
pnpm --filter "$package_name" run build
pnpm -C "$package_dir" pack --pack-destination "$dest"
