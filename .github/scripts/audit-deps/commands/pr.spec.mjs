import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { buildPr, buildTitle } from './pr.mjs'

const csvBump = { dependency: 'csv-parse', from: '5.6.0', fromVersion: '5.6.0', to: '7.0.2' }

describe('buildTitle', () => {
  it.each([
    ['a major PR on main', 'main', 'major', 'fix(deps): bump csv-parse from 5.6.0 to 7.0.2'],
    [
      'a group PR on 3.x',
      '3.x',
      'group',
      'fix(deps): bump the non-major group with 2 updates (3.x)',
    ],
  ])('should title %s', (_name, ref, kind, title) => {
    expect(buildTitle({ ref, pr: { kind }, prBumps: [csvBump, csvBump] })).toBe(title)
  })
})

describe('buildPr', () => {
  let cwd

  afterEach(async () => {
    vi.unstubAllGlobals()
    await rm(cwd, { force: true, recursive: true })
  })

  it('should load the upstream details of one bump at a time', async () => {
    cwd = await mkdtemp(path.join(tmpdir(), 'build-pr-'))
    await mkdir(path.join(cwd, 'packages'))
    const bumps = ['a', 'b', 'c'].map((dependency) => ({
      id: `${dependency}-1`,
      advisories: [],
      dependency,
      from: '^1.0.0',
      fromVersion: '1.0.0',
      to: '1.0.1',
      isMajor: false,
      manifests: [],
    }))
    const plan = {
      bumps,
      prs: [{ id: 'non-major', kind: 'group', branch: 'b', bumpIds: bumps.map((bump) => bump.id) }],
      noFix: [],
      originDirs: {},
    }
    const inFlight = new Set()
    let mostInFlight = 0
    vi.stubGlobal('fetch', async (url) => {
      const dependency = /registry\.npmjs\.org\/([^/]+)$/.exec(String(url))?.[1]
      if (dependency) {
        inFlight.add(dependency)
        mostInFlight = Math.max(mostInFlight, inFlight.size)
        await new Promise((resolve) => setTimeout(resolve, 1))
        inFlight.delete(dependency)
      }
      return { ok: false, status: 404, json: async () => ({}), text: async () => '' }
    })

    await buildPr({
      cwd,
      plan,
      prId: 'non-major',
      reaudit: { findings: [], plan: { actions: [] } },
      ref: 'main',
      runUrl: 'https://example.com/run',
      scope: 'consumer-facing',
      severity: 'moderate',
    })

    expect(mostInFlight).toBe(1)
  })
})
