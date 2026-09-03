#!/usr/bin/env node
// Scans test/**/e2e.spec.ts files for tests tagged `@visual` — either a literal `{ tag: '@visual' }`
// or the `visual()` helper (test/__helpers/e2e/visual.ts), which applies that tag without the
// string appearing in the spec file — and lists the suites that contain at least one, as a
// runE2E.ts-compatible suite name: `_community` for a spec file directly under `test/_community/`,
// or `admin__e2e__visual` (joining every directory between `testDir` and the spec file with `__`)
// for one nested deeper, e.g. `test/admin/e2e/visual/e2e.spec.ts` — runE2E.ts only resolves a bare
// suite name via `test/<suite>/*e2e.spec.ts` (direct children), so a nested spec needs that
// `__`-joined form to be runnable at all. The `visual-regression` CI job and `pnpm test:visual`
// both loop over this list instead of hardcoding a single suite, so a new `@visual` test added to
// any suite is picked up automatically rather than silently never running.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

export function findSpecFiles(dir) {
  const results = []

  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules') {
      continue
    }

    const fullPath = path.join(dir, entry)
    const entryStat = statSync(fullPath)

    if (entryStat.isDirectory()) {
      results.push(...findSpecFiles(fullPath))
    } else if (entry === 'e2e.spec.ts') {
      results.push(fullPath)
    }
  }

  return results
}

export function findVisualSuites(testDir) {
  const suites = new Set()

  for (const specFile of findSpecFiles(testDir)) {
    const contents = readFileSync(specFile, 'utf8')
    const usesVisualHelper = contents.includes('__helpers/e2e/visual.js')
    if (!contents.includes('@visual') && !usesVisualHelper) {
      continue
    }

    const relativePath = path.relative(testDir, specFile)
    const suiteDirs = relativePath.split(path.sep).slice(0, -1)
    suites.add(suiteDirs.join('__'))
  }

  return [...suites].sort()
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`

if (isMain) {
  const testDir = path.resolve(process.argv[2] ?? 'test')
  console.log(findVisualSuites(testDir).join('\n'))
}
