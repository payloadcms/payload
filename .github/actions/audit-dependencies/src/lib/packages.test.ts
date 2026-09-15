import { describe, expect, it } from 'vitest'

import type { Catalogs } from './catalog'
import type { PackageManifest } from './packages'

import { selectConsumerPackages } from './packages'

const EMPTY_CATALOGS: Catalogs = { default: {}, named: {} }

const manifest = (
  overrides: Partial<PackageManifest> & Pick<PackageManifest, 'name' | 'shortName'>,
): PackageManifest => ({
  allDependencies: {},
  dependencies: {},
  isPrivate: false,
  ...overrides,
})

const select = (manifests: PackageManifest[], catalogs: Catalogs = EMPTY_CATALOGS) =>
  selectConsumerPackages(manifests, catalogs)

describe('selectConsumerPackages', () => {
  it('excludes private packages', () => {
    const result = select([
      manifest({ name: 'payload', shortName: 'payload' }),
      manifest({ isPrivate: true, name: 'internal-tool', shortName: 'internal-tool' }),
    ])

    expect(result.map((pkg) => pkg.name)).toEqual(['payload'])
  })

  it('excludes the dev-tooling denylist but keeps codemod and typescript-plugin', () => {
    const result = select([
      manifest({ name: '@payloadcms/eslint-config', shortName: 'eslint-config' }),
      manifest({ name: '@payloadcms/eslint-plugin', shortName: 'eslint-plugin' }),
      manifest({ name: '@payloadcms/codemod', shortName: 'codemod' }),
      manifest({ name: '@payloadcms/typescript-plugin', shortName: 'typescript-plugin' }),
    ])

    expect(result.map((pkg) => pkg.name).sort()).toEqual([
      '@payloadcms/codemod',
      '@payloadcms/typescript-plugin',
    ])
  })

  it('strips workspace-internal dependencies, keeping externals', () => {
    const result = select([
      manifest({
        dependencies: { '@payloadcms/translations': 'workspace:*', undici: '7.28.0' },
        name: '@payloadcms/ui',
        shortName: 'ui',
      }),
      manifest({ name: '@payloadcms/translations', shortName: 'translations' }),
    ])

    const ui = result.find((pkg) => pkg.name === '@payloadcms/ui')

    expect(ui?.dependencies).toEqual({ undici: '7.28.0' })
  })

  it('strips any workspace: spec, even for a name not under packages/', () => {
    const result = select([
      manifest({
        dependencies: { '@tools/constants': 'workspace:*', undici: '7.28.0' },
        name: '@payloadcms/ui',
        shortName: 'ui',
      }),
    ])

    expect(result[0].dependencies).toEqual({ undici: '7.28.0' })
  })

  it('resolves catalog: specs to the concrete catalog version', () => {
    const result = select(
      [manifest({ dependencies: { zod: 'catalog:' }, name: 'payload', shortName: 'payload' })],
      { default: { zod: '^4.6.0' }, named: {} },
    )

    expect(result[0].dependencies).toEqual({ zod: '^4.6.0' })
  })

  it('leaves an unresolved catalog: spec unchanged (surfaces later as a warning)', () => {
    const result = select([
      manifest({ dependencies: { zod: 'catalog:' }, name: 'payload', shortName: 'payload' }),
    ])

    expect(result[0].dependencies).toEqual({ zod: 'catalog:' })
  })
})
