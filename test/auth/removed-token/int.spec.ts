import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../../helpers/NextRESTClient.js'

import { devUser } from '../../credentials.js'
import { initPayloadInt } from '../../helpers/initPayloadInt.js'
import { collectionSlug } from './config.js'

let restClient: NextRESTClient
let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Remove token from auth responses', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname, 'auth/removed-token'))

    await restClient.POST(`/${collectionSlug}/first-register`, {
      body: JSON.stringify({ ...devUser, 'confirm-password': devUser.password }),
    })
    await restClient.login({ slug: collectionSlug, credentials: devUser })
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  it('should not include token in response from /login', async () => {
    const result = await restClient.login({
      slug: collectionSlug,
      credentials: devUser,
    })
    expect(result.token).not.toBeDefined()
    expect(result.user.email).toBeDefined()
  })

  it('should not include token in response from /me', async () => {
    const response = await restClient.GET(`/${collectionSlug}/me`)
    const result = await response.json()
    expect(response.status).toBe(200)
    expect(result.token).not.toBeDefined()
    expect(result.user.email).toBeDefined()
  })

  it('should not include token in response from /refresh-token', async () => {
    const response = await restClient.POST(`/${collectionSlug}/refresh-token`)
    const result = await response.json()
    expect(response.status).toBe(200)
    expect(result.refreshedToken).not.toBeDefined()
    expect(result.user.email).toBeDefined()
  })

  it('should not include token in response from /reset-password', async () => {
    const token = await payload.forgotPassword({
      collection: collectionSlug,
      data: { email: devUser.email },
      disableEmail: true,
    })

    const response = await restClient.POST(`/${collectionSlug}/reset-password`, {
      body: JSON.stringify({ password: devUser.password, token }),
    })
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result.token).not.toBeDefined()
    expect(result.user.email).toBeDefined()
  })
})
