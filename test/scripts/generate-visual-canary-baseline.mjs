#!/usr/bin/env node
// Derives the visual-regression canary's intentionally-wrong baseline from a real screenshot of
// the dashboard status badge, by swapping its red and green channels (green "Operational" pill ->
// magenta). This keeps the canary's mismatch grounded in a real render — correct anti-aliasing,
// real font hinting — instead of an unrelated placeholder image, while still being deterministic
// and guaranteed to differ from whatever the badge currently renders.
//
// Run this again (after regenerating `dashboard-status-badge.png` via
// `pnpm test:visual:update`) if the badge's markup, size, or position
// ever changes, so the canary's baseline dimensions stay in sync with the real one.
//
// Usage: node test/scripts/generate-visual-canary-baseline.mjs

import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'path'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(dirname, '../..')

// `test/` is its own pnpm workspace root with its own `node_modules`, which — unlike the repo
// root's — is bind-mounted straight into the visual-regression Docker container (see
// `run-visual-docker.sh`) and so may currently hold Linux-only native bindings for `sharp` from
// the last container run. Resolving against the repo root's `package.json` instead always finds
// the host-native build.
const require = createRequire(path.join(repoRoot, 'package.json'))
const sharp = require('sharp')

const screenshotsDir = path.resolve(dirname, '../admin/e2e/visual/__snapshots__/e2e.spec.ts')
const sourcePath = path.join(screenshotsDir, 'dashboard-status-badge.png')
const canaryPath = path.join(screenshotsDir, 'dashboard-status-badge-canary.png')

const { data, info } = await sharp(sourcePath).raw().toBuffer({ resolveWithObject: true })

for (let pixelStart = 0; pixelStart < data.length; pixelStart += info.channels) {
  const red = data[pixelStart]
  data[pixelStart] = data[pixelStart + 1]
  data[pixelStart + 1] = red
}

await sharp(data, { raw: info }).png().toFile(canaryPath)

console.log(`Wrote ${canaryPath}`)
