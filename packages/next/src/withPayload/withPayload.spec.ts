import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { withPayload } from './withPayload.js'

describe('withPayload', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn')
    vi.stubEnv('NEXT_TRAILING_SLASH', process.env.NEXT_TRAILING_SLASH)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  describe('server externals', () => {
    const userConfig = { serverExternalPackages: ['custom-server-dependency', 'graphql'] }

    it('should externalize server packages by default in development and honor the bundle opt-in', () => {
      vi.stubEnv('NODE_ENV', 'development')
      const defaultConfig = withPayload(userConfig)
      const disabledConfig = withPayload(userConfig, { devBundleServerPackages: false })
      const enabledConfig = withPayload(userConfig, { devBundleServerPackages: true })

      expect(defaultConfig.serverExternalPackages).toMatchSnapshot('development')
      expect(disabledConfig.serverExternalPackages).toEqual(defaultConfig.serverExternalPackages)
      expect(enabledConfig.serverExternalPackages).not.toContain('payload')
      expect(defaultConfig.serverExternalPackages).not.toContain('@payloadcms/ui')

      vi.stubEnv('NODE_ENV', 'production')

      expect(enabledConfig.serverExternalPackages).toEqual(
        withPayload(userConfig).serverExternalPackages,
      )
      expect(userConfig.serverExternalPackages).toEqual(['custom-server-dependency', 'graphql'])
    })

    it('should preserve production externals and Webpack exceptions regardless of the dev option', () => {
      vi.stubEnv('NODE_ENV', 'production')
      const defaultConfig = withPayload(userConfig)
      const webpackConfig = defaultConfig.webpack(
        { externals: ['custom-webpack-external'] },
        { webpack: { IgnorePlugin: class {} } },
      )

      expect(defaultConfig.serverExternalPackages).toMatchSnapshot('production')
      expect(webpackConfig.externals).toMatchSnapshot('webpack')

      for (const devBundleServerPackages of [false, true]) {
        expect(withPayload(userConfig, { devBundleServerPackages }).serverExternalPackages).toEqual(
          defaultConfig.serverExternalPackages,
        )
      }
    })
  })

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
