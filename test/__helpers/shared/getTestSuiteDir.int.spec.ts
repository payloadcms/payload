import path from 'path'
import { afterEach, describe, expect, it } from 'vitest'

import { getTestSuiteDir } from './getTestSuiteDir.js'

describe('getTestSuiteDir', () => {
  const fallbackDir = '/repo/test/fields'
  const originalFramework = process.env.PAYLOAD_FRAMEWORK
  const originalRootDir = process.env.ROOT_DIR

  afterEach(() => {
    process.env.PAYLOAD_FRAMEWORK = originalFramework
    process.env.ROOT_DIR = originalRootDir
  })

  it('should resolve from ROOT_DIR for tanstack start runs', () => {
    process.env.PAYLOAD_FRAMEWORK = 'tanstack-start'
    process.env.ROOT_DIR = '/repo/test'

    expect(getTestSuiteDir({ fallbackDir, suitePath: 'fields' })).toBe(
      path.resolve('/repo/test', 'fields'),
    )
  })

  it('should ignore ROOT_DIR for next runs, which point it at the monorepo root', () => {
    delete process.env.PAYLOAD_FRAMEWORK
    process.env.ROOT_DIR = '/repo'

    expect(getTestSuiteDir({ fallbackDir, suitePath: 'fields' })).toBe(fallbackDir)
  })

  it('should use the fallback directory when ROOT_DIR is not set', () => {
    process.env.PAYLOAD_FRAMEWORK = 'tanstack-start'
    delete process.env.ROOT_DIR

    expect(getTestSuiteDir({ fallbackDir, suitePath: 'fields' })).toBe(fallbackDir)
  })

  it('should resolve nested suite paths', () => {
    process.env.PAYLOAD_FRAMEWORK = 'tanstack-start'
    process.env.ROOT_DIR = '/repo/test'

    expect(getTestSuiteDir({ fallbackDir, suitePath: 'lexical/collections/Upload' })).toBe(
      path.resolve('/repo/test', 'lexical/collections/Upload'),
    )
  })
})
