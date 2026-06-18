import type { Payload, User } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { devUser, regularUser } from '../credentials.js'

const queryPresetsCollectionSlug = 'payload-query-presets'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const countUser = (users: unknown, id: User['id']) =>
  (Array.isArray(users) ? users : []).filter(
    (user) => (typeof user === 'object' && user ? user.id : user) === id,
  ).length

describe('Query Presets - duplicate users', () => {
  let payload: Payload
  let adminUser: User
  let editorUser: User

  const createdIDs: (number | string)[] = []

  beforeAll(async () => {
    // @ts-expect-error: initPayloadInt does not have a proper type definition
    ;({ payload } = await initPayloadInt(dirname))

    adminUser = await payload
      .login({
        collection: 'users',
        data: {
          email: devUser.email,
          password: devUser.password,
        },
      })
      ?.then((result) => result.user)

    editorUser = await payload
      .login({
        collection: 'users',
        data: {
          email: regularUser.email,
          password: regularUser.password,
        },
      })
      ?.then((result) => result.user)
  })

  afterEach(async () => {
    for (const id of createdIDs) {
      await payload.delete({ id, collection: queryPresetsCollectionSlug })
    }
    createdIDs.length = 0
  })

  afterAll(async () => {
    await payload.destroy()
  })

  it('should not duplicate the current user in the access list when re-saving', async () => {
    const preset = await payload.create({
      collection: queryPresetsCollectionSlug,
      data: {
        access: {
          read: {
            constraint: 'specificUsers',
            users: [editorUser.id],
          },
        },
        relatedCollection: 'pages',
        title: 'No Duplicate Users',
      },
      overrideAccess: false,
      user: adminUser,
    })

    createdIDs.push(preset.id)

    expect(countUser(preset.access?.read?.users, adminUser.id)).toBe(1)

    const updatedPreset = await payload.update({
      id: preset.id,
      collection: queryPresetsCollectionSlug,
      data: {
        title: 'No Duplicate Users (Updated)',
      },
      overrideAccess: false,
      user: adminUser,
    })

    // re-saving must not append the current user again
    expect(countUser(updatedPreset.access?.read?.users, adminUser.id)).toBe(1)
    expect(countUser(updatedPreset.access?.read?.users, editorUser.id)).toBe(1)
  })
})
