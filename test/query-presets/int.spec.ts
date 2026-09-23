import type { User } from 'payload'

import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { devUser, regularUser } from '../credentials.js'

const queryPresetsCollectionSlug = 'payload-query-presets'
let adminUser: User
let editorUser: User
let publicUser: User

test.suite({ config: './config.ts', resetBetweenTests: false })('Query Presets', () => {
  test.beforeAll(async ({ payloadInstance: payload }) => {
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

    publicUser = await payload
      .login({
        collection: 'users',
        data: {
          email: 'public@email.com',
          password: regularUser.password,
        },
      })
      ?.then((result) => result.user)
  })

  test('should not inject authorship fields into the internal query-presets collection', ({
    payload,
  }) => {
    const fields = payload.collections[queryPresetsCollectionSlug].config.fields
    const names = fields.filter((f) => 'name' in f).map((f) => (f as { name: string }).name)

    expect(names).not.toContain('createdBy')
    expect(names).not.toContain('updatedBy')
  })

  test.describe('default access control', () => {
    test('should only allow logged in users to perform actions', async ({ payload }) => {
      // create
      await expect(
        payload.create({
          collection: queryPresetsCollectionSlug,
          user: undefined,
          overrideAccess: false,
          data: {
            title: 'Only Logged In Users',
            relatedCollection: 'pages',
          },
        }),
      ).rejects.toThrow('You are not allowed to perform this action.')

      const { id } = await payload.create({
        collection: queryPresetsCollectionSlug,
        data: {
          title: 'Only Logged In Users',
          relatedCollection: 'pages',
        },
      })

      // read
      await expect(
        payload.findByID({
          collection: queryPresetsCollectionSlug,
          depth: 0,
          user: undefined,
          overrideAccess: false,
          id,
        }),
      ).rejects.toThrow('You are not allowed to perform this action.')

      // update
      await expect(
        payload.update({
          collection: queryPresetsCollectionSlug,
          id,
          user: undefined,
          overrideAccess: false,
          data: {
            title: 'Only Logged In Users (Updated)',
          },
        }),
      ).rejects.toThrow('You are not allowed to perform this action.')

      // make sure the update didn't go through
      const preset = await payload.findByID({
        collection: queryPresetsCollectionSlug,
        depth: 0,
        id,
      })

      expect(preset.title).toBe('Only Logged In Users')

      // delete
      await expect(
        payload.delete({
          collection: queryPresetsCollectionSlug,
          id: 'some-id',
          user: undefined,
          overrideAccess: false,
        }),
      ).rejects.toThrow('You are not allowed to perform this action.')

      // make sure the delete didn't go through
      const presetAfterDelete = await payload.findByID({
        collection: queryPresetsCollectionSlug,
        depth: 0,
        id,
      })

      expect(presetAfterDelete.title).toBe('Only Logged In Users')
    })

    test('should respect access when set to "specificUsers"', async ({ payload }) => {
      const presetForSpecificUsers = await payload.create({
        collection: queryPresetsCollectionSlug,
        user: adminUser,
        overrideAccess: false,
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
              users: [adminUser.id],
            },
            update: {
              constraint: 'specificUsers',
              users: [adminUser.id],
            },
          },
          relatedCollection: 'pages',
        },
      })

      const foundPresetWithUser1 = await payload.findByID({
        collection: queryPresetsCollectionSlug,
        depth: 0,
        user: adminUser,
        overrideAccess: false,
        id: presetForSpecificUsers.id,
      })

      expect(foundPresetWithUser1.id).toBe(presetForSpecificUsers.id)

      await expect(
        payload.findByID({
          collection: queryPresetsCollectionSlug,
          depth: 0,
          user: editorUser,
          overrideAccess: false,
          id: presetForSpecificUsers.id,
        }),
      ).rejects.toThrow('Not Found')

      const presetUpdatedByAdminUser = await payload.update({
        collection: queryPresetsCollectionSlug,
        id: presetForSpecificUsers.id,
        user: adminUser,
        overrideAccess: false,
        data: {
          title: 'Specific Users (Updated)',
        },
      })

      expect(presetUpdatedByAdminUser.title).toBe('Specific Users (Updated)')

      await expect(
        payload.update({
          collection: queryPresetsCollectionSlug,
          id: presetForSpecificUsers.id,
          user: editorUser,
          overrideAccess: false,
          data: {
            title: 'Specific Users (Updated)',
          },
        }),
      ).rejects.toThrow('You are not allowed to perform this action.')
    })

    test('should respect access when set to "onlyMe"', async ({ payload }) => {
      const presetForOnlyMe = await payload.create({
        collection: queryPresetsCollectionSlug,
        overrideAccess: false,
        user: adminUser,
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
        user: adminUser,
        overrideAccess: false,
        id: presetForOnlyMe.id,
      })

      expect(foundPresetWithUser1.id).toBe(presetForOnlyMe.id)

      await expect(
        payload.findByID({
          collection: queryPresetsCollectionSlug,
          depth: 0,
          user: editorUser,
          overrideAccess: false,
          id: presetForOnlyMe.id,
        }),
      ).rejects.toThrow('Not Found')

      const presetUpdatedByUser1 = await payload.update({
        collection: queryPresetsCollectionSlug,
        id: presetForOnlyMe.id,
        user: adminUser,
        overrideAccess: false,
        data: {
          title: 'Only Me (Updated)',
        },
      })

      expect(presetUpdatedByUser1.title).toBe('Only Me (Updated)')

      await expect(
        payload.update({
          collection: queryPresetsCollectionSlug,
          id: presetForOnlyMe.id,
          user: editorUser,
          overrideAccess: false,
          data: {
            title: 'Only Me (Updated)',
          },
        }),
      ).rejects.toThrow('You are not allowed to perform this action.')
    })

    test('should respect access when set to "everyone"', async ({ payload }) => {
      const presetForEveryone = await payload.create({
        collection: queryPresetsCollectionSlug,
        overrideAccess: false,
        user: adminUser,
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
        user: adminUser,
        overrideAccess: false,
        id: presetForEveryone.id,
      })

      expect(foundPresetWithUser1.id).toBe(presetForEveryone.id)

      const foundPresetWithEditorUser = await payload.findByID({
        collection: queryPresetsCollectionSlug,
        depth: 0,
        user: editorUser,
        overrideAccess: false,
        id: presetForEveryone.id,
      })

      expect(foundPresetWithEditorUser.id).toBe(presetForEveryone.id)

      const presetUpdatedByUser1 = await payload.update({
        collection: queryPresetsCollectionSlug,
        id: presetForEveryone.id,
        user: adminUser,
        overrideAccess: false,
        data: {
          title: 'Everyone (Update 1)',
        },
      })

      expect(presetUpdatedByUser1.title).toBe('Everyone (Update 1)')

      const presetUpdatedByEditorUser = await payload.update({
        collection: queryPresetsCollectionSlug,
        id: presetForEveryone.id,
        user: editorUser,
        overrideAccess: false,
        data: {
          title: 'Everyone (Update 2)',
        },
      })

      expect(presetUpdatedByEditorUser.title).toBe('Everyone (Update 2)')
    })

    test('should prevent accidental lockout', async ({ payload }) => {
      // create a preset using "specificRoles"
      // this will ensure the user on the request is _NOT_ automatically added to the `users` list
      // and will throw a validation error instead
      await expect(
        payload.create({
          collection: queryPresetsCollectionSlug,
          user: editorUser,
          overrideAccess: false,
          data: {
            title: 'Prevent Lockout',
            relatedCollection: 'pages',
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
          },
        }),
      ).rejects.toThrow('This action will lock you out of this preset.')

      // create a preset using "specificUsers"
      // this will ensure the user on the request _IS_ automatically added to the `users` list
      // this will avoid a validation error
      const presetWithoutAccess = await payload.create({
        collection: queryPresetsCollectionSlug,
        user: adminUser,
        overrideAccess: false,
        data: {
          title: 'Prevent Lockout',
          relatedCollection: 'pages',
          access: {
            read: {
              constraint: 'specificUsers',
              users: [],
            },
            update: {
              constraint: 'specificUsers',
              users: [],
            },
            delete: {
              constraint: 'specificUsers',
              users: [],
            },
          },
        },
      })

      // the user on the request is automatically added to the `users` array
      expect(
        presetWithoutAccess.access?.read?.users?.find(
          (user) => (typeof user === 'string' ? user : user.id) === adminUser.id,
        ),
      ).toBeTruthy()

      expect(
        presetWithoutAccess.access?.update?.users?.find(
          (user) => (typeof user === 'string' ? user : user.id) === adminUser.id,
        ),
      ).toBeTruthy()

      const presetWithUser1 = await payload.create({
        collection: queryPresetsCollectionSlug,
        user: adminUser,
        overrideAccess: false,
        data: {
          title: 'Prevent Lockout',
          relatedCollection: 'pages',
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
        },
      })

      // attempt to update the preset to lock the user out of access
      await expect(
        payload.update({
          collection: queryPresetsCollectionSlug,
          id: presetWithUser1.id,
          user: adminUser,
          overrideAccess: false,
          data: {
            title: 'Prevent Lockout (Updated)',
            access: {
              read: {
                constraint: 'specificRoles',
                roles: ['user'],
              },
              update: {
                constraint: 'specificRoles',
                roles: ['user'],
              },
            },
          },
        }),
      ).rejects.toThrow('This action will lock you out of this preset.')
    })
  })

  test.describe('user-defined access control', () => {
    test('should respect top-level access control overrides', async ({ payload }) => {
      const preset = await payload.create({
        collection: queryPresetsCollectionSlug,
        user: adminUser,
        overrideAccess: false,
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
        user: adminUser,
        overrideAccess: false,
        id: preset.id,
      })

      expect(foundPresetWithUser1.id).toBe(preset.id)

      await expect(
        payload.findByID({
          collection: queryPresetsCollectionSlug,
          depth: 0,
          user: publicUser,
          overrideAccess: false,
          id: preset.id,
        }),
      ).rejects.toThrow('You are not allowed to perform this action.')
    })

    test('should only allow admins to select the "onlyAdmins" preset (via `filterOptions`)', async ({
      payload,
    }) => {
      await expect(
        payload.create({
          collection: queryPresetsCollectionSlug,
          user: editorUser,
          overrideAccess: false,
          data: {
            title: 'Admins (Created by Editor)',
            where: {
              text: {
                equals: 'example page',
              },
            },
            access: {
              read: {
                constraint: 'onlyAdmins',
              },
              update: {
                constraint: 'onlyAdmins',
              },
            },
            relatedCollection: 'pages',
          },
        }),
      ).rejects.toThrow(
        'The following fields are invalid: Read > Specify who can read this Preset, Update > Specify who can update this Preset',
      )

      const presetForAdminsCreatedByAdmin = await payload.create({
        collection: queryPresetsCollectionSlug,
        user: adminUser,
        overrideAccess: false,
        data: {
          title: 'Admins (Created by Admin)',
          where: {
            text: {
              equals: 'example page',
            },
          },
          access: {
            read: {
              constraint: 'onlyAdmins',
            },
            update: {
              constraint: 'onlyAdmins',
            },
          },
          relatedCollection: 'pages',
        },
      })

      expect(presetForAdminsCreatedByAdmin).toBeDefined()

      // attempt to update the preset using an editor user
      await expect(
        payload.update({
          collection: queryPresetsCollectionSlug,
          id: presetForAdminsCreatedByAdmin.id,
          user: editorUser,
          overrideAccess: false,
          data: {
            title: 'From `onlyAdmins` to `onlyMe` (Updated by Editor)',
            access: {
              read: {
                constraint: 'onlyMe',
              },
              update: {
                constraint: 'onlyMe',
              },
            },
          },
        }),
      ).rejects.toThrow('You are not allowed to perform this action.')
    })

    test('should respect access when set to "specificRoles"', async ({ payload }) => {
      const presetForSpecificRoles = await payload.create({
        collection: queryPresetsCollectionSlug,
        user: adminUser,
        overrideAccess: false,
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
        user: adminUser,
        overrideAccess: false,
        id: presetForSpecificRoles.id,
      })

      expect(foundPresetWithUser1.id).toBe(presetForSpecificRoles.id)

      await expect(
        payload.findByID({
          collection: queryPresetsCollectionSlug,
          depth: 0,
          user: editorUser,
          overrideAccess: false,
          id: presetForSpecificRoles.id,
        }),
      ).rejects.toThrow('Not Found')

      const presetUpdatedByUser1 = await payload.update({
        collection: queryPresetsCollectionSlug,
        id: presetForSpecificRoles.id,
        user: adminUser,
        overrideAccess: false,
        data: {
          title: 'Specific Roles (Updated)',
        },
      })

      expect(presetUpdatedByUser1.title).toBe('Specific Roles (Updated)')

      await expect(
        payload.update({
          collection: queryPresetsCollectionSlug,
          id: presetForSpecificRoles.id,
          user: editorUser,
          overrideAccess: false,
          data: {
            title: 'Specific Roles (Updated)',
          },
        }),
      ).rejects.toThrow('You are not allowed to perform this action.')
    })

    test('should respect boolean access control results', async ({ payload }) => {
      // create a preset with the read constraint set to "noone"
      const presetForNoone = await payload.create({
        collection: queryPresetsCollectionSlug,
        user: adminUser,
        data: {
          relatedCollection: 'pages',
          title: 'Noone',
          where: {
            text: {
              equals: 'example page',
            },
          },
          access: {
            read: {
              constraint: 'noone',
            },
          },
        },
      })

      await expect(
        payload.findByID({
          collection: queryPresetsCollectionSlug,
          depth: 0,
          user: adminUser,
          overrideAccess: false,
          id: presetForNoone.id,
        }),
      ).rejects.toThrow('Not Found')
    })
  })

  test.skip('should disable query presets when "enabledQueryPresets" is not true on the collection', async ({
    payload,
  }) => {
    await expect(
      payload.create({
        collection: 'payload-query-presets',
        user: adminUser,
        overrideAccess: false,
        data: {
          title: 'Disabled Query Presets',
          relatedCollection: 'pages',
        },
      }),
    ).rejects.toThrow()
  })

  test.describe('Where object formatting', () => {
    test('transforms "where" query objects into the "and" / "or" format', async ({ payload }) => {
      const result = await payload.create({
        collection: queryPresetsCollectionSlug,
        user: adminUser,
        overrideAccess: false,
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

    test('should handle empty where and columns fields', async ({ payload }) => {
      const result = await payload.create({
        collection: queryPresetsCollectionSlug,
        user: adminUser,
        overrideAccess: false,
        data: {
          title: 'Empty Where and Columns',
          // Not including where or columns at all
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

      expect(result.where == null).toBe(true)
      expect(result.columns == null).toBe(true)

      const fetched = await payload.findByID({
        collection: queryPresetsCollectionSlug,
        depth: 0,
        user: adminUser,
        overrideAccess: false,
        id: result.id,
      })

      expect(fetched.where == null).toBe(true)
      expect(fetched.columns == null).toBe(true)
    })
  })
})
