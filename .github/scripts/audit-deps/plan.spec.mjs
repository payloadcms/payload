import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { buildPlan, bumpsOfPr, findPr, readPlan } from './plan.mjs'

function fixEntry({ dependency, currentSpec, version, workspacePackages }) {
  const toMajor = Number.parseInt(version, 10)
  const fromMajor = Number.parseInt(currentSpec.replace(/^\D+/, ''), 10)

  return {
    currentSpec,
    dependency,
    fix: { crossesMajor: toMajor > fromMajor, fromMajor, status: 'fix', toMajor, version },
    workspacePackages,
  }
}

function finding({ advisory, bumps, originPackages }) {
  return { advisory, bumps, chainPackages: [], originPackages, package: 'x', severity: 'high' }
}

const report = {
  findings: [
    finding({
      advisory: 'GHSA-a',
      bumps: [
        fixEntry({
          dependency: 'dep',
          currentSpec: '^1.0.0',
          version: '1.0.5',
          workspacePackages: ['plugin-b', 'plugin-a'],
        }),
      ],
      originPackages: ['plugin-b', 'plugin-a'],
    }),
    finding({
      advisory: 'GHSA-b',
      bumps: [
        fixEntry({
          dependency: 'dep',
          currentSpec: '^1.0.0',
          version: '1.0.9',
          workspacePackages: ['plugin-a', 'storage-s3'],
        }),
      ],
      originPackages: ['plugin-a', 'storage-s3'],
    }),
    finding({
      advisory: 'GHSA-c',
      bumps: [
        fixEntry({
          dependency: 'other',
          currentSpec: '^2.0.0',
          version: '3.0.0',
          workspacePackages: ['ui'],
        }),
      ],
      originPackages: ['ui'],
    }),
    finding({ advisory: 'GHSA-d', bumps: [], originPackages: ['next'] }),
  ],
  plan: { actions: [] },
}

describe('buildPlan', () => {
  it('should give each bump the sorted origin folders of every advisory it targets', () => {
    const plan = buildPlan({ ref: 'main', report, scope: 'consumer-facing' })

    expect(plan.originDirs).toEqual({
      'dep-1': ['plugin-a', 'plugin-b', 'storage-s3'],
      'other-3': ['ui'],
    })
  })

  it('should give a bump only the origin folders that declare its dependency', () => {
    const shared = finding({
      advisory: 'GHSA-e',
      bumps: [
        fixEntry({
          dependency: 'left',
          currentSpec: '^1.0.0',
          version: '1.0.1',
          workspacePackages: ['plugin-a'],
        }),
        fixEntry({
          dependency: 'right',
          currentSpec: '^1.0.0',
          version: '1.0.1',
          workspacePackages: ['plugin-b'],
        }),
      ],
      originPackages: ['plugin-a', 'plugin-b'],
    })

    const plan = buildPlan({
      ref: 'main',
      report: { findings: [shared], plan: { actions: [] } },
      scope: 'consumer-facing',
    })

    expect(plan.originDirs).toEqual({ 'left-1': ['plugin-a'], 'right-1': ['plugin-b'] })
  })

  it('should give no origin folders for a monorepo finding, which has no origin packages', () => {
    const monorepo = finding({
      advisory: 'GHSA-f',
      bumps: [
        fixEntry({
          dependency: 'left',
          currentSpec: '^1.0.0',
          version: '1.0.1',
          workspacePackages: ['packages/plugin-a'],
        }),
      ],
      originPackages: [],
    })

    const plan = buildPlan({
      ref: 'main',
      report: { findings: [monorepo], plan: { actions: [] } },
      scope: 'monorepo',
    })

    expect(plan.originDirs).toEqual({ 'left-1': [] })
  })

  it('should plan PRs for the bumps and list the findings with no fix', () => {
    const plan = buildPlan({ ref: 'main', report, scope: 'consumer-facing' })

    expect(plan.prs.map((pr) => [pr.id, pr.bumpIds])).toEqual([
      ['non-major', ['dep-1']],
      ['other-3', ['other-3']],
    ])
    expect(plan.noFix.map((item) => item.advisory)).toEqual(['GHSA-d'])
  })
})

describe('readPlan', () => {
  const dirs = []

  afterEach(async () => {
    await Promise.all(dirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true })))
  })

  async function writePlanFile({ content }) {
    const dir = await mkdtemp(path.join(tmpdir(), 'audit-deps-plan-'))
    dirs.push(dir)
    const file = path.join(dir, 'plan.json')
    await writeFile(file, content)
    return file
  }

  it('should read back a built plan', async () => {
    const plan = buildPlan({ ref: 'main', report, scope: 'consumer-facing' })
    const file = await writePlanFile({ content: JSON.stringify(plan) })

    expect(await readPlan({ path: file })).toEqual(plan)
  })

  const valid = buildPlan({ ref: 'main', report, scope: 'consumer-facing' })

  it.each([
    ['invalid JSON', '{not json'],
    ['missing prs', JSON.stringify({ ...valid, prs: undefined })],
    ['missing originDirs', JSON.stringify({ ...valid, originDirs: undefined })],
    ['a PR with no bumps', JSON.stringify({ ...valid, prs: [{ ...valid.prs[0], bumpIds: [] }] })],
    [
      'a PR with an unknown bump',
      JSON.stringify({ ...valid, prs: [{ ...valid.prs[0], bumpIds: ['dep-1', 'gone-2'] }] }),
    ],
  ])('should fail closed on %s', async (_name, content) => {
    const file = await writePlanFile({ content })

    await expect(readPlan({ path: file })).rejects.toThrow('audit plan missing or invalid')
  })
})

describe('PR lookups', () => {
  const plan = buildPlan({ ref: 'main', report, scope: 'consumer-facing' })

  it('should return the bumps of a PR in its order', () => {
    expect(bumpsOfPr({ plan, pr: findPr({ plan, prId: 'non-major' }) })).toEqual([plan.bumps[0]])
  })

  it('should throw on an unknown PR or bump', () => {
    expect(() => findPr({ plan, prId: 'gone' })).toThrow('unknown PR: gone')
    expect(() => bumpsOfPr({ plan, pr: { bumpIds: ['gone-2'] } })).toThrow('unknown bump: gone-2')
  })
})
