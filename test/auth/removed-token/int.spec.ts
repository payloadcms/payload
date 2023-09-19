import payload from '../../../packages/payload/src'
import { devUser } from '../../credentials'
import { initPayloadTest } from '../../helpers/configHelpers'
import { RESTClient } from '../../helpers/rest'
import { collectionSlug } from './config'

require('isomorphic-fetch')

let client: RESTClient

describe('Remove token from auth responses', () => {
  beforeAll(async () => {
    const config = await initPayloadTest({ __dirname, init: { local: false } })
    const { serverURL } = config
    client = new RESTClient(config, { serverURL, defaultSlug: collectionSlug })

    await client.endpoint(`/api/${collectionSlug}/first-register`, 'post', devUser)
    await client.login()
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy(payload)
    }
  })

  it('should not include token in response from /login', async () => {
    const { status, data } = await client.endpoint(`/api/${collectionSlug}/login`, 'post', devUser)
    expect(status).toBe(200)
    expect(data.token).not.toBeDefined()
    expect(data.user.email).toBeDefined()
  })

  it('should not include token in response from /me', async () => {
    const { status, data } = await client.endpointWithAuth(`/api/${collectionSlug}/me`)
    expect(status).toBe(200)
    expect(data.token).not.toBeDefined()
    expect(data.user.email).toBeDefined()
  })

  it('should not include token in response from /refresh-token', async () => {
    const { status, data } = await client.endpointWithAuth(
      `/api/${collectionSlug}/refresh-token`,
      'post',
    )
    expect(status).toBe(200)
    expect(data.refreshedToken).not.toBeDefined()
    expect(data.user.email).toBeDefined()
  })

  it('should not include token in response from /reset-password', async () => {
    const token = await payload.forgotPassword({
      collection: collectionSlug,
      data: { email: devUser.email },
      disableEmail: true,
    })

    const { status, data } = await client.endpoint(
      `/api/${collectionSlug}/reset-password`,
      'post',
      {
        token,
        password: devUser.password,
      },
    )

    expect(status).toBe(200)
    expect(data.token).not.toBeDefined()
    expect(data.user.email).toBeDefined()
  })
})
