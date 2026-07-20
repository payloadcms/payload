import { describe, expect, it } from 'vitest'

import { assertBumpPreconditions } from './assertBumpPreconditions.js'

const valid = {
  branch: 'main',
  bump: 'prerelease',
  hasGithubToken: true,
  preid: 'canary',
  version: '4.0.0-canary.9',
}

describe('assertBumpPreconditions', () => {
  it('should pass for valid canary inputs', () => {
    expect(() => assertBumpPreconditions({ ...valid })).not.toThrow()
  })

  it('should allow a canary.N -> beta.0 transition (preid need not match the current id)', () => {
    expect(() => assertBumpPreconditions({ ...valid, preid: 'beta' })).not.toThrow()
  })

  it('should throw when not on main', () => {
    expect(() => assertBumpPreconditions({ ...valid, branch: 'feature' })).toThrow(
      /must be run from 'main'/,
    )
  })

  it('should throw for a non-v4 version', () => {
    expect(() => assertBumpPreconditions({ ...valid, version: '3.85.2' })).toThrow(/Expected a v4/)
  })

  it('should throw for a stable v4 version with no prerelease id', () => {
    expect(() => assertBumpPreconditions({ ...valid, version: '4.0.0' })).toThrow(
      /no prerelease identifier/,
    )
  })

  it('should throw for an invalid preid', () => {
    expect(() => assertBumpPreconditions({ ...valid, preid: 'latest' })).toThrow(/Invalid --preid/)
  })

  it('should throw for an invalid bump', () => {
    expect(() => assertBumpPreconditions({ ...valid, bump: 'major' })).toThrow(/Invalid --bump/)
  })

  it('should throw when GITHUB_TOKEN is missing', () => {
    expect(() => assertBumpPreconditions({ ...valid, hasGithubToken: false })).toThrow(
      /GITHUB_TOKEN/,
    )
  })
})
