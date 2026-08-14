import { describe, expect, it } from 'vitest'

import { renderReport } from './report.js'

describe('renderReport', () => {
  it('renders versions, overrides, transforms, next line, and runbook pointer', () => {
    const out = renderReport({
      floorsWritten: ['typescript', '@types/node', 'engines.node'],
      nextTarget: '16.9.3',
      overridesRemoved: ['pnpm.overrides.payload'],
      runbookPath: '/x/dist/runbook/payload-v4-upgrade.md',
      transforms: [
        { filesChanged: ['a.ts'], name: 'migrate-versions-default', notes: ['review X'] },
      ],
      versions: [
        { name: 'payload', ok: true, resolved: '4.0.0-canary.20', wrote: '4.0.0-canary.20' },
      ],
    })

    expect(out).toContain('payload')
    expect(out).toContain('4.0.0-canary.20')
    expect(out).toContain('pnpm.overrides.payload')
    expect(out).toContain('migrate-versions-default')
    expect(out).toContain('review X')
    expect(out).toContain('16.9.3')
    expect(out).toContain('payload-v4-upgrade.md')
    expect(out).toContain('Floors written')
    expect(out).toContain('typescript')
  })

  it('flags a resolution mismatch as not confirmed v4', () => {
    const out = renderReport({
      floorsWritten: [],
      nextTarget: null,
      overridesRemoved: [],
      runbookPath: '/x/runbook.md',
      transforms: [],
      versions: [{ name: 'payload', ok: false, resolved: '3.40.0', wrote: '4.0.0-canary.20' }],
    })

    expect(out).toContain('MISMATCH')
    expect(out).toContain('NOT confirmed v4')
    expect(out).not.toContain('Floors written')
  })

  it('renders a failed transform with [FAIL] and its error message', () => {
    const out = renderReport({
      floorsWritten: [],
      nextTarget: null,
      overridesRemoved: [],
      runbookPath: '/x/runbook.md',
      transforms: [{ error: new Error('boom'), filesChanged: [], name: 'broken-transform' }],
      versions: [],
    })

    expect(out).toContain('[FAIL]')
    expect(out).toContain('broken-transform')
    expect(out).toContain('boom')
  })
})
