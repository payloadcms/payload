import { PayloadSDKError } from '@payloadcms/sdk'
import { randomUUID } from 'crypto'
import { readFile } from 'node:fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import type { Post } from './payload-types.js'

import { test } from '../__helpers/int/vitest.js'
import { createStreamableFile } from '../uploads/createStreamableFile.js'
import { emailsSlug } from './collections/Emails.js'

let post: Post
let postTrash: Post

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const testUserCredentials = {
  email: 'test@payloadcms.com',
  password: '123456',
}

test.suite('@payloadcms/sdk', { config: './config.ts', resetBetweenTests: false }, () => {
  test.beforeAll(async ({ payloadInstance: payload }) => {
    post = await payload.create({
      collection: 'posts',
      data: { number: 1, number2: 3 },
      overrideAccess: true,
    })
    postTrash = await payload.create({
      collection: 'posts',
      data: { deletedAt: new Date().toISOString(), text: 'fixture-trash' },
      overrideAccess: true,
    })
    await payload.create({
      collection: 'users',
      data: { ...testUserCredentials },
      overrideAccess: true,
    })
    await payload.updateGlobal({
      slug: 'global',
      data: { text: 'some-global' },
      overrideAccess: true,
    })
  })

  test('should execute find', async ({ payload, sdk }) => {
    const result = await sdk.find({ collection: 'posts', where: { id: { equals: post.id } } })

    expect(result.docs[0].id).toBe(post.id)

    const ids = []
    for (let i = 0; i < 40; i++) {
      const post = await payload.create({ collection: 'posts', data: {}, overrideAccess: true })
      ids.push(post.id)
    }

    const resultPaginationFalse = await sdk.find({ collection: 'posts', pagination: false })
    expect(resultPaginationFalse.docs).toHaveLength(41)
    expect(resultPaginationFalse.totalDocs).toBe(41)
    await payload.delete({ collection: 'posts', overrideAccess: true, where: { id: { in: ids } } })
  })

  test('should return no docs for an empty array in `in` condition', async ({ sdk }) => {
    const result = await sdk.find({
      collection: 'posts',
      where: { id: { in: [] } },
    })

    expect(result.docs).toHaveLength(0)
    expect(result.totalDocs).toBe(0)
  })

  test('should execute find with trash', async ({ sdk }) => {
    const pairWhere = { id: { in: [post.id, postTrash.id] } }

    expect((await sdk.find({ collection: 'posts', where: pairWhere })).docs).toHaveLength(1)
    expect(
      (await sdk.find({ collection: 'posts', trash: true, where: pairWhere })).docs,
    ).toHaveLength(2)
  })

  test('should execute findVersions', async ({ sdk }) => {
    const result = await sdk.findVersions({
      collection: 'posts',
      where: { parent: { equals: post.id } },
    })

    expect(result.docs[0].parent).toBe(post.id)
  })

  test('should execute findVersions with trash', async ({ sdk }) => {
    const pairWhere = { parent: { in: [post.id, postTrash.id] } }

    expect((await sdk.findVersions({ collection: 'posts', where: pairWhere })).docs).toHaveLength(1)
    expect(
      (await sdk.findVersions({ collection: 'posts', trash: true, where: pairWhere })).docs,
    ).toHaveLength(2)
  })

  test('should execute findByID', async ({ sdk }) => {
    const result = await sdk.findByID({ id: post.id, collection: 'posts' })

    expect(result.id).toBe(post.id)
  })

  test('should execute findByID with trash', async ({ sdk }) => {
    expect(
      await sdk.findByID({ id: postTrash.id, collection: 'posts', disableErrors: true }),
    ).toBeNull()
    expect((await sdk.findByID({ id: postTrash.id, collection: 'posts', trash: true })).id).toEqual(
      postTrash.id,
    )
  })

  test('should execute findByID with fallbackLocale: false', async ({ payload, sdk }) => {
    const localizedPost = await payload.create({
      collection: 'posts',
      data: { localizedText: 'english' },
      locale: 'en',
      overrideAccess: true,
    })

    const withFallback = await sdk.findByID({
      id: localizedPost.id,
      collection: 'posts',
      locale: 'es',
    })
    const withoutFallback = await sdk.findByID({
      id: localizedPost.id,
      collection: 'posts',
      fallbackLocale: false,
      locale: 'es',
    })

    await payload.delete({ id: localizedPost.id, collection: 'posts', overrideAccess: true })

    expect(withFallback.localizedText).toBe('english')
    expect(withoutFallback.localizedText).toBeUndefined()
  })

  test('should execute findByID with disableErrors: true', async ({ sdk }) => {
    const result = await sdk.findByID({
      id: typeof post.id === 'string' ? randomUUID() : 999,
      collection: 'posts',
      disableErrors: true,
    })

    expect(result).toBeNull()
  })

  test('should execute findVersionByID', async ({ payload, sdk }) => {
    const {
      docs: [version],
    } = await payload.findVersions({
      collection: 'posts',
      overrideAccess: true,
      where: { parent: { equals: post.id } },
    })

    const result = await sdk.findVersionByID({ id: version.id, collection: 'posts' })

    expect(result.id).toBe(version.id)
  })

  test('should execute findVersionByID with trash', async ({ payload, sdk }) => {
    const {
      docs: [trashVersion],
    } = await payload.findVersions({
      collection: 'posts',
      overrideAccess: true,
      trash: true,
      where: { parent: { equals: postTrash.id } },
    })

    expect(
      await sdk.findVersionByID({ id: trashVersion.id, collection: 'posts', disableErrors: true }),
    ).toBeNull()
    expect(
      (await sdk.findVersionByID({ id: trashVersion.id, collection: 'posts', trash: true })).id,
    ).toBe(trashVersion.id)
  })

  test('should execute create', async ({ sdk }) => {
    const result = await sdk.create({ collection: 'posts', data: { text: 'text' } })

    expect(result.text).toBe('text')
  })

  test('should execute create with file', async ({ sdk }) => {
    const filePath = path.join(dirname, './image.jpg')
    const { file, handle } = await createStreamableFile(filePath)
    const res = await sdk.create({ collection: 'media', data: {}, file })
    expect(res.id).toBeTruthy()
    await handle.close()
  })

  test('should execute count', async ({ sdk }) => {
    const result = await sdk.count({ collection: 'posts', where: { id: { equals: post.id } } })

    expect(result.totalDocs).toBe(1)
  })

  test('should execute count with trash', async ({ sdk }) => {
    expect(
      (
        await sdk.count({
          collection: 'posts',
          trash: true,
          where: { id: { in: [post.id, postTrash.id] } },
        })
      ).totalDocs,
    ).toBe(2)
  })

  test('should execute update (by ID)', async ({ sdk }) => {
    const result = await sdk.update({
      id: post.id,
      collection: 'posts',
      data: { text: 'updated-text' },
    })

    expect(result.text).toBe('updated-text')
  })

  test('should execute update (by ID) with trash', async ({ sdk }) => {
    const result = await sdk.update({
      id: postTrash.id,
      collection: 'posts',
      data: { text: 'updated-trash-by-id' },
      trash: true,
    })

    expect(result.text).toBe('updated-trash-by-id')
  })

  test('should execute update (bulk)', async ({ sdk }) => {
    const result = await sdk.update({
      collection: 'posts',
      data: { text: 'updated-text-bulk' },
      where: { id: { equals: post.id } },
    })

    expect(result.docs[0].text).toBe('updated-text-bulk')
  })

  test('should execute update (bulk) with trash', async ({ sdk }) => {
    const result = await sdk.update({
      collection: 'posts',
      data: { text: 'updated-trash-bulk' },
      trash: true,
      where: { id: { equals: postTrash.id } },
    })

    expect(result.docs[0].text).toBe('updated-trash-bulk')
  })

  test('should execute delete (by ID)', async ({ payload, sdk }) => {
    const post = await payload.create({ collection: 'posts', data: {}, overrideAccess: true })

    const result = await sdk.delete({ id: post.id, collection: 'posts' })

    expect(result.id).toBe(post.id)
    expect(
      await payload.findByID({
        id: post.id,
        collection: 'posts',
        disableErrors: true,
        overrideAccess: true,
      }),
    ).toBeNull()
  })

  test('should execute delete (by ID) with trash', async ({ payload, sdk }) => {
    const trashed = await payload.create({
      collection: 'posts',
      data: { deletedAt: new Date().toISOString() },
      overrideAccess: true,
    })

    await sdk.delete({ id: trashed.id, collection: 'posts', trash: true })

    expect(
      await payload.findByID({
        id: trashed.id,
        collection: 'posts',
        disableErrors: true,
        overrideAccess: true,
        trash: true,
      }),
    ).toBeNull()
  })

  test('should execute delete (bulk)', async ({ payload, sdk }) => {
    const post = await payload.create({ collection: 'posts', data: {}, overrideAccess: true })

    const result = await sdk.delete({ collection: 'posts', where: { id: { equals: post.id } } })

    expect(result.docs[0].id).toBe(post.id)
    expect(
      await payload.findByID({
        id: post.id,
        collection: 'posts',
        disableErrors: true,
        overrideAccess: true,
      }),
    ).toBeNull()
  })

  test('should execute delete (bulk) with trash', async ({ payload, sdk }) => {
    const trashedA = await payload.create({
      collection: 'posts',
      data: { deletedAt: new Date().toISOString(), text: 'bulk-perma-a' },
      overrideAccess: true,
    })
    const trashedB = await payload.create({
      collection: 'posts',
      data: { deletedAt: new Date().toISOString(), text: 'bulk-perma-b' },
      overrideAccess: true,
    })

    await sdk.delete({
      collection: 'posts',
      trash: true,
      where: { id: { in: [trashedA.id, trashedB.id] } },
    })

    expect(
      await payload.findByID({
        id: trashedA.id,
        collection: 'posts',
        disableErrors: true,
        overrideAccess: true,
        trash: true,
      }),
    ).toBeNull()
    expect(
      await payload.findByID({
        id: trashedB.id,
        collection: 'posts',
        disableErrors: true,
        overrideAccess: true,
        trash: true,
      }),
    ).toBeNull()
  })

  test('should execute restoreVersion', async ({ payload, sdk }) => {
    const post = await payload.create({
      collection: 'posts',
      data: { text: 'old' },
      overrideAccess: true,
    })

    const {
      docs: [currentVersion],
    } = await payload.findVersions({
      collection: 'posts',
      overrideAccess: true,
      where: { parent: { equals: post.id } },
    })

    await payload.update({
      id: post.id,
      collection: 'posts',
      data: { text: 'new' },
      overrideAccess: true,
    })

    const result = await sdk.restoreVersion({
      id: currentVersion.id,
      collection: 'posts',
    })

    expect(result.text).toBe('old')

    const resultDB = await payload.findByID({
      id: post.id,
      collection: 'posts',
      overrideAccess: true,
    })

    expect(resultDB.text).toBe('old')
  })

  test('should execute findGlobal', async ({ sdk }) => {
    const result = await sdk.findGlobal({ slug: 'global' })
    expect(result.text).toBe('some-global')
  })

  test('should execute findGlobalVersions', async ({ sdk }) => {
    const result = await sdk.findGlobalVersions({
      slug: 'global',
    })

    expect(result.docs[0].version).toBeTruthy()
  })

  test('should execute findGlobalVersionByID', async ({ payload, sdk }) => {
    const {
      docs: [version],
    } = await payload.findGlobalVersions({
      slug: 'global',
      overrideAccess: true,
    })

    const result = await sdk.findGlobalVersionByID({ id: version.id, slug: 'global' })

    expect(result.id).toBe(version.id)
  })

  test('should execute updateGlobal', async ({ sdk }) => {
    const result = await sdk.updateGlobal({ slug: 'global', data: { text: 'some-updated-global' } })
    expect(result.text).toBe('some-updated-global')
  })

  test('should execute restoreGlobalVersion', async ({ payload, sdk }) => {
    await payload.updateGlobal({ slug: 'global', data: { text: 'old' }, overrideAccess: true })

    const {
      docs: [currentVersion],
    } = await payload.findGlobalVersions({
      slug: 'global',
      overrideAccess: true,
    })

    await payload.updateGlobal({ slug: 'global', data: { text: 'new' }, overrideAccess: true })

    const result = await sdk.restoreGlobalVersion({
      id: currentVersion.id,
      slug: 'global',
    })

    expect(result.text).toBe('old')

    const resultDB = await payload.findGlobal({ slug: 'global', overrideAccess: true })

    expect(resultDB.text).toBe('old')
  })

  test('should execute login', async ({ sdk }) => {
    const res = await sdk.login({
      collection: 'users',
      data: { email: testUserCredentials.email, password: testUserCredentials.password },
    })

    expect(res.user.email).toBe(testUserCredentials.email)
  })

  test('should execute me', async ({ sdk }) => {
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

  test('should execute refreshToken', async ({ sdk }) => {
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

  test('should execute forgotPassword and resetPassword', async ({ payload, sdk }) => {
    const user = await payload.create({
      collection: 'users',
      data: { email: 'new@payloadcms.com', password: 'HOW TO rEmeMber this password' },
      overrideAccess: true,
    })

    const resForgotPassword = await sdk.forgotPassword({
      collection: 'users',
      data: { email: user.email },
    })

    expect(resForgotPassword.message).toBeTruthy()

    const afterForgotPassword = await payload.findByID({
      id: user.id,
      collection: 'users',
      overrideAccess: true,
      showHiddenFields: true,
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

  test('should execute logout', async ({ sdk }) => {
    const { token } = await sdk.login({
      collection: 'users',
      data: { email: testUserCredentials.email, password: testUserCredentials.password },
    })
    const withToken = { headers: { Authorization: `JWT ${token}`, DisableAutologin: 'true' } }

    expect((await sdk.me({ collection: 'users' }, withToken)).user.email).toBe(
      testUserCredentials.email,
    )

    const res = await sdk.logout({ collection: 'users' }, withToken)

    expect(res.message).toBeTruthy()
    expect((await sdk.me({ collection: 'users' }, withToken)).user).toBeNull()
  })

  test('should execute logout with allSessions', async ({ sdk }) => {
    const login = () =>
      sdk.login({
        collection: 'users',
        data: { email: testUserCredentials.email, password: testUserCredentials.password },
      })
    const first = await login()
    const second = await login()
    const withToken = (token?: string) => ({
      headers: { Authorization: `JWT ${token}`, DisableAutologin: 'true' },
    })

    await sdk.logout({ allSessions: true, collection: 'users' }, withToken(first.token))

    expect((await sdk.me({ collection: 'users' }, withToken(second.token))).user).toBeNull()
  })

  test('should execute unlock', async ({ payload, sdk }) => {
    const credentials = { email: 'locked@payloadcms.com', password: 'correct-password' }
    const user = await payload.create({
      collection: 'users',
      data: credentials,
      overrideAccess: true,
    })

    try {
      // maxLoginAttempts is 2 for this collection
      for (let i = 0; i < 2; i++) {
        await expect(
          sdk.login({ collection: 'users', data: { ...credentials, password: 'wrong' } }),
        ).rejects.toBeInstanceOf(PayloadSDKError)
      }
      await expect(sdk.login({ collection: 'users', data: credentials })).rejects.toBeInstanceOf(
        PayloadSDKError,
      )

      const res = await sdk.unlock({ collection: 'users', data: { email: credentials.email } })

      expect(res.message).toBeTruthy()
      expect((await sdk.login({ collection: 'users', data: credentials })).user.email).toBe(
        credentials.email,
      )
    } finally {
      await payload.delete({ id: user.id, collection: 'users', overrideAccess: true })
    }
  })

  test('should execute access', async ({ sdk }) => {
    const res = await sdk.access()

    expect(res.canAccessAdmin).toBe(true)
    expect(res.collections?.posts?.read).toBe(true)
    expect(res.globals?.global?.update).toBe(true)
  })

  test('should execute docAccess', async ({ sdk }) => {
    const byID = await sdk.docAccess({ id: post.id, collection: 'posts' })

    expect(byID.update).toBe(true)
    expect(byID.delete).toBe(true)

    const forCreate = await sdk.docAccess({ collection: 'posts' })

    expect(forCreate.create).toBe(true)
  })

  test('should execute docAccessGlobal', async ({ sdk }) => {
    const res = await sdk.docAccessGlobal({ slug: 'global' })

    expect(res.read).toBe(true)
    expect(res.update).toBe(true)
  })

  test('should execute validate', async ({ sdk }) => {
    expect(await sdk.validate({ collection: 'posts', data: { shortText: 'ok' } })).toStrictEqual({
      errors: [],
      valid: true,
    })

    const invalid = await sdk.validate({ collection: 'posts', data: { shortText: 'too long' } })

    expect(invalid.valid).toBe(false)
    expect(invalid.errors.map((error) => error.path)).toStrictEqual(['shortText'])
  })

  test('should execute validate (by ID)', async ({ sdk }) => {
    const res = await sdk.validate({
      id: post.id,
      collection: 'posts',
      data: { shortText: 'too long' },
    })

    expect(res.valid).toBe(false)
    expect(res.errors.map((error) => error.path)).toStrictEqual(['shortText'])
  })

  test('should execute validate with several locales', async ({ sdk }) => {
    const res = await sdk.validate({
      collection: 'posts',
      data: { shortText: 'ok' },
      locale: ['en', 'es'],
    })

    expect(res.valid).toBe(true)
  })

  test('should execute validateGlobal', async ({ sdk }) => {
    expect((await sdk.validateGlobal({ slug: 'global', data: { shortText: 'ok' } })).valid).toBe(
      true,
    )

    const invalid = await sdk.validateGlobal({ slug: 'global', data: { shortText: 'too long' } })

    expect(invalid.valid).toBe(false)
    expect(invalid.errors.map((error) => error.path)).toStrictEqual(['shortText'])
  })

  test('should execute duplicate', async ({ payload, sdk }) => {
    const copy = await sdk.duplicate({ id: post.id, collection: 'posts', data: { text: 'copy' } })

    try {
      expect(copy.id).not.toBe(post.id)
      expect(copy.number).toBe(post.number)
      expect(copy.text).toBe('copy')
    } finally {
      await payload.delete({ id: copy.id, collection: 'posts', overrideAccess: true })
    }
  })

  test('should execute renameFile', async ({ payload, sdk }) => {
    const file = new File([await readFile(path.join(dirname, './image.jpg'))], 'to-rename.jpg', {
      type: 'image/jpeg',
    })
    const media = await sdk.create({ collection: 'media', data: {}, file })

    try {
      const renamed = await sdk.renameFile({
        id: media.id,
        collection: 'media',
        filename: 'renamed.jpg',
      })

      expect(renamed.filename).toBe('renamed.jpg')
      expect((await payload.findByID({ id: media.id, collection: 'media' })).filename).toBe(
        'renamed.jpg',
      )
    } finally {
      await payload.delete({ id: media.id, collection: 'media', overrideAccess: true })
    }
  })

  test('should encode text IDs as one path segment', async ({ payload, sdk }) => {
    const id = 'chapter/intro#1'
    await payload.create({ collection: 'text-ids', data: { id }, overrideAccess: true })

    try {
      expect((await sdk.docAccess({ id, collection: 'text-ids' })).update).toBe(true)
      expect(
        (await sdk.validate({ id, collection: 'text-ids', data: { shortText: 'too long' } })).valid,
      ).toBe(false)
    } finally {
      await payload.delete({ id, collection: 'text-ids', overrideAccess: true })
    }
  })

  test.describe('Error Handling', () => {
    test.afterEach(async ({ payload }) => {
      await payload.db.deleteMany({ collection: 'emails', where: { id: { exists: true } } })
    })

    test('should throw PayloadSDKError on validation error (duplicate unique field)', async ({
      payload,
      sdk,
    }) => {
      const testEmail = 'unique-test@example.com'

      await payload.create({
        collection: emailsSlug,
        data: { email: testEmail },
        overrideAccess: true,
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

    test('should throw PayloadSDKError on not found (findByID with invalid id)', async ({
      sdk,
    }) => {
      const invalidId = typeof post.id === 'string' ? randomUUID() : 999999

      let thrownError: null | PayloadSDKError = null

      try {
        await sdk.findByID({
          id: invalidId,
          collection: 'posts',
        })
      } catch (err) {
        thrownError = err as PayloadSDKError
      }

      expect(thrownError).toBeInstanceOf(PayloadSDKError)
      expect(thrownError!.status).toBe(404)
      expect(thrownError!.errors).toBeDefined()
      expect(thrownError!.message).toBeTruthy()
    })

    test('should return null with disableErrors: true on findByID not found', async ({ sdk }) => {
      const invalidId = typeof post.id === 'string' ? randomUUID() : 999999

      const result = await sdk.findByID({
        id: invalidId,
        collection: 'posts',
        disableErrors: true,
      })

      expect(result).toBeNull()
    })

    test('should throw PayloadSDKError on update with invalid data', async ({ payload, sdk }) => {
      let thrownError: null | PayloadSDKError = null
      const testEmail = 'update-error-test@example.com'
      const testEmail2 = 'update-error-test2@example.com'

      await payload.create({
        collection: emailsSlug,
        data: { email: testEmail },
        overrideAccess: true,
      })

      const doc2 = await payload.create({
        collection: emailsSlug,
        data: { email: testEmail2 },
        overrideAccess: true,
      })

      try {
        await sdk.update({
          id: doc2.id,
          collection: emailsSlug,
          data: { email: testEmail },
        })
      } catch (err) {
        thrownError = err as PayloadSDKError
      }

      expect(thrownError).toBeInstanceOf(PayloadSDKError)
      expect(thrownError!.status).toBe(400)
      expect(thrownError!.errors).toBeDefined()
    })

    test('should throw PayloadSDKError on delete with invalid id', async ({ sdk }) => {
      const invalidId = typeof post.id === 'string' ? randomUUID() : 999999

      let thrownError: null | PayloadSDKError = null

      try {
        await sdk.delete({
          id: invalidId,
          collection: 'posts',
        })
      } catch (err) {
        thrownError = err as PayloadSDKError
      }

      expect(thrownError).toBeInstanceOf(PayloadSDKError)
      expect(thrownError!.status).toBe(404)
    })

    test('should include response object in PayloadSDKError', async ({ sdk }) => {
      const invalidId = typeof post.id === 'string' ? randomUUID() : 999999

      let thrownError: null | PayloadSDKError = null

      try {
        await sdk.findByID({
          id: invalidId,
          collection: 'posts',
        })
      } catch (err) {
        thrownError = err as PayloadSDKError
      }

      expect(thrownError).toBeInstanceOf(PayloadSDKError)
      expect(thrownError!.response).toBeDefined()
      expect(thrownError!.response.status).toBe(404)
    })

    test('should have error data for ValidationError', async ({ payload, sdk }) => {
      const testEmail = 'validation-data-test@example.com'

      await payload.create({
        collection: emailsSlug,
        data: { email: testEmail },
        overrideAccess: true,
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
