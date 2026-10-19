import { describe, expect, it } from 'vitest'

import { assertBumpPreconditions } from './assertBumpPreconditions.js'

const valid = {
  branch: '3.x',
  bump: 'patch',
  hasGithubToken: true,
  version: '3.90.2',
}

describe('assertBumpPreconditions', () => {
  it('should pass for a patch bump on 3.x', () => {
    expect(() => assertBumpPreconditions({ ...valid })).not.toThrow()
  })

  it('should pass for a minor bump on 3.x', () => {
    expect(() => assertBumpPreconditions({ ...valid, bump: 'minor' })).not.toThrow()
  })

  it('should throw when not on 3.x', () => {
    expect(() => assertBumpPreconditions({ ...valid, branch: 'main' })).toThrow(
      /must be run from '3\.x'/,
    )
  })

  it('should throw for a non-v3 version', () => {
    expect(() => assertBumpPreconditions({ ...valid, version: '4.0.0' })).toThrow(/Expected a v3/)
  })

  it('should throw for a prerelease version', () => {
    expect(() => assertBumpPreconditions({ ...valid, version: '3.91.0-internal.abc1234' })).toThrow(
      /prerelease/,
    )
  })

  it('should throw for a prerelease bump', () => {
    expect(() => assertBumpPreconditions({ ...valid, bump: 'prerelease' })).toThrow(
      /Invalid --bump/,
    )
  })

  it('should throw for a major bump', () => {
    expect(() => assertBumpPreconditions({ ...valid, bump: 'major' })).toThrow(/Invalid --bump/)
  })

  it('should throw when GITHUB_TOKEN is missing', () => {
    expect(() => assertBumpPreconditions({ ...valid, hasGithubToken: false })).toThrow(
      /GITHUB_TOKEN/,
    )
  })
})
