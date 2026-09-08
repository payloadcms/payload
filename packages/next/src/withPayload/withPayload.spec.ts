import { describe, expect, it } from 'vitest'

import { withPayload } from './withPayload.js'

describe('withPayload', () => {
  it('should set process.env.NEXT_BASE_PATH when nextConfig.basePath is provided', () => {
    const originalBasePath = process.env.NEXT_BASE_PATH
    delete process.env.NEXT_BASE_PATH

    try {
      const mockNextConfig = {
        basePath: '/test/basepath',
      }

      withPayload(mockNextConfig)

      // Verify it set the env var so formatAdminURL can read it
      expect(process.env.NEXT_BASE_PATH).toBe('/test/basepath')
    } finally {
      // Restore original value
      if (originalBasePath === undefined) {
        delete process.env.NEXT_BASE_PATH
      } else {
        process.env.NEXT_BASE_PATH = originalBasePath
      }
    }
  })

  it('should position devIndicators at the bottom left by default', () => {
    const result = withPayload({})

    expect(result.devIndicators).toEqual({ position: 'bottom-left' })
  })

  it('should use user-provided devIndicators when specified', () => {
    const result = withPayload({ devIndicators: { appIsrStatus: true } })

    expect(result.devIndicators).toEqual({ appIsrStatus: true })
  })

  it('should not modify process.env.NEXT_BASE_PATH when basePath is not provided', () => {
    const originalBasePath = process.env.NEXT_BASE_PATH

    try {
      const mockNextConfig = {}

      withPayload(mockNextConfig)

      // Verify it didn't set the env var
      expect(process.env.NEXT_BASE_PATH).toBe(originalBasePath)
    } finally {
      // Restore original value
      if (originalBasePath === undefined) {
        delete process.env.NEXT_BASE_PATH
      } else {
        process.env.NEXT_BASE_PATH = originalBasePath
      }
    }
  })
})
