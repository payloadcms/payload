import { describe, expect, it, vi } from 'vitest'

import type { PnpmResult } from './runPnpm'

import { runMonorepoAudit } from './monorepoAudit'

const advisoryJson = JSON.stringify({
  advisories: {
    '1': {
      id: 1,
      findings: [],
      github_advisory_id: 'GHSA-aaaa-bbbb-cccc',
      module_name: 'lodash',
      patched_versions: '>=1.0.1',
      severity: 'high',
      title: 'vuln in lodash',
      url: 'https://example.test',
      vulnerable_versions: '<1.0.1',
    },
  },
})

const runReturning = (result: PnpmResult) =>
  vi.fn((_input: { args: string[]; cwd: string }) => Promise.resolve(result))

describe('runMonorepoAudit', () => {
  it('returns hits when pnpm audit exits non-zero with advisories', async () => {
    const run = runReturning({ code: 1, stderr: '', stdout: advisoryJson })

    const hits = await runMonorepoAudit({ cwd: '/repo', run })

    expect(hits.map((hit) => hit.advisory.github_advisory_id)).toEqual(['GHSA-aaaa-bbbb-cccc'])
  })

  it('returns no hits when pnpm audit exits zero', async () => {
    const run = runReturning({ code: 0, stderr: '', stdout: JSON.stringify({ advisories: {} }) })

    expect(await runMonorepoAudit({ cwd: '/repo', run })).toEqual([])
  })

  it('returns hits when the only advisory has no published patch', async () => {
    const unpatched = JSON.stringify({
      advisories: {
        '1': { ...JSON.parse(advisoryJson).advisories['1'], patched_versions: null },
      },
    })
    const run = runReturning({ code: 1, stderr: '', stdout: unpatched })

    const hits = await runMonorepoAudit({ cwd: '/repo', run })

    expect(hits.map((hit) => hit.advisory.patched_versions)).toEqual(['<0.0.0'])
  })

  it('fails when pnpm audit exits non-zero without advisories (no false clean)', async () => {
    const run = runReturning({ code: 1, stderr: 'ERR_PNPM_AUDIT_NO_LOCKFILE', stdout: '' })

    await expect(runMonorepoAudit({ cwd: '/repo', run })).rejects.toThrow(
      /exit code 1[\s\S]*ERR_PNPM_AUDIT_NO_LOCKFILE/,
    )
  })
})
