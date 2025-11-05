import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../../helpers/NextRESTClient.js'

import { devUser } from '../../credentials.js'
import { initPayloadInt } from '../../helpers/initPayloadInt.js'
import { collectionSlug } from './config.js'

let restClient: NextRESTClient | undefined
let payload: Payload | undefined

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Forgot password operation with localized fields', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname, 'auth/forgot-password-localized'))

    // Register a user with additional localized field
    const res = await restClient?.POST(`/${collectionSlug}/first-register?locale=en`, {
      body: JSON.stringify({
        ...devUser,
        'confirm-password': devUser.password,
        localizedField: 'English content',
      }),
    })

    if (!res) {
      throw new Error('Failed to register user')
    }

    const { user } = await res.json()

    // @ts-expect-error - Localized field is not in the general Payload type, but it is in mocked collection in this case.
    await payload?.update({
      collection: collectionSlug,
      id: user.id as string,
      locale: 'pl',
      data: {
        localizedField: 'Polish content',
      },
    })
  })

  afterAll(async () => {
    await payload.destroy()
  })

  it('should successfully process forgotPassword operation with localized fields', async () => {
    // Attempt to trigger forgotPassword operation
    const token = await payload?.forgotPassword({
      collection: collectionSlug,
      data: { email: devUser.email },
      disableEmail: true,
    })

    // Verify token was generated successfully
    expect(token).toBeDefined()
    expect(typeof token).toBe('string')
    expect(token?.length).toBeGreaterThan(0)
  })

  it('should not throw validation errors for localized fields', async () => {
    // We expect this not to throw an error
    await expect(
      payload?.forgotPassword({
        collection: collectionSlug,
        data: { email: devUser.email },
        disableEmail: true,
      }),
    ).resolves.not.toThrow()
  })
})
