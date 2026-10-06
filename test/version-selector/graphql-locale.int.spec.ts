/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Integration tests use the shared fixture wrapper. */
import { configToSchema } from '@payloadcms/graphql'
import { graphql } from 'graphql'
import { readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { createPayloadRequest, formatNames } from 'payload'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { uploadDirectory } from './collections/media.js'
import { draftMediaSlug, localizedPostsSlug } from './slugs.js'

test.suite('GraphQL create locale inheritance', { config: './graphql-locale-config.ts' }, () => {
  test.afterEach(async () => {
    await rm(uploadDirectory, { recursive: true, force: true })
  })

  test('should populate each create response using its own locale through nested fields', async ({
    payload,
  }) => {
    const grandchild = await payload.create({
      collection: localizedPostsSlug,
      locale: 'all',
      version: 'published',
      data: { title: { en: 'English grandchild', fr: 'Petit-enfant français' } },
    })
    const childData = {
      title: { en: 'English child', fr: 'Enfant français' },
      related: grandchild.id,
    }
    const child = await payload.create({
      collection: localizedPostsSlug,
      locale: 'all',
      version: 'published',
      data: childData,
    })
    const bytes = await readFile(path.resolve('test/versions/image.png'))
    const media = await payload.create({
      collection: draftMediaSlug,
      locale: 'all',
      version: 'published',
      data: { title: { en: 'English media', fr: 'Média français' } },
      file: { name: 'locale.png', data: bytes, mimetype: 'image/png', size: bytes.length },
    })
    const relationship = {
      related: child.id,
      upload: media.id,
      relatedMany: [child.id],
      polymorphic: { relationTo: localizedPostsSlug.replaceAll('-', '_'), value: child.id },
      polymorphicUpload: { relationTo: draftMediaSlug.replaceAll('-', '_'), value: media.id },
    }
    const richText = {
      root: {
        type: 'root',
        version: 1,
        format: '',
        indent: 0,
        direction: null,
        children: [
          {
            type: 'relationship',
            version: 3,
            format: '',
            relationTo: localizedPostsSlug,
            value: child.id,
          },
        ],
      },
    }
    const data = {
      title: 'Parent',
      ...relationship,
      group: relationship,
      tab: relationship,
      rows: [relationship],
      richText,
    }
    const { schema } = configToSchema(payload.config)
    const name = `create${formatNames(localizedPostsSlug).singular}`
    const dataType = schema
      .getMutationType()!
      .getFields()
      [name]!.args.find((arg) => arg.name === 'data')!
      .type.toString()
    const selection = `related { title related { title } } upload { title } relatedMany { title related { title } } polymorphic { value { ... on ${formatNames(localizedPostsSlug).singular} { title related { title } } } } polymorphicUpload { value { ... on ${formatNames(draftMediaSlug).singular} { title } } } explicit: related(locale: en) { title related { title } } group { related { title } upload { title } } tab { related { title } upload { title } } rows { related { title } upload { title } } children { docs { title } } richText`
    const req = await createPayloadRequest({ payload })
    const result = await graphql({
      schema,
      contextValue: { req },
      source: `mutation($frenchData: ${dataType}, $englishData: ${dataType}) { french: ${name}(locale: fr, version: published, data: $frenchData) { ${selection} } english: ${name}(version: published, data: $englishData) { ${selection} } }`,
      variableValues: { frenchData: structuredClone(data), englishData: structuredClone(data) },
    })

    expect(result.errors).toBeUndefined()
    expect(req.locale).toBe('en')
    for (const [alias, childTitle, grandchildTitle, mediaTitle] of [
      ['french', 'Enfant français', 'Petit-enfant français', 'Média français'],
      ['english', 'English child', 'English grandchild', 'English media'],
    ]) {
      const expected = { related: { title: childTitle }, upload: { title: mediaTitle } }
      expect(result.data?.[alias]).toMatchObject({
        related: { title: childTitle, related: { title: grandchildTitle } },
        upload: { title: mediaTitle },
        relatedMany: [{ title: childTitle, related: { title: grandchildTitle } }],
        polymorphic: { value: { title: childTitle, related: { title: grandchildTitle } } },
        polymorphicUpload: { value: { title: mediaTitle } },
        explicit: { title: 'English child', related: { title: 'English grandchild' } },
        children: { docs: [{ title: `Joined ${alias === 'french' ? 'fr' : 'en'}` }] },
        group: expected,
        tab: expected,
        rows: [expected],
        richText: { root: { children: [{ value: { title: childTitle } }] } },
      })
    }
  })
})
