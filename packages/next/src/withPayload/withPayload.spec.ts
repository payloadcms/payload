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

  it('should trace strtok3 lib so a standalone build can resolve file-type 22', () => {
    const result = withPayload({})

    expect(result.outputFileTracingIncludes?.['**/*']).toContain('./node_modules/strtok3/lib/**/*')
  })

  it('should keep user-provided outputFileTracingIncludes', () => {
    const result = withPayload({
      outputFileTracingIncludes: {
        '**/*': ['./node_modules/sharp/**/*'],
        '/api/custom': ['./data/**/*'],
      },
    })

    expect(result.outputFileTracingIncludes?.['**/*']).toContain('./node_modules/sharp/**/*')
    expect(result.outputFileTracingIncludes?.['**/*']).toContain('./node_modules/strtok3/lib/**/*')
    expect(result.outputFileTracingIncludes?.['/api/custom']).toEqual(['./data/**/*'])
  })

  it('should disable devIndicators by default', () => {
    const result = withPayload({})

    expect(result.devIndicators).toBe(false)
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

  it('should mirror nextConfig.trailingSlash in process.env.NEXT_TRAILING_SLASH', () => {
    const originalTrailingSlash = process.env.NEXT_TRAILING_SLASH

    try {
      process.env.NEXT_TRAILING_SLASH = 'true'

      withPayload({ trailingSlash: false })
      expect(process.env.NEXT_TRAILING_SLASH).toBe('false')

      withPayload({ trailingSlash: true })
      expect(process.env.NEXT_TRAILING_SLASH).toBe('true')
    } finally {
      if (originalTrailingSlash === undefined) {
        delete process.env.NEXT_TRAILING_SLASH
      } else {
        process.env.NEXT_TRAILING_SLASH = originalTrailingSlash
      }
    }
  })
})
