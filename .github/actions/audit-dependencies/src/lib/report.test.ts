import { describe, expect, it } from 'vitest'

import type { AllowlistEntry } from './allowlist'
import type { AdvisoryHit, DirectDependency, PnpmAdvisory } from '../types'

import { findStaleAllowlist, toFindings } from './report'

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

const hit = (
  overrides: Partial<PnpmAdvisory>,
  originPackages: string[] = [],
  paths: string[] = [],
  directDeps: DirectDependency[] = [],
): AdvisoryHit => ({
  advisory: advisory(overrides),
  chainPackages: [],
  directDeps,
  originPackages,
  paths,
})

describe('toFindings', () => {
  it('drops unfixable advisories', () => {
    const findings = toFindings({
      hits: [hit({ github_advisory_id: 'GHSA-0000-0000-0001', patched_versions: '<0.0.0' })],
      ignoreGhsas: [],
      threshold: 'high',
    })

    expect(findings).toHaveLength(0)
  })

  it('drops advisories below the severity threshold', () => {
    const findings = toFindings({
      hits: [hit({ github_advisory_id: 'GHSA-0000-0000-0002', severity: 'moderate' })],
      ignoreGhsas: [],
      threshold: 'high',
    })

    expect(findings).toHaveLength(0)
  })

  it('drops allowlisted advisories defensively', () => {
    const findings = toFindings({
      hits: [hit({ github_advisory_id: 'GHSA-1111-1111-1111' })],
      ignoreGhsas: ['GHSA-1111-1111-1111'],
      threshold: 'high',
    })

    expect(findings).toHaveLength(0)
  })

  it('sorts by severity desc then package name and carries origin packages', () => {
    const findings = toFindings({
      hits: [
        hit({ github_advisory_id: 'GHSA-0000-0000-0010', module_name: 'zeta', severity: 'high' }, [
          'ui',
        ]),
        hit(
          { github_advisory_id: 'GHSA-0000-0000-0011', module_name: 'alpha', severity: 'critical' },
          ['payload'],
        ),
        hit({ github_advisory_id: 'GHSA-0000-0000-0012', module_name: 'beta', severity: 'high' }, [
          'next',
        ]),
      ],
      ignoreGhsas: [],
      threshold: 'high',
    })

    expect(findings.map((finding) => finding.package)).toEqual(['alpha', 'beta', 'zeta'])
    expect(findings[0].originPackages).toEqual(['payload'])
  })

  it('carries dependency paths and direct-dep remediation through to findings', () => {
    const findings = toFindings({
      hits: [
        hit(
          { github_advisory_id: 'GHSA-0000-0000-0020' },
          ['ui'],
          ['ui > @monaco-editor/react > monaco-editor'],
          [{ dependency: '@monaco-editor/react', workspacePackage: 'ui' }],
        ),
      ],
      ignoreGhsas: [],
      threshold: 'high',
    })

    expect(findings[0].paths).toEqual(['ui > @monaco-editor/react > monaco-editor'])
    expect(findings[0].directDeps).toEqual([
      { dependency: '@monaco-editor/react', workspacePackage: 'ui' },
    ])
  })
})

describe('findStaleAllowlist', () => {
  const entry = (overrides: Partial<AllowlistEntry>): AllowlistEntry => ({
    advisory: 'GHSA-aaaa-bbbb-cccc',
    appliesTo: 'both',
    expires: '2099-01-01',
    rationale: 'reason',
    ...overrides,
  })

  it('reports in-scope entries with no matching advisory', () => {
    const stale = findStaleAllowlist({
      entries: [entry({ advisory: 'GHSA-9999-9999-9999' })],
      hits: [hit({ github_advisory_id: 'GHSA-aaaa-bbbb-cccc' })],
      scope: 'consumer-facing',
    })

    expect(stale).toEqual(['GHSA-9999-9999-9999'])
  })

  it('ignores entries that still match and entries out of scope', () => {
    const stale = findStaleAllowlist({
      entries: [
        entry({ advisory: 'GHSA-aaaa-bbbb-cccc', appliesTo: 'consumer' }),
        entry({ advisory: 'GHSA-9999-9999-9999', appliesTo: 'monorepo' }),
      ],
      hits: [hit({ github_advisory_id: 'GHSA-aaaa-bbbb-cccc' })],
      scope: 'consumer-facing',
    })

    expect(stale).toEqual([])
  })
})
