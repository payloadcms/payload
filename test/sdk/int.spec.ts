import type { Payload } from 'payload'

import { PayloadSDKError } from '@payloadcms/sdk'
import { randomUUID } from 'crypto'
import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { TypedPayloadSDK } from '../helpers/getSDK.js'
import type { Email, Post } from './payload-types.js'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { createStreamableFile } from '../uploads/createStreamableFile.js'
import { emailsSlug } from './collections/Emails.js'

let payload: Payload
let post: Post
let sdk: TypedPayloadSDK

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const testUserCredentials = {
  email: 'test@payloadcms.com',
  password: '123456',
}

describe('@payloadcms/sdk', () => {
  beforeAll(async () => {
    ;({ payload, sdk } = await initPayloadInt(dirname))

    post = await payload.create({ collection: 'posts', data: { number: 1, number2: 3 } })
    await payload.create({
      collection: 'users',
      data: { ...testUserCredentials },
    })
    await payload.updateGlobal({ slug: 'global', data: { text: 'some-global' } })
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  it('should execute find', async () => {
    const result = await sdk.find({ collection: 'posts', where: { id: { equals: post.id } } })

    expect(result.docs[0].id).toBe(post.id)

    const ids = []
    for (let i = 0; i < 40; i++) {
      const post = await payload.create({ collection: 'posts', data: {} })
      ids.push(post.id)
    }

    const resultPaginationFalse = await sdk.find({ collection: 'posts', pagination: false })
    expect(resultPaginationFalse.docs).toHaveLength(41)
    expect(resultPaginationFalse.totalDocs).toBe(41)
    await payload.delete({ collection: 'posts', where: { id: { in: ids } } })
  })

  it('should execute findVersions', async () => {
    const result = await sdk.findVersions({
      collection: 'posts',
      where: { parent: { equals: post.id } },
    })

    expect(result.docs[0].parent).toBe(post.id)
  })

  it('should execute findByID', async () => {
    const result = await sdk.findByID({ collection: 'posts', id: post.id })

    expect(result.id).toBe(post.id)
  })

  it('should execute findByID with disableErrors: true', async () => {
    const result = await sdk.findByID({
      disableErrors: true,
      collection: 'posts',
      id: typeof post.id === 'string' ? randomUUID() : 999,
    })

    expect(result).toBeNull()
  })

  it('should execute findVersionByID', async () => {
    const {
      docs: [version],
    } = await payload.findVersions({ collection: 'posts', where: { parent: { equals: post.id } } })

    const result = await sdk.findVersionByID({ collection: 'posts', id: version.id })

    expect(result.id).toBe(version.id)
  })

  it('should execute create', async () => {
    const result = await sdk.create({ collection: 'posts', data: { text: 'text' } })

    expect(result.text).toBe('text')
  })

  it('should execute create with file', async () => {
    const filePath = path.join(dirname, './image.jpg')
    const { file, handle } = await createStreamableFile(filePath)
    const res = await sdk.create({ collection: 'media', file, data: {} })
    expect(res.id).toBeTruthy()
    await handle.close()
  })

  it('should execute count', async () => {
    const result = await sdk.count({ collection: 'posts', where: { id: { equals: post.id } } })

    expect(result.totalDocs).toBe(1)
  })

  it('should execute update (by ID)', async () => {
    const result = await sdk.update({
      collection: 'posts',
      id: post.id,
      data: { text: 'updated-text' },
    })

    expect(result.text).toBe('updated-text')
  })

  it('should execute update (bulk)', async () => {
    const result = await sdk.update({
      collection: 'posts',
      where: {
        id: {
          equals: post.id,
        },
      },
      data: { text: 'updated-text-bulk' },
    })

    expect(result.docs[0].text).toBe('updated-text-bulk')
  })

  it('should execute delete (by ID)', async () => {
    const post = await payload.create({ collection: 'posts', data: {} })

    const result = await sdk.delete({ id: post.id, collection: 'posts' })

    expect(result.id).toBe(post.id)

    const resultLocal = await payload.findByID({
      collection: 'posts',
      id: post.id,
      disableErrors: true,
    })

    expect(resultLocal).toBeNull()
  })

  it('should execute delete (bulk)', async () => {
    const post = await payload.create({ collection: 'posts', data: {} })

    const result = await sdk.delete({ where: { id: { equals: post.id } }, collection: 'posts' })

    expect(result.docs[0].id).toBe(post.id)

    const resultLocal = await payload.findByID({
      collection: 'posts',
      id: post.id,
      disableErrors: true,
    })

    expect(resultLocal).toBeNull()
  })

  it('should execute restoreVersion', async () => {
    const post = await payload.create({ collection: 'posts', data: { text: 'old' } })

    const {
      docs: [currentVersion],
    } = await payload.findVersions({ collection: 'posts', where: { parent: { equals: post.id } } })

    await payload.update({ collection: 'posts', id: post.id, data: { text: 'new' } })

    const result = await sdk.restoreVersion({
      collection: 'posts',
      id: currentVersion.id,
    })

    expect(result.text).toBe('old')

    const resultDB = await payload.findByID({ collection: 'posts', id: post.id })

    expect(resultDB.text).toBe('old')
  })

  it('should execute findGlobal', async () => {
    const result = await sdk.findGlobal({ slug: 'global' })
    expect(result.text).toBe('some-global')
  })

  it('should execute findGlobalVersions', async () => {
    const result = await sdk.findGlobalVersions({
      slug: 'global',
    })

    expect(result.docs[0].version).toBeTruthy()
  })

  it('should execute findGlobalVersionByID', async () => {
    const {
      docs: [version],
    } = await payload.findGlobalVersions({
      slug: 'global',
    })

    const result = await sdk.findGlobalVersionByID({ id: version.id, slug: 'global' })

    expect(result.id).toBe(version.id)
  })

  it('should execute updateGlobal', async () => {
    const result = await sdk.updateGlobal({ slug: 'global', data: { text: 'some-updated-global' } })
    expect(result.text).toBe('some-updated-global')
  })

  it('should execute restoreGlobalVersion', async () => {
    await payload.updateGlobal({ slug: 'global', data: { text: 'old' } })

    const {
      docs: [currentVersion],
    } = await payload.findGlobalVersions({
      slug: 'global',
    })

    await payload.updateGlobal({ slug: 'global', data: { text: 'new' } })

    const { version: result } = await sdk.restoreGlobalVersion({
      slug: 'global',
      id: currentVersion.id,
    })

    expect(result.text).toBe('old')

    const resultDB = await payload.findGlobal({ slug: 'global' })

    expect(resultDB.text).toBe('old')
  })

  it('should execute login', async () => {
    const res = await sdk.login({
      collection: 'users',
      data: { email: testUserCredentials.email, password: testUserCredentials.password },
    })

    expect(res.user.email).toBe(testUserCredentials.email)
  })

  it('should execute me', async () => {
    const { token } = await sdk.login({
      collection: 'users',
      data: { email: testUserCredentials.email, password: testUserCredentials.password },
    })

    const res = await sdk.me(
      { collection: 'users' },
      { headers: { Authorization: `JWT ${token}` } },
    )

    expect(res.user.email).toBe(testUserCredentials.email)
  })

  it('should execute refreshToken', async () => {
    const { token } = await sdk.login({
      collection: 'users',
      data: { email: testUserCredentials.email, password: testUserCredentials.password },
    })

    const res = await sdk.refreshToken(
      { collection: 'users' },
      { headers: { Authorization: `JWT ${token}` } },
    )

    expect(res.user.email).toBe(testUserCredentials.email)
  })

  it('should execute forgotPassword and resetPassword', async () => {
    const user = await payload.create({
      collection: 'users',
      data: { email: 'new@payloadcms.com', password: 'HOW TO rEmeMber this password' },
    })

    const resForgotPassword = await sdk.forgotPassword({
      collection: 'users',
      data: { email: user.email },
    })

    expect(resForgotPassword.message).toBeTruthy()

    const afterForgotPassword = await payload.findByID({
      showHiddenFields: true,
      collection: 'users',
      id: user.id,
    })

    expect(afterForgotPassword.resetPasswordToken).toBeTruthy()

    const verifyEmailResult = await sdk.resetPassword({
      collection: 'users',
      data: { password: '1234567', token: afterForgotPassword.resetPasswordToken },
    })

    expect(verifyEmailResult.user.email).toBe(user.email)

    const {
      user: { email },
    } = await sdk.login({
      collection: 'users',
      data: { email: user.email, password: '1234567' },
    })

    expect(email).toBe(user.email)
  })

  describe('Error Handling', () => {
    afterEach(async () => {
      await payload.db.deleteMany({ collection: 'emails', where: { id: { exists: true } } })
    })

    it('should throw PayloadSDKError on validation error (duplicate unique field)', async () => {
      const testEmail = 'unique-test@example.com'

      await payload.create({
        collection: emailsSlug,
        data: { email: testEmail },
      })

      let thrownError: null | PayloadSDKError = null

      try {
        await sdk.create({
          collection: emailsSlug,
          data: { email: testEmail },
        })
      } catch (err) {
        thrownError = err as PayloadSDKError
      }

      expect(thrownError).toBeInstanceOf(PayloadSDKError)
      expect(thrownError!.status).toBe(400)
      expect(thrownError!.errors).toBeDefined()
      expect(thrownError!.errors.length).toBeGreaterThan(0)
      expect(thrownError!.errors[0]?.name).toBe('ValidationError')
      expect(thrownError!.message).toBeTruthy()
    })

    it('should throw PayloadSDKError on not found (findByID with invalid id)', async () => {
      const invalidId = typeof post.id === 'string' ? randomUUID() : 999999

      let thrownError: null | PayloadSDKError = null

      try {
        await sdk.findByID({
          collection: 'posts',
          id: invalidId,
        })
      } catch (err) {
        thrownError = err as PayloadSDKError
      }

      expect(thrownError).toBeInstanceOf(PayloadSDKError)
      expect(thrownError!.status).toBe(404)
      expect(thrownError!.errors).toBeDefined()
      expect(thrownError!.message).toBeTruthy()
    })

    it('should return null with disableErrors: true on findByID not found', async () => {
      const invalidId = typeof post.id === 'string' ? randomUUID() : 999999

      const result = await sdk.findByID({
        disableErrors: true,
        collection: 'posts',
        id: invalidId,
      })

      expect(result).toBeNull()
    })

    it('should throw PayloadSDKError on update with invalid data', async () => {
      let thrownError: null | PayloadSDKError = null
      const testEmail = 'update-error-test@example.com'
      const testEmail2 = 'update-error-test2@example.com'

      await payload.create({
        collection: emailsSlug,
        data: { email: testEmail },
      })

      const doc2 = await payload.create({
        collection: emailsSlug,
        data: { email: testEmail2 },
      })

      try {
        await sdk.update({
          collection: emailsSlug,
          id: doc2.id,
          data: { email: testEmail },
        })
      } catch (err) {
        thrownError = err as PayloadSDKError
      }

      expect(thrownError).toBeInstanceOf(PayloadSDKError)
      expect(thrownError!.status).toBe(400)
      expect(thrownError!.errors).toBeDefined()
    })

    it('should throw PayloadSDKError on delete with invalid id', async () => {
      const invalidId = typeof post.id === 'string' ? randomUUID() : 999999

      let thrownError: null | PayloadSDKError = null

      try {
        await sdk.delete({
          collection: 'posts',
          id: invalidId,
        })
      } catch (err) {
        thrownError = err as PayloadSDKError
      }

      expect(thrownError).toBeInstanceOf(PayloadSDKError)
      expect(thrownError!.status).toBe(404)
    })

    it('should include response object in PayloadSDKError', async () => {
      const invalidId = typeof post.id === 'string' ? randomUUID() : 999999

      let thrownError: null | PayloadSDKError = null

      try {
        await sdk.findByID({
          collection: 'posts',
          id: invalidId,
        })
      } catch (err) {
        thrownError = err as PayloadSDKError
      }

      expect(thrownError).toBeInstanceOf(PayloadSDKError)
      expect(thrownError!.response).toBeDefined()
      expect(thrownError!.response.status).toBe(404)
    })

    it('should have error data for ValidationError', async () => {
      const testEmail = 'validation-data-test@example.com'

      await payload.create({
        collection: emailsSlug,
        data: { email: testEmail },
      })

      let thrownError: null | PayloadSDKError = null

      try {
        await sdk.create({
          collection: emailsSlug,
          data: { email: testEmail },
        })
      } catch (err) {
        thrownError = err as PayloadSDKError
      }

      expect(thrownError).toBeInstanceOf(PayloadSDKError)
      const firstError = thrownError!.errors[0]!
      expect(firstError.data).toBeDefined()
      expect(firstError.data!.collection).toBe(emailsSlug)
      expect(firstError.data!.errors).toBeDefined()
      expect(Array.isArray(firstError.data!.errors)).toBe(true)
    })
  })
})
