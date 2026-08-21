import { describe, expect, it } from 'vitest'

import { renderUpgradePrompt } from './prompt.js'

describe('renderUpgradePrompt', () => {
  it('emits a project-agnostic upgrade command', () => {
    const out = renderUpgradePrompt()

    expect(out).toContain('npx @payloadcms/codemod upgrade run .')
  })

  it('documents --tag as an inline option rather than baking a value', () => {
    const out = renderUpgradePrompt()

    expect(out).toContain('--tag <dist-tag>')
  })

  it('orders the steps: pre-upgrade before payload slice before Next before verify', () => {
    const out = renderUpgradePrompt()
    const preUpgradeStep = out.indexOf('## 1. Pre-upgrade migrations')
    const payloadStep = out.indexOf('## 2. Payload mechanical slice')
    const nextStep = out.indexOf('## 3. Next.js 16')
    const verifyStep = out.indexOf('## 6. Verify')

    expect(preUpgradeStep).toBeGreaterThan(-1)
    expect(preUpgradeStep).toBeLessThan(payloadStep)
    expect(payloadStep).toBeLessThan(nextStep)
    expect(nextStep).toBeLessThan(verifyStep)
  })

  it('places Slate -> Lexical in the pre-upgrade gate, not the post-upgrade work', () => {
    const out = renderUpgradePrompt()
    const slate = out.indexOf('Slate -> Lexical')
    const mechanicalSlice = out.indexOf('## 2. Payload mechanical slice')

    expect(slate).toBeGreaterThan(-1)
    expect(slate).toBeLessThan(mechanicalSlice)
  })

  it('delegates Next.js to Next own codemods rather than restating them', () => {
    const out = renderUpgradePrompt()

    expect(out).toContain('@next/codemod@canary upgrade latest')
    expect(out).toContain('next-async-request-api')
  })

  it('encodes the expected-unmet-peer invariant', () => {
    const out = renderUpgradePrompt()

    expect(out).toContain('EXPECTED')
    expect(out).toMatch(/do not downgrade\s+payload/i)
  })

  it('points at the migration guide and runbook without duplicating them', () => {
    const out = renderUpgradePrompt()

    expect(out).toContain('v4.mdx')
    expect(out).toContain('runbook/payload-v4-upgrade.md')
  })

  it('contains no figma references', () => {
    const out = renderUpgradePrompt()

    expect(out.toLowerCase()).not.toContain('figma')
  })
})
