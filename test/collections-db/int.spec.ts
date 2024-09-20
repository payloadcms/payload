import payload from '../../packages/payload/src'
import { devUser } from '../credentials'
import { initPayloadTest } from '../helpers/configHelpers'
import { collectionSlug, isConnected, isInit } from './config'
import { doc } from './config'

require('isomorphic-fetch')

let apiUrl
let jwt

const headers = {
  'Content-Type': 'application/json',
}
const { email, password } = devUser

describe('Collection Database Operations', () => {
  // --__--__--__--__--__--__--__--__--__
  // Boilerplate test setup/teardown
  // --__--__--__--__--__--__--__--__--__
  beforeAll(async () => {
    const { serverURL } = await initPayloadTest({ __dirname, init: { local: false } })
    apiUrl = `${serverURL}/api`

    const response = await fetch(`${apiUrl}/users/login`, {
      body: JSON.stringify({
        email,
        password,
      }),
      headers,
      method: 'POST',
    })

    const data = await response.json()
    jwt = data.token
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy(payload)
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
