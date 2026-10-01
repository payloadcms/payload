import { describe, expect, it } from 'vitest'

import { resolveDefaultTag } from './defaultTag.js'

describe('resolveDefaultTag', () => {
  it('follows the prerelease id the running version carries', () => {
    expect(resolveDefaultTag('4.0.0-beta.3')).toBe('beta')
    expect(resolveDefaultTag('4.0.0-canary.20')).toBe('canary')
  })

  it('falls back to canary for stable or unparseable versions', () => {
    expect(resolveDefaultTag('4.1.0')).toBe('canary')
    expect(resolveDefaultTag('not-a-version')).toBe('canary')
    expect(resolveDefaultTag(undefined)).toBe('canary')
  })
})
