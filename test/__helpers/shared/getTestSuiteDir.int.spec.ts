import path from 'path'
import { expect } from 'vitest'

import { test } from '../int/vitest.js'
import { getTestSuiteDir } from './getTestSuiteDir.js'

test.suite({})('getTestSuiteDir', () => {
  const fallbackDir = '/repo/test/fields'
  const originalFramework = process.env.PAYLOAD_FRAMEWORK
  const originalRootDir = process.env.ROOT_DIR

  test.afterEach(() => {
    process.env.PAYLOAD_FRAMEWORK = originalFramework
    process.env.ROOT_DIR = originalRootDir
  })

  test('should resolve from ROOT_DIR for tanstack start runs', () => {
    process.env.PAYLOAD_FRAMEWORK = 'tanstack-start'
    process.env.ROOT_DIR = '/repo/test'

    expect(getTestSuiteDir({ fallbackDir, suitePath: 'fields' })).toBe(
      path.resolve('/repo/test', 'fields'),
    )
  })

  test('should ignore ROOT_DIR for next runs, which point it at the monorepo root', () => {
    delete process.env.PAYLOAD_FRAMEWORK
    process.env.ROOT_DIR = '/repo'

    expect(getTestSuiteDir({ fallbackDir, suitePath: 'fields' })).toBe(fallbackDir)
  })

  test('should use the fallback directory when ROOT_DIR is not set', () => {
    process.env.PAYLOAD_FRAMEWORK = 'tanstack-start'
    delete process.env.ROOT_DIR

    expect(getTestSuiteDir({ fallbackDir, suitePath: 'fields' })).toBe(fallbackDir)
  })

  test('should resolve nested suite paths', () => {
    process.env.PAYLOAD_FRAMEWORK = 'tanstack-start'
    process.env.ROOT_DIR = '/repo/test'

    expect(getTestSuiteDir({ fallbackDir, suitePath: 'lexical/collections/Upload' })).toBe(
      path.resolve('/repo/test', 'lexical/collections/Upload'),
    )
  })
})
