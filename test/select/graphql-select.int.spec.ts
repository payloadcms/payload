import type { Payload } from 'payload'

import { fileURLToPath } from 'node:url'
import path from 'path'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
let payload: Payload
let restClient: NextRESTClient

describe('GraphQL select projection', () => {
  const createdDocumentIDs: (number | string)[] = []
  const createdUploadIDs: (number | string)[] = []
  const createdRelationIDs: (number | string)[] = []

  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    await payload.destroy()
  })

  afterEach(async () => {
    for (const id of createdDocumentIDs) {
      await payload.delete({ id, collection: 'select-documents', overrideAccess: true })
    }
    for (const id of createdUploadIDs) {
      await payload.delete({ id, collection: 'upload', overrideAccess: true })
    }
    for (const id of createdRelationIDs) {
      await payload.delete({ id, collection: 'rels', overrideAccess: true })
    }

    createdDocumentIDs.length = 0
    createdUploadIDs.length = 0
    createdRelationIDs.length = 0
  })

  it('should keep a block relationship selection from an inline fragment', async () => {
    const relation = await payload.create({
      collection: 'rels',
      data: { text: 'inline fragment' },
      overrideAccess: true,
    })
    createdRelationIDs.push(relation.id)
    const document = await payload.create({
      collection: 'select-documents',
      data: {
        blocks: [{ blockType: 'select-relationship-block', link: relation.id }],
      },
      overrideAccess: true,
    })
    createdDocumentIDs.push(document.id)

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

  it('should merge block relationship selections from named and inline fragments', async () => {
    const relation = await payload.create({
      collection: 'rels',
      data: { text: 'merged fragments' },
      overrideAccess: true,
    })
    createdRelationIDs.push(relation.id)
    const document = await payload.create({
      collection: 'select-documents',
      data: {
        blocks: [{ blockType: 'select-relationship-block', link: relation.id }],
      },
      overrideAccess: true,
    })
    createdDocumentIDs.push(document.id)

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

  it('should keep a block relationship selection from a named fragment', async () => {
    const relation = await payload.create({
      collection: 'rels',
      data: { text: 'named fragment' },
      overrideAccess: true,
    })
    createdRelationIDs.push(relation.id)
    const document = await payload.create({
      collection: 'select-documents',
      data: {
        blocks: [{ blockType: 'select-relationship-block', link: relation.id }],
      },
      overrideAccess: true,
    })
    createdDocumentIDs.push(document.id)

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

  it('should keep a relationship selection inside an upload', async () => {
    const relation = await payload.create({
      collection: 'rels',
      data: { text: 'inside upload' },
      overrideAccess: true,
    })
    createdRelationIDs.push(relation.id)
    const upload = await payload.create({
      collection: 'upload',
      data: { link: relation.id },
      filePath: path.resolve(dirname, 'image.jpg'),
      overrideAccess: true,
    })
    createdUploadIDs.push(upload.id)
    const document = await payload.create({
      collection: 'select-documents',
      data: { upload: upload.id },
      overrideAccess: true,
    })
    createdDocumentIDs.push(document.id)

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
  })
})

function formatGraphQLID({ id }: { id: number | string }) {
  return typeof id === 'string' ? `"${id}"` : id
}
