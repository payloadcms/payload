import util from 'node:util'

import type { Permissions } from '../auth/types.js'

import { sanitizePermissions } from './sanitizePermissions.js'

/* eslint-disable perfectionist/sort-objects */
describe('sanitizePermissions', () => {
  it('should sanitize permissions for logged in user', async () => {
    const permissions: Permissions = {
      canAccessAdmin: true,
      collections: {
        'payload-preferences': {
          fields: {
            user: {
              create: {
                permission: true,
              },
              read: {
                permission: true,
              },
              update: {
                permission: true,
              },
              delete: {
                permission: true,
              },
            },
            key: {
              create: {
                permission: true,
              },
              read: {
                permission: true,
              },
              update: {
                permission: true,
              },
              delete: {
                permission: true,
              },
            },
            value: {
              create: {
                permission: true,
              },
              read: {
                permission: true,
              },
              update: {
                permission: true,
              },
              delete: {
                permission: true,
              },
            },
            updatedAt: {
              create: {
                permission: true,
              },
              read: {
                permission: true,
              },
              update: {
                permission: true,
              },
              delete: {
                permission: true,
              },
            },
            createdAt: {
              create: {
                permission: true,
              },
              read: {
                permission: true,
              },
              update: {
                permission: true,
              },
              delete: {
                permission: true,
              },
            },
          },
          create: {
            permission: true,
          },
          read: {
            permission: true,
            where: {
              'user.value': {
                equals: 1,
              },
            },
          },
          update: {
            permission: true,
          },
          delete: {
            permission: true,
            where: {
              'user.value': {
                equals: 1,
              },
            },
          },
        },
        'payload-migrations': {
          fields: {
            name: {
              create: {
                permission: true,
              },
              read: {
                permission: true,
              },
              update: {
                permission: true,
              },
              delete: {
                permission: true,
              },
            },
            batch: {
              create: {
                permission: true,
              },
              read: {
                permission: true,
              },
              update: {
                permission: true,
              },
              delete: {
                permission: true,
              },
            },
            updatedAt: {
              create: {
                permission: true,
              },
              read: {
                permission: true,
              },
              update: {
                permission: true,
              },
              delete: {
                permission: true,
              },
            },
            createdAt: {
              create: {
                permission: true,
              },
              read: {
                permission: true,
              },
              update: {
                permission: true,
              },
              delete: {
                permission: true,
              },
            },
          },
          create: {
            permission: true,
          },
          read: {
            permission: true,
          },
          update: {
            permission: true,
          },
          delete: {
            permission: true,
          },
        },
        posts: {
          fields: {
            text: {
              create: {
                permission: true,
              },
              read: {
                permission: true,
              },
              update: {
                permission: true,
              },
              delete: {
                permission: true,
              },
              readVersions: {
                permission: true,
              },
            },
            richText: {
              create: {
                permission: true,
              },
              read: {
                permission: true,
              },
              update: {
                permission: true,
              },
              delete: {
                permission: true,
              },
              readVersions: {
                permission: true,
              },
            },
            updatedAt: {
              create: {
                permission: true,
              },
              read: {
                permission: true,
              },
              update: {
                permission: true,
              },
              delete: {
                permission: true,
              },
              readVersions: {
                permission: true,
              },
            },
            createdAt: {
              create: {
                permission: true,
              },
              read: {
                permission: true,
              },
              update: {
                permission: true,
              },
              delete: {
                permission: true,
              },
              readVersions: {
                permission: true,
              },
            },
            _status: {
              create: {
                permission: true,
              },
              read: {
                permission: true,
              },
              update: {
                permission: true,
              },
              delete: {
                permission: true,
              },
              readVersions: {
                permission: true,
              },
            },
          },
          create: {
            permission: true,
          },
          read: {
            permission: true,
          },
          update: {
            permission: true,
          },
          delete: {
            permission: true,
          },
          readVersions: {
            permission: true,
          },
        },
        users: {
          fields: {
            updatedAt: {
              create: {
                permission: true,
              },
              read: {
                permission: true,
              },
              update: {
                permission: true,
              },
              delete: {
                permission: true,
              },
              unlock: {
                permission: true,
              },
            },
            createdAt: {
              create: {
                permission: true,
              },
              read: {
                permission: true,
              },
              update: {
                permission: true,
              },
              delete: {
                permission: true,
              },
              unlock: {
                permission: true,
              },
            },
            email: {
              create: {
                permission: true,
              },
              read: {
                permission: true,
              },
              update: {
                permission: true,
              },
              delete: {
                permission: true,
              },
              unlock: {
                permission: true,
              },
            },
            resetPasswordToken: {
              create: {
                permission: true,
              },
              read: {
                permission: true,
              },
              update: {
                permission: true,
              },
              delete: {
                permission: true,
              },
              unlock: {
                permission: true,
              },
            },
            resetPasswordExpiration: {
              create: {
                permission: true,
              },
              read: {
                permission: true,
              },
              update: {
                permission: true,
              },
              delete: {
                permission: true,
              },
              unlock: {
                permission: true,
              },
            },
            salt: {
              create: {
                permission: true,
              },
              read: {
                permission: true,
              },
              update: {
                permission: true,
              },
              delete: {
                permission: true,
              },
              unlock: {
                permission: true,
              },
            },
            hash: {
              create: {
                permission: true,
              },
              read: {
                permission: true,
              },
              update: {
                permission: true,
              },
              delete: {
                permission: true,
              },
              unlock: {
                permission: true,
              },
            },
            loginAttempts: {
              create: {
                permission: true,
              },
              read: {
                permission: true,
              },
              update: {
                permission: true,
              },
              delete: {
                permission: true,
              },
              unlock: {
                permission: true,
              },
            },
            lockUntil: {
              create: {
                permission: true,
              },
              read: {
                permission: true,
              },
              update: {
                permission: true,
              },
              delete: {
                permission: true,
              },
              unlock: {
                permission: true,
              },
            },
          },
          create: {
            permission: true,
          },
          read: {
            permission: true,
          },
          update: {
            permission: true,
          },
          delete: {
            permission: true,
          },
          unlock: {
            permission: true,
          },
        },
      },
      globals: {
        menu: {
          fields: {
            globalText: {
              read: {
                permission: true,
              },
              update: {
                permission: true,
              },
            },
            updatedAt: {
              read: {
                permission: true,
              },
              update: {
                permission: true,
              },
            },
            createdAt: {
              read: {
                permission: true,
              },
              update: {
                permission: true,
              },
            },
          },
          read: {
            permission: true,
          },
          update: {
            permission: true,
          },
        },
      },
    }

    const sanitizedPermissions = sanitizePermissions(permissions)

    expect(sanitizedPermissions).toStrictEqual({
      canAccessAdmin: true,
      collections: {
        'payload-preferences': {
          fields: true,
          create: true,
          read: {
            permission: true,
            where: {
              'user.value': {
                equals: 1,
              },
            },
          },
          update: true,
          delete: {
            permission: true,
            where: {
              'user.value': {
                equals: 1,
              },
            },
          },
        },
        'payload-migrations': {
          fields: true,
          create: true,
          read: true,
          update: true,
          delete: true,
        },
        posts: {
          fields: true,
          create: true,
          read: true,
          update: true,
          delete: true,
          readVersions: true,
        },
        users: {
          fields: true,
          create: true,
          read: true,
          update: true,
          delete: true,
          unlock: true,
        },
      },
      globals: {
        menu: {
          fields: true,
          read: true,
          update: true,
        },
      },
    })
  })

  it('should sanitize permissions for unauthenticated user', async () => {
    const permissions: Permissions = {
      canAccessAdmin: false,
      collections: {
        'payload-preferences': {
          fields: {
            user: {
              create: {
                permission: false,
              },
              read: {
                permission: true,
              },
              update: {
                permission: false,
              },
              delete: {
                permission: true,
              },
            },
            key: {
              create: {
                permission: false,
              },
              read: {
                permission: true,
              },
              update: {
                permission: false,
              },
              delete: {
                permission: true,
              },
            },
            value: {
              create: {
                permission: false,
              },
              read: {
                permission: true,
              },
              update: {
                permission: false,
              },
              delete: {
                permission: true,
              },
            },
            updatedAt: {
              create: {
                permission: false,
              },
              read: {
                permission: true,
              },
              update: {
                permission: false,
              },
              delete: {
                permission: true,
              },
            },
            createdAt: {
              create: {
                permission: false,
              },
              read: {
                permission: true,
              },
              update: {
                permission: false,
              },
              delete: {
                permission: true,
              },
            },
          },
          create: {
            permission: false,
          },
          read: {
            permission: true,
            where: {
              'user.value': {},
            },
          },
          update: {
            permission: false,
          },
          delete: {
            permission: true,
            where: {
              'user.value': {},
            },
          },
        },
        'payload-migrations': {
          fields: {
            name: {
              create: {
                permission: false,
              },
              read: {
                permission: false,
              },
              update: {
                permission: false,
              },
              delete: {
                permission: false,
              },
            },
            batch: {
              create: {
                permission: false,
              },
              read: {
                permission: false,
              },
              update: {
                permission: false,
              },
              delete: {
                permission: false,
              },
            },
            updatedAt: {
              create: {
                permission: false,
              },
              read: {
                permission: false,
              },
              update: {
                permission: false,
              },
              delete: {
                permission: false,
              },
            },
            createdAt: {
              create: {
                permission: false,
              },
              read: {
                permission: false,
              },
              update: {
                permission: false,
              },
              delete: {
                permission: false,
              },
            },
          },
          create: {
            permission: false,
          },
          read: {
            permission: false,
          },
          update: {
            permission: false,
          },
          delete: {
            permission: false,
          },
        },
        posts: {
          fields: {
            text: {
              create: {
                permission: false,
              },
              read: {
                permission: false,
              },
              update: {
                permission: false,
              },
              delete: {
                permission: false,
              },
              readVersions: {
                permission: false,
              },
            },
            richText: {
              create: {
                permission: false,
              },
              read: {
                permission: false,
              },
              update: {
                permission: false,
              },
              delete: {
                permission: false,
              },
              readVersions: {
                permission: false,
              },
            },
            updatedAt: {
              create: {
                permission: false,
              },
              read: {
                permission: false,
              },
              update: {
                permission: false,
              },
              delete: {
                permission: false,
              },
              readVersions: {
                permission: false,
              },
            },
            createdAt: {
              create: {
                permission: false,
              },
              read: {
                permission: false,
              },
              update: {
                permission: false,
              },
              delete: {
                permission: false,
              },
              readVersions: {
                permission: false,
              },
            },
            _status: {
              create: {
                permission: false,
              },
              read: {
                permission: false,
              },
              update: {
                permission: false,
              },
              delete: {
                permission: false,
              },
              readVersions: {
                permission: false,
              },
            },
          },
          create: {
            permission: false,
          },
          read: {
            permission: false,
          },
          update: {
            permission: false,
          },
          delete: {
            permission: false,
          },
          readVersions: {
            permission: false,
          },
        },
        users: {
          fields: {
            updatedAt: {
              create: {
                permission: false,
              },
              read: {
                permission: false,
              },
              update: {
                permission: false,
              },
              delete: {
                permission: false,
              },
              unlock: {
                permission: false,
              },
            },
            createdAt: {
              create: {
                permission: false,
              },
              read: {
                permission: false,
              },
              update: {
                permission: false,
              },
              delete: {
                permission: false,
              },
              unlock: {
                permission: false,
              },
            },
            email: {
              create: {
                permission: false,
              },
              read: {
                permission: false,
              },
              update: {
                permission: false,
              },
              delete: {
                permission: false,
              },
              unlock: {
                permission: false,
              },
            },
            resetPasswordToken: {
              create: {
                permission: false,
              },
              read: {
                permission: false,
              },
              update: {
                permission: false,
              },
              delete: {
                permission: false,
              },
              unlock: {
                permission: false,
              },
            },
            resetPasswordExpiration: {
              create: {
                permission: false,
              },
              read: {
                permission: false,
              },
              update: {
                permission: false,
              },
              delete: {
                permission: false,
              },
              unlock: {
                permission: false,
              },
            },
            salt: {
              create: {
                permission: false,
              },
              read: {
                permission: false,
              },
              update: {
                permission: false,
              },
              delete: {
                permission: false,
              },
              unlock: {
                permission: false,
              },
            },
            hash: {
              create: {
                permission: false,
              },
              read: {
                permission: false,
              },
              update: {
                permission: false,
              },
              delete: {
                permission: false,
              },
              unlock: {
                permission: false,
              },
            },
            loginAttempts: {
              create: {
                permission: false,
              },
              read: {
                permission: false,
              },
              update: {
                permission: false,
              },
              delete: {
                permission: false,
              },
              unlock: {
                permission: false,
              },
            },
            lockUntil: {
              create: {
                permission: false,
              },
              read: {
                permission: false,
              },
              update: {
                permission: false,
              },
              delete: {
                permission: false,
              },
              unlock: {
                permission: false,
              },
            },
          },
          create: {
            permission: false,
          },
          read: {
            permission: false,
          },
          update: {
            permission: false,
          },
          delete: {
            permission: false,
          },
          unlock: {
            permission: false,
          },
        },
      },
      globals: {
        menu: {
          fields: {
            globalText: {
              read: {
                permission: false,
              },
              update: {
                permission: false,
              },
            },
            updatedAt: {
              read: {
                permission: false,
              },
              update: {
                permission: false,
              },
            },
            createdAt: {
              read: {
                permission: false,
              },
              update: {
                permission: false,
              },
            },
          },
          read: {
            permission: false,
          },
          update: {
            permission: false,
          },
        },
      },
    }

    const sanitizedPermissions = sanitizePermissions(permissions)
    expect(sanitizedPermissions).toStrictEqual({
      collections: {
        'payload-preferences': {
          fields: {
            user: {
              read: true,
              delete: true,
            },
            key: {
              read: true,
              delete: true,
            },
            value: {
              read: true,
              delete: true,
            },
            updatedAt: {
              read: true,
              delete: true,
            },
            createdAt: {
              read: true,
              delete: true,
            },
          },
          read: {
            permission: true,
          },
          delete: {
            permission: true,
          },
        },
      },
    })
  })
})
