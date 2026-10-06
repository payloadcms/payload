import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Project } from 'ts-morph'
import { describe, expect, it } from 'vitest'

import { transforms } from '../../registry.js'
import { runTransform } from '../../utils/test-helpers.js'
import { migrateDraftVersionSelectors as transform } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = ({ name }: { name: string }) => readFile(join(here, name), 'utf8')
const registered = transforms.find(({ name }) => name === 'migrate-draft-version-selectors')

const config = `import type { CollectionConfig, Payload } from 'payload'
import { buildConfig } from 'payload'
const Posts: CollectionConfig = { slug: 'posts', versions: { drafts: true }, fields: [] }
export default buildConfig({ collections: [Posts] })
`

async function apply({ source }: { source: string }) {
  const project = new Project({ useInMemoryFileSystem: true })
  const file = project.createSourceFile('/input.ts', source)
  const result = await transform.apply({ packageJsons: [], project })

  return { ...result, source: file.getFullText() }
}

describe('migrate-draft-version-selectors', () => {
  it('should be registered for the v4 upgrade', () => {
    expect(registered).toBeDefined()
  })

  it('should migrate matching Local API and SDK calls without overriding publication status', async () => {
    const source = await fixture({ name: 'basic.input.ts' })
    const output = await fixture({ name: 'basic.output.ts' })
    const result = await runTransform({ source, transform })

    expect(result).toBe(output)
  })

  it('should be idempotent on migrated source', async () => {
    const source = await fixture({ name: 'basic.output.ts' })
    const result = await runTransform({ source, transform })

    expect(result).toBe(source)
  })

  it('should leave unrelated calls and data unchanged', async () => {
    const source = await fixture({ name: 'no-match.input.ts' })
    const output = await fixture({ name: 'no-match.output.ts' })
    const result = await apply({ source })

    expect(result.source).toBe(output)
    expect(result.filesChanged).toEqual([])
    expect(result.notes ?? []).toEqual([])
  })

  it.each([
    `{ collection: 'posts', draft: flag }`,
    `{ collection: 'posts', draft: true, ...options }`,
    `{ collection: 'posts', draft: true, version: 'latest' }`,
    `{ collection: 'unknown', draft: true }`,
    `{ collection: 'posts', draft: true, draft: false }`,
    `{ collection: 'posts', draft: true, [key]: value }`,
  ])(
    'should leave ambiguous options %s unchanged with a location-specific note',
    async (options) => {
      const source = `${config}async function read(payload: Payload) { await payload.find(${options}) }`
      const result = await apply({ source })

      expect(result.source).toBe(source)
      expect(result.filesChanged).toEqual([])
      expect(result.notes).toEqual([expect.stringMatching(/^\/input.ts:5:\d+: /)])
    },
  )

  it('should leave uncertain create defaults unchanged with a note', async () => {
    const source = `${config}async function write(payload: Payload) { await payload.create({ collection: 'posts', data: { title: 'Work' }, draft: false }) }`
    const result = await apply({ source })

    expect(result.source).toBe(source)
    expect(result.notes).toHaveLength(1)
    expect(result.filesChanged).toEqual([])
  })

  it('should not assume a receiver named payload is a Payload instance', async () => {
    const source = `${config}const payload = { find: (options: unknown) => options }
payload.find({ collection: 'posts', draft: true })`
    const result = await apply({ source })

    expect(result.source).toBe(source)
    expect(result.filesChanged).toEqual([])
    expect(result.notes).toHaveLength(1)
  })

  it('should report shared argument objects without mutating their other users', async () => {
    const source = `${config}async function read(payload: Payload) {
const options = { collection: 'posts', draft: true }
await payload.find(options)
useElsewhere(options)
}`
    const result = await apply({ source })

    expect(result.source).toBe(source)
    expect(result.filesChanged).toEqual([])
    expect(result.notes).toHaveLength(1)
  })

  it('should report exactly the changed files', async () => {
    const source = `${config}async function read(payload: Payload) { await payload.find({ collection: 'posts', draft: true }) }`
    const result = await apply({ source })

    expect(result.source).toContain("version: 'latest'")
    expect(result.filesChanged).toEqual(['/input.ts'])
  })
})

