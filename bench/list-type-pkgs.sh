#!/usr/bin/env bash
# List packages that define a build:types script
cd "$(dirname "$0")/.."
node -e "
const fs = require('fs'), path = require('path');
const pkgsDir = path.resolve('packages');
const out = [];
for (const name of fs.readdirSync(pkgsDir)) {
  const pj = path.join(pkgsDir, name, 'package.json');
  if (!fs.existsSync(pj)) continue;
  const j = JSON.parse(fs.readFileSync(pj, 'utf8'));
  if (j.scripts && j.scripts['build:types']) out.push(path.join('packages', name));
}
console.log(out.join('\n'));
"
