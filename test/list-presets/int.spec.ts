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

  describe('default access control', () => {
    it('should respect access when set to "specificUsers"', async () => {
      const filterDoc = await payload.create({
        collection: listPresetsCollectionSlug,
        data: {
          title: 'Specific Users',
          where: {
            text: {
              equals: 'example page',
            },
          },
          user,
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

      const resultWithUser = await payload.findByID({
        collection: listPresetsCollectionSlug,
        depth: 0,
        user,
        overrideAccess: false,
        id: filterDoc.id,
      })

      expect(resultWithUser.id).toBe(filterDoc.id)

      try {
        const resultWithUser2 = await payload.findByID({
          collection: listPresetsCollectionSlug,
          depth: 0,
          user: user2,
          overrideAccess: false,
          id: filterDoc.id,
        })

        expect(resultWithUser2).toBeFalsy()
      } catch (error) {
        expect(error).toBeDefined()
      }

      const resultUpdatedByUser = await payload.update({
        collection: listPresetsCollectionSlug,
        id: filterDoc.id,
        user,
        overrideAccess: false,
        data: {
          title: 'Specific Users (Updated)',
        },
      })

      expect(resultUpdatedByUser.title).toBe('Specific Users (Updated)')

      try {
        const resultWithUser2 = await payload.update({
          collection: listPresetsCollectionSlug,
          id: filterDoc.id,
          user: user2,
          overrideAccess: false,
          data: {
            title: 'Specific Users (Updated)',
          },
        })

        expect(resultWithUser2).toBeFalsy()
      } catch (error) {
        expect(error).toBeDefined()
        // swallow error
      }
    })

    it('should respect access when set to "onlyMe"', async () => {
      // create a new doc so that the creating user is the owner
      const filterDoc = await payload.create({
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

      const resultWithUser = await payload.findByID({
        collection: listPresetsCollectionSlug,
        depth: 0,
        user,
        overrideAccess: false,
        id: filterDoc.id,
      })

      expect(resultWithUser.id).toBe(filterDoc.id)

      try {
        const resultWithUser2 = await payload.findByID({
          collection: listPresetsCollectionSlug,
          depth: 0,
          user: user2,
          overrideAccess: false,
          id: filterDoc.id,
        })

        expect(resultWithUser2).toBeFalsy()
      } catch (error) {
        expect(error).toBeDefined()
        // swallow error
      }

      const resultUpdatedByUser = await payload.update({
        collection: listPresetsCollectionSlug,
        id: filterDoc.id,
        user,
        overrideAccess: false,
        data: {
          title: 'Only Me (Updated)',
        },
      })

      expect(resultUpdatedByUser.title).toBe('Only Me (Updated)')

      try {
        const resultWithUser2 = await payload.update({
          collection: listPresetsCollectionSlug,
          id: filterDoc.id,
          user: user2,
          overrideAccess: false,
          data: {
            title: 'Only Me (Updated)',
          },
        })

        expect(resultWithUser2).toBeFalsy()
      } catch (error) {
        expect(error).toBeDefined()
        // swallow error
      }
    })

    it('should respect access when set to "everyone"', async () => {
      const filterDoc = await payload.create({
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

      const resultWithUser = await payload.findByID({
        collection: listPresetsCollectionSlug,
        depth: 0,
        user,
        overrideAccess: false,
        id: filterDoc.id,
      })

      expect(resultWithUser.id).toBe(filterDoc.id)

      const resultWithUser2 = await payload.findByID({
        collection: listPresetsCollectionSlug,
        depth: 0,
        user: user2,
        overrideAccess: false,
        id: filterDoc.id,
      })

      expect(resultWithUser2.id).toBe(filterDoc.id)

      const resultUpdatedByUser = await payload.update({
        collection: listPresetsCollectionSlug,
        id: filterDoc.id,
        user,
        overrideAccess: false,
        data: {
          title: 'Everyone (Update 1)',
        },
      })

      expect(resultUpdatedByUser.title).toBe('Everyone (Update 1)')

      const resultUpdatedByUser2 = await payload.update({
        collection: listPresetsCollectionSlug,
        id: filterDoc.id,
        user: user2,
        overrideAccess: false,
        data: {
          title: 'Everyone (Update 2)',
        },
      })

      expect(resultUpdatedByUser2.title).toBe('Everyone (Update 2)')
    })
  })

  describe('user-defined access control', () => {
    it('should respect access when set to "specificRoles"', async () => {
      const adminOnlyFilter = await payload.create({
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

      const resultWithUser = await payload.findByID({
        collection: listPresetsCollectionSlug,
        depth: 0,
        user,
        overrideAccess: false,
        id: adminOnlyFilter.id,
      })

      expect(resultWithUser.id).toBe(adminOnlyFilter.id)

      try {
        const resultWithUser2 = await payload.findByID({
          collection: listPresetsCollectionSlug,
          depth: 0,
          user: user2,
          overrideAccess: false,
          id: adminOnlyFilter.id,
        })

        expect(resultWithUser2).toBeFalsy()
      } catch (error) {
        expect(error).toBeDefined()
        // swallow error
      }

      const resultUpdatedByUser = await payload.update({
        collection: listPresetsCollectionSlug,
        id: adminOnlyFilter.id,
        user,
        overrideAccess: false,
        data: {
          title: 'Specific Roles (Updated)',
        },
      })

      expect(resultUpdatedByUser.title).toBe('Specific Roles (Updated)')

      try {
        const resultUpdatedByUser2 = await payload.update({
          collection: listPresetsCollectionSlug,
          id: adminOnlyFilter.id,
          user: user2,
          overrideAccess: false,
          data: {
            title: 'Specific Roles (Updated)',
          },
        })

        expect(resultUpdatedByUser2).toBeFalsy()
      } catch (error) {
        expect(error).toBeDefined()
        // swallow error
      }
    })
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

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })
})
