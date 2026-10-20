import type { UserConfig } from 'vite'

import { describe, expect, it } from 'vitest'

import { withPayload } from './index.js'

describe('withPayload server externals', () => {
  function getConfig({
    command,
    devBundleServerPackages,
  }: {
    command: 'build' | 'serve'
    devBundleServerPackages?: boolean
  }): UserConfig {
    return withPayload(() => ({}), {
      devBundleServerPackages,
      devServerExternalPackages: ['custom-server-dependency', 'payload', 'pino'],
      payloadConfigPath: './payload.config.ts',
    })({ command, mode: command === 'serve' ? 'development' : 'production' })
  }

  function expectEnvironmentExternals({
    config,
    isBuild,
  }: {
    config: UserConfig
    isBuild: boolean
  }) {
    for (const environment of ['rsc', 'ssr']) {
      const environmentConfig = config.environments![environment]!

      expect(environmentConfig.resolve!.external).toEqual(
        isBuild ? undefined : config.ssr!.external,
      )
      expect(environmentConfig.resolve!.noExternal).toEqual(config.ssr!.noExternal)
      expect(environmentConfig.build!.rollupOptions!.external).toEqual(
        getConfig({ command: 'build' }).ssr!.external,
      )
    }
  }

  it('should externalize server packages by default across development SSR and RSC', () => {
    const config = getConfig({ command: 'serve' })
    const external = config.ssr!.external as string[]

    expect([...external].sort()).toMatchSnapshot('development')
    expect(getConfig({ command: 'serve', devBundleServerPackages: false }).ssr).toEqual(config.ssr)
    expect(external).toContain('date-fns')
    expect(external).not.toContain('undici')
    expect(external).not.toContain('@payloadcms/ui')
    expect(external.filter((pkg) => pkg === 'payload')).toHaveLength(1)
    expect(external.filter((pkg) => pkg === 'pino')).toHaveLength(1)
    expectEnvironmentExternals({ config, isBuild: false })
  })

  it('should honor the development bundle opt-in and keep custom and third-party externals', () => {
    const config = getConfig({ command: 'serve', devBundleServerPackages: true })
    const external = config.ssr!.external as string[]

    expect([...external].sort()).toMatchSnapshot('bundled development')
    expect(external).not.toContain('date-fns')
    expect(external).not.toContain('@payloadcms/db-mongodb')
    expect(external).toContain('custom-server-dependency')
    expect(external).toContain('payload')
    expectEnvironmentExternals({ config, isBuild: false })
  })

  it('should preserve production boundaries and bundled leaf dependencies regardless of the dev option', () => {
    const config = getConfig({ command: 'build' })
    const external = config.ssr!.external as string[]

    expect([...external].sort()).toMatchSnapshot('production')
    expect(config.ssr!.noExternal).toContain('pluralize')

    for (const pkg of [
      'date-fns',
      'undici',
      'custom-server-dependency',
      'pluralize',
      '@aws-sdk/client-s3',
    ]) {
      expect(external).not.toContain(pkg)
    }

    for (const devBundleServerPackages of [false, true]) {
      expect(getConfig({ command: 'build', devBundleServerPackages }).ssr).toEqual(config.ssr)
    }

    expectEnvironmentExternals({ config, isBuild: true })
  })
})