const localizedConfig = `import type { CollectionConfig, Payload } from 'payload'
import { buildConfig } from 'payload'
const Posts: CollectionConfig = {
  slug: 'posts',
  versions: { drafts: { localizeStatus: true } },
  fields: [{ name: 'title', type: 'text', localized: true }],
}
export default buildConfig({ collections: [Posts], localization: { locales: ['en', 'fr'], defaultLocale: 'en' } })
`

describe('locale publication and configuration safety', () => {
  it.each([
    ['publishAllLocales', 'published', 'latest'],
    ['unpublishAllLocales', 'draft', 'published'],
  ])(
    'should migrate status-only %s without guessing localized data',
    async (flag, status, version) => {
      const source = `${localizedConfig}async function write(payload: Payload) { await payload.update({ collection: 'posts', id: '1', data: { _status: '${status}' }, ${flag}: true }) }`
      const result = await apply({ source })

      expect(result.source).toContain(`version: '${version}'`)
      expect(result.source).toContain("locale: 'all'")
      expect(result.source).toContain(`_status: '${status}'`)
      expect(result.source).not.toContain(`${flag}:`)
      expect(result.notes ?? []).toEqual([])
      expect((await apply({ source: result.source })).source).toBe(result.source)
    },
  )

  it('should supply the publication status for an empty status-only update', async () => {
    const source = `${localizedConfig}async function write(payload: Payload) { await payload.update({ collection: 'posts', id: '1', data: {}, locale: 'en', publishAllLocales: true }) }`
    const result = await apply({ source })

    expect(result.source).toContain("_status: 'published'")
    expect(result.source).toContain("locale: 'all'")
    expect(result.source).not.toContain("locale: 'en'")
    expect(result.notes ?? []).toEqual([])
    expect((await apply({ source: result.source })).source).toBe(result.source)
  })

  it.each([
    `data: { title: 'Hello' }, publishAllLocales: true`,
    `data: { _status: 'draft' }, publishAllLocales: true`,
    `data: { _status: 'published' }, publishAllLocales: true, draft: true`,
    `data: {}, publishAllLocales: true, unpublishAllLocales: true`,
    `data: {}, publishAllLocales: flag`,
    `data: {}, publishAllLocales: true, locale: getLocale()`,
    `data: { _status: { en: 'published' } }, publishAllLocales: true`,
    `data: { _status: 'published' }, publishAllLocales: false, locale: 'all'`,
  ])('should preserve ambiguous locale publication %s atomically', async (options) => {
    const source = `${localizedConfig}async function write(payload: Payload) { await payload.update({ collection: 'posts', id: '1', ${options} }) }`
    const result = await apply({ source })

    expect(result.source).toBe(source)
    expect(result.notes).toHaveLength(1)
    expect(result.filesChanged).toEqual([])
  })

  it('should remove proven inert false flags on a non-localized target', async () => {
    const source = `${config}async function write(payload: Payload) { await payload.update({ collection: 'posts', id: '1', data: { title: 'Work' }, publishAllLocales: false, unpublishAllLocales: false }) }`
    const result = await apply({ source })

    expect(result.source).toContain("version: 'latest'")
    expect(result.source).not.toContain('publishAllLocales:')
    expect(result.notes ?? []).toEqual([])
  })

  it.each([
    `buildConfig({ ...extra, collections: [Posts] })`,
    `buildConfig({ collections: [Posts, ...extra] })`,
    `buildConfig({ collections: [Posts, unknownCollection] })`,
    `buildConfig({ collections: [Posts, { slug: 'posts', versions: false, fields: [] }] })`,
  ])(
    'should not infer target capabilities from ambiguous registrations %s',
    async (registration) => {
      const source =
        config.replace('buildConfig({ collections: [Posts] })', registration) +
        `async function read(payload: Payload) { await payload.find({ collection: 'posts', draft: true }) }`
      const result = await apply({ source })

      expect(result.source).toBe(source)
      expect(result.notes).toHaveLength(1)
    },
  )

  it('should preserve comments and valid syntax when removing adjacent flags', async () => {
    const source = `${localizedConfig}async function write(payload: Payload) {
await payload.update({
  collection: 'posts',
  id: '1',
  data: {},
  // publish every locale
  publishAllLocales: true /* intent */,
  unpublishAllLocales: false,
})
}`
    const result = await apply({ source })
    const project = new Project({ useInMemoryFileSystem: true })
    const file = project.createSourceFile('/output.ts', result.source)

    expect(result.source).toContain('// publish every locale')
    expect(result.source).toContain('/* intent */')
    expect(result.source).toContain("_status: 'published'")
    expect(project.getProgram().compilerObject.getSyntacticDiagnostics(file.compilerNode)).toEqual(
      [],
    )
  })
})

