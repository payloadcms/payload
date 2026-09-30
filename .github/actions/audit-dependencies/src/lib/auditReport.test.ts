import { describe, expect, it } from 'vitest'

import type { PnpmAdvisory } from '../types'

import { formatDependencyPath, mergeHits, toHits } from './auditReport'

const advisory = (overrides: Partial<PnpmAdvisory>): PnpmAdvisory => ({
  findings: [],
  github_advisory_id: 'GHSA-aaaa-bbbb-cccc',
  id: 1,
  module_name: 'pkg',
  patched_versions: '>=1.0.1',
  severity: 'high',
  title: 'title',
  url: 'https://example.test',
  vulnerable_versions: '<1.0.1',
  ...overrides,
})

describe('formatDependencyPath', () => {
  it('decodes the workspace importer path and drops the trailing module', () => {
    expect(formatDependencyPath('templates__website>next-sitemap>minimist')).toBe(
      'templates/website > next-sitemap',
    )
  })

  it('drops the `.` root used by the consumer-facing temp resolve', () => {
    expect(formatDependencyPath('.>drizzle-kit>esbuild')).toBe('drizzle-kit')
  })
})

describe('toHits', () => {
  it('extracts deduped chains and the direct dep to bump from advisory findings', () => {
    const [hit] = toHits({
      originPackage: null,
      report: {
        advisories: {
          '1': advisory({
            findings: [
              {
                paths: [
                  'packages__eslint-config>@typescript-eslint/parser>minimatch>brace-expansion',
                ],
                version: '2.0.0',
              },
              {
                paths: [
                  'packages__eslint-config>@typescript-eslint/parser>minimatch>brace-expansion',
                ],
                version: '2.0.0',
              },
            ],
          }),
        },
      },
    })

    expect(hit.paths).toEqual(['packages/eslint-config > @typescript-eslint/parser > minimatch'])
    expect(hit.directDeps).toEqual([
      { dependency: '@typescript-eslint/parser', workspacePackage: 'packages/eslint-config' },
    ])
    expect(hit.chainPackages).toEqual(['@typescript-eslint/parser', 'brace-expansion', 'minimatch'])
  })

  it('attributes the consumer-facing temp root (`.`) to the origin package', () => {
    const [hit] = toHits({
      originPackage: 'db-postgres',
      report: {
        advisories: {
          '1': advisory({ findings: [{ paths: ['.>drizzle-kit>esbuild'], version: '0.18.20' }] }),
        },
      },
    })

    expect(hit.directDeps).toEqual([{ dependency: 'drizzle-kit', workspacePackage: 'db-postgres' }])
  })
})

describe('mergeHits', () => {
  it('unions origin packages, paths, and direct deps across hits sharing a GHSA', () => {
    const [merged] = mergeHits([
      {
        advisory: advisory({}),
        chainPackages: ['a', 'a-dep'],
        directDeps: [{ dependency: 'a-dep', workspacePackage: 'ui' }],
        originPackages: ['ui'],
        paths: ['ui > a'],
      },
      {
        advisory: advisory({}),
        chainPackages: ['b', 'b-dep'],
        directDeps: [
          { dependency: 'a-dep', workspacePackage: 'ui' },
          { dependency: 'b-dep', workspacePackage: 'payload' },
        ],
        originPackages: ['payload'],
        paths: ['payload > b', 'ui > a'],
      },
    ])

    expect(merged.originPackages).toEqual(['payload', 'ui'])
    expect(merged.paths).toEqual(['payload > b', 'ui > a'])
    expect(merged.chainPackages).toEqual(['a', 'a-dep', 'b', 'b-dep'])
    expect(merged.directDeps).toEqual([
      { dependency: 'a-dep', workspacePackage: 'ui' },
      { dependency: 'b-dep', workspacePackage: 'payload' },
    ])
  })
})
