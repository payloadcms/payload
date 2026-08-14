import { describe, expect, it } from 'vitest'

import { renderUpgradePrompt } from './prompt.js'

describe('renderUpgradePrompt', () => {
  it('embeds the upgrade command with the given path', () => {
    const out = renderUpgradePrompt({ path: './app' })

    expect(out).toContain('npx @payloadcms/codemod upgrade ./app')
  })

  it('propagates the tag into the embedded command', () => {
    const out = renderUpgradePrompt({ path: './app', tag: 'latest' })

    expect(out).toContain('npx @payloadcms/codemod upgrade ./app --tag latest')
  })

  it('omits the tag flag when no tag is given', () => {
    const out = renderUpgradePrompt({ path: '.' })

    expect(out).not.toContain('--tag')
  })

  it('orders the steps: payload slice before Next before verify', () => {
    const out = renderUpgradePrompt({ path: '.' })
    const payloadStep = out.indexOf('## 1. Payload mechanical slice')
    const nextStep = out.indexOf('## 2. Next.js 16')
    const verifyStep = out.indexOf('## 5. Verify')

    expect(payloadStep).toBeGreaterThan(-1)
    expect(payloadStep).toBeLessThan(nextStep)
    expect(nextStep).toBeLessThan(verifyStep)
  })

  it('delegates Next.js to Next own codemods rather than restating them', () => {
    const out = renderUpgradePrompt({ path: '.' })

    expect(out).toContain('@next/codemod@canary upgrade latest')
    expect(out).toContain('next-async-request-api')
  })

  it('encodes the expected-unmet-peer invariant', () => {
    const out = renderUpgradePrompt({ path: '.' })

    expect(out).toContain('EXPECTED')
    expect(out).toMatch(/do not downgrade\s+payload/i)
  })

  it('points at the migration guide and runbook without duplicating them', () => {
    const out = renderUpgradePrompt({ path: '.' })

    expect(out).toContain('v4.mdx')
    expect(out).toContain('runbook/payload-v4-upgrade.md')
  })

  it('contains no figma references', () => {
    const out = renderUpgradePrompt({ path: '.' })

    expect(out.toLowerCase()).not.toContain('figma')
  })
})