describe('source provenance and syntax', () => {
  it('should support aliased getPayload and buildConfig imports in JavaScript', async () => {
    const source = `import { getPayload as load, buildConfig as configure } from 'payload'
const config = configure({ collections: [{ slug: 'posts', versions: { drafts: true }, fields: [] }] })
const cms = await load({ config })
await cms.find({ collection: 'posts', draft: true })`
    const project = new Project({ useInMemoryFileSystem: true })
    const file = project.createSourceFile('/input.js', source)
    const result = await transform.apply({ packageJsons: [], project })

    expect(file.getFullText()).toContain("version: 'latest'")
    expect(result.filesChanged).toEqual(['/input.js'])
    expect(project.getCompilerOptions().allowJs).toBeUndefined()
  })

  it('should not mistake a shadowed Payload receiver for the imported binding', async () => {
    const source = `${config}async function read(payload: Payload) {
function nested(payload: unknown) { payload.find({ collection: 'posts', draft: true }) }
}`
    const result = await apply({ source })

    expect(result.source).toBe(source)
    expect(result.notes).toHaveLength(1)
  })

  it('should preserve unknown nested spreads without partially renaming draft', async () => {
    const source = `${config}async function write(payload: Payload) { await payload.update({ collection: 'posts', id: '1', draft: true, data: { ...changes } }) }`
    const result = await apply({ source })

    expect(result.source).toBe(source)
    expect(result.filesChanged).toEqual([])
    expect(result.notes).toHaveLength(1)
  })

  it('should handle nested matching calls and comments without corrupting syntax', async () => {
    const source = `${config}async function write(payload: Payload) {
await payload.update({
  collection: 'posts',
  id: '1',
  data: { related: await payload.find({ collection: 'posts', draft: true }) },
  draft /* source */: false,
})
}`
    const result = await apply({ source })
    const project = new Project({ useInMemoryFileSystem: true })
    const file = project.createSourceFile('/output.ts', result.source)

    expect(result.source.match(/version/g)).toHaveLength(3)
    expect(result.source).toContain("version /* source */: 'latest'")
    expect(project.getProgram().compilerObject.getSyntacticDiagnostics(file.compilerNode)).toEqual(
      [],
    )
    expect((await apply({ source: result.source })).source).toBe(result.source)
  })

  it('should resolve registered collection configurations across source files', async () => {
    const project = new Project({ useInMemoryFileSystem: true })
    project.createSourceFile(
      '/collections.ts',
      `export const Posts = { slug: 'posts', versions: { drafts: true }, fields: [] }`,
    )
    project.createSourceFile(
      '/config.ts',
      `import { buildConfig } from 'payload'; import { Posts } from './collections'; export default buildConfig({ collections: [Posts] })`,
    )
    const file = project.createSourceFile(
      '/calls.ts',
      `import type { Payload } from 'payload'; async function read(cms: Payload) { await cms.find({ collection: 'posts', draft: true }) }`,
    )
    const result = await transform.apply({ packageJsons: [], project })

    expect(file.getFullText()).toContain("version: 'latest'")
    expect(result.filesChanged).toEqual(['/calls.ts'])
  })
})

