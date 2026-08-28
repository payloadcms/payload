import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import { test } from '../../__helpers/int/vitest.js'
import { devUser } from '../../credentials.js'
import testConfig, { collectionSlug } from './config.js'

test.suite({ config: testConfig })('Forgot password operation with localized fields', () => {
  test.beforeEach(async ({ payload, restClient }) => {
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

  test('should successfully process forgotPassword operation with localized fields', async ({
    payload,
  }) => {
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

  test('should not throw validation errors for localized fields', async ({ payload }) => {
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
