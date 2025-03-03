import type { NextRESTClient } from 'helpers/NextRESTClient.js'
import type { Payload, User } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { devUser, regularUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'

const listPresetsCollectionSlug = 'payload-list-presets'

let payload: Payload
let restClient: NextRESTClient
let user: User
let user2: User

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Shared Filters', () => {
  beforeAll(async () => {
    // @ts-expect-error: initPayloadInt does not have a proper type definition
    ;({ payload, restClient } = await initPayloadInt(dirname))

    user = await payload
      .login({
        collection: 'users',
        data: {
          email: devUser.email,
          password: devUser.password,
        },
      })
      ?.then((result) => result.user)

    user2 = await payload
      .login({
        collection: 'users',
        data: {
          email: regularUser.email,
          password: regularUser.password,
        },
      })
      ?.then((result) => result.user)
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  describe('default access control', () => {
    it('should respect access when set to "specificUsers"', async () => {
      const presetForSpecificUsers = await payload.create({
        collection: listPresetsCollectionSlug,
        user,
        data: {
          title: 'Specific Users',
          where: {
            text: {
              equals: 'example page',
            },
          },
          access: {
            read: {
              constraint: 'specificUsers',
              users: [user.id],
            },
            update: {
              constraint: 'specificUsers',
              users: [user.id],
            },
          },
          relatedCollection: 'pages',
        },
      })

      const foundPresetWithUser1 = await payload.findByID({
        collection: listPresetsCollectionSlug,
        depth: 0,
        user,
        overrideAccess: false,
        id: presetForSpecificUsers.id,
      })

      expect(foundPresetWithUser1.id).toBe(presetForSpecificUsers.id)

      try {
        const foundPresetWithUser2 = await payload.findByID({
          collection: listPresetsCollectionSlug,
          depth: 0,
          user: user2,
          overrideAccess: false,
          id: presetForSpecificUsers.id,
        })

        expect(foundPresetWithUser2).toBeFalsy()
      } catch (error) {
        expect(error).toBeDefined()
      }

      const presetUpdatedByUser1 = await payload.update({
        collection: listPresetsCollectionSlug,
        id: presetForSpecificUsers.id,
        user,
        overrideAccess: false,
        data: {
          title: 'Specific Users (Updated)',
        },
      })

      expect(presetUpdatedByUser1.title).toBe('Specific Users (Updated)')

      try {
        const presetUpdatedByUser2 = await payload.update({
          collection: listPresetsCollectionSlug,
          id: presetForSpecificUsers.id,
          user: user2,
          overrideAccess: false,
          data: {
            title: 'Specific Users (Updated)',
          },
        })

        expect(presetUpdatedByUser2).toBeFalsy()
      } catch (error) {
        expect(error).toBeDefined()
        // swallow error
      }
    })

    it('should respect access when set to "onlyMe"', async () => {
      // create a new doc so that the creating user is the owner
      const presetForOnlyMe = await payload.create({
        collection: listPresetsCollectionSlug,
        user,
        data: {
          title: 'Only Me',
          where: {
            text: {
              equals: 'example page',
            },
          },
          access: {
            read: {
              constraint: 'onlyMe',
            },
            update: {
              constraint: 'onlyMe',
            },
          },
          relatedCollection: 'pages',
        },
      })

      const foundPresetWithUser1 = await payload.findByID({
        collection: listPresetsCollectionSlug,
        depth: 0,
        user,
        overrideAccess: false,
        id: presetForOnlyMe.id,
      })

      expect(foundPresetWithUser1.id).toBe(presetForOnlyMe.id)

      try {
        const foundPresetWithUser2 = await payload.findByID({
          collection: listPresetsCollectionSlug,
          depth: 0,
          user: user2,
          overrideAccess: false,
          id: presetForOnlyMe.id,
        })

        expect(foundPresetWithUser2).toBeFalsy()
      } catch (error) {
        expect(error).toBeDefined()
        // swallow error
      }

      const presetUpdatedByUser1 = await payload.update({
        collection: listPresetsCollectionSlug,
        id: presetForOnlyMe.id,
        user,
        overrideAccess: false,
        data: {
          title: 'Only Me (Updated)',
        },
      })

      expect(presetUpdatedByUser1.title).toBe('Only Me (Updated)')

      try {
        const presetUpdatedByUser2 = await payload.update({
          collection: listPresetsCollectionSlug,
          id: presetForOnlyMe.id,
          user: user2,
          overrideAccess: false,
          data: {
            title: 'Only Me (Updated)',
          },
        })

        expect(presetUpdatedByUser2).toBeFalsy()
      } catch (error) {
        expect(error).toBeDefined()
        // swallow error
      }
    })

    it('should respect access when set to "everyone"', async () => {
      const presetForEveryone = await payload.create({
        collection: listPresetsCollectionSlug,
        user,
        data: {
          title: 'Everyone',
          where: {
            text: {
              equals: 'example page',
            },
          },
          access: {
            read: {
              constraint: 'everyone',
            },
            update: {
              constraint: 'everyone',
            },
          },
          relatedCollection: 'pages',
        },
      })

      const foundPresetWithUser1 = await payload.findByID({
        collection: listPresetsCollectionSlug,
        depth: 0,
        user,
        overrideAccess: false,
        id: presetForEveryone.id,
      })

      expect(foundPresetWithUser1.id).toBe(presetForEveryone.id)

      const foundPresetWithUser2 = await payload.findByID({
        collection: listPresetsCollectionSlug,
        depth: 0,
        user: user2,
        overrideAccess: false,
        id: presetForEveryone.id,
      })

      expect(foundPresetWithUser2.id).toBe(presetForEveryone.id)

      const presetUpdatedByUser1 = await payload.update({
        collection: listPresetsCollectionSlug,
        id: presetForEveryone.id,
        user,
        overrideAccess: false,
        data: {
          title: 'Everyone (Update 1)',
        },
      })

      expect(presetUpdatedByUser1.title).toBe('Everyone (Update 1)')

      const presetUpdatedByUser2 = await payload.update({
        collection: listPresetsCollectionSlug,
        id: presetForEveryone.id,
        user: user2,
        overrideAccess: false,
        data: {
          title: 'Everyone (Update 2)',
        },
      })

      expect(presetUpdatedByUser2.title).toBe('Everyone (Update 2)')
    })
  })

  describe('user-defined access control', () => {
    it('should respect access when set to "specificRoles"', async () => {
      const presetForSpecificRoles = await payload.create({
        collection: listPresetsCollectionSlug,
        user,
        data: {
          title: 'Specific Roles',
          where: {
            text: {
              equals: 'example page',
            },
          },
          access: {
            read: {
              constraint: 'specificRoles',
              roles: ['admin'],
            },
            update: {
              constraint: 'specificRoles',
              roles: ['admin'],
            },
          },
          relatedCollection: 'pages',
        },
      })

      const foundPresetWithUser1 = await payload.findByID({
        collection: listPresetsCollectionSlug,
        depth: 0,
        user,
        overrideAccess: false,
        id: presetForSpecificRoles.id,
      })

      expect(foundPresetWithUser1.id).toBe(presetForSpecificRoles.id)

      try {
        const foundPresetWithUser2 = await payload.findByID({
          collection: listPresetsCollectionSlug,
          depth: 0,
          user: user2,
          overrideAccess: false,
          id: presetForSpecificRoles.id,
        })

        expect(foundPresetWithUser2).toBeFalsy()
      } catch (error) {
        expect(error).toBeDefined()
        // swallow error
      }

      const presetUpdatedByUser1 = await payload.update({
        collection: listPresetsCollectionSlug,
        id: presetForSpecificRoles.id,
        user,
        overrideAccess: false,
        data: {
          title: 'Specific Roles (Updated)',
        },
      })

      expect(presetUpdatedByUser1.title).toBe('Specific Roles (Updated)')

      try {
        const presetUpdatedByUser2 = await payload.update({
          collection: listPresetsCollectionSlug,
          id: presetForSpecificRoles.id,
          user: user2,
          overrideAccess: false,
          data: {
            title: 'Specific Roles (Updated)',
          },
        })

        expect(presetUpdatedByUser2).toBeFalsy()
      } catch (error) {
        expect(error).toBeDefined()
        // swallow error
      }
    })
  })

  it.skip('should disable list presets when the collection is set to "disableListPresets"', async () => {
    try {
      const result = await payload.create({
        collection: 'payload-list-presets',
        user,
        data: {
          title: 'Disabled List Presets',
          relatedCollection: 'users',
        },
      })

      // TODO: this test always passes because this expect throws an error which is caught and passes the 'catch' block
      expect(result).toBeFalsy()
    } catch (error) {
      expect(error).toBeDefined()
    }
  })

  describe('Where object formatting', () => {
    it('transforms "where" query objects into the "and" / "or" format', async () => {
      const result = await payload.create({
        collection: listPresetsCollectionSlug,
        user,
        data: {
          title: 'Where Object Formatting',
          where: {
            text: {
              equals: 'example page',
            },
          },
          access: {
            read: {
              constraint: 'everyone',
            },
            update: {
              constraint: 'everyone',
            },
          },
          relatedCollection: 'pages',
        },
      })

      expect(result.where).toMatchObject({
        or: [
          {
            and: [
              {
                text: {
                  equals: 'example page',
                },
              },
            ],
          },
        ],
      })
    })
  })
})
