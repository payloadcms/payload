import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'

import { devUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { collectionSlug, doc, isConnected, isInit } from './config.js'

let payload: Payload
let token: string
let restClient: NextRESTClient

const { email, password } = devUser
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Collection Database Operations', () => {
  // --__--__--__--__--__--__--__--__--__
  // Boilerplate test setup/teardown
  // --__--__--__--__--__--__--__--__--__
  beforeAll(async () => {
    const initialized = await initPayloadInt(dirname)
    ;({ payload, restClient } = initialized)

    const data = await restClient
      .POST('/users/login', {
        body: JSON.stringify({
          email,
          password,
        }),
      })
      .then((res) => res.json())

    token = data.token
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  // --__--__--__--__--__--__--__--__--__
  // Custom Collection DB Operations
  // --__--__--__--__--__--__--__--__--__

  it('collection DB Init', () => {
    expect(isInit).toEqual(true)
  })

  it('collection DB Connect', () => {
    expect(isConnected).toEqual(true)
  })

  it('collection DB Create', async () => {
    const result = await payload.create({
      collection: collectionSlug,
      data: {
        id: doc.id,
      },
    })

    expect(result.id).toEqual(doc.id)
    expect(result.customData).toEqual(doc.customData)
  })

  it('collection DB Update', async () => {
    const where = { id: { equals: doc.id } }
    const result = await payload.update({
      collection: collectionSlug,
      where,
      data: {
        id: doc.id,
      },
    })

    expect(result.docs[0].id).toEqual(doc.id)
    expect(result.docs[0].customData).toEqual(doc.customData)
    expect(result.docs[0].updated).toEqual(true)
  })

  it('collection DB Find', async () => {
    const where = { id: { equals: doc.id } }
    const result = await payload.find({
      collection: collectionSlug,
      where,
    })

    expect(result.docs[0].id).toEqual(doc.id)
    expect(result.docs[0].customData).toEqual(doc.customData)
  })

  it('collection DB Find One', async () => {
    const result = await payload.findByID({
      collection: collectionSlug,
      id: doc.id,
    })

    expect(result.id).toEqual(doc.id)
    expect(result.customData).toEqual(doc.customData)
  })

  it('collection DB Delete', async () => {
    const where = { id: { equals: doc.id } }

    const result = await payload.delete({
      collection: collectionSlug,
      depth: 0,
      user: devUser,
      where,
    })

    expect(result.docs[0].id).toEqual(doc.id)
    expect(result.docs[0].customData).toEqual(doc.customData)
    expect(result.errors).toHaveLength(0)
  })

  it.todo('support Relationships in Collection DB Operations')
  it.skip('collection Relationship', async () => {
    const result = await payload.create({
      collection: collectionSlug,
      data: {
        id: doc.id,
        otherCollection: {
          id: doc.id,
        },
      },
    })

    expect(result.id).toEqual(doc.id)
    expect(result.customData).toEqual(doc.customData)
    expect(result.related.id).toEqual(doc.id)
  })
})