describe('review regressions', () => {
  it.each([
    'findVersions',
    'findVersionByID',
    'countVersions',
    'findGlobalVersions',
    'findGlobalVersionByID',
    'countGlobalVersions',
    'duplicate',
    'restoreVersion',
    'restoreGlobalVersion',
  ])(
    'should report specialized %s calls without assigning ordinary read semantics',
    async (operation) => {
      const source = `${config}async function read(payload: Payload) { await payload.${operation}({ collection: 'posts', draft: true }) }`
      const result = await apply({ source })

      expect(result.source).toBe(source)
      expect(result.filesChanged).toEqual([])
      expect(result.notes).toHaveLength(1)
    },
  )

  it('should migrate quoted keys with the same semantics as identifier keys', async () => {
    const source = `${config}async function read(payload: Payload) { await payload.find({ 'collection': 'posts', 'draft': true }) }`
    const result = await apply({ source })

    expect(result.source).toContain("version: 'latest'")
    expect(result.filesChanged).toEqual(['/input.ts'])
    expect(result.notes ?? []).toEqual([])
  })

  it('should not overwrite a quoted existing version selector', async () => {
    const source = `${config}async function read(payload: Payload) { await payload.find({ collection: 'posts', draft: true, 'version': 'published' }) }`
    const result = await apply({ source })

    expect(result.source).toBe(source)
    expect(result.filesChanged).toEqual([])
    expect(result.notes).toHaveLength(1)
  })

  it.each([
    `Posts.versions.drafts = false`,
    `mutate(Posts)`,
    `const alias = Posts; alias.versions.drafts = false`,
  ])('should not trust an escaping or mutated config: %s', async (mutation) => {
    const source =
      config.replace('export default buildConfig', `${mutation};\nexport default buildConfig`) +
      `async function write(payload: Payload) { await payload.update({ collection: 'posts', id: '1', draft: true, data: {} }) }`
    const result = await apply({ source })

    expect(result.source).toBe(source)
    expect(result.filesChanged).toEqual([])
    expect(result.notes).toHaveLength(1)
  })
})

describe('unresolved shorthand config', () => {
  it.each([
    "const versions = { drafts: true }; const Posts = { slug: 'posts', versions, fields: [] }",
    "const drafts = true; const Posts = { slug: 'posts', versions: { drafts }, fields: [] }",
  ])('should not classify unresolved shorthand as disabled drafts: %s', async (declaration) => {
    const source =
      config.replace(
        "const Posts: CollectionConfig = { slug: 'posts', versions: { drafts: true }, fields: [] }",
        declaration,
      ) +
      "async function read(payload: Payload) { await payload.find({ collection: 'posts', draft: true }) }"
    const result = await apply({ source })

    expect(result.source).toBe(source)
    expect(result.filesChanged).toEqual([])
    expect(result.notes).toHaveLength(1)
  })

  it('should not change validation when an explicit non-draft create saves draft status', async () => {
    const source = `${config}async function write(payload: Payload) { await payload.create({ collection: 'posts', draft: false, data: { _status: 'draft' } }) }`
    const result = await apply({ source })

    expect(result.source).toBe(source)
    expect(result.notes).toHaveLength(1)
  })
})

describe('locale capability safety', () => {
  it.each([
    'localization: runtimeLocalization',
    'localization',
    'localization: { ...localeSettings }',
  ])(
    'should preserve false publication flags when root localization is unresolved: %s',
    async (setting) => {
      const source =
        config
          .replace('fields: []', "fields: [{ name: 'title', type: 'text', localized: true }]")
          .replace('collections: [Posts]', `collections: [Posts], ${setting}`) +
        "async function write(payload: Payload) { await payload.update({ collection: 'posts', data: { _status: 'published' }, locale: 'all', publishAllLocales: false }) }"
      const result = await apply({ source })

      expect(result.source).toBe(source)
      expect(result.notes).toHaveLength(1)
    },
  )

  it('should not infer localized fields from arbitrary custom data', async () => {
    const source =
      localizedConfig.replace(
        "{ name: 'title', type: 'text', localized: true }",
        "{ name: 'title', type: 'text', custom: { localized: true } }",
      ) +
      "async function write(payload: Payload) { await payload.update({ collection: 'posts', data: {}, publishAllLocales: true }) }"
    const result = await apply({ source })

    expect(result.source).toBe(source)
    expect(result.notes).toHaveLength(1)
  })

  it('should report create validation differences even when draft was omitted', async () => {
    const source = `${config}async function write(payload: Payload) { await payload.create({ collection: 'posts', data: { _status: 'draft' } }) }`
    const result = await apply({ source })

    expect(result.source).toBe(source)
    expect(result.notes).toHaveLength(1)
  })
})

