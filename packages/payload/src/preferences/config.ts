// @ts-strict-ignore
import type { CollectionConfig } from '../collections/config/types.js'
import type { Access, Config } from '../config/types.js'

import { deleteHandler } from './requestHandlers/delete.js'
import { findByIDHandler } from './requestHandlers/findOne.js'
import { updateHandler } from './requestHandlers/update.js'

const preferenceAccess: Access = ({ req }) => {
  if (!req.user) {
    return false
  }

  return {
    'user.value': {
      equals: req?.user?.id,
    },
  }
}

export const preferencesCollectionSlug = 'payload-preferences'

export const getPreferencesCollection = (config: Config): CollectionConfig => ({
  slug: preferencesCollectionSlug,
  access: {
    delete: preferenceAccess,
    read: preferenceAccess,
  },
  admin: {
    hidden: true,
  },
  endpoints: [
    {
      handler: findByIDHandler,
      method: 'get',
      path: '/:key',
    },
    {
      handler: deleteHandler,
      method: 'delete',
      path: '/:key',
    },
    {
      handler: updateHandler,
      method: 'post',
      path: '/:key',
    },
  ],
  fields: [
    {
      name: 'user',
      type: 'relationship',
      hooks: {
        beforeValidate: [
          ({ req }) => {
            if (!req?.user) {
              return null
            }

            return {
              relationTo: req?.user.collection,
              value: req?.user.id,
            }
          },
        ],
      },
      index: true,
      relationTo: config.collections
        .filter((collectionConfig) => collectionConfig.auth)
        .map((collectionConfig) => collectionConfig.slug),
      required: true,
    },
    {
      name: 'key',
      type: 'text',
      index: true,
    },
    {
      name: 'value',
      type: 'json',
      validate: (value) => {
        if (value) {
          try {
            JSON.parse(JSON.stringify(value))
          } catch {
            return 'Invalid JSON'
          }
        }

        return true
      },
    },
  ],
  lockDocuments: false,
})
