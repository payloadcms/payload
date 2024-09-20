import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'

import { devUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { doc, globalSlug, isConnected, isInit, updateNoGlobal } from './config.js'

let payload: Payload
let token: string
let restClient: NextRESTClient

const { email, password } = devUser
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Global Database Operations', () => {
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

  afterEach(() => {
    updateNoGlobal(false)
  })

  // --__--__--__--__--__--__--__--__--__
  // Custom Global DB Operations
  // --__--__--__--__--__--__--__--__--__

  it('global DB Init', () => {
    expect(isInit).toEqual(true)
  })

  it('global DB Connect', () => {
    expect(isConnected).toEqual(true)
  })

  it('global DB Create', async () => {
    updateNoGlobal(true)
    const result = await payload.updateGlobal({
      slug: globalSlug,
      data: {
        id: doc.id,
      },
    })
    expect(result.id).toEqual(doc.id)
    expect(result.customData).toEqual(doc.customData)
  })

  it('global DB Update', async () => {
    const result = await payload.updateGlobal({
      slug: globalSlug,
      data: {
        id: doc.id,
      },
    })

    expect(result.id).toEqual(doc.id)
    expect(result.customData).toEqual(doc.customData)
    expect(result.updated).toEqual(true)
  })

  it('global DB Find', async () => {
    const result = await payload.findGlobal({
      slug: globalSlug,
    })

    expect(result.id).toEqual(doc.id)
    expect(result.customData).toEqual(doc.customData)
  })

  it('global DB find versions', async () => {
    const result = await payload.findGlobalVersions({
      slug: globalSlug,
    })

    expect(result.docs[0].id).toEqual(doc.id)
    // @ts-expect-error
    expect(result.docs[0].customData).toEqual(doc.customData)
  })
})
