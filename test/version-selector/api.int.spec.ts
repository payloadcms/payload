/* eslint-disable vitest/no-standalone-expect -- Shared test fixture callbacks are test blocks. */
import { configToSchema } from '@payloadcms/graphql'
import { graphql } from 'graphql'
import { createPayloadRequest, formatNames } from 'payload'
import { expect } from 'vitest'

// eslint-disable-next-line payload/no-relative-monorepo-imports -- Endpoint handlers are not publicly exported.
import { createHandler } from '../../packages/payload/src/collections/endpoints/create.js'
// eslint-disable-next-line payload/no-relative-monorepo-imports -- Endpoint handlers are not publicly exported.
import { findHandler } from '../../packages/payload/src/collections/endpoints/find.js'
import { test } from '../__helpers/int/vitest.js'
import { draftGlobalSlug, draftPostsSlug, localizedPostsSlug } from './slugs.js'

test.suite('Version selector APIs', { config: './config.ts' }, () => {
  test('should preserve complete locale maps with combined projections in either field order', async ({
    payload,
  }) => {
    const data = {
      details: {
        localizedNested: { en: { first: 'A', second: 'B' }, fr: { first: 'C', second: 'D' } },
      },
      localizedDetails: {
        en: { body: 'English body', heading: 'English' },
        fr: { body: 'Corps français', heading: 'Français' },
      },
      localizedRows: {
        en: [{ label: 'English row', note: 'English note' }],
        fr: [{ label: 'Ligne française', note: 'Note française' }],
      },
      title: { en: 'English', fr: 'Français' },
    }
    const created = await payload.create({
      collection: localizedPostsSlug,
      data,
      locale: 'all',
      version: 'published',
    })
    const { schema } = configToSchema(payload.config)
    const names = formatNames(localizedPostsSlug)
    const type = schema
      .getQueryType()!
      .getFields()
      [names.singular]!.type.toString()
      .replace(/!/g, '')

    for (const isCompanionFirst of [true, false]) {
      const companions =
        'details: localizedDetails_locales rows: localizedRows_locales nestedDetails: details { localizedNested_locales }'
      const result = await graphql({
        contextValue: { req: await createPayloadRequest({ payload }) },
        schema,
        source: `query { document: ${names.singular}(id: ${JSON.stringify(created.id)}, locale: all, select: true) {
          ${isCompanionFirst ? `${companions} ...PartialFields` : `...PartialFields ${companions}`}
        } } fragment PartialFields on ${type} { narrowDetails: localizedDetails { heading } narrowNestedDetails: details { localizedNested { first } } }`,
      })

      expect(result.errors).toBeUndefined()
      expect(result.data?.document).toMatchObject({
        details: data.localizedDetails,
        nestedDetails: { localizedNested_locales: data.details.localizedNested },
        rows: data.localizedRows,
      })
    }
  })

  test('should keep the outer GraphQL selector when a create hook creates another version', async ({
    payload,
  }) => {
    const child = await payload.create({
      collection: draftPostsSlug,
      data: { title: 'Live child' },
      version: 'published',
    })
    const config = payload.collections[draftPostsSlug].config
    const previousHooks = config.hooks.afterChange

    config.hooks.afterChange = [
      ...previousHooks,
      async ({ doc, operation, req }) => {
        if (operation === 'create' && doc.title === 'Hooked parent') {
          await req.payload.create({
            collection: draftPostsSlug,
            data: { title: 'Nested pending' },
            req,
            version: 'draft',
          })
        }
        return doc
      },
    ]
    try {
      const { schema } = configToSchema(payload.config)
      const names = formatNames(draftPostsSlug)
      const result = await graphql({
        contextValue: { req: await createPayloadRequest({ payload }) },
        schema,
        source: `mutation { parent: create${names.singular}(version: published, data: { title: "Hooked parent", related: ${JSON.stringify(child.id)} }) { _status related { title } } }`,
      })

      expect(result.errors).toBeUndefined()
      expect(result.data?.parent).toMatchObject({
        _status: 'published',
        related: { title: 'Live child' },
      })
    } finally {
      config.hooks.afterChange = previousHooks
    }
  })

  test('should project stored localized groups and arrays for GraphQL locale companions', async ({
    payload,
  }) => {
    const created = await payload.create({
      collection: localizedPostsSlug,
      data: {
        localizedDetails: { en: { heading: 'English heading' }, fr: { heading: 'Titre français' } },
        localizedRows: { en: [{ label: 'English row' }], fr: [{ label: 'Ligne française' }] },
        title: { en: 'English', fr: 'Français' },
      },
      locale: 'all',
      version: 'published',
    })
    const { schema } = configToSchema(payload.config)
    const names = formatNames(localizedPostsSlug)

    for (const select of [false, true]) {
      const result = await graphql({
        contextValue: { req: await createPayloadRequest({ payload }) },
        schema,
        source: `query { document: ${names.singular}(id: ${JSON.stringify(created.id)}, locale: all, select: ${select}) {
          rows: localizedRows_locales
          ...LocaleDetails
        } }
        fragment LocaleDetails on ${schema.getQueryType()!.getFields()[names.singular]!.type.toString().replace(/!/g, '')} { details: localizedDetails_locales }`,
      })

      expect(result.errors).toBeUndefined()
      expect(result.data?.document).toMatchObject({
        details: { en: { heading: 'English heading' }, fr: { heading: 'Titre français' } },
        rows: { en: [{ label: 'English row' }], fr: [{ label: 'Ligne française' }] },
      })
    }
  })

  test('should populate a GraphQL create response as published when status publishes without a selector', async ({
    payload,
  }) => {
    const child = await payload.create({
      collection: draftPostsSlug,
      data: { title: 'Published child' },
      version: 'published',
    })
    const { schema } = configToSchema(payload.config)
    const names = formatNames(draftPostsSlug)
    const result = await graphql({
      contextValue: { req: await createPayloadRequest({ payload }) },
      schema,
      source: `mutation { created: create${names.singular}(data: { title: "Published parent", _status: published, related: ${JSON.stringify(child.id)} }) { id _status related { id title } } }`,
    })

    expect(result.errors).toBeUndefined()
    expect(result.data?.created).toMatchObject({
      _status: 'published',
      related: { title: 'Published child' },
    })
    expect((await payload.find({ collection: draftPostsSlug })).totalDocs).toBe(2)
  })

  test('should honor explicit create selectors independently of status data in GraphQL responses', async ({
    payload,
  }) => {
    const child = await payload.create({
      collection: draftPostsSlug,
      data: { title: 'Published child' },
      version: 'published',
    })

    await payload.update({
      id: child.id,
      collection: draftPostsSlug,
      data: { title: 'Pending child' },
    })
    const { schema } = configToSchema(payload.config)
    const names = formatNames(draftPostsSlug)
    const result = await graphql({
      contextValue: { req: await createPayloadRequest({ payload }) },
      schema,
      source: `mutation {
        live: create${names.singular}(version: published, data: { title: "Live parent", _status: draft, related: ${JSON.stringify(child.id)} }) { _status related { title } }
        pending: create${names.singular}(version: draft, data: { title: "Pending parent", _status: published, related: ${JSON.stringify(child.id)} }) { _status related { title } }
      }`,
    })

    expect(result.errors).toBeUndefined()
    expect(result.data?.live).toMatchObject({
      _status: 'published',
      related: { title: 'Published child' },
    })
    expect(result.data?.pending).toMatchObject({
      _status: 'draft',
      related: { title: 'Pending child' },
    })
  })

  test('should populate a GraphQL create response using the selector chosen by beforeOperation', async ({
    payload,
  }) => {
    const child = await payload.create({
      collection: draftPostsSlug,
      data: { title: 'Published child' },
      version: 'published',
    })
    const config = payload.collections[draftPostsSlug].config
    const previousHooks = config.hooks.beforeOperation

    config.hooks.beforeOperation = [
      ({ args, operation }) => {
        if (operation === 'create') {
          args.version = 'published'
        }
        return args
      },
    ]
    try {
      const { schema } = configToSchema(payload.config)
      const names = formatNames(draftPostsSlug)
      const result = await graphql({
        contextValue: { req: await createPayloadRequest({ payload }) },
        schema,
        source: `mutation { created: create${names.singular}(data: { title: "Hook parent", related: ${JSON.stringify(child.id)} }) { _status related { title } } }`,
      })

      expect(result.errors).toBeUndefined()
      expect(result.data?.created).toMatchObject({
        _status: 'published',
        related: { title: 'Published child' },
      })
    } finally {
      config.hooks.beforeOperation = previousHooks
    }
  })

  test('should preserve create population when the status output is hidden by access', async ({
    payload,
  }) => {
    const child = await payload.create({
      collection: draftPostsSlug,
      data: { title: 'Published child' },
      version: 'published',
    })
    const status = payload.collections[draftPostsSlug].config.fields.find(
      (field) => 'name' in field && field.name === '_status',
    )!
    const previousAccess = status.access

    status.access = { ...previousAccess, read: () => false }
    try {
      const { schema } = configToSchema(payload.config)
      const names = formatNames(draftPostsSlug)
      const req = await createPayloadRequest({ payload })
      const result = await graphql({
        contextValue: { req },
        schema,
        source: `mutation { created: create${names.singular}(data: { title: "Parent", _status: published, related: ${JSON.stringify(child.id)} }) { related { title } } }`,
      })

      expect(result.errors).toBeUndefined()
      expect(result.data?.created).toMatchObject({ related: { title: 'Published child' } })
      expect(req.query.version).toBeUndefined()
    } finally {
      status.access = previousAccess
    }
  })

  test('should populate concurrent GraphQL root reads using their own version selectors', async ({
    payload,
  }) => {
    const child = await payload.create({
      collection: draftPostsSlug,
      data: { title: 'Published child' },
      version: 'published',
    })
    const parent = await payload.create({
      collection: draftPostsSlug,
      data: { related: child.id, title: 'Parent' },
      version: 'published',
    })

    await payload.update({
      id: child.id,
      collection: draftPostsSlug,
      data: { title: 'Pending child' },
    })
    await payload.update({
      id: parent.id,
      collection: draftPostsSlug,
      data: { title: 'Pending parent' },
    })
    const { schema } = configToSchema(payload.config)
    const names = formatNames(draftPostsSlug)
    const result = await graphql({
      contextValue: { req: await createPayloadRequest({ payload }) },
      schema,
      source: `query {
      live: ${names.singular}(id: ${JSON.stringify(parent.id)}, version: published) { related { title } }
      pending: ${names.singular}(id: ${JSON.stringify(parent.id)}, version: draft) { related { title } }
    }`,
    })

    expect(result.errors).toBeUndefined()
    expect(result.data?.live).toMatchObject({ related: { title: 'Published child' } })
    expect(result.data?.pending).toMatchObject({ related: { title: 'Pending child' } })
  })

  test('should create a draft by default through GraphQL and hide it from published queries', async ({
    payload,
  }) => {
    const { schema } = configToSchema(payload.config)
    const names = formatNames(payload.collections[draftPostsSlug].config.slug)
    const createField = schema.getMutationType()!.getFields()[`create${names.singular}`]!
    const listField = schema.getQueryType()!.getFields()[names.plural]!
    const req = await createPayloadRequest({ payload })
    const created = await graphql({
      contextValue: { req },
      schema,
      source: `mutation { created: ${createField.name}(data: {}) { id _status } }`,
    })

    expect(created.errors).toBeUndefined()
    expect(created.data?.created).toMatchObject({ _status: 'draft' })

    const published = await graphql({
      contextValue: { req: await createPayloadRequest({ payload }) },
      schema,
      source: `query { documents: ${listField.name} { docs { id } totalDocs } }`,
    })

    expect(published.errors).toBeUndefined()
    expect(published.data?.documents).toMatchObject({ docs: [], totalDocs: 0 })

    const latest = await graphql({
      contextValue: { req: await createPayloadRequest({ payload }) },
      schema,
      source: `query { documents: ${listField.name}(version: latest) { docs { id } totalDocs } }`,
    })

    expect(latest.errors).toBeUndefined()
    expect(latest.data?.documents).toMatchObject({ totalDocs: 1 })
  })

  test('should accept locale maps through GraphQL mutations and expose localized structured fields', async ({
    payload,
  }) => {
    const { schema } = configToSchema(payload.config)
    const names = formatNames(payload.collections[localizedPostsSlug].config.slug)
    const createField = schema.getMutationType()!.getFields()[`create${names.singular}`]!
    const updateField = schema.getMutationType()!.getFields()[`update${names.singular}`]!
    const created = await graphql({
      contextValue: { req: await createPayloadRequest({ payload }) },
      schema,
      source: `mutation {
        created: ${createField.name}(locale: all, data: {
          title: {en: "English title", fr: "French title"},
          details: {heading: {en: "English heading", fr: "French heading"}, note: "Shared note"},
          localizedRows: {en: [{label: "English row"}], fr: [{label: "French row"}]}
        }) { id title details { heading note } localizedRows_locales }
      }`,
    })

    expect(created.errors).toBeUndefined()
    expect(created.data?.created).toMatchObject({
      details: { heading: { en: 'English heading', fr: 'French heading' }, note: 'Shared note' },
      localizedRows_locales: { en: [{ label: 'English row' }], fr: [{ label: 'French row' }] },
      title: { en: 'English title', fr: 'French title' },
    })

    const updated = await graphql({
      contextValue: { req: await createPayloadRequest({ payload }) },
      schema,
      source: `mutation {
        updated: ${updateField.name}(id: ${JSON.stringify((created.data?.created as { id: number | string }).id)}, locale: all,
          data: {title: {fr: "Updated French title"}}
        ) { title localizedRows_locales }
      }`,
    })

    expect(updated.errors).toBeUndefined()
    expect(updated.data?.updated).toMatchObject({
      localizedRows_locales: { en: [{ label: 'English row' }], fr: [{ label: 'French row' }] },
      title: { en: 'English title', fr: 'Updated French title' },
    })
  })

  test('should retain the draft selector when populating rich text relationships through Local API and GraphQL', async ({
    payload,
  }) => {
    const related = await payload.create({
      collection: draftPostsSlug,
      data: { title: 'Published relationship' },
      version: 'published',
    })
    const parent = await payload.create({
      collection: draftPostsSlug,
      data: {
        richText: createRelationshipRichText({ id: related.id }),
        title: 'Draft parent',
      },
    })
    const { schema } = configToSchema(payload.config)
    const names = formatNames(payload.collections[draftPostsSlug].config.slug)
    const findField = schema.getQueryType()!.getFields()[names.singular]!

    const aliased = await graphql({
      contextValue: { req: await createPayloadRequest({ payload }) },
      schema,
      source: `query {
        draftParent: ${findField.name}(id: ${JSON.stringify(parent.id)}, version: draft) { richText(depth: 1) }
        latestParent: ${findField.name}(id: ${JSON.stringify(parent.id)}, version: latest) { richText(depth: 1) }
      }`,
    })

    expect(aliased.errors).toBeUndefined()
    expect(aliased.data?.draftParent).toMatchObject({
      richText: { root: { children: [{ value: null }] } },
    })
    expect(aliased.data?.latestParent).toMatchObject({
      richText: {
        root: { children: [{ value: { id: related.id, title: 'Published relationship' } }] },
      },
    })

    for (const version of ['draft', 'latest'] as const) {
      const local = await payload.findByID({
        id: parent.id,
        collection: draftPostsSlug,
        depth: 1,
        version,
      })
      const result = await graphql({
        contextValue: { req: await createPayloadRequest({ payload }) },
        schema,
        source: `query { parent: ${findField.name}(id: ${JSON.stringify(parent.id)}, version: ${version}) { richText(depth: 1) } }`,
      })

      expect(result.errors).toBeUndefined()

      const graphqlParent = result.data?.parent as {
        richText: { root: { children: { value: unknown }[] } }
      }
      const localValue = local.richText.root.children[0].value
      const graphqlValue = graphqlParent.richText.root.children[0]!.value

      if (version === 'draft') {
        expect(localValue).toBeNull()
        expect(graphqlValue).toBeNull()
      } else {
        expect(localValue).toMatchObject({ id: related.id, title: 'Published relationship' })
        expect(graphqlValue).toMatchObject({ id: related.id, title: 'Published relationship' })
      }
    }
  })

  test('should retain the draft selector when populating a Local API update response', async ({
    payload,
  }) => {
    const related = await payload.create({
      collection: draftPostsSlug,
      data: { title: 'Published relationship' },
      version: 'published',
    })
    const parent = await payload.create({
      collection: draftPostsSlug,
      data: { title: 'Draft parent' },
      depth: 0,
    })
    const updated = await payload.update({
      id: parent.id,
      collection: draftPostsSlug,
      data: { richText: createRelationshipRichText({ id: related.id }) },
      depth: 1,
      version: 'draft',
    })

    expect(updated.richText.root.children[0].value).toBeNull()
  })

  test('should reject latest and the retired draft argument on GraphQL create', async ({
    payload,
  }) => {
    const { schema } = configToSchema(payload.config)
    const names = formatNames(payload.collections[draftPostsSlug].config.slug)
    const createField = schema.getMutationType()!.getFields()[`create${names.singular}`]!

    for (const selector of ['version: latest', 'draft: true']) {
      const result = await graphql({
        contextValue: { req: await createPayloadRequest({ payload }) },
        schema,
        source: `mutation { ${createField.name}(data: {}, ${selector}) { id } }`,
      })

      expect(result.errors).toHaveLength(1)
      expect(result.data).toBeUndefined()
    }

    const result = await payload.find({ collection: draftPostsSlug, version: 'latest' })

    expect(result.totalDocs).toBe(0)
  })

  test('should create drafts through REST and honor latest on REST reads', async ({ payload }) => {
    const response = await createHandler(
      await createPayloadRequest({
        payload,
        req: { data: {}, query: {}, routeParams: { collection: draftPostsSlug } },
      }),
    )
    const created = await response.json()

    expect(response.status).toBe(201)
    expect(created.doc._status).toBe('draft')

    const published = await findHandler(
      await createPayloadRequest({
        payload,
        req: { query: {}, routeParams: { collection: draftPostsSlug } },
      }),
    )
    const latest = await findHandler(
      await createPayloadRequest({
        payload,
        req: { query: { version: 'latest' }, routeParams: { collection: draftPostsSlug } },
      }),
    )

    expect((await published.json()).totalDocs).toBe(0)
    expect((await latest.json()).totalDocs).toBe(1)
  })

  test('should reject invalid and retired selectors before REST creates a document', async ({
    payload,
  }) => {
    for (const query of [{ version: 'latest' }, { version: 'invalid' }, { draft: 'false' }]) {
      const req = await createPayloadRequest({
        payload,
        req: { data: {}, query, routeParams: { collection: draftPostsSlug } },
      })

      await expect(createHandler(req)).rejects.toMatchObject({ status: 400 })
    }
  })

  test('should reject retired options from JavaScript Local API callers', async ({ payload }) => {
    const options = { collection: draftPostsSlug, data: {}, draft: false } as Parameters<
      typeof payload.create
    >[0]

    await expect(payload.create(options)).rejects.toMatchObject({ status: 400 })
  })

  test('should restore localized collection drafts without replacing published content', async ({
    payload,
  }) => {
    const doc = await payload.create({
      collection: localizedPostsSlug,
      data: { title: { en: 'Original English', fr: 'Original French' } },
      locale: 'all',
      version: 'published',
    })
    const versions = await payload.findVersions({
      collection: localizedPostsSlug,
      locale: 'all',
      where: { parent: { equals: doc.id } },
    })
    const originalVersion = versions.docs[0]!

    await payload.update({
      id: doc.id,
      collection: localizedPostsSlug,
      data: { title: 'Revised English' },
      locale: 'en',
      version: 'published',
    })
    await payload.update({
      id: doc.id,
      collection: localizedPostsSlug,
      data: { title: 'Working English' },
      locale: 'en',
    })
    await payload.restoreVersion({
      id: String(originalVersion.id),
      collection: localizedPostsSlug,
      locale: 'all',
      version: 'draft',
    })

    const published = await payload.findByID({
      id: doc.id,
      collection: localizedPostsSlug,
      locale: 'en',
      version: 'published',
    })
    const draft = await payload.findByID({
      id: doc.id,
      collection: localizedPostsSlug,
      locale: 'all',
      version: 'draft',
    })

    expect(published.title).toBe('Revised English')
    expect(draft.title).toEqual({ en: 'Original English', fr: 'Original French' })
    expect(draft._status).toEqual({ en: 'draft', fr: 'draft' })
  })

  test('should preserve active global drafts when restoring a published localized version', async ({
    payload,
  }) => {
    await payload.updateGlobal({
      slug: draftGlobalSlug,
      data: { _status: 'published', title: { en: 'Original English', fr: 'Original French' } },
      locale: 'all',
    })

    const versions = await payload.findGlobalVersions({ slug: draftGlobalSlug, locale: 'all' })
    const originalVersion = versions.docs[0]!

    await payload.updateGlobal({
      slug: draftGlobalSlug,
      data: { title: 'Revised English' },
      locale: 'en',
      version: 'published',
    })
    await payload.updateGlobal({
      slug: draftGlobalSlug,
      data: { title: 'Working English' },
      locale: 'en',
    })
    await payload.restoreGlobalVersion({
      id: String(originalVersion.id),
      slug: draftGlobalSlug,
      locale: 'all',
      version: 'published',
    })

    const published = await payload.findGlobal({
      slug: draftGlobalSlug,
      locale: 'all',
      version: 'published',
    })
    const draft = await payload.findGlobal({
      slug: draftGlobalSlug,
      locale: 'en',
      version: 'draft',
    })

    expect(published.title).toEqual({ en: 'Original English', fr: 'Original French' })
    expect(draft.title).toBe('Working English')
  })
})

function createRelationshipRichText({ id }: { id: number | string }) {
  return {
    root: {
      type: 'root',
      children: [
        { type: 'relationship', format: '', relationTo: draftPostsSlug, value: id, version: 2 },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}
