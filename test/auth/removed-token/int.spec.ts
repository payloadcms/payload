import type { AuthCollectionSlug, CookieOptions, Payload, ServerAdapter } from 'payload'

import path from 'path'
import { login } from 'payload/auth'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../../__helpers/shared/initPayloadInt.js'
import { devUser } from '../../credentials.js'
import config, { collectionSlug, providerCookie } from './config.js'

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
    await payload.destroy()
  })

  it('should not include token in response from /login', async () => {
    const result = await restClient.login({
      slug: collectionSlug,
      credentials: devUser,
    })
    expect(result.token).not.toBeDefined()
    expect(result.user.email).toBeDefined()
    expect(result.user.roles).toBeUndefined()
  })

  it('should not include token in response from /me', async () => {
    const response = await restClient.GET(`/${collectionSlug}/me`)
    const result = await response.json()
    expect(response.status).toBe(200)
    expect(result.token).not.toBeDefined()
    expect(result.user.email).toBeDefined()
  })

  it('should preserve a provider cookie without including its token in the response', async () => {
    const response = await restClient.POST(`/${collectionSlug}/refresh-token`)
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('Set-Cookie')).toContain(providerCookie)
    expect(result.refreshedToken).not.toBeDefined()
    expect(result.user.email).toBeDefined()
  })

  it('should preserve access-controlled fields in the framework server login result', async () => {
    const setCookies: { name: string; options?: CookieOptions; value: string }[] = []

    const serverAdapter: ServerAdapter = {
      forbidden: () => {
        throw new Error('forbidden')
      },
      getCookies: () => ({ get: () => undefined, getAll: () => [] }),
      getHeaders: () => new Headers(),
      notFound: () => {
        throw new Error('notFound')
      },
      permanentRedirect: () => {
        throw new Error('permanentRedirect')
      },
      redirect: () => {
        throw new Error('redirect')
      },
      setCookie: (name, value, options) => {
        setCookies.push({ name, options, value })
      },
      unauthorized: () => {
        throw new Error('unauthorized')
      },
    }

    const result = await login({
      collection: collectionSlug as AuthCollectionSlug,
      config,
      email: devUser.email,
      password: devUser.password,
      serverAdapter,
    })

    expect(result.token).toBeUndefined()
    expect(result.user.email).toBe(devUser.email)
    expect(result.user.roles).toEqual(devUser.roles)

    // The session still has to be established via the cookie.
    expect(setCookies).toHaveLength(1)
    expect(setCookies[0]?.value).not.toBe('')
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
