import { describe, expect, it, vi } from 'vitest'

import type { ConsumerPackage } from './packages'
import type { PnpmResult } from './runPnpm'

import { runConsumerAudit } from './consumerAudit'

const auditJson = (advisories: Array<{ ghsa: string; module: string }>): string =>
  JSON.stringify({
    advisories: Object.fromEntries(
      advisories.map(({ ghsa, module }, index) => [
        String(index),
        {
          findings: [],
          github_advisory_id: ghsa,
          id: index,
          module_name: module,
          patched_versions: '>=1.0.1',
          severity: 'high',
          title: `vuln in ${module}`,
          url: 'https://example.test',
          vulnerable_versions: '<1.0.1',
        },
      ]),
    ),
  })

const pkg = (shortName: string, dependencies: Record<string, string>): ConsumerPackage => ({
  dependencies,
  name: `@payloadcms/${shortName}`,
  shortName,
})

describe('runConsumerAudit', () => {
  it('skips packages with no dependencies (no pnpm calls)', async () => {
    const run = vi.fn<(input: { args: string[]; cwd: string }) => Promise<PnpmResult>>()

    const hits = await runConsumerAudit({ ignoreGhsas: [], packages: [pkg('empty', {})], run })

    expect(hits).toEqual([])
    expect(run).not.toHaveBeenCalled()
  })

  it('merges the same advisory across packages, unioning origin packages', async () => {
    const run = vi.fn(({ args, cwd }: { args: string[]; cwd: string }): Promise<PnpmResult> => {
      if (args[0] === 'install') {
        return Promise.resolve({ code: 0, stderr: '', stdout: '' })
      }
      const module = cwd.includes('audit-a-') ? 'a' : 'b'
      return Promise.resolve({
        code: 1,
        stderr: '',
        stdout: auditJson([
          { ghsa: 'GHSA-shared-shared-shar', module: 'lodash' },
          { ghsa: `GHSA-only-${module}00-0000`, module },
        ]),
      })
    })

    const hits = await runConsumerAudit({
      ignoreGhsas: [],
      packages: [pkg('a', { lodash: '1' }), pkg('b', { lodash: '1' })],
      run,
    })

    const shared = hits.find((hit) => hit.advisory.github_advisory_id === 'GHSA-shared-shared-shar')

    expect(shared?.originPackages).toEqual(['a', 'b'])
    expect(hits).toHaveLength(3)
  })

  it('warns and skips a package whose install fails (no false clean)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const run = vi.fn(({ args }: { args: string[]; cwd: string }): Promise<PnpmResult> => {
      if (args[0] === 'install') {
        return Promise.resolve({ code: 1, stderr: 'unresolved workspace:* spec', stdout: '' })
      }
      return Promise.resolve({ code: 0, stderr: '', stdout: auditJson([]) })
    })

    const hits = await runConsumerAudit({
      ignoreGhsas: [],
      packages: [pkg('a', { foo: '1' })],
      run,
    })

    expect(hits).toEqual([])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('@payloadcms/a'))
    expect(run).not.toHaveBeenCalledWith(
      expect.objectContaining({ args: expect.arrayContaining(['audit']) }),
    )

    warn.mockRestore()
  })

  it('passes allowlisted GHSAs to pnpm audit as --ignore args', async () => {
    const run = vi.fn(({ args }: { args: string[]; cwd: string }): Promise<PnpmResult> => {
      if (args[0] === 'install') {
        return Promise.resolve({ code: 0, stderr: '', stdout: '' })
      }
      return Promise.resolve({ code: 0, stderr: '', stdout: auditJson([]) })
    })

    await runConsumerAudit({
      ignoreGhsas: ['GHSA-aaaa-bbbb-cccc'],
      packages: [pkg('a', { lodash: '1' })],
      run,
    })

    const auditCall = run.mock.calls.find(([input]) => input.args[0] === 'audit')

    expect(auditCall?.[0].args).toContain('--ignore')
    expect(auditCall?.[0].args).toContain('GHSA-aaaa-bbbb-cccc')
  })
})
