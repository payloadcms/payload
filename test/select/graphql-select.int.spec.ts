import { fileURLToPath } from 'node:url'
import path from 'path'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

test.suite('GraphQL select projection', { config: './config.ts' }, () => {
  test('should keep a block relationship selection from an inline fragment', async ({
    payload,
    restClient,
  }) => {
    const relation = await payload.create({
      collection: 'rels',
      data: { text: 'inline fragment' },
      overrideAccess: true,
    })
    const document = await payload.create({
      collection: 'select-documents',
      data: {
        blocks: [{ blockType: 'select-relationship-block', link: relation.id }],
      },
      overrideAccess: true,
    })

    const query = `query {
      SelectDocument(id: ${formatGraphQLID({ id: document.id })}, select: true) {
        blocks {
          ... on SelectRelationshipBlock { link { id text } }
        }
      }
    }`

    const { data, errors } = await restClient
      .GRAPHQL_POST({ body: JSON.stringify({ query }) })
      .then((response) => response.json())

    expect(errors).toBeUndefined()
    expect(data.SelectDocument.blocks[0].link).toMatchObject({
      id: relation.id,
      text: 'inline fragment',
    })
  })

  test('should merge block relationship selections from named and inline fragments', async ({
    payload,
    restClient,
  }) => {
    const relation = await payload.create({
      collection: 'rels',
      data: { text: 'merged fragments' },
      overrideAccess: true,
    })
    const document = await payload.create({
      collection: 'select-documents',
      data: {
        blocks: [{ blockType: 'select-relationship-block', link: relation.id }],
      },
      overrideAccess: true,
    })

    const query = `query {
      SelectDocument(id: ${formatGraphQLID({ id: document.id })}, select: true) {
        blocks {
          ...SelectRelationshipBlockFields
          ... on SelectRelationshipBlock { link { text } }
        }
      }
    }

    fragment SelectRelationshipBlockFields on SelectRelationshipBlock {
      link { id }
    }`

    const { data, errors } = await restClient
      .GRAPHQL_POST({ body: JSON.stringify({ query }) })
      .then((response) => response.json())

    expect(errors).toBeUndefined()
    expect(data.SelectDocument.blocks[0].link).toMatchObject({
      id: relation.id,
      text: 'merged fragments',
    })
  })

  test('should keep a block relationship selection from a named fragment', async ({
    payload,
    restClient,
  }) => {
    const relation = await payload.create({
      collection: 'rels',
      data: { text: 'named fragment' },
      overrideAccess: true,
    })
    const document = await payload.create({
      collection: 'select-documents',
      data: {
        blocks: [{ blockType: 'select-relationship-block', link: relation.id }],
      },
      overrideAccess: true,
    })

    const query = `query {
      SelectDocument(id: ${formatGraphQLID({ id: document.id })}, select: true) {
        blocks { ...SelectRelationshipBlockFields }
      }
    }

    fragment SelectRelationshipBlockFields on SelectRelationshipBlock {
      link { id text }
    }`

    const { data, errors } = await restClient
      .GRAPHQL_POST({ body: JSON.stringify({ query }) })
      .then((response) => response.json())

    expect(errors).toBeUndefined()
    expect(data.SelectDocument.blocks[0].link).toMatchObject({
      id: relation.id,
      text: 'named fragment',
    })
  })

  test('should keep a relationship selection inside an upload', async ({ payload, restClient }) => {
    const relation = await payload.create({
      collection: 'rels',
      data: { text: 'inside upload' },
      overrideAccess: true,
    })
    const upload = await payload.create({
      collection: 'upload',
      data: { link: relation.id },
      filePath: path.resolve(dirname, 'image.jpg'),
      overrideAccess: true,
    })
    const document = await payload.create({
      collection: 'select-documents',
      data: { upload: upload.id },
      overrideAccess: true,
    })

    try {
      const query = `query {
        SelectDocument(id: ${formatGraphQLID({ id: document.id })}, select: true) {
          upload { link { id text } }
        }
      }`

      const { data, errors } = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query }) })
        .then((response) => response.json())

      expect(errors).toBeUndefined()
      expect(data.SelectDocument.upload.link).toMatchObject({
        id: relation.id,
        text: 'inside upload',
      })
    } finally {
      await payload.delete({
        id: document.id,
        collection: 'select-documents',
        overrideAccess: true,
      })
      await payload.delete({ id: upload.id, collection: 'upload', overrideAccess: true })
    }
  })
})

function formatGraphQLID({ id }: { id: number | string }) {
  return typeof id === 'string' ? `"${id}"` : id
}
