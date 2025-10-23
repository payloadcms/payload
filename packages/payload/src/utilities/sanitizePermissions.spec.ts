import type { CollectionPermission, Permissions } from '../auth/types.js'
import { preferencesCollectionSlug } from '../preferences/config.js'

import { sanitizePermissions } from './sanitizePermissions.js'

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

    sanitizePermissions({
      canAccessAdmin: true,
      collections: {
        test: permissions,
      },
    })

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

    sanitizePermissions({
      canAccessAdmin: true,
      collections: {
        test: permissions,
      },
    })
    expect(permissions).toStrictEqual({
      create: {
        permission: true,
        where: {
          user: {
            equals: 2,
          },
        },
      },
      fields: true,
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
    const permissions: CollectionPermission = {
      create: {
        permission: true,
      },
      delete: {
        permission: true,
      },
      read: {
        permission: true,
      },
      update: {
        permission: true,
      },
      fields: {
        layout: {
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

    sanitizePermissions({
      canAccessAdmin: true,
      collections: {
        test: permissions,
      },
    })
    expect(permissions).toStrictEqual({
      create: true,
      delete: true,
      fields: true,
      read: true,
      update: true,
    })
  })

  it('should sanitize a collection with nested fields in blocks without truncating', () => {
    const permissions: CollectionPermission = {
      create: {
        permission: true,
      },
      delete: {
        permission: true,
      },
      read: {
        permission: true,
      },
      update: {
        permission: true,
      },
      fields: {
        layout: {
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
                    permission: false,
                  },
                  read: {
                    permission: true,
                  },
                  update: {
                    permission: false,
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

    sanitizePermissions({
      canAccessAdmin: true,
      collections: {
        test: permissions,
      },
    })
    expect(permissions).toStrictEqual({
      create: true,
      delete: true,
      read: true,
      update: true,
      fields: {
        layout: {
          create: true,
          blocks: {
            blockWithTitle: {
              fields: {
                blockTitle: true,
                id: true,
                blockName: {
                  read: true,
                },
              },
              create: true,
              update: true,
              read: true,
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

    sanitizePermissions({
      canAccessAdmin: true,
      collections: {
        test: permissions as CollectionPermission,
      },
    })
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

  it('should sanitize blocks with subfield named blocks', () => {
    const permissions: CollectionPermission = {
      fields: {
        content: {
          create: { permission: true },
          blocks: {
            test: {
              fields: {
                blocks: {
                  create: { permission: true },
                  fields: {
                    arrayText: {
                      create: { permission: true },
                      read: { permission: true },
                      update: { permission: true },
                    },
                    id: {
                      create: { permission: true },
                      read: { permission: true },
                      update: { permission: true },
                    },
                  },
                  read: { permission: true },
                  update: { permission: true },
                },
                id: {
                  create: { permission: true },
                  read: { permission: true },
                  update: { permission: true },
                },
                blockName: {
                  create: { permission: true },
                  read: { permission: true },
                  update: { permission: true },
                },
              },
              create: { permission: true },
              read: { permission: true },
              update: { permission: true },
            },
          },
          read: { permission: true },
          update: { permission: true },
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

    sanitizePermissions({
      canAccessAdmin: true,
      collections: {
        test: permissions,
      },
    })
    expect(permissions).toStrictEqual({
      fields: true,
      create: true,
      read: true,
      update: true,
      readVersions: true,
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

    sanitizePermissions({
      canAccessAdmin: true,
      collections: {
        test: permissions as CollectionPermission,
      },
    })
    expect(permissions).toStrictEqual({
      fields: true,
    })
  })

  it('ensure complex permissions are sanitized correctly', () => {
    // This tests a bug where the sanitizePermissions function would previously not correctly sanitize
    const permissions: Partial<CollectionPermission> = {
      fields: {
        GR: {
          create: {
            permission: false,
          },
          fields: {
            rt: {
              create: {
                permission: false,
              },
              read: {
                permission: true,
              },
              update: {
                permission: true,
              },
            },
            aaa: {
              create: {
                permission: false,
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
        tab1: {
          fields: {
            rt2: {
              create: {
                permission: false,
              },
              read: {
                permission: true,
              },
              update: {
                permission: true,
              },
            },
            blocks2: {
              create: {
                permission: false,
              },
              blocks: {
                myBlock: {
                  fields: {
                    art: {
                      create: {
                        permission: false,
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
                        permission: false,
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
                        permission: false,
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
                    permission: false,
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
          create: {
            permission: false,
          },
          read: {
            permission: true,
          },
          update: {
            permission: true,
          },
        },
        rt3: {
          create: {
            permission: false,
          },
          read: {
            permission: true,
          },
          update: {
            permission: true,
          },
        },
        blocks3: {
          create: {
            permission: false,
          },
          blocks: {
            myBlock: {
              fields: {
                art: {
                  create: {
                    permission: false,
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
                    permission: false,
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
                    permission: false,
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
                permission: false,
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
        array: {
          create: {
            permission: false,
          },
          fields: {
            art: {
              create: {
                permission: false,
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
                permission: false,
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
        arrayWithAccessFalse: {
          create: {
            permission: false,
          },
          fields: {
            art: {
              create: {
                permission: false,
              },
              read: {
                permission: true,
              },
              update: {
                permission: false,
              },
            },
            id: {
              create: {
                permission: false,
              },
              read: {
                permission: true,
              },
              update: {
                permission: false,
              },
            },
          },
          read: {
            permission: true,
          },
          update: {
            permission: false,
          },
        },
        blocks: {
          create: {
            permission: false,
          },
          blocks: {
            myBlock: {
              fields: {
                art: {
                  create: {
                    permission: false,
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
                    permission: false,
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
                    permission: false,
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
                permission: false,
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
        updatedAt: {
          create: {
            permission: false,
          },
          read: {
            permission: true,
          },
          update: {
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
            permission: true,
          },
        },
      },
      create: {
        permission: false,
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
    }

    sanitizePermissions({
      canAccessAdmin: true,
      collections: {
        test: permissions as CollectionPermission,
      },
    })
    expect(permissions).toStrictEqual({
      fields: {
        GR: {
          fields: {
            rt: {
              read: true,
              update: true,
            },
            aaa: {
              read: true,
              update: true,
            },
          },
          read: true,
          update: true,
        },
        tab1: {
          fields: {
            rt2: {
              read: true,
              update: true,
            },
            blocks2: {
              blocks: {
                myBlock: {
                  fields: {
                    art: {
                      read: true,
                      update: true,
                    },
                    id: {
                      read: true,
                      update: true,
                    },
                    blockName: {
                      read: true,
                      update: true,
                    },
                  },
                  read: true,
                  update: true,
                },
              },
              read: true,
              update: true,
            },
          },
          read: true,
          update: true,
        },
        rt3: {
          read: true,
          update: true,
        },
        blocks3: {
          blocks: {
            myBlock: {
              fields: {
                art: {
                  read: true,
                  update: true,
                },
                id: {
                  read: true,
                  update: true,
                },
                blockName: {
                  read: true,
                  update: true,
                },
              },
              read: true,
              update: true,
            },
          },
          read: true,
          update: true,
        },
        array: {
          fields: {
            art: {
              read: true,
              update: true,
            },
            id: {
              read: true,
              update: true,
            },
          },
          read: true,
          update: true,
        },
        arrayWithAccessFalse: {
          fields: {
            art: {
              read: true,
            },
            id: {
              read: true,
            },
          },
          read: true,
        },
        blocks: {
          blocks: {
            myBlock: {
              fields: {
                art: {
                  read: true,
                  update: true,
                },
                id: {
                  read: true,
                  update: true,
                },
                blockName: {
                  read: true,
                  update: true,
                },
              },
              read: true,
              update: true,
            },
          },
          read: true,
          update: true,
        },
        updatedAt: {
          read: true,
          update: true,
        },
        createdAt: {
          read: true,
          update: true,
        },
      },
      read: true,
      update: true,
      delete: true,
    })
  })

  it('ensure complex permissions are sanitized correctly 2', () => {
    // This tests a bug where the sanitizePermissions function would previously not correctly sanitize
    const permissions: Partial<CollectionPermission> = {
      fields: {
        GR: {
          create: {
            permission: true,
          },
          fields: {
            rt: {
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
            aaa: {
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
        tab1: {
          fields: {
            rt2: {
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
            blocks2: {
              create: {
                permission: true,
              },
              blocks: {
                myBlock: {
                  fields: {
                    art: {
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
        rt3: {
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
        arrayWithAccessFalse: {
          create: {
            permission: false,
          },
          fields: {
            art: {
              create: {
                permission: false,
              },
              read: {
                permission: true,
              },
              update: {
                permission: false,
              },
            },
            id: {
              create: {
                permission: false,
              },
              read: {
                permission: true,
              },
              update: {
                permission: false,
              },
            },
          },
          read: {
            permission: true,
          },
          update: {
            permission: false,
          },
        },
        blocks: {
          create: {
            permission: true,
          },
          blocks: {
            myBlock: {
              fields: {
                art: {
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
    }

    sanitizePermissions({
      canAccessAdmin: true,
      collections: {
        test: permissions as CollectionPermission,
      },
    })
    expect(permissions).toStrictEqual({
      fields: {
        GR: true,
        tab1: true,
        rt3: true,
        arrayWithAccessFalse: {
          fields: {
            art: {
              read: true,
            },
            id: {
              read: true,
            },
          },
          read: true,
        },
        blocks: true,
        updatedAt: true,
        createdAt: true,
      },
      create: true,
      read: true,
      update: true,
      delete: true,
    })
  })

  it('ensure complex permissions are sanitized correctly 3', () => {
    // This tests a bug where the sanitizePermissions function would previously not correctly sanitize
    const permissions: Partial<CollectionPermission> = {
      fields: {
        GR: {
          create: {
            permission: true,
          },
          fields: {
            rt: {
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
            aaa: {
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
        tab1: {
          fields: {
            rt2: {
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
            blocks2: {
              create: {
                permission: true,
              },
              blocks: {
                myBlock: {
                  fields: {
                    art: {
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
        rt3: {
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
        blocks: {
          create: {
            permission: true,
          },
          blocks: {
            myBlock: {
              fields: {
                art: {
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
    }

    sanitizePermissions({
      canAccessAdmin: true,
      collections: {
        test: permissions as CollectionPermission,
      },
    })
    expect(permissions).toStrictEqual({
      fields: true,
      create: true,
      read: true,
      update: true,
      delete: true,
    })
  })
})

describe('sanitizePermissions', () => {
  it('should return nothing for unauthenticated user', () => {
    const permissions: Permissions = {
      canAccessAdmin: false,
      collections: {
        preferencesCollectionSlug: {
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