describe('completed config and locale migration', () => {
  it('should preserve calls when the buildConfig result is mutated', async () => {
    const source =
      config.replace(
        'export default buildConfig({ collections: [Posts] })',
        'const config = buildConfig({ collections: [Posts] }); config.collections[0].versions.drafts = false',
      ) +
      "async function read(payload: Payload) { await payload.find({ collection: 'posts', draft: true }) }"
    const result = await apply({ source })

    expect(result.source).toBe(source)
    expect(result.notes).toHaveLength(1)
  })

  it('should migrate quoted all-locale keys and global targets', async () => {
    const source =
      localizedConfig
        .replace("slug: 'posts'", "'slug': 'header'")
        .replace('collections: [Posts]', 'globals: [Posts]') +
      "async function write(payload: Payload) { await payload.updateGlobal({ 'slug': 'header', 'data': { '_status': 'draft' }, 'unpublishAllLocales': true, 'locale': 'en' }) }"
    const result = await apply({ source })

    expect(result.source).toContain("version: 'published'")
    expect(result.source).toContain("'locale': 'all'")
    expect(result.source).not.toContain("'unpublishAllLocales':")
    expect(result.notes ?? []).toEqual([])
    expect((await apply({ source: result.source })).filesChanged).toEqual([])
  })

  it('should recognize localized fields inside tabs', async () => {
    const source =
      localizedConfig.replace(
        "{ name: 'title', type: 'text', localized: true }",
        "{ type: 'tabs', tabs: [{ fields: [{ name: 'title', type: 'text', localized: true }] }] }",
      ) +
      "async function write(payload: Payload) { await payload.update({ collection: 'posts', data: {}, publishAllLocales: true }) }"
    const result = await apply({ source })

    expect(result.source).toContain("version: 'latest'")
    expect(result.notes ?? []).toEqual([])
  })

  it('should leave a dynamic locale shorthand unchanged', async () => {
    const source = `${localizedConfig}async function write(payload: Payload) { await payload.update({ collection: 'posts', data: {}, publishAllLocales: true, locale }) }`
    const result = await apply({ source })

    expect(result.source).toBe(source)
    expect(result.notes).toHaveLength(1)
  })
})

describe('non-draft target previews', () => {
  it('should not silently change preview population on a non-draft collection', async () => {
    const source =
      config
        .replace('versions: { drafts: true }', 'versions: false')
        .replace(
          'fields: []',
          "fields: [{ name: 'related', type: 'relationship', relationTo: 'other-posts' }]",
        ) +
      "async function read(payload: Payload) { await payload.find({ collection: 'posts', draft: true }) }"
    const result = await apply({ source })

    expect(result.source).toBe(source)
    expect(result.notes).toHaveLength(1)
    expect(result.filesChanged).toEqual([])
  })
})

describe('config mutators', () => {
  it.each([
    'plugins: [config => ({ ...config, collections: config.collections.map(c => ({ ...c, versions: false })) })]',
    'plugins: runtimePlugins',
    'plugins',
    'storage: [adapter()]',
    'storageAdapters: [adapter()]',
  ])('should not infer runtime capabilities through %s', async (setting) => {
    const source =
      config.replace('collections: [Posts]', `collections: [Posts], ${setting}`) +
      "async function write(payload: Payload) { await payload.create({ collection: 'posts', data: {}, draft: true }) }"
    const result = await apply({ source })

    expect(result.source).toBe(source)
    expect(result.filesChanged).toEqual([])
    expect(result.notes).toHaveLength(1)
  })

  it('should allow explicitly empty mutator arrays', async () => {
    const source =
      config.replace('collections: [Posts]', 'collections: [Posts], plugins: [], storage: []') +
      "async function read(payload: Payload) { await payload.find({ collection: 'posts', draft: true }) }"
    const result = await apply({ source })

    expect(result.source).toContain("version: 'latest'")
    expect(result.notes ?? []).toEqual([])
  })
})

describe('unresolved call defaults', () => {
  it('should report an unknown update receiver even when draft was omitted', async () => {
    const source = `${config}async function write(cms: unknown) { await cms.update({ collection: 'posts', data: {} }) }`
    const result = await apply({ source })

    expect(result.source).toBe(source)
    expect(result.notes).toHaveLength(1)
  })

  it('should report a read spread that can contain a legacy flag', async () => {
    const source = `${config}async function read(payload: Payload) { await payload.find({ collection: 'posts', ...options }) }`
    const result = await apply({ source })

    expect(result.source).toBe(source)
    expect(result.notes).toHaveLength(1)
  })
})
