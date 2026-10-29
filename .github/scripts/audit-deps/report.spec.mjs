import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  findUnfixedClaims,
  formatAdvisoryMarker,
  parseAdvisoryMarker,
  readReport,
  selectFixableAdvisories,
  stripMarkers,
} from './report.mjs'

function makeFinding({ advisory, status }) {
  return {
    advisory,
    bumps: [
      {
        currentSpec: '^1.0.0',
        dependency: 'dep',
        fix:
          status === 'fix'
            ? { crossesMajor: false, fromMajor: 1, status, toMajor: 1, version: '1.2.0' }
            : status === 'relock'
              ? { status, version: '1.2.0' }
              : { status },
        workspacePackages: ['ui'],
      },
    ],
    chainPackages: ['dep', 'vuln'],
    fixed_in: '>=1.2.0',
    originPackages: ['ui'],
    package: 'vuln',
    paths: ['ui > dep > vuln'],
    severity: 'high',
    title: 'Vulnerable',
    url: 'https://github.com/advisories/x',
    vulnerable: '<1.2.0',
  }
}

function makeReport({ findings }) {
  return { findings, plan: { actions: [], scope: 'consumer-facing', verify: 'pnpm audit' } }
}

describe('selectFixableAdvisories', () => {
  const report = makeReport({
    findings: [
      makeFinding({ advisory: 'GHSA-fix', status: 'fix' }),
      makeFinding({ advisory: 'GHSA-relock', status: 'relock' }),
      makeFinding({ advisory: 'GHSA-none', status: 'none' }),
      makeFinding({ advisory: 'GHSA-unknown', status: 'unknown' }),
    ],
  })

  it('selectFixableAdvisories excludes relock on consumer-facing', () => {
    expect(selectFixableAdvisories({ report, scope: 'consumer-facing' })).toEqual(['GHSA-fix'])
  })

  it('selectFixableAdvisories includes relock on monorepo', () => {
    expect(selectFixableAdvisories({ report, scope: 'monorepo' })).toEqual([
      'GHSA-fix',
      'GHSA-relock',
    ])
  })

  it('selectFixableAdvisories dedupes and sorts', () => {
    const unsorted = makeReport({
      findings: [
        makeFinding({ advisory: 'GHSA-b', status: 'fix' }),
        makeFinding({ advisory: 'GHSA-a', status: 'fix' }),
        makeFinding({ advisory: 'GHSA-b', status: 'fix' }),
      ],
    })

    expect(selectFixableAdvisories({ report: unsorted, scope: 'consumer-facing' })).toEqual([
      'GHSA-a',
      'GHSA-b',
    ])
  })
})

describe('readReport', () => {
  async function writeTemp({ content }) {
    const dir = await mkdtemp(path.join(tmpdir(), 'audit-deps-'))
    const file = path.join(dir, 'audit_output.json')
    await writeFile(file, content)
    return file
  }

  it('readReport returns a valid report', async () => {
    const report = makeReport({ findings: [makeFinding({ advisory: 'A', status: 'fix' })] })
    const file = await writeTemp({ content: JSON.stringify(report) })

    expect(await readReport({ path: file })).toEqual(report)
  })

  it('readReport throws on missing file', async () => {
    const missing = path.join(tmpdir(), 'audit-deps-does-not-exist.json')

    await expect(readReport({ path: missing })).rejects.toThrow(
      `audit report missing or invalid: ${missing}`,
    )
  })

  it('readReport throws on invalid JSON', async () => {
    const file = await writeTemp({ content: '{not json' })

    await expect(readReport({ path: file })).rejects.toThrow(
      `audit report missing or invalid: ${file}`,
    )
  })

  it('readReport throws when plan.actions missing', async () => {
    const file = await writeTemp({ content: JSON.stringify({ findings: [], plan: {} }) })

    await expect(readReport({ path: file })).rejects.toThrow(
      `audit report missing or invalid: ${file}`,
    )
  })

  it('readReport throws when findings missing', async () => {
    const file = await writeTemp({ content: JSON.stringify({ plan: { actions: [] } }) })

    await expect(readReport({ path: file })).rejects.toThrow(
      `audit report missing or invalid: ${file}`,
    )
  })
})

describe('findUnfixedClaims', () => {
  it('findUnfixedClaims returns claims still reported', () => {
    const report = makeReport({ findings: [makeFinding({ advisory: 'B', status: 'fix' })] })

    expect(findUnfixedClaims({ claimed: ['A', 'B'], report })).toEqual(['B'])
  })

  it('findUnfixedClaims returns sorted output', () => {
    const report = makeReport({
      findings: [
        makeFinding({ advisory: 'C', status: 'fix' }),
        makeFinding({ advisory: 'B', status: 'fix' }),
      ],
    })

    expect(findUnfixedClaims({ claimed: ['C', 'B'], report })).toEqual(['B', 'C'])
  })
})

describe('advisory marker', () => {
  it('marker round-trips', () => {
    const body = 'x\n' + formatAdvisoryMarker({ advisories: ['B', 'A'] })

    expect(parseAdvisoryMarker({ body })).toEqual(['A', 'B'])
  })

  it('formatAdvisoryMarker uses the sorted, comma-joined format', () => {
    expect(formatAdvisoryMarker({ advisories: ['B', 'A'] })).toBe(
      '<!-- audit-deps-advisories: A,B -->',
    )
  })

  it('parseAdvisoryMarker returns null without marker', () => {
    expect(parseAdvisoryMarker({ body: 'no marker here' })).toBeNull()
    expect(parseAdvisoryMarker({ body: null })).toBeNull()
  })
})

describe('stripMarkers', () => {
  it('stripMarkers removes all audit-deps comments', () => {
    const body = [
      'text',
      '<!-- audit-deps-advisories: A,B -->',
      '<!-- audit-deps-blocked: C -->',
      'more',
    ].join('\n')

    const result = stripMarkers({ body })

    expect(result).not.toContain('audit-deps-')
    expect(result).toContain('text')
    expect(result).toContain('more')
  })

  it('stripMarkers keeps other HTML comments', () => {
    const body = '<!-- keep me -->\n<!-- audit-deps-advisories: A -->'

    expect(stripMarkers({ body })).toContain('<!-- keep me -->')
  })
})
