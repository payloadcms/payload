import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { findSpecFiles, findVisualSuites } from './find-visual-suites.mjs'

describe('findSpecFiles', () => {
  let testDir

  beforeEach(() => {
    testDir = mkdtempSync(path.join(tmpdir(), 'visual-suites-'))
  })

  afterEach(() => {
    rmSync(testDir, { force: true, recursive: true })
  })

  it('finds e2e.spec.ts files nested in subdirectories', () => {
    const suiteDir = path.join(testDir, '_community')
    mkdirSync(suiteDir, { recursive: true })
    writeFileSync(path.join(suiteDir, 'e2e.spec.ts'), '')
    writeFileSync(path.join(suiteDir, 'int.spec.ts'), '')

    expect(findSpecFiles(testDir)).toEqual([path.join(suiteDir, 'e2e.spec.ts')])
  })

  it('ignores node_modules directories', () => {
    const nodeModulesDir = path.join(testDir, 'node_modules', 'some-package')
    mkdirSync(nodeModulesDir, { recursive: true })
    writeFileSync(path.join(nodeModulesDir, 'e2e.spec.ts'), '')

    expect(findSpecFiles(testDir)).toEqual([])
  })
})

describe('findVisualSuites', () => {
  let testDir

  beforeEach(() => {
    testDir = mkdtempSync(path.join(tmpdir(), 'visual-suites-'))
  })

  afterEach(() => {
    rmSync(testDir, { force: true, recursive: true })
  })

  it('returns the suite folder for a spec file containing an @visual tag', () => {
    const suiteDir = path.join(testDir, '_community')
    mkdirSync(suiteDir, { recursive: true })
    writeFileSync(
      path.join(suiteDir, 'e2e.spec.ts'),
      `test('renders', { tag: '@visual' }, async () => {})`,
    )

    expect(findVisualSuites(testDir)).toEqual(['_community'])
  })

  it('excludes suites whose spec files have no @visual tag', () => {
    const suiteDir = path.join(testDir, 'fields')
    mkdirSync(suiteDir, { recursive: true })
    writeFileSync(path.join(suiteDir, 'e2e.spec.ts'), `test('renders', async () => {})`)

    expect(findVisualSuites(testDir)).toEqual([])
  })

  it('deduplicates and sorts suites with multiple @visual spec files', () => {
    const suiteA = path.join(testDir, 'fields')
    const suiteB = path.join(testDir, '_community')
    mkdirSync(suiteA, { recursive: true })
    mkdirSync(suiteB, { recursive: true })
    writeFileSync(path.join(suiteA, 'e2e.spec.ts'), `{ tag: '@visual' }`)
    writeFileSync(path.join(suiteB, 'e2e.spec.ts'), `{ tag: '@visual' }`)

    expect(findVisualSuites(testDir)).toEqual(['_community', 'fields'])
  })

  // runE2E.ts only resolves a suite's own spec files via `test/<suite>/*e2e.spec.ts` (direct
  // children) — it has no way to run a spec nested deeper, e.g.
  // `test/admin/e2e/visual/e2e.spec.ts`, from a bare `admin` suite name. It does support a
  // `__`-delimited path for exactly this case (`admin__e2e__visual` resolves to
  // `test/admin/e2e/visual`, while still using `admin` as the suite root for the dev/prod
  // server). `findVisualSuites` must reconstruct that same identifier, or CI ends up trying to
  // run a suite name that `runE2E.ts` can't find.
  it('joins nested suite directories with "__", matching runE2E.ts\'s suite-path convention', () => {
    const suiteDir = path.join(testDir, 'admin', 'e2e', 'visual')
    mkdirSync(suiteDir, { recursive: true })
    writeFileSync(
      path.join(suiteDir, 'e2e.spec.ts'),
      `test('renders', { tag: '@visual' }, async () => {})`,
    )

    expect(findVisualSuites(testDir)).toEqual(['admin__e2e__visual'])
  })
})
