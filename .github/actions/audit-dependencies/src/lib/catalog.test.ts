import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { loadCatalogs, resolveCatalogSpec } from './catalog'

let dir: string

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'catalog-test-'))
})

afterEach(async () => {
  await rm(dir, { force: true, recursive: true })
})

describe('loadCatalogs', () => {
  it('parses the default and named catalogs from pnpm-workspace.yaml', async () => {
    await writeFile(
      join(dir, 'pnpm-workspace.yaml'),
      [
        'catalog:',
        "  zod: '^4.6.0'",
        "  react: '19.2.6'",
        'catalogs:',
        '  react18:',
        "    react: '18.2.0'",
        '',
      ].join('\n'),
    )

    const catalogs = await loadCatalogs({ repoRoot: dir })

    expect(catalogs.default.zod).toBe('^4.6.0')
    expect(catalogs.default.react).toBe('19.2.6')
    expect(catalogs.named.react18.react).toBe('18.2.0')
  })

  it('returns empty catalogs when the file is missing', async () => {
    const catalogs = await loadCatalogs({ repoRoot: join(dir, 'nope') })

    expect(catalogs).toEqual({ default: {}, named: {} })
  })
})

describe('resolveCatalogSpec', () => {
  const catalogs = { default: { zod: '^4.6.0' }, named: { react18: { react: '18.2.0' } } }

  it('resolves a bare catalog: spec from the default catalog', () => {
    expect(resolveCatalogSpec({ catalogs, name: 'zod', spec: 'catalog:' })).toBe('^4.6.0')
    expect(resolveCatalogSpec({ catalogs, name: 'zod', spec: 'catalog:default' })).toBe('^4.6.0')
  })

  it('resolves a named catalog: spec', () => {
    expect(resolveCatalogSpec({ catalogs, name: 'react', spec: 'catalog:react18' })).toBe('18.2.0')
  })

  it('leaves a normal range untouched', () => {
    expect(resolveCatalogSpec({ catalogs, name: 'undici', spec: '7.28.0' })).toBe('7.28.0')
  })

  it('returns the spec unchanged when the catalog has no matching entry', () => {
    expect(resolveCatalogSpec({ catalogs, name: 'missing', spec: 'catalog:' })).toBe('catalog:')
  })
})
