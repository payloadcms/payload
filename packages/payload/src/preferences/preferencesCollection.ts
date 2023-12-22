import type { CollectionConfig } from '../collections/config/types'
import type { Access, Config } from '../config/types'

import { deleteHandler } from './requestHandlers/delete'
import { findByIDHandler } from './requestHandlers/findOne'
import { updateHandler } from './requestHandlers/update'

const preferenceAccess: Access = ({ req }) => ({
  'user.value': {
    equals: req?.user?.id,
  },
})

const getPreferencesCollection = (config: Config): CollectionConfig => ({
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
      relationTo: config.collections
        .filter((collectionConfig) => collectionConfig.auth)
        .map((collectionConfig) => collectionConfig.slug),
      required: true,
      type: 'relationship',
    },
    {
      name: 'key',
      type: 'text',
    },
    {
      name: 'value',
      type: 'json',
    },
  ],
  slug: 'payload-preferences',
})

export default getPreferencesCollection
