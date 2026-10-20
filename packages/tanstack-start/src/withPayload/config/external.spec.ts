import { describe, expect, it } from 'vitest'

import { withPayload } from '../index.js'
import { ssrExternalPackages } from './external.js'

const serverPackages = [
  'payload',
  'payload/node',
  '@payloadcms/drizzle',
  '@payloadcms/db-mongodb',
  '@payloadcms/db-postgres',
  '@payloadcms/db-vercel-postgres',
  '@payloadcms/db-sqlite',
  '@payloadcms/db-d1-sqlite',
]
const payloadConfigPath = './payload.config.ts'

describe('server package externalization', () => {
  it('should externalize server packages by default regardless of their installation', () => {
    const config = withPayload(() => ({}), { payloadConfigPath })({
      command: 'serve',
      mode: 'development',
    })

    expect(config.ssr?.external).toEqual(expect.arrayContaining(serverPackages))
  })

  it('should keep workspace packages transformed when explicitly enabled', () => {
    const config = withPayload(() => ({}), {
      devBundleServerPackages: true,
      payloadConfigPath,
    })({ command: 'serve', mode: 'development' })

    for (const specifier of serverPackages) {
      expect(config.ssr?.external).not.toContain(specifier)
    }
    expect(config.ssr?.external).toEqual(expect.arrayContaining(ssrExternalPackages))
  })

  it('should preserve additional externals when server package bundling is enabled', () => {
    const config = withPayload(() => ({}), {
      devBundleServerPackages: true,
      devServerExternalPackages: ['custom-server-package'],
      payloadConfigPath,
    })({ command: 'serve', mode: 'development' })

    expect(config.ssr?.external).toContain('custom-server-package')
  })

  it('should externalize production server packages regardless of the development opt-out', () => {
    const config = withPayload(() => ({}), {
      devBundleServerPackages: true,
      payloadConfigPath,
    })({ command: 'build', mode: 'production' })

    expect(config.ssr?.external).toEqual(expect.arrayContaining(serverPackages))
    expect(config.ssr?.external).not.toContain('pluralize')
  })
})
