import { describe, expect, it } from 'vitest'

import { withPayload } from './withPayload.js'

describe('withPayload', () => {
  it('should install the admin route transform only when Cache Components is enabled', () => {
    const env = { CUSTOM: 'value' }
    const enabled = withPayload({ cacheComponents: true, env })
    const disabled = withPayload({ cacheComponents: false, env: enabled.env })

    expect(Object.values(enabled.turbopack.rules)).toHaveLength(1)
    expect(disabled.turbopack.rules).toBeUndefined()
    expect(env).toEqual({ CUSTOM: 'value' })
    expect(disabled.env.CUSTOM).toBe('value')
  })

  it('should preserve existing Turbopack rules', () => {
    const rule = { loaders: ['custom-loader'] }
    const rules = {
      '**/{layout,page}.{js,jsx,ts,tsx,mjs,mts,cjs,cts}': rule,
      '*.svg': { loaders: ['svg-loader'] },
    }
    const enabled = withPayload({ cacheComponents: true, turbopack: { rules } })

    expect(enabled.turbopack.rules['*.svg']).toBe(rules['*.svg'])
    expect(enabled.turbopack.rules[Object.keys(rules)[0]!][0]).toBe(rule)
    expect(rules[Object.keys(rules)[0]!]).toBe(rule)
  })

  it.each([false, true])(
    'should preserve Webpack rules when Cache Components is %s',
    (cacheComponents) => {
      const rule = { test: /custom/, use: ['custom-loader'] }
      const config = withPayload({
        cacheComponents,
        webpack: (config) => ({ ...config, module: { rules: [rule] } }),
      })
      const result = config.webpack({}, { webpack: { IgnorePlugin: class {} } })

      expect(result.module.rules[0]).toBe(rule)
      expect(result.module.rules).toHaveLength(cacheComponents ? 2 : 1)
    },
  )

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
