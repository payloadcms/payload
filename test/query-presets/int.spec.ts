import type { NextRESTClient } from 'helpers/NextRESTClient.js'
import type { Payload, User } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { devUser, regularUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'

const queryPresetsCollectionSlug = 'payload-query-presets'

let payload: Payload
let restClient: NextRESTClient
let user: User
let user2: User
let anonymousUser: User

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Query Presets', () => {
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

    anonymousUser = await payload
      .login({
        collection: 'users',
        data: {
          email: 'anonymous@email.com',
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
    it('should only allow logged in users to perform actions', async () => {
      // create
      try {
        const result = await payload.create({
          collection: queryPresetsCollectionSlug,
          user: undefined,
          overrideAccess: false,
          data: {
            title: 'Only Logged In Users',
            relatedCollection: 'pages',
          },
        })

        expect(result).toBeFalsy()
      } catch (error: unknown) {
        expect((error as Error).message).toBe('You are not allowed to perform this action.')
      }

      const { id } = await payload.create({
        collection: queryPresetsCollectionSlug,
        data: {
          title: 'Only Logged In Users',
          relatedCollection: 'pages',
        },
      })

      // read
      try {
        const result = await payload.findByID({
          collection: queryPresetsCollectionSlug,
          depth: 0,
          user: undefined,
          overrideAccess: false,
          id,
        })

        expect(result).toBeFalsy()
      } catch (error: unknown) {
        expect((error as Error).message).toBe('You are not allowed to perform this action.')
      }

      // update
      try {
        const result = await payload.update({
          collection: queryPresetsCollectionSlug,
          id,
          user: undefined,
          overrideAccess: false,
          data: {
            title: 'Only Logged In Users (Updated)',
          },
        })

        expect(result).toBeFalsy()
      } catch (error: unknown) {
        expect((error as Error).message).toBe('You are not allowed to perform this action.')

        // make sure the update didn't go through
        const preset = await payload.findByID({
          collection: queryPresetsCollectionSlug,
          depth: 0,
          id,
        })

        expect(preset.title).toBe('Only Logged In Users')
      }

      // delete
      try {
        const result = await payload.delete({
          collection: queryPresetsCollectionSlug,
          id: 'some-id',
          user: undefined,
          overrideAccess: false,
        })

        expect(result).toBeFalsy()
      } catch (error: unknown) {
        expect((error as Error).message).toBe('You are not allowed to perform this action.')

        // make sure the delete didn't go through
        const preset = await payload.findByID({
          collection: queryPresetsCollectionSlug,
          depth: 0,
          id,
        })

        expect(preset.title).toBe('Only Logged In Users')
      }
    })

    it('should respect access when set to "specificUsers"', async () => {
      const presetForSpecificUsers = await payload.create({
        collection: queryPresetsCollectionSlug,
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
        collection: queryPresetsCollectionSlug,
        depth: 0,
        user,
        overrideAccess: false,
        id: presetForSpecificUsers.id,
      })

      expect(foundPresetWithUser1.id).toBe(presetForSpecificUsers.id)

      try {
        const foundPresetWithUser2 = await payload.findByID({
          collection: queryPresetsCollectionSlug,
          depth: 0,
          user: user2,
          overrideAccess: false,
          id: presetForSpecificUsers.id,
        })

        expect(foundPresetWithUser2).toBeFalsy()
      } catch (error: unknown) {
        expect((error as Error).message).toBe('Not Found')
      }

      const presetUpdatedByUser1 = await payload.update({
        collection: queryPresetsCollectionSlug,
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
          collection: queryPresetsCollectionSlug,
          id: presetForSpecificUsers.id,
          user: user2,
          overrideAccess: false,
          data: {
            title: 'Specific Users (Updated)',
          },
        })

        expect(presetUpdatedByUser2).toBeFalsy()
      } catch (error: unknown) {
        expect((error as Error).message).toBe('You are not allowed to perform this action.')
      }
    })

    it('should respect access when set to "onlyMe"', async () => {
      // create a new doc so that the creating user is the owner
      const presetForOnlyMe = await payload.create({
        collection: queryPresetsCollectionSlug,
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
        collection: queryPresetsCollectionSlug,
        depth: 0,
        user,
        overrideAccess: false,
        id: presetForOnlyMe.id,
      })

      expect(foundPresetWithUser1.id).toBe(presetForOnlyMe.id)

      try {
        const foundPresetWithUser2 = await payload.findByID({
          collection: queryPresetsCollectionSlug,
          depth: 0,
          user: user2,
          overrideAccess: false,
          id: presetForOnlyMe.id,
        })

        expect(foundPresetWithUser2).toBeFalsy()
      } catch (error: unknown) {
        expect((error as Error).message).toBe('Not Found')
      }

      const presetUpdatedByUser1 = await payload.update({
        collection: queryPresetsCollectionSlug,
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
          collection: queryPresetsCollectionSlug,
          id: presetForOnlyMe.id,
          user: user2,
          overrideAccess: false,
          data: {
            title: 'Only Me (Updated)',
          },
        })

        expect(presetUpdatedByUser2).toBeFalsy()
      } catch (error: unknown) {
        expect((error as Error).message).toBe('You are not allowed to perform this action.')
      }
    })

    it('should respect access when set to "everyone"', async () => {
      const presetForEveryone = await payload.create({
        collection: queryPresetsCollectionSlug,
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
            delete: {
              constraint: 'everyone',
            },
          },
          relatedCollection: 'pages',
        },
      })

      const foundPresetWithUser1 = await payload.findByID({
        collection: queryPresetsCollectionSlug,
        depth: 0,
        user,
        overrideAccess: false,
        id: presetForEveryone.id,
      })

      expect(foundPresetWithUser1.id).toBe(presetForEveryone.id)

      const foundPresetWithUser2 = await payload.findByID({
        collection: queryPresetsCollectionSlug,
        depth: 0,
        user: user2,
        overrideAccess: false,
        id: presetForEveryone.id,
      })

      expect(foundPresetWithUser2.id).toBe(presetForEveryone.id)

      const presetUpdatedByUser1 = await payload.update({
        collection: queryPresetsCollectionSlug,
        id: presetForEveryone.id,
        user,
        overrideAccess: false,
        data: {
          title: 'Everyone (Update 1)',
        },
      })

      expect(presetUpdatedByUser1.title).toBe('Everyone (Update 1)')

      const presetUpdatedByUser2 = await payload.update({
        collection: queryPresetsCollectionSlug,
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
    it('should respect top-level access control overrides', async () => {
      const preset = await payload.create({
        collection: queryPresetsCollectionSlug,
        user,
        data: {
          title: 'Top-Level Access Control Override',
          relatedCollection: 'pages',
          access: {
            read: {
              constraint: 'everyone',
            },
            update: {
              constraint: 'everyone',
            },
            delete: {
              constraint: 'everyone',
            },
          },
        },
      })

      const foundPresetWithUser1 = await payload.findByID({
        collection: queryPresetsCollectionSlug,
        depth: 0,
        user,
        overrideAccess: false,
        id: preset.id,
      })

      expect(foundPresetWithUser1.id).toBe(preset.id)

      try {
        const foundPresetWithAnonymousUser = await payload.findByID({
          collection: queryPresetsCollectionSlug,
          depth: 0,
          user: anonymousUser,
          overrideAccess: false,
          id: preset.id,
        })

        expect(foundPresetWithAnonymousUser).toBeFalsy()
      } catch (error: unknown) {
        expect((error as Error).message).toBe('You are not allowed to perform this action.')
      }
    })

    it('should respect access when set to "specificRoles"', async () => {
      const presetForSpecificRoles = await payload.create({
        collection: queryPresetsCollectionSlug,
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
        collection: queryPresetsCollectionSlug,
        depth: 0,
        user,
        overrideAccess: false,
        id: presetForSpecificRoles.id,
      })

      expect(foundPresetWithUser1.id).toBe(presetForSpecificRoles.id)

      try {
        const foundPresetWithUser2 = await payload.findByID({
          collection: queryPresetsCollectionSlug,
          depth: 0,
          user: user2,
          overrideAccess: false,
          id: presetForSpecificRoles.id,
        })

        expect(foundPresetWithUser2).toBeFalsy()
      } catch (error: unknown) {
        expect((error as Error).message).toBe('Not Found')
      }

      const presetUpdatedByUser1 = await payload.update({
        collection: queryPresetsCollectionSlug,
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
          collection: queryPresetsCollectionSlug,
          id: presetForSpecificRoles.id,
          user: user2,
          overrideAccess: false,
          data: {
            title: 'Specific Roles (Updated)',
          },
        })

        expect(presetUpdatedByUser2).toBeFalsy()
      } catch (error: unknown) {
        expect((error as Error).message).toBe('You are not allowed to perform this action.')
      }
    })
  })

  it.skip('should disable query presets when "enabledQueryPresets" is not true on the collection', async () => {
    try {
      const result = await payload.create({
        collection: 'payload-query-presets',
        user,
        data: {
          title: 'Disabled Query Presets',
          relatedCollection: 'pages',
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
        collection: queryPresetsCollectionSlug,
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
            delete: {
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
