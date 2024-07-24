import type { CollectionPermission, Permissions } from '../auth/types.js'

import { recursivelySanitizePermissions, sanitizePermissions } from './sanitizePermissions.js'

/* eslint-disable perfectionist/sort-objects */
describe('recursivelySanitizePermissions', () => {
  it('should sanitize a basic collection', () => {
    const permissions: CollectionPermission = {
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
        permission: false,
      },
      readVersions: {
        permission: true,
      },
    }

    recursivelySanitizePermissions(permissions)

    expect(permissions).toStrictEqual({
      fields: true,
      create: true,
      read: true,
      update: true,
      readVersions: true,
    })
  })

  it('should sanitize a collection with where queries', () => {
    const permissions: CollectionPermission = {
      fields: {},
      create: {
        permission: true,
        where: {
          user: {
            equals: 2,
          },
        },
      },
      read: {
        permission: true,
      },
      update: {
        permission: true,
      },
      delete: {
        permission: false,
      },
      readVersions: {
        permission: true,
        where: {
          user: {
            equals: 1,
          },
        },
      },
    }

    recursivelySanitizePermissions(permissions)

    expect(permissions).toStrictEqual({
      create: {
        permission: true,
        where: {
          user: {
            equals: 2,
          },
        },
      },
      read: true,
      update: true,
      readVersions: {
        permission: true,
        where: {
          user: {
            equals: 1,
          },
        },
      },
    })
  })

  it('should sanitize a collection with nested fields in blocks', () => {
    const permissions: Partial<CollectionPermission> = {
      fields: {
        blocks: {
          create: {
            permission: true,
          },
          blocks: {
            blockWithTitle: {
              fields: {
                blockTitle: {
                  create: {
                    permission: true,
                  },
                  read: {
                    permission: true,
                  },
                  update: {
                    permission: true,
                  },
                },
                id: {
                  create: {
                    permission: true,
                  },
                  read: {
                    permission: true,
                  },
                  update: {
                    permission: true,
                  },
                },
                blockName: {
                  create: {
                    permission: true,
                  },
                  read: {
                    permission: true,
                  },
                  update: {
                    permission: true,
                  },
                },
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

    recursivelySanitizePermissions(permissions)

    expect(permissions).toStrictEqual({
      fields: {
        blocks: {
          create: true,
          blocks: {
            blockWithTitle: {
              fields: true,
              create: true,
              read: true,
              update: true,
            },
          },
          read: true,
          update: true,
        },
      },
    })
  })

  it('should sanitize a collection with nested fields in arrays', () => {
    const permissions: Partial<CollectionPermission> = {
      fields: {
        arrayOfText: {
          create: {
            permission: true,
          },
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
            },
            hiddenText: {
              create: {
                permission: true,
              },
              read: {
                permission: false,
              },
              update: {
                permission: true,
              },
            },
            id: {
              create: {
                permission: true,
              },
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

    recursivelySanitizePermissions(permissions)

    expect(permissions).toStrictEqual({
      fields: {
        arrayOfText: {
          create: true,
          fields: {
            text: true,
            hiddenText: {
              create: true,
              update: true,
            },
            id: true,
          },
          read: true,
          update: true,
        },
      },
    })
  })

  it('should sanitize a collection with nested fields in richText', () => {
    const permissions: Partial<CollectionPermission> = {
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
        },
      },
    }

    recursivelySanitizePermissions(permissions)

    expect(permissions).toStrictEqual({
      fields: true,
    })
  })
})

describe('sanitizePermissions', () => {
  it('should return nothing for unauthenticated user', () => {
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
                permission: false,
              },
              update: {
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
      },
      globals: {
        menu: {
          fields: {
            globalText: {
              create: {
                permission: false,
              },
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

    expect(sanitizedPermissions).toStrictEqual({})
  })
})
