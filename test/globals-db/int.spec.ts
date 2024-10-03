import payload from '../../packages/payload/src'
import { devUser } from '../credentials'
import { initPayloadTest } from '../helpers/configHelpers'
import { globalSlug, isConnected, isInit, updateNoGlobal } from './config'
import { doc } from './config'

require('isomorphic-fetch')

let apiUrl
let jwt

const headers = {
  'Content-Type': 'application/json',
}
const { email, password } = devUser

describe('Global Database Operations', () => {
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
