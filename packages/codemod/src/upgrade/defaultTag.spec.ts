import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { resolveDefaultTag } from './defaultTag.js'

describe('resolveDefaultTag', () => {
  it('follows the prerelease id the running version carries', () => {
    expect(resolveDefaultTag('4.0.0-beta.3')).toBe('beta')
    expect(resolveDefaultTag('4.0.0-canary.20')).toBe('canary')
  })

  it('falls back to beta for stable or unparseable versions', () => {
    expect(resolveDefaultTag('4.1.0')).toBe('beta')
    expect(resolveDefaultTag('not-a-version')).toBe('beta')
    expect(resolveDefaultTag('')).toBe('beta')
  })

  it('reads its own package version when no version is provided', () => {
    const { version } = JSON.parse(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
    ) as { version: string }

    expect(resolveDefaultTag()).toBe(resolveDefaultTag(version))
    expect(resolveDefaultTag(undefined)).toBe(resolveDefaultTag(version))
  })
})
